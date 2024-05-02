import { Page } from "../types/PageType"
import '../assets/stylesheets/page-list.scss'
import { getReadableDateString } from "../tools/date"

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
                {p.title.split('\n').map((line, i) => 
                    <span className="page-list-entry-title" key={i}>{line}</span>
                )}
                <span className="page-list-entry-date">{getReadableDateString(p.date)}</span>
            </div>
        )}
    </div>
}

export type PageListProps = {
    pages: Array<Page>
    selected: number
    selectPage: (index: number) => void
}