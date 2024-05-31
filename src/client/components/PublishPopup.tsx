import React from 'react'
import './../assets/stylesheets/new-page-popup.scss'
import './../assets/stylesheets/popup-common.scss'
import './../assets/stylesheets/form-common.scss'
import './../assets/stylesheets/publish-popup.scss'
import { runCmdTask } from '../tools/http'

export function PublishPopup(props: PublishPopupProps) {
    const [awsSyncDryrunOutput, setAwsSyncDryrunOutput] = React.useState('')
    const [awsSyncError, setAwsSyncError] = React.useState(false)
    const [awsSyncDryrunLoading, setAwsSyncDryrunLoading] = React.useState(false)

    const [awsSyncLoading, setAwsSyncLoading] = React.useState(false)
    const [awsSyncComplete, setAwsSyncComplete] = React.useState(false)
    return <div className='popup-fullscreen'>
        <div className='popup-root'>
            <div className='popup-header'>
                Publish to wherearerickandjulie.alankoval.com
            </div>
            <div className='popup-content'>
                <p>
                    The following command will determine what files will be uploaded to the wherearerickandjulie.alankoval.com s3 bucket,
                    without performing any data transfer.
                </p>
                <div className='publish-command-row'>
                    <button className='publish-command-button'
                        onClick={() => {
                            setAwsSyncDryrunLoading(true)
                            runCmdTask('aws sync dryrun').then(result => {
                                setAwsSyncError(!result.success)
                                setAwsSyncDryrunOutput(processDryRunOutput(result.output))
                                setAwsSyncDryrunLoading(false)
                            })
                        }}
                        >{awsSyncDryrunLoading ? 'Loading...' : 'Run Command'}</button>
                    <div className='publish-command-text'>aws s3 sync "{props.previewDirectory}\preview" s3://wherearerickandjulie.alankoval.com --dryrun --delete</div>
                </div>
                <p>
                    Output:
                </p>
                <div className='publish-command-output' style={awsSyncError ? {color: '#960000'} : {}}>
                    {awsSyncDryrunOutput}
                </div>
                <p>The following command will upload all files found above to the s3 bucket.</p>
                <div className='publish-command-row'>
                    <button className='publish-command-button-dangerous'
                        onClick={() => {
                            setAwsSyncLoading(true)
                            runCmdTask('aws sync').then(() => {
                                setAwsSyncLoading(false)
                                setAwsSyncComplete(true)
                            })
                        }}>
                        {awsSyncLoading ? 'Loading...' : 'Run Command'}
                    </button>
                    <div className='publish-command-text'>aws s3 sync "{props.previewDirectory}\preview" s3://wherearerickandjulie.alankoval.com --delete</div>
                </div>
                <p>
                    {awsSyncComplete ? <span style={{color: 'green'}}>Sync Complete</span> : ''}
                </p>
            </div>
            <div className='popup-buttons'>
                <button 
                    onClick={props.close}
                    className='popup-button popup-cancel'>Close</button>
            </div>
        </div>
    </div>
}

function processDryRunOutput(output: string): string {
    const lines = output.split('\n')
    const newLines = []
    let currentPhotosphereId = ''
    let currentMatchFound = false
    for(let line of lines){
        const match = line.match(/_([a-z0-9]+-\w+-\w+-\w+-\w+)_ps[\/\\].+ to s3:\/\/wherearerickandjulie\.alankoval\.com/)
        if(match){
            const lineId = match[1] // match[0] is the full match, match[1] the capturing group
            if(lineId === currentPhotosphereId){
                if(!currentMatchFound){
                    newLines.push('   OUTPUT POST PROCESSOR: <additional photosphere sub-folders omitted>')
                    currentMatchFound = true
                }
            } else {
                newLines.push(line)
                currentPhotosphereId = lineId
                currentMatchFound = false
            }
        } else {
            newLines.push(line)
        }
    }
    return newLines.join('\n')
}

export type PublishPopupProps = {
    close: () => void
    previewDirectory: string
}