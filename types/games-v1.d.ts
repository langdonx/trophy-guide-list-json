export interface Guide {
    attr: number
    authors: string[]
    path?: string
    rating: number[]
    src: number
    title: string
}

export interface GameMap {
    games: Record<string, number>
    guides: Record<string, Guide>
    processed: number
}
