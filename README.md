# trophy-guide-list-json

See `/types` for schema explanation.

## JSON

### games-v2.min.json

PSNProfiles gameIds mapped to single preferred guide:
1. Featured guide on PSNProfiles game page
2. PowerPyx Guide to fill in PSNProfiles gaps
3. Knoef Guide to further fill in gaps

- The `attr` property is further explained in the Attributes section below.
- The `path` property is provided when the source is not PSNProfiles. It can be combined with the appropriate root URL to access the guide.
  - When `.src === SOURCE_KNOEF`, the URL is `https://knoef.info/${path}`
  - When `.src === SOURCE_PLATGET`, the URL is `https://www.platget.com/${path}`
  - When `.src === SOURCE_PLAYSTATIONTROPHIES`, the URL is `https://www.playstationtrophies.org/game/${path}`
  - When `.src === SOURCE_POWERPYX`, the URL is `https://powerpyx.com/${path}`
- The `rating` property is as follows: `[difficulty, playthroughs, hours]`.
  - Some sources do not provide this information, so a -1 will be provided for unknown values.

See Attributes below for an explanation of the `attr` property.

### guides-v2.min.json

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
