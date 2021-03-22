import { Octokit } from '@octokit/rest';
import { Middleware, AnyMiddlewareArgs } from '@slack/bolt';


var githubClient: (Octokit | undefined);

/**
 * GitHub middleware initializer
 * @param client GitHub client
 */
export const initGithubMiddleware = (client: Octokit) => {
    githubClient = client;
};

/**
 * Middleware allowing the bot talk to GitHub
 * @param param0 Arguments passed to Slack middleware
 */
export const githubMiddleware: Middleware<AnyMiddlewareArgs> = async ({ context, next }) => {
    context.github = githubClient;
    if (next) { await next(); }
};

