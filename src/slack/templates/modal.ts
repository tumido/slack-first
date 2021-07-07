import { MessageShortcut } from '@slack/bolt';

export type githubIssueTemplateOptions = {
    title: string;
    body: string;
    event: MessageShortcut; // Change once types are available
    callbackId: string;
    extraBlocksAbove?: Array<unknown>;
    extraBlocksBelow?: Array<unknown>;
};

/**
 * Modal template for Git Hub issues
 * @param param0 Options for issue modal
 * @returns Block Kit object for Modal type surface view
 */
export const githubIssueTemplate = ({
    title,
    body,
    event,
    callbackId,
    extraBlocksAbove,
    extraBlocksBelow,
}: githubIssueTemplateOptions): Record<string, unknown> => {
    const privateMetadata = `${event.message.thread_ts || event.message_ts}|${
        event.channel.id
    }`;

    return {
        type: 'modal',
        callback_id: callbackId,
        private_metadata: privateMetadata,
        title: {
            type: 'plain_text',
            text: title,
        },
        blocks: [
            ...(extraBlocksAbove || []),
            {
                type: 'input',
                block_id: 'body',
                label: {
                    type: 'plain_text',
                    text: 'Issue body',
                },
                element: {
                    type: 'plain_text_input',
                    action_id: 'body',
                    initial_value: body,
                    multiline: true,
                },
            },
            ...(extraBlocksBelow || []),
        ],
        submit: {
            type: 'plain_text',
            text: 'Submit',
        },
    };
};
