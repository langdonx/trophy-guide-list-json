export interface Guide {
    a: number // atributes
    d: number // published, sometimes date scraped
    i?: string // image
    n: string // name of guide
    p?: string // path
    r: number[] // rating
    t?: number[] // trophy count
    u: string[] // authors
}

export interface GameMap {
    games: Record<string, number>
    guides: Record<string, Guide>
    processed: number
}
