export interface Guide {
    a: number // attributes, see README
    p?: string // path, set when game has a guide that's outside of PSNProfiles
    r: number[] // rating -- [difficulty, playthroughs, hours]
}

export interface GameToGuideMap {
    games: Record<string, Guide>
    processed: number
}
