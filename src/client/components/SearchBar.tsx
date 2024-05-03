import './../assets/stylesheets/search-bar.scss'

export default function SearchBar(props: SearchBarProps) {
    return <div className="search-bar-parent">
        <input className="search-bar-input" 
            placeholder="Search All Pages"
            onChange={e => props.onChange(e.target.value)}></input>
    </div>
}

export type SearchBarProps = {
    onChange: (searchText: string) => void
}