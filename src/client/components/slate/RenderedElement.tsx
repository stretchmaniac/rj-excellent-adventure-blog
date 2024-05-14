import { ReactEditor, RenderElementProps, useSlate } from "slate-react";
import './../../assets/stylesheets/slate/rendered-element.scss'
import './../../assets/stylesheets/slate/html-tag-styles/blockquote.scss'
import { Link } from "../../types/link";
import { MediaChild } from "../PageDesign";
import MediaChildBox from "./MediaChildBox";
import './../../assets/stylesheets/slate/media-child-box.scss'
import { Editor } from "slate";
import { MediaParent } from "./MediaParent";

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
    const headerStyle = {
        ...genericStyle,
        fontFamily: 'Open Sans'
    }
    if(t === 'h1'){
        return <h1 style={headerStyle} {...props.attributes}>{props.children}</h1>
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
    const lineHeight = ('lineSpacing' in el ? el.lineSpacing : 1.15) as Number
    const pStyle = {
        ...genericStyle,
        lineHeight: '' + lineHeight,
    }
    if(t == 'small'){
        return <p {...props.attributes} style={{...pStyle, fontSize: 'small'}}>
            {props.children}
        </p>
    }
    if(t == 'smaller'){
        return <p {...props.attributes} style={{...pStyle, fontSize: 'smaller'}}>
            {props.children}
        </p>
    }
    // default to <p>
    return <p style={pStyle} {...props.attributes}>
        {props.children}
    </p>
}