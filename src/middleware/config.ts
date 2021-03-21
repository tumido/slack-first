// @ts-nocheck
import fs from 'fs';
import yaml from 'js-yaml';
import { Middleware, AnyMiddlewareArgs } from '@slack/bolt';

const configFileName = process.env.SLACK_BOT_CONFIG as string;

const loadConfig = (): Object => {
    return yaml.load(fs.readFileSync(configFileName).toString()) || {};
}

var currentWatcher;
var config;
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
                currentWatcher.close();
                currentWatcher = watchConfigFile();
                return;
            }
            if (debounce) { return; }
            debounce = true
            setTimeout(() => { debounce = false }, 100);

            console.log(`${filename}: changed. Reloading`);
            config = loadConfig();
        })
    }
    currentWatcher = watchConfigFile();
    config = loadConfig();
}


export const configMiddleware: Middleware<AnyMiddlewareArgs> = async ({ context, next, client }) => {
    context.config = config;

    const user = await client.users.lookupByEmail({ 'email': context.config.onCall })
    if (user.ok) {
        context.onCallUser = user.user.id;
    }
    if (next) await next();
}

