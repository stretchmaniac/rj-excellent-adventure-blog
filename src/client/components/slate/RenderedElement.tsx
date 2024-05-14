import { ReactEditor, RenderElementProps, useSlate } from "slate-react";
import './../../assets/stylesheets/slate/rendered-element.scss'
import './../../assets/stylesheets/slate/html-tag-styles/blockquote.scss'
import { Link } from "../../types/link";
import { MediaChild } from "../PageDesign";
import MediaChildBox from "./MediaChildBox";
import './../../assets/stylesheets/slate/media-child-box.scss'
import { Editor } from "slate";
import { MediaParent } from "./MediaParent";
import { fontMap } from "../../tools/font-size";

export default function RenderedElement(props: RenderElementProps) {
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
            parentPath={parentPath}>
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
        return <div contentEditable={false} 
            style={{
                width: '80%', 
                backgroundColor: '#25a186', 
                color: 'white', 
                paddingLeft: '10%', 
                paddingRight: '10%',
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
            style={{marginLeft: '10%', marginRight: '10%', maxWidth: '1125px', paddingTop: '5px'}}>
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
        if((el as any).listType === 'ol'){
            return <ol {...props.attributes}>{props.children}</ol>
        } else { // listType === 'ul'
            return <ul {...props.attributes}>{props.children}</ul>
        }
    }
    if(t === 'li'){
        return <li {...props.attributes}>{props.children}</li>
    }
    const lineHeight = ('lineSpacing' in el ? el.lineSpacing : 2) as Number
    // get maximum font size from children for line height calculations
    const matching = [...Editor.nodes(editor, {
        match: (n, p) => ('fontSize' in n),
        at: elPath
    })]
    let max = 0
    for(const match of matching){
        max = Math.max(max, fontMap((match[0] as any).fontSize))
    }
    if(max === 0){
        // default to standard size
        max = fontMap('medium')
    }
    const pStyle = {
        ...genericStyle,
        fontSize: max + 'px',
        lineHeight: '' + lineHeight,
    }
    // default to <p>
    return <p style={pStyle} {...props.attributes}>
        {props.children}
    </p>
}