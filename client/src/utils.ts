import moment from 'moment';
import { convertDate } from './constants';
import LogDNA from 'logdna';

export const diffAndFormatShort = (beginDate, endDate) => {
    const diff = convertDate(endDate).diff(convertDate(beginDate));
    const dur = moment.duration(diff);
    const formattedDuration = dur.format();
    return formattedDuration;
};


type LogDNAAppName = 
  | 'devtime-client'
  | 'devtime-electron';

export const getLogDNAClient = (appName: LogDNAAppName) => {
    // const LOGDNA_API_KEY = getEnv('LOGDNA_API_KEY');
    const LOGDNA_API_KEY = '33a02f1c20e286ca56534b48f0870447';
    const api_key = LOGDNA_API_KEY;
  
    if (!api_key) {
      console.log('LOGDNA_API_KEY key not found');
      return;
    }

    const isProd = process.env.NODE_ENV === 'production';
  
    const options = {
      app: isProd ? `${appName}-prd-container` : `${appName}-stg-container`,
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
      logger.log([arguments].join(' '));
      // eslint-disable-next-line prefer-rest-params
      _log.apply(console, [arguments]);
    };
  
    const error = function () {
      // eslint-disable-next-line prefer-rest-params
      logger.error([arguments].join(' '));
      // eslint-disable-next-line prefer-rest-params
      _error.apply(console, [arguments]);
    };
  
    console.log = log;
    console.error = error;
    logger.log('hello world-- LogDNA Enabled');
  
    console.log('LogDNA Enabled');
  };