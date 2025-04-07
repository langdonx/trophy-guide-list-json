export interface Guide {
    a: number // attributes, see README
    d: number // published, sometimes date scraped
    i?: string // image
    n: string // name of guide
    p?: string // path
    r: number[] // rating -- [difficulty, playthroughs, hours]
    t?: number[] // trophy count
    u: string[] // authors
}

export type GuideList = Record<string, Guide>;
