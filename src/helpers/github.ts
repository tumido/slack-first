import { Octokit } from '@octokit/rest';

let githubClient: Octokit;

/**
 * GitHub middleware initializer
 * @param client GitHub client
 */
export const initGithubMiddleware = (client: Octokit): void => {
    githubClient = client;
};

export const getGithubClient = (): Octokit => {
    return githubClient;
};
