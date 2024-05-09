import { Media } from "../tools/media"

export type Page = {
    id: string
    title: string
    date: Date
    isBlogPost: boolean
    linkedFromHeader: boolean
    headerSortOrder: string
    autoSummary: boolean
    summaryText: string
    autoSummaryImg: boolean
    summaryImg: Media | null
    familyPrivate: boolean
    design: any[]
}