import React from "react"
import { MediaChild } from "../PageDesign"
import { BiImageAdd } from "react-icons/bi"
import { TbColumnInsertLeft, TbColumnInsertRight } from "react-icons/tb";
import { MdDelete, MdOutlineFileUpload } from "react-icons/md";
import { ImEnlarge2, ImShrink2 } from "react-icons/im";
import { FaParagraph } from "react-icons/fa6";
import { RenderElementProps, useFocused, useSelected, useSlateStatic } from "slate-react"
import './../../assets/stylesheets/slate/media-child-box.scss'
import { Editor, Path, Transforms } from "slate";

export default function MediaChildBox(props: MediaChildProps) {
    const editor = useSlateStatic()
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
            <button title='caption' className='media-tool-button'
                >
                <FaParagraph className='media-tool-icon-small'/>
            </button>
        </div>}
    </div>
}

function insert(editor: Editor, props: MediaChildProps, at: number){
    const newMChildren: Array<MediaChild> = [...props.parentNode.children]
    newMChildren.splice(at, 0, {
        mediaType: '',
        size: props.media.size,
        caption: '',
        type: 'media-child',
        children: [{text: ''}]
    })
    Transforms.removeNodes(editor, {
        at: [],
        match: (n, p) => p.length > 0 && Path.equals(Editor.parent(editor, p)[1], props.parentPath)
    })
    Transforms.insertNodes(editor, newMChildren as any, {
        at: [...props.parentPath, 0]
    })
}

function insertLeft(editor: Editor, props: MediaChildProps) {
    insert(editor, props, props.mediaIndex)
    Transforms.select(editor, [...props.parentPath, props.mediaIndex + 1])
}

function insertRight(editor: Editor, props: MediaChildProps) {
    insert(editor, props, props.mediaIndex + 1)
    Transforms.select(editor, [...props.parentPath, props.mediaIndex])
}

function deleteMedia(editor: Editor, props: MediaChildProps) {
    const newMChildren: Array<MediaChild> = [...props.parentNode.children]
    newMChildren.splice(props.mediaIndex, 1)
    Transforms.removeNodes(editor, {
        at: [],
        match: (n, p) => p.length > 0 && Path.equals(Editor.parent(editor, p)[1], props.parentPath)
    })
    Transforms.insertNodes(editor, newMChildren as any, {
        at: [...props.parentPath, 0]
    })
}

function resize(newSize: string, editor: Editor, props: MediaChildProps){
    Transforms.setNodes(editor, {size: newSize} as Partial<Node>, {
        at: [...props.parentPath, props.mediaIndex]
    })
}

export type MediaChildProps = {
    attributes: any
    media: MediaChild
    mediaIndex: number
    parentNode: any
    parentPath: Path
    children: React.ReactNode
}