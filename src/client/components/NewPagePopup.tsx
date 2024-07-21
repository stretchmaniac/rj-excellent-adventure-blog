import React from 'react'
import './../assets/stylesheets/new-page-popup.scss'
import './../assets/stylesheets/popup-common.scss'
import './../assets/stylesheets/form-common.scss'
import { currentSimpleDate, getDateInputStr, SimpleDate } from '../tools/date'

export function NewPagePopup(props: NewPagePopupProps) {
    const [title, setTitle] = React.useState('')
    const [date, setDate] = React.useState(getDateInputStr(currentSimpleDate()))
    return <div className='popup-fullscreen'>
            <div className='popup-root'>
                <div className='popup-header'>
                    {props.headerText}
                </div>
                <div className='popup-content'>
                    <div className='input-row'>
                        <span className="input-label">Title</span>
                        <textarea 
                            rows={2}
                            cols={30}
                            className="short-multiline-textarea"
                            value={title} 
                            onChange={e => setTitle(e.target.value)}/>
                    </div>
                    <div className="input-row">
                        <span className="input-label">Date</span>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)}/>
                    </div>
                </div>
                <div className='popup-buttons'>
                    <button 
                        onClick={() => props.onComplete(title, currentSimpleDate(), true)}
                        className='popup-button popup-cancel'>Cancel</button>
                    <button 
                        onClick={() => {
                            const [yyyy, mm, dd] = date.split('-')
                            props.onComplete(
                                title,
                                {year: Number.parseInt(yyyy), month: Number.parseInt(mm) - 1, day: Number.parseInt(dd)},
                                false
                            )
                        }}
                        className='popup-button popup-continue'>Continue</button>
                </div>
            </div>
        </div>
}

export type NewPagePopupProps = {
    headerText: string,
    onComplete: (title: string, date: SimpleDate, cancelled: boolean) => void
}