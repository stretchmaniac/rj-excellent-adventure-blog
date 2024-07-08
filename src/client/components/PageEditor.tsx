import React from 'react';
import { Page } from '../types/PageType'
import './../assets/stylesheets/page-editor.scss'
import ToggleButtonGroup from './ToggleButtonGroup';
import PageSettings from './PageSettings';
import PageDesign from './PageDesign';
import { ImportPopup, WaitingPopup } from '../Main';
import { LuSquirrel } from 'react-icons/lu'

type PannellumScreenshotQueueItem = {
    id: string
    container: HTMLDivElement
    promiseResolve: (dataUrl: string) => void
}

export default function PageEditor(props: PageEditorProps){
    const page = props.page;

    const [tab, setTab] = React.useState(0)
    const [pannellumDiv, setPannellumDiv] = React.useState(document.createElement('div'))
    const [pannellumViewer, setPannellumViewer] = React.useState<any>(null)
    const [pannellumQueueEmpty, setPannellumQueueEmpty] = React.useState(true)

    const pannellumScreenshotQueue: PannellumScreenshotQueueItem[] = []
    const evalScreenshotQueue = () => {
        if(pannellumScreenshotQueue.length == 0){
            // nothing to do!
            setPannellumQueueEmpty(true)
            return
        }
        const first = pannellumScreenshotQueue[0]
        if(pannellumViewer === null){
            setTimeout(() => evalScreenshotQueue(), 100) // try again later
        } else {
            // attach to container
            if(pannellumDiv.parentElement){
                pannellumDiv.parentElement.removeChild(pannellumDiv)
            }
            first.container.appendChild(pannellumDiv)
            // load the scene
            pannellumViewer.resize()
            pannellumViewer.loadScene(first.id)
            pannellumViewer.resize()
            pannellumViewer.on('load', () => {
                // for some reason, pannellum 'load' event is not completely loaded...
                // not sure what exactly is happening, but it appears that if we wait *any* amount
                // of time (e.g., 1ms also works here) pannellum clears itself out here
                setTimeout(() => {
                    // take screenshot
                    first.promiseResolve(pannellumViewer.getRenderer().render(
                        pannellumViewer.getPitch() / 180 * Math.PI,
                        pannellumViewer.getYaw() / 180 * Math.PI,
                        pannellumViewer.getHfov() / 180 * Math.PI,
                        {'returnImage': true}
                    ))
                    // remove first from queue
                    pannellumScreenshotQueue.splice(0, 1)
                    // remove load event listeners
                    pannellumViewer.off('load')
                    // do next in queue
                    evalScreenshotQueue()
                }, 10)
            })
        }
    }
    const pannellumScheduleScreenshot = (id: string, container: HTMLDivElement) => {
        return new Promise<string>((resolve, reject) => {
            pannellumScreenshotQueue.push({
                id: id,
                container: container,
                promiseResolve: resolve
            })
            if(pannellumScreenshotQueue.length === 1){
                setPannellumQueueEmpty(false)
                evalScreenshotQueue()
            }
        })
    }

    return <div className={"page-editor-root" + (page == null ? " empty" : "")}>
        {page == null ? 
            <React.Fragment>
                <LuSquirrel className="page-editor-squirrel"/>
                <span className='page-editor-empty'>Select a page on your left</span>
            </React.Fragment>
        : 
            <div className="page-editor-nonempty">
                <div className="page-editor-tabs">
                    <ToggleButtonGroup 
                        options={['Design', 'Settings']}
                        selected={tab}
                        onChange={i => setTab(i)}/>
                </div>
                {tab === 0 ? 
                    <PageDesign 
                        footer={props.footer}
                        setFooter={props.setFooter}
                        page={page}
                        allPages={props.allPages}
                        designStruct={page.design}
                        pageID={page.id}
                        pageTitle={page.title}
                        pageDate={page.date}
                        isBlogPost={page.isBlogPost}
                        previewHook={props.previewHook}
                        setWaitingPopup={props.setWaitingPopup}
                        pannellumPackage={{
                            div: pannellumDiv, 
                            viewer: pannellumViewer, 
                            setViewer: viewer => {
                                setPannellumViewer(viewer)
                            },
                            viewerSetScheduled: false,
                            scheduleScreenshot: pannellumScheduleScreenshot,
                            queueEmpty: pannellumQueueEmpty
                        }}
                        onChange={d => props.onPageEdit({
                            ...page,
                            design: d
                        })}/>
                : ''}
                {tab === 1 ? 
                    <PageSettings 
                        page={page}
                        editPage={newPage => props.onPageEdit(newPage)}
                        deletePage={props.deletePage}
                        showConfirmPopup={props.showConfirmPopup}
                        setImportPopup={props.setImportPopup}/>
                : ''}
            </div>
        }
    </div>
}

export type PageEditorProps = {
    page: Page | null,
    allPages: Array<Page>
    footer: any[]
    setFooter: (newFooter: any[]) => void
    onPageEdit: (newPage: Page) => void
    deletePage: () => void
    previewHook: (verify: boolean) => Promise<boolean>
    setImportPopup: (popup: ImportPopup) => void
    setWaitingPopup: (popup: WaitingPopup) => void
    showConfirmPopup: (header: string, confirmString: string, confirmColor: string, choiceCallBack: (confirmed:boolean) => void) => void
}