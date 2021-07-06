import { expect } from 'chai';

import { githubIssueTemplate, githubIssueTemplateOptions } from './modal';

type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>;
};

describe('modal', () => {
    describe('githubIssueTemplate', () => {
        let options: RecursivePartial<githubIssueTemplateOptions>;

        beforeEach(() => {
            options = {
                title: 'abc',
                body: 'def',
                callbackId: 'ghi',
                event: {
                    channel: { id: '123' },
                    message: {},
                    message_ts: '456',
                },
                extraBlocks: [],
            };
        });

        it('should render modal', () => {
            const modal = githubIssueTemplate(
                options as githubIssueTemplateOptions
            );
            expect(modal).to.include({ type: 'modal', callback_id: 'ghi' });
            expect(modal).to.nested.include({
                'title.text': 'abc',
                'blocks[0].element.initial_value': 'def',
            });
        });

        it('should render private metadata from message', () => {
            const modal = githubIssueTemplate(
                options as githubIssueTemplateOptions
            );
            expect(modal).to.include({ private_metadata: '456|123' });
        });

        it('should render private metadata from thread message', () => {
            options.event = {
                channel: { id: '123' },
                message: { thread_ts: '789' },
                message_ts: '456',
            } as Record<string, Record<string, string> | string>;
            const modal = githubIssueTemplate(
                options as githubIssueTemplateOptions
            );
            expect(modal).to.include({ private_metadata: '789|123' });
        });

        it('should include extraBlocks before body', () => {
            options.extraBlocks = [1, 2, 3];

            const modal = githubIssueTemplate(
                options as githubIssueTemplateOptions
            );
            expect(modal.blocks).to.have.lengthOf(4);
            expect((modal.blocks as Array<unknown>)[3]).to.include({
                block_id: 'body',
            });
        });
    });
});
