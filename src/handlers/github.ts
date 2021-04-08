// @ts-nocheck
import { App, Middleware, SlackOptionsMiddlewareArgs, SlackShortcutMiddlewareArgs, SlackViewMiddlewareArgs } from '@slack/bolt';
import { Octokit } from '@octokit/rest';
import { WebClient } from '@slack/web-api';
import { githubMiddleware } from '../middleware/github';
import { Config, GithubConfig } from '../middleware/config';

/**
 * Lookup user name from Slack user ID
 * @param client Slack client
 * @param user_id User ID to look up
 * @returns User's display name if available or the real name of the account
 */
const userNameLookup = async (client: WebClient, user_id: string) => {
    const user = await client.users.info({ user: user_id });
    if (!user.ok) { return user_id; }
    return user.user.profile.display_name || user.user.real_name;
};

/**
 * A rule for mention replacement.
 *
 * Content matching `src` regex is intended to be replaced by `dst`
 */
export type MentionReplace = {
    src: RegExp,
    dst: string
};

/**
 * Expand Slack mentions with readable content.
 *
 * Slack mentions are either user or channel Slack ID. These need to be replaced in order to be readable on GitHub.
 * @param text Message text to process
 * @param mentions List of search and replace objects.
 * @returns Message with all Slack mentions replaced with readable values
 */
const expandMentions = (text: string, mentions: Array<MentionReplace>) => {
    let message = text;
    for (const mention of mentions) {
        message = message.replace(mention.src, mention.dst);
    }
    return message;
};

/**
 * Find all users mentioned in the messages and allocate a MentionReplace for each.
 * 
 * Slack API returns user mentions as <@USER_ID> we need to translate this USER_ID number into a name
 * @param client Slack client
 * @param messages All messages in a thread
 * @returns Array of user mention replace guides
 */
const resolveUserMentions = async (client: WebClient, messages: Array): Promise<Array<MentionReplace>> => {
    const allUserMentionsSet = new Set(messages.flatMap(m => [m.user, ...(m.text.match(/(?<=<@).*?(?=>)/g) || [])]));

    return Promise.all(Array.from(allUserMentionsSet).map(async m => ({
        src: new RegExp(`<@${m}>`, 'g'),
        dst: await userNameLookup(client, m)
    })));
};

/**
 * Find all channel mentions in the messages and allocate a MentionReplace for each.
 *
 * Channels are easier to replace. Slack API returns them as <#CHANNEL_ID|CHANNEL_NAME>, we need the CHANNEL_NAME
 * @param messages All messages in a thread
 * @returns Array of channel mention replace guides
 */
const resolveChannelMentions = (messages: Array) => {
    const allChannelMentionsSet = new Set(messages.flatMap(m => m.text.match(/(?<=<#.*?\|).*?(?=>)/g) || []));
    return Array.from(allChannelMentionsSet).map(m => ({
        src: new RegExp(`<#.*?\\|${m}>`, 'g'),
        dst: '#' + m
    }));
};

/**
 * Format a thread into a nice GitHub issue body
 * @param client Slack client
 * @param messages All messages in a thread
 * @param permalink Permalink to the thread on Slack
 * @returns Properly formatted GitHub issue body content
 */
const issueBodyGenerator = async (client: WebClient, messages: Array, permalink: string) => {
    const header = "Hey there 👋\n\nThis is a Slack discussion you wanted me to capture.\n\n";

    const mentions = [...(await resolveUserMentions(client, messages)), ...resolveChannelMentions(messages)];
    const body = "> " + messages.flatMap(m => [`**<@${m.user}> wrote:**`, ...m.text.split('\n'), '']).join('\n> ');

    const footer = `\n\n_Transcript of Slack thread: ${permalink}_`;

    return header + expandMentions(body, mentions) + footer;
};

/**
 * Fetch all messages in a given thread, return as a formatted string
 * @param body Shortcut action middleware body
 * @param client Slack client
 * @returns A thread content formatted for GitHub issue
 */
const fetchThreadBody = async (body, client: WebClient) => {
    if (body.message.thread_ts) {
        // In a thread
        const promises = [
            client.chat.getPermalink({
                channel: body.channel.id,
                message_ts: body.message.thread_ts
            }),
            client.conversations.replies({
                channel: body.channel.id,
                ts: body.message.thread_ts
            })
        ];
        const [permalink, thread] = await Promise.all(promises);

        if (!thread.ok || !permalink.ok) {
            console.error('Failed to get whole conversation');
        }
        return issueBodyGenerator(client, thread.messages, permalink.permalink);
    } else {
        // Triggered on a message without a thread - directly in a channel
        const permalink = await client.chat.getPermalink({
            channel: body.channel.id,
            message_ts: body.message_ts
        });
        return issueBodyGenerator(client, [body.message], permalink.permalink);
    }
};

/**
 * List of GitHub repositories the bot has access to
 * @param param0 Slack payload for loading external options event
 * @returns List of repository names
 */
const fetchRepos: Middleware<SlackOptionsMiddlewareArgs> = async ({ ack, context }) => {
    const { github: gh, config: { github: ghConfig } }: { github: Octokit, ghCnfig: GithubConfig } = context;

    let repos = [];
    if (ghConfig?.issues?.access && Array.isArray(ghConfig.issues.access)) {
        // Repositories are listed in the config file
        repos = ghConfig.issues.access;
    } else {
        try {
            // Lookup all repositories
            const ghRepos = await gh.apps.listReposAccessibleToInstallation();
            repos = ghRepos.data.repositories.map(r => r.full_name);
        } catch (e) {
            console.error(e);
        }
    }

    await ack({
        options: repos.map(r => ({
            text: {
                type: "plain_text",
                text: r
            },
            value: r
        }))
    });
};

/**
 * Create modal for GitHub issue creation
 * @param param0 Slack payload for shortcut action
 */
const createIssueModal: Middleware<SlackShortcutMiddlewareArgs> = async ({ body, client, ack }) => {
    await ack();

    const issueBody = await fetchThreadBody(body, client);

    const ts = body.message.thread_ts || body.message_ts;
    await client.views.open({
        trigger_id: body.trigger_id,
        view: {
            type: 'modal',
            callback_id: 'open_issue',
            private_metadata: `${ts}|${body.channel.id}`,
            title: {
                type: 'plain_text',
                text: 'Open issue'
            },
            blocks: [
                {
                    type: "input",
                    block_id: 'repo',
                    label: {
                        type: "plain_text",
                        text: "Repository",
                    },
                    element: {
                        type: "external_select",
                        placeholder: {
                            type: "plain_text",
                            text: "Select a repository",
                        },
                        action_id: "repo_select",
                        min_query_length: 0
                    },
                },
                {
                    type: 'input',
                    block_id: 'title',
                    label: {
                        type: 'plain_text',
                        text: 'Title'
                    },
                    element: {
                        type: 'plain_text_input',
                        action_id: 'title',
                    }
                },
                {
                    type: 'input',
                    block_id: 'body',
                    label: {
                        type: 'plain_text',
                        text: 'Issue body'
                    },
                    element: {
                        type: 'plain_text_input',
                        action_id: 'body',
                        initial_value: issueBody,
                        multiline: true
                    }
                }
            ],
            submit: {
                type: 'plain_text',
                text: 'Submit',
                emoji: true
            }
        }
    });
};


/**
 * Create modal for a new comment on existing GitHub issue
 * @param param0 Slack payload for shortcut action
 */
const commentIssueModal: Middleware<SlackShortcutMiddlewareArgs> = async ({ body, client, ack }) => {
    await ack();

    const issueBody = await fetchThreadBody(body, client);

    const ts = body.message.thread_ts || body.message_ts;
    await client.views.open({
        trigger_id: body.trigger_id,
        view: {
            type: 'modal',
            callback_id: 'comment_on_issue',
            private_metadata: `${ts}|${body.channel.id}`,
            title: {
                type: 'plain_text',
                text: 'Comment on issue'
            },
            blocks: [
                {
                    type: "input",
                    block_id: 'issue',
                    label: {
                        type: "plain_text",
                        text: "Issue",
                    },
                    element: {
                        type: "plain_text_input",
                        placeholder: {
                            type: "plain_text",
                            text: "https://github.com/organization/repository/issues/123",
                        },
                        action_id: "issue",
                    },
                },
                {
                    type: 'input',
                    block_id: 'body',
                    label: {
                        type: 'plain_text',
                        text: 'Comment body'
                    },
                    element: {
                        type: 'plain_text_input',
                        action_id: 'body',
                        initial_value: issueBody,
                        multiline: true
                    }
                }
            ],
            submit: {
                type: 'plain_text',
                text: 'Submit',
                emoji: true
            }
        }
    });
};

/**
 * Open issue as a reaction to modal submit
 * @param param0 SSlack payload for view action
 */
const openIssue: Middleware<SlackViewMiddlewareArgs> = async ({ body, view, context, client, ack }) => {
    await ack();
    const { github: gh }: { github: Octokit } = context;

    const [owner, repo] = view.state.values.repo.repo_select.selected_option.value.split('/');
    const [thread_ts, channel] = body.view.private_metadata.split("|");

    const issue = await gh.issues.create({
        owner,
        repo,
        title: view.state.values.title.title.value,
        body: view.state.values.body.body.value,
        labels: context.config.issueLabels
    });

    await client.chat.postMessage({
        channel,
        thread_ts,
        text: `This post/thread was captured in an issue: ${issue.data.html_url}`
    });
};

const issueRegex = /^.*\/(?<org>.+?)\/(?<repo>.+?)\/issues\/(?<number>\d+)$/;

const parseIssueUrl = (url: string) => {
    const parsed = url.match(issueRegex);
    if (!parsed) { return null; }

    return parsed.groups;
};

const isAllowed = (org: string, repo: string, config: Config): boolean => (
    config?.github?.issues?.access.includes(`${org}/${repo}`)
);

const commentOnIssue: Middleware<SlackViewMiddlewareArgs> = async ({ body, view, context, client, ack }) => {
    const { github: gh }: { github: Octokit } = context;
    const { org, repo, number } = parseIssueUrl(view.state.values.issue.issue.value);
    const [thread_ts, channel] = body.view.private_metadata.split("|");

    if (!org || !repo || !number) {
        await ack({
            response_action: 'errors',
            errors: {
                issue: "Value is not a valid Git Hub issue URL."
            }
        });
        return;
    }
    if (!isAllowed(org, repo, context.config)) {
        await ack({
            response_action: 'errors',
            errors: {
                issue: "This repository is not whitelisted in the bot configuration."
            }
        });
        return;
    }

    const issue = await gh.issues.get({
        issue_number: number,
        owner: org,
        repo: repo
    }).catch(error => ({ error }));

    if (issue.error) {
        await ack({
            response_action: 'errors',
            errors: {
                issue: "Issue does not exist."
            }
        });
        return;
    }

    const comment = await gh.issues.createComment({
        issue_number: number,
        owner: org,
        repo: repo,
        body: view.state.values.body.body.value,
    }).catch(error => ({ error }));

    if (comment.error) {
        await ack({
            response_action: 'errors',
            errors: {
                issue: "Bot is not allowed to comment on this issue."
            }
        });
        return;
    }

    await ack();
    await client.chat.postMessage({
        channel,
        thread_ts,
        text: `This post/thread was captured as a comment in an issue: ${view.state.values.issue.issue.value}`
    });
};

/**
 * Subscribe to events for GitHub
 * @param app Slack App
 */
const github = (app: App): void => {
    app.shortcut('open_issue_for_thread', githubMiddleware, createIssueModal);
    app.shortcut('comment_issue_for_thread', githubMiddleware, commentIssueModal);
    app.options('repo_select', githubMiddleware, fetchRepos);
    app.view('open_issue', githubMiddleware, openIssue);
    app.view('comment_on_issue', githubMiddleware, commentOnIssue);
};
export default github;
