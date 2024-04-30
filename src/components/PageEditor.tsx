import React from 'react';
import { Page } from '../types/PageType'
import './../assets/stylesheets/page-editor.scss'
import ToggleButtonGroup from './ToggleButtonGroup';
import PageSettings from './PageSettings';
import PageDesign from './PageDesign';

export default function PageEditor(props: PageEditorProps){
    const page = props.page;

    const [tab, setTab] = React.useState(0)

    return <div className={"page-editor-root" + (page == null ? " empty" : "")}>
        {page == null ? 
            <span className='page-editor-empty'>Select a page to the left!</span>
        : 
            <div className="page-editor-nonempty">
                <div className="page-editor-tabs">
                    <ToggleButtonGroup 
                        options={['Design', 'Images/Files', 'Settings']}
                        selected={tab}
                        onChange={i => setTab(i)}/>
                </div>
                {tab === 0 ? 
                    <PageDesign 
                        allPages={props.allPages}
                        designStruct={page.design}
                        pageID={page.id}
                        pageTitle={page.title}
                        pageDate={page.date}
                        isBlogPost={page.isBlogPost}
                        onChange={d => props.onPageEdit({
                            ...page,
                            design: d
                        })}/>
                : ''}
                {tab === 2 ? 
                    <PageSettings 
                        page={page}
                        editPage={newPage => props.onPageEdit(newPage)}
                        deletePage={props.deletePage}
                        showConfirmPopup={props.showConfirmPopup}/>
                : ''}
            </div>
        }
    </div>
}

export type PageEditorProps = {
    page: Page | null,
    allPages: Array<Page>
    onPageEdit: (newPage: Page) => void
    deletePage: () => void
    showConfirmPopup: (header: string, confirmString: string, confirmColor: string, choiceCallBack: (confirmed:boolean) => void) => void
}