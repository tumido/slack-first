import { Middleware, AnyMiddlewareArgs } from '@slack/bolt';

import { getGithubClient } from '../../helpers';

/**
 * Middleware allowing the bot talk to GitHub
 * @param param0 Arguments passed to Slack middleware
 */
export const githubMiddleware: Middleware<AnyMiddlewareArgs> = async ({
    context,
    next,
}) => {
    context.github = getGithubClient();
    if (next) {
        await next();
    }
};
