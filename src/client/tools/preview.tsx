import { serializeToHTML } from "../components/slate/Serializer";
import { Page } from "../types/PageType";
import { ReferencedMedia, getAllReferencedMedia } from "./empty-page";
import { Media } from "./media";
import { homePageCss, homePageHtml, homePageJs } from "./preview-home-page";
import { homePageOlderPostsCss, homePageOlderPostsHtml, homePageOlderPostsJs } from "./preview-older-posts";
import { pageCss, pageHtml, pageJs } from "./preview-page";

export type GeneratedPreview = {
    homeHtml: string
    homeCss: string
    homeJs: string
    pageIdToFolderName: Map<string, string> // pageId --> folder name, which is url (i.e. kovaltour.com/folder.html)
    imageCopyMap: Map<ReferencedMedia, string> // media ---> folder name of target
    olderPostsHtml: string
    olderPostsCss: string
    olderPostsJs: string
    pagesHtmlIds: string[]
    pagesHtml: string[]
    pagesCss: string[]
    pagesJs: string[]
}

export function makePreview(pages: Page[]): GeneratedPreview {
    const idMap = getIdToFolderMap(pages)
    return {
        homeHtml: homePageHtml(pages, idMap),
        homeCss: homePageCss(),
        homeJs: homePageJs(pages, idMap),
        pageIdToFolderName: idMap,
        imageCopyMap: getImageCopyMap(pages, idMap),
        olderPostsHtml: homePageOlderPostsHtml(pages, idMap),
        olderPostsCss: homePageOlderPostsCss(),
        olderPostsJs: homePageOlderPostsJs(pages),
        pagesHtmlIds: pages.map(p => p.id),
        pagesHtml: pages.map(p => pageHtml(pages, p, idMap)),
        pagesCss: pages.map(p => pageCss(p)),
        pagesJs: pages.map(p => pageJs(p))
    }
}

function getImageCopyMap(pages: Page[], idMap: Map<string, string>): Map<ReferencedMedia, string> {
    const res = new Map<ReferencedMedia, string>()
    for(const p of pages){
        const refs = getAllReferencedMedia([p])
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
    // put pages in reverse order so old links remain the same
    const reverse = [...pages].reverse()
    for(const p of reverse){
        let title = escapeTitle(p.title)
        let count = 2
        while([...res.values()].includes(title)){
            title = escapeTitle(p.title) + count
            count++
        }
        res.set(p.id, title)
    }
    return res
}

const IMAGE_SIZE_NAMES = ['small', 'medium', 'large', 'x-large']
const IMAGE_SIZE_WIDTHS = [700, 1200, 1800, 2400] // in device pixels
export function getPreviewImgSrcSet(imageMedia: Media | null, pageFolderName: string, homeRelativePath: string){
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
        const fullUrl = homeRelativePath + pageFolderName + '/' + baseUrl + '_' + name + extWithDot
        srcset += fullUrl + ' ' + width + 'w'
        if(i < IMAGE_SIZE_NAMES.length - 1){
            srcset += ', '
        }
    }
    return srcset
}

const CLIENT_IMAGE_SIZE_NAMES = ['x-small', 'small', 'medium', 'large', 'x-large']
const CLIENT_IMAGE_SIZE_WIDTHS = [335, 400, 506, 800, 1125] // in css pixels
export function getPreviewImgSizes(imgSize: string): string{
    let maxWidth = CLIENT_IMAGE_SIZE_WIDTHS[CLIENT_IMAGE_SIZE_NAMES.indexOf(imgSize)]
    return `(max-width: ${maxWidth}px) 100vw, ${maxWidth}px`
}

function getFontCssFragment(){
    return `/* open-sans-300 - latin */
    @font-face {
      font-display: swap; /* Check https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display for other options. */
      font-family: 'Open Sans';
      font-style: normal;
      font-weight: 300;
      src: url('/fixed-assets/open-sans-v40-latin-300.woff2') format('woff2'); /* Chrome 36+, Opera 23+, Firefox 39+, Safari 12+, iOS 10+ */
    }
    
    /* open-sans-300italic - latin */
    @font-face {
      font-display: swap; /* Check https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display for other options. */
      font-family: 'Open Sans';
      font-style: italic;
      font-weight: 300;
      src: url('/fixed-assets/open-sans-v40-latin-300italic.woff2') format('woff2'); /* Chrome 36+, Opera 23+, Firefox 39+, Safari 12+, iOS 10+ */
    }
    
    /* open-sans-regular - latin */
    @font-face {
      font-display: swap; /* Check https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display for other options. */
      font-family: 'Open Sans';
      font-style: normal;
      font-weight: 400;
      src: url('/fixed-assets/open-sans-v40-latin-regular.woff2') format('woff2'); /* Chrome 36+, Opera 23+, Firefox 39+, Safari 12+, iOS 10+ */
    }
    
    /* open-sans-italic - latin */
    @font-face {
      font-display: swap; /* Check https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display for other options. */
      font-family: 'Open Sans';
      font-style: italic;
      font-weight: 400;
      src: url('/fixed-assets/open-sans-v40-latin-italic.woff2') format('woff2'); /* Chrome 36+, Opera 23+, Firefox 39+, Safari 12+, iOS 10+ */
    }
    
    /* open-sans-500 - latin */
    @font-face {
      font-display: swap; /* Check https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display for other options. */
      font-family: 'Open Sans';
      font-style: normal;
      font-weight: 500;
      src: url('/fixed-assets/open-sans-v40-latin-500.woff2') format('woff2'); /* Chrome 36+, Opera 23+, Firefox 39+, Safari 12+, iOS 10+ */
    }
    
    /* open-sans-500italic - latin */
    @font-face {
      font-display: swap; /* Check https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display for other options. */
      font-family: 'Open Sans';
      font-style: italic;
      font-weight: 500;
      src: url('/fixed-assets/open-sans-v40-latin-500italic.woff2') format('woff2'); /* Chrome 36+, Opera 23+, Firefox 39+, Safari 12+, iOS 10+ */
    }
    
    /* open-sans-600 - latin */
    @font-face {
      font-display: swap; /* Check https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display for other options. */
      font-family: 'Open Sans';
      font-style: normal;
      font-weight: 600;
      src: url('/fixed-assets/open-sans-v40-latin-600.woff2') format('woff2'); /* Chrome 36+, Opera 23+, Firefox 39+, Safari 12+, iOS 10+ */
    }
    
    /* open-sans-600italic - latin */
    @font-face {
      font-display: swap; /* Check https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display for other options. */
      font-family: 'Open Sans';
      font-style: italic;
      font-weight: 600;
      src: url('/fixed-assets/open-sans-v40-latin-600italic.woff2') format('woff2'); /* Chrome 36+, Opera 23+, Firefox 39+, Safari 12+, iOS 10+ */
    }
    
    /* open-sans-700 - latin */
    @font-face {
      font-display: swap; /* Check https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display for other options. */
      font-family: 'Open Sans';
      font-style: normal;
      font-weight: 700;
      src: url('/fixed-assets/open-sans-v40-latin-700.woff2') format('woff2'); /* Chrome 36+, Opera 23+, Firefox 39+, Safari 12+, iOS 10+ */
    }
    
    /* open-sans-700italic - latin */
    @font-face {
      font-display: swap; /* Check https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display for other options. */
      font-family: 'Open Sans';
      font-style: italic;
      font-weight: 700;
      src: url('/fixed-assets/open-sans-v40-latin-700italic.woff2') format('woff2'); /* Chrome 36+, Opera 23+, Firefox 39+, Safari 12+, iOS 10+ */
    }
    
    /* open-sans-800 - latin */
    @font-face {
      font-display: swap; /* Check https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display for other options. */
      font-family: 'Open Sans';
      font-style: normal;
      font-weight: 800;
      src: url('/fixed-assets/open-sans-v40-latin-800.woff2') format('woff2'); /* Chrome 36+, Opera 23+, Firefox 39+, Safari 12+, iOS 10+ */
    }
    
    /* open-sans-800italic - latin */
    @font-face {
      font-display: swap; /* Check https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display for other options. */
      font-family: 'Open Sans';
      font-style: italic;
      font-weight: 800;
      src: url('/fixed-assets/open-sans-v40-latin-800italic.woff2') format('woff2'); /* Chrome 36+, Opera 23+, Firefox 39+, Safari 12+, iOS 10+ */
    }
    
    /* lora-regular - latin */
@font-face {
  font-display: swap; /* Check https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display for other options. */
  font-family: 'Lora';
  font-style: normal;
  font-weight: 400;
  src: url('/fixed-assets/lora-v35-latin-regular.woff2') format('woff2'); /* Chrome 36+, Opera 23+, Firefox 39+, Safari 12+, iOS 10+ */
}

/* lora-italic - latin */
@font-face {
  font-display: swap; /* Check https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display for other options. */
  font-family: 'Lora';
  font-style: italic;
  font-weight: 400;
  src: url('/fixed-assets/lora-v35-latin-italic.woff2') format('woff2'); /* Chrome 36+, Opera 23+, Firefox 39+, Safari 12+, iOS 10+ */
}

/* lora-500 - latin */
@font-face {
  font-display: swap; /* Check https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display for other options. */
  font-family: 'Lora';
  font-style: normal;
  font-weight: 500;
  src: url('/fixed-assets/lora-v35-latin-500.woff2') format('woff2'); /* Chrome 36+, Opera 23+, Firefox 39+, Safari 12+, iOS 10+ */
}

/* lora-500italic - latin */
@font-face {
  font-display: swap; /* Check https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display for other options. */
  font-family: 'Lora';
  font-style: italic;
  font-weight: 500;
  src: url('/fixed-assets/lora-v35-latin-500italic.woff2') format('woff2'); /* Chrome 36+, Opera 23+, Firefox 39+, Safari 12+, iOS 10+ */
}

/* lora-600 - latin */
@font-face {
  font-display: swap; /* Check https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display for other options. */
  font-family: 'Lora';
  font-style: normal;
  font-weight: 600;
  src: url('/fixed-assets/lora-v35-latin-600.woff2') format('woff2'); /* Chrome 36+, Opera 23+, Firefox 39+, Safari 12+, iOS 10+ */
}

/* lora-600italic - latin */
@font-face {
  font-display: swap; /* Check https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display for other options. */
  font-family: 'Lora';
  font-style: italic;
  font-weight: 600;
  src: url('/fixed-assets/lora-v35-latin-600italic.woff2') format('woff2'); /* Chrome 36+, Opera 23+, Firefox 39+, Safari 12+, iOS 10+ */
}

/* lora-700 - latin */
@font-face {
  font-display: swap; /* Check https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display for other options. */
  font-family: 'Lora';
  font-style: normal;
  font-weight: 700;
  src: url('/fixed-assets/lora-v35-latin-700.woff2') format('woff2'); /* Chrome 36+, Opera 23+, Firefox 39+, Safari 12+, iOS 10+ */
}

/* lora-700italic - latin */
@font-face {
  font-display: swap; /* Check https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display for other options. */
  font-family: 'Lora';
  font-style: italic;
  font-weight: 700;
  src: url('/fixed-assets/lora-v35-latin-700italic.woff2') format('woff2'); /* Chrome 36+, Opera 23+, Firefox 39+, Safari 12+, iOS 10+ */
}

      `
}

export function getHeaderCssFragment(homeRootRelativePath: string){
    return `
${getFontCssFragment()}

/* rock-salt-regular - latin */
@font-face {
  font-display: swap; /* Check https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display for other options. */
  font-family: 'Rock Salt';
  font-style: normal;
  font-weight: 400;
  src: url('${homeRootRelativePath}rock-salt-v22-latin-regular.woff2') format('woff2'); /* Chrome 36+, Opera 23+, Firefox 39+, Safari 12+, iOS 10+ */
}

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
    font-family: "Lora", serif;
    margin: 0;
}

.root {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.header {
    background-color: white;
}

.header-link {
    display: block;
    padding: 10px;
    margin-left: 15px;
    margin-right: 15px;
    text-decoration: none;
    color: #53824A;
}

.header {
    width: 100%;
    font-family: 'Open Sans', sans-serif;
}

.header-title-container {
    height: 200px;
    width: 100%;
    background-size: cover;
    position: relative;
}

.header-title-text {
    font-size: 30px;
    font-weight: 800;
    position: absolute;
    left: 15px;
    top: 5px;
    line-height: 1.75;
    font-family: 'Rock Salt';
    color: rgb(50,50,50);
}

.header-links-container {
    display: flex;
    flex-direction: row;
}

.static-page-links {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    font-weight: 600;
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
    font-weight: 600;
}

.header-title-text a {
    text-decoration: none;
    color: inherit;
}`
}

export function getHeaderHtmlFragment(pages: Page[], idMap: Map<string, string>, homeRootRelativePath: string, includeOlderPosts: boolean){
    return `<div class="header" id="header">
    <div class="header-title-container" style="background-image: url('${homeRootRelativePath}header.jpg')">
        <span class="header-title-text"><a href="${homeRootRelativePath}home.html">Rick and Julie's Excellent Adventure</a></span>
    </div>
    <div class="header-links-container">
        <div class="static-page-links">
            ${staticLinkHtml(pages, homeRootRelativePath, idMap)}
        </div>
        <div class="older-posts-container">
            ${includeOlderPosts ? '<a class="older-posts-link" href="older-posts.html">Older Posts</a>' : ''}
        </div>
    </div>
</div>`
}

function staticLinkHtml(pages: Page[], homeRootRelativePath: string, idMap: Map<string, string>){
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
        <a class="header-link" href="${homeRootRelativePath + idMap.get(p.id)}/page.html">
            ${p.title}
        </a>
    `).join('\n')
}