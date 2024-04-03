# trophy-guide-list-json

See `/types` for schema explanation.

## JSON

### games-psnp-only-v1.min.json

PSNProfiles gameIds mapped to featured guideId (or assumed to be featured guideId via stacks).
- The `attr` property is further explained in the Attributes section below.
- The `rating` property is as follows: `[difficulty, playthroughs, hours]`.

### games-v1.min.json

PSNProfiles gameIds mapped to single preffered guide:
1. Featured guide on PSNProfiles game page
2. PowerPyx Guide to fill in PSNProfiles gaps
3. Knoef Guide to further fill in gaps

- The `attr` property is further explained in the Attributes section below.
- The `path` property is provided when the source is not PSNProfiles. It can be combined with the appropriate root URL to access the guide.
  - When `.src === SOURCE_KNOEF`, the URL is `https://knoef.info/${path}`
  - When `.src === SOURCE_POWERPYX`, the URL is `https://powerpyx.com/${path}`
- The `rating` property is as follows: `[difficulty, playthroughs, hours]`.
  - Some sources do not provide this information, so a -1 will be provided for unknown values.

See Attributes below for an explanation of the `attr` property.

### guides.min.json

All guides indexed acrossed all sources with pointers to PSNProfiles gameIds.

See explanations above for details of key properties.

## Source

We are currently indexing guides from 3 sources.  The source property is used to identify the source of the guide.

```
declare const SOURCE_PSNP = 1;
declare const SOURCE_KNOEF = 2;
declare const SOURCE_POWERPYX = 3;
```

## Attributes

Attributes are used to reduce size of JSON. They are bitwise flags that can be used to filter guides.

```
declare const IS_TROPHY_GUIDE = 1;
declare const IS_DLC = 2;
declare const PLATFORM_PS3 = 4;
declare const PLATFORM_PS4 = 8;
declare const PLATFORM_PS5 = 16;
declare const PLATFORM_VITA = 32;
declare const PLATFORM_VR = 64;
declare const HAS_BUGGY_TROPHIES = 128;
declare const HAS_ONLINE_TROPHIES = 256;
```

They can be used as follows:

```
const isGuideForVitaTruthy = attributes & PLATFORM_VITA;
const isGuideForVitaBoolean = !!(attributes & PLATFORM_VITA);
```
