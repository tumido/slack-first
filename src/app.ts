import fs from 'fs';
import { App } from '@slack/bolt';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

import initHandlers from './handlers';
import { configMiddleware, initConfigMiddleware } from './middleware/config';
import { initGithubMiddleware } from './middleware/github';

const healthCheck = () => {
    try {
        if (!process.env.SLACK_BOT_TOKEN) throw 'SLACK_BOT_TOKEN: Token not set';
        if (!process.env.SLACK_SIGNING_SECRET) throw 'SLACK_SIGNING_SECRET: Secret not set';
        if (!process.env.SLACK_BOT_CONFIG) throw 'SLACK_BOT_CONFIG: Path to config not set';
        if (!process.env.GITHUB_APP_ID) throw 'GITHUB_APP_ID: App ID not set';
        if (!process.env.GITHUB_PRIVATE_KEY) throw 'GITHUB_PRIVATE_KEY: Path to private key not set';
        if (!process.env.GITHUB_INSTALLATION_ID) throw 'GITHUB_INSTALLATION_ID: Path to private key not set';
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
healthCheck();

// Initializes your app with your bot token and signing secret
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET
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

(async () => {
    initConfigMiddleware();
    initGithubMiddleware(githubApp);
    app.use(configMiddleware);
    initHandlers(app);
    // Start your app
    await app.start(process.env.PORT ? parseInt(process.env.PORT) : 3000);

    console.log('⚡️ Bolt app is running!');
})();
