# <img src="https://raw.githubusercontent.com/tumido/slack-first/main/assets/images/avatar_rounded.png" height="30px"> The First Operator

![depedencies](https://david-dm.org/tumido/slack-first.svg)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=tumido_slack-first&metric=alert_status)](https://sonarcloud.io/dashboard?id=tumido_slack-first)
[![Push](https://github.com/tumido/slack-first/actions/workflows/push.yaml/badge.svg)](https://github.com/tumido/slack-first/actions/workflows/push.yaml)
[![Release](https://github.com/tumido/slack-first/actions/workflows/release.yaml/badge.svg)](https://github.com/tumido/slack-first/actions/workflows/release.yaml)
![GitHub](https://img.shields.io/github/license/tumido/slack-first?color=blue)
![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/tumido/slack-first)

## Build requirements

Local builds:

- [NPM](http://npmjs.com/)
- [NodeJS v14](https://nodejs.org/en/)
- [s2i](https://github.com/openshift/source-to-image) and [Podman](https://podman.io/)

## Configuration

The bot can be configured via a local YAML config file. It watches for changes on this file and reflects the new config internally while running.

Basic settings:

```yaml
supportChannelId: ID_OF_SUPPORT_CHANNEL # e.g. C01RY7X79R9
onCall: person-on-call-duty@example.com # Email address associated with a Slack account
```

### On-call configuration

A person on call duty can be assigned either directly via:

```yaml
onCall: person-on-call-duty@example.com # Email address associated with a Slack account
```

Or a team can be scheduled using various rotation schemes:

```yaml
onCall:
  schedule: daily|weekly
  override: forced-person-on-call-duty@example.com
  members:
    - person1-on-call-duty@example.com
    - person2-on-call-duty@example.com
```

On call members can be specified via `ON_CALL_MEMBERS` environment variable.

Schedule value has to be exactly:

- `daily`: Rotates through members list on daily basis
- `weekly`: Rotates the on-call duty person every week

Seting a value to the `override` property forces duty for this user. This property is optional and if set the bot behaves the same as with `onCall: person-on-call-duty@example.com` settings.

Known limitations:

- Exchanging duties/re-scheduling is possible only via reordering the `members` list or via `override`
- `daily` rotation works with 7 days long weeks only. That means people will be scheduled/rotated for weekends as well.

### Github configuration

By default the bot can file issues to all repositories you grant it access to.

If you wish to restrict it, you can whitelist repositories for this feature declaratively:

```yaml
github:
  issues:
    access:
      - organization/repo
      - organization/repo2
```

Additionally, the labels for newly opened issues can be configured as well:

```yaml
github:
  issues:
    labels:
      - label3
```

## Features

### Use the /oncall command

Type `/oncall` and the bot will tell you who is the dedicated support person on call duty for today.

![oncall_command](https://raw.githubusercontent.com/tumido/slack-first/main/assets/images/oncall_command.png)

### Ask a question at #support

If the bot notices a message in the `#support` channel's main thread, it will offer the sender to tag the person on call duty for the day. The conversation with this person is opened as a thread to the original message.

![support_question](https://raw.githubusercontent.com/tumido/slack-first/main/assets/images/support_question.png)

### Use the Ask for help action

If you want to raise a particular message to attention of the support team, select `Ask for help` in a message's context menu (click on _More actions_).

![message_shortcut](https://raw.githubusercontent.com/tumido/slack-first/main/assets/images/message_shortcut.gif)

### Use the Ask for help shortcut

If you want to start a chat with the support team immediately, select `Ask for help` from the Shortcuts menu. A message thread will be started in the `#support` channel for you.
![global_shortcut](https://raw.githubusercontent.com/tumido/slack-first/main/assets/images/global_shortcut.gif)

### Use the Create issue shortcut

If you want to capture a post or a thread into a GitHub issue, select `Create issue` in a message's context menu (click on _More actions_).

![github_issue](https://raw.githubusercontent.com/tumido/slack-first/main/assets/images/issue.gif)

### Get this feature list

Type `help` in a DM to the bot to receive a full feature list any time.

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
   SLACK_BOT_TOKEN=xoxb-****           # Obtained from Slack config, see Setup Slack application
   SLACK_SIGNING_SECRET=****           # ^
   SLACK_BOT_CONFIG=./dev.config.yaml
   GITHUB_APP_ID=number                # Obtained from Github App config, see Setup Github App
   GITHUB_INSTALLATION_ID=number       # ^
   GITHUB_PRIVATE_KEY=github.pem       # ^
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
podman run \
    --env-file=.env \
    -e SLACK_BOT_CONFIG=/mnt/config.yaml \
    -e GITHUB_PRIVATE_KEY=/mnt/github.pem \
    --mount type=bind,source=dev.config.yaml,dst=/mnt/config.yaml \
    --mount type=bind,source=github.pem,dst=/mnt/github.pem \
    -p 3000:3000 \
    slack-first:latest
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
   3. Set _Options Load URL_ in the _Select Menus_ section to the Bot URL obtained from Ngrok.
   4. Add following shortcuts via _Create New Shortcut_ button:

      | Name         | Scope   | Description                                 | Callback ID             |
      | ------------ | ------- | ------------------------------------------- | ----------------------- |
      | Ask for help | Global  | Get help from a support person on-call duty | `tag_on_call_person`    |
      | Ask for help | Message | Get help from a support person on-call duty | `tag_on_call_person`    |
      | Create issue | Message | Creates an issue from a thread or a message | `open_issue_for_thread` |

   5. _Save Changes_

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

### Setup GitHub Application

1. [Create new GitHub App](https://github.com/settings/apps/new)
2. Fill in a name, homepage URL (can be any valid URL starting with `http://` or `https://`)
3. Deselect _Active_ checkbox in _Webhook_ section
4. In _Repository permissions_ section enable _Read & Write_ for _Issues_ scope.
5. Hit _Create GitHub App_
6. Install your application:
   1. Go to _Install App_ tab
   2. Click _Install_ and confirm granted permissions
   3. In _Repository access_ select all repositories that you want this bot to have access to.
7. Obtain credentials:
   1. Go to your [GitHub Apps](https://github.com/settings/apps) page and click _Edit_
   2. `GITHUB_APP_ID` is _App ID_ in the _About_ section on the _General_ tab
   3. `GITHUB_INSTALLATION_ID`: on _Install App_ tab click the gear button. Check the URL for your installation ID: `https://github.com/settings/installations/THIS_IS_THE_ID`
   4. `GITHUB_PRIVATE_KEY`: On the _General_ tab scroll to _Private Keys_ section and click _Generate a private key_. Save the key to your machine and set path to this file into the `GITHUB_PRIVATE_KEY` variable

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

Use the `manifests/base` folder as your remote kustomize base.

For development purposes the `dev` overlay contains all necessary secrets to access `myfancytestworkspace.slack.com` Slack workspace. Apply via:

```sh
kustomize build --enable_alpha_plugins manifests/overlays/dev | kubectl apply -f -
```
