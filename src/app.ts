
import { App } from '@slack/bolt';
import initHandlers from './handlers';

// Initializes your app with your bot token and signing secret
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET
});

initHandlers(app);

(async () => {
    // Start your app
    await app.start(process.env.PORT ? parseInt(process.env.PORT) : 3000);

    console.log('⚡️ Bolt app is running!');
})();
