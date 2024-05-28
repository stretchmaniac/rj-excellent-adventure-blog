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
import { loadData, mergeData, setData, setMirrorDirectory, setPreview } from './tools/http'
import { WaitingPopup } from './components/WaitingPopup'
import { makePreview } from './tools/preview'
import { MoreToolsPopup } from './components/MoreToolsPopup'
import { ImportPopup } from './components/ImportPopup'
import { flushSync } from 'react-dom'

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

export type ImportPopup = {
    popupOpen: boolean,
    existingPage: Page | null,
    popupCallback: (cancelled: boolean, importedPage: Page | null) => void
}

export type WaitingPopup = {
    popupOpen: boolean,
    message: string
}

export function defaultFooter(): any[]{
    return [
        {
            type: 'paragraph',
            readOnly: true,
            children: [
                {text: 'This', bold: true},
                {text: ' is a read-only footer. Change me in the "more tools" dialog in the upper-right hand corner of your screen.'}
            ]
        }
    ]
}

export function Main() {
    const [pages, setPagesRaw] = React.useState<Page[]>([])
    const [config, setConfig] = React.useState<BlogConfig>({
        localSaveFolder: null,
        fixedBlogPostFooterDesign: defaultFooter()
    })

    // mergeBehavior one of "load", "merge"
    const setLocalSaveFolderWithSideEffects = (newConfig: BlogConfig, mergeBehavior: string) => {
        // save to local storage
        if(newConfig.localSaveFolder !== null){
            localStorage.setItem('localSaveFolder', newConfig.localSaveFolder)
            // load pages, merge, etc.
            setMirrorDirectory(newConfig.localSaveFolder).then((success) => {
                if(!success){
                    return
                }
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
            setLocalSaveFolderWithSideEffects({
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
        setData({pages: pages, config: config})
        flushSync(() => setPagesDirty(false))
    }, [pageUpdateCount])

    // keep pages in order by date
    const setPages = (newPages: Array<Page>) => {
        sortPages(newPages)
        setPagesRaw(newPages)
        setPagesDirty(true)
    }

    // localSaveFolder must NOT be changed in newConfig (from config)
    const setConfigWithSideEffects = (newConfig: BlogConfig) => {
        setConfig(newConfig)
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
    const [waitingPopup, setWaitingPopup] = React.useState<WaitingPopup>({
        popupOpen: false,
        message: ''
    })
    const [moreToolsPopupOpen, setMoreToolsPopupOpen] = React.useState(false)
    const [importPopup, setImportPopup] = React.useState<ImportPopup>({
        popupOpen: false,
        existingPage: null,
        popupCallback: () => {}
    })
    const [importSearchPaths, setImportSearchPathsRaw] = React.useState<string>('')
    React.useEffect(() => {
        const searchPaths = localStorage.getItem('importSearchPaths')
        if(!!searchPaths){
            setImportSearchPathsRaw(searchPaths)
        }
    }, [])
    const setImportSearchPaths = (paths: string) => {
        setImportSearchPathsRaw(paths)
        localStorage.setItem('importSearchPaths', paths)
    }

    const selectedPageIndex = pages.map(p => p.id == selectedPageID).indexOf(true)
    const selectedPage = selectedPageIndex == -1 ? null : pages[selectedPageIndex]

    function showPreview(pageSource: Page | null): Promise<boolean> {
        return new Promise((res, rej) => {
            const preview = makePreview(pages)
            setPreview(preview).then(success => {
                if(pageSource){
                    window.open(`http://localhost:3000/preview/${preview.pageIdToFolderName.get(pageSource.id)}/page.html`, '_blank')
                } else {
                    // default to home
                    window.open('http://localhost:3000/preview/home.html', '_blank')
                }
                res(success)
            })
        })
    }

    return <div className="root">
        <Header config={config} setConfig={setLocalSaveFolderWithSideEffects}
            pages={pages}
            showMoreToolsPopup={() => setMoreToolsPopupOpen(true)}
            setWaitingPopup={setWaitingPopup}
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
                footer={config.fixedBlogPostFooterDesign}
                setFooter={(newFooter) => setConfigWithSideEffects({...config, fixedBlogPostFooterDesign: newFooter})}
                setWaitingPopup={setWaitingPopup}
                previewHook={() => showPreview(selectedPage)}
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
                setImportPopup={popup => {
                    setImportPopup({
                        popupOpen: popup.popupOpen,
                        existingPage: popup.existingPage,
                        popupCallback: (cancelled, p) => {
                            setImportPopup({popupOpen: false, existingPage: null, popupCallback: () => {}})
                            popup.popupCallback(cancelled, p)
                        }
                    })
                }}
            />
        </div>
        {moreToolsPopupOpen && <MoreToolsPopup pages={pages} config={config} 
            setConfig={setConfigWithSideEffects} close={() => setMoreToolsPopupOpen(false)}/>}
        {waitingPopup.popupOpen && <WaitingPopup message={waitingPopup.message}/>}
        {unsavedLoadPopup.popupOpen && <UnsavedLoadPopup onComplete={unsavedLoadPopup.popupCallback}/>}
        {importPopup.popupOpen && <ImportPopup existingPage={importPopup.existingPage as Page} 
            onComplete={importPopup.popupCallback}
            importSearchPaths={importSearchPaths}
            setImportSearchPaths={setImportSearchPaths}
            />}
        {newPagePopup.popupOpen ? 
            <NewPagePopup 
                headerText={newPagePopup.popupHeader}
                onComplete={(title, date, cancelled) => {
                    if(cancelled){
                        newPagePopup.popupCallback(null)
                    }
                    else {
                        const newPage = newPagePopup.newBlogPost ? 
                            emptyBlogPostWithTitleDate(title, date, config.fixedBlogPostFooterDesign) :
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