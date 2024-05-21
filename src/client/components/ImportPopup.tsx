import './../assets/stylesheets/popup-common.scss'
import './../assets/stylesheets/form-common.scss'
import React from 'react'
import { importBlogger } from '../tools/import'
import { Page } from '../types/PageType'

export function ImportPopup(props: ImportPopupProps){
    const [html, setHtml] = React.useState('')
    const [parseFailed, setParseFailed] = React.useState(false)
    return <div className='popup-fullscreen'>
            <div className='popup-root'>
                <div className='popup-header'>
                    Import from Blogger
                </div>
                <div className='popup-content'>
                    {parseFailed && <div className='input-row'>
                        <span className='input-label' style={{color: 'red'}}>Parse failed!</span>
                    </div>}
                    <div className='input-row'>
                        <span className="input-label">Blogger HTML</span>
                        <textarea 
                            rows={2}
                            cols={30}
                            className="short-multiline-textarea"
                            value={html} 
                            onChange={e => setHtml(e.target.value)}/>
                    </div>
                </div>
                <div className='popup-buttons'>
                    <button 
                        onClick={() => props.onComplete(true, null)}
                        className='popup-button popup-cancel'>Cancel</button>
                    <button 
                        onClick={() => {
                            const importRes = importBlogger(props.existingPage, html)
                            if(importRes === null){
                                setParseFailed(true)
                            } else {
                                props.onComplete(false, importRes)
                            }
                        }}
                        className='popup-button popup-continue'>Import</button>
                </div>
            </div>
        </div>
}

export type ImportPopupProps = {
    existingPage: Page
    onComplete: (cancelled: boolean, resultPage: Page | null) => void
}