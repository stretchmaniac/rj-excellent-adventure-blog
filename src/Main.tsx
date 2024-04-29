import React from 'react'
import './assets/stylesheets/root.scss'
import Explorer from './components/Explorer'
import { Header } from './components/Header'
import PageEditor from './components/PageEditor'
import { Page } from './types/PageType'
import { NewPagePopup } from './components/NewPagePopup'
import { emptyBlogPostWithTitleDate, emptyStaticPageWithTitleDate } from './tools/empty-page'
import ConfirmPopup from './components/ConfirmPopup'

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

export function Main() {

    const [pages, setPagesRaw] = React.useState<Array<Page>>([])
    // keep pages in order by date
    const setPages = (newPages: Array<Page>) => {
        newPages.sort((a, b) => {
            if(a.date < b.date){
                return -1
            }
            if(b.date < a.date) {
                return 1
            }
            // sort alphabetically according to title next
            if(a.title !== b.title){
                return a.title < b.title ? -1 : 1
            }
            // sort by id finally
            return a.id < b.id ? -1 : 1
        })
        setPagesRaw(newPages)
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

    const selectedPageIndex = pages.map(p => p.id == selectedPageID).indexOf(true)
    const selectedPage = selectedPageIndex == -1 ? null : pages[selectedPageIndex]

    return <div className="root">
        <Header />
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