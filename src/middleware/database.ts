import watch from 'node-watch';
import { loadYaml, writeYaml } from '../helpers/fs';
import { Installation } from '@slack/oauth';

const secretStateFileName = process.env.SLACK_BOT_SECRET_STATE as string;

type BotState = {
    [key: string]: Installation
};

let botState = (loadYaml(secretStateFileName) as BotState);

/**
 * Database middleware initializer
 *
 * Starts the file watch for "db" file changes or file changes using node-watch.
 */
export const initDbMiddleware = (): void => {
    const watcher = watch(secretStateFileName);
    watcher.on('change', () => {
        console.log(`${secretStateFileName}: changed. Reloading`);
        botState = (loadYaml(secretStateFileName) as BotState);
    });
};

/**
 * Store installation in the store
 * @param key Specify the installation identifier (workspace name)
 * @param value Installation object as a value for the key above
 */
export const setKey = (key: string, value: Installation): void => {
    botState[key] = value;
    writeYaml(secretStateFileName, botState);
};

/**
 * Retrieve installation from store
 * @param key Workspace ID retrieve fro the store
 * @returns Corresponding installation object
 */
export const getKey = (key: string): Installation => {
    return botState[key];
};
