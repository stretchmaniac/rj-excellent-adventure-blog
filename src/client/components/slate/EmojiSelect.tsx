import React from "react"
import './../../assets/stylesheets/slate/toggle-button.scss'
import EmojiPicker from 'emoji-picker-react';

export default function EmojiSelect(props: EmojiSelectProps){
    const [awaitingMenu, setAwaitingMenu] = React.useState(false)
    const buttonRef = React.useRef<HTMLButtonElement>(null)

    return <button className={"toggle-button toggle-" + (awaitingMenu ? 'active' : 'inactive')}
        ref={buttonRef}
        title={props.title}
        onMouseDown={e => e.preventDefault()}
        onClick={() => {
            const pos = [0, 0]
            if(buttonRef.current){
                const r = buttonRef.current.getBoundingClientRect()
                pos[0] = r.left
                pos[1] = r.top + 20
            }
            // menu hook 
            setAwaitingMenu(true)
            props.clickToExitPopupHook({
                position: pos,
                onCancel: () => setAwaitingMenu(false),
                contents: <div onClick={(e) => e.stopPropagation()}>
                    <EmojiPicker 
                        onEmojiClick={emoji => props.onSelect(emoji.emoji)}/>
                </div>
            })
        }}>
        {props.children}
    </button>
}

export type EmojiSelectProps = {
    title: string
    children: React.ReactNode
    onSelect: (emoji: string) => void
    closeClickToExitPopup: () => void
    clickToExitPopupHook: (menuOpts: {position: Array<number>, contents: React.ReactNode, onCancel: () => void}) => void
}