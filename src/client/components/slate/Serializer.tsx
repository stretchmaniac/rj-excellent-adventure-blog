import ReactDOMServer from 'react-dom/server'

export function serializeToHTML(pageDesign: any[]){
    const state: SerializeState = {
        inHeaderContainer: false
    }
    return pageDesign.map(child => 
        ReactDOMServer.renderToStaticMarkup(serializeInternal(child, state))
    ).join('\n')
}

type SerializeState = {
    inHeaderContainer: boolean
}

function serializeInternal(child: any, state: SerializeState): React.ReactNode {
    const type = ('type' in child) ? child.type : ''
    if(type === 'header-container'){
        return serializeHeaderContainer(child, state)
    } else if(type === 'content-container'){
        return serializeContentContainer(child, state)
    }


    console.log('missed type:', child)
    return ''
}

function serializeHeaderContainer(container: any, state: SerializeState): React.ReactNode {
    if(container.hidden){
        return ''
    }
    return <div style={{
        width: '80%', 
        backgroundColor: '#25a186', 
        color: 'white', 
        paddingLeft: '10%', 
        paddingRight: '10%',
        paddingTop: '40px',
        paddingBottom: '40px',
        fontSize: '30px'
    }}>
        {container.children && 
            container.children.map(
                (c: any) => serializeInternal(c, {...state, inHeaderContainer: true})
            )
        }
    </div>
}

function serializeContentContainer(container: any, state: SerializeState): React.ReactNode {
    return <div style={{
        marginLeft: '10%',
        marginRight: '10%',
        maxWidth: '1125px',
        paddingTop: '5px'
    }}>
        {container.children && 
            container.children.map((c: any) => serializeInternal(c, {...state}))
        }
    </div>
}