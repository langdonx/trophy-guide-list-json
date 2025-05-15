import type { Guide } from '../types/guides-v2.d.ts';
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
import { tokenParser } from './token-parser';

export function filter(guides: Record<string, Guide>, searchText: string): (Guide & { id: string })[] {
    const tokens = new tokenParser().parse(searchText, [
        'author',
        'buggy',
        'difficulty',
        'dlc',
        'hours',
        'missable',
        'online',
        'order',
        'platform',
        'platinum',
        'playthroughs',
        'src',
        'type',
        'trophies',
    ]);

    // parse order details
    const orderBy = tokens.order?.replace('-', '').toLowerCase() ?? 'published';
    const reverse = tokens.order?.startsWith('-') ?? true;

    const cleanedUpTerms = tokens.leftOverTerms.toLowerCase()
        .replace(/[-:,.]/g, ' ')
        .replace(/  /g, ' ')
        .trim();

    const result = Object.entries(guides)
        .filter(([_, g]) => {
            // the general strategy here:
            // - everything is a match until it's not
            // - so quit (return false to filter) if something is amiss

            // use leftOverTerms to search title
            if (tokens.leftOverTerms) {
                const name = g.n.toLowerCase()
                    .replace(/[-:,]/g, ' ')
                    .replace(/  /g, ' ')
                    .trim();

                if (name.includes(cleanedUpTerms) === false) {
                    return false;
                }
            }

            // difficulty token
            if (tokens['difficulty'] && compareRatingForFiltering(0, tokens['difficulty'], g) === false) {
                return false;
            }

            // hours token
            if (tokens['hours'] && compareRatingForFiltering(2, tokens['hours'], g) === false) {
                return false;
            }

            // playthroughs token
            if (tokens['playthroughs'] && compareRatingForFiltering(1, tokens['playthroughs'], g) === false) {
                return false;
            }

            // buggy token
            if (tokens['buggy'] && compareYesNoAttributeForFiltering(tokens['buggy'], HAS_BUGGY_TROPHIES, g) === false) {
                return false;
            }

            // dlc token
            if (tokens['dlc'] && compareYesNoAttributeForFiltering(tokens['dlc'], IS_DLC, g) === false) {
                return false;
            }

            // missable token
            if (tokens['missable'] && compareYesNoAttributeForFiltering(tokens['missable'], HAS_MISSABLE_TROPHIES, g) === false) {
                return false;
            }

            // online token
            if (tokens['online'] && compareYesNoAttributeForFiltering(tokens['online'], HAS_ONLINE_TROPHIES, g) === false) {
                return false;
            }

            // author token
            if (tokens['author']) {
                const authors = tokens['author'].split(',');

                // if they provided a list, they all need to match (every instead of some)
                if (authors.every((a: string) => g.u.some(b => b.toLowerCase().includes(a.toLowerCase()))) === false) {
                    return false;
                }
            }

            // platform token
            if (tokens['platform']) {
                const mustHave = tokens['platform']
                    .split(',')
                    .filter((p: string) => p.startsWith('-') === false)
                    .map((p: string) => (p === 'psv' ? 'vita' : p).toLowerCase());

                const cannotHave = tokens['platform']
                    .split(',')
                    .filter((p: string) => p.startsWith('-') === true)
                    .map((p: string) => (p === '-psv' ? '-vita' : p).substring(1).toLowerCase());

                const guidePlatforms = buildPlatformList(g);

                if (mustHave.every((p: string) => guidePlatforms.some(b => b == p)) === false) {
                    return false;
                }

                if (cannotHave.length > 0 && cannotHave.some((p: string) => guidePlatforms.includes(p)) === true) {
                    return false;
                }
            }

            // platinum token
            if (tokens['platinum']) {
                // want platinum but there isn't one? bad
                if (tokens['platinum'].toLowerCase() === 'yes' && (!g.t || g.t[0] === 0)) {
                    return false;
                }

                // don't want platinum but there is one? bad
                if (tokens['platinum'].toLowerCase() === 'no' && g.t && g.t[0] === 1) {
                    return false;
                }
            }

            // src token
            if (tokens['src']) {
                if (tokens['src'].toLowerCase() === 'knoef' && (g.a & SOURCE_KNOEF) === 0) {
                    return false;
                }

                if (tokens['src'].toLowerCase() === 'platget' && (g.a & SOURCE_PLATGET) === 0) {
                    return false;
                }

                if (tokens['src'].toLowerCase() === 'powerpyx' && (g.a & SOURCE_POWERPYX) === 0) {
                    return false;
                }

                if (tokens['src'].toLowerCase() === 'pst' && (g.a & SOURCE_PLAYSTATIONTROPHIES) === 0) {
                    return false;
                }

                if (tokens['src'].toLowerCase() === 'psnp' && (g.a & SOURCE_PSNP) === 0) {
                    return false;
                }
            }

            // type token
            if (tokens['type']) {
                if (tokens['type'].toLowerCase() === 'trophy-guide' && (g.a & IS_TROPHY_GUIDE) === 0) {
                    return false;
                }

                if (tokens['type'].toLowerCase() === 'guide' && (g.a & IS_TROPHY_GUIDE) !== 0) {
                    return false;
                }
            }

            // trophies token
            if (tokens['trophies']) {
                const tokenValue = tokens['trophies'];
                const desiredTrophyCount = Number(tokenValue.replace(/<|>/, ''));
                const guideTrophyCount = g.t ? g.t.reduce((p, c) => p + c, 0) : 0;

                if (!g.t) {
                    // if the guide doesn't even have trophies, don't include it
                    return false;
                }

                if (tokenValue.startsWith('>')) {
                    // if trophy count starts with ">" find guides with a higher count
                    if (guideTrophyCount <= desiredTrophyCount) {
                        return false;
                    }
                }
                else if (tokenValue.startsWith('<')) {
                    // if trophy count starts with "<" find guides with a lower count
                    if (guideTrophyCount >= desiredTrophyCount) {
                        return false;
                    }
                }
                else if (!isNaN(desiredTrophyCount)) {
                    // if trophy count is a number, find perfect matches
                    if (guideTrophyCount !== desiredTrophyCount) {
                        return false;
                    }
                }

                return true;
            }

            // no reason for it not to be a match? return it
            return true;
        })
        .sort((tupleA, tupleB) => {
            const [_, rowA] = tupleA;
            const [__, rowB] = tupleB;

            const { a, b } = reverse ? { a: rowB, b: rowA } : { a: rowA, b: rowB };

            switch (orderBy) {
                case 'title':
                    return a.n.localeCompare(b.n);
                case 'difficulty':
                    return compareRatingForSorting(0, a, b, reverse ? 0 : 9999);
                case 'playthroughs':
                    return compareRatingForSorting(1, a, b, reverse ? 0 : 9999);
                case 'hours':
                    return compareRatingForSorting(2, a, b, reverse ? 0 : 9999);
                case 'published':
                    return a.d - b.d;
                default:
                    // default order is just how the guide is in there... maybe default to published?
                    return 1;
            }
        })
        .map(([id, guide]) => ({
            id,
            ...guide,
        }));

    // turn the entries back into an object
    return result;
}

// TODO its own file? its own tests?
function buildPlatformList(guide: Guide) {
    let platforms = [];
    if (guide.a & PLATFORM_PS3) {
        platforms.push('ps3');
    }
    if (guide.a & PLATFORM_PS4) {
        platforms.push('ps4');
    }
    if (guide.a & PLATFORM_PS5) {
        platforms.push('ps5');
    }
    if (guide.a & PLATFORM_PC) {
        platforms.push('pc');
    }
    if (guide.a & PLATFORM_VITA) {
        platforms.push('vita');
    }
    if (guide.a & PLATFORM_VR) {
        platforms.push('vr');
    }
    return platforms;
}

// TODO its own file? its own tests?
function compareRatingForFiltering(index: number, tokenValue: string, guide: Guide) {
    const difficultyNumber = Number(tokenValue.replace(/<|>/, ''));

    if (tokenValue.startsWith('>')) {
        // if difficulty starts with ">" find guides with higher difficulty
        if (!guide.r || !guide.r[index] || guide.r[index] <= difficultyNumber) {
            return false;
        }
    }
    else if (tokenValue.startsWith('<')) {
        // if difficulty starts with "<" find guides with lower difficulty
        if (!guide.r || !guide.r[index] || guide.r[index] >= difficultyNumber) {
            return false;
        }
    }
    else if (!isNaN(difficultyNumber)) {
        // if difficulty is a number, find perfect matches
        if (guide.r[index] !== difficultyNumber) {
            return false;
        }
    }

    return true;
}

// TODO its own file? its own tests?
function compareRatingForSorting(index: number, a: Guide, b: Guide, defaultValue: number) {
    const valueA = a.r && a.r[index] ? a.r[index] : defaultValue;
    const valueB = b.r && b.r[index] ? b.r[index] : defaultValue;
    return valueA - valueB;
}

// TODO its own file? its own tests?
function compareYesNoAttributeForFiltering(tokenValue: string, attribute: number, guide: Guide) {
    if (tokenValue.toLowerCase() === 'yes' && (guide.a & attribute) === 0) {
        return false;
    }

    if (tokenValue.toLowerCase() === 'no' && (guide.a & attribute) !== 0) {
        return false;
    }

    return true;
}
