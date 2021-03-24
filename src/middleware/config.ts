// @ts-nocheck
import fs from 'fs';
import yaml from 'js-yaml';
import { Middleware, AnyMiddlewareArgs } from '@slack/bolt';
import { getWeek, getDayOfYear } from 'date-fns';

const configFileName = process.env.SLACK_BOT_CONFIG as string;

type OnCallConfig = (string | {
    schedule: string
    override: string
    members: Array<string>
});

type GithubConfig = {
    issues: {
        labels: Array<string>
        access: Array<string>
    }
};

export type Config = {
    supportChannelId: string
    onCall: OnCallConfig
    github: GithubConfig
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
 * Decide which pivot function to use for scheduling on-call duty
 * @param schedule Schedule type identifier. Either "daily" or "weekly"
 * @returns Schedule pivot function
 */
const onCallPivot = (schedule: string): (function | void) => {
    if (schedule === 'daily') { return getDayOfYear; }
    if (schedule === 'weekly') { return getWeek; }
};

/**
 * Resolve which member is on call duty right now
 * @param onCallConfig On-call section of the configuration file
 * @returns Member from the config currently on duty
 */
const getOnCallUser = (onCallConfig: OnCallConfig): (string | void) => {
    if (typeof onCallConfig === 'string') { return onCallConfig; }
    if (onCallConfig.override) { return onCallConfig.override; }

    const pivot = onCallPivot(onCallConfig.schedule);

    if (!pivot) {
        console.error("Invalid schedule type for onCall schedule. Must be 'daily' or 'weekly'");
        return;
    }

    return onCallConfig.members[pivot(new Date()) % onCallConfig.members.length];
};

/**
 * Middleware used to fetch the config file content and make it available to message handlers.
 * @param param0 Arguments passed to Slack middleware
 */
export const configMiddleware: Middleware<AnyMiddlewareArgs> = async ({ context, next, client }) => {
    context.config = config;

    // Translate onCall email into a user ID
    const onCallUser = getOnCallUser(context.config.onCall);
    if (onCallUser) {
        const user = await client.users.lookupByEmail({ 'email': onCallUser });
        if (user.ok) {
            context.onCallUser = user.user.id;
        }
    }

    if (next) { await next(); }
};

