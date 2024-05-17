import { Page } from '../types/PageType'
import { getReadableDateString } from './date';
import { Media, MediaType, hasImageExt } from './media';

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
            return 1
        }
        if(b.date < a.date) {
            return -1
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

export type ReferencedMedia = {
    fileName: string,
    type: MediaType
}

export function getAllReferencedMedia(pages: Page[]): ReferencedMedia[] {
    let res: ReferencedMedia[] = []
    for(let p of pages){
        getAllRefMedia(res, p)
    }
    return res
}

function getAllRefMedia(workingList: ReferencedMedia[], obj: any){
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
            const spl: string = obj[key].split(r) // splits on all capturing groups
            const type = 'type' in obj ? obj.type as MediaType : MediaType.IMAGE
            workingList.push({
                fileName: spl[spl.length - 1],
                type: type 
            })
        }
    }
}

export function getSummaryText(page: Page): string{
    if(!page.autoSummary){
        return page.summaryText
    }
    if(page.design.length < 2){
        return ''
    }
    // generate auto summary; find first non-empty paragraph at the root level
    // first entry is header-container, second is content-container, first entry in content-container is date
    for(const obj of page.design[1].children.slice(1)){
        if(obj.type === 'paragraph'){
            let contents = ''
            for(const child of obj.children){
                if('text' in child){
                    contents += child.text
                }
            }
            if(contents.trim().length > 0){
                return contents
            }
        }
    }
    return ''
}

export function getSummaryImg(page: Page): Media | null {
    if(!page.autoSummaryImg){
        return page.summaryImg
    }
    if(page.design.length < 2){
        return null
    }
    // generate auto image; find first non-empty media box at root level
    // first entry is header-container, second is content-container, first entry in content-container is date
    for(const obj of page.design[1].children){
        if(obj.type === 'media-parent'){
            // check children
            for(const child of obj.children){
                if(child.type === 'media-child' && child.content !== null && child.content.type === MediaType.IMAGE){
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
            type: 'header-container',
            readOnly: true,
            children: [
                {
                    type: 'h1',
                    readOnly: true,
                    children: [{text: title}]
                }
            ]
        },
        {
            type: 'content-container',
            readOnly: false,
            children: [
                {
                    type: 'paragraph',
                    readOnly: true,
                    children: [{text: getReadableDateString(date), fontSize: 'small', font: 'open sans'}]
                }, {
                    type: 'paragraph',
                    readOnly: true,
                    children: [{text: ''}]  
                }
            ]
        }
    ]
}

export function emptyBlogPostWithTitleDate(title: string, date: Date) : Page {
    const p = emptyBlogPost()
    p.title = title
    p.date = date
    p.design = fixedBlogHeader(title, date)
    p.design[1].children.push({
        type: 'paragraph',
        children: [{text: 'Gustav is back!'}]
    })
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