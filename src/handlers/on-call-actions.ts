// @ts-nocheck
import { App, Middleware, SlackEventMiddlewareArgs, SlackActionMiddlewareArgs, SlackCommandMiddlewareArgs, SlackShortcutMiddlewareArgs } from '@slack/bolt';
import { onCallContext } from '../middleware/config';

const supportChannelId = 'C01RY7X79R9';

const onCallEphemeralMessage: Middleware<SlackEventMiddlewareArgs<"message">> = async ({ message, client }) => {
    if (message.channel != supportChannelId) {
        return;
    };

    await client.chat.postEphemeral({
        channel: message.channel,
        user: message.user,
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `Hi <@${message.user}>!\n\nI see you've posted a question in this channel.\n\nDo you want me to tag the person who's on call duty for today?`,
                },
            },
            {
                type: 'actions',
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Please tag the right person for me"
                        },
                        action_id: "tag_on_call_person",
                        style: "primary",
                        value: message.ts
                    },
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Dismiss"
                        },
                        action_id: "dismiss_message",
                    }
                ]
            },
        ],
        text: `Hi <@${message.user}>! Do you want me to tag the person on call duty for today?`
    });
};

const messageText = (support, user) => `Hey <@${support}>, can you please help <@${user}>?`;


const tagOnCallAction: Middleware<SlackActionMiddlewareArgs<"message"> | SlackShortcutMiddlewareArgs> = async ({ body, payload, ack, client, respond, say, context }) => {
    await ack();

    if (!body.message && !payload.value) {
        // Global shortcut was used and there's no message to respond to
        const message = await client.chat.postMessage({
            channel: supportChannelId,
            text: `<@${context.onCallUser}>, you've been summoned to help, watch this thread please.`
        })
        if (!message.ok) { return; }

        await client.chat.postMessage({
            channel: message.channel,
            thread_ts: message.ts,
            text: `<@${body.user.id}>, please describe your problem in this thread.`
        })

    } else if (body.message?.thread_ts) {
        // Shortcut was used in a thread, reply to the thread
        await say({
            text: messageText(context.onCallUser, body.user.id),
            thread_ts: body.message.thread_ts
        })

    } else {
        // Triggered as: Shortcut used on a message in a channel or Action in a dialog (button from onCallEphemeralMessage)
        await client.chat.postMessage({
            channel: body.channel.id,
            thread_ts: payload.value || body.message.ts,
            text: messageText(context.onCallUser, body.user_id || body.user.id)
        })

        // Not activated by clicking a button in ephemeral message
        if (!payload.value) { return; }

        await respond({ delete_original: true });
    }

};

const tagOnCallCommand: Middleware<SlackCommandMiddlewareArgs> = async ({ ack, respond, context }) => {
    await ack();
    // Respond to the command via ephemeral message
    await respond(`<@${context.onCallUser}> is the support person of the day! Please ask him in a DM or post a message in <#${supportChannelId}> channel`);
}

export const init = (app: App) => {
    app.message('?', onCallEphemeralMessage);
    app.action('tag_on_call_person', onCallContext, tagOnCallAction);
    app.shortcut('tag_on_call_person', onCallContext, tagOnCallAction);
    app.command('/oncall', onCallContext, tagOnCallCommand);
};
export default init;
