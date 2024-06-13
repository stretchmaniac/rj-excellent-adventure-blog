import React from "react"
import { MediaChild, PannellumPackage } from "../PageDesign"
import { BiImageAdd } from "react-icons/bi"
import { TbColumnInsertLeft, TbColumnInsertRight } from "react-icons/tb";
import { MdDelete, MdErrorOutline, MdOutlineFileUpload, MdPushPin } from "react-icons/md";
import { ImEnlarge2, ImShrink2 } from "react-icons/im";
import { FaAngleLeft, FaAngleRight, FaParagraph, FaRegImage } from "react-icons/fa6";
import { PiSphere } from "react-icons/pi";
import { ReactEditor, RenderElementProps, useFocused, useSelected, useSlate } from "slate-react"
import './../../assets/stylesheets/slate/media-child-box.scss'
import { Editor, Path, Transforms } from "slate";
import { chooseFiles } from "../../tools/http";
import { Media, MediaType, dataURItoBlob, registerMedia } from "../../tools/media";
import 'pannellum/build/pannellum.css'
import 'pannellum'
import { WaitingPopup } from "../../Main";

export default function MediaChildBox(props: MediaChildProps) {
    const editor = useSlate()
    const selected = useSelected()
    const focused = useFocused()
    const pannellumContainerRef = React.createRef<HTMLDivElement>()
    const [pannellumSceneId, setPannellumSceneId] = React.useState('')
    const [pannellumPreviewDataUrl, setPannellumPreviewDataUrl] = React.useState('')
    const [pannellumViewParams, setPannellumViewParams] = React.useState<number[]>([])

    React.useEffect(() => {
        if(pannellumContainerRef.current && props.media.content?.type === MediaType.PHOTOSPHERE){
            const options = props.media.content.photosphereOptions
            let initPitch = 0
            let initYaw = 0
            if(options){
                initPitch = options.initialPitch
                initYaw = options.initialYaw
            }
            // register pannellum scene
            const id = crypto.randomUUID()
            const sceneObj: any = {}
            sceneObj[id] = {
                "type": "equirectangular",
                "panorama": props.media.content?.stableRelativePath,
                "autoLoad": true,
                "pitch": initPitch,
                "yaw": initYaw,
                "mouseZoom": false,
                "preview": ''
            }
            let viewer = props.pannellumPackage.viewer
            if(props.pannellumPackage.viewer === null && !props.pannellumPackage.viewerSetScheduled){
                props.pannellumPackage.viewerSetScheduled = true
                // attach pannellum div to pannellumContainer
                pannellumContainerRef.current.appendChild(props.pannellumPackage.div)
                // create new viewer
                viewer = (window as any).pannellum.viewer(props.pannellumPackage.div, {
                    "default": {
                        "firstScene": id,
                        "sceneFadeDuration": 0
                    }, 
                    "scenes": sceneObj
                })
                console.log('loading scene to new viewer', sceneObj, id)
                const parent = pannellumContainerRef.current
                viewer.on('load', () => {
                    // set global viewer
                    props.pannellumPackage.setViewer(viewer)
                })
            } else if(props.pannellumPackage.viewer !== null){
                props.pannellumPackage.viewer.addScene(id, sceneObj[id])
                console.log('loading scene to existing viewer', id)
                setPannellumViewParams([initPitch, initYaw, props.pannellumPackage.viewer.getHfov()])
                props.pannellumPackage.scheduleScreenshot(id, pannellumContainerRef.current).then(url => {
                    setPannellumPreviewDataUrl(url)
                })
            }
            setPannellumSceneId(id)

            return () => {
                if(viewer){
                    console.log('removing scene', id)
                    viewer.removeScene(id)
                }
            }
        }
    }, [props.media.content?.type, props.pannellumPackage.viewer])

    const showToolbar = selected && focused || props.media.content?.type === MediaType.PHOTOSPHERE
        || props.media.content?.type === MediaType.VIDEO

    return <div {...props.attributes}
                contentEditable={false}
                className={'media-child' +
                (props.media.content === null ? ' media-child-no-content ' + props.media.size : '') +
                (selected && focused ? ' media-child-selected' : '')}
                onMouseDown={e => {
                    if(ReactEditor.isFocused(editor)){
                        e.preventDefault()
                        e.stopPropagation()
                    }
                }}>
        {props.children}
        {props.media.content === null && <BiImageAdd className="missing-media-icon"/>}
        {props.media.content !== null && props.media.content.type === MediaType.IMAGE && <img
            className={props.media.size + '-box'}
            crossOrigin="anonymous"
            src={props.media.content.stableRelativePath}
            />}
        {props.media.content !== null && props.media.content.type === MediaType.PHOTOSPHERE && 
            <div style={{backgroundImage: `url('${pannellumPreviewDataUrl}')`, backgroundSize: 'cover'}}>
                <div className={props.media.size + '-pannellum'} ref={pannellumContainerRef}
                    onMouseDown={() => {
                        // detach pannellum div from current parent, add to this div,
                        // then load the scene we desire
                        if(pannellumContainerRef.current && pannellumContainerRef.current.children.length === 0 && 
                            props.pannellumPackage.viewer && props.pannellumPackage.queueEmpty){
                            const div = props.pannellumPackage.div
                            if(div.parentElement){
                                div.parentElement.removeChild(div)
                            }
                            pannellumContainerRef.current.appendChild(div)
                            const viewer = props.pannellumPackage.viewer
                            viewer.off('animatefinished')
                            viewer.resize()
                            const dragFix = div.querySelector('.pnlm-dragfix') as HTMLDivElement
                            dragFix.style.backgroundColor = 'black'
                            if(pannellumViewParams.length > 0){
                                const [pitch, yaw, hfov] = pannellumViewParams
                                viewer.loadScene(pannellumSceneId, 
                                    pitch,
                                    yaw,
                                    hfov
                                )
                            } else {
                                viewer.loadScene(pannellumSceneId)
                            }
                            viewer.on('load', () => dragFix.style.backgroundColor = '')
                            console.log('loading scene', pannellumSceneId)
                            viewer.resize()

                            viewer.on('animatefinished', (view: any) => {
                                const {pitch, yaw, hfov} = view
                                const dataUrl = viewer.getRenderer().render(
                                    pitch / 180.0 * Math.PI,
                                    yaw / 180.0 * Math.PI,
                                    hfov / 180.0 * Math.PI,
                                    {'returnImage': true}
                                )
                                setPannellumPreviewDataUrl(dataUrl)
                                setPannellumViewParams([pitch, yaw, hfov] as number[])
                            })
                        }
                    }}>
                </div>
            </div>
            }
        {props.media.content !== null && props.media.content.type === MediaType.VIDEO && <video
            controls
            className={props.media.size + '-box'}>
            <source src={props.media.content.stableRelativePath}/>
        </video>}
        {showToolbar && <div className='media-toolbar'>
            <button title='move left' className='media-tool-button' disabled={!hasLeft(props)}
                onClick={() => moveLeft(editor, props)}>
                <FaAngleLeft className='media-tool-icon-small'/>
            </button>
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
            <button title='move right' className='media-tool-button' disabled={!hasRight(props)}
                onClick={() => moveRight(editor, props)}>
                <FaAngleRight className='media-tool-icon-small'/>
            </button>
            <button title='delete' className='media-tool-button'
                onClick={(e) => deleteMedia(editor, props)}>
                <MdDelete className='media-tool-icon'/>
            </button>
            <button title='choose file' className='media-tool-button'
                onClick={() => chooseFile(editor, props)}>
                <MdOutlineFileUpload className='media-tool-icon'/>
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
        {showToolbar && <div className='media-toolbar-2nd-row'>
            <button title='extra small' 
                className={'media-tool-button' + (props.media.size === 'x-small' ? ' selected' : '')}
                onClick={() => resize('x-small', editor, props)}>
                <span className='media-tool-button-text'>XS</span>
            </button>
            <button title='small'
                className={'media-tool-button' + (props.media.size === 'small' ? ' selected' : '')}
                onClick={() => resize('small', editor, props)}>
                <span className='media-tool-button-text'>S</span>
            </button>
            <button title='medium'
                className={'media-tool-button' + (props.media.size === 'medium' ? ' selected' : '')}
                onClick={() => resize('medium', editor, props)}>
                <span className='media-tool-button-text'>M</span>
            </button>
            <button title='large'
                className={'media-tool-button' + (props.media.size === 'large' ? ' selected' : '')}
                onClick={() => resize('large', editor, props)}>
                <span className='media-tool-button-text'>L</span>
            </button>
            <button title='extra large'
                className={'media-tool-button' + (props.media.size === 'x-large' ? ' selected' : '')}
                onClick={() => resize('x-large', editor, props)}>
                <span className='media-tool-button-text'>XL</span>
            </button>
        </div>}
        {showToolbar && props.media.content !== null && 
            props.media.content.type !== MediaType.VIDEO && 
            <div className='media-toolbar-3rd-row'>
            <button title='image' 
                className={(props.media.content.type === MediaType.IMAGE ? 'selected ' : '') + 'media-tool-button'}
                onClick={() => changeMediaType(MediaType.IMAGE, editor, props)}>
                <FaRegImage className='media-tool-icon'/>
            </button>
            <button title='photosphere' 
                className={(props.media.content.type === MediaType.PHOTOSPHERE ? 'selected ' : '') + 'media-tool-button'}
                onClick={() => changeMediaType(MediaType.PHOTOSPHERE, editor, props)}>
                <PiSphere className='media-tool-icon'/>
            </button>
        </div>}
        {showToolbar && props.media.content?.type === MediaType.PHOTOSPHERE && <div className='media-toolbar-4th-row'>
            <button title='save current orientation as default'
                className='media-tool-button'
                onClick={() => {
                    setPhotospherePinLocation(
                        props.pannellumPackage.viewer.getPitch(), 
                        props.pannellumPackage.viewer.getYaw(), 
                        editor, props
                    )
                }}>
                <MdPushPin className='media-tool-icon'/>
            </button>
        </div>}
        {props.media.content?.type === MediaType.PHOTOSPHERE && !props.media.content?.hasCompressedPhotosphereFolder &&
            <div style={{position:'absolute', right:'5px', bottom: '5px'}}
                title='This image is not in a photosphere format. If you keep it, no compression or adaptive loading will be done; the full-resolution image will be copied to the blog.'>
                <MdErrorOutline className='error-icon media-tool-icon'/>
            </div>
        }
    </div>
}

function chooseFile(editor: Editor, props: MediaChildProps){
    props.setWaitingPopup({popupOpen: true, message: 'Please use system dialog to select file.'})
    chooseFiles(false).then(files => {
        props.setWaitingPopup({popupOpen: false, message: ''})
        if(files.length === 0){
            // no files chosen
            return
        }
        const chosenFileName = files[0]
        props.setWaitingPopup({popupOpen: true, message: 'Image loading...'})
        registerMedia(chosenFileName).then(media => {
            props.setWaitingPopup({popupOpen: false, message: ''})
            editContent(editor, props, media)
        })
    })
}

function editContent(editor: Editor, props: MediaChildProps, newContent: Media){
    const cArr: MediaChild[] = [...props.parentNode.children]
    cArr[props.mediaIndex] = {
        ...cArr[props.mediaIndex],
        content: newContent
    }
    replaceMediaChildren(editor, props, cArr)
}

function insert(editor: Editor, props: MediaChildProps, at: number){
    const newMChildren: Array<MediaChild> = [...props.parentNode.children]
    newMChildren.splice(at, 0, {
        content: null,
        size: props.media.size,
        type: 'media-child',
        children: [{text: ''}]
    })
    replaceMediaChildren(editor, props, newMChildren)
}

function replaceMediaChildren(editor: Editor, props: MediaChildProps, newChildren: any[]){
    editor.withoutNormalizing(() => {
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

        if(newChildren.length === 0 || newChildren.length == 1 && newChildren[0].type === 'media-parent-caption'){
            // remove the parent node entirely
            Transforms.removeNodes(editor, {
                at: props.parentPath
            })
        } else {
            Transforms.insertNodes(editor, newChildren, {
                at: [...props.parentPath, 0]
            })
        }
    })
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

function leftHasCaption(props: MediaChildProps){
    const cArr = props.parentNode.children
    return 0 <= props.mediaIndex - 1 && 
        cArr[props.mediaIndex - 1].type === 'media-child-caption'
}

function rightHasCaption(props: MediaChildProps){
    const cArr = props.parentNode.children
    const w = props.mediaIndex + (hasCaption(props) ? 2 : 1)
    return w >= cArr.length - 1 ? false :
        cArr[w + 1].type === 'media-child-caption'
}

function hasParentCaption(props: MediaChildProps){
    const cArr = props.parentNode.children
    return cArr.length > 0 && cArr[cArr.length - 1].type === 'media-parent-caption'
}

function hasLeft(props: MediaChildProps){
    return props.mediaIndex != 0
}

function hasRight(props: MediaChildProps){
    const rel = props.mediaIndex + (hasCaption(props) ? 1 : 0)
    return rel < props.parentNode.children.length - (hasParentCaption(props) ? 2 : 1)
}

function moveRight(editor: Editor, props: MediaChildProps){
    const newMChildren: Array<MediaChild> = [...props.parentNode.children]
    const removed = newMChildren.splice(props.mediaIndex, 1 + (hasCaption(props) ? 1 : 0))
    const insertLoc = props.mediaIndex + (rightHasCaption(props) ? 2 : 1)
    newMChildren.splice(insertLoc, 0, ...removed)
    replaceMediaChildren(editor, props, newMChildren)
    Transforms.select(editor, [...props.parentPath, insertLoc])
}

function moveLeft(editor: Editor, props: MediaChildProps){
    const newMChildren: Array<MediaChild> = [...props.parentNode.children]
    const removed = newMChildren.splice(props.mediaIndex, 1 + (hasCaption(props) ? 1 : 0))
    const insertLoc = props.mediaIndex - (leftHasCaption(props) ? 2 : 1)
    newMChildren.splice(insertLoc, 0, ...removed)
    replaceMediaChildren(editor, props, newMChildren)
    Transforms.select(editor, [...props.parentPath, insertLoc])
}

function insertRight(editor: Editor, props: MediaChildProps) {
    insert(editor, props, props.mediaIndex + (hasCaption(props) ? 2 : 1))
    Transforms.select(editor, [...props.parentPath, props.mediaIndex])
}

function deleteMedia(editor: Editor, props: MediaChildProps) {
    const newMChildren: Array<MediaChild> = [...props.parentNode.children]
    newMChildren.splice(props.mediaIndex, 1 + (hasCaption(props) ? 1 : 0))
    replaceMediaChildren(editor, props, newMChildren)
}

function resize(newSize: string, editor: Editor, props: MediaChildProps){
    Transforms.setNodes(editor, {size: newSize} as Partial<Node>, {
        at: [...props.parentPath, props.mediaIndex]
    })
}

function changeMediaType(newType: MediaType, editor: Editor, props: MediaChildProps){
    Transforms.setNodes(editor, {content: {...props.media.content, type: newType}} as Partial<Node>, {
        at: [...props.parentPath, props.mediaIndex]
    })
}

function setPhotospherePinLocation(pitch: number, yaw: number, editor: Editor, props: MediaChildProps){
    Transforms.setNodes(editor, 
        {content: {...props.media.content, photosphereOptions: {initialPitch: pitch, initialYaw: yaw}}} as Partial<Node>, 
        { at: [...props.parentPath, props.mediaIndex] }
    )
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
                children: [{text: 'Caption', fontSize: 'small', italic: true}]
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
                children: [{text: 'caption', fontSize: 'small', italic: true}]
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
    pannellumPackage: PannellumPackage
    children: React.ReactNode
    setWaitingPopup: (popup: WaitingPopup) => void
}