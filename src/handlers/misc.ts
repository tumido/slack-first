// @ts-nocheck
import { App, Middleware, SlackActionMiddlewareArgs, SlackCommandMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';

/**
 * Simple delete of given message
 * @param param0 Slack payload for an action
 */
const dismissMessage: Middleware<SlackActionMiddlewareArgs<"message">> = async ({ ack, respond }) => {
    await ack();
    await respond({ delete_original: true });
};

/**
 * Helper for outlining all supported features
 * @param supportChannelId Channel ID
 * @returns List of features
 */
const featureList = (supportChannelId: string) => ([
    {
        text: "*1️⃣ Use the `/oncall` command*.\nType `/oncall` and I'll tell you who is the dedicated support person on call duty for today.",
        imageUrl: "https://raw.githubusercontent.com/tumido/slack-first/main/assets/images/oncall_command.png",
        imageTitle: "oncall_command"
    },
    {
        text: `*2️⃣ Ask a question at <#${supportChannelId}>.*\nIf I can sense a question in this channel's main thread, it will offer you to tag the person on call duty for the day. I will open a new conversation in a thread to your original message.`,
        imageUrl: "https://raw.githubusercontent.com/tumido/slack-first/main/assets/images/support_question.png",
        imageTitle: "support_channel_question"
    },
    {
        text: "*3️⃣ Use the _Ask for help_ action.*\nIf you want to raise a particular message to attention of our support team, select `Ask for help` in a message's context menu (click on _More actions_).",
        imageUrl: "https://raw.githubusercontent.com/tumido/slack-first/main/assets/images/message_shortcut.gif",
        imageTitle: "message_shortcut"
    },
    {
        text: "*4️⃣ Use the _Ask for help_ shortcut.*\nIf you want to start a chat with our support team immediately, select `Ask for help` from the _Shortcuts_ menu.",
        imageUrl: "https://raw.githubusercontent.com/tumido/slack-first/main/assets/images/global_shortcut.gif",
        imageTitle: "global_shortcut"
    },
    {
        text: "*5️⃣ Use the _Create issue_ shortcut.*\nIf you want to capture a post or a thread into a GitHub issue, select `Create issue` in a message's context menu (click on _More actions_).",
        imageUrl: "https://raw.githubusercontent.com/tumido/slack-first/main/assets/images/issue.gif",
        imageTitle: "github_issue"
    },
]);

/**
 * Message posted as an introduction or help
 * @param supportChannelId ID of a support channel from the configuration file
 * @returns Message content
 */
const introduction = (supportChannelId) => {
    return {
        text: "Hey there 👋 I'm your 1st Operator.",
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "Hey there 👋 I'm your 1st Operator.\n\nI'm here to help you operate and reach support for Operate First in Slack.\nThere multiple ways you can use my services:"
                },
            },
            ...featureList(supportChannelId).map(f => ({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: f.text
                }
            })),
            {
                type: "divider"
            },
            {
                type: "context",
                elements: [
                    {
                        type: "mrkdwn",
                        text: [
                            "👀 View current person on call duty use `/oncall`",
                            "❓ Type *help* in a DM with me to get this message any time again",
                            "🕵️ Take a look at my programming at <https://github.com/tumido/slack-first|tumido/slack-first>"
                        ].join('\n')
                    }
                ]
            }
        ],
        unfurl_links: false,
    };
};

/**
 * React to `help` messages in direct messages only
 * @param param0 Slack payload for command action
 */
const helpMessage: Middleware<SlackCommandMiddlewareArgs> = async ({ say, message, context }) => {
    if (message.channel_type !== 'im') { return; }
    await say(introduction(context.config.supportChannelId));
};

/**
 * Ask if the bot should introduce when joining a channel
 * @param param0 Slack payload for event reactiop
 */
const askIfShouldIntroduce: Middleware<SlackEventMiddlewareArgs> = async ({ event, client }) => {
    const auth = await client.auth.test();
    if (!auth.ok || auth.user_id !== event.user || !event.inviter) { return; }


    await client.chat.postEphemeral({
        channel: event.channel,
        text: "Hey there 👋 I'm your 1st Operator. Thanks for adding me to this channel.",
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "Hey there 👋 I'm your 1st Operator. Thanks for adding me to this channel. Would you like me to introduce myself to others?"
                },
            },
            {
                type: "divider"
            },
            {
                type: 'actions',
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: `Please introduce yourself`
                        },
                        action_id: "introduce_bot",
                        style: "primary",
                    },
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Dismiss message"
                        },
                        action_id: "dismiss_message",
                    }
                ]
            },
        ],
        user: event.inviter
    });
};


/**
 * Post introduction message in response to an action
 * @param param0 Slack payload for responding to an action
 */
const introduceBot: Middleware<SlackActionMiddlewareArgs<"message">> = async ({ ack, say, respond, context }) => {
    await ack();
    await say({
        ...introduction(context.config.supportChannelId),
    });
    await respond({ delete_original: true });
};


/**
 * Home tab content
 * @param param0 Slack payload for responding to events
 */
const homeTab: Middleware<SlackEventMiddlewareArgs> = async ({ event, client, context }) => {
    await client.views.publish({
        user_id: event.user,
        view: {
            type: "home",
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: "Hey there 👋 I'm 1st Operator.\nBelow you can find list of features."
                    },
                },
                {
                    type: "divider"
                },
                ...featureList(context.config.supportChannelId).map(f => ({
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: f.text,
                    }
                })),
                {
                    type: "divider"
                },
            ]
        }
    });
};


/**
 * Subscribe to events for misc
 * @param app Slack App
 */
const misc = (app: App): void => {
    app.action('dismiss_message', dismissMessage);
    app.action('introduce_bot', introduceBot);
    app.event('app_home_opened', homeTab);
    app.event('member_joined_channel', askIfShouldIntroduce);
    app.message('help', helpMessage);
};
export default misc;
