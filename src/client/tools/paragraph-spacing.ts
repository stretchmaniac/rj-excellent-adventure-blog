

export function getParElSpacing(fontSize1: number, lineHeight1: number, fontSize2: number, lineHeight2: number){
    const combinedHeight = fontSize1 * lineHeight1 + fontSize2 * lineHeight2
    return combinedHeight * .2
}

export function getParNonParSpacing(fontSize: number, lineHeight: number, otherType: string | null | undefined){
    return 0
}