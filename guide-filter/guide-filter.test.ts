import { filter } from './guide-filter';
import type { Guide } from '../types/guides';

let guideData = getSampleGuideData();

// TODO difficulty
// TODO hours
// TODO playthroughs
// TODO order / order-reverse
// TODO buggy, online, missable
// TODO a way to search for solo authors (show me guides I wrote alone)
// TODO you should be able to use leftOverTerms to find authors, but not sure if that's a good idea (langdon finds all langdon's guides without needing author:langdon, but that might be annoying when authors have names like "Steamworld")

(async () => {
    // raw text
    const basicScenarios = [
        ['Full Match', 'PSNProfiles: Writing a Guide', 1, ['PSNProfiles: Writing a Guide']],
        ['Partial Match', 'Rules & Disputes', 1, ['PSNProfiles: Leaderboard Rules & Disputes']],
    ];
    describe('Basic Search', () => {
        test.each(basicScenarios)('%s - `%s`', (_, b: string, c, d) => {
            const result = filter(guideData, b);
            expect(result.length).toBe(c);
            expect(result.map(r => r.title)).toStrictEqual(d);
        });
    });

    // author:
    const authorScenarios = [
        ['Full Match', 'author:Michael2399', 1, ['Pato Box Trophy Guide']],
        ['Partial Match', 'author:ichael239', 1, ['Pato Box Trophy Guide']],
        ['Multiple', 'author:langdon,Michael2399', 1, ['Pato Box Trophy Guide']],
        ['Multiple (Out Of Order)', 'author:Michael2399,langdon', 1, ['Pato Box Trophy Guide']],
        ['Multiple (Partial)', 'author:ichael239,angdo', 1, ['Pato Box Trophy Guide']],
        ['Multiple (Mismatched)', 'author:HealedFiend13,Michael2399', 0, []],
    ];
    describe('Author Search', () => {
        test.each(authorScenarios)('%s - `%s`', (_, b: string, c, d) => {
            const result = filter(guideData, b);
            expect(result.length).toBe(c);
            expect(result.map(r => r.title)).toStrictEqual(d);
        });
    });

    // dlc:
    const dlcScenarios = [
        ['Yes', 'dlc:yes', 1, ['Final Fantasy XIV - Heavensward DLC Trophy Guide']],
        ['No', 'dlc:no', 1, ['Final Fantasy XIV Trophy Guide']],
        ['Garbage Text (Ignored)', 'dlc:garbage', 2, ['Final Fantasy XIV Trophy Guide', 'Final Fantasy XIV - Heavensward DLC Trophy Guide']],
    ];
    describe('DLC Search', () => {
        test.each(dlcScenarios)('%s - `%s`', (_, b: string, c, d) => {
            const isolatedGuideData = getSampleGuideDataForDlcAndPlatinumSearch();
            const result = filter(isolatedGuideData, b);
            expect(result.length).toBe(c);
            expect(result.map(r => r.title)).toStrictEqual(d);
        });
    });

    // platform:
    const platformScenarios = [
        ['Exact', 'platform:ps5', 1, ['Witchcrafty Trophy Guide']],
        ['Partial (Returns Nothing)', 'platform:ps', 0, []],
        ['PSV Support (Tag Name Is Vita)', 'platform:psv', 2, ['Pato Box Trophy Guide', 'Rogue Legacy Trophy Guide']],
        ['Multiple', 'platform:ps3,ps4,psv', 1, ['Rogue Legacy Trophy Guide']],
        ['Multiple (Out Of Order)', 'platform:psv,ps3,ps4', 1, ['Rogue Legacy Trophy Guide']],
        ['Multiple (Some)', 'platform:psv,ps3', 1, ['Rogue Legacy Trophy Guide']],
        ['Exclusions (Single)', 'platform:psv,-ps3', 1, ['Pato Box Trophy Guide']],
        ['Exclusions (Multiple)', 'platform:psv,-ps3,-ps4', 1, ['Pato Box Trophy Guide']],
    ];
    describe('Platform Search', () => {
        test.each(platformScenarios)('%s - `%s`', (_, b: string, c, d) => {
            const result = filter(guideData, b);
            expect(result.length).toBe(c);
            expect(result.map(r => r.title)).toStrictEqual(d);
        });
    });

    // platinum:
    const platinumScenarios = [
        ['Yes', 'platinum:yes', 1, ['Final Fantasy XIV Trophy Guide']],
        ['No', 'platinum:no', 1, ['Final Fantasy XIV - Heavensward DLC Trophy Guide']],
        ['Garbage Text (Ignored)', 'platinum:garbage', 2, ['Final Fantasy XIV Trophy Guide', 'Final Fantasy XIV - Heavensward DLC Trophy Guide']],
    ];
    describe('Platinum Search', () => {
        test.each(platinumScenarios)('%s - `%s`', (_, b: string, c, d) => {
            const isolatedGuideData = getSampleGuideDataForDlcAndPlatinumSearch();
            const result = filter(isolatedGuideData, b);
            expect(result.length).toBe(c);
            expect(result.map(r => r.title)).toStrictEqual(d);
        });
    });

    // src:
    const sourceScenarios = [
        ['Knoef', 'src:knoef', 1, ['Synthetic Lover Trophy Guide']],
        ['Powerpyx', 'src:powerpyx', 1, ['Nobody Wants To Die Trophy Guide & Roadmap']],
        ['PSNProfiles', 'src:psnp', 1, ['PSNProfiles: Writing a Guide']],
    ];
    describe('Source Search', () => {
        test.each(sourceScenarios)('%s - `%s`', (_, b: string, c, d) => {
            const isolatedGuideData = getSampleGuideDataForSourceSearch();
            const result = filter(isolatedGuideData, b);
            expect(result.length).toBe(c);
            expect(result.map(r => r.title)).toStrictEqual(d);
        });
    });

    // type:
    const typeScenarios = [
        ['Walkthrough', 'type:trophy-guide', 1, ['Final Fantasy XIV Trophy Guide']],
        ['Trophy Guide', 'type:guide', 1, ['Final Fantasy XIV - Endwalker Encounter Guide (Pandæmonium)']],
        ['Garbage Text (Ignored)', 'type:garbage', 2, ['Final Fantasy XIV Trophy Guide', 'Final Fantasy XIV - Endwalker Encounter Guide (Pandæmonium)']],
    ];
    describe('Guide Type Search', () => {
        test.each(typeScenarios)('%s - `%s`', (_, b: string, c, d) => {
            const isolatedGuideData = getSampleDataForGuideTypeSearch();
            const result = filter(isolatedGuideData, b);
            expect(result.length).toBe(c);
            expect(result.map(r => r.title)).toStrictEqual(d);
        });
    });
})();

// sample data
function getSampleGuideData(): Record<string, Guide> {
    return {
        "1": {
            "attr": 0,
            "authors": [
                "Sly-Ripper",
                "BlindMango",
                "Dreggit"
            ],
            "d": 1410321600000,
            "rating": [
                null,
                null,
                null
            ],
            "src": 1,
            "title": "PSNProfiles: Writing a Guide",
        },
        "18277": {
            "attr": 0,
            "authors": [
                "Sly-Ripper",
                "B1rvine",
                "MMDE"
            ],
            "d": 1703826000000,
            "rating": [
                null,
                null,
                null
            ],
            "src": 1,
            "title": "PSNProfiles: Leaderboard Rules & Disputes",
        },
        "15002": {
            "attr": 33,
            "authors": [
                "langdon",
                "Michael2399"
            ],
            "d": 1665720000000,
            "image": "7d9205/L1149bb.png",
            "rating": [
                8,
                1,
                20
            ],
            "src": 1,
            "title": "Pato Box Trophy Guide",
            "trophies": [
                1,
                2,
                7,
                42
            ],
        },
        "16557": {
            "attr": 17,
            "authors": [
                "HealedFiend13",
                "langdon"
            ],
            "d": 1682913600000,
            "image": "6faced/Lcc905d.png",
            "rating": [
                3,
                1,
                3
            ],
            "src": 1,
            "title": "Witchcrafty Trophy Guide",
            "trophies": [
                1,
                7,
                6,
                16
            ]
        },
        "19678": {
            "attr": 45,
            "authors": [
                "jmddb99"
            ],
            "d": 1720137600000,
            "image": "89c7b7/L311f0d.png",
            "rating": [
                8,
                3,
                40
            ],
            "src": 1,
            "title": "Rogue Legacy Trophy Guide",
            "trophies": [
                1,
                6,
                11,
                12
            ]
        },
    };
}

function getSampleGuideDataForSourceSearch(): Record<string, Guide> {
    return {
        // psnp
        "1": {
            "attr": 0,
            "authors": [
                "Sly-Ripper",
                "BlindMango",
                "Dreggit",
            ],
            "d": 1410321600000,
            "rating": [
                null,
                null,
                null,
            ],
            "src": 1,
            "title": "PSNProfiles: Writing a Guide",
        },
        // powerpyx
        "nobody-wants-to-die-trophy-guide-roadmap/": {
            "attr": 17,
            "authors": [
                "Ashbo",
            ],
            "d": 1721951956000,
            "image": "915b6e/L110e56.png",
            "rating": [
                2,
                1,
                4.5,
            ],
            "src": 3,
            "title": "Nobody Wants To Die Trophy Guide & Roadmap",
            "trophies": [
                1,
                7,
                9,
                10,
            ],
        },
        // knoef
        "trophy-guides/ps5/synthetic-lover-trophy-guide/": {
            "attr": 17,
            "authors": [
                "Siralja",
            ],
            "d": 1721762995000,
            "image": "6e55e1/Lccc650.png",
            "rating": [
                1,
                0,
                1,
            ],
            "src": 2,
            "title": "Synthetic Lover Trophy Guide",
            "trophies": [
                1,
                10,
                4,
                0,
            ],
        },
    };
}

function getSampleGuideDataForDlcAndPlatinumSearch(): Record<string, Guide> {
    return {
        "12649": {
            "attr": 273,
            "authors": [
                "Rebourne07",
                "MakoSOLIDER",
                "zekunlu",
            ],
            "d": 1631246400000,
            "image": "10c1f3/L7f52a5.png",
            "rating": [
                6,
                1,
                999,
            ],
            "src": 1,
            "title": "Final Fantasy XIV Trophy Guide",
            "trophies": [
                1,
                0,
                12,
                40,
            ],
        },
        "12669": {
            "attr": 275,
            "authors": [
                "zekunlu",
                "Rebourne07",
            ],
            "d": 1631246400000,
            "image": "10c1f3/L7f52a5.png",
            "rating": [
                7,
                1,
                999,
            ],
            "src": 1,
            "title": "Final Fantasy XIV - Heavensward DLC Trophy Guide",
            "trophies": [
                0,
                0,
                0,
                13,
            ],
        },
    };
}

function getSampleDataForGuideTypeSearch(): Record<string, Guide> {
    return {
        "12649": {
            "attr": 273,
            "authors": [
                "Rebourne07",
                "MakoSOLIDER",
                "zekunlu",
            ],
            "d": 1631246400000,
            "image": "10c1f3/L7f52a5.png",
            "rating": [
                6,
                1,
                999,
            ],
            "src": 1,
            "title": "Final Fantasy XIV Trophy Guide",
            "trophies": [
                1,
                0,
                12,
                40,
            ],
        },
        "13383": {
            "attr": 16,
            "authors": [
                "zekunlu",
            ],
            "d": 1649390400000,
            "image": "10c1f3/L7f52a5.png",
            "rating": [
                null,
                null,
                null
            ],
            "src": 1,
            "title": "Final Fantasy XIV - Endwalker Encounter Guide (Pandæmonium)",
        },
    };
}
