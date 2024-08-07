import { Page } from "../types/PageType"
import { ExternalLink } from "../types/link"
import { emptyBlogPostWithTitleDate } from "./empty-page"
import { searchCachedImageFolders } from "./http"
import { Media, registerMedia } from "./media"

export type BloggerImportResult = {
    design: any[],
    autoSummaryImg: boolean,
    summaryImg: Promise<Media | string>
}

// ALL nodes of type media-children will have content attribute 
// populated by Promise<Media | string> instead of Media!
export function importBlogger(existingPage: Page, html: string): BloggerImportResult | null {
    const parser = new DOMParser()
    const htmlDoc = parser.parseFromString(html, 'text/html')    
    const body = htmlDoc.querySelector('body')
    if(body !== null){
        const context: ParseContext = {
            summaryImg: new Promise((res, rej) => res('Missing thumbnail image')),
            imageSizingModeNew: html.includes('width="1100"'),
            inParagraph: false,
            bold: false,
            underline: false,
            italic: false,
            strikethrough: false,
            fontSize: 'medium'
        }
        const parseNodes = body.childNodes
        const design = []
        for(const n of parseNodes){
            design.push(...parseNode(n, context).filter(p => p !== undefined && p !== ''))
        }
        
        const finalDesign = emptyBlogPostWithTitleDate(existingPage.title, existingPage.date, []).design
        while(finalDesign[1].children.length > 2){
            finalDesign[1].children.pop()
        }
        finalDesign[1].children.push(...design)
        const result: BloggerImportResult = {
            design: finalDesign,
            autoSummaryImg: false,
            summaryImg: new Promise((res, rej) => res(''))
        }
        if(context.summaryImg !== null){
            result.autoSummaryImg = false
            result.summaryImg = context.summaryImg
        }

        return result
    }

    return null
}

type ParseContext = {
    summaryImg: Promise<Media | string>,
    imageSizingModeNew: boolean,
    inParagraph: boolean,
    bold: boolean,
    italic: boolean,
    underline: boolean,
    strikethrough: boolean,
    fontSize: string
}

function parseNode(node: Element | ChildNode, context: ParseContext): (Object | undefined)[]{
    const tag = (node as any).tagName
    if(tag === 'P'){
        return [parseP(node as Element, context)]
    } else if(tag === 'A'){
        return [parseA(node as Element, context, false)]
    } else if(tag === 'IMG'){
        return [parseImg(node as Element, context)]  
    } else if(tag === 'UL'){
        return [parseList('UL', node as Element, context)]
    } else if(tag === 'OL'){
        return [parseList('OL', node as Element, context)]  
    } else if(tag === 'BR'){
        // we are purposefully ignoring br elements
        return []  
    } else if(tag === 'DIV'){
        return parseDiv(node as Element, context)
    } else if(tag === 'TABLE'){
        return [parseTable(node as Element, context)]  
    } else if(['B', 'I', 'S', 'STRIKE', 'U'].includes(tag)){
       return [parseMarkTagNaked(tag, node as Element, context)]  
    } else if(tag === 'BLOCKQUOTE'){
        return [parseBlockQuote(node as Element, context)]
    } else if(node.nodeName === '#text'){
       return [{
            type: 'paragraph',
            children: [parseTextNode(node, context)] 
       }] 
    } else {
        console.log('unrecognized element tag', tag, node)
    }

    return []
}

function parseBlockQuote(node: Element, context: ParseContext): (Object | undefined) {
    const contents = []
    for(let n of node.childNodes){
        const nRes = parseNode(n, context).filter(s => !!s)
        contents.push(...nRes)
    }
    if(contents.length > 0){
        return {
            type: 'blockquote',
            children: contents
        }
    }
}

function parseList(tagName: string, node: Element, context: ParseContext): Object | undefined {
    const legalChildren = [...node.children].filter(c => ['UL','OL','LI'].includes(c.tagName))
    const ulChildren = legalChildren.map(c => {
        if(c.tagName === 'UL'){
            return parseList('UL', c, context)
        } else if(c.tagName === 'OL'){
            return parseList('OL', c, context)
        } else {
            return parseLi(c, context)
        }
    }).filter(s => !!s)
    if(ulChildren.length > 0){
        return {
            type: 'list',
            listType: tagName === 'UL' ? 'ul' : 'ol',
            children: ulChildren
        }
    }
}

function parseLi(node: Element, context: ParseContext): Object {
    const contents = parseDiv(node, context).filter(s => !!s)
    if(contents.length === 0){
        contents.push({
            type: 'paragraph',
            children: [{text: ''}]
        })
    }
    return {
        type: 'li',
        children: contents
    }
}

function parseDiv(node: Element, context: ParseContext) : (Object | undefined)[] {
    const res: any[] = []
    const div = node as Element
    let inTextLike = true
    let textLikeBlock: (ChildNode | Element)[] = []
    let elLikeBlocks: (ChildNode | Element)[] = []
    function textLike(n: ChildNode | Element){
        if('tagName' in n && n.tagName === 'A'){
            const parsed = parseA(n as Element, context, true)
            return parsed && (parsed as any).type === 'a'
        }
        return n.nodeName === '#text' || ('tagName' in n && 
            ['U','S','STRIKE','I','B'].includes(n.tagName))
    }
    function renderTextLike(){
        // create <p> node around textLikeBlock and render via parseP
        const p = document.createElement('P')
        for(const t of textLikeBlock){
            p.appendChild(t)
        }
        res.push(parseP(p, context))
        textLikeBlock = []
    }
    function renderElLike(){
        // render elLikeBlock by flattening
        for(const el of elLikeBlocks){
            res.push(...parseNode(el, context).filter(s => !!s))
        }
        elLikeBlocks = []
    }
    for(const n of div.childNodes){
        if(textLike(n)){
            if(inTextLike){
                textLikeBlock.push(n)
            } else {
                renderElLike()
                textLikeBlock = [n]
                inTextLike = true
            }
        } else {
            if(inTextLike){
                renderTextLike()
                elLikeBlocks = [n]
                inTextLike = false
            } else {
                elLikeBlocks.push(n)
            }
        }
    }
    if(textLikeBlock.length > 0){ renderTextLike() }
    if(elLikeBlocks.length > 0){ renderElLike() }
    
    return res
}

function parseTable(node: Element, context: ParseContext): Object | undefined {
    const tableEl = node as HTMLTableElement
    const cells = tableEl.getElementsByTagName('td')
    // currently only recognize pattern is cells.length == 2 for image + caption
    if(cells.length === 2 && cells[0].children.length === 1 && 
        (cells[0].children[0].tagName === 'A' || cells[0].children[0].tagName === 'IMG')){
        const parsedA = cells[0].children[0].tagName === 'A' ? parseA(cells[0].children[0], context, false) : 
            parseImg(cells[0].children[0], context)
        if(parsedA && (parsedA as any).type === 'media-parent'){
            // add a caption
            (parsedA as any).children.push({
                type: 'media-child-caption',
                children: [{...parseP(cells[1], {...context, italic: true, fontSize: 'small'}), textAlign: 'center'}]
            })
            return parsedA
        }
    }
    
    console.log('unrecognized table', cells)
}

function parseMarkTagInPar(tagName: string, node: Element, context: ParseContext): Object[] {
    const res = []
    let name = ''
    if(tagName === 'B'){
        name = 'bold'
    } else if(tagName === 'I'){
        name = 'italic'
    } else if(tagName === 'S' || tagName === 'STRIKE'){
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
        else if(['B', 'I', 'U', 'S', 'STRIKE'].includes(n.nodeName)){
            res.push(...parseMarkTagInPar(n.nodeName, n as Element, newContext))
        } else if(n.nodeName === 'BR'){
            res.push({text: '\n'})
        }
    }
    return res
}

function parseMarkTagNaked(tagName: string, node: Element, context: ParseContext): Object {
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

function parseTextNode(node: ChildNode, context: ParseContext): Object {
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

function parseP(node: Element, context: ParseContext): Object {
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
            const a = parseA(n as Element, {...context, inParagraph: true}, false)
            if(a && (a as any).type === 'a'){
                parsedEl.children.push(a)
            }
        } else if(['B', 'I', 'U', 'S', 'STRIKE'].includes(n.nodeName)){
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

const oldImgSizeWidths = [640, 400, 320, 200]
const oldImgSizeNames = ['x-large', 'large', 'medium', 'small']

const newImgSizeWidths = [1100, 640, 400, 320, 200]
const newImgSizeNames = ['x-large', 'large', 'medium', 'small', 'x-small']

function sizeFromWidth(imageSizingModeNew: boolean, width: number): string {
    const sizeWidths = imageSizingModeNew ? newImgSizeWidths : oldImgSizeWidths
    const sizeNames = imageSizingModeNew ? newImgSizeNames : oldImgSizeNames

    let nearestWidthIndex = 0
    let widthError = Math.abs(width - sizeWidths[nearestWidthIndex])
    for(let i = 0; i < sizeWidths.length; i++){
        let error = Math.abs(width - sizeWidths[i])
        if(error < widthError){
            nearestWidthIndex = i
            widthError = error
        }
    }

    return sizeNames[nearestWidthIndex]
}

// if dryRun === true, then no media register will occur
function parseA(node: Element, context: ParseContext, dryRun: boolean): Object | undefined {
    const aEl = node as HTMLLinkElement
    if(['jpg', 'JPG', 'jpeg', 'JPEG', 'bmp', 'BMP', 'png', 'PNG'].filter(ext => aEl.href.endsWith(ext)).length > 0 &&
            aEl.children.length === 1 && aEl.children[0].tagName === 'IMG'){
        // this is actually an image
        const ref = aEl.href 
        const lastSlash = ref.lastIndexOf('/')
        const name = lastSlash === -1 ? ref : ref.substring(lastSlash + 1)
        const media = dryRun ? undefined : findAndRegisterImg(decodeURI(name), context)
        let size = 'medium'
        if(aEl.children.length > 0 && aEl.children[0].tagName === 'IMG'){
            // strip size from child element
            const img = aEl.children[0] as HTMLImageElement
            const w = img.width
            if(w && typeof w === 'number'){
                size = sizeFromWidth(context.imageSizingModeNew, w)
            } else {
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
            }]
        }

    } else if(aEl.textContent && aEl.textContent.trim().length > 0) {
        // this should be preserved as a link
        const link: ExternalLink = {
            url: aEl.href,
            openInNewTab: true
        }
        return {
            type: 'a',
            link: link,
            children: [{text: aEl.textContent}]
        }
    }
    console.log('<a> tag ignored', aEl)
}

function parseImg(node: Element, context: ParseContext): Object | undefined {
    const imgEl = node as HTMLImageElement
    if(imgEl.style.display === 'none'){
        // this is a thumbnail image
        const src = decodeURI(imgEl.src) 
        const lastSlash = src.lastIndexOf('/')
        const name = lastSlash === -1 ? src : src.substring(lastSlash + 1)
        const media = findAndRegisterImg(decodeURI(name), context)
        if(media !== null){
            context.summaryImg = media
        }
    } else {
        // treat as actual image
        const src = imgEl.src 
        const lastSlash = src.lastIndexOf('/')
        const name = lastSlash === -1 ? src : src.substring(lastSlash + 1)
        const media = findAndRegisterImg(decodeURI(name), context)
        let size = 'medium'
        if(imgEl.width && typeof imgEl.width === 'number'){
            size = sizeFromWidth(context.imageSizingModeNew, imgEl.width)
        }
        return {
            type: 'media-parent',
            children: [{
                type: 'media-child',
                size: size,
                content: media,
                children: [{text: ''}]
            }]
        }
    }
    console.log('skipping <img>', imgEl)
}

function findAndRegisterImg(name: string, context: ParseContext): Promise<Media | string> {
    return new Promise((resolve, reject) => {
        searchCachedImageFolders(name).then(result => {
            if(!result.found){
                resolve(name)
            } else {
                registerMedia(result.absolutePath).then(media => resolve(media))
            }
        })
    })
}