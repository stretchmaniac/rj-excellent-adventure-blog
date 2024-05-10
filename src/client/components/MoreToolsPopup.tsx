import './../assets/stylesheets/new-page-popup.scss'
import './../assets/stylesheets/popup-common.scss'
import './../assets/stylesheets/form-common.scss'
import { chooseFiles, cleanupMedia, copyResource } from '../tools/http'
import { getAllReferencedMediaNames } from '../tools/empty-page'
import { Page } from '../types/PageType'
import React from 'react'
import { FaRegCircleCheck } from "react-icons/fa6";

export function MoreToolsPopup(props: MoreToolsPopupProps) {
    const [tidyMediaFinished, setTidyMediaFinished] = React.useState(false)
    const [imgUpdate, setImgUpdate] = React.useState(0)
    return <div className='popup-fullscreen'>
            <div className='popup-root'>
                <div className='popup-header'>
                    More Tools and Settings
                </div>
                <div className='popup-content'>
                    <div className='input-row'>
                        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                            <button style={{marginBottom: 0}} onClick={() => {
                                    cleanupMedia(getAllReferencedMediaNames(props.pages)).then(() => {
                                        setTidyMediaFinished(true)
                                    })
                                }}
                                disabled={tidyMediaFinished}>
                                Tidy media folder
                            </button>
                            {tidyMediaFinished && <FaRegCircleCheck style={{color: 'green', marginLeft: '5px'}}/>}
                        </div>
                        
                    </div>
                    <div className='input-row'>
                        <button onClick={() => {
                            chooseFiles(false).then(files => {
                                if(files.length === 0){
                                    return
                                }
                                copyResource(files[0], 'fixed-assets', 'header', true).then(() => {
                                    setImgUpdate(imgUpdate + 1)
                                })
                            })
                        }}>Choose header image (must be .jpg)</button>
                        <img src={"http://localhost:3000/fixed-assets/header.jpg?t=" + imgUpdate}/>
                    </div>
                </div>
                <div className='popup-buttons'>
                    <button 
                        onClick={() => props.close()}
                        className='popup-button popup-cancel'>Close</button>
                </div>
            </div>
        </div>
}

export type MoreToolsPopupProps = {
    close: () => void
    pages: Page[]
}