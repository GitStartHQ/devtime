import moment from 'moment';
import { convertDate } from './constants';

export const diffAndFormatShort = (beginDate, endDate) => {
    const diff = convertDate(endDate).diff(convertDate(beginDate));
    const dur = moment.duration(diff);
    const formattedDuration = dur.format();
    return formattedDuration;
};

export const getLogDNAClient = (appName: LogDNAAppName) => {
    const LOGDNA_API_KEY = getEnv('LOGDNA_API_KEY');
    const api_key = LOGDNA_API_KEY;
  
    if (!api_key) {
      console.log('LOGDNA_API_KEY key not found');
      return;
    }
  
    const options = {
      app: isProd() ? `${appName}-prd-container` : `${appName}-stg-container`,
      env: 'local',
      tags: ['info', 'error', 'warning'],
    };
  
    return LogDNA.createLogger(api_key, options);
  };
  
  export const bindLogDNAWithConsole = (appName: LogDNAAppName) => {
    console.log(`Initializing LogDNA for ${appName}`);
    const logger = getLogDNAClient(appName);
  
    if (!logger) {
      console.log('Disabling LogDNA');
      return;
    }
  
    const _log = console.log;
    const _error = console.error;
  
    const log = function () {
      // eslint-disable-next-line prefer-rest-params
      logger.log([...arguments].join(' '));
      // eslint-disable-next-line prefer-rest-params
      _log.apply(console, [...arguments]);
    };
  
    const error = function () {
      // eslint-disable-next-line prefer-rest-params
      logger.error([...arguments].join(' '));
      // eslint-disable-next-line prefer-rest-params
      _error.apply(console, [...arguments]);
    };
  
    console.log = log;
    console.error = error;
  
    console.log('LogDNA Enabled');
  };