import { Link, convertShorthandUrl } from "../../types/link"
import "../../assets/stylesheets/slate/link-viewer.scss"
import PageList from "../PageList"
import { homePageAlias } from "../../tools/empty-page"
import { Page } from "../../types/PageType"

export function LinkViewer(props: LinkViewerProps) {
    return <div className='link-viewer-root'>
        <div className='link-container'>
            {'url' in props.link ?
                <a href={convertShorthandUrl(props.link.url)}>
                    {convertShorthandUrl(props.link.url)}
                </a>
            :
                <PageList
                    pages={[!props.link.pageId ? homePageAlias() : props.pages.filter(p => p.id === (props.link as any).pageId)[0]]} 
                    selected={-1}
                    selectPage={() => {}}
                    noBorder={true}
                    noMargin={true}
                    />
            }
        </div>
        <div className='edit-container'>
            <button className='edit-button'
                onClick={props.onEdit}>
                edit
            </button>
        </div>
        <button className='delete-link-button'
            onClick={props.onDelete}>
            remove
        </button>
    </div>
}

export type LinkViewerProps = {
    link: Link
    pages: Page[]
    onEdit: () => void
    onDelete: () => void
}