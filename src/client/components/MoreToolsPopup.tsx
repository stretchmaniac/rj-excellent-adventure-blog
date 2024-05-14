import './../assets/stylesheets/new-page-popup.scss'
import './../assets/stylesheets/popup-common.scss'
import './../assets/stylesheets/form-common.scss'
import './../assets/stylesheets/more-tools-popup.scss'
import { ResourceTestResult, chooseFiles, chooseFolder, cleanupMedia, copyResource, testResources } from '../tools/http'
import { getAllReferencedMediaNames } from '../tools/empty-page'
import { Page } from '../types/PageType'
import React from 'react'
import { FaRegCircleCheck } from "react-icons/fa6";

export function MoreToolsPopup(props: MoreToolsPopupProps) {
    const [tidyMediaFinished, setTidyMediaFinished] = React.useState(false)
    const [imgUpdate, setImgUpdate] = React.useState(0)
    const [resourceTestRes, setResourceTestRes] = React.useState<ResourceTestResult | null>(null)

    React.useEffect(() => {
        testResources().then(v => setResourceTestRes(v))
    }, [])
    const testResourceNameMap = {
        'powershell': 'Powershell 7',
        'image magick': 'Image Magick',
        'pannellum': 'Pannellum',
        'open sans': 'Open Sans Font'
    } as any
    const testResourceDownloadLinkMap = {
        'powershell': 'https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell-on-windows?view=powershell-7.4',
        'image magick': 'https://imagemagick.org/archive/binaries/ImageMagick-7.1.1-32-Q16-HDRI-x64-dll.exe',
        'pannellum': 'https://github.com/mpetroff/pannellum/releases/download/2.5.6/pannellum-2.5.6.zip',
        'open sans': 'https://gwfh.mranftl.com/api/fonts/open-sans?download=zip&subsets=latin&variants=300,500,600,700,800,300italic,regular,italic,500italic,600italic,700italic,800italic&formats=woff2'
    } as any
    const testResourcesExtraActions = {
        'pannellum': {
            title: 'Choose extracted pannellum-x.x.x folder',
            action: () => {
                chooseFolder().then(f => {
                    const promises = []
                    promises.push(copyResource(f + '/pannellum/pannellum.htm', 'fixed-assets', 'pannellum', true))
                    promises.push(copyResource(f + '/pannellum/pannellum.js', 'fixed-assets', 'pannellum', true))
                    promises.push(copyResource(f + '/pannellum/pannellum.css', 'fixed-assets', 'pannellum', true))
                    Promise.all(promises).then(() => {
                        testResources().then(v => setResourceTestRes(v))
                    })
                })
            }
        }, 
        'open sans': {
            title: 'Choose extracted open-sans-v40-latin folder',
            action: () => {
                chooseFolder().then(f => {
                    const promises = []
                    promises.push(copyResource(f + '/open-sans-v40-latin-italic.woff2', 'fixed-assets', 'open-sans-v40-latin-italic', true))
                    promises.push(copyResource(f + '/open-sans-v40-latin-regular.woff2', 'fixed-assets', 'open-sans-v40-latin-regular', true))
                    for(let size of ['300', '500', '600', '700', '800']){
                        for(let it of ['italic', '']){
                            const name = 'open-sans-v40-latin-' + size + it
                            promises.push(copyResource(f + '/' + name + '.woff2', 'fixed-assets', name, true))
                        }
                    }
                    Promise.all(promises).then(() => {
                        testResources().then(v => setResourceTestRes(v))
                    })
                })
            }
        }
    } as any

    return <div className='popup-fullscreen'>
            <div className='popup-root'>
                <div className='popup-header'>
                    More Tools and Settings
                </div>
                <div className='popup-content'>
                    <div className='input-row'>
                        <span className='input-label'>Header image (must be .jpg)</span>
                        <div className='sub-input-row'>
                            <button onClick={() => {
                                chooseFiles(false).then(files => {
                                    if(files.length === 0){
                                        return
                                    }
                                    copyResource(files[0], 'fixed-assets', 'header', true).then(() => {
                                        setImgUpdate(imgUpdate + 1)
                                    })
                                })
                            }}>Choose image</button>
                            <img src={"http://localhost:3000/fixed-assets/header.jpg?t=" + imgUpdate}/>
                        </div>
                    </div>
                    {resourceTestRes && 
                        <React.Fragment>
                            <div className='resources-found'>
                                <div className='input-label'>Resources found:</div>
                                <ul>
                                    {resourceTestRes.found.map((f,i) => <li key={i}>
                                        <div>
                                            {testResourceNameMap[f]}
                                            <FaRegCircleCheck style={{color: 'green', marginLeft: '5px'}}/>
                                        </div>
                                    </li>)}
                                </ul>
                            </div>
                            <div className='resources-found'>
                                <div className='input-label'>Resources missing:</div>
                                <ul>
                                    {resourceTestRes.missing.map((m, i) => <li key={i}>
                                        {testResourceNameMap[m]} 
                                        &nbsp;
                                        {m in testResourceDownloadLinkMap && <a href={testResourceDownloadLinkMap[m]}>download</a>}
                                        &nbsp;
                                        {m in testResourcesExtraActions && 
                                            <button onClick={testResourcesExtraActions[m].action}>{testResourcesExtraActions[m].title}</button>
                                        }
                                    </li>)}
                                </ul>
                            </div>
                        </React.Fragment>
                    }
                    <div className='input-row'>
                        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                            <button style={{marginBottom: 0}} onClick={() => {
                                    cleanupMedia(getAllReferencedMediaNames(props.pages)).then(() => {
                                        setTidyMediaFinished(true)
                                    })
                                }}
                                disabled={tidyMediaFinished}>
                                Tidy media folder
                            </button>
                            {tidyMediaFinished && <FaRegCircleCheck style={{color: 'green', marginLeft: '5px'}}/>}
                        </div>
                    </div>
                </div>
                <div className='popup-buttons'>
                    <button 
                        onClick={() => props.close()}
                        className='popup-button popup-cancel'>Close</button>
                </div>
            </div>
        </div>
}

export type MoreToolsPopupProps = {
    close: () => void
    pages: Page[]
}