import onCall from './on-call-actions';
import misc from './misc';
import { App } from '@slack/bolt';


const init = (app: App) => {
    misc(app);
    onCall(app);
}
export default init;
