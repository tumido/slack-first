import onCall from './on-call-actions';
import misc from './misc';
import github from './github';
import { App } from '@slack/bolt';

/**
 * Distribute subscription to all handlers in the package
 * @param app Slack App
 */
const init = (app: App): void => {
    github(app);
    misc(app);
    onCall(app);
};
export default init;
