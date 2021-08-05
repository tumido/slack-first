// @ts-nocheck
import { App, Middleware, SlackEventMiddlewareArgs } from '@slack/bolt';

/**
 * React to all messages in support channel linking FAQs
 * @param param0 Slack payload for command action
 */
const faqMessage: Middleware<SlackEventMiddlewareArgs<'message'>> = async ({
    say,
    message,
    context,
}) => {
    if (
        message.channel !== context.config.supportChannelId ||
        message.thread_ts ||
        message.subtype ||
        !message.text ||
        !context.config.faqs
    ) {
        return;
    }

    const topics = context.config.faqs
        .filter(({ regexp }) => message.text.match(regexp))
        .map(({ name, url }) => `<${url}|FAQ for ${name}>`);

    if (!topics.length) {
        return;
    }
    const greetings = `Hey <@${message.user}>! `;
    const content =
        topics.length === 1
            ? `Have you seen ${topics[0]}?`
            : `Have you seen our FAQ for these topics?\n\n${topics
                  .map((i) => '• ' + i)
                  .join('\n')}`;

    await say({
        text: greetings + content,
        thread_ts: message.ts,
        unfurl_links: false,
    });
};

/**
 * Subscribe to events for faq actions
 * @param app Slack App
 */
export const faq = (app: App): void => {
    app.message(faqMessage);
};
export default faq;
