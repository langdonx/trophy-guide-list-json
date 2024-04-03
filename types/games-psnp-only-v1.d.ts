interface Guide {
    attr: number
    authors: string[]
    rating: number[]
    title: string
}

interface GameMap {
    games: Record<string, number>
    guides: Record<string, Guide>
    processed: number
}
