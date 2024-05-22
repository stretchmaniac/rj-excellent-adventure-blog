import './../assets/stylesheets/popup-common.scss'
import './../assets/stylesheets/form-common.scss'
import React from 'react'
import { BloggerImportResult, importBlogger } from '../tools/import'
import { Page } from '../types/PageType'
import { cacheImageSearchFolders } from '../tools/http'
import { Media } from '../tools/media'

export function ImportPopup(props: ImportPopupProps){
    const [html, setHtml] = React.useState('')
    const [parseFailed, setParseFailed] = React.useState(false)
    const [importMediaFinishedCount, setImportMediaFinishedCount] = React.useState(0)
    const [importMediaFailedCount, setImportMediaFailedCount] = React.useState(0)
    const [importMediaCount, setImportMediaCount] = React.useState(0)
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
                            rows={20}
                            cols={30}
                            className="short-multiline-textarea"
                            value={html} 
                            onChange={e => setHtml(e.target.value)}/>
                    </div>
                    <div className='input-row'>
                        <span className='input-label'>Image Search Folders (one location per line)</span>
                        <textarea
                            rows={5}
                            cols={30}
                            className='short-multiline-textarea'
                            value={props.importSearchPaths}
                            onChange={e => props.setImportSearchPaths(e.target.value)}
                        />
                    </div>
                    {importMediaCount !== 0 &&
                        <span>{`${importMediaFinishedCount} / ${importMediaCount} images processed (${importMediaFailedCount} failed)`}</span>
                    }
                </div>
                <div className='popup-buttons'>
                    <button 
                        onClick={() => props.onComplete(true, null)}
                        className='popup-button popup-cancel'>Cancel</button>
                    <button 
                        onClick={() => {
                            const searchFolders = props.importSearchPaths.split('\n').map(s => s.trim())
                            cacheImageSearchFolders(searchFolders).then(() => {
                                const importRes = importBlogger(props.existingPage, html)
                                if(importRes === null){
                                    setParseFailed(true)
                                } else {
                                    setImportMediaCount(countMedia(importRes))
                                    const allPromises: Promise<Media|null>[] = []
                                    let finishCount = 0
                                    let failedCount = 0
                                    // replace all promises with results of promise
                                    enumerateMediaChildren(importRes.design, child => {
                                        allPromises.push(child.content)
                                        child.content.then((result: Media | null) => {
                                            child.content = result
                                            finishCount++
                                            if(result === null){
                                                failedCount++
                                            }
                                            setImportMediaFinishedCount(finishCount)
                                            setImportMediaFailedCount(failedCount)
                                        })
                                    })
                                    let summaryImgResult: Media | null = null 
                                    importRes.summaryImg.then(res => {
                                        summaryImgResult = res
                                        finishCount++
                                        if(res === null){
                                            failedCount++
                                        }
                                        setImportMediaFinishedCount(finishCount)
                                        setImportMediaFailedCount(failedCount)
                                    })
                                    allPromises.push(importRes.summaryImg)
                                    // wait for media to finish loading, then callback
                                    Promise.all(allPromises).then(() => {
                                        const p: Page = {
                                            ...props.existingPage,
                                            design: importRes.design,
                                            autoSummaryImg: importRes.autoSummaryImg,
                                            summaryImg: summaryImgResult
                                        }
                                        props.onComplete(false, p)
                                    })
                                }
                            })
                        }}
                        className='popup-button popup-continue'>Import</button>
                </div>
            </div>
        </div>
}

function countMedia(result: BloggerImportResult): number {
    let count = 0
    if(!result.autoSummaryImg){
        count++
    }
    enumerateMediaChildren(result.design, () => count++)
    return count
}

function enumerateMediaChildren(design: any[], processor: (mediaChild: any) => void){
    for(let node of design){
        if(node?.type === 'media-child'){
            processor(node)
        }
        if(node.children){
            enumerateMediaChildren(node.children, processor)
        }
    }
}

export type ImportPopupProps = {
    existingPage: Page
    onComplete: (cancelled: boolean, resultPage: Page | null) => void
    importSearchPaths: string
    setImportSearchPaths: (paths: string) => void
}