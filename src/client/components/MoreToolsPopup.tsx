import './../assets/stylesheets/new-page-popup.scss'
import './../assets/stylesheets/popup-common.scss'
import './../assets/stylesheets/form-common.scss'
import './../assets/stylesheets/more-tools-popup.scss'
import { ResourceTestResult, chooseFiles, chooseFolder, cleanupMedia, copyResource, runCmdTask, testResources } from '../tools/http'
import { getAllReferencedMedia } from '../tools/empty-page'
import { Page } from '../types/PageType'
import React from 'react'
import { FaRegCircleCheck } from "react-icons/fa6";
import { BlogConfig } from '../types/blog-config'

export function MoreToolsPopup(props: MoreToolsPopupProps) {
    const [tidyMediaFinished, setTidyMediaFinished] = React.useState(false)
    const [imgUpdate, setImgUpdate] = React.useState(0)
    const [resourceTestRes, setResourceTestRes] = React.useState<ResourceTestResult | null>(null)
    const [footerParseFailed, setFooterParseFailed] = React.useState(false)
    const [footerParsed, setFooterParsed] = React.useState<any[]>(props.config.fixedBlogPostFooterDesign)

    React.useEffect(() => {
        testResources().then(v => setResourceTestRes(v))
    }, [])
    const testResourceNameMap = {
        'powershell': 'Powershell 7',
        'image magick': 'Image Magick',
        'pannellum': 'Pannellum',
        'hugin': 'nona on PATH through Hugin',
        'python': 'Python 3',
        'pillow': 'Pillow for Python',
        'numpy': 'numpy for Python',
        'open sans': 'Open Sans Font',
        'lora': 'Lora Font',
        'rock salt': 'Rock Salt Font',
        'aws': 'AWS Command Line Interface (CLI)',
        'aws creds': 'AWS CLI Credentials ("aws sts get-caller-identity")'
    } as any
    const testResourceExtraDescription = {
        'aws creds': 'Run \"aws configure\" in a CMD window, and provide the access tokens received from Alan. ' +
            'For \"Default region name\", type \"us-east-1\". For \"Default output format\" type \"table\".'
    } as any
    const testResourceDownloadLinkMap = {
        'powershell': 'https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell-on-windows?view=powershell-7.4',
        'image magick': 'https://imagemagick.org/archive/binaries/ImageMagick-7.1.1-32-Q16-HDRI-x64-dll.exe',
        'pannellum': 'https://github.com/mpetroff/pannellum/releases/download/2.5.6/pannellum-2.5.6.zip',
        'hugin': 'https://sourceforge.net/projects/hugin/files/hugin/hugin-2023.0/Hugin-2023.0.0-win64.msi/download',
        'python': 'https://www.python.org/ftp/python/3.12.3/python-3.12.3-amd64.exe',
        'open sans': 'https://gwfh.mranftl.com/api/fonts/open-sans?download=zip&subsets=latin&variants=300,500,600,700,800,300italic,regular,italic,500italic,600italic,700italic,800italic&formats=woff2',
        'lora': 'https://gwfh.mranftl.com/api/fonts/lora?download=zip&subsets=latin&variants=500,600,700,regular,italic,500italic,600italic,700italic&formats=woff2',
        'rock salt': 'https://gwfh.mranftl.com/api/fonts/rock-salt?download=zip&subsets=latin&variants=regular&formats=woff2',
        'aws': 'https://awscli.amazonaws.com/AWSCLIV2.msi'
    } as any
    const testResourcesExtraActions = {
        'pillow': {
            title: 'Run "pip install Pillow" (requires python)',
            action: () => {
                setResourceTestRes(null)
                runCmdTask('install pillow').then(() => {
                    testResources().then(v => setResourceTestRes(v))
                })
            }
        },
        'numpy': {
            title: 'Run "pip install numpy" (requires python)',
            action: () => {
                setResourceTestRes(null)
                runCmdTask('install numpy').then(() => {
                    testResources().then(v => setResourceTestRes(v))
                })
            }
        },
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
        },
        'lora': {
            title: 'Choose extracted lora-v35-latin folder',
            action: () => {
                chooseFolder().then(f => {
                    const suffixes = ['500', '500italic', '600', '600italic', '700', '700italic', 'italic', 'regular']
                    const promises = suffixes.map(s => {
                        const name = 'lora-v35-latin-' + s
                        return copyResource(f + '/' + name + '.woff2', 'fixed-assets', name, true)
                    })
                    Promise.all(promises).then(() => {
                        testResources().then(v => setResourceTestRes(v))
                    })
                })
            }
        },
        'rock salt': {
            title: 'Choose extracted rock-salt-v22-latin folder',
            action: () => {
                chooseFolder().then(f => {
                    const name = 'rock-salt-v22-latin-regular'
                    copyResource(f + '/' + name + '.woff2', 'fixed-assets', name, true).then(() => {
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
                    <div className='input-row'>
                        <span className='input-label'>Blog post footer</span>
                        <div className='sub-input-row'>
                            <textarea
                                rows={15}
                                defaultValue={JSON.stringify(props.config.fixedBlogPostFooterDesign, null, 2)}
                                onChange={e => {
                                    try {
                                        const v = JSON.parse(e.target.value)
                                        for(const el of v){
                                            if(!el.readOnly){
                                                el.readOnly = true
                                            }
                                        }
                                        setFooterParsed(v)
                                        setFooterParseFailed(false)
                                    } catch(e) {
                                        setFooterParseFailed(true)
                                    }
                                }} />
                        </div>
                        {footerParseFailed && <span className='input-label' style={{color: 'red'}}>JSON parse failed</span>}
                    </div>
                    {!resourceTestRes && 
                        <div>Loading...</div>
                    }
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
                                        {m in testResourceExtraDescription && 
                                            <div>{testResourceExtraDescription[m]}</div>
                                        }
                                    </li>)}
                                </ul>
                            </div>
                        </React.Fragment>
                    }
                    <div className='input-row'>
                        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                            <button style={{marginBottom: 0}} onClick={() => {
                                    cleanupMedia(getAllReferencedMedia(props.pages)).then(() => {
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
                        onClick={() => {
                            props.close()
                            props.setConfig({...props.config, fixedBlogPostFooterDesign: footerParsed})
                        }}
                        className='popup-button popup-cancel'>Close</button>
                </div>
            </div>
        </div>
}

export type MoreToolsPopupProps = {
    close: () => void
    pages: Page[]
    config: BlogConfig
    setConfig: (newConfig: BlogConfig) => void
}