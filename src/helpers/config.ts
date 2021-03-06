import { getWeek, getDayOfYear } from 'date-fns';
import watch from 'node-watch';

import { loadYaml } from './fs';

const configFileName = process.env.SLACK_BOT_CONFIG as string;
const onCallMembersFileName = process.env.ON_CALL_MEMBERS_CONFIG as string;

type OnCallMember = {
    slack: string;
    github: string;
};

type OnCallConfig = {
    schedule?: string;
    override?: OnCallMember;
    members: Array<OnCallMember>;
};

type GithubConfig = {
    issues: {
        labels?: Array<string>;
        access?: Array<string>;
    };
};

type FaqConfig = {
    name: string;
    regexp: string | RegExp;
    url: string;
};

export type Config = {
    supportChannelId: string;
    onCall: OnCallConfig;
    github?: GithubConfig;
    faqs?: Array<FaqConfig>;
};

let config: Config;

const initConfig = (): void => {
    config = loadYaml(configFileName) as Config;
    if (onCallMembersFileName) {
        if (config.onCall.members) {
            console.error('Illegal onCall config');
            process.exit(1);
        }
        const onCallMembersConfig = loadYaml(
            onCallMembersFileName
        ) as Array<OnCallMember>;
        config.onCall.members = onCallMembersConfig;
    }

    if (config.faqs) {
        config.faqs = config.faqs.map((m) => {
            const parsed = (m.regexp as string).match(/(\/?)(.+)\1([a-z]*)/i);
            if (!parsed) {
                return m;
            }
            if (
                parsed[3] &&
                !/^(?!.*?(.).*?\1)[gmixXsuUAJ]+$/.test(parsed[3])
            ) {
                // Invalid flags
                m.regexp = new RegExp(m.regexp);
            } else {
                // Create the regular expression
                m.regexp = new RegExp(parsed[2], parsed[3]);
            }
            return m;
        });
    }
};

export const getConfig = (): Config => config;

/**
 * Config middleware initializer
 *
 * Starts the file watch for config changes or file changes using fs.watch. This uses Inotify, therefore it has to be requeued if the file is moved
 */
export const initConfigMiddleware = (): void => {
    initConfig();
    const watcher = watch(configFileName);
    watcher.on('change', () => {
        console.log(`${configFileName}: changed. Reloading`);
        initConfig();
    });
};

/**
 * Decide which pivot point for scheduling on-call duty
 * @param schedule Schedule type identifier. Either "daily" or "weekly"
 * @returns Arbitrary pivot value for given schedule
 */
const onCallPivot = (schedule: string | undefined): number | void => {
    const now = new Date();
    if (schedule === 'daily') {
        return getDayOfYear(now);
    }
    if (schedule === 'weekly') {
        return getWeek(now);
    }
    console.error(
        "Invalid schedule type for onCall schedule. Must be 'daily' or 'weekly'."
    );
};

/**
 * Resolve which member is on call duty right now
 * @param onCallConfig On-call section of the configuration file
 * @returns Member from the config currently on duty
 */
export const getOnCallUser = (): OnCallMember | void => {
    if (config.onCall.override) {
        return config.onCall.override;
    }
    const pivot = onCallPivot(config.onCall.schedule);
    if (pivot) {
        return config.onCall.members[pivot % config.onCall.members.length];
    }
    console.error('Unable to fetch user on call duty. Check the config file.');
};
