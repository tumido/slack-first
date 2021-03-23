// @ts-nocheck
import fs from 'fs';
import yaml from 'js-yaml';
import { Middleware, AnyMiddlewareArgs } from '@slack/bolt';

const configFileName = process.env.SLACK_BOT_CONFIG as string;

type Config = {
    supportChannelId: string
    onCall: string
    issueLabels: Array<string>
};

/**
 * Load and parse YAML content of the config file
 * @returns Content of the config file
 */
const loadConfig = (): Config => {
    return yaml.load(fs.readFileSync(configFileName).toString()) || {};
};

let currentWatcher;
let config;

/**
 * Config middleware initializer
 * 
 * Starts the file watch for config changes or file changes using fs.watch. This uses Inotify, therefore it has to be requeued if the file is moved
 * @param debounceTime fs.watch can trigger multiple events for a single change. Debounce reduces the noise.
 */
export const initConfigMiddleware = (debounceTimeout = 100): void => {
    let debounce = false;
    const watchConfigFile = () => {
        return fs.watch(configFileName, (event, filename) => {
            if (!filename) {
                console.log(`${filename}: watch was lost.`);
                return;
            }
            if (event === 'rename') {
                // File was moved or replaced. Watch has to be restarted to watch on the intended path
                console.log(`${filename}: watch has expired. Requeueing.`);
                currentWatcher.close();
                currentWatcher = watchConfigFile();
                return;
            }
            if (debounce) { return; }
            debounce = true;
            setTimeout(() => { debounce = false; }, debounceTimeout);

            console.log(`${filename}: changed. Reloading`);
            config = loadConfig();
        });
    };
    currentWatcher = watchConfigFile();
    config = loadConfig();
};

/**
 * Middleware used to fetch the config file content and make it available to message handlers.
 * @param param0 Arguments passed to Slack middleware
 */
export const configMiddleware: Middleware<AnyMiddlewareArgs> = async ({ context, next, client }) => {
    context.config = config;

    // Translate onCall email into a user ID
    const user = await client.users.lookupByEmail({ 'email': context.config.onCall });
    if (user.ok) {
        context.onCallUser = user.user.id;
    }

    if (next) { await next(); }
};

