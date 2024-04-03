interface Guide {
    attr: number
    authors: string[]
    path?: string
    rating: number[]
    src: number
    title: string
}

interface GameMap {
    games: Record<string, number>
    guides: Record<string, Guide>
    processed: number
}
