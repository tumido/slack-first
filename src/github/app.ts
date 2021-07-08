import { ExpressReceiver } from '@slack/bolt';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { createNodeMiddleware, Webhooks } from '@octokit/webhooks';

import { readFileToString, initGithubMiddleware } from '../helpers';
import initOnCallHandler from './on-call';

/**
 * Log any interaction with GitHub events
 * @param name Event name
 * @param payload Event payload
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logAll = (name: string, payload: Record<string, any>) => {
    console.info(
        'GitHub event',
        JSON.stringify({
            type: name,
            action: payload.action,
            repo: payload.repository?.name,
            owner: payload.repository?.owner?.login,
            issue: payload.issue?.number,
        })
    );
};

/**
 * Initialize GitHub application
 * @param receiver Express receiver providing http router
 */
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

    // Initialize webhook listener
    const webhooks = new Webhooks({ secret: 'first-operator' });

    // Make github client global
    initGithubMiddleware(app);
    // Init webhook listeners
    initOnCallHandler(app, webhooks);

    // Log any message delivery
    webhooks.onAny(({ name, payload }) => {
        logAll(name, payload);
    });

    // Plug into express router
    receiver.router.use(
        '/github/events',
        createNodeMiddleware(webhooks, { path: '/' })
    );
};
