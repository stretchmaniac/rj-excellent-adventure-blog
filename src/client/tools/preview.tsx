import { Page } from "../types/PageType";
import { getAllReferencedMediaNames } from "./empty-page";
import { Media } from "./media";
import { homePageCss, homePageHtml, homePageJs } from "./preview-home-page";

export type GeneratedPreview = {
    homeHtml: string,
    homeCss: string,
    homeJs: string,
    pageIdToFolderName: Map<string, string>, // pageId --> folder name, which is url (i.e. kovaltour.com/folder.html)
    imageCopyMap: Map<string, string> // '<name>.ext' ---> folder name of target
}

export function makePreview(pages: Page[]): GeneratedPreview {
    const idMap = getIdToFolderMap(pages)
    return {
        homeHtml: homePageHtml(pages, idMap),
        homeCss: homePageCss(),
        homeJs: homePageJs(pages, idMap),
        pageIdToFolderName: idMap,
        imageCopyMap: getImageCopyMap(pages, idMap)
    }
}

function getImageCopyMap(pages: Page[], idMap: Map<string, string>): Map<string, string> {
    const res = new Map<string, string>()
    for(const p of pages){
        const refs = getAllReferencedMediaNames([p])
        for(const ref of refs){
            res.set(ref, idMap.get(p.id) as string)
        }
    }
    return res
}

function getIdToFolderMap(pages: Page[]): Map<string, string> {
    const res = new Map<string, string>()
    function escapeTitle(title: string){
        return title.trim().toLocaleLowerCase()
            .replace(/\s+/gm, '-')
            .replace(/[^a-zA-Z0-9-_]/gm, '')
    }
    for(const p of pages){
        let title = escapeTitle(p.title)
        let count = 0
        while(res.has(title)){
            title = escapeTitle(p.title) + count
            count++
        }
        res.set(p.id, title)
    }
    return res
}

const IMAGE_SIZE_NAMES = ['small', 'medium', 'large', 'x-large']
const IMAGE_SIZE_WIDTHS = [700, 1200, 1800, 2400]
export function getPreviewImgSrcSet(imageMedia: Media | null, pageFolderName: string){
    if(!imageMedia){
        return ''
    }
    const imageMediaUrl = imageMedia.stableRelativePath
    // remove ext
    const extDotI = imageMediaUrl.lastIndexOf('.')
    const extWithDot = imageMediaUrl.substring(extDotI)
    const arr = imageMediaUrl.substring(0, extDotI).split('/media/')
    const host = arr[0]
    const baseUrl = arr[1]
    let srcset = ''
    for(let i = 0; i < IMAGE_SIZE_NAMES.length; i++){
        const name = IMAGE_SIZE_NAMES[i]
        const width = IMAGE_SIZE_WIDTHS[i]
        const fullUrl = './' + pageFolderName + '/' + baseUrl + '_' + name + extWithDot
        srcset += fullUrl + ' ' + width + 'w'
        if(i < IMAGE_SIZE_NAMES.length - 1){
            srcset += ', '
        }
    }
    return srcset
}

export function getPreviewImgFullSizeUrl(imageMedia: Media | null, pageFolderName: string){
    if(!imageMedia){
        return ''
    }
    const arr = imageMedia.stableRelativePath.split('/media/')
    return './' + pageFolderName + '/' + arr[1]
}