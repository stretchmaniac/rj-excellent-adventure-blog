import React from 'react'
import { Editor, createEditor, Node, Transforms, Path, Range, Point } from 'slate'
import { Slate, Editable, withReact, RenderLeafProps, useSlate, RenderElementProps } from 'slate-react'
import { BaseEditor } from 'slate'
import { ReactEditor } from 'slate-react'
import './../assets/stylesheets/page-design.scss'
import Toolbar, { FormatState } from './slate/Toolbar'
import RenderedLeaf from './slate/RenderedLeaf'
import RenderedElement from './slate/RenderedElement'
import ClickToExitPopup, { ClickToExitPopupProps } from './ClickToExitPopup'
import { Page } from '../types/PageType'
import { Link } from '../types/link'
import { fixedBlogHeader } from '../tools/empty-page'

type CustomElement = { type: 'paragraph'; children: CustomText[] }
type CustomText = { text: string }

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor
    Element: CustomElement
    Text: CustomText
  }
}

const withInlinesAndVoids = (editor: Editor) => {
  // we need to manually specify inline elements so that slate doesn't silently 
  // delete them :(
  editor.isInline = el => ['a'].includes(el.type)
  editor.isVoid = el => ['media-child'].includes(el.type)
  return editor
}

const withNoEmptyLink = (editor: Editor) => {
  // delete links with no text
  const normalizeOriginal = editor.normalizeNode
  editor.normalizeNode = ([node, path]) => {
    if((node as any).type === 'a' && Node.string(node) === ''){
      Transforms.removeNodes(editor, {at: path})
      return
    }
    normalizeOriginal([node, path])
  }
  return editor
}

export default function PageDesign(props: PageDesignProps) {
    const [editor] = React.useState(() => {
      const res = withNoEmptyLink(withInlinesAndVoids(withReact(createEditor())))
      return res
    })

    editor.onChange = () => {
      props.onChange(editor.children)
    }

    const renderLeaf = React.useCallback((p: RenderLeafProps) => <RenderedLeaf {...p}/>, [])
    const renderEl = React.useCallback((p: RenderElementProps) => <RenderedElement {...p}/>, [])
    const [clickPopupState, setClickPopupState] = React.useState<ClickToExitPopupProps>({
      open: false,
      contents: '',
      closeHook: () => {},
      position: []
    })

    const rootRef = React.useRef<HTMLDivElement>(null)
    if(props.isBlogPost){
      maintainFixedHeader(editor, props.pageTitle, props.pageDate)
    }

    return <div className="page-design-root" ref={rootRef}>
      <ClickToExitPopup {...clickPopupState} />
      <Slate editor={editor} initialValue={props.designStruct} key={''+props.pageID}>
          <Toolbar getFormatState={getFormatState} 
            allPages={props.allPages}
            getSelectedText={getSelectedText}
            onFormatChange={(item, f) => {
              setMarkFormat(editor, item, f)
              setBlockFormat(editor, item, f)
            }}
            insertText={text => Transforms.insertText(editor, text)}
            insertMediaBox={() => insertMediaBox(editor)}
            clickToExitPopupHook={menuOpts => {
              // calculate relative position from menuOpts.position, which is relative to window
              if(rootRef.current){
                const r = rootRef.current.getBoundingClientRect()
                menuOpts.position[0] -= r.left 
                menuOpts.position[1] -= r.top
              }
              setClickPopupState({
                open: true,
                disableExitOnClick: menuOpts.disableClickToClose,
                contents: menuOpts.contents,
                position: menuOpts.position,
                closeHook: () => {
                  menuOpts.onCancel()
                  setClickPopupState({...clickPopupState, open: false})
                  // restore focus to editor
                  ReactEditor.focus(editor)
                }
              })
            }}
            closeClickToExitPopup={() => {
              setClickPopupState({...clickPopupState, open: false})
              // restore focus to editor
              ReactEditor.focus(editor)
            }}/>
          <Editable 
            className="slate-editable"
            renderLeaf={renderLeaf}
            renderElement={renderEl}
            spellCheck
            onKeyDown={e => handleKeyDown(editor, e)}/>
      </Slate>
    </div>
}

function maintainFixedHeader(editor: Editor, title: string, date: Date){
  const exp = fixedBlogHeader(title, date)
  // check if first children match exp
  let matches = true
  for(let i = 0; i < exp.length; i++){
    if(i >= editor.children.length){
      matches = false 
      break
    }
    const expEl = exp[i]
    const actEl = editor.children[i]
    if(!compareElRecursive(expEl, actEl)){
      matches = false
      break
    }
  }

  if(!matches){
    // delete all existing readOnly elements and insert exp
    editor.removeNodes({
      at: [],
      match: (n, p) => (n as any).readOnly
    })
    if(editor.children.length === 0){
      editor.insertNodes({type: 'paragraph', children:[{text:''}]}, {at: [0]})
    }
    editor.insertNodes(exp as any, {at: [0]})
  }

  return matches
}

function compareElRecursive(el1: any, el2: any): boolean {
  for(const key in el1){
    if(key !== 'children' && el1[key] !== el2[key]){
      return false
    }
  }
  if('children' in el1 && !('children' in el2) ||
      'children' in el2 && !('children' in el1)){
    return false
  }
  if(!('children' in el1)){
    return true
  }
  if(el1.children.length !== el2.children.length){
    return false
  }
  for(let i = 0; i < el1.children.length; i++){
    if(!compareElRecursive(el1.children[i], el2.children[i])){
      return false
    }
  }
  return true
}

function handleKeyDown(editor: Editor, e: React.KeyboardEvent<HTMLDivElement>){
  const formatState = getFormatStateLocal(editor)
  // when in a header or subheader, go to paragraph on enter key
  if(formatState.textTag !== 'paragraph'){
    if(e.code === 'Enter' && !e.shiftKey){
      setBlockFormat(editor, 'textTag', {
        ...formatState,
        textTag: 'paragraph'
      })
      e.preventDefault()
    }
  }
  if(formatState.list === 'ol' || formatState.list === 'ul'){
    // when in a list, make new list item when enter is pressed, UNLESS control is clicked
    // get path of list item above selection
    const lis = [...Editor.nodes(editor, {
      match: (n, path) => (n as any).type === 'li'
    })]
    let longestMatch = lis[0]
    for(let i = 1; i < lis.length; i++){
      if(lis[i][1].length > longestMatch[1].length){
        longestMatch = lis[i]
      }
    }
    if(!e.shiftKey && e.code === 'Enter'){
      const newPath = incrementPath(longestMatch[1])
      Transforms.insertNodes(editor, {
        type: 'li',
        children: [{
          type: 'paragraph',
          children: [{text: ''}]
        }]
      } as any, {
        at: newPath
      })
      Transforms.select(editor, newPath)
      e.preventDefault()
    }
    if(!e.shiftKey && e.code === 'Tab'){
      // wrap current li item in <u|ol>...</u|ol>, but only if there is a previous 
      // li node (i.e. at the same level)
      const prev = Editor.previous(editor, {at: longestMatch[1]})
      if(prev && (prev[0] as any).type === 'li'){
        Transforms.wrapNodes(editor, {
          type: 'list',
          listType: formatState.list,
          children: []
        } as any, {
          at: longestMatch[1]
        })
      }
    }
    else if(e.shiftKey && e.code === 'Tab'){
      const [listParent, listParentPath] = Editor.parent(editor, longestMatch[1])
      let resultPath = []
      if(listParent.children.length === 1){
        // remove the nested list entirely
        Transforms.unwrapNodes(editor, {
          at: listParentPath
        })
        resultPath = [...listParentPath]
      } else {
        // move this li outside its parent
        const target = [...listParentPath]
        target[target.length - 1]++
        Transforms.moveNodes(editor, {
          at: longestMatch[1],
          to: target
        })
        resultPath = [...target]
      }
      // check if li node is "naked" (no parent list element)
      const [resParent, resParentPath] = Editor.parent(editor, resultPath)
      if((resParent as any).type !== 'list'){
        Transforms.unwrapNodes(editor, {at: resultPath})
      }
    }
  }

  if(e.code === 'Tab'){
    e.preventDefault()
  }
}

function incrementPath(path: Array<number>){
  const copy = [...path]
  copy[copy.length - 1]++
  return copy
}

function getSelectedText(): string {
  const ed = useSlate()
  if(!ed.selection){
    return ''
  }
  const nodes = [...Editor.fragment(ed, ed.selection)]
  return nodes.map(d => Node.string(d)).join(' ')
}

function getFormatStateLocal(editorContext: Editor): FormatState {
  let lineSpacing = 1.15
  let textTag = 'paragraph'
  let textAlign = 'left'
  let blockQuote = false
  let link: Link | null = null
  let list = ''
  const textTags = ['h1', 'h2', 'paragraph']
  if(editorContext.selection){
    let cursorNodes = Node.ancestors(editorContext, editorContext.selection.focus.path)
    for(let [n, path] of cursorNodes){
      if('lineSpacing' in n){
        lineSpacing = n.lineSpacing as number
      }
      if('type' in n && textTags.indexOf(n.type) !== -1){
        textTag = n.type as string
      }
      if('type' in n && n.type as string === 'a'){
        link = (n as any).link
      }
      if('type' in n && n.type as string === 'blockquote'){
        blockQuote = true
      }
      if((n as any).type === 'list' && (n as any).listType === 'ol'){
        list = 'ol'
      }
      if((n as any).type === 'list' && (n as any).listType === 'ul'){
        list = 'ul'
      }
      if('textAlign' in n){
        textAlign = n.textAlign as string
      }
    }
  }
  return {
    bold: markActive(editorContext, 'bold'),
    italic: markActive(editorContext, 'italic'),
    underline: markActive(editorContext, 'underline'),
    strikethrough: markActive(editorContext, 'strikethrough'),
    fontSize: markValue(editorContext, 'fontSize', 'medium'),
    lineSpacing: lineSpacing,
    textTag: textTag,
    familyOnly: markActive(editorContext, 'familyOnly'),
    textAlign: textAlign,
    link: link,
    blockQuote: blockQuote,
    list: list
  }
}

function getFormatState(): FormatState {
  const editorContext = useSlate()
  return getFormatStateLocal(editorContext)
}

function markValue(editor: Editor, format: string, defaultVal: any) {
  let marks = Editor.marks(editor)
  if(!marks || !(marks as any)[format]){
    return defaultVal
  }
  return (marks as any)[format]
}

function markActive(editor: Editor, format: string): boolean {
  let marks = Editor.marks(editor)
  return !!marks && (marks as any)[format]
}

// applies ONLY leaf options from FormatState
function setMarkFormat(editor: Editor, changedItem: string, format: FormatState){
  const formats = ['bold', 'italic', 'underline', 'strikethrough', 'familyOnly']
  for(const f of formats){
    if(f !== changedItem){ continue; }
    if((format as any)[f]){
      Editor.addMark(editor, f, true)
    } else {
      Editor.removeMark(editor, f)
    }
  }
  if(changedItem === 'fontSize'){
    Editor.addMark(editor, 'fontSize', format.fontSize)
  }
}

function setBlockFormat(editor: Editor, changedItem: string, format: FormatState) {
  if(changedItem === 'lineSpacing'){
    setLineSpacing(editor, format.lineSpacing)
  } else if(changedItem === 'textTag'){
    setTextTag(editor, format.textTag)
  } else if(changedItem === 'textAlign'){
    setTextAlign(editor, format.textAlign)
  } else if(changedItem.startsWith('link:')){
    const linkText = changedItem.substring(5)
    setLink(editor, linkText, format.link as Link)
  } else if(changedItem === 'blockQuote'){
    setBlockQuote(editor, format.blockQuote)
  } else if(changedItem === 'list'){
    setList(editor, format.list)
  }
}

function orderedPts(range: Range){
  let p1, p2
  if(Range.isBackward(range)){
    p1 = range.focus
    p2 = range.anchor
  } else {
    p1 = range.anchor
    p2 = range.focus
  }
  return [p1, p2]
}

function nodeContainsRange(range: Range, node: Node, nodePath: Path){
  const [p1, p2] = orderedPts(range)
  return Path.compare(p1.path, nodePath) === 0 && Path.compare(p2.path, nodePath) === 0
}

function pointBeginsNode(pt: Point, node: Node, nodePath: Path){
  if(Path.compare(pt.path, nodePath) !== 0 || pt.path.length < nodePath.length){
    return false
  }
  const pathCopy = [...pt.path]
  for(let i = nodePath.length; i < pathCopy.length; i++){
    if(pathCopy[i] !== 0){
      return false
    }
  }
  return pt.offset === 0
}
function pointEndsNode(pt: Point, node: Node, nodePath: Path){
  if(Path.compare(pt.path, nodePath) !== 0 || pt.path.length < nodePath.length){
    return false
  }
  const pathCompare = [...nodePath]
  let workingNode = node
  while('children' in workingNode){
    pathCompare.push(workingNode.children.length - 1)
    workingNode = workingNode.children[workingNode.children.length - 1]
  }
  const offsetCheck = workingNode.text.length
  for(let i = 0; i < pt.path.length; i++){
    if(pt.path[i] !== pathCompare[i]){
      return false
    }
  }
  return offsetCheck === pt.offset
}

function rangeIntersectNode(range: Range, node: Node, nodePath: Path) : Range | null {
  if(rangeDisjointFromNodeContents(range, node, nodePath)){
    return null
  }
  let [p1, p2] = orderedPts(range)
  if(Path.compare(p1.path, nodePath) === -1){
    p1 = {
      path: nodePath,
      offset: 0
    }
  }
  if(Path.compare(p2.path, nodePath) === 1){
    p2 = {
      path: nodePath,
      offset: Node.string(node).length
    }
  }
  return {
    focus: p2,
    anchor: p1
  }
}

function rangeContainsNodeContents(range: Range, node: Node, nodePath: Path){
  const [p1, p2] = orderedPts(range)
  const p1Ok = Path.compare(p1.path, nodePath) === -1 || pointBeginsNode(p1, node, nodePath)
  const p2Ok = Path.compare(p2.path, nodePath) === 1 || pointEndsNode(p2, node, nodePath)
  return p1Ok && p2Ok
}

function rangeDisjointFromNodeContents(range: Range, node: Node, nodePath: Path){
  const [p1, p2] = orderedPts(range)
  const p1Before = Path.compare(p1.path, nodePath) === -1 || pointBeginsNode(p1, node, nodePath)
  const p2Before = Path.compare(p2.path, nodePath) === -1 || pointBeginsNode(p2, node, nodePath)
  const p1After = Path.compare(p1.path, nodePath) === 1 || pointEndsNode(p1, node, nodePath)
  const p2After = Path.compare(p2.path, nodePath) === 1 || pointEndsNode(p2, node, nodePath)
  
  return Point.equals(p1, p2) || p1Before && p2Before || p1After && p2After
}

function rangePartiallyOverlapsNodeContents(range: Range, node: Node, nodePath: Path){
  return !rangeContainsNodeContents(range, node, nodePath) && 
    !rangeDisjointFromNodeContents(range, node, nodePath)
}

function setTextTag(editor: Editor, tag: string) {
  const searchTypes = ['paragraph', 'h1', 'h2']
  if(editor.selection){
    if(Range.isCollapsed(editor.selection)){
      // insert new node, if applicable
      const [textNode, textNodePath] = [...Editor.nodes(editor, {
        at: [],
        match: (n, path) => searchTypes.indexOf((n as any).type) !== -1 && 
          nodeContainsRange(editor.selection as Range, n, path)
      })][0]
      const pt = editor.selection.anchor
      if(('type' in textNode) && textNode.type !== tag){
        if(Node.string(textNode).length === 0){
          // change this node type
          Transforms.setNodes(editor, {
            type: tag
          } as Partial<Node>, {
            at: textNodePath
          })
        } else {
          // if at end or beginning of node, insert node before or after. Otherwise split
          if(!pointBeginsNode(pt, textNode, textNodePath) && !pointEndsNode(pt, textNode, textNodePath)){
            Transforms.splitNodes(editor)
          }
          Transforms.insertNodes(editor, {
            type: tag,
            children: [{text: ''}]
          } as Node)
        }
      }
    } else {
      const overlapping = Editor.nodes(editor, {
        at: [],
        match: (n, path) => searchTypes.indexOf((n as any).type) !== -1 && (
          rangePartiallyOverlapsNodeContents(editor.selection as Range, n, path) ||
          rangeContainsNodeContents(editor.selection as Range, n, path)),
        reverse: true
      })
      const originalSelection = editor.selection
      for(const entry of overlapping){
        const [n, path] = entry
        if(rangeContainsNodeContents(originalSelection as Range, n, path)){
          // change over node type, if applicable
          if(('type' in n) && n.type !== tag){
            Transforms.setNodes(editor, {type: tag} as Partial<Node>, {
              at: path
            })
          }
        } else {
          // this is a partial overlap; split the node and add new node with correct type
          if(('type' in n) && n.type === tag){
            continue; // already has correct formatting
          }
          Transforms.select(editor, rangeIntersectNode(originalSelection, n, path) as Range)
          const removed = Node.string(Editor.fragment(editor, editor.selection)[0])
          Transforms.splitNodes(editor)
          Transforms.insertNodes(editor, {
            type: tag,
            children: [{text: removed}]
          } as Node)
        }
      }
    }
  }
}

function setLineSpacing(editor: Editor, lineSpacingVal: number){
  // every <p> that contains any part of the selection (or cursor)
  // will have line height changed to the lineSpacing
  // Note that it does NOT make sense to change line spacing on a line-by 
  // line basis, since varying screen widths will change the number of lines
  if(editor.selection){
    Transforms.setNodes(editor, { 'lineSpacing': lineSpacingVal } as Partial<Node>)
  }
}

function setBlockQuote(editor: Editor, quote: boolean){
  if(editor.selection){
    // check to see if we're in a blockquote
    const nodes = [...Editor.nodes(editor, {
      match: (n, path) => (n as any).type === 'blockquote'
    })]
    const inBlockQuote = nodes.length > 0
    if(quote === inBlockQuote){
      return
    }
    if(!quote){ // this means we're in a blockquote
      if(Range.isCollapsed(editor.selection)){
        const selPt = editor.selection.anchor
        const [bNode, bNodePath] = nodes[0]
        // if in middle of blockquote, split blockquote, otherwise add new paragraph before/after
        if(pointBeginsNode(selPt, bNode, bNodePath)){
          Transforms.insertNodes(editor, {
            type:'paragraph', 
            children:[{text: ''}]
          }, {
            at: bNodePath
          })
          Transforms.select(editor, bNodePath)
        } else if(pointEndsNode(selPt, bNode, bNodePath)){
          const newPath = [...bNodePath]
          newPath[newPath.length - 1]++
          Transforms.insertNodes(editor, {
            type:'paragraph', 
            children:[{text: ''}]
          }, {
            at: newPath
          })
          Transforms.select(editor, newPath)
        } else {
          const newPath = [...bNodePath]
          newPath[newPath.length - 1]++
          // split
          Transforms.splitNodes(editor, {
            match: (n, path) => (n as any).type === 'blockquote'
          })
          Transforms.insertNodes(editor, {
            type: 'paragraph',
            children: [{text: ''}]
          }, {
            at: newPath
          })
          Transforms.select(editor, newPath)
        }
      } else {
        const [bNode, bNodePath] = nodes[0]
        if(!pointBeginsNode(Range.start(editor.selection), bNode, bNodePath)){
          Transforms.splitNodes(editor, {
            at: Range.start(editor.selection),
            match: (n, path) => (n as any).type === 'blockquote'
          })
        }
        if(!pointEndsNode(Range.end(editor.selection), bNode, bNodePath)){
          Transforms.splitNodes(editor, {
            at: Range.end(editor.selection),
            match: (n, path) => (n as any).type === 'blockquote'
          })
        }
        Transforms.unwrapNodes(editor, {
          match: (n, path) => (n as any).type === 'blockquote' 
            && rangeContainsNodeContents(editor.selection as Range, n, path)
        })
      }
    } else { // this means we're NOT in a blockquote
      if(Range.isCollapsed(editor.selection)){
        // if we're currently in a paragraph with no text, wrap paragraph in blockquote
        const matchingPs = [...Editor.nodes(editor, {
          match: (n,p) => (n as any).type === 'paragraph' && Node.string(n).trim().length === 0
        })]
        if(matchingPs.length > 0){
          Transforms.wrapNodes(editor, {type: 'blockquote', children:[]} as any, {
            at: matchingPs[0][1] // path of first paragraph match
          })
        }
        else {
          // add new blockquote block item
          Transforms.insertNodes(editor, {type: 'blockquote', 
            children:[{
              type: 'paragraph',
              children: [{text: ''}]
            }]
          } as any)
        }
      } else {
        // wrap selection in blockquote
        Transforms.wrapNodes(editor, {type: 'blockquote', children:[]} as any, {
          split: true
        })
      }
    }
  }
}

function setTextAlign(editor: Editor, textAlign: string){
  if(editor.selection){
    Transforms.setNodes(editor, { 'textAlign': textAlign } as Partial<Node>, {
      match: (n, path) => ['h1', 'h2', 'paragraph'].includes((n as any).type)
    })
  }
}

export function selectionCompatibleWithLink(editor: Editor){
  if(editor.selection){
    // return true if the selection is entirely contained within a paragraph
    return [...Editor.nodes(editor, {
        match: (n, path) => 'type' in n && n.type === 'paragraph'
      })].length === 1
  }
  return false // need a selection to insert a link!
}

function setLink(editor: Editor, linkText: string, link: Link){
  if(!editor.selection){
    return
  }
  // Check if in a link element already. If so, remove that link entirely
  Transforms.unwrapNodes(editor, {
    at: editor.selection,
    match: (n, path) => (n as any).type === 'a'
  })
  
  // wrap selection in "a" tag
  const isCollapsed = Range.isCollapsed(editor.selection)
  if(isCollapsed){
    const currentNode = [...Editor.nodes(editor, {mode: 'lowest'})][0]
    const newTextNode = {...currentNode, text: linkText}
    Transforms.insertNodes(editor, {type: 'a', link: link, children:[newTextNode]} as any)
  } else {
    Transforms.wrapNodes(editor, {
      type: 'a', 
      link: link, 
      children: [],
    } as any, {
      split: true,
      match: (n, path) => 'text' in n
    })
    Transforms.collapse(editor, {edge: 'end'})
    // move out of link element
    Transforms.move(editor, {distance: 1, unit: 'offset'})
  }
  
  console.log('children', editor.children)
}

function setList(editor: Editor, list: string){
  const olEls = [...Editor.nodes(editor, {
    match: (n, path) => (n as any).type === 'list' && (n as any).listType === 'ol'
  })]
  const ulEls = [...Editor.nodes(editor, {
    match: (n, p) => (n as any).type === 'list' && (n as any).listType === 'ul'
  })]

  const inOl = olEls.length > 0
  const inUl = ulEls.length > 0

  if(editor.selection){
    if(Range.isCollapsed(editor.selection)){
      if(!inOl && !inUl && list !== ''){
        // if currently in empty paragraph, remove paragraph
        const matchingPs = [...Editor.nodes(editor, {
          match: (n,p) => (n as any).type === 'paragraph' && Node.string(n).trim().length === 0
        })]
        if(matchingPs.length > 0){
          Transforms.removeNodes(editor, {
            at: matchingPs[0][1]
          })
        }
        // add new list item
        Transforms.insertNodes(editor, {
          type: 'list',
          listType: list,
          children: [{
            type: 'li',
            children: [{
              type: 'paragraph',
              children: [{text: ''}]
            }]
          }]
        } as any)
      }
    } else {

    }
  }
}

function insertMediaBox(editor: Editor) {
  Transforms.splitNodes(editor)
  // add new media node at root level
  Transforms.insertNodes(editor, [{
    type: 'media-parent',
    caption: '',
    children: [{
      type: 'media-child',
      mediaType: '', // image, movie, photosphere
      size: 'medium', // small, medium, large
      caption: '',
      children: [{text: ''}]
    } as MediaChild]
  }, { // just always put paragraph after images
    type: 'paragraph',
    children: [{text: ''}]
  }] as any[])
}

export type MediaChild = {
  type: string,
  mediaType: string // empty string, image, movie photosphere
  size: string // small, medium, large
  caption: string // empty or non-empty
  children: Array<any>
}

export type PageDesignProps = {
  allPages: Array<Page>
  pageID: string
  pageTitle: string 
  pageDate: Date
  isBlogPost: boolean
  designStruct: any[]
  onChange: (design: any[]) => void
}