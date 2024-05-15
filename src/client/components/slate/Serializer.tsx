import ReactDOMServer from 'react-dom/server'

export function serializeToHTML(pageDesign: any[]){
    return pageDesign.map(child => 
        ReactDOMServer.renderToStaticMarkup(serializeInternal(child))
    ).join('\n')
}

function serializeInternal(child: any): React.ReactNode {
    const type = ('type' in child) ? child.type : ''
    if(type === 'header-container'){
        return serializeHeaderContainer(child)
    } else if(type === 'content-container'){
        return serializeContentContainer(child)
    }

    return ''
}

function serializeHeaderContainer(container: any): React.ReactNode {
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
        <h1>Placeholder header</h1>
    </div>
}

function serializeContentContainer(container: any): React.ReactNode {
    return <div style={{
        marginLeft: '10%',
        marginRight: '10%',
        maxWidth: '1125px',
        paddingTop: '5px'
    }}>
        <p>Placeholder content</p>
    </div>
}