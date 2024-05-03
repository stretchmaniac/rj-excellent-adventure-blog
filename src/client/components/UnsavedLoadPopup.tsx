import './../assets/stylesheets/new-page-popup.scss'
import './../assets/stylesheets/popup-common.scss'
import './../assets/stylesheets/form-common.scss'

export function UnsavedLoadPopup(props: UnsavedLoadPopupProps) {
    return <div className='popup-fullscreen'>
            <div className='popup-root'>
                <div className='popup-header'>
                    Change Mirror with Unsaved Data
                </div>
                <div className='popup-content'>
                    <p>
                        You have made changes which have not been saved to a mirror folder.
                        This will happen if you make or edit pages before selecting a mirror.
                        You have two options:
                        <ol>
                            <li>
                                <strong>Merge</strong>: 
                                Unsaved pages will be added to the mirrored folder as new pages,
                                even if they have the same name as an existing page.
                            </li>
                            <li>
                                <strong>Load</strong>:
                                Unsaved pages will be discarded.
                            </li>
                        </ol>
                    </p>
                </div>
                <div className='popup-buttons'>
                    <button 
                        onClick={() => props.onComplete('merge')}
                        className='popup-button popup-continue'>Merge</button>
                    <button 
                        onClick={() => props.onComplete('load')}
                        className='popup-button popup-continue'>Load</button>
                </div>
            </div>
        </div>
}

export type UnsavedLoadPopupProps = {
    onComplete: (choice: string) => void
}