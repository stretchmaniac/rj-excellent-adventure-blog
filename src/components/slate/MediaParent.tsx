import { RenderElementProps } from "slate-react"

export function MediaParent(props: RenderElementProps){
    const el = props.element
    // mediaChildren, mediaChildCaptions and parentCaption will contain 
    // JSX nodes, NOT elements. However, the props.children elements 
    // will mirror the element children
    const mediaChildren = []
    const mediaChildrenSizes: string[] = []
    const mediaChildCaptions: any[] = []
    let parentCaption = null
    for(let i = 0; i < el.children.length; i++){
        const c = el.children[i] as any
        if(c.type === 'media-child'){
            mediaChildren.push(props.children[i])
            mediaChildrenSizes.push(c.size)
            mediaChildCaptions.push(i < el.children.length - 1 && 
                (el.children[i+1] as any).type === 'media-child-caption' ?
                props.children[i+1] : null
            )
        }
        else if(c.type === 'media-parent-caption'){
            parentCaption = props.children[i]
        }
    }
    return <div className="media-parent" {...props.attributes}>
        <div className="media-parent-image-row">
            {mediaChildren.map((c, i) => <div 
                className={'media-child-with-caption ' + mediaChildrenSizes[i] + '-box'}
                key={''+i}>
                {c}
                {mediaChildCaptions[i]}
            </div>)}
        </div>
        <div className="media-parent-caption">
            {parentCaption}
        </div>
    </div>
}