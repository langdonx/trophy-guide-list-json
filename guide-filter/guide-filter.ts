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
    const orderFields = !tokens.order
        ? []
        : tokens.order.split(',').map(field => {
            const reverse = field.startsWith('-');
            const property = field.replace('-', '').toLowerCase();
            return { property, reverse };
        });

    // if no order fields are specified, default to showing newest first
    orderFields.push({ property: 'published', reverse: true });

    // remove duplicates while preserving order
    const uniqueOrderFields = orderFields
        .filter((field, index, arr) => arr.findIndex(f => f.property === field.property) === index);

    const punctuationRegex = /[-:,.’'"“”]/g;

    const cleanedUpTerms = tokens.leftOverTerms.toLowerCase()
        .replace(punctuationRegex, '')
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
                    .replace(punctuationRegex, '')
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
                const guideAuthors = g.u.map(author => author.toLowerCase());

                const mustHaveExclusive = tokens['author']
                    .split(',')
                    .filter((a: string) => a.startsWith('+'))
                    .map((a: string) => a.substring(1).toLowerCase());


                if (mustHaveExclusive.length > 0) {
                    // For exclusive, the guide must have exactly these authors and no others
                    const hasAllExclusive = mustHaveExclusive.every((a: string) => guideAuthors.some(b => b.includes(a)));
                    const hasOnlyExclusive = guideAuthors.every(author => mustHaveExclusive.some(a => author.includes(a)));

                    if (!hasAllExclusive || !hasOnlyExclusive) {
                        return false;
                    }
                }
                else {
                    const mustHave = tokens['author']
                        .split(',')
                        .filter((a: string) => !a.startsWith('-') && !a.startsWith('+'))
                        .map((a: string) => a.toLowerCase());

                    const cannotHave = tokens['author']
                        .split(',')
                        .filter((a: string) => a.startsWith('-'))
                        .map((a: string) => a.substring(1).toLowerCase());

                    if (mustHave.length > 0 && mustHave.every((a: string) => guideAuthors.some(b => b.includes(a))) === false) {
                        return false;
                    }

                    if (cannotHave.length > 0 && cannotHave.some((a: string) => guideAuthors.some(b => b.includes(a))) === true) {
                        return false;
                    }
                }
            }

            // platform token
            if (tokens['platform']) {
                const guidePlatforms = buildPlatformList(g);

                const mustHaveExclusive = tokens['platform']
                    .split(',')
                    .filter((p: string) => p.startsWith('+'))
                    .map((p: string) => {
                        const platform = p.substring(1);
                        return (platform === 'psv' ? 'vita' : platform).toLowerCase();
                    });

                if (mustHaveExclusive.length > 0) {
                    // For exclusive, the guide must have exactly these platforms and no others
                    const hasAllExclusive = mustHaveExclusive.every((p: string) => guidePlatforms.includes(p));
                    const hasOnlyExclusive = guidePlatforms.every(platform => mustHaveExclusive.includes(platform));

                    if (!hasAllExclusive || !hasOnlyExclusive || guidePlatforms.length !== mustHaveExclusive.length) {
                        return false;
                    }
                }
                else {
                    const mustHave = tokens['platform']
                        .split(',')
                        .filter((p: string) => !p.startsWith('-') && !p.startsWith('+'))
                        .map((p: string) => (p === 'psv' ? 'vita' : p).toLowerCase());

                    const cannotHave = tokens['platform']
                        .split(',')
                        .filter((p: string) => p.startsWith('-'))
                        .map((p: string) => (p === '-psv' ? '-vita' : p).substring(1).toLowerCase());

                    if (mustHave.length > 0 && mustHave.every((p: string) => guidePlatforms.some(b => b == p)) === false) {
                        return false;
                    }

                    if (cannotHave.length > 0 && cannotHave.some((p: string) => guidePlatforms.includes(p)) === true) {
                        return false;
                    }
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
                // it's nonsensical to have exclusive sources, so just in case someone tries, just ignore the + character
                const source = tokens['src'].replace(/\+/g, '');

                const mustHave = source
                    .split(',')
                    .filter((s: string) => s.startsWith('-') === false)
                    .map((s: string) => s.toLowerCase());

                const cannotHave = source
                    .split(',')
                    .filter((s: string) => s.startsWith('-') === true)
                    .map((s: string) => s.substring(1).toLowerCase());

                const guideSources = buildSourceList(g);

                if (mustHave.length > 0 && mustHave.some((s: string) => guideSources.some(b => b == s)) === false) {
                    return false;
                }

                if (cannotHave.length > 0 && cannotHave.some((s: string) => guideSources.includes(s)) === true) {
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
                if (!g.t) {
                    // if the guide doesn't even have trophies, don't include it
                    return false;
                }

                if (!compareTrophyCountForFiltering(tokens['trophies'], g)) {
                    return false;
                }
            }

            // no reason for it not to be a match? return it
            return true;
        })
        .sort((tupleA, tupleB) => {
            const [_, rowA] = tupleA;
            const [__, rowB] = tupleB;

            // iterate through each sort field until we find a non-zero comparison
            for (const { property, reverse } of uniqueOrderFields) {
                const { a, b } = reverse ? { a: rowB, b: rowA } : { a: rowA, b: rowB };
                let comparison = 0;

                switch (property) {
                    case 'title':
                        comparison = a.n.localeCompare(b.n);
                        break;
                    case 'difficulty':
                        comparison = compareRatingForSorting(0, a, b, reverse ? 0 : 9999);
                        break;
                    case 'playthroughs':
                        comparison = compareRatingForSorting(1, a, b, reverse ? 0 : 9999);
                        break;
                    case 'hours':
                        comparison = compareRatingForSorting(2, a, b, reverse ? 0 : 9999);
                        break;
                    case 'published':
                        comparison = a.d - b.d;
                        break;
                    default:
                        // unknown field, skip
                        continue;
                }

                // if this field produces a non-zero comparison, use it
                if (comparison !== 0) {
                    return comparison;
                }
            }

            // all fields were equal, maintain original order
            return 0;
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
function buildSourceList(guide: Guide) {
    let sources = [];
    if (guide.a & SOURCE_PSNP) {
        sources.push('psnp');
    }
    if (guide.a & SOURCE_KNOEF) {
        sources.push('knoef');
    }
    if (guide.a & SOURCE_PLATGET) {
        sources.push('platget');
    }
    if (guide.a & SOURCE_PLAYSTATIONTROPHIES) {
        sources.push('pst');
    }
    if (guide.a & SOURCE_POWERPYX) {
        sources.push('powerpyx');
    }
    return sources;
}

// TODO its own file? its own tests?
function compareRatingForFiltering(index: number, tokenValue: string, guide: Guide) {
    // check for range pattern (e.g., "4-6")
    if (tokenValue.includes('-') && !tokenValue.startsWith('<') && !tokenValue.startsWith('>')) {
        const [minStr, maxStr] = tokenValue.split('-');
        const minValue = Number(minStr);
        const maxValue = Number(maxStr);

        if (!isNaN(minValue) && !isNaN(maxValue)) {
            const guideValue = guide.r && guide.r[index] ? guide.r[index] : 0;
            // inclusive range: >= min and < (max + 1)
            if (guideValue >= minValue && guideValue < maxValue + 1) {
                return true;
            } else {
                return false;
            }
        }
    }

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
function compareTrophyCountForFiltering(tokenValue: string, guide: Guide) {
    const guideTrophyCount = guide.t ? guide.t.reduce((p, c) => p + c, 0) : 0;

    // check for range pattern (e.g., "20-50")
    if (tokenValue.includes('-') && !tokenValue.startsWith('<') && !tokenValue.startsWith('>')) {
        const [minStr, maxStr] = tokenValue.split('-');
        const minValue = Number(minStr);
        const maxValue = Number(maxStr);

        if (!isNaN(minValue) && !isNaN(maxValue)) {
            // inclusive range: >= min and <= max
            if (guideTrophyCount >= minValue && guideTrophyCount <= maxValue) {
                return true;
            } else {
                return false;
            }
        }
    }

    const desiredTrophyCount = Number(tokenValue.replace(/<|>/, ''));

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
