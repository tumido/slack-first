// @ts-nocheck
import fs from 'fs';
import yaml from 'js-yaml';
import { Middleware, AnyMiddlewareArgs } from '@slack/bolt';

const globalAny: any = global;
const configFileName = process.env.SLACK_BOT_CONFIG as string;

const loadConfig = (): Object => {
    return yaml.load(fs.readFileSync(configFileName).toString()) || {};
}

export const initConfigMiddleware = () => {
    let debounce = false;
    const watchConfigFile = () => {
        return fs.watch(configFileName, (event, filename) => {
            if (!filename) {
                console.log(`${filename}: watch was lost.`)
                return;
            }
            if (event === 'rename') {
                console.log(`${filename}: watch has expired. Requeueing.`)
                globalAny.currentWatcher.close();
                globalAny.currentWatcher = watchConfigFile();
                return;
            }
            if (debounce) { return; }
            debounce = true
            setTimeout(() => { debounce = false }, 100);

            console.log(`${filename}: changed. Reloading`);
            globalAny.config = loadConfig();
        })
    }
    globalAny.currentWatcher = watchConfigFile();
    globalAny.config = loadConfig();
}


export const configMiddleware: Middleware<AnyMiddlewareArgs> = async ({ context, next, client }) => {
    context.config = globalAny.config;

    const user = await client.users.lookupByEmail({ 'email': context.config.onCall })
    if (user.ok) {
        context.onCallUser = user.user.id;
    }
    if (next) await next();
}

