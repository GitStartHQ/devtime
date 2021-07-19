import { logManager } from '../log-manager';
import { Log } from '../models/Log';

export class LogService {
  logger = logManager.getLogger('LogService');
  lastLog: null | Log = null;

  async createOrUpdateLog(logAttributes: Partial<Log>): Promise<Log> {
    let log: Log = null;
    // Skip known/unfixable errors
    if (logAttributes.message.includes("'endDate' of null")) {
      return log;
    }
    if (logAttributes.message.includes('getaddrinfo ENOTFOUND hasura.gitstart.com')) {
      logAttributes.message =
        'GitStart DevTime was disconnected. Please make sure you are connected to the internet.';
    }
    if (
      this.lastLog &&
      logAttributes.type === this.lastLog.type &&
      logAttributes.message === this.lastLog.message &&
      logAttributes.jsonData === this.lastLog.jsonData
    ) {
      const now = new Date();
      await Log.query().findById(this.lastLog.id).patch({
        updatedAt: now,
      });
      log = this.lastLog;
      log.updatedAt = now;
    } else {
      logAttributes.createdAt = new Date();
      logAttributes.updatedAt = new Date();
      log = await Log.query().insert(logAttributes);
    }
    this.lastLog = log;
    return log;
  }

  async findAllLogs(from: Date, to?: Date) {
    if (!to) {
      to = new Date();
    }
    return Log.query()
      .where('updatedAt', '>=', from)
      .where('updatedAt', '<=', to)
      .skipUndefined()
      .orderBy('updatedAt', 'DESC');
  }
}

export const logService = new LogService();
