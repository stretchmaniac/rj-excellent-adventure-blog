import { ReactEditor, RenderElementProps, useSlate } from "slate-react";
import './../../assets/stylesheets/slate/html-tag-styles/blockquote.scss'
import { Link } from "../../types/link";
import { MediaChild, getNodeAtPath } from "../PageDesign";
import MediaChildBox from "./MediaChildBox";
import './../../assets/stylesheets/slate/media-child-box.scss'
import { Editor, Node } from "slate";
import { MediaParent } from "./MediaParent";
import { fontMap } from "../../tools/font-size";
import { WaitingPopup } from "../../Main";
import { getParElSpacing, getParNonParSpacing } from "../../tools/paragraph-spacing";
import '../../assets/stylesheets/slate/misc-post.scss'
import { numberArrEq } from "../../tools/misc";

export type CustomRenderedElementProps = {
    usualProps: RenderElementProps,
    setWaitingPopup: (popup: WaitingPopup) => void
    targetEmphasizedPPath: number[] | null
}

export default function RenderedElement(bigProps: CustomRenderedElementProps) {
    const props = bigProps.usualProps
    const el = props.element
    const t = (el as any).type
    const editor = useSlate()
    const elPath = ReactEditor.findPath(editor, el)

    if(t === 'media-parent'){
        return <MediaParent {...props} />
    }
    if(t === 'media-child'){
        const [parent, parentPath] = Editor.parent(editor, elPath)
        return <MediaChildBox
            attributes={props.attributes}
            media={el as MediaChild}
            mediaIndex={elPath[elPath.length - 1]}
            parentNode={parent}
            parentPath={parentPath}
            setWaitingPopup={bigProps.setWaitingPopup}>
            {props.children}
        </MediaChildBox>
    }
    if(t === 'media-child-caption' || t === 'media-parent-caption'){
        return <div {...props.attributes}>
            {props.children}
        </div>
    }

    const textAlign = ('textAlign' in el ? el.textAlign : 'left') as string
    const genericStyle = {
        // jump through hoops to get typescript to accept our types...
        textAlign: textAlign === 'left' ? 'left' as const :
            (textAlign === 'center' ? 'center' as const : 'right' as const)
    }
    const headerStyle: any = {
        ...genericStyle,
        fontFamily: 'Open Sans'
    }
    if(t === 'header-container'){
        if((el as any).hidden){
            return <div style={{display: 'none'}} {...props.attributes}>{...props.children}</div>
        }
        return <div
            className='header-container'
            style={{
                backgroundColor: '#25a186', 
                color: 'white', 
                paddingTop: '40px',
                paddingBottom: '40px',
                fontSize: '30px'
            }} 
            {...props.attributes}>{props.children}</div>
    }
    if(t === 'h1'){
        if(elPath.length > 0 && elPath[0] === 0){
            headerStyle.maxWidth = 'calc(100% - 80px)'
        }
        return <h1 style={headerStyle} {...props.attributes}>{props.children}</h1>
    }
    if(t === 'content-container'){
        return <div {...props.attributes}
            className='content-container'
            style={{maxWidth: '1125px', paddingTop: '5px'}}>
            {props.children}
        </div>
    }
    if(t == 'h2'){
        return <h2 style={headerStyle} {...props.attributes}>{props.children}</h2>
    }
    if(t === 'a'){
        const link = (el as any).link as Link
        const href = 'url' in link ? link.url : '#'
        return <a href={href} {...props.attributes}>{props.children}</a>
    }
    if(t === 'blockquote'){
        return <blockquote {...props.attributes}>{props.children}</blockquote>
    }
    if(t === 'list'){
        const fontSize = getFontSize(editor, elPath)
        if((el as any).listType === 'ol'){
            return <ol style={{fontSize: fontSize}} {...props.attributes}>{props.children}</ol>
        } else { // listType === 'ul'
            return <ul style={{fontSize: fontSize}} {...props.attributes}>{props.children}</ul>
        }
    }
    if(t === 'li'){
        return <li {...props.attributes}>{props.children}</li>
    }
    const lineHeight = getLineHeight(el)
    const fontSize = getFontSize(editor, elPath)

    const priorPath = [...elPath]
    priorPath[priorPath.length - 1]--
    const priorNode = getNodeAtPath(editor, priorPath)
    const afterPath = [...elPath]
    afterPath[afterPath.length - 1]++
    const afterNode = getNodeAtPath(editor, afterPath)
    let marginTop = 0
    if(priorNode && priorNode.type === 'paragraph'){
        marginTop = getParElSpacing(
            getFontSize(editor, priorPath), getLineHeight(priorNode),
            fontSize, lineHeight
        )
    } else if(priorNode){
        marginTop = getParNonParSpacing(fontSize, lineHeight, priorNode.type)
    }
    let marginBottom = 0
    if(afterNode && afterNode.type === 'paragraph'){
        marginBottom = getParElSpacing(
            fontSize, lineHeight,
            getFontSize(editor, afterPath), getLineHeight(afterNode)
        )
    } else if(afterNode){
        marginBottom = getParNonParSpacing(fontSize, lineHeight, afterNode.type)
    }

    const pStyle = {
        ...genericStyle,
        fontSize: fontSize + 'px',
        lineHeight: '' + lineHeight,
        marginTop: marginTop,
        marginBottom: marginBottom
    }
    // default to <p>
    return <p style={pStyle} className={
        numberArrEq(elPath, bigProps.targetEmphasizedPPath) ? 'emphasized-p' : ''
        } {...props.attributes}>
        {props.children}
    </p>
}

function getFontSize(editor: Editor, pElPath: number[]){
    // get maximum font size from children for line height calculations
    const matching = [...Editor.nodes(editor, {
        match: (n, p) => ('fontSize' in n),
        at: pElPath
    })]
    let max = 0
    for(const match of matching){
        max = Math.max(max, fontMap((match[0] as any).fontSize))
    }
    if(max === 0){
        // default to standard size
        max = fontMap('medium')
    }
    return max
}

function getLineHeight(pEl: any){
    return ('lineSpacing' in pEl ? pEl.lineSpacing : 1.5) as number
}