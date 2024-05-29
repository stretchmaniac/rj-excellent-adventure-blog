import { FaWrench } from 'react-icons/fa6';
import { WaitingPopup } from '../Main';
import { chooseFolder } from '../tools/http';
import { BlogConfig } from '../types/blog-config'
import './../assets/stylesheets/header.scss'
import { MdErrorOutline, MdPublish } from "react-icons/md";
import { Page } from '../types/PageType';

export function Header(props: HeaderProps) {

    const saveFolderFound = props.config.localSaveFolder !== null
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
            <button className='header-button header-icon-button'
                title='more tools'
                onClick={() => props.showMoreToolsPopup()}>
                <FaWrench />
            </button>
            <div className='div-divider'></div>
            <button className='header-button header-icon-button'
                style={{padding: '0px 2px 0px 2px'}}
                title='open publish dialog'
                onClick={props.setPublishPopupOpen}>
                <MdPublish style={{width:'20px',height:'20px'}}/>
            </button>
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
    setPublishPopupOpen: () => void
    showMoreToolsPopup: () => void
    config: BlogConfig
    setConfig: (c: BlogConfig, mergeBehavior: string) => void
    pages: Page[]
}