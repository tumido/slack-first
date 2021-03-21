// @ts-nocheck
import { App, Middleware, SlackShortcutMiddlewareArgs } from '@slack/bolt';
import { Octokit } from '@octokit/rest';
import { WebClient } from '@slack/web-api';
import { githubMiddleware } from '../middleware/github';

const userNameLookup = async (client: WebClient, user_id: string) => {
    const user = await client.users.info({ user: user_id });
    if (!user.ok) { return user_id; }
    return user.user.profile.display_name || user.user.real_name;
}

const expandMentions = (text: string, mentions: Array<Object<string, string>>) => {
    let message = text;
    for (const mention of mentions) {
        message = message.replace(mention.src, mention.dst);
    }
    return message;
}

const resolveUserMentions = async (client: WebClient, messages: Array) => {
    const allUserMentionsSet = new Set(messages.flatMap(m => [m.user, ...(m.text.match(/(?<=<@).*?(?=>)/g) || [])]))

    return await Promise.all(Array.from(allUserMentionsSet).map(async m => ({
        src: new RegExp(`<@${m}>`, 'g'),
        dst: await userNameLookup(client, m)
    })));
}

const resolveChannelMentions = (messages: Array) => {
    const allChannelMentionsSet = new Set(messages.flatMap(m => m.text.match(/(?<=<#.*?\|).*?(?=>)/g) || []))
    return Array.from(allChannelMentionsSet).map(m => ({
        src: new RegExp(`<#.*?\\|${m}>`, 'g'),
        dst: '#' + m
    }));
}


const issueBodyGenerator = async (client: WebClient, messages: Array, permalink: string) => {
    const header = "Hey there 👋\n\nThis is a Slack discussion you wanted me to capture.\n\n"

    const mentions = [...(await resolveUserMentions(client, messages)), ...resolveChannelMentions(messages)]
    const body = "> " + messages.flatMap(m => [`**<@${m.user}> wrote:**`, ...m.text.split('\n'), '']).join('\n> ')

    const footer = `\n\n_Transcript of Slack thread: ${permalink}_`

    return header + expandMentions(body, mentions) + footer;
}

const fetchRepos = async (github: Octokit) => {
    try {
        const repos = await github.apps.listReposAccessibleToInstallation();
    } catch (e) {
        console.error(e);
        return []
    }
    return repos.data.repositories.map(r => r.full_name);
}

const fetchThreadBody = async (body, client: WebClient) => {
    if (body.message.thread_ts) {
        const promises = [
            client.chat.getPermalink({
                channel: body.channel.id,
                message_ts: body.message.thread_ts
            }),
            client.conversations.replies({
                channel: body.channel.id,
                ts: body.message.thread_ts
            })
        ]
        const [permalink, thread] = await Promise.all(promises);

        if (!thread.ok || !permalink.ok) {
            console.error('Failed to get whole conversation')
        }
        return await issueBodyGenerator(client, thread.messages, permalink.permalink);
    } else {
        const permalink = await client.chat.getPermalink({
            channel: body.channel.id,
            message_ts: body.message_ts
        })
        return await issueBodyGenerator(client, [body.message], permalink.permalink)
    }
}

const createModal: Middleware<SlackShortcutMiddlewareArgs> = async ({ body, context, client, ack }) => {
    await ack();
    const { github }: { github: Octokit } = context;
    const [issueBody, repos] = await Promise.all([fetchThreadBody(body, client), fetchRepos(github)]);

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
                        type: "static_select",
                        placeholder: {
                            type: "plain_text",
                            text: "Select an item",
                        },
                        options: repos.map(r => ({
                            text: {
                                type: "plain_text",
                                text: r
                            },
                            value: r
                        })),
                        action_id: "repo_select"
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

const openIssue: Middleware<SlackShortcutMiddlewareArgs> = async ({ body, view, context, client, ack }) => {
    await ack();
    const { github }: { github: Octokit } = context;

    const [owner, repo] = view.state.values.repo.repo_select.selected_option.value.split('/')
    const [thread_ts, channel] = body.view.private_metadata.split("|")
    const issue = await github.issues.create({
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
    })
}



const init = (app: App) => {
    app.shortcut('open_issue_for_thread', githubMiddleware, createModal);
    app.view('open_issue', githubMiddleware, openIssue);
};
export default init;
