// @ts-nocheck
import { Middleware, AnyMiddlewareArgs } from '@slack/bolt';

/**
 * Middleware used to fetch the config file content and make it available to message handlers.
 * @param param0 Arguments passed to Slack middleware
 */
export const configMiddleware: Middleware<AnyMiddlewareArgs> = async ({
    context,
    next,
    client,
}) => {
    context.config = config;

    // Translate onCall email into a user ID
    const onCallUser = getOnCallUser(context.config.onCall);
    if (onCallUser) {
        const user = await client.users.lookupByEmail({
            email: onCallUser.slack,
        });
        if (user.ok) {
            context.onCallUser = user.user.id;
        }
    }

    if (next) {
        await next();
    }
};
