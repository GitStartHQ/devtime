// protocol.utils.ts
import { app, ipcMain, powerMonitor } from 'electron';
import { settingsService } from './services/settings-service';
import { appConstants } from './app-constants';
import WindowManager from './window-manager';
// const { Deeplink } = requDeeplinkire('electron-deeplink');

// const deeplink = new Deeplink({ app })

function isNil(value) {
    return value == null
  }

export abstract class ProtocolUtils {
    // public static setDefaultProtocolClient(): void {
    //     if (!app.isDefaultProtocolClient(appConstants.PROTOCOL_NAME)) {
    //         // Define custom protocol handler.
    //         // Deep linking works on packaged versions of the application!
    //         app.setAsDefaultProtocolClient(appConstants.PROTOCOL_NAME);
    //     }
    // }

    /**
     * @description Create logic (WIN32 and Linux) for open url from protocol
     */
    public static setProtocolHandlerWindowsLinux(deeplinkCallback: (rawUrl: string) => void): void {
        // Force Single Instance Application
        // const gotTheLock = app.requestSingleInstanceLock();

        // app.on('second-instance', (e: Electron.Event, argv: string[]) => {
        //     // Someone tried to run a second instance, we should focus our window.
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

        // if (gotTheLock) {
        //     app.whenReady().then(() => {
        //         // Open main windows
        //         WindowManager.openMainWindow();
        //         WindowManager.mainWindow.loadURL(this._getDeepLinkUrl());
        //     });
        // } else {
        //     app.quit();
        // }
        app.whenReady().then(() => {
            // Open main windows
            console.log('whenReady');
            WindowManager.openMainWindow();
            WindowManager.mainWindow.loadURL(this._getDeepLinkUrl());
        });
    }

    /**
     * @description Create logic (OSX) for open url from protocol
     */
    public static setProtocolHandlerOSX(): void {
        // app.on('open-url', (event: Electron.Event, url: string) => {
        //     event.preventDefault();
        //     app.whenReady().then(() => {
        //         if (!isNil(url)) {
        //             // Open main windows
        //             MainWindow.openMainWindow();
        //             MainWindow.mainWindow.loadURL(this._getUrlToLoad(url));
        //         } else {
        //             this._logInMainWindow({ s: 'URL is undefined', isError: true });
        //             throw new Error('URL is undefined');
        //         }
        //     });
        // });
        app.on('open-url', (_, rawUrl) => {
            console.log("on.('open-url'):", rawUrl);
            const url = new URL(rawUrl);
    
            if (url.searchParams.has('token')) {
                settingsService.updateLoginSettings({ token: url.searchParams.get('token') });
            }
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
        let url: string;
        const newArgv: string[] = !isNil(argv) ? argv : process.argv;
        // Protocol handler
        if (process.platform === 'win32' || process.platform === 'linux') {
            // Get url form precess.argv
            newArgv.forEach((arg) => {
                if (/x-gitstart-devtime:\/\//.test(arg)) {
                    url = arg;
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
