export interface Guide {
    a: number // attributes, see README
    d: number // published, sometimes date scraped
    g: number[] // gameIds that this guide applies to (the first in the list is the game/stack the guide was written for)
    i?: string // image
    n: string // name of guide
    p?: string // path
    r: number[] // rating -- [difficulty, playthroughs, hours]
    t?: number[] // trophy count
    u: string[] // authors
}

export type GuideList = Record<string, Guide>;
