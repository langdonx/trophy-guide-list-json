# trophy-guide-list-json

See `/types` for schema explanation.

## JSON

### games-v2.min.json

Data maps to type `GameToGuideMap` in `./types/games-v2.d.ts`.

Thie file maps PSNProfiles gameIds to a preferred guide:
1. Featured guide on PSNProfiles game page (chosen at random by PSNProfiles)
1. PowerPyx Guide to fill in PSNProfiles gaps
1. PlayStation Trophies Guide to further fill in gaps
1. PlatGet Guide to further fill in gaps
1. Knoef Guide to further fill in gaps

- The `a` property is further explained in the Attributes section below.
- The `p` property is provided when the source is not PSNProfiles. It can be combined with the appropriate root URL to access the guide.
  - When `.a & SOURCE_KNOEF`, the URL is `https://knoef.info/${path}`
  - When `.a & SOURCE_PLATGET`, the URL is `https://www.platget.com/${path}`
  - When `.a & SOURCE_PLAYSTATIONTROPHIES`, the URL is `https://www.playstationtrophies.org/game/${path}`
  - When `.a & SOURCE_POWERPYX`, the URL is `https://powerpyx.com/${path}`
- The `r` property is as follows: `[difficulty, playthroughs, hours]`.
  - Some sources do not provide this information, so a -1 will be provided for unknown values.

See Attributes below for an explanation of the `a` property.

### guides-v2.min.json

Data maps to type `GuideList` in `./types/guides-v2.d.ts`.

All guides indexed across all sources with pointers to PSNProfiles gameIds.

See explanations above for details of key properties.

## Attributes

Attributes are used to reduce size of JSON. They are bitwise flags that can be used to filter guides.

See `types/attributes-v2.ts` for definitions.

They can be used as follows:

```
const isGuideForVitaTruthy = attributes & PLATFORM_VITA;
const isGuideForVitaBoolean = !!(attributes & PLATFORM_VITA);
```
