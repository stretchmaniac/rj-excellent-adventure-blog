import '../assets/stylesheets/toggle-button-group.scss'

export default function ToggleButtonGroup(props: ToggleButtonsProps){
    return <div className="toggle-button-group-parent">
        {props.options.map((option, index) => <button 
            key={index}
            className={"toggle-button-" + (index === props.selected ? "active" : "inactive")}
            onClick={() => props.onChange(index)}>
            {option}
        </button>)}
    </div>
}

export type ToggleButtonsProps = {
    options: Array<string>,
    selected: number,
    onChange: (value: number) => void
}