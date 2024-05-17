import { getDateInputStr } from '../tools/date'
import { Page } from '../types/PageType'
import './../assets/stylesheets/page-settings.scss'
import './../assets/stylesheets/form-common.scss'
import React from 'react'
import { chooseFiles } from '../tools/http'
import { registerMedia } from '../tools/media'
import { IoIosWarning } from "react-icons/io";
import { getSummaryImg, getSummaryText } from '../tools/empty-page'

export default function PageSettings(props: PageSettingsProps) {
    let dateStr = ''
    const date = props.page.date
    // check if date is valid
    if(!isNaN(date.getTime())){
        dateStr = getDateInputStr(date)
    }
    return <div className='page-settings-root'>
        <div className='input-row-checkbox'>
            <input type="checkbox" checked={!props.page.isBlogPost}
                onChange={e => props.editPage({...props.page, isBlogPost: !e.target.checked})}
                />
            <span className='input-label-checkbox'>
                Static page (default blog post)
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
                        date: new Date(Number.parseInt(yyyy), Number.parseInt(mm) - 1, Number.parseInt(dd))
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
                                props.editPage({...props.page, autoSummaryImg: e.target.checked, summaryImg: null})
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
        <button className="delete-button"
            onClick={() => props.showConfirmPopup(
                'Are you sure you want to delete this page?',
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
    showConfirmPopup: (header: string, confirmString: string, confirmColor: string, choiceCallBack: (confirmed:boolean) => void) => void
}