<img src="https://raw.githubusercontent.com/tumido/slack-first/main/assets/images/avatar_rounded.png" width="100" height="100">

# 1st Operator

![depedencies](https://david-dm.org/tumido/slack-first.svg)

## Build requirements

Local builds:

- [NPM](http://npmjs.com/)
- [NodeJS v14](https://nodejs.org/en/)
- [s2i](https://github.com/openshift/source-to-image) and [Podman](https://podman.io/)

Remote build:

- [AiCoE-CI](https://github.com/AICoE/aicoe-ci) integration

## Configuration

The bot can be configured via a local YAML config file. It watches for changes on this file and reflects the new config internally while running.

Supported settings:

```yaml
supportChannelId: ID_OF_SUPPORT_CHANNEL # e.g. C01RY7X79R9
onCall: person-on-call-duty@example.com # Email address associated with a Slack account
```

## Development setup

### Run bot locally

Locally in development mode runs the bot in a hot reloading mode - automatically recompiling on code changes. The config file is also reloaded on any changes.

1. Install prerequisites: [NPM](http://npmjs.com/) and [Ngrok](https://ngrok.com/)
2. Install all dependencies:

   ```sh
   $ npm install
   ```

3. Start a local ngrok session

   ```sh
   $ ngrok http 3000

   Session Status                online
   Session Expires               1 hour, 59 minutes
   Update                        update available (version 2.3.35,Ctrl-U to update)
   Version                       2.3.35
   Region                        United States (us)
   Web Interface                 http://127.0.0.1:4040
   Forwarding                    http://091a516d41fc.ngrok.io -> http://localhost:3000
   Forwarding                    https://091a516d41fc.ngrok.io -> http://localhost:3000
   ```

   Note the `https://...` address for Forwarding. We will use this address with `/slack/events` endpoint as **Bot URL**.
   E.g. `https://091a516d41fc.ngrok.io/slack/events`.

   Please remember that the Ngrok session expires every 2 hours. After this time you have to renew it and you will receive new DNS name, therefore a new Bot URL.

4. Prepare local environment:

   ```sh
   cat <<EOF > .env
   SLACK_BOT_TOKEN=xoxb-****  # Obtained from Slack config, see Setup Slack application
   SLACK_SIGNING_SECRET=****  # Obtained from Slack config, see Setup Slack application
   SLACK_BOT_CONFIG=./dev.config.yaml
   EOF
   ```

5. Create local configuration file at `./dev.config.yaml`
6. Start local dev instance

   ```sh
   $ npm run dev

   [0] 2:30:21 PM - Starting compilation in watch mode...
   [0]
   [1] ⚡️ Bolt app is running!
   [1] [nodemon] restarting due to changes...
   [1] [nodemon] restarting due to changes...
   [1] [nodemon] restarting due to changes...
   [1] [nodemon] starting `node dist/app.js`
   [0]
   [0] 2:30:23 PM - Found 0 errors. Watching for file changes.
   [1] [nodemon] restarting due to changes...
   [1] [nodemon] restarting due to changes...
   [1] [nodemon] starting `node dist/app.js`
   [1] ⚡️ Bolt app is running!
   ```

### Run in container

If you desire to run the bot locally in container, follow the [Run bot locally](#run-bot-locally) guide up until the last step. Instead of the last step run:

```sh
npm run s2i:build
podman run --env-file=.env -e SLACK_BOT_CONFIG=/mnt/config.yaml --mount type=bind,source=dev.config.yaml,dst=/mnt/config.yaml -p 3000:3000 slack-first:latest
```

This launch method uses `npm start` command which runs the production build of the bot - Hot reloading is disabled.

### Setup Slack application

1. Create your own test Slack workspace.
2. Create a new [Slack application](https://api.slack.com/apps)
3. Set subscriptions on _Event Subscriptions_ tab:

   1. Toggle _Enable Events_
   2. Set _Request URL_ to the Bot URL obtained from Ngrok.
   3. Expand the _Subscribe bot to events_ and add following subscriptions:
      - `member_joined_channel`
      - `message.channels`
      - `message.groups`
      - `message.im`
      - `message.mpim`
   4. _Save Changes_

4. Enable interactivity at _Interactivity & Shortcuts_ tab:

   1. Toggle _Interactivity_
   2. Set _Request URL_ to the Bot URL obtained from Ngrok.
   3. Add following shortcuts via _Create New Shortcut_ button:

      | Name         | Scope   | Description                                 | Callback ID          |
      | ------------ | ------- | ------------------------------------------- | -------------------- |
      | Ask for help | Global  | Get help from a support person on-call duty | `tag_on_call_person` |
      | Ask for help | Message | Get help from a support person on-call duty | `tag_on_call_person` |

   4. _Save Changes_

5. Setup commands on _Slash Commands_ tab via _Create New Command_ dialog:

   | Command   | Request URL        | Short Description                  | User hint |
   | --------- | ------------------ | ---------------------------------- | --------- |
   | `/oncall` | Bot URL from Ngrok | Tag support person on on-call duty | n/a       |

6. Set additional permissions for the app on _OAuth & Permissions_ tab (most of them should already be added, please check the list thoroughly) and _Save Changes_ afterwards:

   - `channels:history`
   - `channels:read`
   - `chat:write`
   - `commands`
   - `groups:history`
   - `groups:read`
   - `im:history`
   - `mpim:history`
   - `users:read`
   - `users:read.email`

7. Obtain credentials:

   1. `SLACK_BOT_TOKEN` can be found on _OAuth & Permissions_ tab in the _Bot User OAuth Token_ field and starts with `xoxb-`
   2. `SLACK_SIGNING_SECRET` is the _Signing Secret_ found on _Basic Info_ tab

8. Reinstall your application to the workspace to propagate OAuth permission changes.

**Note: Every time the Ngrok session is rotated, the Bot URL changes - this change has to be reflected in Slack App configuration**. Please change the Bot URL in [Slack application](https://api.slack.com/apps) web UI:

1. _Event Subscriptions_ tab - _Request URL_. (The bot must be already running, otherwise Slack won't let you change this value.)
2. _Interactivity & Shortcuts_ tab - _Request URL_.
3. _Slash Commands_ tab - edit each command.

## Deployment

### Create application container

1. Build the image

   ```sh
   npm run s2i:build
   ```

2. Tag the container image and push to repo

   ```sh
   podman tag slack-first quay.io/operate-first/slack-bot
   podman push quay.io/operate-first/slack-bot
   ```

### Deploy in Kubernetes

```sh
kustomize build manifests | kubectl apply -f -
```
