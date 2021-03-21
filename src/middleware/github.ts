import { Octokit } from '@octokit/rest';
import { Middleware, AnyMiddlewareArgs } from '@slack/bolt';


var githubClient: (Octokit | undefined);
export const initGithubMiddleware = (client: Octokit) => {
    githubClient = client;
}

export const githubMiddleware: Middleware<AnyMiddlewareArgs> = async ({ context, next }) => {
    context.github = githubClient;
    if (next) await next();
}

