// @ts-nocheck
import { App, Middleware, SlackEventMiddlewareArgs, SlackActionMiddlewareArgs, SlackCommandMiddlewareArgs, SlackShortcutMiddlewareArgs } from '@slack/bolt';

/**
 * Respond to messages containing `?` in `supportChannelId` channel
 * @param param0 Slack payload for message responses
 */
const onCallEphemeralMessage: Middleware<SlackEventMiddlewareArgs<"message">> = async ({ message, client, context }) => {
    if (message.channel !== context.config.supportChannelId) {
        return;
    }

    await client.chat.postEphemeral({
        channel: message.channel,
        user: message.user,
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `Hi <@${message.user}>!\n\nI see you've posted a question in this channel.\n\nDo you want me to tag <@${context.onCallUser}> who's on call duty for today?`,
                },
            },
            {
                type: 'actions',
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: `Yes, please`
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

/**
 * Ask for help action handler
 *
 * Can be triggered as a shortcut or via clicking on a button in a message.
 *
 * If this handler is triggered as a result of a global shortcut by clicking on a button, we want to create new message in support channel and thread and tag in there.
 * If it is triggered on a message, respond on the message directly into a thread.
 * @param param0 Slack payload on message response or on shortcut action
 */
const tagOnCallAction: Middleware<SlackActionMiddlewareArgs<"message"> | SlackShortcutMiddlewareArgs> = async ({ body, payload, ack, client, respond, say, context }) => {
    await ack();

    if (body.type === 'shortcut') {
        // Global shortcut was used and there's no message to respond to
        const message = await client.chat.postMessage({
            channel: context.config.supportChannelId,
            text: `<@${context.onCallUser}>, you've been summoned to help, watch this thread please.`
        });
        if (!message.ok) { return; }

        await client.chat.postMessage({
            channel: message.channel,
            thread_ts: message.ts,
            text: `<@${body.user.id}>, please describe your problem in this thread.`
        });

    } else if (body.message?.thread_ts) {
        // Shortcut was used in a thread, reply to the thread
        await say({
            text: messageText(context.onCallUser, body.user.id),
            thread_ts: body.message.thread_ts
        });

    } else {
        // Triggered as: Shortcut used on a message in a channel or Action in a dialog (button from onCallEphemeralMessage)
        await client.chat.postMessage({
            channel: body.channel.id,
            thread_ts: payload.value || body.message.ts,
            text: messageText(context.onCallUser, body.user_id || body.user.id)
        });

        // Not activated by clicking a button in ephemeral message
        if (!payload.value) { return; }

        await respond({ delete_original: true });
    }
};

/**
 * Respond to a command via a private "Only visible to you" message
 * @param param0 Slack payload to a command event
 */
const tagOnCallCommand: Middleware<SlackCommandMiddlewareArgs> = async ({ ack, respond, context }) => {
    await ack();
    // Respond to the command via ephemeral message
    await respond(`<@${context.onCallUser}> is the support person of the day! Please ask him in a DM or post a message in <#${context.config.supportChannelId}> channel`);
};

/**
 * Subscribe to events for on-call actions
 * @param app Slack App
 */
export const init = (app: App) => {
    app.message('?', onCallEphemeralMessage);
    app.action('tag_on_call_person', tagOnCallAction);
    app.shortcut('tag_on_call_person', tagOnCallAction);
    app.command('/oncall', tagOnCallCommand);
};
export default init;
