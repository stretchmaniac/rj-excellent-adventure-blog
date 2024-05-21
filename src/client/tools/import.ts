import { MediaChild } from "../components/PageDesign"
import { Page } from "../types/PageType"
import { ExternalLink } from "../types/link"
import { emptyBlogPostWithTitleDate } from "./empty-page"
import { Media } from "./media"

export function importBlogger(existingPage: Page, html: string): Page | null {
    const parser = new DOMParser()
    const htmlDoc = parser.parseFromString(html, 'text/html')    
    const body = htmlDoc.querySelector('body')
    if(body !== null){
        const context: ParseContext = {
            summaryImg: null,
            imageSizingModeNew: html.includes('width="1100"'),
            inParagraph: false,
            bold: false,
            underline: false,
            italic: false,
            strikethrough: false,
            fontSize: 'medium'
        }
        const parseNodes = body.children
        const design = []
        for(const n of parseNodes){
            design.push(...parseNode(n, context).filter(p => p !== undefined && p !== ''))
        }
        
        const finalDesign = emptyBlogPostWithTitleDate(existingPage.title, existingPage.date).design
        while(finalDesign[1].children.length > 2){
            finalDesign[1].children.pop()
        }
        finalDesign[1].children.push(...design)
        const p: Page = {
            ...existingPage,
            design: finalDesign
        }
        if(context.summaryImg !== null){
            p.autoSummaryImg = false
            p.summaryImg = context.summaryImg
        }

        return p
    }

    return null
}

type ParseContext = {
    summaryImg: Media | null,
    imageSizingModeNew: boolean,
    inParagraph: boolean,
    bold: boolean,
    italic: boolean,
    underline: boolean,
    strikethrough: boolean,
    fontSize: string
}

function parseNode(node: Element, context: ParseContext): any[]{
    const tag = node.tagName
    if(tag === 'P'){
        return [parseP(node, context)]
    } else if(tag === 'A'){
        return [parseA(node, context)]
    } else if(tag === 'IMG'){
        return [parseImg(node, context)]  
    } else if(tag === 'BR'){
        // we are purposefully ignoring br elements
        return []  
    } else if(tag === 'DIV'){
        const res = []
        if(node.childNodes.length === node.children.length){
            // flatten div element
            for(const n of node.children){
                res.push(...parseNode(n, context))
            }
        } else {
            // treat as paragraph
            res.push(parseP(node, context))
        }
        return res
    } else if(tag === 'TABLE'){
        return [parseTable(node, context)]  
    } else if(['B', 'I', 'S', 'U'].includes(tag)){
       return [parseMarkTagNaked(tag, node, context)]  
    } else {
        console.log('unrecognized element tag', tag, node)
    }

    return []
}

function parseTable(node: Element, context: ParseContext){
    const tableEl = node as HTMLTableElement
    const cells = tableEl.getElementsByTagName('td')
    // currently only recognize pattern is cells.length == 2 for image + caption
    if(cells.length === 2 && cells[0].children.length === 1 && cells[0].children[0].tagName === 'A'){
        const parsedA = parseA(cells[0].children[0], context)
        if(parsedA.type === 'media-parent'){
            // add a caption
            parsedA.children.push({
                type: 'media-parent-caption',
                children: [{...parseP(cells[1], {...context, italic: true, fontSize: 'small'}), textAlign: 'center'}]
            })
            return parsedA
        }
    }
    return ''
}

function parseMarkTagInPar(tagName: string, node: Element, context: ParseContext): any[] {
    const res = []
    let name = ''
    if(tagName === 'B'){
        name = 'bold'
    } else if(tagName === 'I'){
        name = 'italic'
    } else if(tagName === 'S'){
        name = 'strikethrough'
    } else if(tagName === 'U'){
        name = 'underline'
    }
    const newContext: any = {...context}
    if(name !== ''){
        newContext[name] = true
    }
    for(const n of node.childNodes){
        if(n.nodeName === '#text' || n.nodeName === 'SPAN'){
            res.push(parseTextNode(n, newContext))
        }
        else if(['B', 'I', 'U', 'S'].includes(n.nodeName)){
            res.push(...parseMarkTagInPar(n.nodeName, n as Element, newContext))
        } else if(n.nodeName === 'BR'){
            res.push({text: '\n'})
        }
    }
    return res
}

function parseMarkTagNaked(tagName: string, node: Element, context: ParseContext): any {
    // surround in p el
    const res = {
        type: 'paragraph',
        children: parseMarkTagInPar(tagName, node, {...context, inParagraph: true})
    }
    if(res.children.length === 0){
        res.children.push({text: ''})
    }
    return res
}

function parseTextNode(node: ChildNode, context: ParseContext): any {
    const res: any = {
        text: node.textContent,
        fontSize: context.fontSize
    }
    if(context.bold){
        res.bold = true
    }
    if(context.italic){
        res.italic = true
    }
    if(context.underline){
        res.underline = true
    }
    if(context.strikethrough){
        res.strikethrough = true
    }
    return res
}

function parseP(node: Element, context: ParseContext){
    const parsedEl = {
        type: 'paragraph',
        children: [] as any[]
    }
    
    for(const n of node.childNodes){
        if(n.nodeName === '#text' || n.nodeName === 'SPAN'){
            if(n.textContent !== ''){
                parsedEl.children.push(parseTextNode(n, {...context, inParagraph: true}))
            }
        } else if(n.nodeName === 'A'){
            parsedEl.children.push(parseA(n as Element, {...context, inParagraph: true}))
        } else if(['B', 'I', 'U', 'S'].includes(n.nodeName)){
            parsedEl.children.push(...parseMarkTagInPar(n.nodeName, n as Element, {...context, inParagraph: true}))
        } else if(n.nodeName === 'BR'){
            parsedEl.children.push({text: '\n'})
        }
    }

    if(parsedEl.children.length === 0){
        parsedEl.children.push({text: ''})
    }

    return parsedEl
}

function parseA(node: Element, context: ParseContext): any {
    const aEl = node as HTMLLinkElement
    if(['jpg', 'JPG', 'jpeg', 'JPEG', 'bmp', 'BMP', 'png', 'PNG'].filter(ext => aEl.href.endsWith(ext)).length > 0){
        // this is actually an image
        const ref = aEl.href 
        const lastSlash = ref.lastIndexOf('/')
        const name = lastSlash === -1 ? ref : ref.substring(lastSlash + 1)
        const media = findAndRegisterImg(name, context)
        let size = 'medium'
        if(aEl.children.length > 0 && aEl.children[0].tagName === 'IMG'){
            // strip size from child element
            const img = aEl.children[0] as HTMLImageElement
            const w = img.width 
            const oldMap: any = {
                '640': 'x-large',
                '400': 'large',
                '320': 'medium',
                '200': 'small'
            }
            const newMap: any = {
                '1100': 'x-large',
                '640': 'large',
                '400': 'medium',
                '320': 'small',
                '200': 'x-small'
            }
            size = context.imageSizingModeNew ? newMap[w + ''] : oldMap[w + '']
            if(!size){
                size = 'medium'
            }
        }
        return {
            type: 'media-parent',
            children: [{
                type: 'media-child',
                size: size,
                content: media,
                children: [{text: ''}]
            } as MediaChild]
        }

    } else {
        // this should be preserved as a link
        const link: ExternalLink = {
            url: aEl.href
        }
        return {
            type: 'a',
            link: link,
            children: [{text: aEl.textContent}]
        }
    }
    return ''
}

function parseImg(node: Element, context: ParseContext){
    const imgEl = node as HTMLImageElement
    if(imgEl.style.display === 'none'){
        // this is a thumbnail image
        const src = imgEl.src 
        const lastSlash = src.lastIndexOf('/')
        const name = lastSlash === -1 ? src : src.substring(lastSlash + 1)
        const media = findAndRegisterImg(name, context)
        if(media !== null){
            context.summaryImg = media
        }
    }
    return ''
}

function findAndRegisterImg(name: string, context: ParseContext): Media | null {
    return null
}