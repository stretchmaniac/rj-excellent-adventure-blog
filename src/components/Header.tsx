import './../assets/stylesheets/header.scss'

export function Header() {
    return <div className='header-root'>
        <span className='header-title'>Rick and Julie's Excellent Blog Tool</span>
        <div className='header-option-block'>
            <button>Save</button>
            <button>Load</button>
            <button>Settings</button>
        </div>
    </div>
}