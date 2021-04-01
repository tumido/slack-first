// @ts-nocheck
import { Middleware, AnyMiddlewareArgs } from '@slack/bolt';
import { getWeek, getDayOfYear } from 'date-fns';
import watch from 'node-watch';

import { loadYaml } from '../helpers/fs';

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

let config = loadYaml(configFileName);

/**
 * Config middleware initializer
 * 
 * Starts the file watch for config changes or file changes using fs.watch. This uses Inotify, therefore it has to be requeued if the file is moved
 */
export const initConfigMiddleware = (): void => {
    const watcher = watch(configFileName);
    watcher.on('change', () => {
        console.log(`${configFileName}: changed. Reloading`);
        config = loadYaml(configFileName);
    });
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

