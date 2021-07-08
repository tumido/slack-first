import { Middleware, AnyMiddlewareArgs } from '@slack/bolt';
import { getOnCallUser, getConfig } from '../../helpers';

/**
 * Middleware used to fetch the config file content and make it available to message handlers.
 * @param param0 Arguments passed to Slack middleware
 */
export const configMiddleware: Middleware<AnyMiddlewareArgs> = async ({
    context,
    next,
    client,
}) => {
    context.config = getConfig();

    // Translate onCall email into a user ID
    const onCallUser = getOnCallUser();
    if (onCallUser) {
        const user = await client.users.lookupByEmail({
            email: onCallUser.slack,
        });
        if (user.ok && user.user) {
            context.onCallUser = user.user.id;
        }
    }

    if (next) {
        await next();
    }
};
