export interface Guide {
    attr: number
    authors: string[]
    d: number
    image?: string
    path?: string
    rating: number[]
    src: number
    title: string
    trophies?: number[]
}

export interface GameMap {
    games: Record<string, number>
    guides: Record<string, Guide>
    processed: number
}
