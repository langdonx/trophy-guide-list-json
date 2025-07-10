import { filter } from './guide-filter';
import type { Guide } from '../types/guides-v2';
import {
    SOURCE_PSNP,
    SOURCE_KNOEF,
    SOURCE_PLATGET,
    SOURCE_PLAYSTATIONTROPHIES,
    SOURCE_POWERPYX,
    IS_TROPHY_GUIDE,
    IS_DLC,
    PLATFORM_PC,
    PLATFORM_PS3,
    PLATFORM_PS4,
    PLATFORM_PS5,
    PLATFORM_VITA,
    PLATFORM_VR,
    HAS_BUGGY_TROPHIES,
    HAS_ONLINE_TROPHIES,
    HAS_MISSABLE_TROPHIES,
} from '../types/attributes-v2';

const sampleGuideDataForAuthor = getSampleGuideDataForAuthor();
const sampleGuideDataForDlcAndPlatinum = getSampleGuideDataForDlcAndPlatinum();
const sampleGuideDataForOrder = getSampleGuideDataForOrder();
const sampleGuideDataForOrderMulti = getSampleGuideDataForOrderMulti();
const sampleGuideDataForPlatform = getSampleGuideDataForPlatform();
const sampleGuideDataForRatingsAndAttributes = getSampleGuideDataForRatingsAndAttributes();
const sampleGuideDataForSource = getSampleGuideDataForSource();
const sampleGuideDataForText = getSampleGuideDataForText();
const sampleGuideDataForTrophies = getSampleGuideDataForTrophies();
const sampleGuideDataForType = getSampleGuideDataForTypeAndAttributes();

// TODO platinum rate, completion rate (when data is available)

function genericTest(_: string, search: string, data: Record<string, Guide>, expectedTitles: string[]) {
    const guides = filter(data, search);
    expect(guides.map(guide => guide.n)).toStrictEqual(expectedTitles);
};

(async () => {
    test('Guide Returns Expected Data', () => {
        const guideData: Record<string, Guide> = {
            '123': {
                a: SOURCE_PSNP | PLATFORM_PC | PLATFORM_VITA,
                u: ['hello', 'world'],
                d: 666,
                r: [1, 2, 3],
                n: 'Greatest Guide Ever',
            },
        };

        const guides = filter(guideData, '');

        expect(guides).toStrictEqual([{
            a: SOURCE_PSNP | PLATFORM_PC | PLATFORM_VITA,
            u: ['hello', 'world'],
            id: '123', // verify id was injected properly
            d: 666,
            r: [1, 2, 3],
            n: 'Greatest Guide Ever',
        }]);
    });

    // raw text
    const textScenarios = [
        ['Full Match', 'PSNProfiles: Writing a Guide', sampleGuideDataForText, ['PSNProfiles: Writing a Guide']],
        ['Partial Match', 'Rules & Disputes', sampleGuideDataForText, ['PSNProfiles: Leaderboard Rules & Disputes']],
        ['Partial Match (Case Insensitive)', 'psnp', sampleGuideDataForText, ['PSNProfiles: Writing a Guide', 'PSNProfiles: Leaderboard Rules & Disputes']],
        ['Colons in Game Names', 'Ratchet & Clank: Full Frontal Assault Trophy Guide', sampleGuideDataForText, ['Ratchet & Clank: Full Frontal Assault Trophy Guide']],
        ['Punctuation Matches', 'Doom: The Dark Ages, Inc.', sampleGuideDataForText, ['Doom The Dark Ages Inc']],
        ['Punctuation Matches Reverse', 'Ratchet & Clank Full Frontal Assault Trophy Guide', sampleGuideDataForText, ['Ratchet & Clank: Full Frontal Assault Trophy Guide']],
        ['Quotations', 'Onimusha 2: Samurai’s Destiny Trophy', sampleGuideDataForText, ['Onimusha 2: Samurai\'s Destiny Trophy Guide', 'Onimusha 2: Samurai’s Destiny Trophy Guide & Roadmap']],
        ['Quotations Reverse', 'Onimusha 2 Samurais', sampleGuideDataForText, ['Onimusha 2: Samurai\'s Destiny Trophy Guide', 'Onimusha 2: Samurai’s Destiny Trophy Guide & Roadmap']],
    ];
    describe('Basic Search', () => test.each(textScenarios)('%s - `%s`', genericTest));

    // author:
    const authorScenarios = [
        ['Full Match', 'author:Michael2399', sampleGuideDataForAuthor, ['Pato Box Trophy Guide']],
        ['Full Match (Case Insensitive)', 'author:michael2399', sampleGuideDataForAuthor, ['Pato Box Trophy Guide']],
        ['Partial Match', 'author:ichael239', sampleGuideDataForAuthor, ['Pato Box Trophy Guide']],
        ['Multiple', 'author:langdon,Michael2399', sampleGuideDataForAuthor, ['Pato Box Trophy Guide']],
        ['Multiple (Out Of Order)', 'author:Michael2399,langdon', sampleGuideDataForAuthor, ['Pato Box Trophy Guide']],
        ['Multiple (Partial)', 'author:ichael239,angdo', sampleGuideDataForAuthor, ['Pato Box Trophy Guide']],
        ['Multiple (Mismatched)', 'author:HealedFiend13,Michael2399', sampleGuideDataForAuthor, []],
        ['Exclusions', 'author:-langdon', sampleGuideDataForAuthor, ['Mortal Kombat Trophy Guide', 'PSNProfiles: Leaderboard Rules & Disputes']],
        ['Exclusives (Single)', 'author:+langdon', sampleGuideDataForAuthor, ['ScourgeBringer Trophy Guide']],
        ['Exclusives (Multiple)', 'author:+langdon,+HealedFiend13', sampleGuideDataForAuthor, ['Witchcrafty Trophy Guide']],
        ['Non-Exclusives', 'author:langdon,HealedFiend13', sampleGuideDataForAuthor, ['Witchcrafty Trophy Guide', 'Fake Guide']],
    ];
    describe('Author Search', () => test.each(authorScenarios)('%s - `%s`', genericTest));

    // buggy:
    const buggyScenarios = [
        ['Yes', 'buggy:yes', sampleGuideDataForRatingsAndAttributes, ['Rating 1', 'Rating 4', 'Rating 5', 'Rating 7']],
        ['No', 'buggy:no', sampleGuideDataForRatingsAndAttributes, ['Rating 2', 'Rating 3', 'Rating 6', 'Rating 8', 'Rating 9', 'Rating 10']],
        ['Garbage Text (Ignored)', 'buggy:garbage', sampleGuideDataForRatingsAndAttributes, ['Rating 1', 'Rating 2', 'Rating 3', 'Rating 4', 'Rating 5', 'Rating 6', 'Rating 7', 'Rating 8', 'Rating 9', 'Rating 10']],
    ];
    describe('Buggy Search', () => test.each(buggyScenarios)('%s - `%s`', genericTest));

    // difficulty:
    const difficultyScenarios = [
        ['Equals', 'difficulty:3', getSampleGuideDataForRatingsAndAttributes(0), ['Rating 3']],
        ['Greater Than', 'difficulty:>8', getSampleGuideDataForRatingsAndAttributes(0), ['Rating 9', 'Rating 10']],
        ['Less Than', 'difficulty:<3', getSampleGuideDataForRatingsAndAttributes(0), ['Rating 1', 'Rating 2']],
        ['Range', 'difficulty:4-6', getSampleGuideDataForRatingsWithDecimals(), ['4.9', '5.9', '6.9']],
        ['Empty', 'difficulty:', sampleGuideDataForRatingsAndAttributes, ['Rating 1', 'Rating 2', 'Rating 3', 'Rating 4', 'Rating 5', 'Rating 6', 'Rating 7', 'Rating 8', 'Rating 9', 'Rating 10']],
        ['Garbage', 'difficulty:garbage', sampleGuideDataForRatingsAndAttributes, ['Rating 1', 'Rating 2', 'Rating 3', 'Rating 4', 'Rating 5', 'Rating 6', 'Rating 7', 'Rating 8', 'Rating 9', 'Rating 10']],

    ];
    describe('Difficulty Search', () => test.each(difficultyScenarios)('%s - `%s`', genericTest));

    // dlc:
    const dlcScenarios = [
        ['Yes', 'dlc:yes', sampleGuideDataForDlcAndPlatinum, ['I Am A DLC Guide']],
        ['No', 'dlc:no', sampleGuideDataForDlcAndPlatinum, ['I Am A Platinum Trophy Guide', 'I Am A Trophy Guide Without A Platinum']],
        ['Garbage Text (Ignored)', 'dlc:garbage', sampleGuideDataForDlcAndPlatinum, ['I Am A Platinum Trophy Guide', 'I Am A Trophy Guide Without A Platinum', 'I Am A DLC Guide']],
    ];
    describe('DLC Search', () => test.each(dlcScenarios)('%s - `%s`', genericTest));

    // hours:
    const hoursScenarios = [
        ['Equals', 'hours:1', getSampleGuideDataForRatingsAndAttributes(2), ['Rating 1']],
        ['Greater Than', 'hours:>9', getSampleGuideDataForRatingsAndAttributes(2), ['Rating 10']],
        ['Less Than', 'hours:<2', getSampleGuideDataForRatingsAndAttributes(2), ['Rating 1']],
        ['Range', 'hours:4-6', getSampleGuideDataForRatingsWithDecimals(), ['4.9', '5.9', '6.9']],
        ['Empty', 'hours:', sampleGuideDataForRatingsAndAttributes, ['Rating 1', 'Rating 2', 'Rating 3', 'Rating 4', 'Rating 5', 'Rating 6', 'Rating 7', 'Rating 8', 'Rating 9', 'Rating 10']],
        ['Garbage', 'hours:garbage', sampleGuideDataForRatingsAndAttributes, ['Rating 1', 'Rating 2', 'Rating 3', 'Rating 4', 'Rating 5', 'Rating 6', 'Rating 7', 'Rating 8', 'Rating 9', 'Rating 10']],
    ];
    describe('Hours Search', () => test.each(hoursScenarios)('%s - `%s`', genericTest));

    // missable:
    const missableScenarios = [
        ['Yes', 'missable:yes', sampleGuideDataForRatingsAndAttributes, ['Rating 3', 'Rating 5', 'Rating 6', 'Rating 7']],
        ['No', 'missable:no', sampleGuideDataForRatingsAndAttributes, ['Rating 1', 'Rating 2', 'Rating 4', 'Rating 8', 'Rating 9', 'Rating 10']],
        ['Garbage Text (Ignored)', 'missable:garbage', sampleGuideDataForRatingsAndAttributes, ['Rating 1', 'Rating 2', 'Rating 3', 'Rating 4', 'Rating 5', 'Rating 6', 'Rating 7', 'Rating 8', 'Rating 9', 'Rating 10']],
    ];
    describe('Missable Search', () => test.each(missableScenarios)('%s - `%s`', genericTest));

    // online:
    const onlineScenarios = [
        ['Yes', 'online:yes', sampleGuideDataForRatingsAndAttributes, ['Rating 2', 'Rating 4', 'Rating 6', 'Rating 7']],
        ['No', 'online:no', sampleGuideDataForRatingsAndAttributes, ['Rating 1', 'Rating 3', 'Rating 5', 'Rating 8', 'Rating 9', 'Rating 10']],
        ['Garbage Text (Ignored)', 'online:garbage', sampleGuideDataForRatingsAndAttributes, ['Rating 1', 'Rating 2', 'Rating 3', 'Rating 4', 'Rating 5', 'Rating 6', 'Rating 7', 'Rating 8', 'Rating 9', 'Rating 10']],
    ];
    describe('Online Search', () => test.each(onlineScenarios)('%s - `%s`', genericTest));

    // order:
    const ascending = ['A Guide', 'D Guide', 'Y Guide', 'Z Guide'];
    const descending = ['Z Guide', 'Y Guide', 'D Guide', 'A Guide'];
    const ratingMissing = ['Y Guide', 'D Guide', 'A Guide', 'Z Guide']; // no rating, so Z stays at the end
    const orderScenarios = [
        ['Default Order (Published Descending)', '', sampleGuideDataForOrder, descending],
        ['Title', 'order:title', sampleGuideDataForOrder, ascending],
        ['Title (Reverse)', 'order:-title', sampleGuideDataForOrder, descending],
        ['Difficulty', 'order:difficulty', sampleGuideDataForOrder, ascending],
        ['Difficulty (Reverse)', 'order:-difficulty', sampleGuideDataForOrder, ratingMissing],
        ['Playthroughs', 'order:playthroughs', sampleGuideDataForOrder, ascending],
        ['Playthroughs (Reverse)', 'order:-playthroughs', sampleGuideDataForOrder, ratingMissing],
        ['Hours', 'order:hours', sampleGuideDataForOrder, ascending],
        ['Hours (Reverse)', 'order:-hours', sampleGuideDataForOrder, ratingMissing],
        ['Published', 'order:published', sampleGuideDataForOrder, ascending],
        ['Published (Reverse)', 'order:-published', sampleGuideDataForOrder, descending],
        ['Multiple #1', 'order:-difficulty,hours', sampleGuideDataForOrderMulti, ['B Hard/Short', 'A Hard/Long', 'D Easy/Short', 'C Easy/Long']],
        ['Multiple #2', 'order:playthroughs,difficulty,-title', sampleGuideDataForOrderMulti, ['D Easy/Short', 'C Easy/Long', 'B Hard/Short', 'A Hard/Long',]],
        ['Multiple #3 (Fallback when all values are same)', 'order:playthroughs', sampleGuideDataForOrderMulti, ['A Hard/Long', 'B Hard/Short', 'C Easy/Long', 'D Easy/Short']],
    ];
    describe('Order Search', () => test.each(orderScenarios)('%s - `%s`', genericTest));

    // platform:
    const platformScenarios = [
        ['Exact', 'platform:ps5', sampleGuideDataForPlatform, ['Witchcrafty Trophy Guide']],
        ['Exact (Case Insensitive)', 'platform:PS5', sampleGuideDataForPlatform, ['Witchcrafty Trophy Guide']],
        ['Partial (Returns Nothing)', 'platform:ps', sampleGuideDataForPlatform, []],
        ['Vita Support', 'platform:vita', sampleGuideDataForPlatform, ['Ratchet & Clank: Full Frontal Assault Trophy Guide', 'Pato Box Trophy Guide', 'Rogue Legacy Trophy Guide']],
        ['Vita Support (PSV Alias)', 'platform:psv', sampleGuideDataForPlatform, ['Ratchet & Clank: Full Frontal Assault Trophy Guide', 'Pato Box Trophy Guide', 'Rogue Legacy Trophy Guide']],
        ['Multiple', 'platform:ps3,ps4,psv', sampleGuideDataForPlatform, ['Rogue Legacy Trophy Guide']],
        ['Multiple (Out Of Order)', 'platform:psv,ps3,ps4', sampleGuideDataForPlatform, ['Rogue Legacy Trophy Guide']],
        ['Multiple (Some)', 'platform:psv,ps3', sampleGuideDataForPlatform, ['Ratchet & Clank: Full Frontal Assault Trophy Guide', 'Rogue Legacy Trophy Guide']],
        ['Exclusions (Single)', 'platform:psv,-ps3', sampleGuideDataForPlatform, ['Pato Box Trophy Guide']],
        ['Exclusions (Multiple)', 'platform:psv,-ps3,-ps4', sampleGuideDataForPlatform, ['Pato Box Trophy Guide']],
        ['Exclusives (Single #1)', 'platform:+psv', sampleGuideDataForPlatform, ['Pato Box Trophy Guide']],
        ['Exclusives (Single #2)', 'platform:+vita', sampleGuideDataForPlatform, ['Pato Box Trophy Guide']],
        ['Exclusives (Single #3)', 'platform:+ps5', sampleGuideDataForPlatform, ['Witchcrafty Trophy Guide']],
        ['Exclusives (Multiple #1)', 'platform:+ps3,+vita', sampleGuideDataForPlatform, ['Ratchet & Clank: Full Frontal Assault Trophy Guide']],
        ['Exclusives (Multiple #2)', 'platform:+ps3,+psv', sampleGuideDataForPlatform, ['Ratchet & Clank: Full Frontal Assault Trophy Guide']],
    ];
    describe('Platform Search', () => test.each(platformScenarios)('%s - `%s`', genericTest));

    // platinum:
    const platinumScenarios = [
        ['Yes', 'platinum:yes', sampleGuideDataForDlcAndPlatinum, ['I Am A Platinum Trophy Guide']],
        ['No', 'platinum:no', sampleGuideDataForDlcAndPlatinum, ['I Am A Trophy Guide Without A Platinum', 'I Am A DLC Guide']],
        ['Garbage Text (Ignored)', 'platinum:garbage', sampleGuideDataForDlcAndPlatinum, ['I Am A Platinum Trophy Guide', 'I Am A Trophy Guide Without A Platinum', 'I Am A DLC Guide']],
    ];
    describe('Platinum Search', () => test.each(platinumScenarios)('%s - `%s`', genericTest));

    // playthroughs:
    const playthroughsScenarios = [
        ['Equals', 'playthroughs:10', getSampleGuideDataForRatingsAndAttributes(1), ['Rating 10']],
        ['Greater Than', 'playthroughs:>7', getSampleGuideDataForRatingsAndAttributes(1), ['Rating 8', 'Rating 9', 'Rating 10']],
        ['Less Than', 'playthroughs:<4', getSampleGuideDataForRatingsAndAttributes(1), ['Rating 1', 'Rating 2', 'Rating 3']],
        ['Range', 'playthroughs:4-6', getSampleGuideDataForRatingsWithDecimals(), ['4.9', '5.9', '6.9']],
        ['Empty', 'playthroughs:', sampleGuideDataForRatingsAndAttributes, ['Rating 1', 'Rating 2', 'Rating 3', 'Rating 4', 'Rating 5', 'Rating 6', 'Rating 7', 'Rating 8', 'Rating 9', 'Rating 10']],
        ['Garbage', 'playthroughs:garbage', sampleGuideDataForRatingsAndAttributes, ['Rating 1', 'Rating 2', 'Rating 3', 'Rating 4', 'Rating 5', 'Rating 6', 'Rating 7', 'Rating 8', 'Rating 9', 'Rating 10']],
    ];
    describe('Playthroughs Search', () => test.each(playthroughsScenarios)('%s - `%s`', genericTest));

    // src:
    const sourceScenarios = [
        ['Knoef', 'src:knoef', sampleGuideDataForSource, ['Synthetic Lover Trophy Guide']],
        ['PlatGet', 'src:platget', sampleGuideDataForSource, ['Astro Bot Trophy Guide']],
        ['PlaystationTrophies', 'src:pst', sampleGuideDataForSource, ['Super Stardust Ultra Trophy Guide']],
        ['Powerpyx', 'src:powerpyx', sampleGuideDataForSource, ['Nobody Wants To Die Trophy Guide & Roadmap']],
        ['PSNProfiles', 'src:psnp', sampleGuideDataForSource, ['PSNProfiles: Writing a Guide']],
        ['Exclusions', 'src:-platget,-knoef', sampleGuideDataForSource, ['PSNProfiles: Writing a Guide', 'Nobody Wants To Die Trophy Guide & Roadmap', 'Super Stardust Ultra Trophy Guide']],
        ['Exclusives (non-sensical, just make sure it works', 'src:+psnp', sampleGuideDataForSource, ['PSNProfiles: Writing a Guide']],
    ];
    describe('Source Search', () => test.each(sourceScenarios)('%s - `%s`', genericTest));

    // trophies:
    const trophiesScenarios = [
        ['Equals', 'trophies:30', sampleGuideDataForTrophies, ['Witchcrafty Trophy Guide', 'Rogue Legacy Trophy Guide']],
        ['Equals', 'trophies:<30', sampleGuideDataForTrophies, ['Ratchet & Clank: Full Frontal Assault Trophy Guide', 'Doom The Dark Ages Inc']],
        ['Equals', 'trophies:>30', sampleGuideDataForTrophies, ['Pato Box Trophy Guide']],
        ['Empty', 'hours:', sampleGuideDataForTrophies, ['PSNProfiles: Writing a Guide', 'Ratchet & Clank: Full Frontal Assault Trophy Guide', 'Pato Box Trophy Guide', 'Witchcrafty Trophy Guide', 'PSNProfiles: Leaderboard Rules & Disputes', 'Rogue Legacy Trophy Guide', 'Doom The Dark Ages Inc']],
        ['Garbage', 'hours:garbage', sampleGuideDataForTrophies, ['PSNProfiles: Writing a Guide', 'Ratchet & Clank: Full Frontal Assault Trophy Guide', 'Pato Box Trophy Guide', 'Witchcrafty Trophy Guide', 'PSNProfiles: Leaderboard Rules & Disputes', 'Rogue Legacy Trophy Guide', 'Doom The Dark Ages Inc']],
    ];
    describe('Trophies Search', () => test.each(trophiesScenarios)('%s - `%s`', genericTest));

    // type:
    const typeScenarios = [
        ['Trophy Guide', 'type:trophy-guide', sampleGuideDataForType, ['I Am A Trophy Guide']],
        ['Walkthrough', 'type:guide', sampleGuideDataForType, ['I Am A Walkthrough']],
        ['Garbage Text (Ignored)', 'type:garbage', sampleGuideDataForType, ['I Am A Trophy Guide', 'I Am A Walkthrough']],
    ];
    describe('Type Search', () => test.each(typeScenarios)('%s - `%s`', genericTest));
})();

function getSampleGuideDataForAuthor(): Record<string, Guide> {
    return {
        '7363': {
            a: 0,
            u: ['Sergen-The-Boss'],
            d: 0,
            r: [],
            n: 'Mortal Kombat Trophy Guide',
        },
        '14637': {
            a: 0,
            u: ['langdon'],
            d: 0,
            r: [],
            n: 'ScourgeBringer Trophy Guide',
        },
        '15002': {
            a: 0,
            u: ['langdon', 'Michael2399'],
            d: 0,
            r: [],
            n: 'Pato Box Trophy Guide',
        },
        '16557': {
            a: 0,
            u: ['HealedFiend13', 'langdon'],
            d: 0,
            r: [],
            n: 'Witchcrafty Trophy Guide',
        },
        '16558': {
            a: 0,
            u: ['HealedFiend13', 'langdon', 'Somebody Else'],
            d: 0,
            r: [],
            n: 'Fake Guide',
        },
        '18277': {
            a: 0,
            u: [],
            d: 0,
            r: [],
            n: 'PSNProfiles: Leaderboard Rules & Disputes',
        },
    };
}

function getSampleGuideDataForDlcAndPlatinum(): Record<string, Guide> {
    const guides = {
        '1': {
            a: IS_TROPHY_GUIDE,
            u: [],
            d: 3,
            r: [],
            n: 'I Am A Platinum Trophy Guide',
            t: [1, 0, 0, 0],
        },
        '2': {
            a: IS_TROPHY_GUIDE,
            u: [],
            d: 2,
            r: [],
            n: 'I Am A Trophy Guide Without A Platinum',
            t: [0, 0, 0, 0],
        },
        '3': {
            a: IS_DLC,
            u: [],
            d: 1,
            r: [],
            n: 'I Am A DLC Guide',
        },
    };

    return guides;
}

function getSampleGuideDataForOrder(): Record<string, Guide> {
    const guides = ['A', 'D', 'Y', 'Z']
        .reduce((gz: Record<string, Guide>, letter, i) => {
            // make Z have no ratings to handle null searching
            const rating = letter === 'Z' ? null : i + 1;

            gz[letter] = {
                a: 0,
                u: [],
                d: i + 1,
                r: [rating, rating, rating],
                n: `${letter} Guide`,
            };
            return gz;
        }, {});

    return guides;
}

function getSampleGuideDataForOrderMulti(): Record<string, Guide> {
    return {
        '1': {
            a: 0,
            u: [],
            d: 4,
            r: [10, 1, 999],
            n: 'A Hard/Long',
        },
        '2': {
            a: 0,
            u: [],
            d: 3,
            r: [10, 1, 2],
            n: 'B Hard/Short',
        },
        '3': {
            a: 0,
            u: [],
            d: 2,
            r: [1, 1, 999],
            n: 'C Easy/Long',
        },
        '4': {
            a: 0,
            u: [],
            d: 1,
            r: [1, 1, 2],
            n: 'D Easy/Short',
        },
    };
}

function getSampleGuideDataForPlatform(): Record<string, Guide> {
    return {
        '1': {
            a: 0,
            u: [],
            d: 0,
            r: [],
            n: 'PSNProfiles: Writing a Guide',
        },
        '132': {
            a: PLATFORM_PS3 | PLATFORM_VITA | IS_TROPHY_GUIDE,
            u: [],
            d: 0,
            r: [],
            n: 'Ratchet & Clank: Full Frontal Assault Trophy Guide',
            t: [1, 7, 7, 8],
        },
        '15002': {
            a: PLATFORM_VITA | IS_TROPHY_GUIDE,
            u: ['langdon', 'Michael2399'],
            d: 0,
            r: [],
            n: 'Pato Box Trophy Guide',
            t: [1, 2, 7, 42],
        },
        '16557': {
            a: PLATFORM_PS5 | HAS_MISSABLE_TROPHIES | IS_TROPHY_GUIDE,
            u: ['HealedFiend13', 'langdon'],
            d: 0,
            r: [],
            n: 'Witchcrafty Trophy Guide',
            t: [1, 7, 6, 16],
        },
        '18277': {
            a: 0,
            u: [],
            d: 0,
            r: [],
            n: 'PSNProfiles: Leaderboard Rules & Disputes',
        },
        '19678': {
            a: PLATFORM_PS3 | PLATFORM_PS4 | PLATFORM_VITA | IS_TROPHY_GUIDE,
            u: [],
            d: 0,
            r: [],
            n: 'Rogue Legacy Trophy Guide',
            t: [1, 6, 11, 12],
        },
        'fuck/knows': {
            a: 0,
            u: [],
            d: 0,
            r: [],
            n: 'Doom The Dark Ages Inc',
            t: [1, 6, 11, 0],
        },
    };
}

function getSampleGuideDataForRatingsWithDecimals(): Record<string, Guide> {
    return {
        '1': {
            a: 0,
            u: [],
            d: 0,
            r: [3.9, 3.9, 3.9],
            n: '3.9',
        },
        '2': {
            a: 0,
            u: [],
            d: 0,
            r: [4.9, 4.9, 4.9],
            n: '4.9',
        },
        '3': {
            a: 0,
            u: [],
            d: 0,
            r: [5.9, 5.9, 5.9],
            n: '5.9',
        },
        '4': {
            a: 0,
            u: [],
            d: 0,
            r: [6.9, 6.9, 6.9],
            n: '6.9',
        },
        '5': {
            a: 0,
            u: [],
            d: 0,
            r: [7.9, 7.9, 7.9],
            n: '7.9',
        },
    };
}

function getSampleGuideDataForRatingsAndAttributes(index?: number) {
    const guides: Record<string, Guide> = {};

    const attributes = {
        '1': HAS_BUGGY_TROPHIES,
        '2': HAS_ONLINE_TROPHIES,
        '3': HAS_MISSABLE_TROPHIES,
        '4': HAS_BUGGY_TROPHIES | HAS_ONLINE_TROPHIES,
        '5': HAS_BUGGY_TROPHIES | HAS_MISSABLE_TROPHIES,
        '6': HAS_ONLINE_TROPHIES | HAS_MISSABLE_TROPHIES,
        '7': HAS_BUGGY_TROPHIES | HAS_ONLINE_TROPHIES | HAS_MISSABLE_TROPHIES,
    };

    for (let i = 1; i <= 10; i++) {
        // difficulty, playthroughs, hours
        const rating = [0, 0, 0];

        // if an index wasn't provided, set all ratings the same, but
        // for test clarity, set ratings differently to avoid bugs
        // e.g. hours:3 implementation used to be checking playthroughs
        if (index === undefined) {
            rating[0] = i;
            rating[1] = i;
            rating[2] = i;
        }
        else {
            rating[index] = i;
        }

        guides[i] = {
            a: attributes[i.toString()] ?? 0,
            u: [],
            d: 0,
            r: rating,
            n: `Rating ${i}`,
        };
    };

    return guides;
}

function getSampleGuideDataForSource(): Record<string, Guide> {
    return {
        '1': {
            a: SOURCE_PSNP,
            u: [],
            d: 0,
            r: [],
            n: 'PSNProfiles: Writing a Guide',
        },
        'nobody-wants-to-die-trophy-guide-roadmap/': {
            a: SOURCE_POWERPYX,
            u: [],
            d: 0,
            r: [],
            n: 'Nobody Wants To Die Trophy Guide & Roadmap',
        },
        'trophy-guides/ps5/synthetic-lover-trophy-guide/': {
            a: SOURCE_KNOEF,
            u: [],
            d: 0,
            r: [],
            n: 'Synthetic Lover Trophy Guide',
        },
        'astro-bot-trophy-guide/': {
            a: SOURCE_PLATGET,
            u: [],
            d: 0,
            r: [],
            n: 'Astro Bot Trophy Guide',
        },
        'super-stardust-ultra/guide/': {
            a: SOURCE_PLAYSTATIONTROPHIES,
            u: [],
            d: 0,
            r: [],
            n: 'Super Stardust Ultra Trophy Guide',
        },
    };
}

function getSampleGuideDataForText(): Record<string, Guide> {
    return {
        '1': {
            a: 0,
            u: [],
            d: 0,
            r: [],
            n: 'PSNProfiles: Writing a Guide',
        },
        '132': {
            a: PLATFORM_PS3 | PLATFORM_VITA | IS_TROPHY_GUIDE,
            u: [],
            d: 0,
            r: [],
            n: 'Ratchet & Clank: Full Frontal Assault Trophy Guide',
            t: [1, 7, 7, 8],
        },
        '15002': {
            a: PLATFORM_VITA | IS_TROPHY_GUIDE,
            u: ['langdon', 'Michael2399'],
            d: 0,
            r: [],
            n: 'Pato Box Trophy Guide',
            t: [1, 2, 7, 42],
        },
        '16557': {
            a: PLATFORM_PS5 | HAS_MISSABLE_TROPHIES | IS_TROPHY_GUIDE,
            u: ['HealedFiend13', 'langdon'],
            d: 0,
            r: [],
            n: 'Witchcrafty Trophy Guide',
            t: [1, 7, 6, 16],
        },
        '18277': {
            a: 0,
            u: [],
            d: 0,
            r: [],
            n: 'PSNProfiles: Leaderboard Rules & Disputes',
        },
        '19678': {
            a: PLATFORM_PS3 | PLATFORM_PS4 | PLATFORM_VITA | IS_TROPHY_GUIDE,
            u: [],
            d: 0,
            r: [],
            n: 'Rogue Legacy Trophy Guide',
            t: [1, 6, 11, 12],
        },
        'fuck/knows': {
            a: 0,
            u: [],
            d: 0,
            r: [],
            n: 'Doom The Dark Ages Inc',
            t: [1, 6, 11, 0],
        },
        '22396': {
            a: 0,
            u: [],
            d: 0,
            r: [],
            n: 'Onimusha 2: Samurai\'s Destiny Trophy Guide',
            t: [1, 6, 11, 0],
        },
        'onimusha-2-samurais-destiny-trophy-guide-roadmap/': {
            a: 0,
            u: [],
            d: 0,
            r: [],
            n: 'Onimusha 2: Samurai’s Destiny Trophy Guide & Roadmap',
            t: [1, 6, 11, 0],
        },
    };
}

function getSampleGuideDataForTrophies(): Record<string, Guide> {
    return {
        '1': {
            a: 0,
            u: [],
            d: 0,
            r: [],
            n: 'PSNProfiles: Writing a Guide',
        },
        '132': {
            a: PLATFORM_PS3 | PLATFORM_VITA | IS_TROPHY_GUIDE,
            u: [],
            d: 0,
            r: [],
            n: 'Ratchet & Clank: Full Frontal Assault Trophy Guide',
            t: [1, 7, 7, 8],
        },
        '15002': {
            a: PLATFORM_VITA | IS_TROPHY_GUIDE,
            u: ['langdon', 'Michael2399'],
            d: 0,
            r: [],
            n: 'Pato Box Trophy Guide',
            t: [1, 2, 7, 42],
        },
        '16557': {
            a: PLATFORM_PS5 | HAS_MISSABLE_TROPHIES | IS_TROPHY_GUIDE,
            u: ['HealedFiend13', 'langdon'],
            d: 0,
            r: [],
            n: 'Witchcrafty Trophy Guide',
            t: [1, 7, 6, 16],
        },
        '18277': {
            a: 0,
            u: [],
            d: 0,
            r: [],
            n: 'PSNProfiles: Leaderboard Rules & Disputes',
        },
        '19678': {
            a: PLATFORM_PS3 | PLATFORM_PS4 | PLATFORM_VITA | IS_TROPHY_GUIDE,
            u: [],
            d: 0,
            r: [],
            n: 'Rogue Legacy Trophy Guide',
            t: [1, 6, 11, 12],
        },
        'fuck/knows': {
            a: 0,
            u: [],
            d: 0,
            r: [],
            n: 'Doom The Dark Ages Inc',
            t: [1, 6, 11, 0],
        },
    };
}

function getSampleGuideDataForTypeAndAttributes(): Record<string, Guide> {
    const guides = {
        '12649': {
            a: IS_TROPHY_GUIDE,
            u: [],
            d: 2,
            r: [],
            n: 'I Am A Trophy Guide',
        },
        '13383': {
            a: 0,
            u: [],
            d: 1,
            r: [],
            n: 'I Am A Walkthrough',
        },
    };

    return guides;
}
