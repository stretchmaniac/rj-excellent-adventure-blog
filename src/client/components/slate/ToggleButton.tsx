import React from "react"
import './../../assets/stylesheets/slate/toggle-button.scss'

export default function ToggleButton(props: ToggleButtonProps) {
    return <button title={props.title} 
        className={'toggle-button' + (props.active ? ' toggle-active' : ' toggle-inactive')}
        onClick={() => props.onChange(!props.active)}
        onMouseDown={e => e.preventDefault()}>
        {props.children}
    </button>
}

export type ToggleButtonProps = {
    children: React.ReactNode
    active: boolean
    title: string
    onChange: (active: boolean) => void
}