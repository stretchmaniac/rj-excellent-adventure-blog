import { Page } from "../types/PageType";
import { getShortReadableDateString } from "./date";
import { getHeaderCssFragment, getHeaderHtmlFragment } from "./preview";

export function homePageOlderPostsCss(){
    return `
${getHeaderCssFragment()}

.tree-view-root {
    width: 100%;
    background-color: white;
}

.outer-list {
    list-style-type: none;
    margin-top: 0px;
    padding-left: 0px;
}

.tree-view-content {
    padding-top: 20px;
    padding-left: 30px;
}

.tree-view-content ul li {
    margin: 10px;
}

.tree-view-content ul li details summary {
    cursor: pointer;
}

.list-link {
    text-decoration: none;
    color: #25a186;
}
`
}

export function homePageOlderPostsHtml(pages: Page[]){

    let months = ''
    const bins = binToMonths(pages.filter(p => p.isBlogPost))
    for(let bin of bins){
        months += monthHtml(bin)
    }

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Rick & Julie's Excellent Adventure</title>
    <link rel="stylesheet" type="text/css" href="./older-posts.css">
  </head>
  <body>
    <main>
        <div class="root">
            <div class="header-box">
                ${getHeaderHtmlFragment(pages, '')}
                <div class="tree-view-root">
                    <div class="tree-view-content">
                        <ul class="outer-list">
                            ${months}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </main>
  </body>
</html>`
}

function monthHtml(bin: MonthBin){
    let stateString = ''
    if(bin.states.length > 0){
        const maxThree = bin.states.slice(0, Math.min(3, bin.states.length))
        stateString = ' (' + maxThree.join(', ') + ')'
    }

    let itemHtml = ''
    for(const p of bin.orderedPages){
        let shortDate = getShortReadableDateString(p.date)
        // remove year
        shortDate = shortDate.substring(0, shortDate.length - 5)
        itemHtml += `
            <li>
                ${shortDate}: <a class="list-link" href="#">${p.title}</a>
            </li>
        `
    }

    return `<li>
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
    orderedPages: Page[]
}
function binToMonths(pages: Page[]){
    // reverse pages to go from newest to oldest
    const newToOld = [...pages].reverse()

    const matchesMonthAndYear = (bin: MonthBin, month: number, year: number) => 
        bin.month === month && bin.year === year
    const dateDisplay = (mo: number, year: number) => {
        return ['January', 'February', 'March', 'April', 'May', 
            'June', 'July', 'August', 'September', 'October', 'November', 'December'][mo - 1] + ' ' + year
    }
    
    const result: MonthBin[] = []
    for(let i = 0; i < newToOld.length; i++){
        const p = newToOld[i]
        const month = p.date.getMonth() + 1
        const year = p.date.getFullYear()
        if(result.length === 0 || !matchesMonthAndYear(result[result.length - 1], month, year)){
            // make new entry 
            result.push({
                month: month,
                year: year,
                dateDisplayStr: dateDisplay(month, year),
                states: [],
                orderedPages: [p]
            })
        } else {
            // add to existing entry
            result[result.length - 1].orderedPages.push(p)
        }
    }
    for(let bin of result){
        bin.states = getStatesInTitles(bin.orderedPages)
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