import { FaWrench } from 'react-icons/fa6';
import { WaitingPopup } from '../Main';
import { chooseFolder, cleanupMedia } from '../tools/http';
import { BlogConfig } from '../types/blog-config'
import './../assets/stylesheets/header.scss'
import { MdErrorOutline } from "react-icons/md";
import React from 'react';
import { Page } from '../types/PageType';
import { getAllReferencedMediaNames } from '../tools/empty-page';

export function Header(props: HeaderProps) {
    const [toolsMenuOpen, setToolsMenuOpen] = React.useState(false)
    const [cleanupFinished, setCleanupFinished] = React.useState(false)

    React.useEffect(() => {
        setCleanupFinished(false)
    }, [toolsMenuOpen])

    const saveFolderFound = props.config.localSaveFolder !== null
    const menuRef = React.createRef<HTMLDivElement>()
    return <div className='header-root'>
        <span className='header-title'>Rick and Julie's Excellent Blog Tool</span>
        <div className='header-option-block'>
            <button className='header-button'
                onClick={() => chooseMirrorFolder(props)}>
                {saveFolderFound && <div className='header-button-span'>
                    {props.config.localSaveFolder}
                </div>}
                {!saveFolderFound && <div className='header-button-span'>
                    Set local mirror folder
                    <MdErrorOutline className='error-icon'/>
                </div>}
            </button>
            <div className='div-divider'></div>
            <button className={'header-button header-icon-button' + 
                (toolsMenuOpen ? ' header-button-selected' : '')}
                title='more tools'
                onClick={() => {
                    if(!toolsMenuOpen){
                        menuRef.current?.focus()
                        setToolsMenuOpen(true)
                    }
                }}>
                <FaWrench />
            </button>
            <div ref={menuRef} className={'tools-menu-root' + (!toolsMenuOpen ? ' gone' : '')} 
                tabIndex={-1}
                onBlur={() => setToolsMenuOpen(false)}>
                <div className='tool-menu-row'>
                    <button className='header-button tool-menu-option'
                        onMouseDown={e => {
                            e.stopPropagation()
                            e.preventDefault()
                        }}
                        onClick={() => {
                            cleanupMedia(getAllReferencedMediaNames(props.pages)).then(() => {
                                setCleanupFinished(true)
                            })
                        }}
                    >{'Tidy media folder' + (cleanupFinished ? ' (Completed)' : '')}</button>
                </div>
            </div>
        </div>
    </div>
}

function chooseMirrorFolder(props: HeaderProps){
    props.setWaitingPopup({
        popupOpen: true,
        message: 'Please use system dialog to select folder.'
    })
    chooseFolder().then(folder => {
        props.setWaitingPopup({popupOpen: false, message: ''})
        if(folder.trim().length === 0){
            // we cancelled the folder selection
            return
        }
        if(props.config.localSaveFolder === null){
            // the only chance we'd have unsaved data is if we haven't set a 
            // mirror folder already AND we've added pages. The added pages 
            // logic is in props.showUnsavedLoadPopup
            props.showUnsavedLoadPopup(result => {
                props.setConfig({
                    ...props.config,
                    localSaveFolder: folder
                }, result)
            })
        } else {
            props.setConfig({
                ...props.config,
                localSaveFolder: folder
            }, 'load')
        }
    })
}

export type HeaderProps = {
    showUnsavedLoadPopup: (callback: (choice:string) => void) => void
    setWaitingPopup: (popup: WaitingPopup) => void
    config: BlogConfig
    setConfig: (c: BlogConfig, mergeBehavior: string) => void
    pages: Page[]
}