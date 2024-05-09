import { Page } from "../types/PageType";
import { getReadableDateString } from "./date";
import { getSummaryText } from "./empty-page";

export type GeneratedPreview = {
    homeHtml: string,
    homeCss: string,
    homeJs: string
}

export function makePreview(pages: Page[]): GeneratedPreview {
    return {
        homeHtml: homePageHtml(pages),
        homeCss: homePageCss(),
        homeJs: homePageJs(pages)
    }
}

function makeStringLiteral(s: string){
    return "'" + s.replace(/'/g, "\\'") + "'";
}

function homePageJs(pages: Page[]): string {
    const blogPosts = pages.filter(p => p.isBlogPost)
    const numBlogPosts = blogPosts.length
    return `
const MAX_POSTS = ${numBlogPosts};
const INITIAL_POSTS = Math.min(MAX_POSTS, 8);
const LOAD_POST_NUM = 3;
const pageTitles=[${blogPosts.map(p => makeStringLiteral(p.title)).join(',')}];
const pageDates = [${blogPosts.map(p => makeStringLiteral(getReadableDateString(p.date))).join(',')}];
const pageSummaries = [${blogPosts.map(p => makeStringLiteral(getSummaryText(p))).join(',')}];

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
        setTextContent(el, index);
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

function setTextContent(pageRow, pageIndex){
    const title = pageRow.querySelector('.home-post-title');
    title.textContent = pageTitles[pageIndex];
    const date = pageRow.querySelector('.home-post-date');
    date.textContent = pageDates[pageIndex];
    const summary = pageRow.querySelector('.home-post-summary');
    summary.textContent = pageSummaries[pageIndex];
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
            // load more
            populatePageRows(Math.min(MAX_POSTS, pageRowDivs.length + LOAD_POST_NUM));
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

function homePageCss(): string {
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

.header {
    width: 100%;
}

.header-title-container {
    height: 150px;
    width: 100%;
    background-color: rgba(0,0,0,.05);
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

.header-link {
    display: block;
    padding: 10px;
    margin-left: 15px;
    margin-right: 15px;
    text-decoration: none;
    color: #25a186;
}

.older-posts-link {
    display: block;
    padding: 10px;
    margin-left: 15px;
    margin-right: 15px;
    text-decoration: none;
    color: black;
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
    min-width: 300px;
    min-height: 300px;
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
    padding: 30px 15px 0px 15px;
    font-weight: bold;
    width: calc(100% - 30px);
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
    line-height: 24px;
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
}

.top-button a {
    text-decoration: none;
    color: #25a186;
}
`
}

function homePageHtml(pages: Page[]): string {
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
                <div class="header" id="header">
                    <div class="header-title-container">
                        <span class="header-title-text">Rick and Julie's Excellent Adventure</span>
                    </div>
                    <div class="header-links-container">
                        <div class="static-page-links">
                            ${staticLinkHtml(pages)}
                        </div>
                        <div class="older-posts-container">
                            <a class="older-posts-link" href="#">Older Posts</a>
                        </div>
                    </div>
                </div>
                <div class="first-post">
                    ${pages.length === 0 ? '' : homePostRow('#25a186', 'white', 'white', 'white', 1, 2.6)}
                </div>
            </div>
            <div class="post-root">
                ${pages.length > 1 ? homePostRow('white', '#25a186', 'black', 'rgb(100, 100, 100)', .75, 1) : 0}
            </div>
            <div class="top-button">
                <a href="#header">Top</a>
            </div>
        </div>
    </main>
	<script src="home.js"></script>
  </body>
</html>`
}

function homePostRow(backgroundColor: string, headerColor: string, textColor: string, dateColor: string, fontSizeScale: number, imageFlexGrow: number): string{
    return `
<div class="home-post-row" style="background-color: ${backgroundColor}; color: ${textColor};">
    <div class="home-post-image-container" style="flex-grow: ${imageFlexGrow}">
        <img class="home-post-image" src="https://i.pinimg.com/originals/e1/60/8e/e1608eff46f97e2b1f6f9b40ae698dff.jpg"/>
    </div>
    <div class="home-post-text-container home-post-text-container-grow">
        <div class="home-post-text-intermediate">
            <div class="home-post-title" style="font-size: ${36 * fontSizeScale}px; color: ${headerColor}"></div>
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