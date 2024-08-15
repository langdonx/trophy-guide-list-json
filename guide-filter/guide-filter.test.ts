import { filter } from './guide-filter';
import type { Guide } from '../types/guides';
import {
    SOURCE_PSNP,
    SOURCE_KNOEF,
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
} from '../types/attributes';

const sampleGuideDataForTextAndAuthor = getSampleGuideDataForTextAndAuthor();
const sampleGuideDataForDlcAndPlatinum = getSampleGuideDataForDlcAndPlatinum();
const sampleGuideDataForSource = getSampleGuideDataForSource();
const sampleGuideDataForType = getSampleGuideDataForTypeAndAttributes();
const sampleGuideDataForOrder = getSampleGuideDataForOrder();
const sampleGuideDataForRatingsAndAttributes = getSampleGuideDataForRatingsAndAttributes();

// TODO order by multiple fields, e.g. hardest game that is the shortest -- order:-difficulty,hours

// TODO platinum rate, completion rate (when data is available)

// TODO exclusive searches -- use + to say "all these must be there"
//      - platform:+psv (no need to -ps3,-ps4)
//      - author:+langdon (guides I solo authored)

function genericTest(_: string, search: string, data: Record<string, Guide>, expectedTitles: string[]) {
    const result = filter(data, search);
    expect(result.length).toBe(expectedTitles.length);
    expect(result.map(r => r.title)).toStrictEqual(expectedTitles);
};

(async () => {
    // raw text
    const basicSearchScenarios = [
        ['Full Match', 'PSNProfiles: Writing a Guide', sampleGuideDataForTextAndAuthor, ['PSNProfiles: Writing a Guide']],
        ['Partial Match', 'Rules & Disputes', sampleGuideDataForTextAndAuthor, ['PSNProfiles: Leaderboard Rules & Disputes']],
        ['Partial Match (Case Insensitive)', 'psnp', sampleGuideDataForTextAndAuthor, ['PSNProfiles: Writing a Guide', 'PSNProfiles: Leaderboard Rules & Disputes']],
    ];
    describe('Basic Search', () => test.each(basicSearchScenarios)('%s - `%s`', genericTest));

    // author:
    const authorScenarios = [
        ['Full Match', 'author:Michael2399', sampleGuideDataForTextAndAuthor, ['Pato Box Trophy Guide']],
        ['Full Match (Case Insensitive)', 'author:michael2399', sampleGuideDataForTextAndAuthor, ['Pato Box Trophy Guide']],
        ['Partial Match', 'author:ichael239', sampleGuideDataForTextAndAuthor, ['Pato Box Trophy Guide']],
        ['Multiple', 'author:langdon,Michael2399', sampleGuideDataForTextAndAuthor, ['Pato Box Trophy Guide']],
        ['Multiple (Out Of Order)', 'author:Michael2399,langdon', sampleGuideDataForTextAndAuthor, ['Pato Box Trophy Guide']],
        ['Multiple (Partial)', 'author:ichael239,angdo', sampleGuideDataForTextAndAuthor, ['Pato Box Trophy Guide']],
        ['Multiple (Mismatched)', 'author:HealedFiend13,Michael2399', sampleGuideDataForTextAndAuthor, []],
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
    ];
    describe('Order Search', () => test.each(orderScenarios)('%s - `%s`', genericTest));

    // platform:
    const platformScenarios = [
        ['Exact', 'platform:ps5', sampleGuideDataForTextAndAuthor, ['Witchcrafty Trophy Guide']],
        ['Exact (Case Insensitive)', 'platform:PS5', sampleGuideDataForTextAndAuthor, ['Witchcrafty Trophy Guide']],
        ['Partial (Returns Nothing)', 'platform:ps', sampleGuideDataForTextAndAuthor, []],
        ['Vita Support', 'platform:vita', sampleGuideDataForTextAndAuthor, ['Pato Box Trophy Guide', 'Rogue Legacy Trophy Guide']],
        ['Vita Support (PSV Alias)', 'platform:psv', sampleGuideDataForTextAndAuthor, ['Pato Box Trophy Guide', 'Rogue Legacy Trophy Guide']],
        ['Multiple', 'platform:ps3,ps4,psv', sampleGuideDataForTextAndAuthor, ['Rogue Legacy Trophy Guide']],
        ['Multiple (Out Of Order)', 'platform:psv,ps3,ps4', sampleGuideDataForTextAndAuthor, ['Rogue Legacy Trophy Guide']],
        ['Multiple (Some)', 'platform:psv,ps3', sampleGuideDataForTextAndAuthor, ['Rogue Legacy Trophy Guide']],
        ['Exclusions (Single)', 'platform:psv,-ps3', sampleGuideDataForTextAndAuthor, ['Pato Box Trophy Guide']],
        ['Exclusions (Multiple)', 'platform:psv,-ps3,-ps4', sampleGuideDataForTextAndAuthor, ['Pato Box Trophy Guide']],
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
        ['Empty', 'playthroughs:', sampleGuideDataForRatingsAndAttributes, ['Rating 1', 'Rating 2', 'Rating 3', 'Rating 4', 'Rating 5', 'Rating 6', 'Rating 7', 'Rating 8', 'Rating 9', 'Rating 10']],
        ['Garbage', 'playthroughs:garbage', sampleGuideDataForRatingsAndAttributes, ['Rating 1', 'Rating 2', 'Rating 3', 'Rating 4', 'Rating 5', 'Rating 6', 'Rating 7', 'Rating 8', 'Rating 9', 'Rating 10']],
    ];
    describe('Playthroughs Search', () => test.each(playthroughsScenarios)('%s - `%s`', genericTest));

    // src:
    const sourceScenarios = [
        ['Knoef', 'src:knoef', sampleGuideDataForSource, ['Synthetic Lover Trophy Guide']],
        ['Powerpyx', 'src:powerpyx', sampleGuideDataForSource, ['Nobody Wants To Die Trophy Guide & Roadmap']],
        ['PSNProfiles', 'src:psnp', sampleGuideDataForSource, ['PSNProfiles: Writing a Guide']],
    ];
    describe('Source Search', () => test.each(sourceScenarios)('%s - `%s`', genericTest));

    // type:
    const typeScenarios = [
        ['Trophy Guide', 'type:trophy-guide', sampleGuideDataForType, ['I Am A Trophy Guide']],
        ['Walkthrough', 'type:guide', sampleGuideDataForType, ['I Am A Walkthrough']],
        ['Garbage Text (Ignored)', 'type:garbage', sampleGuideDataForType, ['I Am A Trophy Guide', 'I Am A Walkthrough']],
    ];
    describe('Type Search', () => test.each(typeScenarios)('%s - `%s`', genericTest));
})();

function getSampleGuideDataForTextAndAuthor(): Record<string, Guide> {
    return {
        '1': {
            attr: 0,
            authors: [],
            d: 0,
            rating: [],
            src: 0,
            title: 'PSNProfiles: Writing a Guide',
        },
        '18277': {
            attr: 0,
            authors: [],
            d: 0,
            rating: [],
            src: 0,
            title: 'PSNProfiles: Leaderboard Rules & Disputes',
        },
        '15002': {
            attr: PLATFORM_VITA | IS_TROPHY_GUIDE,
            authors: ['langdon', 'Michael2399'],
            d: 0,
            rating: [],
            src: 0,
            title: 'Pato Box Trophy Guide',
        },
        '16557': {
            attr: PLATFORM_PS5 | HAS_MISSABLE_TROPHIES | IS_TROPHY_GUIDE,
            authors: ['HealedFiend13', 'langdon'],
            d: 0,
            rating: [],
            src: 0,
            title: 'Witchcrafty Trophy Guide',
        },
        '19678': {
            attr: PLATFORM_PS3 | PLATFORM_PS4 | PLATFORM_VITA | IS_TROPHY_GUIDE,
            authors: [],
            d: 0,
            rating: [],
            src: 0,
            title: 'Rogue Legacy Trophy Guide',
        },
    };
}

function getSampleGuideDataForSource(): Record<string, Guide> {
    return {
        '1': {
            attr: 0,
            authors: [],
            d: 0,
            rating: [],
            src: SOURCE_PSNP,
            title: 'PSNProfiles: Writing a Guide',
        },
        'nobody-wants-to-die-trophy-guide-roadmap/': {
            attr: 0,
            authors: [],
            d: 0,
            rating: [],
            src: SOURCE_POWERPYX,
            title: 'Nobody Wants To Die Trophy Guide & Roadmap',
        },
        'trophy-guides/ps5/synthetic-lover-trophy-guide/': {
            attr: 0,
            authors: [],
            d: 0,
            rating: [],
            src: SOURCE_KNOEF,
            title: 'Synthetic Lover Trophy Guide',
        },
    };
}

function getSampleGuideDataForDlcAndPlatinum(): Record<string, Guide> {
    const guides = {
        '1': {
            attr: IS_TROPHY_GUIDE,
            authors: [],
            d: 0,
            rating: [],
            src: 0,
            title: 'I Am A Platinum Trophy Guide',
            trophies: [1, 0, 0, 0],
        },
        '2': {
            attr: IS_TROPHY_GUIDE,
            authors: [],
            d: 0,
            rating: [],
            src: 0,
            title: 'I Am A Trophy Guide Without A Platinum',
            trophies: [0, 0, 0, 0],
        },
        '3': {
            attr: IS_DLC,
            authors: [],
            d: 1649390400000,
            rating: [],
            src: 0,
            title: 'I Am A DLC Guide',
        },
    };

    return guides;
}

function getSampleGuideDataForTypeAndAttributes(): Record<string, Guide> {
    const guides = {
        '12649': {
            attr: IS_TROPHY_GUIDE,
            authors: [],
            d: 0,
            rating: [],
            src: 0,
            title: 'I Am A Trophy Guide',
        },
        '13383': {
            attr: 0,
            authors: [],
            d: 1649390400000,
            rating: [],
            src: 0,
            title: 'I Am A Walkthrough',
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
                attr: 0,
                authors: [],
                d: i + 1,
                rating: [rating, rating, rating],
                src: 0,
                title: `${letter} Guide`,
            };
            return gz;
        }, {});

    return guides;
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
            attr: attributes[i.toString()] ?? 0,
            authors: [],
            d: 0,
            rating,
            src: 0,
            title: `Rating ${i}`,
        };
    };

    return guides;
}
