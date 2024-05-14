import './../assets/stylesheets/explorer.scss'
import SearchBar from './SearchBar'
import { Page } from './../types/PageType'
import React from 'react'
import PageList from './PageList'
import { pageContains } from '../tools/page-search'
import ToggleButtonGroup from './ToggleButtonGroup'

const EXPLORER_MODE = {
    SEARCH_RESULTS: 0,
    PAGE_LIST: 1
}


export default function Explorer(props: ExplorerProps) {
    const [explorerState, setExplorerState] = React.useState<ExplorerState>({
        mode: EXPLORER_MODE.PAGE_LIST,
        searchQuery: '',
        selectedPageID: null,
        postTabSelected: true
    })

    const blogPages = props.pages.filter(p => p.isBlogPost)
    const nonBlogPages = props.pages.filter(p => !p.isBlogPost)
    const searchPages = explorerState.mode == EXPLORER_MODE.SEARCH_RESULTS ? 
        props.pages.filter(p => pageContains(p, explorerState.searchQuery)) :
        []
    const applicablePages = explorerState.mode == EXPLORER_MODE.SEARCH_RESULTS ? 
        searchPages :
        (explorerState.postTabSelected ? blogPages : nonBlogPages)
    const selectedPage = applicablePages.map(p => p.id === explorerState.selectedPageID).indexOf(true)

    return <div className="explorer-root">
        <div style={{height: '10px', flexShrink: 0}} />
        <SearchBar 
            onChange={searchText => {
                const trimmed = searchText.trim()
                if(trimmed.length === 0){
                    setExplorerState({
                        ...explorerState,
                        mode: EXPLORER_MODE.PAGE_LIST
                    })
                } else {
                    setExplorerState({
                        ...explorerState,
                        mode: EXPLORER_MODE.SEARCH_RESULTS,
                        searchQuery: trimmed
                    })
                }
            }}/>
        <div style={{height: '15px', flexShrink: 0}} />
        { explorerState.mode == EXPLORER_MODE.PAGE_LIST ? 
            // show tab view when no search result
            <ToggleButtonGroup 
                options={['Blog Posts', 'Static Pages']}
                selected={explorerState.postTabSelected ? 0 : 1}
                onChange={optionIndex => setExplorerState({
                    ...explorerState,
                    postTabSelected: optionIndex == 0
                })}
                />
        : ''}
        <div style={{height: '10px'}}></div>
        <PageList pages={applicablePages}
            selected={selectedPage}
            selectPage={(index) => {
                    setExplorerState({
                    ...explorerState,
                    selectedPageID: applicablePages[index].id
                })
                props.selectPage(applicablePages[index].id)
            }}
            />
        { explorerState.mode == EXPLORER_MODE.SEARCH_RESULTS ? '' :
            <div style={{display:'flex', justifyContent: 'center'}}>
                <button
                    className="add-post-button"
                    onClick={() => {
                        props.showNewPageDialog(explorerState.postTabSelected, p => {
                            if(p == null){ return; }
                            props.addPage(p)
                            props.selectPage(p.id)
                            setExplorerState({
                                ...explorerState,
                                selectedPageID: p.id
                            })
                        })
                    }}
                    >Add {explorerState.postTabSelected ? 'Post' : 'Static Page'}</button>
            </div>
        }
    </div>
}

export type ExplorerProps = {
    pages: Array<Page>,
    showNewPageDialog: (isBlogPost: boolean, onFinishedCallback: (p: Page | null) => void) => void,
    selectPage: (id: string) => void
    addPage: (page: Page) => void
}

type ExplorerState = {
    mode: number,
    searchQuery: string, // applicable only when mode == SEARCH_RESULTS
    selectedPageID: string | null
    postTabSelected: boolean
}