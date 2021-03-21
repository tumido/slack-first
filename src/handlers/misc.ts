// @ts-nocheck
import { App, Middleware, SlackActionMiddlewareArgs, SlackCommandMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';

const dismissMessage: Middleware<SlackActionMiddlewareArgs<"message">> = async ({ ack, respond }) => {
    await ack();
    await respond({ delete_original: true });
};


const help = {
    type: "mrkdwn",
    text: "👀 View current person on call duty use `/oncall`\n❓Get help at any time type *help* in a DM with me"
}

const introduction = (heading) => ({
    text: heading,
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
            type: "section",
            text: {
                type: "mrkdwn",
                text: "*2️⃣ Use the _Ask for help_ action.* If you want to raise a particular message to attention of our support team, select `Ask for help` in a message's context menu (click on _More actions_)."
            }
        },
        {
            type: "image",
            title: {
                type: "plain_text",
                text: "message_shortcut",
                emoji: true
            },
            image_url: "https://raw.githubusercontent.com/tumido/slack-first/main/assets/images/message_shortcut.gif",
            alt_text: "message_shortcut"
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "*3️⃣ Use the _Ask for help_ shortcut.* If you want to want to start a chat with our support team immediately, select `Ask for help` from the _Shortcuts_ menu."
            }
        },
        {
            type: "image",
            title: {
                type: "plain_text",
                text: "global_shortcut",
                emoji: true
            },
            image_url: "https://raw.githubusercontent.com/tumido/slack-first/main/assets/images/global_shortcut.gif",
            alt_text: "global_shortcut"
        },
        {
            type: "divider"
        },
        {
            type: "context",
            elements: [help]
        }
    ]
});

const helpMessage: Middleware<SlackCommandMiddlewareArgs> = async ({ say }) => {
    await say({ blocks: [{ type: "section", text: help }] })
}


const introduceOnJoin: Middleware<SlackEventMiddlewareArgs> = async ({ event, client }) => {
    const auth = await client.auth.test()
    if (!auth.ok || auth.user_id != event.user) { return; }

    await client.chat.postMessage({
        channel: event.channel,
        ...introduction("Hi! I'm new here! Let me introduce myself."),
    })
}

const init = (app: App) => {
    app.action('dismiss_message', dismissMessage);
    app.event('member_joined_channel', introduceOnJoin);
    app.message('help', helpMessage);
};
export default init;
