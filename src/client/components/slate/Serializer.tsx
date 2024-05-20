import ReactDOMServer from 'react-dom/server'
import { fontMap } from '../../tools/font-size'
import { Link, convertShorthandUrl } from '../../types/link'
import { MediaChild } from '../PageDesign'
import { Media, MediaType } from '../../tools/media'
import React from 'react'
import { getPreviewImgSizes, getPreviewImgSrcSet } from '../../tools/preview'
import { getParElSpacing, getParNonParSpacing } from '../../tools/paragraph-spacing'
import { numberArrEq } from '../../tools/misc'
import { getFirstNonEmptyRootParLoc, getSummaryText } from '../../tools/empty-page'
import { Page } from '../../types/PageType'

export function serializeToHTML(page:Page, idMap: Map<string, string>){
    const state: SerializeState = {
        inHeaderContainer: false,
        idMap: idMap,
        pageId: page.id,
        page: page,
        peerPrev: null,
        peerNext: null,
        path: []
    }
    return page.design.map((child, i) => 
        ReactDOMServer.renderToStaticMarkup(serializeInternal(child, descState(state, page.design, i)))
    ).join('\n')
}

type SerializeState = {
    inHeaderContainer: boolean
    peerPrev: any
    peerNext: any
    path: number[]
    idMap: Map<string, string>
    pageId: string
    page: Page 
}

function descState(state: SerializeState, childArr: any[], childIndex: number): SerializeState {
    return {
        ...state,
        peerPrev: childIndex > 0 ? childArr[childIndex - 1] : null,
        peerNext: childIndex < childArr.length - 1 ? childArr[childIndex + 1] : null,
        path: [...state.path, childIndex]
    }
}

function serializeInternal(child: any, state: SerializeState): React.ReactNode {
    const type = ('type' in child) ? child.type : ''

    if(type === ''){
        return serializeLeaf(child, state)
    }

    if(type === 'header-container'){
        return serializeHeaderContainer(child, state)
    } else if(type === 'content-container'){
        return serializeContentContainer(child, state)
    } else if(type === 'paragraph'){
        return serializeParagraph(child, state)
    } else if(type === 'h1'){
        return serializeH1(child, state)
    } else if(type === 'h2'){
        return serializeH2(child, state)
    } else if(type === 'blockquote'){
        return serializeBlockQuote(child, state)
    } else if(type === 'a'){
        return serializeLink(child, state)
    } else if(type === 'list'){
        return serializeList(child, state)
    } else if(type === 'li'){
        return serializeListItem(child, state)
    } else if(type === 'media-parent'){
        return serializeMediaParent(child, state)
    } else if(type === 'media-child'){
        return serializeMediaChild(child, state)
    } else if(type === 'media-child-caption' || type === 'media-parent-caption'){
        return <React.Fragment>
            {child.children.map((c:any, i:number) => serializeInternal(c, descState(state, child.children, i)))}
        </React.Fragment>
    }

    console.log('missed type:', child)
    return ''
}

function localImageUrl(stableRelativePath: string){
    const arr = stableRelativePath.split(/[\\\/]/g)
    return arr[arr.length - 1]
}

function stripExt(fileName: string): string{
    const i = fileName.lastIndexOf('.')
    if(i >= 0){
        return fileName.substring(0, i)
    }
    return fileName
}

function serializeMediaChild(child: any, state: SerializeState): React.ReactNode {
    const content = child.content as Media | null
    const size = child.size 
    const parentStyle: any = {
        position: 'relative', // media-child
        maxWidth: '100%'
    }
    if(!content){
        parentStyle.border = '1px dashed rgb(200, 200, 200)'; // .media-child-no-content
    }
    return <div style={parentStyle} className={!content ? size : ''}>
        {content && content.type === MediaType.IMAGE && <img
            className={size + '-box'}
            srcSet={getPreviewImgSrcSet(content, state.idMap.get(state.pageId) as string, '../')}
            sizes={getPreviewImgSizes(size)}
            />
        }
        {content && content.type === MediaType.PHOTOSPHERE && <div 
            className={size + '-pannellum'}>
            <div className='pannellum-div' 
                data-imgfolder={stripExt(localImageUrl(content.stableRelativePath)) + '_ps'}
                data-pitch={content.photosphereOptions?.initialPitch}
                data-yaw={content.photosphereOptions?.initialYaw}></div>    
        </div>}
    </div>
}

function serializeMediaParent(child: any, state: SerializeState): React.ReactNode {
    const media: MediaChild[] = []
    const mediaCaptions: any[] = []
    let parentCaption: any = null
    for(const c of child.children){
        if(c.type === 'media-child'){
            media.push(c as MediaChild)
        } else if(c.type === 'media-child-caption'){
            while(mediaCaptions.length < media.length - 1){ mediaCaptions.push(null) }
            mediaCaptions.push(c)
        } else if(c.type === 'media-parent-caption'){
            parentCaption = c
        }
    }

    return <div style={{ // media-parent div
            display: 'flex',
            flexDirection: 'column'
        }}>
        <div style={{ // media-parent-image-row div
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                flexWrap: 'wrap'
            }}>
            {media.map((m, i) => 
                <div key={i} className={m.size +'-box'} style={{ // media-child-with-caption
                    marginLeft: '10px',
                    marginRight: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    {m && serializeInternal(m, {...state, peerPrev: null, peerNext: null})}
                    {mediaCaptions[i] && serializeInternal(mediaCaptions[i], {...state, peerPrev: null, peerNext: null})}
                </div>
            )}
        </div>
        <div style={{ /* media-parent-caption div */ }}>
            {parentCaption && serializeInternal(parentCaption, {...state, peerPrev: null, peerNext: null})}
        </div>
    </div>
}

function serializeListItem(child:any, state: SerializeState): React.ReactNode {
    return <li>
        {child.children && 
            child.children.map((c: any, i:number) => serializeInternal(c, descState(state, child.children, i)))
        }
    </li>
}

function serializeList(child: any, state: SerializeState): React.ReactNode {
    const fontSize = getFontSize(child)
    if(child.listType === 'ol'){
        return <ol style={{fontSize: fontSize + 'px'}}>
            {child.children && 
                child.children.map((c: any, i:number) => serializeInternal(c, descState(state, child.children, i)))
            }
        </ol>
    }

    return <ul style={{fontSize: fontSize + 'px'}}>
        {child.children && 
            child.children.map((c: any, i:number) => serializeInternal(c, descState(state, child.children, i)))
        }
    </ul>
}

function serializeLink(child: any, state: SerializeState): React.ReactNode {
    const link = child.link as Link
    let url = ''
    if('url' in link){
        url = convertShorthandUrl(link.url)
    } else {
        // local link
        url = link.isHomePageLink ? '../home.html' : 
                '../' + state.idMap.get(link.pageId as string) + '/page.html'
    }
    return <a href={url}>
        {child.children && 
            child.children.map((c: any,i:number) => serializeInternal(c, descState(state, child.children, i)))
        }
    </a>
}

function serializeBlockQuote(child: any, state: SerializeState): React.ReactNode {
    return <blockquote>
        {child.children && 
            child.children.map((c: any, i:number) => serializeInternal(c, descState(state, child.children, i)))
        }
    </blockquote>
}

function serializeH2(child: any, state: SerializeState): React.ReactNode {
    const textAlign = 'textAlign' in child ? child.textAlign : 'left'
    return <h2 style={{
        fontFamily: 'Open Sans',
        textAlign: textAlign,
        color: '#53824A'
    }}>
        {child.children && 
            child.children.map((c: any, i: number) => serializeInternal(c, descState(state, child.children, i)))
        }
    </h2>
}

function serializeH1(child: any, state: SerializeState): React.ReactNode {
    const textAlign = 'textAlign' in child ? child.textAlign : 'left'
    return <h1 style={{
        fontFamily: 'Open Sans',
        textAlign: textAlign,
        maxWidth: state.inHeaderContainer ? 'calc(100% - 80px)' : ''
    }}>
        {child.children && 
            child.children.map((c: any, i: number) => serializeInternal(c, descState(state, child.children, i)))
        }
    </h1>
}

function getFontSize(el: any){
    // search children for fontSize property
    let maxFontSize = 0
    iterateChildrenRecursive(el, c => {
        if(c.fontSize){
            maxFontSize = Math.max(maxFontSize, fontMap(c.fontSize))
        }
    })
    if(maxFontSize === 0){
        maxFontSize = fontMap('medium')
    }
    return maxFontSize
}

function getLineHeight(el: any){
   return 'lineSpacing' in el ? el.lineSpacing : 1.5
}

function serializeParagraph(child: any, state: SerializeState): React.ReactNode {
    const textAlign = 'textAlign' in child ? child.textAlign : 'left'
    const lineHeight = getLineHeight(child)
    const fontSize = getFontSize(child)

    let marginTop = 0
    if(state.peerPrev && state.peerPrev.type === 'paragraph'){
        marginTop = getParElSpacing(
            getFontSize(state.peerPrev), getLineHeight(state.peerPrev),
            fontSize, lineHeight
        )
    } else if(state.peerPrev){
        marginTop = getParNonParSpacing(fontSize, lineHeight, state.peerPrev.type)
    }
    let marginBottom = 0
    if(state.peerNext && state.peerNext.type === 'paragraph'){
        marginBottom = getParElSpacing(
            fontSize, lineHeight,
            getFontSize(state.peerNext), getLineHeight(state.peerNext)
        )
    } else if(state.peerNext){
        marginBottom = getParNonParSpacing(fontSize, lineHeight, state.peerNext.type)
    }

    const isEmphasized = numberArrEq(state.path, getFirstNonEmptyRootParLoc(state.page).designLoc)

    return <p style={{
        textAlign: textAlign as any,
        fontSize: fontSize + 'px',
        lineHeight: lineHeight,
        marginTop: marginTop + 'px',
        marginBottom: marginBottom + 'px'
    }} className={isEmphasized ? 'emphasized-p' : ''}>
        {child.children && 
            child.children.map((c: any, i: number) => serializeInternal(c, descState(state, child.children, i)))
        }
    </p>
}

function iterateChildrenRecursive(parent: any, func: (child: any) => void){
    if(!parent.children){
        return
    }
    for(const c of parent.children){
        func(c)
        iterateChildrenRecursive(c, func)
    }
}

function serializeLeaf(child: any, state: SerializeState): React.ReactNode {
    // this is a leaf element, must match with RenderedLeaf.tsx
    if(child.bold){
        const c = {...child}
        delete c.bold
        return <strong>{serializeInternal(c, {...state, peerPrev: null, peerNext: null})}</strong>
    }
    if(child.italic){
        const c = {...child}
        delete c.italic 
        return <em>{serializeInternal(c, {...state, peerPrev: null, peerNext: null})}</em>
    }
    if(child.underline){
        const c = {...child}
        delete c.underline
        return <u>{serializeInternal(c, {...state, peerPrev: null, peerNext: null})}</u>
    }
    if(child.strikethrough){
        const c = {...child}
        delete c.strikethrough
        return <s>{serializeInternal(c, {...state, peerPrev: null, peerNext: null})}</s>
    }

    const fontSize = child.fontSize ? fontMap(child.fontSize) + 'px' : ''
    const emptyText = child.text.trim() === ''
    const font = child.font ? child.font : ''
    return <span style={{
        fontSize: fontSize,
        fontFamily: font,
        whiteSpace: 'pre-wrap',
    }}>{child.text === '' ? ' ' : child.text}</span>
}

function serializeHeaderContainer(container: any, state: SerializeState): React.ReactNode {
    if(container.hidden){
        return ''
    }
    return <div className="header-container" style={{
        backgroundColor: '#53824A', 
        color: 'white',
        paddingTop: '40px',
        paddingBottom: '40px',
        fontSize: '22px'
    }}>
        {container.children && 
            container.children.map(
                (c: any, i: number) => serializeInternal(c, {...descState(state, container.children, i), inHeaderContainer: true})
            )
        }
    </div>
}

function serializeContentContainer(container: any, state: SerializeState): React.ReactNode {
    return <div className="content-container" style={{
        maxWidth: '1125px',
        paddingTop: '5px'
    }}>
        {container.children && 
            container.children.map((c: any, i:number) => serializeInternal(c, descState(state, container.children, i)))
        }
    </div>
}