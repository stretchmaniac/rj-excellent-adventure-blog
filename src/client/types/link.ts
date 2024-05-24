export type ExternalLink = {
    url: string
    openInNewTab: boolean
}

export type InternalLink = {
    isHomePageLink: boolean
    pageId: string | null // null if isHomePageLink == true
    openInNewTab: boolean
}

export type Link = InternalLink | ExternalLink

export function convertShorthandUrl(url: string): string {
    // prefix with https:// if not already there
    if(!url.startsWith('http')){
        url = 'https://' + url
    }
    return url
}