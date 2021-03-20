import { App } from '@slack/bolt';
import initHandlers from './handlers';
import { getConfig } from './middleware/config';

// Initializes your app with your bot token and signing secret
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET
});

const healthCheck = () => {
    try {
        if (!process.env.SLACK_BOT_TOKEN) throw 'SLACK_BOT_TOKEN: Token not set';
        if (!process.env.SLACK_SIGNING_SECRET) throw 'SLACK_SIGNING_SECRET: Secret not set';
        if (!process.env.SLACK_BOT_CONFIG) throw 'SLACK_BOT_CONFIG: Path to config not set';
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}


(async () => {
    healthCheck()
    initHandlers(app);
    // Start your app
    await app.start(process.env.PORT ? parseInt(process.env.PORT) : 3000);

    console.log('⚡️ Bolt app is running!');
})();
