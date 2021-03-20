// @ts-nocheck
import { App, Middleware, SlackActionMiddlewareArgs} from '@slack/bolt';

const dismissMessage: Middleware<SlackActionMiddlewareArgs<"message">> = async ({ ack, respond }) => {
    await ack();
    await respond({ delete_original: true });
};

const init = (app: App) => {
    app.action('dismiss_message', dismissMessage);
};
export default init;
