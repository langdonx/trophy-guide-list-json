// ../types/attributes-v2.ts
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

// token-parser.ts
var tokenParser = class {
  STATE_TOKEN_OR_TEXT;
  STATE_TEXT_FOR_TOKEN;
  ACTION_IGNORE;
  ACTION_APPEND;
  ACTION_COMPLETE;
  constructor() {
    this.STATE_TOKEN_OR_TEXT = 1;
    this.STATE_TEXT_FOR_TOKEN = 2;
    this.ACTION_IGNORE = 1;
    this.ACTION_APPEND = 2;
    this.ACTION_COMPLETE = 3;
  }
  parse(input, validTokens = []) {
    const textToParse = (input || "") + "";
    const tokens = { leftOverTerms: "" };
    let action, chr, i, parensLevel = 0, state = this.STATE_TOKEN_OR_TEXT, textBeingBuilt = "", tokenBeingBuilt = "";
    for (i = 0; i < textToParse.length; i++) {
      chr = textToParse[i];
      action = this.ACTION_IGNORE;
      switch (chr) {
        case ":":
          if (state === this.STATE_TOKEN_OR_TEXT) {
            if (validTokens.length === 0 || validTokens.includes(tokenBeingBuilt) === true) {
              state = this.STATE_TEXT_FOR_TOKEN;
            } else {
              action = this.ACTION_APPEND;
            }
          } else if (state === this.STATE_TEXT_FOR_TOKEN) {
            action = this.ACTION_APPEND;
          }
          break;
        case "(":
          if (state === this.STATE_TEXT_FOR_TOKEN) {
            parensLevel += 1;
          }
          if (parensLevel > 1) {
            action = this.ACTION_APPEND;
          }
          break;
        case ")":
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
        case " ":
          if (state === this.STATE_TOKEN_OR_TEXT) {
            if (tokenBeingBuilt !== "") {
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
        case "":
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
            tokens.leftOverTerms += (tokens.leftOverTerms ? " " : "") + tokenBeingBuilt;
          } else if (state === this.STATE_TEXT_FOR_TOKEN) {
            tokens[tokenBeingBuilt] = (tokens[tokenBeingBuilt] || "") + textBeingBuilt;
            state = this.STATE_TOKEN_OR_TEXT;
          }
          textBeingBuilt = "";
          tokenBeingBuilt = "";
          break;
      }
    }
    return tokens;
  }
};

// guide-filter.ts
function filter(guides, searchText) {
  const tokens = new tokenParser().parse(searchText, [
    "author",
    "buggy",
    "difficulty",
    "dlc",
    "hours",
    "missable",
    "online",
    "order",
    "platform",
    "platinum",
    "playthroughs",
    "src",
    "type",
    "trophies"
  ]);
  const orderFields = !tokens.order ? [] : tokens.order.split(",").map((field) => {
    const reverse = field.startsWith("-");
    const property = field.replace("-", "").toLowerCase();
    return { property, reverse };
  });
  orderFields.push({ property: "published", reverse: true });
  const uniqueOrderFields = orderFields.filter((field, index, arr) => arr.findIndex((f) => f.property === field.property) === index);
  const punctuationRegex = /[-:,.’'"“”]/g;
  const cleanedUpTerms = tokens.leftOverTerms.toLowerCase().replace(punctuationRegex, "").replace(/  /g, " ").trim();
  const result = Object.entries(guides).filter(([_, g]) => {
    if (tokens.leftOverTerms) {
      const name = g.n.toLowerCase().replace(punctuationRegex, "").replace(/  /g, " ").trim();
      if (name.includes(cleanedUpTerms) === false) {
        return false;
      }
    }
    if (tokens["difficulty"] && compareRatingForFiltering(0, tokens["difficulty"], g) === false) {
      return false;
    }
    if (tokens["hours"] && compareRatingForFiltering(2, tokens["hours"], g) === false) {
      return false;
    }
    if (tokens["playthroughs"] && compareRatingForFiltering(1, tokens["playthroughs"], g) === false) {
      return false;
    }
    if (tokens["buggy"] && compareYesNoAttributeForFiltering(tokens["buggy"], HAS_BUGGY_TROPHIES, g) === false) {
      return false;
    }
    if (tokens["dlc"] && compareYesNoAttributeForFiltering(tokens["dlc"], IS_DLC, g) === false) {
      return false;
    }
    if (tokens["missable"] && compareYesNoAttributeForFiltering(tokens["missable"], HAS_MISSABLE_TROPHIES, g) === false) {
      return false;
    }
    if (tokens["online"] && compareYesNoAttributeForFiltering(tokens["online"], HAS_ONLINE_TROPHIES, g) === false) {
      return false;
    }
    if (tokens["author"]) {
      const guideAuthors = g.u.map((author) => author.toLowerCase());
      const mustHaveExclusive = tokens["author"].split(",").filter((a) => a.startsWith("+")).map((a) => a.substring(1).toLowerCase());
      if (mustHaveExclusive.length > 0) {
        const hasAllExclusive = mustHaveExclusive.every((a) => guideAuthors.some((b) => b.includes(a)));
        const hasOnlyExclusive = guideAuthors.every((author) => mustHaveExclusive.some((a) => author.includes(a)));
        if (!hasAllExclusive || !hasOnlyExclusive) {
          return false;
        }
      } else {
        const mustHave = tokens["author"].split(",").filter((a) => !a.startsWith("-") && !a.startsWith("+")).map((a) => a.toLowerCase());
        const cannotHave = tokens["author"].split(",").filter((a) => a.startsWith("-")).map((a) => a.substring(1).toLowerCase());
        if (mustHave.length > 0 && mustHave.every((a) => guideAuthors.some((b) => b.includes(a))) === false) {
          return false;
        }
        if (cannotHave.length > 0 && cannotHave.some((a) => guideAuthors.some((b) => b.includes(a))) === true) {
          return false;
        }
      }
    }
    if (tokens["platform"]) {
      const guidePlatforms = buildPlatformList(g);
      const mustHaveExclusive = tokens["platform"].split(",").filter((p) => p.startsWith("+")).map((p) => {
        const platform = p.substring(1);
        return (platform === "psv" ? "vita" : platform).toLowerCase();
      });
      if (mustHaveExclusive.length > 0) {
        const hasAllExclusive = mustHaveExclusive.every((p) => guidePlatforms.includes(p));
        const hasOnlyExclusive = guidePlatforms.every((platform) => mustHaveExclusive.includes(platform));
        if (!hasAllExclusive || !hasOnlyExclusive || guidePlatforms.length !== mustHaveExclusive.length) {
          return false;
        }
      } else {
        const mustHave = tokens["platform"].split(",").filter((p) => !p.startsWith("-") && !p.startsWith("+")).map((p) => (p === "psv" ? "vita" : p).toLowerCase());
        const cannotHave = tokens["platform"].split(",").filter((p) => p.startsWith("-")).map((p) => (p === "-psv" ? "-vita" : p).substring(1).toLowerCase());
        if (mustHave.length > 0 && mustHave.every((p) => guidePlatforms.some((b) => b == p)) === false) {
          return false;
        }
        if (cannotHave.length > 0 && cannotHave.some((p) => guidePlatforms.includes(p)) === true) {
          return false;
        }
      }
    }
    if (tokens["platinum"]) {
      if (tokens["platinum"].toLowerCase() === "yes" && (!g.t || g.t[0] === 0)) {
        return false;
      }
      if (tokens["platinum"].toLowerCase() === "no" && g.t && g.t[0] === 1) {
        return false;
      }
    }
    if (tokens["src"]) {
      const source = tokens["src"].replace(/\+/g, "");
      const mustHave = source.split(",").filter((s) => s.startsWith("-") === false).map((s) => s.toLowerCase());
      const cannotHave = source.split(",").filter((s) => s.startsWith("-") === true).map((s) => s.substring(1).toLowerCase());
      const guideSources = buildSourceList(g);
      if (mustHave.length > 0 && mustHave.some((s) => guideSources.some((b) => b == s)) === false) {
        return false;
      }
      if (cannotHave.length > 0 && cannotHave.some((s) => guideSources.includes(s)) === true) {
        return false;
      }
    }
    if (tokens["type"]) {
      if (tokens["type"].toLowerCase() === "trophy-guide" && (g.a & IS_TROPHY_GUIDE) === 0) {
        return false;
      }
      if (tokens["type"].toLowerCase() === "guide" && (g.a & IS_TROPHY_GUIDE) !== 0) {
        return false;
      }
    }
    if (tokens["trophies"]) {
      if (!g.t) {
        return false;
      }
      if (!compareTrophyCountForFiltering(tokens["trophies"], g)) {
        return false;
      }
    }
    return true;
  }).sort((tupleA, tupleB) => {
    const [_, rowA] = tupleA;
    const [__, rowB] = tupleB;
    for (const { property, reverse } of uniqueOrderFields) {
      const { a, b } = reverse ? { a: rowB, b: rowA } : { a: rowA, b: rowB };
      let comparison = 0;
      switch (property) {
        case "title":
          comparison = a.n.localeCompare(b.n);
          break;
        case "difficulty":
          comparison = compareRatingForSorting(0, a, b, reverse ? 0 : 9999);
          break;
        case "playthroughs":
          comparison = compareRatingForSorting(1, a, b, reverse ? 0 : 9999);
          break;
        case "hours":
          comparison = compareRatingForSorting(2, a, b, reverse ? 0 : 9999);
          break;
        case "published":
          comparison = a.d - b.d;
          break;
        default:
          continue;
      }
      if (comparison !== 0) {
        return comparison;
      }
    }
    return 0;
  }).map(([id, guide]) => ({
    id,
    ...guide
  }));
  return result;
}
function buildPlatformList(guide) {
  let platforms = [];
  if (guide.a & PLATFORM_PS3) {
    platforms.push("ps3");
  }
  if (guide.a & PLATFORM_PS4) {
    platforms.push("ps4");
  }
  if (guide.a & PLATFORM_PS5) {
    platforms.push("ps5");
  }
  if (guide.a & PLATFORM_PC) {
    platforms.push("pc");
  }
  if (guide.a & PLATFORM_VITA) {
    platforms.push("vita");
  }
  if (guide.a & PLATFORM_VR) {
    platforms.push("vr");
  }
  return platforms;
}
function buildSourceList(guide) {
  let sources = [];
  if (guide.a & SOURCE_PSNP) {
    sources.push("psnp");
  }
  if (guide.a & SOURCE_KNOEF) {
    sources.push("knoef");
  }
  if (guide.a & SOURCE_VIDEOGAMELIZARD) {
    sources.push("vgl");
  }
  if (guide.a & SOURCE_PLATGET) {
    sources.push("platget");
  }
  if (guide.a & SOURCE_PLAYSTATIONTROPHIES) {
    sources.push("pst");
  }
  if (guide.a & SOURCE_POWERPYX) {
    sources.push("powerpyx");
  }
  return sources;
}
function compareRatingForFiltering(index, tokenValue, guide) {
  if (tokenValue.includes("-") && !tokenValue.startsWith("<") && !tokenValue.startsWith(">")) {
    const [minStr, maxStr] = tokenValue.split("-");
    const minValue = Number(minStr);
    const maxValue = Number(maxStr);
    if (!isNaN(minValue) && !isNaN(maxValue)) {
      const guideValue = guide.r && guide.r[index] ? guide.r[index] : 0;
      if (guideValue >= minValue && guideValue < maxValue + 1) {
        return true;
      } else {
        return false;
      }
    }
  }
  const difficultyNumber = Number(tokenValue.replace(/<|>/, ""));
  if (tokenValue.startsWith(">")) {
    if (!guide.r || !guide.r[index] || guide.r[index] <= difficultyNumber) {
      return false;
    }
  } else if (tokenValue.startsWith("<")) {
    if (!guide.r || !guide.r[index] || guide.r[index] >= difficultyNumber) {
      return false;
    }
  } else if (!isNaN(difficultyNumber)) {
    if (guide.r[index] !== difficultyNumber) {
      return false;
    }
  }
  return true;
}
function compareTrophyCountForFiltering(tokenValue, guide) {
  const guideTrophyCount = guide.t ? guide.t.reduce((p, c) => p + c, 0) : 0;
  if (tokenValue.includes("-") && !tokenValue.startsWith("<") && !tokenValue.startsWith(">")) {
    const [minStr, maxStr] = tokenValue.split("-");
    const minValue = Number(minStr);
    const maxValue = Number(maxStr);
    if (!isNaN(minValue) && !isNaN(maxValue)) {
      if (guideTrophyCount >= minValue && guideTrophyCount <= maxValue) {
        return true;
      } else {
        return false;
      }
    }
  }
  const desiredTrophyCount = Number(tokenValue.replace(/<|>/, ""));
  if (tokenValue.startsWith(">")) {
    if (guideTrophyCount <= desiredTrophyCount) {
      return false;
    }
  } else if (tokenValue.startsWith("<")) {
    if (guideTrophyCount >= desiredTrophyCount) {
      return false;
    }
  } else if (!isNaN(desiredTrophyCount)) {
    if (guideTrophyCount !== desiredTrophyCount) {
      return false;
    }
  }
  return true;
}
function compareRatingForSorting(index, a, b, defaultValue) {
  const valueA = a.r && a.r[index] ? a.r[index] : defaultValue;
  const valueB = b.r && b.r[index] ? b.r[index] : defaultValue;
  return valueA - valueB;
}
function compareYesNoAttributeForFiltering(tokenValue, attribute, guide) {
  if (tokenValue.toLowerCase() === "yes" && (guide.a & attribute) === 0) {
    return false;
  }
  if (tokenValue.toLowerCase() === "no" && (guide.a & attribute) !== 0) {
    return false;
  }
  return true;
}
export {
  filter,
  tokenParser
};
