import { Model } from 'objection';
import { TrackItemType } from '../enums/track-item-type';
import { settingsService } from '../services/settings-service';

export class TrackItem extends Model {
    static tableName = 'TrackItems';

    // from Tockler
    id!: number;
    app!: string;
    taskName!: TrackItemType;
    title!: string;
    url!: string;
    color!: string;
    beginDate!: Date;
    endDate!: Date;

    // from GitStart
    createdAt!: Date;
    updatedAt!: Date;
    userEventId?: string;
    isSummarized?: boolean;
    entityId?: number;
    entityType?: string;
    projectId?: number;
    clientId?:string;

    async $beforeInsert(context) {
        const entitySetting = await settingsService.fetchEntitySettings();

        this.entityId = entitySetting?.entityId;
        this.entityType = entitySetting?.entityType;
        this.projectId = entitySetting?.projectId;
        this.clientId = entitySetting?.clientId;
    }
}
