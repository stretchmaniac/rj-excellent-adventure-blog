import { Page } from '../types/PageType'

let currentID = 0;
export function nextID(): string {
    currentID++
    return '' + currentID
}

function emptyPage(): Page {
    const id = nextID()
    return {
        id: id,
        title: 'Untitled',
        autoSummary: true,
        summaryText: '',
        date: new Date(),
        isBlogPost: true,
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

export function emptyBlogPostWithTitleDate(title: string, date: Date) : Page {
    const p = emptyBlogPost()
    p.title = title
    p.date = date
    p.design = [{
        type: 'h1',
        children: [{text: title}]
    },{
        type: 'paragraph',
        children: [{text: date.toDateString(), fontSize: 'x-small'}]
    }, {
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