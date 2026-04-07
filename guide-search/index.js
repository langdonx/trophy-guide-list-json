// TODO fix knoef export to fallback to game data for trophy counts
// TODO render trophy counts
import { filter, tokenParser } from "./guide-filter.modern.js";

var SOURCE_PSNP = 1 << 0;
var SOURCE_KNOEF = 1 << 1;
var SOURCE_PLATGET = 1 << 2;
var SOURCE_PLAYSTATIONTROPHIES = 1 << 3;
var SOURCE_POWERPYX = 1 << 4;
var SOURCE_VIDEOGAMELIZARD = 1 << 16;
var IS_TROPHY_GUIDE = 1 << 5;
var IS_DLC = 1 << 6;
var PLATFORM_PS3 = 1 << 7;
var PLATFORM_PS4 = 1 << 8;
var PLATFORM_PS5 = 1 << 9;
var PLATFORM_VITA = 1 << 10;
var PLATFORM_PC = 1 << 11;
var PLATFORM_VR = 1 << 12;
var HAS_BUGGY_TROPHIES = 1 << 13;
var HAS_MISSABLE_TROPHIES = 1 << 14;
var HAS_ONLINE_TROPHIES = 1 << 15;

switchColorScheme(true);
initVueApp();

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
          searchText: 'src:platget',
          title: 'PlatGet'
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
          searchText: 'src:pst',
          title: 'PST.org'
        },
        {
          searchText: 'src:vgl',
          title: 'VideoGameLizard'
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

        //fetch('https://langdonx.github.io/trophy-guide-list-json/guides-v2.min.json')
        fetch('../guides-v2.min.json')
          .then(response => response.json())
          .then(json => {
            componentState.guides = json;
            componentState.guideIds = Object.keys(json);
            componentState.loading = false;
            componentState.search.text = 'order:-published';

            const lastPublished = Object.values(componentState.guides)
              .filter(g => g.src === SOURCE_PSNP)
              .reduce((p, c) => !c.d ? p : Math.max(p, c.d), 0);

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
            // When .a & SOURCE_KNOEF, the URL is https://knoef.info/${path}
            // When .a & SOURCE_PLATGET, the URL is https://www.platget.com/${path}
            // When .a & SOURCE_PLAYSTATIONTROPHIES, the URL is https://www.playstationtrophies.org/game/${path}
            // When .a & SOURCE_POWERPYX, the URL is https://powerpyx.com/${path}
            // When .a & SOURCE_VIDEOGAMELIZARD, the URL is https://powerpyx.com/${path}
            const url = (guide.a & SOURCE_KNOEF) ? `https://knoef.info/${guide.id}`
              : (guide.a & SOURCE_PLATGET) ? `https://www.platget.com/${guide.id}`
                : (guide.a & SOURCE_POWERPYX) ? `https://powerpyx.com/${guide.id}`
                  : (guide.a & SOURCE_PLAYSTATIONTROPHIES) ? `https://www.playstationtrophies.org/game/${guide.id}`
                    : (guide.a & SOURCE_VIDEOGAMELIZARD) ? `https://videogamelizard.com/${guide.id}`
                      : `https://psnprofiles.com/guide/${guide.id}`;

            const result = {
              authors: guide.u.join(', ') || 'Unknown',
              published: guide.d,
              publishedFormatted: formatPublishedDate(guide.d),
              hasMissable: guide.a & HAS_MISSABLE_TROPHIES,
              isBuggy: guide.a & HAS_BUGGY_TROPHIES,
              isDlc: guide.a & IS_DLC,
              isOnline: guide.a & HAS_ONLINE_TROPHIES,
              isTrophyGuide: guide.a & IS_TROPHY_GUIDE,
              platforms: buildPlatforms(guide),
              src: guide.s,
              title: guide.n,
              trophyCount: Array.isArray(guide.t) ? guide.t.reduce((p, c) => p + c, 0) : 0,
              trophyPoints: getTrophyPoints(guide.t),
              url,
            };

            if (guide.a & IS_TROPHY_GUIDE) {
              result.difficulty = guide.r[0];
              result.difficultyClass = `d${guide.r[0] + 1}`;

              result.playthroughs = guide.r[1];
              result.playthroughsClass = guide.r[1] <= 4 ? `p${guide.r[1]}` : 'p5';

              result.hours = guide.r[2];
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

  document.querySelector('body').classList.remove('init');
}

function buildPlatforms(guide) {
  let platforms = [];
  if (guide.attr & PLATFORM_PC) {
    platforms.push('PC');
  }
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
