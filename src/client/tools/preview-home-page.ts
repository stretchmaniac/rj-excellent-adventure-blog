import { Page } from "../types/PageType";
import { getReadableDateString } from "./date";
import { getSummaryImg, getSummaryText } from "./empty-page";
import { Media } from "./media";
import { getHeaderCssFragment, getHeaderHtmlFragment, getPreviewImgFullSizeUrl, getPreviewImgSrcSet } from "./preview";

export function makeStringLiteral(s: string){
    return "'" + s.replace(/'/g, "\\'") + "'";
}

export function homePageJs(pages: Page[], idMap: Map<string, string>): string {
    const blogPosts = pages.filter(p => p.isBlogPost)
    const numBlogPosts = blogPosts.length
    return `
const MAX_POSTS = ${numBlogPosts};
const INITIAL_POSTS = Math.min(MAX_POSTS, 8);
const LOAD_POST_NUM = 3;
const pageTitles=[${blogPosts.map(p => makeStringLiteral(p.title)).join(',')}];
const pageFolderNames = [${blogPosts.map(p => makeStringLiteral(idMap.get(p.id) as string)).join(',')}];
const pageDates = [${blogPosts.map(p => makeStringLiteral(getReadableDateString(p.date))).join(',')}];
const pageSummaries = [${blogPosts.map(p => makeStringLiteral(getSummaryText(p))).join(',')}];
const pageThumbnailSrcsets = [${blogPosts.map(
        p => makeStringLiteral(getPreviewImgSrcSet(getSummaryImg(p), idMap.get(p.id) as string))
    ).join(',')}];
const pageThumbnailSrcs = [${blogPosts.map(
    p => makeStringLiteral(getPreviewImgFullSizeUrl(getSummaryImg(p), idMap.get(p.id) as string))
).join(',')}];

function populatePageRows(maxPages){
    // this is a live HTMLCollection, so adding more rows will automatically update this list
    const pageRowDivs = document.getElementsByClassName('home-post-row');
    // add more rows if necessary
    while(pageRowDivs.length < maxPages){
        // copy the last page row and append after
        const existing = pageRowDivs[pageRowDivs.length - 1];
        const rowDiv = existing.cloneNode(true); // true for recursive
        existing.parentElement.appendChild(rowDiv);
    }

    let index = 0;
    for(let el of pageRowDivs){
        // remove content from all page rows
        removeTextContent(el);
        const tContainer = el.querySelector('.home-post-text-container');
        const tInter = el.querySelector('.home-post-text-intermediate');

        // add .home-post-text-container-grow class to .home-post-text-container for measuring purposes
        tContainer.classList.add('home-post-text-container-grow');
        tContainer.style.width = null;
        tInter.style.width = null;

        // measure .home-post-text-container while empty 
        // and apply these dimensions to .home-post-text-intermediate
        // -1 since clientWidth rounds to nearest pixel, if over by 1px can cause overflow wrap in parent
        // flexbox
        const w = tContainer.clientWidth - 1;

        // set widths, remove grow class
        tInter.style.width = w + 'px';
        tContainer.classList.remove('home-post-text-container-grow');
        tContainer.style.width = w + 'px';

        // reset text content
        setContent(el, index);
        index++;
    }
}

function removeTextContent(pageRow){
    const title = pageRow.querySelector('.home-post-title');
    const date = pageRow.querySelector('.home-post-date');
    const summary = pageRow.querySelector('.home-post-summary');
    for(let el of [title, date, summary]){
        el.textContent = '';
    }
}

function setContent(pageRow, pageIndex){
    const title = pageRow.querySelector('.home-post-title');
    title.textContent = pageTitles[pageIndex];
    title.href = pageFolderNames[pageIndex] + '/page.html';

    const readMore = pageRow.querySelector('.home-post-read-more');
    readMore.href = title.href

    const date = pageRow.querySelector('.home-post-date');
    date.textContent = pageDates[pageIndex];

    const summary = pageRow.querySelector('.home-post-summary');
    summary.textContent = pageSummaries[pageIndex];

    const img = pageRow.querySelector('.home-post-image');
    img.srcset = pageThumbnailSrcsets[pageIndex];
    img.src = pageThumbnailSrcs[pageIndex];
}

function elOutOfView(el){
    const rect = el.getBoundingClientRect();
    return rect.bottom <= 0 || rect.right <= 0 ||
        rect.top >= (window.innerHeight || document.documentElement.clientHeight) ||
        rect.left >= (window.innerWidth || document.documentElement.clientWidth);
}

function updateTopButton(){
    // show top button if header box is not in view
    const topButton = document.querySelector('.top-button');
    if(elOutOfView(document.querySelector('.header-box'))){
        topButton.style.display = 'block';
    } else {
        topButton.style.display = 'none';
    }
}

function infiniteScrollCheck(){
    // if the 2nd to last or last post on the page is in view, load more posts
    const pageRowDivs = document.getElementsByClassName('home-post-row');
    if(pageRowDivs.length > 1){
        const last = pageRowDivs[pageRowDivs.length - 1];
        const last2 = pageRowDivs[pageRowDivs.length - 2];

        if((!elOutOfView(last) || !elOutOfView(last2)) && pageRowDivs.length < MAX_POSTS){
            // save scroll location
            const scrollY = window.scrollY;
            // load more
            populatePageRows(Math.min(MAX_POSTS, pageRowDivs.length + LOAD_POST_NUM));
            // reset scroll location
            window.scrollTo(0, scrollY);
        }
    }
}

window.onload = () => {
    populatePageRows(INITIAL_POSTS);
    updateTopButton();
}
window.onresize = () => populatePageRows(0);
window.onscroll = () => {
    updateTopButton();
    infiniteScrollCheck();
}
`;
}

export function homePageCss(): string {
    return `

${getHeaderCssFragment('')}

@media screen and (max-width: 600px) {
    .home-post-row {
        margin-top: 30px !important;
    }
    .post-root {
        margin-top: 0px !important;
    }
}

.home-post-row {
    display: flex;
    flex-direction: row-reverse;
    flex-wrap: wrap;
    width: 100%;
    justify-content: space-around;
    min-height: 300px;
}

.home-post-image-container {
    flex-grow: 2;
    position: relative;
}

.home-post-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position:absolute;
}

.home-post-text-container-grow {
    flex-grow: 2.6;
}

.home-post-text-container {
    min-width: 50%;
    position: relative;
}

.home-post-title {
    display: block;
    text-decoration: none;
    padding: 30px 15px 0px 15px;
    font-weight: bold;
    width: calc(100% - 30px);
    font-family: 'Open Sans', sans-serif;
}

.home-post-date {
    padding-left: 15px;
    padding-top: 15px;
    padding-bottom: 15px;
    width: calc(100% - 15px);
}

.home-post-summary {
    padding-left: 15px;
    padding-right: 15px;
    width: (100% - 30px);
    line-height: 38px;
}

.home-post-link-row {
    width: 100%;
    min-height: 45px;
}

.home-post-read-more {
    position: absolute;
    right: 15px;
    bottom: 15px;
    text-decoration: none;
    font-family: 'Open Sans', sans-serif;
}

.post-root {
    margin-bottom: 30px;
}

.post-root .home-post-row {
    margin-top: 60px;
}

.top-button {
    position: fixed;
    bottom: 15px;
    left: 15px;
    font-weight: 700;
}

.top-button a {
    text-decoration: none;
    color: rgb(200, 200, 200);
}
`
}

export function homePageHtml(pages: Page[], idMap: Map<string, string>): string {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Rick & Julie's Excellent Adventure</title>
    <link rel="stylesheet" type="text/css" href="./home.css">
  </head>
  <body>
    <main>
        <div class="root">
            <div class="header-box">
                ${getHeaderHtmlFragment(pages, idMap, '', true)}
                <div class="first-post">
                    ${pages.length === 0 ? '' : homePostRow(
                                                    '#25a186', 'white', 'white', 'white', 1, 2.6, 400,
                                                    getSummaryImg(pages[0]), idMap.get(pages[0].id) as string
                                                )}
                </div>
            </div>
            <div class="post-root">
                ${pages.length > 1 ? homePostRow(
                                        'white', '#25a186', 'black', 'rgb(100, 100, 100)', 1, 1, 300,
                                        getSummaryImg(pages[1]), idMap.get(pages[1].id) as string
                                    ) : 0}
            </div>
            <div class="top-button">
                <a href="#header">TOP</a>
            </div>
        </div>
    </main>
	<script src="home.js"></script>
  </body>
</html>`
}

function homePostRow(backgroundColor: string, headerColor: string, textColor: string, 
    dateColor: string, fontSizeScale: number, imageFlexGrow: number, imageMinDim: number,
    thumbnailMedia: Media | null, pageFolderName: string): string{

    const src = getPreviewImgFullSizeUrl(thumbnailMedia, pageFolderName)
    const srcset = getPreviewImgSrcSet(thumbnailMedia, pageFolderName)
    // for flexgrow > 2: (estimations)
    //   width < 700px : image takes up 100% of viewport
    //   otherwise image takes up 50% of viewport
    // for flexgrow < 2: (estimations)
    //   width < 800px: image takes up 100% of viewport
    //   800px <= width < 950px: image takes up 50% of viewport
    //   950px <= width: image takes up 350px
    const sizes = imageFlexGrow > 2 ?
        '(max-width: 700px) 100vw, 50vw' :
        '(max-width: 800px) 100vw, (max-width: 950px) 50vw, 350px'
    return `
<div class="home-post-row" style="background-color: ${backgroundColor}; color: ${textColor};">
    <div class="home-post-image-container" style="flex-grow: ${imageFlexGrow}; min-width: ${imageMinDim}px; min-height: ${imageMinDim}px">
        <img class="home-post-image" srcset="${srcset}" sizes="${sizes}" src="${src}"/>
    </div>
    <div class="home-post-text-container home-post-text-container-grow">
        <div class="home-post-text-intermediate">
            <a href="#" class="home-post-title" style="font-size: ${36 * fontSizeScale}px; color: ${headerColor}"></a>
            <div class="home-post-date" style="font-size: ${17 * fontSizeScale}px; color: ${dateColor}"></div>
            <div class="home-post-summary" style="font-size: ${20 * fontSizeScale}px"></div>
            <div class="home-post-link-row" style="font-size: ${20 * fontSizeScale}px">
                <a href="#" class="home-post-read-more" style="color: ${headerColor}">READ MORE</a>
            </div>
        </div>
    </div>
</div>
`
}