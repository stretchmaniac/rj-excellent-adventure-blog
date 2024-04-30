import { Page } from "../types/PageType"
import '../assets/stylesheets/page-list.scss'

export default function PageList(props: PageListProps){
    if(props.pages.length === 0){
        return <div className="page-list-nothing-parent">
            <span className="page-list-nothing-span">no pages</span>
        </div>
    }
    return <div className='page-list-something-parent'>
        {props.pages.map((p,i) => 
            <div className={"page-list-entry" + (i == props.selected ? ' page-list-entry-selected' : '')}
                onClick={() => props.selectPage(i)}
                key={i}>
                <span className="page-list-entry-title">{p.title}</span>
                <span className="page-list-entry-date">{p.date.toDateString()}</span>
            </div>
        )}
    </div>
}

export type PageListProps = {
    pages: Array<Page>
    selected: number
    selectPage: (index: number) => void
}