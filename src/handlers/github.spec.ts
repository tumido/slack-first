import { expect } from 'chai';
import rewire from 'rewire';

import { MentionReplace } from './github';

const github = rewire('./github');

describe("github", () => {
    describe('expandMentions', () => {

        let expandMentions: (text: string, mentions: Array<MentionReplace>) => string;

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
});
