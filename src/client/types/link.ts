export type ExternalLink = {
    url: string
}

export type InternalLink = {
    isHomePageLink: boolean
    pageId: string | null // null if isHomePageLink == true
}

export type Link = InternalLink | ExternalLink