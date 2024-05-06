import { getDateInputStr } from '../tools/date'
import { Page } from '../types/PageType'
import './../assets/stylesheets/page-settings.scss'
import './../assets/stylesheets/form-common.scss'
import ToggleButtonGroup from './ToggleButtonGroup'
import React from 'react'

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
                        Auto summary text
                    </span>
                </div>
                {props.page.autoSummary ? '' : 
                    <div className='input-row'>
                        <span className='input-label'>
                            Summary Text:
                        </span>
                        <textarea 
                            value={props.page.summaryText}
                            onChange={e => props.editPage({...props.page, summaryText: e.target.value})} />
                    </div>
                }
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