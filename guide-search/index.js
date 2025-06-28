// TODO implement exclusions (platform:psv,-ps3,-ps4)

// TODO create a corrections.json to fix things that the script won't account for

// TODO fix knoef export to fallback to game data for trophy counts
// TODO render trophy counts

switchColorScheme(true);
initVueApp();

const SOURCE_PSNP = 1;
const SOURCE_KNOEF = 2;
const SOURCE_POWERPYX = 3;

const IS_TROPHY_GUIDE = 1 << 0;
const IS_DLC = 1 << 1;

const PLATFORM_PC = 1 << 9;
const PLATFORM_PS3 = 1 << 2;
const PLATFORM_PS4 = 1 << 3;
const PLATFORM_PS5 = 1 << 4;
const PLATFORM_VITA = 1 << 5;
const PLATFORM_VR = 1 << 6;

const HAS_BUGGY_TROPHIES = 1 << 7;
const HAS_MISSABLE_TROPHIES = 1 << 10;
const HAS_ONLINE_TROPHIES = 1 << 8;

function initVueApp() {
  const {reactive, computed, onMounted} = Vue;

  const app = {
    setup: function() {
      const searchExamples = [{
        isHeader: true,
        title: 'Examples'
      },
        {
          searchText: 'evil',
          title: 'By Title'
        },
        {
          searchText: 'evil author:gameboy',
          title: 'By Author'
        },
        {
          searchText: 'evil author:gameboy platform:ps5',
          title: 'By Platform'
        },
        {
          title: '-'
        },
        {
          isHeader: true,
          title: 'Source'
        },
        {
          searchText: 'src:knoef',
          title: 'Knoef Trophy Guides'
        },
        {
          searchText: 'src:powerpyx',
          title: 'PowerPyx'
        },
        {
          searchText: 'src:psnp',
          title: 'PSNProfiles'
        },
        {
          title: '-'
        },
        {
          searchText: 'order:-published',
          title: 'Recent Guides',
        },
        {
          searchText: 'type:trophy-guide',
          title: 'Trophy Guides'
        },
        {
          searchText: 'type:guide',
          title: 'Walkthroughs'
        },
        {
          title: '-'
        },
        {
          searchText: 'dlc:yes',
          title: 'DLC'
        },
        {
          searchText: 'difficulty:<2 hours:<5 dlc:no order:difficulty',
          title: 'EZPZ'
        },
        {
          searchText: 'hours:>200 order:-hours',
          title: 'Intense Grind'
        },
        {
          searchText: 'platinum:no dlc:no type:trophy-guide',
          title: 'No Platinum'
        },
        {
          searchText: 'platform:psv,-ps3,-ps4',
          title: 'Vita Exclusives'
        },
      ];

      const componentState = reactive({
        dropDownExamples: false,
        dropDownOrder: false,
        guides: {},
        guideIds: [],
        loading: false,
        search: {
          guidesPerPage: 256,
          orderBy: 'Title',
          orderByReverse: false,
          page: 1,
          pageCount: 1,
          results: [],
          resultsCount: 0,
          text: '',
        },
      })

      onMounted(() => {
        componentState.loading = true;

        fetch('https://langdonx.github.io/trophy-guide-list-json/guides-v1.min.json')
          .then(response => response.json())
          .then(json => {
            componentState.guides = json;
            componentState.guideIds = Object.keys(json);
            componentState.loading = false;
            componentState.search.text = 'order:-published';

            const lastPublished = Object.values(componentState.guides).filter(g => g.src === SOURCE_PSNP).reduce((p, c) => !c.d ? p : Math.max(p, c.d), 0);

            console.log({
              lastPublished
            });
            search();
          });

      });

      const isAscending = computed((orderBy) => {
        return !componentState.search.orderByReverse;
      });

      function formatPublishedDate(d) {
        const date = typeof (d) === 'object' ? d : new Date(d);
        const options = {
          month: 'short',
          day: 'numeric',
          year: 'numeric', // date.getUTCFullYear() === new Date().getUTCFullYear() ? 'numeric' : undefined,
        };

        return date.toLocaleString('en-US', options);
      }

      function getTrophyPoints(trophies) {
        if (Array.isArray(trophies) === false) {
          return 0;
        }

        if (trophies.length != 4) {
          console.error('Unexpected number of trophies', trophies);
          return 0;
        }

        return trophies[0] * 300
          + trophies[1] * 90
          + trophies[2] * 30
          + trophies[3] * 15;
      }

      function onAppClick() {
        componentState.dropDownExamples = false;
        componentState.dropDownOrder = false;
      }

      function onFormSubmit() {
        componentState.search.page = 1;
        search();
      }

      function onOrderClick(orderBy) {
        componentState.search.orderByReverse = orderBy === componentState.search.orderBy && !componentState.search.orderByReverse;
        componentState.search.orderBy = orderBy;

        const orderByText = `order:${(componentState.search.orderByReverse) ? '-' : ''}${orderBy.replace(' ', '-').toLowerCase()}`;
        if (componentState.search.text.includes('order:')) {
          componentState.search.text = componentState.search.text.replace(/order\:([A-Za-z\-]+)/, orderByText);
        } else {
          componentState.search.text += ` ${orderByText}`
        }

        search();
      }

      function onPageClick(page) {
        componentState.search.page = page;

        search();
      }

      function onSearchLinkClick(searchText) {
        componentState.search.text = searchText;
        search();
      }

      function search() {
        const tokens = new tokenParser().parse(componentState.search.text);

        if (tokens.order) {
          if (tokens.order.endsWith('title')) {
            componentState.search.orderBy = 'Title';
            componentState.search.orderByReverse = tokens.order.includes('reverse');
          } else if (tokens.order.startsWith('hours')) {
            componentState.search.orderBy = 'Hours';
            componentState.search.orderByReverse = tokens.order.includes('reverse');
          } else if (tokens.order.startsWith('difficulty')) {
            componentState.search.orderBy = 'Difficulty';
            componentState.search.orderByReverse = tokens.order.includes('reverse');
          } else if (tokens.order.startsWith('published')) {
            componentState.search.orderBy = 'Published';
            componentState.search.orderByReverse = tokens.order.includes('reverse');
          }
        }

        const results = filter(componentState.guides, componentState.search.text);

        const list = results
          .map((guide, index) => {
            const url = (guide.src === SOURCE_PSNP) ?
              `https://psnprofiles.com/guide/${guide.id}` :
              (guide.src === SOURCE_KNOEF) ?
                `https://knoef.info/${guide.id}` :
                `https://powerpyx.com/${guide.id}`;

            const result = {
              authors: guide.authors.join(', '),
              published: guide.d,
              publishedFormatted: formatPublishedDate(guide.d),
              isBuggy: guide.attr & HAS_BUGGY_TROPHIES,
              isDlc: guide.attr & IS_DLC,
              isOnline: guide.attr & HAS_ONLINE_TROPHIES,
              isTrophyGuide: guide.attr & IS_TROPHY_GUIDE,
              platforms: buildPlatforms(guide),
              src: guide.src,
              title: guide.title,
              trophyCount: Array.isArray(guide.trophies) ? guide.trophies.reduce((p, c) => p + c, 0) : 0,
              trophyPoints: getTrophyPoints(guide.trophies),
              url,
            };

            if (guide.attr & IS_TROPHY_GUIDE) {
              result.difficulty = guide.rating[0];
              result.difficultyClass = `d${guide.rating[0] + 1}`;

              result.playthroughs = guide.rating[1];
              result.playthroughsClass = guide.rating[1] <= 4 ? `p${guide.rating[1]}` : 'p5';

              result.hours = guide.rating[2];
              result.hoursClass = 'd' + (result.hours >= 90 ? '9' : Math.floor(result.hours / 10 % 10) + 1);
            }

            return result;
          });

        componentState.search.lowerBound = (componentState.search.page - 1) * componentState.search.guidesPerPage;
        componentState.search.upperBound = Math.min(
          (componentState.search.page - 1) * componentState.search.guidesPerPage + componentState.search.guidesPerPage,
          list.length);
        componentState.search.resultsCount = list.length;
        componentState.search.results = list.slice(componentState.search.lowerBound, componentState.search.upperBound);
        componentState.search.pageCount = Math.ceil(list.length / componentState.search.guidesPerPage);
      }

      return {
        componentState,
        isAscending,
        onAppClick,
        onFormSubmit,
        onOrderClick,
        onPageClick,
        onSearchLinkClick,
        searchExamples,
      };
    }
  };

  Vue
    .createApp(app)
    .mount('#app');
}

function buildPlatforms(guide) {
  let platforms = [];
  if (guide.attr & PLATFORM_PS3) {
    platforms.push('PS3');
  }
  if (guide.attr & PLATFORM_PS4) {
    platforms.push('PS4');
  }
  if (guide.attr & PLATFORM_PS5) {
    platforms.push('PS5');
  }
  if (guide.attr & PLATFORM_VITA) {
    platforms.push('Vita');
  }
  if (guide.attr & PLATFORM_VR) {
    platforms.push('VR');
  }
  return platforms;
}

function switchColorScheme(subscribe = false) {
  if (subscribe === true) {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => switchColorScheme);
  }

  const theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  document
    .querySelector('html')
    .setAttribute('data-bs-theme', theme);
}

async function waitAsync(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}






//
// guide-filter.ts
//

function filter(guides, searchText) {
  var _a,
    _b,
    _c,
    _d;
  const tokens = new tokenParser().parse(searchText);
  // parse order details
  const orderBy = (_b = (_a = tokens.order) === null || _a === void 0 ? void 0 : _a.replace('-', '').toLowerCase()) !== null && _b !== void 0 ? _b : '';
  const reverse = (_d = (_c = tokens.order) === null || _c === void 0 ? void 0 : _c.startsWith('-')) !== null && _d !== void 0 ? _d : false;
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
        if (authors.every((a) => g.authors.some(b => b.toLowerCase().includes(a.toLowerCase()))) === false) {
          return false;
        }
      }
      // platform token
      if (tokens['platform']) {
        const mustHave = tokens['platform']
          .split(',')
          .filter((p) => p.startsWith('-') === false)
          .map((p) => (p === 'psv' ? 'vita' : p).toLowerCase());
        const cannotHave = tokens['platform']
          .split(',')
          .filter((p) => p.startsWith('-') === true)
          .map((p) => (p === '-psv' ? '-vita' : p).substring(1).toLowerCase());
        const guidePlatforms = buildPlatformList(g);
        if (mustHave.every((p) => guidePlatforms.some(b => b == p)) === false) {
          return false;
        }
        if (cannotHave.length > 0 && cannotHave.some((p) => guidePlatforms.includes(p)) === true) {
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
      const {a, b} = reverse ? {
        a: rowB,
        b: rowA
      } : {
        a: rowA,
        b: rowB
      };
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
function buildPlatformList(guide) {
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
function compareRatingForFiltering(index, tokenValue, guide) {
  const difficultyNumber = Number(tokenValue.replace(/<|>/, ''));
  if (tokenValue.startsWith('>')) {
    // if difficulty starts with ">" find guides with higher difficulty
    if (!guide.rating || !guide.rating[index] || guide.rating[index] <= difficultyNumber) {
      return false;
    }
  } else if (tokenValue.startsWith('<')) {
    // if difficulty starts with "<" find guides with lower difficulty
    if (!guide.rating || !guide.rating[index] || guide.rating[index] >= difficultyNumber) {
      return false;
    }
  } else if (!isNaN(difficultyNumber)) {
    // if difficulty is a number, find perfect matches
    if (guide.rating[index] !== difficultyNumber) {
      return false;
    }
  }
  return true;
}
// TODO its own file? its own tests?
function compareRatingForSorting(index, a, b, defaultValue) {
  const valueA = a.rating && a.rating[index] ? a.rating[index] : defaultValue;
  const valueB = b.rating && b.rating[index] ? b.rating[index] : defaultValue;
  return valueA - valueB;
}
// TODO its own file? its own tests?
function compareYesNoAttributeForFiltering(tokenValue, attribute, guide) {
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
  constructor() {
    this.STATE_TOKEN_OR_TEXT = 1;
    this.STATE_TEXT_FOR_TOKEN = 2;
    this.ACTION_IGNORE = 1;
    this.ACTION_APPEND = 2;
    this.ACTION_COMPLETE = 3;
  }
  parse(input) {
    const textToParse = (input || '') + '\x01';
    const tokens = {
      leftOverTerms: '',
    };
    let action, // TODO enum/or piped const list
      chr,
      i,
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
