import fs from 'fs';
import { App, ExpressReceiver } from '@slack/bolt';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import express from 'express';

import initHandlers from './handlers';
import { configMiddleware, initConfigMiddleware } from './middleware/config';
import { initGithubMiddleware } from './middleware/github';


const healthCheck = () => {
    try {
        if (!process.env.SLACK_BOT_TOKEN) { throw Error('SLACK_BOT_TOKEN: Token not set'); }
        if (!process.env.SLACK_SIGNING_SECRET) { throw Error('SLACK_SIGNING_SECRET: Secret not set'); }
        if (!process.env.SLACK_BOT_CONFIG) { throw Error('SLACK_BOT_CONFIG: Path to config not set'); }
        if (!process.env.GITHUB_APP_ID) { throw Error('GITHUB_APP_ID: App ID not set'); }
        if (!process.env.GITHUB_PRIVATE_KEY) { throw Error('GITHUB_PRIVATE_KEY: Path to private key not set'); }
        if (!process.env.GITHUB_INSTALLATION_ID) { throw Error('GITHUB_INSTALLATION_ID: Path to private key not set'); }
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
healthCheck();

// Initializes your app with your bot token and signing secret
const slackReceiver = new ExpressReceiver({
    signingSecret: (process.env.SLACK_SIGNING_SECRET as string),
    endpoints: { events: '/' }
});
const slackApp = new App({
    token: process.env.SLACK_BOT_TOKEN,
    receiver: slackReceiver
});

// Initialize Github app connection
const githubApp = new Octokit({
    authStrategy: createAppAuth,
    auth: {
        type: "app",
        appId: process.env.GITHUB_APP_ID,
        privateKey: fs.readFileSync(process.env.GITHUB_PRIVATE_KEY as string).toString(),
        installationId: process.env.GITHUB_INSTALLATION_ID,
    }
});

// Initialize express for custom endpoints
const app = express();

(async () => {
    // Setup middlewares first
    initConfigMiddleware();
    initGithubMiddleware(githubApp);
    // Use configMiddleware for every handler
    slackApp.use(configMiddleware);
    // Add handlers to the app
    initHandlers(slackApp);
    // Mount SlackApp to expected endpoint
    app.use('/slack/events', slackReceiver.router);
    app.get('/healthz', (req, res) => res.status(200).send('OK'));
    // Start your app
    app.listen(process.env.PORT ? parseInt(process.env.PORT) : 3000, () => {
        console.log('⚡️ Bolt app is running!');
    });
})();
