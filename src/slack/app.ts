import { App, ExpressReceiver } from '@slack/bolt';

import initHandlers from './handlers';
import { configMiddleware } from './middleware/config';

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
    app.use(configMiddleware);

    // Add handlers to the app
    initHandlers(app);

    return [app, receiver];
};
