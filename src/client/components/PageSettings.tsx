import { getDateInputStr } from '../tools/date'
import { Page } from '../types/PageType'
import './../assets/stylesheets/page-settings.scss'
import './../assets/stylesheets/form-common.scss'
import React from 'react'
import { chooseFiles } from '../tools/http'
import { Media, registerMedia, ReimportImageResult, reimportImages } from '../tools/media'
import { IoIosWarning } from "react-icons/io";
import { getSummaryImg, getSummaryText } from '../tools/empty-page'
import { BiImport } from 'react-icons/bi'
import { ImportPopup } from '../Main'
import { VscDebugRestart } from 'react-icons/vsc'
import { FaRegCircleCheck } from 'react-icons/fa6'

export default function PageSettings(props: PageSettingsProps) {
    let dateStr = ''
    const date = props.page.date
    dateStr = getDateInputStr(date)

    type ReimportState = {
        pending: boolean, 
        totalToProcess: number,
        totalProcessed: number,
        failures: string[],
        completed: boolean
    }
    const [reimportState, setReimportState] = React.useState<ReimportState>({
        pending: false,
        completed: false,
        totalToProcess: 0,
        totalProcessed: 0,
        failures: []
    })

    return <div className='page-settings-root'>
        <div className='input-row-checkbox'>
            <input type="checkbox" checked={!props.page.isBlogPost}
                onChange={e => props.editPage({...props.page, isBlogPost: !e.target.checked})}
                />
            <span className='input-label-checkbox'>
                Static page (unchecked is blog post)
            </span>
        </div>
        {!props.page.isBlogPost && <div className='input-row-checkbox'>
            <input type="checkbox" checked={props.page.linkedFromHeader}
                onChange={e => props.editPage({...props.page, linkedFromHeader: e.target.checked})}
                />
            <span className='input-label-checkbox'>
                Linked from home page
            </span>
        </div>}
        {!props.page.isBlogPost && props.page.linkedFromHeader && <div className='input-row'>
            <span className='input-label'>
                Main page header sort order (number)
            </span>
            <input value={props.page.headerSortOrder} 
                onChange={e => props.editPage({...props.page, headerSortOrder: e.target.value})} />
        </div>}
        <div className='input-row'>
            <span className='input-label'>
                Page title
            </span>
            <textarea 
                rows={2}
                cols={30}
                className="short-multiline-textarea" 
                value={props.page.title} 
                onChange={e => props.editPage({...props.page, title: e.target.value})}/>
        </div>
        <div className='input-row'>
            <span className='input-label'>
                Page date (sort order)
            </span>
            <input type="date" value={dateStr}
                onChange={e => {
                    const [yyyy, mm, dd] = e.target.value.split('-')
                    props.editPage({
                        ...props.page,
                        date: {year: Number.parseInt(yyyy), month: Number.parseInt(mm) - 1, day: Number.parseInt(dd)}
                    })
                }}/> 
        </div>
        {props.page.isBlogPost ? 
            <React.Fragment>
                <div className='input-row-checkbox'>
                    <input type="checkbox" checked={props.page.autoSummary}
                        onChange={e => props.editPage({...props.page, autoSummary: e.target.checked})}
                        />
                    <span className='input-label-checkbox'>
                        Auto summary text (first paragraph)
                    </span>
                </div>
                <div className='sub-input-row'>
                    <span className='input-label'>
                        Summary Text:
                    </span>
                    {props.page.autoSummary ?
                        <React.Fragment>
                            {getSummaryText(props.page).text === '' && 
                                <IoIosWarning 
                                    style={{color: '#f4b656', width: 20, height: 20}}
                                    title='No non-empty root-level paragraph text found'/>
                            }
                            <span className='text-preview-block'>{getSummaryText(props.page).text}</span>
                        </React.Fragment>
                        
                        :
                        <textarea
                            value={props.page.summaryText}
                            onChange={e => props.editPage({...props.page, summaryText: e.target.value})} />
                    }
                </div>
                <div className='input-row-checkbox'>
                    <input type="checkbox" checked={props.page.autoSummaryImg}
                        onChange={e => {
                                const targetSummaryImg : Media | null = e.target.checked ? null : getSummaryImg(props.page);
                                props.editPage({...props.page, autoSummaryImg: e.target.checked, summaryImg: targetSummaryImg})
                            }
                        }
                        />
                    <span className='input-label-checkbox'>
                        Auto image thumbnail (first image)
                    </span>
                </div>
                <div className='sub-input-row'>
                    <React.Fragment>
                        {!props.page.autoSummaryImg &&
                            <button onClick={() => {
                                chooseFiles(false).then(urls => {
                                    if(urls.length > 0){
                                        registerMedia(urls[0]).then(media => {
                                            props.editPage({...props.page, summaryImg: media})
                                        })
                                    }
                                })
                            }}>Choose image thumbnail file</button>
                        }
                        {props.page.autoSummaryImg && getSummaryImg(props.page) === null && 
                            <IoIosWarning 
                                style={{color: '#f4b656', width: 20, height: 20}}
                                title='No root-level image found'/>
                        }
                    </React.Fragment>
                    <img src={props.page.autoSummaryImg ? 
                        getSummaryImg(props.page)?.stableRelativePath
                        : props.page.summaryImg?.stableRelativePath}/>
                </div>
            </React.Fragment>
        : ''}
        {/*<div>
            Private to family: 
            <input type="checkbox" checked={props.page.familyPrivate}
                onChange={e => props.editPage({...props.page, familyPrivate: e.target.checked})}/>
            </div>*/}
        <button className="import-button"
            onClick={() => {
                props.setImportPopup({
                    popupOpen: true,
                    existingPage: props.page,
                    popupCallback: (cancelled, p) => {
                        if(!cancelled && p !== null){
                            console.log('finished design', p.design)
                            props.editPage(p)
                        }
                    }
                })
            }}>
            <BiImport /> Import from Blogger
        </button>
        <div style={{display: 'flex', alignItems: 'center'}}>
            <button className="import-button"
                onClick={() => props.showConfirmPopup(
                    "Reimport all images on this page?",
                    "This will regenerate all image-type media present in the page, from the originally-supplied file locations. " + 
                    "If the image no longer exists in your local file system, you will be notified and the image will not be regenerated. " +
                    "Photospheres and videos will not be affected. Be sure to tidy the media folder (in \"more tools\") after.",
                    "Reimport",
                    "",
                    confirmed => {
                        if(confirmed){
                            const pageDesignOriginal = props.page.design
                            // get rid of read-only properties in page.design
                            const pageDesignCopy = JSON.parse(JSON.stringify(pageDesignOriginal))
                            const results = reimportImages(pageDesignCopy)
                            setReimportState({
                                pending: true,
                                completed: false,
                                totalToProcess: results.length,
                                totalProcessed: 0,
                                failures: []
                            })
                            const failures: string[] = []
                            let processed = 0
                            for(const res of results){
                                res.then(value => {
                                    if(!value.fileStillExists){
                                        failures.push(value.originalFileName)
                                    }
                                    processed++
                                    setReimportState({
                                        pending: true,
                                        completed: processed === results.length,
                                        totalToProcess: results.length,
                                        totalProcessed: processed,
                                        failures: failures
                                    })
                                })
                            }
                            Promise.all(results).then(() => {
                                props.editPage({...props.page, design: pageDesignCopy})
                                setReimportState({...reimportState, failures: failures, pending: false, completed: true})
                            })
                        }
                    }
                )}>
                <VscDebugRestart /> Reimport all Images
            </button>
            {reimportState.completed && reimportState.failures.length === 0 && 
                <FaRegCircleCheck style={{color: 'green', marginLeft: '5px'}}/>
            }
        </div>
        {reimportState.pending && 
            <div style={{margin: '5px'}}>
                {reimportState.totalProcessed} / {reimportState.totalToProcess} completed
            </div>
        }
        {!reimportState.pending && reimportState.completed && reimportState.failures.length > 0 && 
            <div style={{
                margin: '5px', display: 'flex', flexDirection: 'column', border: '2px solid rgb(220, 0, 0)',
                borderRadius: '5px', padding: '5px', backgroundColor: 'rgba(0,0,0,.05)'
            }}>
                <div>Failed reimport image locations:</div>
                {reimportState.failures.map(f => <div>{f}</div>)}
            </div>
        }
        <button className="delete-button"
            onClick={() => props.showConfirmPopup(
                'Are you sure you want to delete this page?',
                'This cannot be undone.',
                'Delete',
                'rgb(215, 71, 71)',
                confirmed => {
                    if(confirmed){
                        props.deletePage()
                    }
                }
            )}>
            Delete Page</button>
    </div>
}

export type PageSettingsProps = {
    page: Page
    editPage: (newPage: Page) => void
    deletePage: () => void
    setImportPopup: (popup: ImportPopup) => void
    showConfirmPopup: (header: string, body: string, confirmString: string, confirmColor: string, choiceCallBack: (confirmed:boolean) => void) => void
}