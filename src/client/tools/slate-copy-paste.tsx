import { Editor, Range, Transforms } from "slate";
import { getNodeAtPath } from "../components/PageDesign";

export function withCopyPaste(editor: Editor){
    editor.insertFragmentData = (data: DataTransfer) => {
        const dataStr = data.getData('application/x-slate-fragment')
        if(dataStr !== ''){
            const fragmentRaw = JSON.parse(decodeURIComponent(window.atob(dataStr)))
            // strip any parent 'content-container' or 'header-container' nodes
            const fragment = []
            for(const f of fragmentRaw){
                if(['content-container', 'header-container'].includes(f.type)){
                    fragment.push(...f.children)
                } else {
                    fragment.push(f)
                }
            }

            // if the selection is contained within a 'media-child' entity, only 
            // perform paste if the source is a media-child entry too
            let imgOverride = false
            if(editor.selection && Range.isCollapsed(editor.selection)){
                const pUp = [...editor.selection.anchor.path]
                pUp.pop()
                if(getNodeAtPath(editor, pUp).type === 'media-child'){
                    imgOverride = true
                    // look for first media-child in fragment and copy over
                    const srcChild = findMediaChild(fragment)
                    if(srcChild){
                        console.log('srcChild', srcChild)
                        Transforms.setNodes(editor, {content: srcChild.content} as Partial<Node>, {
                            at: pUp
                        })
                    }
                }
            }

            if(!imgOverride){
                Transforms.insertFragment(editor, fragment)
            }
        } else {
            // try html, then text

            // TODO html
            const textData = data.getData('text/plain')
            Transforms.insertText(editor, textData)
        }
        return true
    }
    return editor
}

function findMediaChild(nodes: any[]): any {
    for(const node of nodes){
        if(node.type === 'media-child'){
            return node
        } else if(node.children){
            const res = findMediaChild(node.children)
            if(res){ return res }
        }
    }
    return null
}