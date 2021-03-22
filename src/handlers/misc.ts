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
 * Message posted as an introduction or help
 * @param supportChannelId ID of a support channel from the configuration file
 * @returns Message content
 */
const introduction = (supportChannelId) => ({
    text: "Hey there 👋 I'm your 1st Operator.",
    blocks: [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "Hey there 👋 I'm your 1st Operator. I'm here to help you operate and reach support for Operate First in Slack.\nThere multiple ways you can use my services:"
            },
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "*1️⃣ Use the `/oncall` command*. Type `/oncall` and I'll tell you who is the dedicated support person on call duty for today."
            }
        },
        {
            type: "image",
            title: {
                type: "plain_text",
                text: "oncall_command",
                emoji: true
            },
            image_url: "https://raw.githubusercontent.com/tumido/slack-first/main/assets/images/oncall_command.png",
            alt_text: "oncall_command"
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*2️⃣ Ask a question at <#${supportChannelId}>.* If I can sense a question in this channel's main thread, it will offer you to tag the person on call duty for the day. I will open a new conversation in a thread to your original message.`
            }
        },
        {
            type: "image",
            title: {
                type: "plain_text",
                text: "support_channel_question"
            },
            image_url: "https://raw.githubusercontent.com/tumido/slack-first/main/assets/images/support_question.png",
            alt_text: "support_channel_question"
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "*3️⃣ Use the _Ask for help_ action.* If you want to raise a particular message to attention of our support team, select `Ask for help` in a message's context menu (click on _More actions_)."
            }
        },
        {
            type: "image",
            title: {
                type: "plain_text",
                text: "message_shortcut"
            },
            image_url: "https://raw.githubusercontent.com/tumido/slack-first/main/assets/images/message_shortcut.gif",
            alt_text: "message_shortcut"
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "*4️⃣ Use the _Ask for help_ shortcut.* If you want to start a chat with our support team immediately, select `Ask for help` from the _Shortcuts_ menu."
            }
        },
        {
            type: "image",
            title: {
                type: "plain_text",
                text: "global_shortcut"
            },
            image_url: "https://raw.githubusercontent.com/tumido/slack-first/main/assets/images/global_shortcut.gif",
            alt_text: "global_shortcut"
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "*5️⃣ Use the _Create issue_ shortcut.* If you want to capture a post or a thread into a GitHub issue, select `Create issue` in a message's context menu (click on _More actions_)."
            }
        },
        {
            type: "image",
            title: {
                type: "plain_text",
                text: "github_issue"
            },
            image_url: "https://raw.githubusercontent.com/tumido/slack-first/main/assets/images/issue.gif",
            alt_text: "github_issue"
        },
        {
            type: "divider"
        },
        {
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: "👀 View current person on call duty use `/oncall`\n❓Get help at any time type *help* in a DM with me"
                }
            ]
        }
    ]
});

/**
 * React to `help` messages in direct messages only
 * @param param0 Slack payload for command action
 */
const helpMessage: Middleware<SlackCommandMiddlewareArgs> = async ({ say, message, context }) => {
    if (message.channel_type !== 'im') { return; }
    await say(introduction(context.config.supportChannelId));
};

/**
 * Introduce when joining a channel
 * @param param0 Slack payload for event reactiop
 */
const introduceOnJoin: Middleware<SlackEventMiddlewareArgs> = async ({ event, client, context }) => {
    const auth = await client.auth.test();
    if (!auth.ok || auth.user_id !== event.user) { return; }

    await client.chat.postMessage({
        channel: event.channel,
        ...introduction(context.config.supportChannelId),
    });
};

/**
 * Subscribe to events for misc
 * @param app Slack App
 */
const init = (app: App) => {
    app.action('dismiss_message', dismissMessage);
    app.event('member_joined_channel', introduceOnJoin);
    app.message('help', helpMessage);
};
export default init;
