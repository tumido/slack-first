import fs from 'fs';
import { App, ExpressReceiver } from '@slack/bolt';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

import initHandlers from './handlers';
import { configMiddleware, initConfigMiddleware } from './middleware/config';
import { initGithubMiddleware } from './middleware/github';
import { initDbMiddleware, setKey, getKey } from './middleware/database';

const scopes = ['channels:history', 'channels:read', 'chat:write', 'commands', 'groups:history', 'groups:read', 'im:history', 'mpim:history', 'users:read', 'users:read.email'];

const healthCheck = () => {
    try {
        // if (!process.env.SLACK_BOT_TOKEN) { throw Error('SLACK_BOT_TOKEN: Token not set'); }
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
initDbMiddleware();

// Initializes your app with your bot token and signing secret
const slackReceiver = new ExpressReceiver({
    signingSecret: (process.env.SLACK_SIGNING_SECRET as string),
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    scopes,
    stateSecret: 'my-state-secret',
    installationStore: {
        storeInstallation: async (installation) => {
            if (installation.isEnterpriseInstall && installation?.enterprise?.id) {
                setKey((installation?.enterprise?.id as string), installation);
            } else {
                setKey((installation?.team?.id as string), installation);
            }
        },
        fetchInstallation: async (installQuery) => {
            if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
                return getKey(installQuery.enterpriseId);
            }
            if (installQuery.teamId !== undefined) {
                return getKey(installQuery.teamId);
            }
            throw new Error('Failed fetching installation');
        },
    },
});
const slackApp = new App({
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
slackReceiver.app.disable("x-powered-by"); // https://sonarcloud.io/project/security_hotspots?id=tumido_slack-first&hotspots=AXhhsCuTV4OlGYpDAuyk

// Setup middlewares first
initConfigMiddleware();
initGithubMiddleware(githubApp);

// Use configMiddleware for every handler
slackApp.use(configMiddleware);

// Add handlers to the app
initHandlers(slackApp);

// Mount additional endpoint for health check
slackReceiver.router.get('/healthz', (_req, res) => res.status(200).send('OK'));

// Start your app
(async () => {
    await slackApp.start(process.env.PORT ? parseInt(process.env.PORT) : 3000);
    console.log('⚡️ Bolt app is running!');
})();
