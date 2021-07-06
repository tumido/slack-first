export const healthCheck = (): void => {
    try {
        if (!process.env.SLACK_BOT_TOKEN) {
            throw Error('SLACK_BOT_TOKEN: Token not set');
        }
        if (!process.env.SLACK_SIGNING_SECRET) {
            throw Error('SLACK_SIGNING_SECRET: Secret not set');
        }
        if (!process.env.SLACK_BOT_CONFIG) {
            throw Error('SLACK_BOT_CONFIG: Path to config not set');
        }
        if (!process.env.GITHUB_APP_ID) {
            throw Error('GITHUB_APP_ID: App ID not set');
        }
        if (!process.env.GITHUB_PRIVATE_KEY) {
            throw Error('GITHUB_PRIVATE_KEY: Path to private key not set');
        }
        if (!process.env.GITHUB_INSTALLATION_ID) {
            throw Error('GITHUB_INSTALLATION_ID: Path to private key not set');
        }
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
