const express = require('express')
const cors = require('cors')
const spawn = require('child_process').spawn;
const fs = require('fs');
const { randomUUID } = require('crypto');

const app = express()
app.use(express.json())
app.use(express.text())

const port = 3000

// only accept requests from localhost client
const corsOptions = {
    origin: 'http://localhost:8080'
}
app.use(cors(corsOptions))

console.log('starting server on port ' + port)
let rootDir = null

app.post('/media-cleanup', cors(corsOptions), function(req, res){
    if(rootDir === null){
        res.send(JSON.stringify({success: true}))
        return
    }
    // check for media folder 
    if(!fs.existsSync(rootDir + '/media')){
        // no need for clean-up if there is no media folder
        res.send(JSON.stringify({success: true}))
        return
    }

    // get referenced file names from request body
    const referenced = JSON.parse(req.body).referencedPaths
    // delete anything in media folder that isn't in referenced but conforms to 
    // uuid structure
    const fNames = fs.readdirSync(rootDir + '/media', { withFileTypes: true })
        .filter(dirent => !dirent.isDirectory())
        .map(dirent => dirent.name)
    for(let f of fNames){
        if(f.match(/_.*-.*-.*-.*\./g) && referenced.indexOf(f) === -1){
            console.log('removing media:', rootDir + '/media/' + f)
            fs.unlinkSync(rootDir + '/media/' + f)
        }
    }
    res.send(JSON.stringify({success: true}))
})

app.post('/copy-resource', cors(corsOptions), function(req, res){
    if(rootDir === null){
        res.send(JSON.stringify({success: false, reason: 'No mirror directory set'}))
        return
    }
    const info = JSON.parse(req.body)
    const srcPath = info.path
    const parts = srcPath.split(/(\/|\\)/g)
    const last = parts[parts.length - 1]
    const split = last.split('.')
    const ext = split[split.length - 1]
    const name = split.slice(0, split.length - 1).join('.')
    // check if media folder exists
    if(!fs.existsSync(rootDir + '/media')){
        fs.mkdirSync(rootDir + '/media')
    }
    
    // save to media folder, return path
    const newPath = 'media/' + name + '_' + randomUUID() + '.' + ext
    fs.copyFileSync(srcPath, rootDir + '/' + newPath)
    res.send(JSON.stringify({success: true, path: newPath}))
})

app.post('/set-data', cors(corsOptions), function(req, res){
    if(rootDir === null){
        res.send(JSON.stringify({success: false, reason: 'No mirror directory set'}))
        return
    }
    const blogState = JSON.parse(req.body)
    const config = blogState.config 
    const pages = blogState.pages

    // first write to config file
    const configFName = rootDir + '/' + configFileName()
    fs.writeFileSync(configFName, JSON.stringify(config, null, 2))

    // delete all page-like folders in rootDir 
    // that don't correspond to existing pages
    const childFolderNames = fs.readdirSync(rootDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
    const pageMap = {}
    for(const childFolder of childFolderNames){
        if(folderNamePageLike(childFolder) && fs.existsSync(rootDir+'/'+childFolder+'/'+pageFileName())){
            // check for page id
            const pageId = JSON.parse(fs.readFileSync(rootDir+'/'+childFolder+'/'+pageFileName())).id
            const filtered = pages.filter(p => p.id === pageId)
            if(pageId && filtered.length === 0){
                fs.rmSync(rootDir + '/' + childFolder, {recursive: true, force: true})
            } else if(filtered.length > 0){
                pageMap[pageId] = rootDir + '/' + childFolder
            }
        }
    }

    const pageFolders = pageFolderNames(pages)
    for(let i = 0; i < pages.length; i++){
        const page = pages[i]
        const folderName = page.id in pageMap ? pageMap[page.id] : rootDir + '/' + pageFolders[i]
        if(!fs.existsSync(folderName)){
            // create the folder
            fs.mkdirSync(folderName)
        }
        // overwrite page file
        const pageFile = folderName + '/' + pageFileName()
        fs.writeFileSync(pageFile, JSON.stringify(page, null, 2))
        // rename directory to current
        fs.renameSync(folderName, rootDir + '/' + pageFolderName(page))
    }
    res.send(JSON.stringify({success: true}))
})

app.get('/load-data', cors(corsOptions), function(req, res){
    if(rootDir === null){
        res.send(JSON.stringify({success: false, reason: 'No mirror directory set'}))
        return
    }
    const configFName = rootDir + '/' + configFileName()
    let config = {
        localSaveFolder: rootDir
    }
    if(fs.existsSync(configFName)){
        config = JSON.parse(fs.readFileSync(configFName))
    }

    const pages = []
    // looks for any folder representing a page
    const childFolderNames = fs.readdirSync(rootDir + '/', { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
    for(let f of childFolderNames){
        if(folderNamePageLike(f) && fs.existsSync(rootDir + '/' + f + '/' + pageFileName())){
            pages.push(JSON.parse(fs.readFileSync(rootDir + '/' + f + '/' + pageFileName())))
        }
    }

    res.send(JSON.stringify({success: true, blogState: {pages: pages, config: config}}))
})

app.post('/set-root-directory', cors(corsOptions), function(req, res){
    rootDir = req.body.trim()
    if(!rootDir || rootDir === ''){
        rootDir = null
        res.send({success: false, reason: 'Provided root directory is empty'})
        return
    }
    if(!fs.existsSync(rootDir)){
        res.send({success: false, reason: 'Directory does not exit'})
        return
    }
    const serve = rootDir.replaceAll("\\", "/")
    console.log('setting root directory', serve)
    // serve files from rootDir
    app.use('/media', express.static(serve + '/media'))

    res.send({success: true})
})


app.get('/choose-folder', cors(corsOptions), function(req, res){
    const child = spawn('powershell.exe', ['-Command', './src/server/openFolder.ps1'])

    let consoleOut = ''
    child.stdout.setEncoding('utf-8')
    child.stdout.on('data', data => consoleOut += data.toString().trim())

    child.stderr.setEncoding('utf-8')
    child.stderr.on('data', data => console.log(data.toString()))

    child.on('close', () => {
        res.type('txt')
        res.send(consoleOut)
    })
})

/*
    Query (url) parameters:
      multiple=('true'|'false;)
*/
app.get('/choose-files', cors(corsOptions), function(req, res){
    const multiple = req.query.multiple === 'true'

    const child = spawn('pwsh.exe', ['-Command', './src/server/openFile.ps1', '1'])

    let consoleOut = ''
    child.stdout.setEncoding('utf-8')
    child.stdout.on('data', data => consoleOut += data.toString())

    child.stderr.setEncoding('utf-8')
    child.stderr.on('data', data => console.log(data.toString()))

    child.on('close', () => {
        res.type('txt')
        res.send(consoleOut.trim())
    })
})

app.listen(port)

spawn('pwsh.exe', ['-Command', './src/server/openFile.ps1', '1'])

function getRootPageDirs(){

}

function pageFileName() {
    return 'page.json'
}

function configFileName() {
    return 'rj-blog-config.json'
}

function folderNamePageLike(folderName) {
    return !!folderName.match(/_rj.{8}$/g)
}

function pageFolderName(page){
    return getDateInputStr(page.date) + 
            '_' + 
            page.title.replaceAll(/\s/g, '_') +
            '_rj' + page.id.substring(0, 8)
}

function pageFolderNames(pages) {
    const res = []
    for(let page of pages){
        res.push(pageFolderName(page))
    }
    return res
}

function getDateInputStr(date){
    const d = new Date(Date.parse(date))
    const month = d.getMonth() + 1
    const day = d.getDate()
    return d.getFullYear() + '-' + 
        (month < 10 ? '0' + month : month) + '-' +
        (day < 10 ? '0' + day : day)
}