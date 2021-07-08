import { Octokit } from '@octokit/rest';
import { Webhooks } from '@octokit/webhooks';
import {
    IssuesLabeledEvent,
    IssueCommentCreatedEvent,
    IssueCommentEditedEvent,
} from '@octokit/webhooks-types';
import { OctokitResponse } from '@octokit/types';
import { getOnCallUser } from '../helpers';
import { ASSIGN_TO_ONCALL_COMMAND, ASSIGN_TO_ONCALL_LABEL } from './constants';

/**
 * Assign on-call person to an issue via GitHub API
 * @param github Github Octokit application providing REST API access
 * @param payload Webhook event payload
 * @returns A promise which resolves to an OctokitResponse instance
 */
const AssignToOnCall = async (
    github: Octokit,
    payload:
        | IssuesLabeledEvent
        | IssueCommentEditedEvent
        | IssueCommentCreatedEvent
): Promise<OctokitResponse<unknown> | void> => {
    const user = getOnCallUser();
    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;
    const issue_number = payload.issue.number;
    if (!user) {
        return;
    }

    const result = await github.issues.addAssignees({
        owner,
        repo,
        issue_number,
        assignees: [user.github],
    });

    if (result.status !== 201) {
        console.error(
            `Unable to assign oncall user to issue ${owner}/${repo}#${issue_number}`,
            result
        );
    }

    return result;
};

/**
 * Handle label assignment
 *
 * Triggers when a label is added to any issue. If the label matches in text, trigger action.
 * @param github Octokit application
 * @param payload Event payload
 */
const handleLabel = async (github: Octokit, payload: IssuesLabeledEvent) => {
    if (payload?.label?.name === ASSIGN_TO_ONCALL_LABEL) {
        await AssignToOnCall(github, payload);
    }
};

/**
 * Handle comment
 *
 * Triggers when a comment is created or updated. If the content matches in text to supported
 * command, trigger action.
 * @param github Octokit application
 * @param payload Event payload
 */
const handleComment = async (
    github: Octokit,
    payload: IssueCommentEditedEvent | IssueCommentCreatedEvent
) => {
    if (payload.comment.body.toLowerCase().includes(ASSIGN_TO_ONCALL_COMMAND)) {
        await AssignToOnCall(github, payload);
    }
};

const onCall = (github: Octokit, webhooks: Webhooks): void => {
    webhooks.on('issues.labeled', async ({ payload }) =>
        handleLabel(github, payload)
    );
    webhooks.on('issue_comment.created', async ({ payload }) =>
        handleComment(github, payload)
    );
    webhooks.on('issue_comment.edited', async ({ payload }) =>
        handleComment(github, payload)
    );
};

export default onCall;
