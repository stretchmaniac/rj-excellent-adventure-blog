import React from "react"
import { MediaChild } from "../PageDesign"
import { BiImageAdd } from "react-icons/bi"
import { TbColumnInsertLeft, TbColumnInsertRight } from "react-icons/tb";
import { MdDelete, MdOutlineFileUpload } from "react-icons/md";
import { ImEnlarge2, ImShrink2 } from "react-icons/im";
import { FaParagraph } from "react-icons/fa6";
import { RenderElementProps, useFocused, useSelected, useSlate } from "slate-react"
import './../../assets/stylesheets/slate/media-child-box.scss'
import { Editor, Path, Transforms } from "slate";

export default function MediaChildBox(props: MediaChildProps) {
    const editor = useSlate()
    const selected = useSelected()
    const focused = useFocused()
    return <div {...props.attributes}
                contentEditable={false}
                className={'media-child ' + props.media.size + 
                (selected && focused ? ' media-child-selected' : '')}
                onMouseDown={e => {
                    e.preventDefault()
                    e.stopPropagation()
                }}>
        {props.children}
        {props.media.mediaType === '' && <BiImageAdd className="missing-media-icon"/>}
        {selected && focused && <div className='media-toolbar'>
            <button title='add left' className='media-tool-button'
                onClick={(e) => {
                    insertLeft(editor, props)
                }}>
                <TbColumnInsertLeft className='media-tool-icon'/>
            </button>
            <button title='add right' className='media-tool-button'
                onClick={(e) => {
                    insertRight(editor, props)
                    e.stopPropagation()
                }}>
                <TbColumnInsertRight className='media-tool-icon'/>
            </button>
            <button title='delete' className='media-tool-button'
                onClick={(e) => deleteMedia(editor, props)}>
                <MdDelete className='media-tool-icon'/>
            </button>
            <button title='choose file' className='media-tool-button'>
                <MdOutlineFileUpload className='media-tool-icon'/>
            </button>
            <button title='bigger' className='media-tool-button'
                onClick={(e) => resize(props.media.size === 'small' ? 'medium' : 'large',
                    editor, props
                )}
                disabled={props.media.size === 'large'}>
                <ImEnlarge2 className='media-tool-icon-small' />
            </button>
            <button title='smaller' className='media-tool-button'
                onClick={(e) => resize(props.media.size === 'large' ? 'medium' : 'small',
                    editor, props
                )}
                disabled={props.media.size === 'small'}>
                <ImShrink2 className='media-tool-icon-small' />
            </button>
            <button title='caption' 
                className={(hasCaption(props) ? 'selected ': '') + 'media-tool-button'}
                onClick={() => {
                    toggleCaption(editor, props, !hasCaption(props))
                }}>
                <FaParagraph className='media-tool-icon-small'/>
            </button>
            <button title='parent caption'
                className={(hasParentCaption(props) ? 'selected ' : '') + 'media-tool-button'}
                onClick={() => {
                    toggleParentCaption(editor, props, !hasParentCaption(props))
                }}>
                <FaParagraph className='media-tool-icon'/>
            </button>
        </div>}
    </div>
}

function insert(editor: Editor, props: MediaChildProps, at: number){
    const newMChildren: Array<MediaChild> = [...props.parentNode.children]
    newMChildren.splice(at, 0, {
        mediaType: '',
        size: props.media.size,
        type: 'media-child',
        children: [{text: ''}]
    })
    replaceMediaChildren(editor, props, newMChildren)
}

function replaceMediaChildren(editor: Editor, props: MediaChildProps, newChildren: any[]){
    Transforms.removeNodes(editor, {
        at: [],
        match: (n, p) => p.length > 0 && Path.equals(Editor.parent(editor, p)[1], props.parentPath)
    })
    // this copy operation is very important!
    // slate will only re-render nodes that are updated. 
    // Since all the images/captions are passed into each MediaChildBox, 
    // we must trigger a re-render of every child whenever any child changes.
    // While we removed all the child nodes above, this was apparently not enough
    // to signal to slate that it should re-render each identical child mounted 
    // in the insertNodes below. Copying each child does the trick, however.
    for(let i = 0; i < newChildren.length; i++){
        newChildren[i] = {...newChildren[i]}
    }

    if(newChildren.length === 0){
        // remove the parent node entirely
        Transforms.removeNodes(editor, {
            at: props.parentPath
        })
    } else {
        Transforms.insertNodes(editor, newChildren, {
            at: [...props.parentPath, 0]
        })
    }
}

function insertLeft(editor: Editor, props: MediaChildProps) {
    insert(editor, props, props.mediaIndex)
    Transforms.select(editor, [...props.parentPath, props.mediaIndex + 1])
}

function hasCaption(props: MediaChildProps){
    const cArr = props.parentNode.children
    return cArr.length > props.mediaIndex + 1 && 
        cArr[props.mediaIndex + 1].type === 'media-child-caption'
}

function hasParentCaption(props: MediaChildProps){
    const cArr = props.parentNode.children
    return cArr.length > 0 && cArr[cArr.length - 1].type === 'media-parent-caption'
}

function insertRight(editor: Editor, props: MediaChildProps) {
    insert(editor, props, props.mediaIndex + (hasCaption(props) ? 2 : 1))
    Transforms.select(editor, [...props.parentPath, props.mediaIndex])
}

function deleteMedia(editor: Editor, props: MediaChildProps) {
    const newMChildren: Array<MediaChild> = [...props.parentNode.children]
    newMChildren.splice(props.mediaIndex, 1)
    replaceMediaChildren(editor, props, newMChildren)
}

function resize(newSize: string, editor: Editor, props: MediaChildProps){
    Transforms.setNodes(editor, {size: newSize} as Partial<Node>, {
        at: [...props.parentPath, props.mediaIndex]
    })
}

function toggleParentCaption(editor: Editor, props: MediaChildProps, enabled: boolean){
    const newChildren = [...props.parentNode.children]
    if(!enabled){
        // remove caption
        newChildren.splice(newChildren.length - 1, 1)
    } else {
        // add caption
        newChildren.push({
            type: 'media-parent-caption',
            children: [{
                type: 'paragraph',
                textAlign: 'center',
                children: [{text: 'parent caption text', fontSize: 'small', italic: true}]
            }]
        })
    }
    replaceMediaChildren(editor, props, newChildren)
    if(!enabled){
        // keep this child selected
        Transforms.select(editor, [...props.parentPath, props.mediaIndex])
    } else {
        // select parent caption
        Transforms.select(editor, [...props.parentPath, newChildren.length - 1])
    }
}

function toggleCaption(editor: Editor, props: MediaChildProps, enabled: boolean){
    const newChildren = [...props.parentNode.children]
    if(!enabled){
        // remove caption
        newChildren.splice(props.mediaIndex + 1, 1)
    } else {
        // add caption
        newChildren.splice(props.mediaIndex + 1, 0, {
            type: 'media-child-caption',
            children: [{
                type: 'paragraph',
                textAlign: 'center',
                children: [{text: 'caption text', fontSize: 'small', italic: true}]
            }]
        })
    }
    replaceMediaChildren(editor, props, newChildren)
    // select media child node if caption is going away, otherwise the caption text
    if(!enabled){
        Transforms.select(editor, [...props.parentPath, props.mediaIndex])
    } else {
        Transforms.select(editor, [...props.parentPath, props.mediaIndex + 1])
    }
}

export type MediaChildProps = {
    attributes: any
    media: MediaChild
    mediaIndex: number
    parentNode: any
    parentPath: Path
    children: React.ReactNode
}