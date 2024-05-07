import './../../assets/stylesheets/slate/toolbar.scss'
import { BiBold, BiItalic, BiUnderline, BiStrikethrough, BiSolidQuoteAltLeft  } from 'react-icons/bi'
import { MdFormatListNumbered, MdOutlineFormatLineSpacing, MdOutlineEmojiEmotions, MdOutlineLink, MdFormatListBulleted  } from "react-icons/md";
import { VscTextSize } from "react-icons/vsc"
import { FaHouseChimney, FaRegImage, FaRegImages } from "react-icons/fa6";
import { GrTextAlignCenter, GrTextAlignLeft, GrTextAlignRight } from "react-icons/gr";
import ToggleButton from './ToggleButton'
import DropDownSelect from './DropDownSelect'
import EmojiSelect from './EmojiSelect';
import ClickToExitPopup from '../ClickToExitPopup';
import HyperlinkSelect from './HyperlinkSelect';
import { Page } from '../../types/PageType';
import { Link } from '../../types/link';
import { useSlate } from 'slate-react';
import { selectionCompatibleWithLink } from '../PageDesign';
import { Editor, Transforms } from 'slate';
import { Media, registerMedia } from '../../tools/media';
import { chooseFiles } from '../../tools/http';

export default function Toolbar(props: ToolbarProps) {
    const editor = useSlate()

    // when changing editor state, slate does not change the selection.
    // there doesn't appear to be a "is valid range" function, so we gotta 
    // do it the dirty way
    try {
        props.getFormatState()
    }
    catch(e) {
        Transforms.deselect(editor)
    }

    const formatState = props.getFormatState()

    return <div className="toolbar-root">
        <ToggleButton title="bold" 
            active={formatState.bold} 
            onChange={active => props.onFormatChange('bold', {
                ...formatState,
                bold: active
            })}> 
            <BiBold className="react-icons"/> 
        </ToggleButton>
        <ToggleButton title="italic"
            active={formatState.italic}
            onChange={active => props.onFormatChange('italic', {
                ...formatState,
                italic: active
            })}>
            <BiItalic className="react-icons"/>
        </ToggleButton>
        <ToggleButton title="underline"
            active={formatState.underline}
            onChange={active => props.onFormatChange('underline', {
                ...formatState,
                underline: active
            })}>
            <BiUnderline className="react-icons"/>
        </ToggleButton>
        <ToggleButton title="strikethrough"
            active={formatState.strikethrough}
            onChange={active => props.onFormatChange('strikethrough', {
                ...formatState,
                strikethrough: active
            })}>
            <BiStrikethrough className="react-icons"/>
        </ToggleButton>
        <DropDownSelect title="line spacing"
            options={['1', '1.15', '1.5', '2', '2.5', '3']}
            optionsRendering={['1', '1.15', '1.5', '2', '2.5', '3']}
            selected={'' + formatState.lineSpacing}
            onChange={opt => {props.onFormatChange('lineSpacing', {
                    ...formatState,
                    lineSpacing: Number.parseFloat(opt)
                })
            }}
            clickToExitPopupHook={props.clickToExitPopupHook}
            closeClickToExitPopup={props.closeClickToExitPopup}>
            <MdOutlineFormatLineSpacing className="react-icons"/>
        </DropDownSelect>
        <ToggleButton title="align left"
            active={formatState.textAlign === 'left'}
            onChange={active => active && formatState.textAlign !== 'left' && 
                props.onFormatChange('textAlign', {
                    ...formatState,
                    textAlign: 'left'
                })
            }>
            <GrTextAlignLeft className="react-icon-small"/>
        </ToggleButton>
        <ToggleButton title="align center"
            active={formatState.textAlign === 'center'}
            onChange={active => active && formatState.textAlign !== 'center' &&
                props.onFormatChange('textAlign', {
                    ...formatState,
                    textAlign: 'center'
                })
            }>
            <GrTextAlignCenter className="react-icon-small"/>
        </ToggleButton>
        <ToggleButton title="align right"
            active={formatState.textAlign === 'right'}
            onChange={active => active && formatState.textAlign !== 'right' &&
                props.onFormatChange('textAlign', {
                    ...formatState,
                    textAlign: 'right'
                })
            }>
            <GrTextAlignRight className="react-icon-small"/>
        </ToggleButton>
        <DropDownSelect title="text style"
            options={['h1', 'h2', 'paragraph', 'small', 'x-small', 'xx-small']}
            optionsRendering={[
                <span style={{fontWeight: 'bold'}}>Heading</span>,
                <span style={{fontWeight: 'bold', fontSize: 'small'}}>Sub-Heading</span>,
                <span>Paragraph</span>,
                <span style={{fontSize: 'small'}}>Small</span>,
                <span style={{fontSize: 'x-small'}}>Smaller</span>,
                <span style={{fontSize: 'xx-small'}}>Smallest</span>
            ]}
            selected={formatState.textTag !== 'paragraph' ? formatState.textTag : 
                formatState.fontSize === 'medium' ? 'paragraph' : formatState.fontSize
            }
            onChange={opt => {
                let newTag = ''
                let newFontSize = ''
                if(opt === 'h1' || opt === 'h2'){
                    newTag = opt
                    newFontSize = ''
                }
                else if(opt === 'paragraph'){
                    newTag = 'paragraph'
                    newFontSize = 'medium'
                }
                else {
                    newTag = 'paragraph'
                    newFontSize = opt
                }
                if(newTag !== formatState.textTag){
                    props.onFormatChange('textTag', {...formatState, textTag: newTag})
                }
                if(newFontSize !== formatState.fontSize){
                    props.onFormatChange('fontSize', {...formatState, fontSize: newFontSize})
                }
            }}
            clickToExitPopupHook={props.clickToExitPopupHook}
            closeClickToExitPopup={props.closeClickToExitPopup}>
            <VscTextSize className="react-icons"/>
        </DropDownSelect>
        { /*<ToggleButton title="family only"
            active={formatState.familyOnly}
            onChange={active => props.onFormatChange('familyOnly', {
                ...formatState,
                familyOnly: active
            })}>
            <FaHouseChimney className="react-icon-small"/>
        </ToggleButton> */ }
        <EmojiSelect
            title="emoji"
            closeClickToExitPopup={props.closeClickToExitPopup}
            clickToExitPopupHook={props.clickToExitPopupHook}
            onSelect={emoji => props.insertText(emoji)}>
            <MdOutlineEmojiEmotions className="react-icons" />
        </EmojiSelect>
        <HyperlinkSelect title="link"
            allPages={props.allPages}
            getSelectedText={props.getSelectedText}
            closeClickToExitPopup={props.closeClickToExitPopup}
            clickToExitPopupHook={props.clickToExitPopupHook}
            enabled={selectionCompatibleWithLink(editor)}
            onInsert={(insertionText, link) => props.onFormatChange(
                'link:' + insertionText,
                {
                    ...formatState,
                    link: link
                }
            )}>
            <MdOutlineLink className="react-icons" />
        </HyperlinkSelect>
        <ToggleButton 
            title="block quote"
            active={formatState.blockQuote}
            onChange={active => active !== formatState.blockQuote && 
                props.onFormatChange('blockQuote', 
                    {...formatState, blockQuote: active}
                )
            }>
            <BiSolidQuoteAltLeft className="react-icons" />
        </ToggleButton>
        <ToggleButton
            title="bulleted list"
            active={formatState.list === 'ul'}
            onChange={active => props.onFormatChange('list', {
                ...formatState,
                list: active ? 'ul' : ''
            })}>
            <MdFormatListBulleted className="react-icons" />
        </ToggleButton>
        <ToggleButton
            title="numbered list"
            active={formatState.list === 'ol'}
            onChange={active => props.onFormatChange('list', {
                ...formatState,
                list: active ? 'ol' : ''
            })}>
            <MdFormatListNumbered className="react-icons" />
        </ToggleButton>
        <ToggleButton 
            title="image/movie/photosphere"
            active={false}
            onChange={active => props.insertMediaBox()}>
            <FaRegImage className="react-icon-small" />
        </ToggleButton>
        <ToggleButton
            title="multi image/movie/photosphere"
            active={false}
            onChange={active => {
                chooseFiles(true).then(files => {
                    const mediaPromises = files.map(f => registerMedia(f))
                    Promise.allSettled(mediaPromises).then(results => {
                        props.bulkInsertMedia([...results].map(r => (r as any).value))
                    })
                })
            }}>
            <FaRegImages className='react-icons' />
        </ToggleButton>
    </div>
}

export type ToolbarProps = {
    allPages: Array<Page>
    getSelectedText: () => string
    insertText: (text: string) => void
    insertMediaBox: () => void
    bulkInsertMedia: (media: Media[]) => void
    getFormatState: () => FormatState
    onFormatChange: (changedItem: string, newState: FormatState) => void
    closeClickToExitPopup: () => void
    clickToExitPopupHook: (menuOpts: {position: Array<number>, contents: React.ReactNode, onCancel: () => void, disableClickToClose?: boolean}) => void
}

export type FormatState = {
    bold: boolean 
    italic: boolean 
    underline: boolean
    strikethrough: boolean
    fontSize: string // 'medium', 'small', 'x-small', 'xx-small'
    lineSpacing: number
    textTag: string // h1, h2, ..., hk or paragraph
    familyOnly: boolean
    textAlign: string // left, center, right
    link: Link | null
    blockQuote: boolean
    list: string // ul, ol, or empty string
}