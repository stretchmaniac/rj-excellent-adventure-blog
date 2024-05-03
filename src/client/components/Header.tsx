import { chooseFolder } from '../tools/http';
import { BlogConfig } from '../types/blog-config'
import './../assets/stylesheets/header.scss'
import { MdErrorOutline } from "react-icons/md";

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
        </div>
    </div>
}

function chooseMirrorFolder(props: HeaderProps){
    chooseFolder().then(folder => {
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
    config: BlogConfig
    setConfig: (c: BlogConfig, mergeBehavior: string) => void
}