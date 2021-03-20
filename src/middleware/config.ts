import fs from 'fs';
import yaml from 'js-yaml';
import { SlackAction, Middleware, SlackActionMiddlewareArgs } from '@slack/bolt';

export const getConfig = () : Object => {
    return yaml.load(fs.readFileSync(process.env.SLACK_BOT_CONFIG || '').toString()) || {};
}

export const configContext: Middleware<SlackActionMiddlewareArgs<SlackAction>> = async ({ context, next }) => {
    context.config = getConfig();
    if (next) await next();
}

export const onCallContext: Middleware<SlackActionMiddlewareArgs<SlackAction>> = async ({ context, next, client }) => {
    const config = getConfig();
    const user = await client.users.lookupByEmail({'email': config.onCall })
    if (user.ok) {
        context.onCallUser = user.user.id;
    }
    if (next) await next();
}
