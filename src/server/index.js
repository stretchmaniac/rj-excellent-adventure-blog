const express = require('express')
const cors = require('cors')
const spawn = require('child_process').spawn;
const fs = require('fs');
const { randomUUID } = require('crypto');
const { spawnSync } = require('child_process');

const app = express()
app.use(express.json())
app.use(express.text({limit: '100mb'}))

const port = 3000

// only accept requests from localhost client
const corsOptions = {
    origin: 'http://localhost:8080'
}
app.use(cors(corsOptions))

console.log('starting server on port ' + port)
let rootDir = null

app.post('/cmd-task', cors(corsOptions), function (req, res){
    const type = req.body
    if(type === 'install pillow'){
        spawnSync('python', ['-m', 'pip', 'install', 'Pillow'])
    }
    if(type === 'install numpy'){
        spawnSync('python', ['-m', 'pip', 'install', 'numpy'])
    }

    res.send()
})

app.post('/serve-preview', cors(corsOptions), async function(req, res){
    if(rootDir === null){
        res.send(JSON.stringify({success: false, reason: 'Mirror directory has not been set'}))
        return
    }
    // if there is no preview folder in root directory, create one
    if(!fs.existsSync(rootDir + '/preview')){
        fs.mkdirSync(rootDir + '/preview')
    }
    const data = JSON.parse(req.body)
    // write html files, css files, and js files to preview directory
    fs.writeFileSync(rootDir + '/preview/home.html', data.homeHtml)
    fs.writeFileSync(rootDir + '/preview/home.css', data.homeCss)
    fs.writeFileSync(rootDir + '/preview/home.js', data.homeJs)

    fs.writeFileSync(rootDir + '/preview/older-posts.html', data.olderPostsHtml)
    fs.writeFileSync(rootDir + '/preview/older-posts.css', data.olderPostsCss)
    fs.writeFileSync(rootDir + '/preview/older-posts.js', data.olderPostsJs)

    // re-create page folders
    const pageIdToFolderName = arrToMap(data.pageIdToFolderName)
    for(const folder of pageIdToFolderName.values()){
        if(fs.existsSync(rootDir + '/preview/' + folder)){
            // remove all files in folder (removing folder entirely had issues -- see https://github.com/nodejs/node/issues/32001 )
            fs.readdirSync(rootDir + '/preview/' + folder)
                .forEach(f => fs.rmSync(rootDir + '/preview/' + folder + '/' + f, {recursive: true, force: true}))
        } else {
            fs.mkdirSync(rootDir + '/preview/' + folder)
        }
    }
    // delete page folders not in use
    const inUse = [...pageIdToFolderName.values()]
    const unusedFolderNames = fs.readdirSync(rootDir + '/preview', { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(name => !inUse.includes(name))
    for(const unused of unusedFolderNames){
        fs.rmSync(rootDir + '/preview/' + unused, {recursive: true, force: true})
    }

    // copy images to page folders 
    const imgCopyMap = arrToMap(data.imageCopyMap)
    for(const media of imgCopyMap.keys()){
        const mediaSrc = media.fileName
        const mediaType = media.type
        const dest = imgCopyMap.get(media)

        const extI = mediaSrc.lastIndexOf('.')
        const extWithPeriod = mediaSrc.substring(extI)
        const base = mediaSrc.substring(0, extI)
        if(mediaType === 'IMAGE'){
            const srcNames = [] // do not copy original
            for(const name of IMAGE_SIZE_NAMES){
                srcNames.push(base + '_' + name + extWithPeriod)
            }
            for(const src of srcNames){
                fs.copyFileSync(rootDir + '/media/' + src, rootDir + '/preview/' + dest + '/' + src)
            }
        } else if(mediaType === 'PHOTOSPHERE'){
            // copy _ps folder
            fs.cpSync(rootDir + '/media/' + base + '_ps', rootDir + '/preview/' + dest + '/' + base + '_ps', {recursive: true})
        } else if(mediaType === 'VIDEO'){
            // copy original 
            const src = media.fileName
            fs.copyFileSync(rootDir + '/media/' + src, rootDir + '/preview/' + dest + '/' + src)
        }
        
    }
    // copy fixed-assets folder
    fs.cpSync(rootDir + '/fixed-assets', rootDir + '/preview', {recursive: true})

    // copy page html, css and js files to page folder
    const orderedIds = data.pagesHtmlIds
    const orderedPageHtml = data.pagesHtml
    const orderedPageCss = data.pagesCss
    const orderedPageJs = data.pagesJs
    for(let i = 0; i < orderedIds.length; i++){
        const id = orderedIds[i]
        const folderName = pageIdToFolderName.get(id)
        fs.writeFileSync(rootDir + '/preview/' + folderName + '/page.html', orderedPageHtml[i])
        fs.writeFileSync(rootDir + '/preview/' + folderName + '/styles.css', orderedPageCss[i])
        fs.writeFileSync(rootDir + '/preview/' + folderName + '/page.js', orderedPageJs[i])
    }

    res.send(JSON.stringify({success: true}))
})

function arrToMap(arr){
    const map = new Map()
    for(let i = 0; i < arr.length; i += 2){
        map.set(arr[i], arr[i+1])
    }
    return map
}

app.get('/preview', cors(corsOptions), function(req, res){
    res.sendFile(rootDir + '/preview/home.html')
})

app.get('/test-resources', cors(corsOptions), function(req, res){
    const found = []
    const missing = ['pannellum', 'powershell', 'image magick', 'hugin', 'python', 'pillow', 'numpy', 'open sans', 'lora', 'rock salt']
    // test for powershell 7
    try {
        spawnSync('pwsh', ['-version'])
        found.push('powershell')
        missing.splice(missing.indexOf('powershell'), 1)
    }
    catch(e) { }
    // test for image magick
    try {
        spawnSync('magick', ['-version'])
        found.push('image magick')
        missing.splice(missing.indexOf('image magick'), 1)
    }
    catch(e) { }
    // test for python 3
    try {
        const res = spawnSync('python', ['--version'], { encoding: 'utf-8' })
        if(res.stdout.match(/Python 3/g)){
            found.push('python')
            missing.splice(missing.indexOf('python'), 1)
        }
    }
    catch(e) { }
    // test for pillow
    if(found.indexOf('python') !== -1){
        const res = spawnSync('python', ['-m', 'pip', 'show', 'Pillow'], { encoding: 'utf-8' })
        if(res.stderr.trim().length === 0){
            found.push('pillow')
            missing.splice(missing.indexOf('pillow'), 1)
        }
    }
    // test for numpy
    if(found.indexOf('python') !== -1){
        const res = spawnSync('python', ['-m', 'pip', 'show', 'numpy'], { encoding: 'utf-8' })
        if(res.stderr.trim().length === 0){
            found.push('numpy')
            missing.splice(missing.indexOf('numpy'), 1)
        }
    }
    // test for hugin
    try {
        const res = spawnSync('nona', {encoding: 'utf-8'})
        if(res.stderr.startsWith('nona: No output prefix')){
            found.push('hugin')
            missing.splice(missing.indexOf('hugin'), 1)
        }
    }
    catch(e) { }

    if(rootDir !== null){
        // test for pannellum folder
        if(fs.existsSync(rootDir + '/fixed-assets/pannellum.htm') && 
            fs.existsSync(rootDir + '/fixed-assets/pannellum.css') &&
            fs.existsSync(rootDir + '/fixed-assets/pannellum.js')){
            found.push('pannellum')
            missing.splice(missing.indexOf('pannellum'), 1)
        }

        // test for open-sans font
        const suffixes = ['italic', 'regular']
        for(let size of ['300', '500', '600', '700', '800']){
            for(let it of ['italic', '']){
                suffixes.push(size + it)
            }
        }
        if(suffixes.map(s => 
                fs.existsSync(rootDir + '/fixed-assets/open-sans-v40-latin-' + s + '.woff2')
            ).filter(s => s).length === suffixes.length){
            found.push('open sans')
            missing.splice(missing.indexOf('open sans'), 1)
        }

        // test for lora font
        const lSuffixes = ['500', '500italic', '600', '600italic', '700', '700italic', 'italic', 'regular']
        if(lSuffixes.map(s => 
            fs.existsSync(rootDir + '/fixed-assets/lora-v35-latin-' + s + '.woff2')
        ).filter(s => s).length === lSuffixes.length){
            found.push('lora')
            missing.splice(missing.indexOf('lora'), 1)
        }

        // test for rock salt font
        if(fs.existsSync(rootDir + '/fixed-assets/rock-salt-v22-latin-regular.woff2')){
            found.push('rock salt')
            missing.splice(missing.indexOf('rock salt'), 1)
        }
    }
    
    res.send(JSON.stringify({found: found, missing: missing}))
})

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
    const referencedMedia = JSON.parse(req.body).referencedMedia
    const referencedImageUUIDs = referencedMedia.filter(r => r.type === 'IMAGE').map(r => {
        const matches = r.fileName.match(/_.*-.*-.*-/g)
        return matches[matches.length - 1]
    })
    const referencedPhotosphereUUIDs = referencedMedia.filter(r => r.type === 'PHOTOSPHERE').map(r => {
        const matches = r.fileName.match(/_.*-.*-.*-/g)
        return matches[matches.length - 1]
    })
    const referencedVideoUUIDs = referencedMedia.filter(r => r.type === 'VIDEO').map(r => {
        const matches = r.fileName.match(/_.*-.*-.*-/g)
        return matches[matches.length - 1]
    })
    // delete anything in media folder that isn't in referenced but conforms to 
    // uuid structure
    const fileNames = fs.readdirSync(rootDir + '/media', { withFileTypes: true })
        .filter(dirent => !dirent.isDirectory())
        .map(dirent => dirent.name)
    for(let f of fileNames){
        if(f.match(/_.*-.*-.*-.*\./g) && referencedImageUUIDs.filter(uuid => f.includes(uuid)).length === 0 &&
                referencedPhotosphereUUIDs.filter(uuid => f.includes(uuid)).length === 0 &&
                referencedVideoUUIDs.filter(uuid => f.includes(uuid)).length === 0){
            console.log('removing media:', rootDir + '/media/' + f)
            fs.unlinkSync(rootDir + '/media/' + f)
        }
    }
    // go through photosphere preview folders
    const folderNames = fs.readdirSync(rootDir + '/media', { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
    for(let f of folderNames){
        if(f.match(/_.*-.*-.*-.*_ps/g) && referencedPhotosphereUUIDs.filter(uuid => f.includes(uuid)).length === 0 &&
                referencedImageUUIDs.filter(uuid => f.includes(uuid)).length === 0){ // images might still switch over to photospheres
            console.log('removing media folder:', rootDir + '/media/' + f)
            fs.rmSync(rootDir + '/media/' + f, {recursive: true, force: true})
        }
    }

    res.send(JSON.stringify({success: true}))
})

app.post('/check-if-photosphere', cors(corsOptions), function(req, res){
    if(rootDir === null){
        res.send(JSON.stringify({success: false, reason: 'No mirror directory set', isPhotosphere: false}))
        return
    }
    const info = JSON.parse(req.body)
    const fileName = info.fileName 
    const extI = fileName.lastIndexOf('.')
    const woExt = fileName.substring(0, extI)
    const absPath = rootDir + '/media/' + woExt + '_ps/config.json'
    const isPhotosphere = fs.existsSync(absPath)
    res.send(JSON.stringify({isPhotosphere: isPhotosphere}))
})

// this is a map string name => list of file names
let cachedSearchFolderContents = {}
app.post('/cache-image-search-folders', cors(corsOptions), function(req, res){
    const info = JSON.parse(req.body)
    const folders = info.folders.map(f => f.endsWith('/') || f.endsWith('\\') ? f.substring(0, f.length - 1) : f)

    cachedSearchFolderContents = {}

    for(let i = 0; i < folders.length; i++){
        const f = folders[i]
        if(!fs.existsSync(f)){
            console.log(`cache-image-search-folders: folder ${f} does not exist!`)
            continue
        }
        const allRead = fs.readdirSync(f, { withFileTypes: true })
        const childFileNames = allRead.filter(dirent => !dirent.isDirectory())
            .map(dirent => dirent.name)
        const childFolderNames = allRead.filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)
        // do recursive search
        folders.push(...childFolderNames.map(n => f + '/' + n))
        console.log(`cached ${childFileNames.length} files from ${f}`)
        cachedSearchFolderContents[f] = childFileNames
    }

    res.send(JSON.stringify({success: true}))
})

app.post('/search-cached-image-folders', cors(corsOptions), function(req, res){
    const info = JSON.parse(req.body)
    const fileName = info.fileName 
    let absPath = ''
    for(let folder in cachedSearchFolderContents){
        const files = cachedSearchFolderContents[folder]
        if(files.includes(fileName)){
            absPath = folder + '/' + fileName 
            break
        }
    }
    res.send(JSON.stringify({success: absPath !== '', path: absPath}))
})

const IMAGE_SIZE_NAMES = ['small', 'medium', 'large', 'x-large']
const IMAGE_SIZE_WIDTHS = [700, 1200, 1800, 2400]
app.post('/copy-resource', cors(corsOptions), function(req, res){
    if(rootDir === null){
        res.send(JSON.stringify({success: false, reason: 'No mirror directory set'}))
        return
    }
    const info = JSON.parse(req.body)
    const srcPath = info.path
    const targetFolder = info.targetFolder
    const noResize = info.noResize
    const rename = info.rename

    const parts = srcPath.split(/(\/|\\)/g)
    const last = parts[parts.length - 1]
    const split = last.split('.')
    const ext = split[split.length - 1]
    const name = split.slice(0, split.length - 1).join('.')
    // check if target folder exists
    if(!fs.existsSync(rootDir + '/' + targetFolder)){
        fs.mkdirSync(rootDir + '/' + targetFolder)
    }
    
    // save to target folder, return path
    const uuid = randomUUID()
    const renameQ = rename.trim().length > 0
    const newPath = renameQ ? 
        targetFolder + '/' + rename + '.' + ext :
        targetFolder + '/' + name + '_' + uuid + '.' + ext
    fs.copyFileSync(srcPath, rootDir + '/' + newPath)

    if(!noResize && ['png', 'jpg', 'JPG', 'jpeg', 'JPEG', 'bmp'].indexOf(ext) !== -1){
        // generate resized versions using image magick
        // small 350 x infinity
        // medium 600 x infinity
        // large 900 x infinity
        // x-large 1200 x infinity
        const magickPromises = []
        for(let i = 0; i < IMAGE_SIZE_NAMES.length; i++){
            const sizeName = IMAGE_SIZE_NAMES[i]
            const width = IMAGE_SIZE_WIDTHS[i]
            magickPromises.push(new Promise((resolve, reject) => {
                const dest = renameQ ? 
                    rootDir + '/' + targetFolder + '/' + rename + '_' + sizeName + '.' + ext :
                    rootDir + '/' + targetFolder + '/' + name + '_' + uuid + '_' + sizeName + '.' + ext
                spawn('magick', [
                    rootDir + '/' + newPath, 
                    '-resize', 
                    width + 'x10000',
                    '-quality',
                    '70',
                    dest
                ]).on('close', () => {
                    resolve()
                })
            }))
        }

        // generate photosphere resized versions using nona
        const photospherePromise = new Promise((resolve, reject) => {
            const dest = renameQ ? 
                    rootDir + '/' + targetFolder + '/' + rename + '_ps' :
                    rootDir + '/' + targetFolder + '/' + name + '_' + uuid + '_ps'
            spawn('python', [
                './src/server/photosphere_generate.py',
                '-n',
                'nona',
                '-o',
                dest,
                rootDir + '/' + newPath
            ]).on('close', () => {
                resolve()
            }).on('error', (err) => {
                console.log(err)
            })
        })

        Promise.all([...magickPromises, photospherePromise]).then(() => {
            res.send(JSON.stringify({success: true, path: newPath}))
        })
    } else {
        res.send(JSON.stringify({success: true, path: newPath}))
    }
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
    app.use('/preview', express.static(serve + '/preview'))
    app.use('/fixed-assets', express.static(serve + '/fixed-assets'))

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

    const child = spawnSync('pwsh.exe', ['-Command', './src/server/openFile.ps1', '' + (multiple ? 1 : 0)], {
        encoding: 'utf-8',
        shell: 'pwsh.exe'
    })

    res.type('txt')
    res.send(child.stdout.trim())
})

app.listen(port)

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
            page.title.replaceAll(/[^a-zA-Z0-9_]/g, '_') +
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