import './../assets/stylesheets/confirm-popup.scss'
import './../assets/stylesheets/popup-common.scss'

export default function ConfirmPopup(props: ConfirmPopupProps) {
    return <div className='popup-fullscreen'>
        <div className='popup-root'>
            <div className='popup-header'>
                    {props.header}
            </div>
            <div className='popup-content'>
                {props.body}
            </div>
            <div className='popup-buttons'>
                <button 
                    onClick={() => props.choiceCallback(false)}
                    className='popup-button popup-cancel'>Cancel</button>
                <button 
                    onClick={() => props.choiceCallback(true)}
                    className='popup-button popup-continue'
                    style={{backgroundColor: props.confirmColor}}>{props.confirmString}</button>
            </div>
        </div>
    </div>
}

export type ConfirmPopupProps = {
    header: string
    body: string
    confirmString: string
    confirmColor: string
    choiceCallback: (confirmed: boolean) => void
}