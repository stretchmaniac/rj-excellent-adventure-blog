import { Page } from "./PageType"

export type ExternalLink = {
    url: string
}

export type InternalLink = {
    isHomePageLink: boolean
    page: Page | null // null if isHomePageLink == true
}

export type Link = InternalLink | ExternalLink