import { Page } from "../types/PageType";
import { getShortReadableDateString } from "./date";
import { getPageSearchTextArr } from "./page-search";
import { getHeaderCssFragment, getHeaderHtmlFragment, getNoIndexMetaTag } from "./preview";
import { makeStringLiteral } from "./preview-home-page";

export function homePageOlderPostsJs(pages: Page[]): string{
    let strContents = '{\n'
    strContents += pages.map(p => 
        `  '${p.id}': [` + getPageSearchTextArr(p).map(s => makeStringLiteral(s)).join(',') + ']'
    ).join(',\n')
    strContents += '}'
    return `
const pageData = ${strContents};

function updateSearch(){
    const searchBar = document.getElementById('search-bar');
    const monthHeaders = document.getElementsByClassName('month-li');
    const postEntries = document.getElementsByClassName('inner-list-item');

    const val = searchBar.value.trim().toLocaleLowerCase();
    if(val.length > 0){
        // apply search
        for(const post of postEntries){
            const searchTextArr = pageData[post.id];
            if(searchTextArr.filter(t => t.includes(val)).length === 0){
                post.classList.add('hidden');
            } else {
                post.classList.remove('hidden');
            }
        }
        // remove months with no visible children, expand all details
        for(const mo of monthHeaders){
            const details = mo.querySelector('details');
            if(mo.querySelector('li:not(.hidden)') == null){
                mo.classList.add('hidden');
                details.removeAttribute('open')
            } else {
                mo.classList.remove('hidden');
                details.open = 'true'
            }
        }
    } else {
        // clear search
        for(const mo of monthHeaders){
            mo.classList.remove('hidden');
        }
        for(const post of postEntries){
            post.classList.remove('hidden');
        }
    }
}

window.onload = () => {
    const searchBar = document.getElementById('search-bar');

    // set "x" behavior of search bar
    document.getElementById('search-bar-cancel').addEventListener('click', () => {
        searchBar.value = '';
        updateSearch();
    });

    // set search behavior
    searchBar.addEventListener('input', () => updateSearch())
}    
`
}

export function homePageOlderPostsCss(){
    return `
${getHeaderCssFragment('')}

.header-links-container {
    border-bottom: 1px solid rgb(100,100,100) !important;
}

.tree-view-root {
    width: 100%;
    background-color: white;
}

.outer-list {
    list-style-type: none;
    margin-top: 0px;
    padding-left: 0px;
    font-size: 20px;
}

.inner-list-item {
    list-style-type: none;
}

.month-li ul {
    padding-left: min(40px, 5%);
}

.tree-view-content {
    padding-top: 20px;
    padding-left: 30px;
    padding-bottom: 20px;
    font-family: "Open Sans", sans-serif;
}

.tree-view-content ul li {
    margin: 10px;
}

.tree-view-content ul li details summary {
    cursor: pointer;
}

.list-link {
    text-decoration: none;
    color: #53824A;
}

.search-bar-wrapper {
    margin-top: 10px;
    margin-bottom: 10px;
    margin-left: 28px;
    margin-right: 15px;
    max-width: 400px;
    position: relative;
}

.search-bar-input {
    font-size: 16px;
    padding: 2px;
    width: calc(100% - 30px);
    padding-right: 24px;
}

.search-bar-cancel-icon {
    position: absolute;
    right: 6px;
    top: 3px;
    color: rgb(150,150,150);
    cursor: pointer;
}

.hidden {
    display: none;
}
`
}

export function homePageOlderPostsHtml(pages: Page[], idMap: Map<string, string>){

    let months = ''
    const bins = binToMonths(pages.filter(p => p.isBlogPost))
    for(let bin of bins){
        months += monthHtml(bin, idMap)
    }

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    ${getNoIndexMetaTag()}
    <title>Rick & Julie's Excellent Adventure</title>
    <link rel="stylesheet" type="text/css" href="./older-posts.css">
  </head>
  <body>
    <main>
        <div class="root">
            <div class="header-box">
                ${getHeaderHtmlFragment(pages, idMap, '', false)}
                <div class="tree-view-root">
                    <div class="tree-view-content">
                        <div class="search-bar-wrapper">
                            <input id="search-bar" class="search-bar-input" placeholder="⌕ Filter posts"/>
                            <div id="search-bar-cancel" class="search-bar-cancel-icon" title="Clear search">✖</div>
                        </div>
                        <ul class="outer-list">
                            ${months}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </main>
    <script src="older-posts.js"></script>
  </body>
</html>`
}

function monthHtml(bin: MonthBin, idMap: Map<string, string>){
    let stateString = ''
    if(bin.states.length > 0 && bin.states.length <= 3){
        stateString = ' (' + bin.states.join(', ') + ')'
    } else if(bin.states.length > 0 && bin.states.length <= 10) {
        stateString = ` (${bin.stateAbbreviations.join(', ')})`
    } else if(bin.states.length > 10){
        const max10 = bin.stateAbbreviations.slice(0, 10)
        stateString = ` (${max10.join(', ')}, ...)`
    }

    let itemHtml = ''
    for(const p of bin.orderedPages){
        let shortDate = getShortReadableDateString(p.date)
        // remove year
        shortDate = shortDate.substring(0, shortDate.length - 5)
        const par = document.createElement('p')
        par.appendChild(document.createTextNode(p.title))
        const escapedTitle = par.innerHTML
        itemHtml += `
            <li class='inner-list-item' id='${p.id}'>
                ${shortDate}: <a class="list-link" href="${idMap.get(p.id)}/page.html">${escapedTitle}</a>
            </li>
        `
    }

    return `<li class='month-li'>
    <details>
        <summary>${bin.dateDisplayStr + stateString}</summary>
        <ul>
            ${itemHtml}
        </ul>
    </details>
</li>`
}

type MonthBin = {
    month: number
    year: number
    dateDisplayStr: string
    states: string[]
    stateAbbreviations: string[]
    orderedPages: Page[]
}
function binToMonths(pages: Page[]){
    const newToOld = [...pages]

    const matchesMonthAndYear = (bin: MonthBin, month: number, year: number) => 
        bin.month === month && bin.year === year
    const dateDisplay = (mo: number, year: number) => {
        return ['January', 'February', 'March', 'April', 'May', 
            'June', 'July', 'August', 'September', 'October', 'November', 'December'][mo - 1] + ' ' + year
    }
    
    const result: MonthBin[] = []
    for(let i = 0; i < newToOld.length; i++){
        const p = newToOld[i]
        const month = p.date.month + 1
        const year = p.date.year
        if(result.length === 0 || !matchesMonthAndYear(result[result.length - 1], month, year)){
            // make new entry 
            result.push({
                month: month,
                year: year,
                dateDisplayStr: dateDisplay(month, year),
                states: [],
                stateAbbreviations: [],
                orderedPages: [p]
            })
        } else {
            // add to existing entry
            result[result.length - 1].orderedPages.push(p)
        }
    }
    for(let bin of result){
        bin.states = getStatesInTitles(bin.orderedPages)
        bin.stateAbbreviations = bin.states.map(state => stateAbbreviations[states.indexOf(state)])
    }

    return result
}

const states = [
    "Alaska", "Alabama", "Arkansas", "Arizona", "California", "Colorado", "Connecticut", 
    "Delaware", "Florida", "Georgia", "Hawaii", "Iowa", "Idaho", "Illinois", "Indiana", "Kansas", 
    "Kentucky", "Louisiana", "Massachusetts", "Maryland", "Maine", "Michigan", "Minnesota", "Missouri", 
    "Mississippi", "Montana", "North Carolina", "North Dakota", "Nebraska", "New Hampshire", 
    "New Jersey", "New Mexico", "Nevada", "New York", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", 
    "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Virginia", 
    "Vermont", "Washington", "Wisconsin", "West Virginia", "Wyoming",

    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 
    'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 
    'Saskatchewan', 'Yukon Territory'
]
const stateAbbreviations = [
    'AK', 'AL', 'AR', 'AZ', 'CA', 'CO', 'CT',
    'DE', 'FL', 'GA', 'HI', 'IA', 'ID', 'IL', 'IN', 'KS',
    'KY', 'LA', 'MA', 'MD', 'ME', 'MI', 'MN', 'MO',
    'MS', 'MT', 'NC', 'ND', 'NE', 'NH', 
    'NJ', 'NM', 'NV', 'NY', 'OH', 'OK', 'OR', 'PA',
    'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VA',
    'VT', 'WA', 'WI', 'WV', 'WY',

    'AB', 'BC', 'MB', 'NB', 'NL',
    'NT', 'NS', 'NU', 'ON', 'PE', 'QC',
    'SK', 'YT'
]
function getStatesInTitles(pages: Page[]): string[] {
    const res: string[] = []
    for(const p of pages){
        for(let s of states){
            if(p.title.includes(s) && res.indexOf(s) === -1){
                res.push(s)
            }
        }
    }
    return res
}