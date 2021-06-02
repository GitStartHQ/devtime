import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { Text } from '@chakra-ui/layout';
import { Switch } from '@chakra-ui/switch';
import React from 'react';
import {
    getOpenAtLogin,
    getIsAutoUpdateEnabled,
    saveOpenAtLogin,
    saveIsAutoUpdateEnabled,
    getIsLoggingEnabled,
    saveIsLoggingEnabled,
} from '../../services/settings.api';
import { Card } from '../Card';

export const AppForm = () => {
    const openAtLogin = getOpenAtLogin();
    const isAutoUpdateEnabled = getIsAutoUpdateEnabled();
    const isLoggingEnabled = getIsLoggingEnabled();
    const onChangeOpenAtLogin = event => {
        saveOpenAtLogin(event.target.value);
    };

    const onChangeAutoUpdate = event => {
        saveIsAutoUpdateEnabled(event.target.value);
    };
    const onChangeLogging = event => {
        saveIsLoggingEnabled(event.target.value);
    };

    const appName = process.env.REACT_APP_NAME;
    const platform = (window as any).platform;

    const linuxPath = `~/.config/${appName}/logs/main.log`;
    const macOSPath = `~/Library/Logs/${appName}/main.log`;
    const windowsPath = `%USERPROFILE%\\AppData\\Roaming\${appName}\\logs\\main.log`;

    let logPath = linuxPath;
    if (platform === 'win32') {
        logPath = windowsPath;
    } else if (platform === 'darwin') {
        logPath = macOSPath;
    }

    return (
        <Card title="App settings">
            <FormControl display="flex" alignItems="center" py={2}>
                <FormLabel htmlFor="run-login" mb="0" flex="1">
                    Run at login?
                </FormLabel>
                <Switch
                    id="run-login"
                    defaultChecked={openAtLogin}
                    onChange={onChangeOpenAtLogin}
                />
            </FormControl>
            <FormControl display="flex" alignItems="center" py={2}>
                <FormLabel htmlFor="auto-update" mb="0" flex="1">
                    Auto update?
                </FormLabel>
                <Switch
                    id="auto-update"
                    defaultChecked={isAutoUpdateEnabled}
                    onChange={onChangeAutoUpdate}
                />
            </FormControl>
            <FormControl display="flex" alignItems="center" py={2}>
                <FormLabel htmlFor="enable-logging" mb="0" flex="1">
                    Enable logging? (Applies after restart)
                </FormLabel>
                <Switch
                    id="enable-logging"
                    defaultChecked={isLoggingEnabled}
                    onChange={onChangeLogging}
                />
            </FormControl>
            <Text fontSize="xs" color="gray.500">
                Log path: {logPath}
            </Text>
        </Card>
    );
};
