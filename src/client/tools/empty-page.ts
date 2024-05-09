import { Page } from '../types/PageType'
import { getReadableDateString } from './date';
import { Media, hasImageExt } from './media';

export function nextID(): string {
    return '' + crypto.randomUUID()
}

function emptyPage(): Page {
    const id = nextID()
    return {
        id: id,
        title: 'Untitled',
        autoSummary: true,
        summaryText: '',
        autoSummaryImg: true,
        summaryImg: null, 
        date: new Date(),
        isBlogPost: true,
        linkedFromHeader: false,
        headerSortOrder: '0',
        familyPrivate: false,
        design: []
    }
}

export function emptyBlogPost(): Page {
    return {
        ...emptyPage(),
        isBlogPost: true
    }
}

export function sortPages(newPages: Page[]){
    newPages.sort((a, b) => {
        if(a.date < b.date){
            return -1
        }
        if(b.date < a.date) {
            return 1
        }
        // sort alphabetically according to title next
        if(a.title !== b.title){
            return a.title < b.title ? -1 : 1
        }
        // sort by id finally
        return a.id < b.id ? -1 : 1
    })
    return newPages
}

export function getAllReferencedMediaNames(pages: Page[]){
    let res: string[] = []
    for(let p of pages){
        getAllRefMedia(res, p)
    }
    return res
}

function getAllRefMedia(workingList: string[], obj: any){
    // look for any string with value containing "http://localhost:\d{4}/media/.*"
    const r = /http:\/\/localhost:\d{4}(\/|\\)media(\/|\\)/
    for(let key in obj){
        if(typeof obj[key] === 'object'){
            getAllRefMedia(workingList, obj[key])
        } else if(Array.isArray(obj[key])){
            for(let el of obj[key]){
                getAllRefMedia(workingList, el)
            }
        } else if(typeof obj[key] === 'string' && obj[key].match(r)){
            // don't include localhost part
            const spl = obj[key].split(r) // splits on all capturing groups
            workingList.push(spl[spl.length - 1])
        }
    }
}

export function getSummaryText(page: Page): string{
    if(!page.autoSummary){
        return page.summaryText
    }
    // generate auto summary; find first non-empty paragraph at the root level
    for(const obj of page.design.slice(2)){ // first two elements are header, date
        if(obj.type === 'paragraph'){
            // check if paragraph is empty
            if(obj.children && obj.children.length > 0 && obj.children[0].text && obj.children[0].text.trim().length > 0){
                return obj.children[0].text.trim()
            }
        }
    }
    return ''
}

export function getSummaryImg(page: Page): Media | null {
    if(!page.autoSummaryImg){
        return page.summaryImg
    }
    // generate auto image; find first non-empty media box at root level
    for(const obj of page.design){
        if(obj.type === 'media-parent'){
            // check children
            for(const child of obj.children){
                if(child.type === 'media-child' && child.content !== null){
                    // check extension on content
                    const m = child.content as Media
                    if(hasImageExt(m.stableRelativePath)){
                        return m
                    }
                }
            }
        }
    }
    return null
}

export function fixedBlogHeader(title: string, date: Date) {
    return [
        {
            type: 'h1',
            readOnly: true,
            children: [{text: title}]
        },{
            type: 'paragraph',
            readOnly: true,
            children: [{text: getReadableDateString(date), fontSize: 'small'}]
        }, {
            type: 'paragraph',
            readOnly: true,
            children: [{text: ''}]  
        }
    ]
}

export function emptyBlogPostWithTitleDate(title: string, date: Date) : Page {
    const p = emptyBlogPost()
    p.title = title
    p.date = date
    p.design = [...fixedBlogHeader(title, date),{
        type: 'paragraph',
        children: [{text: 'Gustav is back!'}]
    }]
    return p
}

export function emptyStaticPage(): Page {
    return {
        ...emptyPage(),
        isBlogPost: false
    }
}

export function emptyStaticPageWithTitleDate(title: string, date: Date): Page {
    const p = emptyStaticPage()
    p.title = title 
    p.date = date 
    p.design = [{
        type: 'h1',
        children: [{text: title}]
    }, {
        type: 'paragraph',
        children: [{text: 'A static page!'}]
    }]
    return p
}