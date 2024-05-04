export function WaitingPopup(props: WaitingPopupProps){
    return <div className='popup-fullscreen'>
    <div className='popup-root'>
        <div className='popup-content'>
            <p>
                {props.message}
            </p>
        </div>
    </div>
</div>
}

export type WaitingPopupProps = {
    message: string
}