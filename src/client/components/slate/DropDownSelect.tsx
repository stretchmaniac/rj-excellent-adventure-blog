import './../../assets/stylesheets/slate/toggle-button.scss'
import './../../assets/stylesheets/slate/drop-down-select.scss'
import React from 'react'
import { ClickToExitPopupProps } from '../ClickToExitPopup'

export default function DropDownSelect(props: DropDownSelectProps) {
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
            props.clickToExitPopupHook({
                position: pos,
                contents: <div>
                    {props.optionsRendering.map((el, index) => <div 
                        key={index}
                        className={props.options[index] === props.selected ? 'option-row-selected' : 'option-row'}
                        onClick={() => {
                        if(props.selected !== props.options[index]){
                            props.onChange(props.options[index])
                        }
                        props.closeClickToExitPopup()
                        setAwaitingMenu(false)
                    }}>
                        {el}
                    </div>)}
                </div>,
                onCancel: () => setAwaitingMenu(false)
            })
            setAwaitingMenu(true)
        }}>
        {props.children}
    </button>
}

export type DropDownSelectProps = {
    children: React.ReactNode
    title: string
    options: Array<string>
    optionsRendering: Array<React.ReactNode>
    selected: string
    onChange: (selected: string) => void
    closeClickToExitPopup: () => void
    clickToExitPopupHook: (menuOpts: {position: Array<number>, contents: React.ReactNode, onCancel: () => void}) => void
}