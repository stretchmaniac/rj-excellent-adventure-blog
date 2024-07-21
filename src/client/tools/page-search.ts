import { Page } from '../types/PageType'
import { toDate } from './date'

export function pageContains(page: Page, searchString: string) : boolean {
    const lowerSearch = searchString.toLocaleLowerCase()
    const searches = getPageSearchTextArr(page)
    return searches.filter(s => s.indexOf(lowerSearch) >= 0).length > 0
}

export function getPageSearchTextArr(page: Page): string[] {
    const title = page.title.toLocaleLowerCase()
    const summary = page.summaryText.toLocaleLowerCase()
    const date1 = toDate(page.date).toDateString().toLocaleLowerCase()
    const day = page.date.day
    const month = page.date.month + 1
    const year = page.date.year
    const date2 = month + "/" + day + "/" + year 
    const date3 = year + "/" + month + "/" + day
    const searches = [title, summary, date1, date2, date3, 
        ...getPageDesignTextNodes(page.design).map(s => s.toLocaleLowerCase())
    ]
    return searches
}

function getPageDesignTextNodes(obj: any): string[] {
    if(Array.isArray(obj)){
        const res = []
        for(let el of obj){
            res.push(...getPageDesignTextNodes(el))
        }
        return res
    }
    const res = []
    if('text' in obj && obj.text.trim().length !== 0){
        res.push(obj.text)
    }
    if('children' in obj){
        res.push(...getPageDesignTextNodes(obj.children))
    }
    return res
}