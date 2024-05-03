import React from 'react'
import './assets/stylesheets/root.scss'
import Explorer from './components/Explorer'
import { Header } from './components/Header'
import PageEditor from './components/PageEditor'
import { Page } from './types/PageType'
import { NewPagePopup } from './components/NewPagePopup'
import { emptyBlogPostWithTitleDate, emptyStaticPageWithTitleDate, sortPages } from './tools/empty-page'
import ConfirmPopup from './components/ConfirmPopup'
import { BlogConfig } from './types/blog-config'
import { UnsavedLoadPopup } from './components/UnsavedLoadPopup'
import { loadData, mergeData, setData, setMirrorDirectory } from './tools/http'

type NewPagePopupInfo = {
    popupOpen: boolean
    popupHeader: string
    newBlogPost: boolean
    popupCallback: (p: Page | null) => void
}

type ConfirmPopup = {
    popupOpen: boolean
    popupHeader: string
    confirmString: string
    confirmColor: string
    popupCallback: (confirmed: boolean) => void
}

type UnsavedLoadPopup = {
    popupOpen: boolean,
    popupCallback: (choice: string) => void // "merge", "load"
}

export function Main() {
    const [pages, setPagesRaw] = React.useState<Page[]>([])
    const [config, setConfig] = React.useState<BlogConfig>({
        localSaveFolder: null
    })

    // mergeBehavior one of "load", "merge"
    const setConfigWithSideEffects = (newConfig: BlogConfig, mergeBehavior: string) => {
        // save to local storage
        if(newConfig.localSaveFolder !== null){
            localStorage.setItem('localSaveFolder', newConfig.localSaveFolder)
            // load pages, merge, etc.
            setMirrorDirectory(newConfig.localSaveFolder).then(() => {
                mergeData({
                    pages: mergeBehavior === 'merge' ? pages : [],
                    config: newConfig
                }).then(() => {
                    loadData().then(state => {
                        setPagesRaw(state.pages)
                        // ignore localSaveFolder from file system, since that's a client-only quantity
                        setConfig({
                            ...state.config,
                            localSaveFolder: newConfig.localSaveFolder
                        })
                    })
                })
            })
        }
    }

    const [configInit, setConfigInit] = React.useState(false)
    React.useEffect(() => {
        // check local storage for 'localSaveFolder' and apply
        const folder = localStorage.getItem('localSaveFolder')
        if(!!folder){
            setConfigWithSideEffects({
                ...config,
                localSaveFolder: folder
            }, 'load')
        } else {
            setMirrorDirectory('')
        }
        setConfigInit(true)
    }, [])

    const [pagesDirty, setPagesDirty] = React.useState(false)
    const [pageUpdateCount, setPageUpdateCount] = React.useState(0)
    React.useEffect(() => {
        if(!configInit || !pagesDirty){
            return
        }
        setTimeout(() => {
            setPageUpdateCount(pageUpdateCount + 1)
        }, 1000)
    }, [pagesDirty])
    React.useEffect(() => {
        if(!configInit){ return }
        setPagesDirty(false)
        setData({pages: pages, config: config})
    }, [pageUpdateCount])

    // keep pages in order by date
    const setPages = (newPages: Array<Page>) => {
        sortPages(newPages)
        setPagesRaw(newPages)
        setPagesDirty(true)
    }

    const [selectedPageID, setSelectedPageID] = React.useState<string>('')
    const [newPagePopup, setNewPagePopup] = React.useState<NewPagePopupInfo>({
        popupOpen: false,
        popupHeader: '',
        newBlogPost: true,
        popupCallback: p => {}
    })
    const [confirmPopup, setConfirmPopup] = React.useState<ConfirmPopup>({
        popupOpen: false,
        popupHeader: '',
        confirmString: '',
        confirmColor: '',
        popupCallback: () => {}
    })
    const [unsavedLoadPopup, setUnsavedLoadPopup] = React.useState<UnsavedLoadPopup>({
        popupOpen: false,
        popupCallback: choice => {}
    })

    const selectedPageIndex = pages.map(p => p.id == selectedPageID).indexOf(true)
    const selectedPage = selectedPageIndex == -1 ? null : pages[selectedPageIndex]

    return <div className="root">
        <Header config={config} setConfig={setConfigWithSideEffects}
            showUnsavedLoadPopup={callback => {
                if(pages.length === 0){
                    // if we have made no changes, skip the dialog screen 
                    // and load the folder
                    callback('load')
                    return
                }
                setUnsavedLoadPopup({
                    popupOpen: true,
                    popupCallback: res => {
                        setUnsavedLoadPopup({popupOpen: false, popupCallback: () => {}})
                        callback(res)
                    }
                })
            }}/>
        <div className="explorer-editor-parent">
            <Explorer 
                pages={pages}
                addPage={page => {
                    setPages([...pages, page])
                }}
                selectPage={id => setSelectedPageID(id)}
                showNewPageDialog={(isBlogPost, callback) => 
                    setNewPagePopup({
                        popupOpen: true,
                        popupHeader: isBlogPost ? 'New Blog Post' : 'New Static Page',
                        newBlogPost: isBlogPost,
                        popupCallback: callback
                    })
                }
            />
            <PageEditor 
                page={selectedPage}
                allPages={pages}
                onPageEdit={p => {
                    const newPages = []
                    for(let i = 0; i < selectedPageIndex; i++){
                        newPages.push(pages[i])
                    }
                    newPages.push(p)
                    for(let i = selectedPageIndex + 1; i < pages.length; i++){
                        newPages.push(pages[i])
                    }
                    setPages(newPages)
                }}
                deletePage={() => {
                    const newPages = []
                    for(let i = 0; i < pages.length; i++){
                        if(i !== selectedPageIndex){
                            newPages.push(pages[i])
                        }
                    }
                    setPages(newPages)
                }}
                showConfirmPopup={(header, confirmStr, confirmColor, callback) => setConfirmPopup({
                    popupOpen: true,
                    popupHeader: header,
                    confirmString: confirmStr,
                    confirmColor: confirmColor,
                    popupCallback: callback
                })}
            />
        </div>
        {unsavedLoadPopup.popupOpen && <UnsavedLoadPopup onComplete={unsavedLoadPopup.popupCallback}/>}
        {newPagePopup.popupOpen ? 
            <NewPagePopup 
                headerText={newPagePopup.popupHeader}
                onComplete={(title, date, cancelled) => {
                    if(cancelled){
                        newPagePopup.popupCallback(null)
                    }
                    else {
                        const newPage = newPagePopup.newBlogPost ? 
                            emptyBlogPostWithTitleDate(title, date) :
                            emptyStaticPageWithTitleDate(title, date)
                        newPagePopup.popupCallback(newPage)
                    }
                    setNewPagePopup({
                        popupOpen: false,
                        popupHeader: '',
                        newBlogPost: true,
                        popupCallback: p => null
                    })
                }}
                />
            : ''}
        {confirmPopup.popupOpen ? 
            <ConfirmPopup 
                header={confirmPopup.popupHeader}
                confirmString={confirmPopup.confirmString}
                confirmColor={confirmPopup.confirmColor}
                choiceCallback={confirmed => {
                    confirmPopup.popupCallback(confirmed)
                    setConfirmPopup({
                        ...confirmPopup,
                        popupOpen: false
                    })
                }}/>
        : ''}
    </div>
}