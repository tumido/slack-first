import { expect } from 'chai';
import rewire from 'rewire';

import { MentionReplace } from './github';
import { Config } from '../middleware/config';

const github = rewire('./github');

describe('github', () => {
    describe('expandMentions', () => {
        let expandMentions: (
            text: string,
            mentions: Array<MentionReplace>
        ) => string;

        beforeEach(() => {
            expandMentions = github.__get__('expandMentions');
        });

        it('should expand mention', () => {
            const mention = [{ src: /bcd/, dst: 'xyz' }];
            expect(expandMentions('abcde', mention)).equal('axyze');
        });

        it('should ignore not included mentions', () => {
            const mention = [{ src: /bcd/, dst: 'xyz' }];
            expect(expandMentions('abce', mention)).equal('abce');
        });

        it('should return original', () => {
            expect(expandMentions('abcde', [])).equal('abcde');
        });

        it('should not fail on empty text', () => {
            const mention = [{ src: /bcd/, dst: 'xyz' }];
            expect(expandMentions('', mention)).equal('');
        });
    });

    // describe('resolveUserMentions', () => {

    //     let resolveUserMentions: (client: WebClient, messages: Array<unknown>) => Promise<Array<MentionReplace>>;

    //     beforeEach(() => {
    //         resolveUserMentions = github.__get__('resolveUserMentions');
    //     });

    //     it('should expand user mentions')
    // });

    describe('isAllowed', () => {
        let isAllowed: (org: string, repo: string, config: Config) => boolean;
        let configStub: Config;

        beforeEach(() => {
            isAllowed = github.__get__('isAllowed');
            configStub = { onCall: 'a', supportChannelId: 'b' };
        });

        it('should be truthy if no config', () => {
            expect(isAllowed('org', 'repo', configStub)).to.be.true;
        });

        it('should be truthy for allowed repo', () => {
            configStub.github = { issues: { access: ['org/repo'] } };
            expect(isAllowed('org', 'repo', configStub)).to.be.true;
        });

        it('should be falsy for repo which is not explicitely allowed', () => {
            configStub.github = { issues: { access: ['org/repo'] } };
            expect(isAllowed('org', 'different-repo', configStub)).to.be.false;
        });
    });
});
