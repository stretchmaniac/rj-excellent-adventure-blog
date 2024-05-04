import { Page } from '../types/PageType'

export default function pageContains(page: Page, searchString: string) : boolean {
    const lowerSearch = searchString.toLocaleLowerCase()
    const title = page.title.toLocaleLowerCase()
    const summary = page.summaryText.toLocaleLowerCase()
    let date1 = 'invalid date';
    let date2 = '';
    let date3 = '';
    if(!isNaN(page.date.getTime())){
        date1 = page.date.toDateString().toLocaleLowerCase()
        const day = page.date.getDay()
        const month = page.date.getMonth() + 1
        const year = page.date.getFullYear()
        date2 = month + "/" + day + "/" + year 
        date3 = year + "/" + month + "/" + day
    }
    const searches = [title, summary, date1, date2, date3, 
        ...getPageDesignTextNodes(page.design).map(s => s.toLocaleLowerCase())
    ]
    return searches.filter(s => s.indexOf(lowerSearch) >= 0).length > 0
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