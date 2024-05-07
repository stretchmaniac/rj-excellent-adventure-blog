export type Page = {
    id: string
    title: string
    date: Date
    isBlogPost: boolean
    linkedFromHeader: boolean
    headerSortOrder: string
    autoSummary: boolean
    summaryText: string
    familyPrivate: boolean
    design: any[]
}