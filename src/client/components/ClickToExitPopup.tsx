import React from "react"
import './../assets/stylesheets/click-to-exit-popup.scss'
import './../assets/stylesheets/slate/hyperlink-select.scss'
import './../assets/stylesheets/popup-common.scss'

export default function ClickToExitPopup(props: ClickToExitPopupProps){
    return <React.Fragment>
        {props.open ? 
        <div className="menu-background"
            onClick={() => !props.disableExitOnClick && props.closeHook()}>
            <div className="menu-root" onClick={e => e.stopPropagation()}
                style={{left: props.position[0] + 'px', top: props.position[1] + 'px'}}>
                {props.contents}
            </div>
        </div>
        : ''}
    </React.Fragment>
}

export type ClickToExitPopupProps = {
    open: boolean
    closeHook: () => void
    position: Array<number>
    contents: React.ReactNode
    disableExitOnClick?: boolean
}