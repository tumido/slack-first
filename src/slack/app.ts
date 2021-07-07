import { App, ExpressReceiver } from '@slack/bolt';
import { initConfigMiddleware } from '../helpers';

import initHandlers from './handlers';
import { configMiddleware } from './middleware/config';

/**
 * Log any interaction with Slack events
 * @param payload Event payload
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logAll = (payload: Record<string, any>) => {
    console.info(
        'Slack event',
        JSON.stringify({
            type: payload.type,
            command: payload.command,
            channel: payload.channel?.name,
            callback_id: payload.callback_id || payload.view?.callback_id,
            action_id: payload.action_id,
        })
    );
};

/**
 * Initialize Slack Bolt application
 * @returns [Bolt application, Express receiver providing router interface]
 */
export const slackApp = (): [App, ExpressReceiver] => {
    // Initializes your app with your bot token and signing secret
    // Initialize express for custom endpoints
    const receiver = new ExpressReceiver({
        signingSecret: process.env.SLACK_SIGNING_SECRET as string,
    });
    const app = new App({
        token: process.env.SLACK_BOT_TOKEN,
        receiver: receiver,
    });

    // https://sonarcloud.io/project/security_hotspots?id=tumido_slack-first&hotspots=AXhhsCuTV4OlGYpDAuyk
    receiver.app.disable('x-powered-by');

    // Use configMiddleware for every handler
    initConfigMiddleware();
    app.use(configMiddleware);

    // Add handlers to the app
    initHandlers(app);

    // Add a middleware logging any action
    app.use(async ({ next, payload }) => {
        logAll(payload);
        if (next) {
            await next();
        }
    });

    return [app, receiver];
};
