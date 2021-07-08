import { healthCheck } from './helpers';
import { slackApp } from './slack';
import { githubApp } from './github';

healthCheck();

const [app, receiver] = slackApp();

githubApp(receiver);

// Mount additional endpoint for health check
receiver.router.get('/healthz', (_req, res) => res.status(200).send('OK'));

// Start your app
(async () => {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    await app.start(port);
    console.log('⚡️ Bolt app is running!');
})();
