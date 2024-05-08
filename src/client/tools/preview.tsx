import { Page } from "../types/PageType";
import { getReadableDateString } from "./date";

export type GeneratedPreview = {
    homeHtml: string,
    homeCss: string,
    homeJs: string
}

export function makePreview(pages: Page[]): GeneratedPreview {
    return {
        homeHtml: homePageHtml(pages),
        homeCss: homePageCss(),
        homeJs: homePageJs()
    }
}

function homePageJs(): string {
    return `

    `;
}

function homePageCss(): string {
    return `
body {
    background-color: rgb(50, 50, 50);
    font-family: sans-serif;
}

.root {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.header-box {
    background-color: white;
    width: 95%;
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
    flex-grow: 1;
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

.home-post-text-container {
    flex-grow: 1.3;
    min-width: 50%;
    position: relative;
    display: flow-root;
}

.home-post-title {
    font-size: 36px;
    padding: 30px 15px 0px 15px;
    font-weight: bold;
    width: calc(100% - 30px);
}

.home-post-date {
    padding-left: 15px;
    padding-bottom: 5px;
    width: calc(100% - 15px);
}

.home-post-summary {
    padding-left: 15px;
    padding-right: 15px;
    padding-top: 15px;
    width: (100% - 30px);
}

.home-post-link-row {
    display: flex;
    flex-direction: row-reverse;
    width: 100%;
}

.home-post-read-more {
    margin-right: 15px;
    margin-top: 30px;
    text-decoration: none;
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
    <link rel="stylesheet" type="text/css" href="./index.css">
  </head>
  <body>
    <main>
        <div class="root">
            <div class="header-box">
                <div class="header">
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
                    ${pages.length === 0 ? '' : homePostRow(pages[0], '#25a186', 'white', 1)}
                </div>
            </div>
        </div>
    </main>
	<script src="index.js"></script>
  </body>
</html>`
}

function homePostRow(page: Page, backgroundColor: string, textColor: string, imageScaling: number): string{
    return `
<div class="home-post-row" style="background-color: ${backgroundColor}; color: ${textColor};">
    <div class="home-post-image-container">
        <img class="home-post-image" src="https://i.pinimg.com/originals/e1/60/8e/e1608eff46f97e2b1f6f9b40ae698dff.jpg"/>
    </div>
    <div class="home-post-text-container">
        <div class="home-post-text-intermediate">
            <div class="home-post-title">${page.title}</div>
            <div class="home-post-date">${getReadableDateString(page.date)}</div>
            <div class="home-post-summary">${getPageSummary(page)}</div>
            <div class="home-post-link-row">
                <a href="#" class="home-post-read-more" style="color: ${textColor}">READ MORE</a>
            </div>
        </div>
    </div>
</div>
`
}

function getPageSummary(page: Page){
    return `Our travel day good weather streak held up once again as we journeyed further north along the Appalachian mountains. Our campground was fairly remote and the roads leading to it were twisty, but that's the way it is in these parts. Fortunately, we only had a couple of hours drive this time.`
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