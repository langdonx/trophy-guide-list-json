import type { Guide } from '../types/guides.d.ts';
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

export function filter(guides: Record<string, Guide>, searchText: string): (Guide & { id: string })[] {
    const tokens = new tokenParser().parse(searchText);

    // parse order details
    const orderBy = tokens.order?.replace('-', '').toLowerCase() ?? 'published';
    const reverse = tokens.order?.startsWith('-') ?? true;

    const result = Object.entries(guides)
        .filter(([gKey, g]) => {
            // the general strategy here:
            // - everything is a match until it's not
            // - so quit (return false to filter) if something is amiss

            // use leftOverTerms to search title
            if (tokens.leftOverTerms && g.title.toLowerCase().includes(tokens.leftOverTerms.toLowerCase()) === false) {
                return false;
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
                if (authors.every((a: string) => g.authors.some(b => b.toLowerCase().includes(a.toLowerCase()))) === false) {
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
                if (tokens['platinum'].toLowerCase() === 'yes' && (!g.trophies || g.trophies[0] === 0)) {
                    return false;
                }

                // don't want platinum but there is one? bad
                if (tokens['platinum'].toLowerCase() === 'no' && g.trophies && g.trophies[0] === 1) {
                    return false;
                }
            }

            // src token
            if (tokens['src']) {
                if (tokens['src'].toLowerCase() === 'knoef' && g.src !== SOURCE_KNOEF) {
                    return false;
                }

                if (tokens['src'].toLowerCase() === 'powerpyx' && g.src !== SOURCE_POWERPYX) {
                    return false;
                }

                if (tokens['src'].toLowerCase() === 'psnp' && g.src !== SOURCE_PSNP) {
                    return false;
                }
            }

            // type token
            if (tokens['type']) {
                if (tokens['type'].toLowerCase() === 'trophy-guide' && (g.attr & IS_TROPHY_GUIDE) === 0) {
                    return false;
                }

                if (tokens['type'].toLowerCase() === 'guide' && (g.attr & IS_TROPHY_GUIDE) !== 0) {
                    return false;
                }
            }

            // no reason for it not to be a match? return it
            return true;
        })
        .sort((tupleA, tupleB) => {
            const [rowKeyA, rowA] = tupleA;
            const [rowKeyB, rowB] = tupleB;

            const { a, b } = reverse ? { a: rowB, b: rowA } : { a: rowA, b: rowB };

            switch (orderBy) {
                case 'title':
                    return a.title.localeCompare(b.title);
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
    if (guide.attr & PLATFORM_PS3) {
        platforms.push('ps3');
    }
    if (guide.attr & PLATFORM_PS4) {
        platforms.push('ps4');
    }
    if (guide.attr & PLATFORM_PS5) {
        platforms.push('ps5');
    }
    if (guide.attr & PLATFORM_PC) {
        platforms.push('pc');
    }
    if (guide.attr & PLATFORM_VITA) {
        platforms.push('vita');
    }
    if (guide.attr & PLATFORM_VR) {
        platforms.push('vr');
    }
    return platforms;
}

// TODO its own file? its own tests?
function compareRatingForFiltering(index: number, tokenValue: string, guide: Guide) {
    const difficultyNumber = Number(tokenValue.replace(/<|>/, ''));

    if (tokenValue.startsWith('>')) {
        // if difficulty starts with ">" find guides with higher difficulty
        if (!guide.rating || !guide.rating[index] || guide.rating[index] <= difficultyNumber) {
            return false;
        }
    }
    else if (tokenValue.startsWith('<')) {
        // if difficulty starts with "<" find guides with lower difficulty
        if (!guide.rating || !guide.rating[index] || guide.rating[index] >= difficultyNumber) {
            return false;
        }
    }
    else if (!isNaN(difficultyNumber)) {
        // if difficulty is a number, find perfect matches
        if (guide.rating[index] !== difficultyNumber) {
            return false;
        }
    }

    return true;
}

// TODO its own file? its own tests?
function compareRatingForSorting(index: number, a: Guide, b: Guide, defaultValue: number) {
    const valueA = a.rating && a.rating[index] ? a.rating[index] : defaultValue;
    const valueB = b.rating && b.rating[index] ? b.rating[index] : defaultValue;
    return valueA - valueB;
}

// TODO its own file? its own tests?
function compareYesNoAttributeForFiltering(tokenValue: string, attribute: number, guide: Guide) {
    if (tokenValue.toLowerCase() === 'yes' && (guide.attr & attribute) === 0) {
        return false;
    }

    if (tokenValue.toLowerCase() === 'no' && (guide.attr & attribute) !== 0) {
        return false;
    }

    return true;
}

// TODO its own file? its own tests?
class tokenParser {
    STATE_TOKEN_OR_TEXT: number;
    STATE_TEXT_FOR_TOKEN: number;
    ACTION_IGNORE: number;
    ACTION_APPEND: number;
    ACTION_COMPLETE: number;

    constructor() {
        this.STATE_TOKEN_OR_TEXT = 1;
        this.STATE_TEXT_FOR_TOKEN = 2;
        this.ACTION_IGNORE = 1;
        this.ACTION_APPEND = 2;
        this.ACTION_COMPLETE = 3;
    }

    parse(input: string): Record<string, string> {
        const textToParse = (input || '') + '\x01'
        const tokens: Record<string, string> = { leftOverTerms: '', };

        let action: number, // TODO enum/or piped const list
            chr: string,
            i: number,
            parensLevel = 0,
            state = this.STATE_TOKEN_OR_TEXT,
            textBeingBuilt = '',
            tokenBeingBuilt = '';

        for (i = 0; i < textToParse.length; i++) {
            chr = textToParse[i];
            action = this.ACTION_IGNORE;

            switch (chr) {
                case ':':
                    if (state === this.STATE_TOKEN_OR_TEXT) {
                        state = this.STATE_TEXT_FOR_TOKEN;
                    } else if (state === this.STATE_TEXT_FOR_TOKEN) {
                        action = this.ACTION_APPEND;
                    }
                    break;

                case '(':
                    if (state === this.STATE_TEXT_FOR_TOKEN) {
                        parensLevel += 1;
                    }

                    if (parensLevel > 1) {
                        action = this.ACTION_APPEND;
                    }
                    break;

                case ')':
                    if (state === this.STATE_TOKEN_OR_TEXT) {
                        action = this.ACTION_APPEND;
                    } else if (state === this.STATE_TEXT_FOR_TOKEN) {
                        parensLevel -= 1;

                        if (parensLevel === 0) {
                            action = this.ACTION_COMPLETE;
                        } else {
                            action = this.ACTION_APPEND;
                        }
                    }
                    break;

                case ' ':
                    if (state === this.STATE_TOKEN_OR_TEXT) {
                        if (tokenBeingBuilt !== '') {
                            action = this.ACTION_COMPLETE;
                        }
                    } else if (state === this.STATE_TEXT_FOR_TOKEN) {
                        if (parensLevel === 0) {
                            action = this.ACTION_COMPLETE;
                        } else if (parensLevel > 0) {
                            action = this.ACTION_APPEND;
                        }
                    }
                    break;

                case '\x01':
                    if (parensLevel > 0) {
                        state = this.STATE_TOKEN_OR_TEXT;
                        action = this.ACTION_COMPLETE;
                    } else {
                        action = this.ACTION_COMPLETE;
                    }
                    break;

                default:
                    action = this.ACTION_APPEND;
                    break;
            }

            switch (action) {
                case this.ACTION_APPEND:
                    if (state === this.STATE_TOKEN_OR_TEXT) {
                        tokenBeingBuilt += chr;
                    } else if (state === this.STATE_TEXT_FOR_TOKEN) {
                        textBeingBuilt += chr;
                    }
                    break;
                case this.ACTION_COMPLETE:
                    if (state === this.STATE_TOKEN_OR_TEXT) {
                        tokens.leftOverTerms += ((tokens.leftOverTerms) ? ' ' : '') + tokenBeingBuilt;
                    } else if (state === this.STATE_TEXT_FOR_TOKEN) {
                        tokens[tokenBeingBuilt] = (tokens[tokenBeingBuilt] || '') + textBeingBuilt;
                        state = this.STATE_TOKEN_OR_TEXT;
                    }
                    textBeingBuilt = '';
                    tokenBeingBuilt = '';
                    break;
            }
        }

        return tokens;
    }
}
