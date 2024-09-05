import { tokenParser } from './token-parser';

(async () => {
    test('LeftOverTerms', () => {
        const search = new tokenParser().parse('hello world');

        expect(Object.keys(search)).toStrictEqual(['leftOverTerms']);
        expect(search.leftOverTerms).toBe('hello world');
    });

    test('Tokens', () => {
        const search = new tokenParser().parse('platform:ps5 type:trophy-guide');

        expect(Object.keys(search)).toStrictEqual(['leftOverTerms', 'platform', 'type']);
        expect(search.leftOverTerms).toBe('');
        expect(search.platform).toBe('ps5');
        expect(search.type).toBe('trophy-guide');
    });

    test('Tokens (built in order received)', () => {
        const search = new tokenParser().parse('type:trophy-guide platform:ps5');

        expect(Object.keys(search)).toStrictEqual(['leftOverTerms', 'type', 'platform']); // type, platform now
        expect(search.leftOverTerms).toBe('');
        expect(search.platform).toBe('ps5');
        expect(search.type).toBe('trophy-guide');
    });

    test('Tokens + LeftOverTerms at the beginning', () => {
        const search = new tokenParser().parse('ratchet and clank platform:ps5 type:trophy-guide');

        expect(Object.keys(search)).toStrictEqual(['leftOverTerms', 'platform', 'type']);
        expect(search.leftOverTerms).toBe('ratchet and clank');
        expect(search.platform).toBe('ps5');
        expect(search.type).toBe('trophy-guide');
    });

    test('Tokens + LeftOverTerms at the end', () => {
        const search = new tokenParser().parse('platform:ps5 type:trophy-guide ratchet and clank');

        expect(Object.keys(search)).toStrictEqual(['leftOverTerms', 'platform', 'type']);
        expect(search.leftOverTerms).toBe('ratchet and clank');
        expect(search.platform).toBe('ps5');
        expect(search.type).toBe('trophy-guide');
    });

    test('LeftOverTerms spread around tokens', () => {
        const search = new tokenParser().parse('ratchet and platform:ps5 type:trophy-guide clank');

        expect(Object.keys(search)).toStrictEqual(['leftOverTerms', 'platform', 'type']);
        expect(search.leftOverTerms).toBe('ratchet and clank');
        expect(search.platform).toBe('ps5');
        expect(search.type).toBe('trophy-guide');
    });

    test('Parses only valid tokens', () => {
        const search = new tokenParser().parse('ratchet and clank: a rift apart', ['platform', 'title']);

        expect(Object.keys(search)).toStrictEqual(['leftOverTerms']);
        expect(search.leftOverTerms).toBe('ratchet and clank: a rift apart');
    });
})();
