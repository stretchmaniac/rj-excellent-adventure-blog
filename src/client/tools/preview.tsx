import { Page } from "../types/PageType";
import { getAllReferencedMediaNames } from "./empty-page";
import { Media } from "./media";
import { homePageCss, homePageHtml, homePageJs } from "./preview-home-page";
import { homePageOlderPostsCss, homePageOlderPostsHtml } from "./preview-older-posts";

export type GeneratedPreview = {
    homeHtml: string,
    homeCss: string,
    homeJs: string,
    pageIdToFolderName: Map<string, string>, // pageId --> folder name, which is url (i.e. kovaltour.com/folder.html)
    imageCopyMap: Map<string, string> // '<name>.ext' ---> folder name of target
    olderPostsHtml: string,
    olderPostsCss: string
}

export function makePreview(pages: Page[]): GeneratedPreview {
    const idMap = getIdToFolderMap(pages)
    return {
        homeHtml: homePageHtml(pages, idMap),
        homeCss: homePageCss(),
        homeJs: homePageJs(pages, idMap),
        pageIdToFolderName: idMap,
        imageCopyMap: getImageCopyMap(pages, idMap),
        olderPostsHtml: homePageOlderPostsHtml(pages),
        olderPostsCss: homePageOlderPostsCss()
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

export function getHeaderCssFragment(){
    return `
@media screen and (max-width: 600px) {
    .header-box {
        width: 100%;
        margin-top: 0;
    }

    .post-root {
        width: 100%;
    }

    .top-button {
        left: -50px !important; // remove top button for small screens
    }
}
    
@media screen and (min-width: 601px) {
    .header-box {
        width: 95%;
        margin-top: 18px;
    }

    .post-root {
        width: 80%;
    }
}

body {
    background-color: rgb(50, 50, 50);
    font-family: sans-serif;
    margin: 0;
}

.root {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.header-box {
    background-color: white;
}

.header-link {
    display: block;
    padding: 10px;
    margin-left: 15px;
    margin-right: 15px;
    text-decoration: none;
    color: #25a186;
}

.header {
    width: 100%;
}

.header-title-container {
    height: 150px;
    width: 100%;
    background-image: url('./header.jpg');
    background-size: cover;
    position: relative;
}

.header-title-text {
    font-size: 30px;
    position: absolute;
    left: 15px;
    top: 15px;
}

.header-links-container {
    display: flex;
    flex-direction: row;
}

.static-page-links {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
}

.older-posts-container {
    flex-grow: 1;
    display: flex;
    flex-direction: row;
    justify-content: end;
}

.older-posts-link {
    display: block;
    padding: 10px;
    margin-left: 15px;
    margin-right: 15px;
    text-decoration: none;
    color: black;
}

.header-title-text a {
    text-decoration: none;
    color: inherit;
}`
}

export function getHeaderHtmlFragment(pages: Page[], homeRootRelativePath: string){
    return `<div class="header" id="header">
    <div class="header-title-container">
        <span class="header-title-text"><a href="${homeRootRelativePath}home.html">Rick and Julie's Excellent Adventure</a></span>
    </div>
    <div class="header-links-container">
        <div class="static-page-links">
            ${staticLinkHtml(pages)}
        </div>
        <div class="older-posts-container">
            <a class="older-posts-link" href="older-posts.html">Older Posts</a>
        </div>
    </div>
</div>`
}

function staticLinkHtml(pages: Page[]){
    const linked = pages.filter(p => !p.isBlogPost && p.linkedFromHeader)
    linked.sort((a, b) => {
        const aOrder = a.headerSortOrder
        const bOrder = b.headerSortOrder
        if(a === b){
            return 0
        }
        const aNumber = Number.parseFloat(aOrder)
        const bNumber = Number.parseFloat(bOrder)
        if(isNaN(aNumber) && isNaN(bNumber)){
            return a < b ? -1 : 1
        }
        if(isNaN(aNumber)){
            return -1
        }
        if(isNaN(bNumber)){
            return 1
        }
        return aNumber === bNumber ? 0 :
            (aNumber < bNumber ? -1 : 1)
    })
    return linked.map(p => `
        <a class="header-link" href="#">
            ${p.title}
        </a>
    `).join('\n')
}