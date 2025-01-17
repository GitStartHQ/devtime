import { logManager } from '../log-manager';
import { stateManager } from '../state-manager';
import * as activeWin from 'active-win';
import BackgroundUtils from '../background-utils';
import { backgroundService } from '../background-service';
import { TrackItemType } from '../enums/track-item-type';
import { taskAnalyser } from '../task-analyser';
import { TrackItem } from '../models/TrackItem';
import { dialog } from 'electron';
import { logService } from '../services/log-service';
import { blacklistService } from '../services/blacklist-service';

let logger = logManager.getLogger('AppTrackItemJob');

export class AppTrackItemJob {
    lastUpdatedItem: TrackItem;
    errorDialogIsOpen = false;

    async run() {
        if (this.errorDialogIsOpen) {
            logger.debug('Not running appTrackItemJob. Error dialog is open.');
            return;
        }

        try {
            if (this.checkIfIsInCorrectState()) {
                let activeWindow = await activeWin();
                let updatedItem: TrackItem = await this.saveActiveWindow(
                    activeWindow ? activeWindow : {},
                );

                if (!BackgroundUtils.isSameItems(updatedItem, this.lastUpdatedItem)) {
                    logger.debug('App and title changed. Analysing title');
                    taskAnalyser.analyseAndNotify(updatedItem).then(
                        () => logger.debug('Analysing has run.'),
                        (e) => logger.error('Error in Analysing', e),
                    );
                }

                this.lastUpdatedItem = updatedItem;
            } else {
                logger.debug('App not in correct state');
                return false;
            }

            return true;
        } catch (error) {
            const activeWinError = await this.checkIfPermissionError(error);

            if (activeWinError) {
                logger.debug('Permission error: ' + activeWinError);
            } else {
                logger.error('Error in AppTrackItemJob.');
                logger.error(error);
                logService
                    .createOrUpdateLog({
                        type: 'ERROR',
                        message: error.message,
                        jsonData: error.toString(),
                    })
                    .catch(console.error);
            }
        }
    }

    async checkIfPermissionError(e) {
        const activeWinError = e.stdout;

        if (activeWinError) {
            this.errorDialogIsOpen = true;
            await dialog.showMessageBox({
                message: activeWinError.replace('active-win', 'GitStart DevTime'),
            });

            this.errorDialogIsOpen = false;
            return activeWinError;
        }
        return;
    }

    checkIfIsInCorrectState() {
        if (stateManager.isSystemSleeping()) {
            stateManager.resetAppTrackItem();
            logger.debug('System is sleeping.');
            return false;
        }

        if (stateManager.isSystemIdling()) {
            stateManager.resetAppTrackItem();
            logger.debug('App is idling.');
            return false;
        }
        return true;
    }

    async saveActiveWindow(result): Promise<TrackItem> {
        let rawItem: Partial<TrackItem> = { taskName: TrackItemType.AppTrackItem };

        rawItem.beginDate = BackgroundUtils.currentTimeMinusJobInterval();
        rawItem.endDate = new Date();

        // logger.debug('rawitem has no app', result);
        if (result.owner && result.owner.name && !['explorer.exe'].includes(result.owner.name)) {
            rawItem.app = result.owner.name;
        } else {
            rawItem.app = 'NATIVE';
        }

        if (!result.title) {
            // logger.error('rawitem has no title', result);
            rawItem.title = null;
        } else {
            rawItem.title = result.title.replace(/\n$/, '').replace(/^\s/, '');
        }

        rawItem.url = result.url;

        // logger.debug('Active window (parsed):', rawItem);

        const isInBlacklist = await blacklistService.isInBlacklist({
            app: rawItem.app,
            title: rawItem.title,
            url: rawItem.url,
        });

        let savedItem = null;
        if (!isInBlacklist) {
            savedItem = await backgroundService.createOrUpdate(rawItem);
        }

        return savedItem;
    }
}

export const appTrackItemJob = new AppTrackItemJob();
