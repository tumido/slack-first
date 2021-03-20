// @ts-nocheck
import { App, Middleware, SlackEventMiddlewareArgs, SlackActionMiddlewareArgs, SlackCommandMiddlewareArgs } from '@slack/bolt';

const onCallEphemeralMessage: Middleware<SlackEventMiddlewareArgs<"message">> = async ({ message, client }) => {
    if (message.channel != 'C01RY7X79R9') {
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

const tagOnCallPerson: Middleware<SlackActionMiddlewareArgs<"message">> = async ({ body, payload, ack, client, respond }) => {
    await ack();
    await client.chat.postMessage({ channel: body.channel.id, thread_ts: payload.value, text: `Hey, notice me! <@${body.user.id}>` })
    await respond({ delete_original: true });
};

export const init = (app: App) => {
    app.message('?', onCallEphemeralMessage);
    app.action('tag_on_call_person', tagOnCallPerson);
};
export default init;
