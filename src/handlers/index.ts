import onCall from './on-call-actions';
import misc from './misc';
import github from './github';
import { App } from '@slack/bolt';


const init = (app: App) => {
    github(app);
    misc(app);
    onCall(app);
}
export default init;
