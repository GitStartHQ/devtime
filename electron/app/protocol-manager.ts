// protocol.utils.ts
import { app, ipcMain, powerMonitor } from 'electron';
import { settingsService } from './services/settings-service';
import { appConstants } from './app-constants';
import WindowManager, { windowManager } from './window-manager';
import { link } from 'fs';
// const { Deeplink } = requDeeplinkire('electron-deeplink');

// const deeplink = new Deeplink({ app })

// main.js
// const { BrowserWindow } = require('electron');
// const { Deeplink } = require('electron-deeplink');
// const isDev = require('electron-is-dev');

// let mainWindow;
// const protocol = isDev ? 'dev-app' : 'prod-app';
// const deeplink = new Deeplink({ app, mainWindow, protocol, isDev });

function isNil(value) {
    return value == null
  }

export abstract class ProtocolUtils {
    public static setDefaultProtocolClient(): void {
        if (!app.isDefaultProtocolClient(appConstants.PROTOCOL_NAME)) {
            // Define custom protocol handler.
            // Deep linking works on packaged versions of the application!
            app.setAsDefaultProtocolClient(appConstants.PROTOCOL_NAME);
        }
    }

    /**
     * @description Create logic (WIN32 and Linux) for open url from protocol
     */
    public static setProtocolHandlerWindowsLinux(deeplinkCallback: (rawUrl: string) => void): void {
        // Force Single Instance Application
        const gotTheLock = app.requestSingleInstanceLock();

        // app.on('second-instance', (e: Electron.Event, argv: string[]) => {
        //     // Someone tried to run a second instance, we should focus our window.
        //     console.log('in second-instance!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        //     if (WindowManager.mainWindow) {
        //         if (WindowManager.mainWindow.isMinimized()) WindowManager.mainWindow.restore();
        //         WindowManager.mainWindow.focus();
        //     } else {
        //         // Open main windows
        //         WindowManager.openMainWindow();
        //     }

        //     app.whenReady().then(() => {
        //         WindowManager.mainWindow.loadURL(this._getDeepLinkUrl(argv));
        //     });
        // });

        // app.whenReady().then(() => {
        //     // open main windows
        //     WindowManager.openMainWindow();
        //     WindowManager.mainWindow.loadURL(this._getDeepLinkUrl());
        // })

        app.on('second-instance', (e: Electron.Event, argv: string[]) => {
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
            app.whenReady().then(() => {
                const rawUrl = this._getDeepLinkUrl();
                deeplinkCallback(rawUrl);
            });
            WindowManager.openMainWindow();
        });

    }

    /**
     * @description Create logic (OSX) for open url from protocol
     */
    public static setProtocolHandlerOSX(deeplinkCallback: (rawUrl: string) => void): void {
        app.on('open-url', (_, rawUrl) => {
            deeplinkCallback(rawUrl);
        });
    }

    /**
     * @description Format url to load in mainWindow
     */
    private static _getUrlToLoad(url: string): string {
        // Ex: url = myapp://deep-link/test?params1=paramValue
        // Ex: Split for remove myapp:// and get deep-link/test?params1=paramValue
        const splittedUrl = url.split('//');
        // Generate URL to load in WebApp.
        // Ex: file://path/index.html#deep-link/test?params1=paramValue
        const urlToLoad = require('url').format({
            // pathname: Env.BUILDED_APP_INDEX_PATH,
            pathname: process.execPath,
            protocol: 'file:',
            slashes: true,
            hash: `#${splittedUrl[1]}`,
        });

        return urlToLoad;
    }

    /**
    * @description Resolve deep link url for Win32 or Linux from process argv
    * @param argv: An array of the second instance’s (command line / deep linked) arguments
    */
    private static _getDeepLinkUrl(argv?: string[]): string {
        console.log('getDeepLink-----------------------');
        let url: string;
        const newArgv: string[] = !isNil(argv) ? argv : process.argv;
        // Protocol handler
        if (process.platform === 'win32' || process.platform === 'linux') {
            // Get url form precess.argv
            newArgv.forEach((arg) => {
                console.log('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
                console.log(arg);
                console.log('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
                // url = arg;
                if (/x-gitstart-devtime:\/\//.test(arg)) {
                    url = arg;
                    console.log('x-gitstart-devtime:///.testtttttttttttttt');
                }
            });
            console.log('_getDeepLinkUrl');
            console.log(url);

            if (!isNil(url)) {
                return this._getUrlToLoad(url);
            } else if (!isNil(argv) && isNil(url)) {
                // this._logInMainWindow({ s: 'URL is undefined', isError: true });
                throw new Error('URL is undefined');
            }
        }
    }
}
