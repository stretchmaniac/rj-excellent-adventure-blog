import React from "react"
import { Link } from "../../types/link"
import './../../assets/stylesheets/slate/toggle-button.scss'
import { Page } from "../../types/PageType"
import PageList from "../PageList"
import pageContains from "../../tools/page-search"

export default function HyperlinkSelect(props: HyperlinkSelectProps){
    const [awaitingMenu, setAwaitingMenu] = React.useState(false)
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    const selectedText = props.getSelectedText()

    return <button className={"toggle-button toggle-" + (awaitingMenu ? 'active' : 'inactive')}
        ref={buttonRef}
        title={props.title}
        onMouseDown={e => e.preventDefault()}
        onClick={() => {
            const pos = [0, 0]
            if(buttonRef.current){
                const r = buttonRef.current.getBoundingClientRect()
                pos[0] = r.left
                pos[1] = r.top + 20
            }
            // menu hook 
            setAwaitingMenu(true)
            props.clickToExitPopupHook({
                position: pos,
                onCancel: () => setAwaitingMenu(false),
                contents: <HyperlinkSelectContents 
                    selectedText={selectedText}
                    parentProps={props}
                    setAwaitingMenu={setAwaitingMenu}/>,
                disableClickToClose: true
            })
        }}
        disabled={!props.enabled}>
        {props.children}
    </button>
}

function HyperlinkSelectContents(props: HyperlinkSelectContentsProps){
    const [internal, setInternal] = React.useState(false)
    const [internalSearch, setInternalSearch] = React.useState('')
    const internalPages = props.parentProps.allPages.filter(p => pageContains(p, internalSearch))
    internalPages.push({
        id: '-1:home',
        title: 'Home Page',
        date: new Date(),
        isBlogPost: false,
        linkedFromHeader: false,
        headerSortOrder: '0',
        summaryText: '',
        autoSummary: false,
        autoSummaryImg: false,
        summaryImg: null,
        familyPrivate: false,
        design: []
    })
    const [internalSelected, setInternalSelected] = React.useState(0)
    const [linkText, setLinkText] = React.useState('')
    const [urlText, setUrlText] = React.useState('')
    React.useEffect(() => {
        setLinkText(props.selectedText)
    }, [])
    return <div onClick={e => e.stopPropagation()}  className="insert-hyperlink-parent">
        <div className="insert-hyperlink-input-row insert-hyperlink-checkbox-row">
            <input type="checkbox" checked={internal} 
                    onChange={e => setInternal(e.target.checked)}/>
            <span className="insert-hyperlink-label">internal link</span>
        </div>
        <div className="insert-hyperlink-input-row">
            <span className="insert-hyperlink-label">link text</span>
            <input value={linkText} onChange={e => setLinkText(e.target.value)}
                disabled={props.selectedText !== ''}/>
        </div>
        {internal ? 
            <React.Fragment>
                <div className="insert-hyperlink-input-row">
                    <span className="insert-hyperlink-label">search pages</span>
                    <input className="insert-hyperlink-internal-search"
                        value={internalSearch}
                        placeholder="Search all pages"
                        onChange={e => {
                            setInternalSearch(e.target.value)
                            setInternalSelected(-1)
                        }}/>
                </div>
                {internalPages.length === 0 ?
                    <span className="insert-hyperlink-no-pages">No pages found</span>
                :
                    <div style={{maxHeight: '250px', overflowY: 'auto'}}>
                        <PageList 
                            pages={internalPages}
                            selected={internalSelected}
                            selectPage={index => setInternalSelected(index)}/>
                        
                    </div>
                }
            </React.Fragment>
        :
            <div className="insert-hyperlink-input-row">
                <span className="insert-hyperlink-label">url</span>
                <input value={urlText} onChange={e => setUrlText(e.target.value)}/>
            </div>
        }
        <div className="insert-hyperlink-buttons">
            <button className="popup-cancel popup-button"
                onClick={() => {
                    props.parentProps.closeClickToExitPopup()
                    props.setAwaitingMenu(false)
                }}>Cancel</button>
            <button className="popup-continue popup-button"
                onClick={() => {
                    const isHome = internalPages[internalSelected].id === '-1:home'
                    const link: Link = internal ? {
                        isHomePageLink: isHome, 
                        pageId: isHome ? null : internalPages[internalSelected].id
                    } : {
                        url: urlText
                    }
                    props.parentProps.onInsert(linkText, link)
                    props.parentProps.closeClickToExitPopup()
                    props.setAwaitingMenu(false)
                }}>Insert link</button>
        </div>
    </div>
}

export type HyperlinkSelectContentsProps = {
    parentProps: HyperlinkSelectProps
    selectedText: string
    setAwaitingMenu: (value: boolean) => void
}

export type HyperlinkSelectProps = {
    children: React.ReactNode
    enabled: boolean
    title: string
    allPages: Array<Page>
    getSelectedText: () => string
    onInsert: (insertionText: string, link: Link) => void
    closeClickToExitPopup: () => void
    clickToExitPopupHook: (menuOpts: {position: Array<number>, contents: React.ReactNode, onCancel: () => void, disableClickToClose?: boolean}) => void
}