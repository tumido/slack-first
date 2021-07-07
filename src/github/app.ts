import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

import { readFileToString, initGithubMiddleware } from '../helpers';
import { createNodeMiddleware, Webhooks } from '@octokit/webhooks';
import { ExpressReceiver } from '@slack/bolt';

export const githubApp = (receiver: ExpressReceiver): void => {
    // Initialize Github app connection
    const app = new Octokit({
        authStrategy: createAppAuth,
        auth: {
            type: 'app',
            appId: process.env.GITHUB_APP_ID,
            privateKey: readFileToString(
                process.env.GITHUB_PRIVATE_KEY as string
            ),
            installationId: process.env.GITHUB_INSTALLATION_ID,
        },
    });

    const webhooks = new Webhooks({ secret: 'first-operator' });
    webhooks.onAny(({ id, name, payload }) => {
        console.log(name, 'event received');
    });

    initGithubMiddleware(app);

    receiver.router.use(
        '/github/events',
        createNodeMiddleware(webhooks, { path: '/' })
    );
};
