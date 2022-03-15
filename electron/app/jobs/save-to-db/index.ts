import moment = require('moment');
import { Model } from 'objection';
import { appConstants } from '../../app-constants';
import { fetchGraphQLClient, getUserFromToken } from '../../graphql';
import { TrackItem } from '../../models/TrackItem';
import { logService } from '../../services/log-service';
import { settingsService } from '../../services/settings-service';
import { trackItemService } from '../../services/track-item-service';
import { hasura_uuid, user_events_insert_input } from './types';

export class SaveToDbJob {
    private token: string | null = null;
    private lastSavedUserEventsAt: Date = moment().subtract(1, 'day').toDate();

    async run() {
        try {
            // if there is no cached token, check if sqlite Settings table has it.
            if (!this.token) {
                const loginSettings = await settingsService.getLoginSettings();
                if (loginSettings?.token) {
                    this.token = loginSettings.token;
                }
            }

            await this.saveUserEvents();
        } catch (e) {
            logErrors(e);
        }
    }


    private createEventFromTrackItem(item: TrackItem, userId) {
        const durationInSeconds = moment(item.endDate).diff(moment(item.beginDate), 'second');

          const event = {
            occurredAt: moment(item.beginDate).format(),
            updatedAt: new Date().toJSON(),
            eventType: item.url ? 'browse_url' : 'app_use',
            userId,
            appName: item.app,
            title: item.title,
            browserUrl: item.url,
            taskId: item.entityType === 'task' ? item.entityId : undefined,
            ticketId: item.entityType === 'ticket' ? item.entityId : undefined,
            clientProjectId: item.projectId,
            clientId: item.clientId,
            duration: durationInSeconds,
            isProcessed: false,
            pollInterval: appConstants.TIME_TRACKING_JOB_INTERVAL / 1000, // ms to sec
          };

        return event;
    }

    private createEventsFromTrackItems(items: TrackItem[], userId: number) {
        const events = items.map((item) => this.createEventFromTrackItem(item, userId));

        return events;

    }

    private async saveUserEvents() {
        try {
            // save individual userEvents
            const items: TrackItem[] = await Model.knex().raw(
                `SELECT DISTINCT
                    TrackItems.*
                FROM TrackItems
                LEFT JOIN Whitelist
                ON (
                    (
                        Whitelist.app IS NULL
                        OR Whitelist.app = ''
                        OR TrackItems.app LIKE '%' || Whitelist.app || '%'
                    ) 
                    AND (
                        Whitelist.title IS NULL
                        OR Whitelist.title = ''
                        OR TrackItems.title LIKE '%' || Whitelist.title || '%'
                    ) 
                    AND (
                        Whitelist.url IS NULL
                        OR Whitelist.url = ''
                        OR TrackItems.url LIKE '%' || Whitelist.url || '%'
                    )
                )
                WHERE
                    "taskName" = 'AppTrackItem'
                    AND Whitelist.id IS NOT NULL
                    AND (
                        "userEventId" IS NULL
                        OR TrackItems."updatedAt" >= ?
                    )
                LIMIT 100
                `,
                [this.lastSavedUserEventsAt],
            );
            // FIXME: figure out how to do it with proper Knex `where` methods instead of `whereRaw` as it might be more "safe"
            // .where('taskName', 'AppTrackItem')
            // .whereNull('userEventId')
            // .orWhere('updatedAt', '>=', this.lastSavedAt);

            console.log(items.length, `TrackItems need to be upserted to GitStart's DB`);

            if (!this.token) return;

            const user = getUserFromToken(this.token);

            if (!user) {
                // TODO: use refreshToken to get new token instead of setting token to null
                this.token = null;
                await settingsService.updateLoginSettings({ token: null });
                throw new Error('Token Expired!');
            }

            const events = this.createEventsFromTrackItems(items, user.id)

            const returned = await sendTrackItemsToDB(
                events,
                user.id,
                process.env.HASURA_GRAPHQL_ENGINE_DOMAIN,
                this.token,
            );

            await Promise.all(
                returned.data.insert_user_events.returning.map((userEvent, i) => {
                    console.log({ userEventId: userEvent.id }, items[i].app, items[i].title);
                    return trackItemService.updateTrackItem(
                        { userEventId: userEvent.id },
                        items[i].id,
                    );
                }),
            );
            console.log('Successfully saved', items.length, `TrackItems to GitStart's DB`);
        } catch (e) {
            logErrors(e);
        }
    }
}

function logErrors(e: any) {
    console.error(e);
    logService
        .createOrUpdateLog({
            type: 'ERROR',
            message: e.message,
            jsonData: JSON.stringify(e),
        })
        .catch(console.error);
}

async function sendTrackItemsToDB(
    events: any[],
    userId: number,
    domain: string,
    token: string,
    secret?: string,
) {
    // HACK: temporary hack to upsert to hasura. Code can be much cleaner by turning this into a class.
    const returned = await fetchGraphQLClient(domain, {
        token,
        secret,
    })<
        {
            insert_user_events: {
                affected_rows: number;
                returning: { id: hasura_uuid }[];
            } | null;
        },
        { userEvents: Array<user_events_insert_input> }
    >({
        operationAction: `
            mutation upsertUserEvents($userEvents: [user_events_insert_input!]!) {
                insert_user_events(objects: $userEvents, on_conflict: {
                    constraint: PK_22f49067e87f2c8a3fff76543d1,
                    update_columns: [
                        appName,
                        browserUrl,
                        duration,
                        pollInterval,
                        updatedAt
                    ]
                }) {
                    affected_rows
                    returning {
                        id
                    }
                }
            }
        `,
        variables: {
            userEvents: events,
        },
    });
    return returned;
}

type ChunkEventsOptions = {
    /**
     * Default: 300 seconds (5 minutes)
     */
    chunkEvery?: number;
    /**
     * Determines whether the passed in `events` array don't need to be sorted in chronological order before summarizing.
     * Make this `true` if you already know the events are sorted.
     *
     * Default: false
     */
    disableSorting?: boolean;
};

const chunkEvents = (events: TrackItem[], options?: ChunkEventsOptions) => {
    const { chunkEvery = 300, disableSorting = false } = options;

    if (!disableSorting) {
        events = events.sort((a, b) => {
            if (a.beginDate < b.beginDate) {
                return -1;
            }
            if (a.beginDate > b.beginDate) {
                return 1;
            }
            return 0;
        });
    }

    const chunkMap = new Map<Date, TrackItem[]>();
    let prevBeginDate: Date = null;
    for (const event of events) {
        if (!prevBeginDate) prevBeginDate = event.beginDate;

        const chunk = chunkMap.get(prevBeginDate);

        if (moment(event.endDate).diff(prevBeginDate, 'seconds') <= chunkEvery) {
            if (chunk) {
                chunk.push(event);
            } else {
                chunkMap.set(prevBeginDate, [event]);
            }
        } else {
            prevBeginDate = event.beginDate;
            chunkMap.set(prevBeginDate, [event]);
        }
    }

    return Array.from(chunkMap, ([_, events]) => events);
};

type SummarizeEventsOptions = {
    /**
     * Determines minimum ratio of time of the summarized event to the total amount of time in the `events` array.
     * Anything below that threshold is filtered out of the resulting array.
     * If resulting array is empty (because the threshold is too high), then the resulting array will default to containing the longest event.
     *
     * Default: 0.3
     */
    threshold?: number;
};

type SummarizedEvent = Partial<TrackItem> & {
    duration: number;
};

/**
 * This function summarizes events by tallying events that have the same app and title together, and filtering out any summarizedEvent that is below the threshold (default: 0.3).
 *
 * Make sure the events don't span a whole day as you that would summarize into one singl. To make sure of that use, use chunkEvents() first, which will chunk events every 5 minutes by default.
 */
const summarizeEvents = (events: TrackItem[], options?: SummarizeEventsOptions) => {
    const { threshold = 0.3 } = options;

    let totalTime = 0;
    const summaryMap = new Map<string, SummarizedEvent>();
    for (const event of events) {
        const key = `${event.app} ${event.title}`;
        const currDuration = moment(event.endDate).diff(event.beginDate, 'seconds');
        const summarized = summaryMap.get(key);

        if (summarized) {
            summaryMap.set(key, {
                ...event,
                beginDate: summarized.beginDate,
                endDate: event.endDate,
                duration: summarized.duration + currDuration,
            });
        } else {
            summaryMap.set(key, {
                ...event,
                duration: currDuration,
            });
        }

        totalTime += currDuration;
    }

    const summarizedEvents = new Array<SummarizedEvent>();
    let longestEvent: SummarizedEvent = null;
    for (const summaryEvent of summaryMap.values()) {
        if (summaryEvent.duration / totalTime > threshold) {
            summarizedEvents.push(summaryEvent);
        }
        if (summaryEvent.duration > (longestEvent?.duration ?? 0)) {
            longestEvent = summaryEvent;
        }
    }

    // if threshold is set too high that there are no summarizedEvents, default to giving returning the longestEvent
    if (summarizedEvents.length === 0 && longestEvent) {
        return [longestEvent];
    }

    return summarizedEvents;
};

type PossibleEntities = {
    tasks: {
        id: number;
        ticketCode: string;
        taskCode: string;
        ticket: {
            id: number;
        } | null;
    }[];
    tickets: {
        id: number;
        code: string;
    }[];
    projects: {
        id: number;
        name: string;
    }[];
    clients: {
        id: string;
        name: string;
    }[];
};

type EntityType = 'client' | 'client_project' | 'learning' | 'other' | 'task' | 'ticket';

const mapKeywordsToEntity = (possibleEntities: PossibleEntities, keywords: string[]) => {
    let type: EntityType = 'other';
    const includes = (pattern: string) => {
        return new RegExp(pattern, 'gi').test(keywords.join(' ').replace('[Branch:', '')); // removing "[Branch:" from the keywords as that comes from the "Branch In Window Title" VS Code extension and one of the clients is named "Branch"
    };
    // task and ticket are compared separately as the user might have different access on the tasks table than on the tickets table.
    for (const task of possibleEntities.tasks) {
        if (includes(task.ticketCode) && includes(task.taskCode)) {
            type = 'task';
            return { type, ...task };
        } else if (includes(task.ticketCode) && task.ticket?.id) {
            // It is possible for a user to have access to more tasks than tickets, so we can check tickets within the tasks array.
            type = 'ticket';
            return { type, id: task.ticket.id, code: task.ticketCode };
        }
    }
    for (const ticket of possibleEntities.tickets) {
        if (includes(ticket.code)) {
            type = 'ticket';
            return { type, ...ticket };
        }
    }
    for (const project of possibleEntities.projects) {
        if (includes(project.name)) {
            type = 'client_project';
            return { type, ...project };
        }
    }
    for (const client of possibleEntities.clients) {
        if (includes(client.name) || includes(client.id)) {
            type = 'client';
            return { type, ...client };
        }
    }
    if (
        includes('tutorial') ||
        includes('step') ||
        includes('guide') ||
        includes('manual') ||
        includes('doc') ||
        includes('example') ||
        includes('intro') ||
        includes('get started')
    ) {
        type = 'learning';
        return { type };
    }

    return { type };
};

/** Map of entity types to priority number */
const entityPriority: {
    [entityType in EntityType]: number;
} = {
    task: 1,
    ticket: 2,
    client_project: 3,
    client: 4,
    learning: 5,
    other: 6,
};

type SummaryItem = ReturnType<typeof mapKeywordsToEntity> & {
    startAt: Date;
    endAt: Date;
    duration: number;
};

export const saveToDbJob = new SaveToDbJob();
