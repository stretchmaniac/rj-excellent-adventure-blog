import { RenderLeafProps } from "slate-react";
import { fontMap } from "../../tools/font-size";

export default function RenderedLeaf(props: RenderLeafProps){
    const leaf = props.leaf as any
    let result = props.children
    if(leaf.bold){
        result = <strong>{result}</strong>
    }
    if(leaf.italic){
        result = <em>{result}</em>
    }
    if(leaf.underline){
        result = <u>{result}</u>
    }
    if(leaf.strikethrough){
        result = <s>{result}</s>
    }

    const style: any = {}
    if(leaf.fontSize){
        style.fontSize = fontMap(leaf.fontSize) + 'px'
    }
    if(leaf.familyOnly){
        style.backgroundImage = `repeating-linear-gradient(
            45deg, rgba(255,0,0,.3), transparent 1px, transparent 3px
        )`
    }
    if(leaf.font){
        style.fontFamily = leaf.font
    }

    return <span style={style} {...props.attributes}>{result}</span>
}