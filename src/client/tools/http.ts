import { BlogState } from "../types/blog-state"
import { ReferencedMedia, sortPages } from "./empty-page"
import { GeneratedPreview } from "./preview"

export function isPhotosphere(stableRelativePath: string): Promise<boolean> {
    const lastSlash = stableRelativePath.lastIndexOf('/')
    return new Promise((resolve, reject) => {
        fetch('http://localhost:3000/check-if-photosphere', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify({fileName: stableRelativePath.substring(lastSlash + 1, stableRelativePath.length)})
        })
        .then(response => response.text())
        .then(data => resolve(JSON.parse(data).isPhotosphere))
        .then(error => {})
    })
}

export function cacheImageSearchFolders(folders: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        fetch('http://localhost:3000/cache-image-search-folders', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify({folders: folders})
        })
        .then(response => response.text())
        .then(data => resolve())
        .then(error => {})
    })
}

export type ImageCacheResult = {
    found: boolean,
    absolutePath: string
}

export function searchCachedImageFolders(fileName: string): Promise<ImageCacheResult> {
    return new Promise((resolve, reject) => {
        fetch('http://localhost:3000/search-cached-image-folders', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify({fileName: fileName})
        })
        .then(response => response.text())
        .then(data => {
            const res = JSON.parse(data)
            if(res.success){
                resolve({found: true, absolutePath: res.path})
            } else {
                resolve({found: false, absolutePath: ''})
            }
        })
        .then(error => {})
    })
}

export function setPreview(preview: GeneratedPreview): Promise<boolean> {
    const mapToArr = (map: Map<string, string>) => {
        const res: string[] = []
        for(const key of map.keys()){
            res.push(key)
            res.push(map.get(key) as string)
        }
        return res
    }
    const refMediaMapToArr = (map: Map<ReferencedMedia, string>) => {
        const res: any[] = []
        for(const key of map.keys()){
            res.push(key)
            res.push(map.get(key) as string)
        }
        return res
    }
    const jsonPreview = {
        ...preview,
        pageIdToFolderName: mapToArr(preview.pageIdToFolderName),
        imageCopyMap: refMediaMapToArr(preview.imageCopyMap)
    }
    return new Promise((resolve, reject) => {
        fetch('http://localhost:3000/serve-preview', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify(jsonPreview)
        })
        .then(response => response.text())
        .then(data => resolve(JSON.parse(data).success))
        .then(error => {})
    })
}

export function cleanupMedia(referencedMedia: ReferencedMedia[]): Promise<void> {
    return new Promise((resolve, reject) => {
        fetch('http://localhost:3000/media-cleanup', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify({referencedMedia: referencedMedia})
        })
        .then(response => response.text())
        .then(data => resolve())
        .then(error => {})
    })
}

export function chooseFiles(multiple: boolean): Promise<string[]> {
    const queryParams = '?multiple=' + multiple
    return new Promise((resolve, reject) => {
        fetch("http://localhost:3000/choose-files" + queryParams, {
            method: 'GET',
            mode: 'cors',
            headers: {
                "Content-Type": 'text/plain'
            }
        }).then(response => response.text())
        .then(data => resolve(data.split('\n').map(s => s.trim()).filter(s => s.length > 0)))
        .then(error => {})
    })
}

export function runCmdTask(type: string): Promise<any> {
    return new Promise((resolve, reject) => {
        fetch('http://localhost:3000/cmd-task', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: type
        })
        .then(response => response.text())
        .then(data => resolve(JSON.parse(data)))
        .then(error => {})
    })
}

export function copyResource(path: string, targetFolder: string, rename: string | null, noResize: boolean): Promise<string> {
    return new Promise((resolve, reject) => {
        fetch('http://localhost:3000/copy-resource', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify({path: path, targetFolder: targetFolder, rename: rename !== null ? rename : '', noResize: noResize})
        })
        .then(response => response.text())
        .then(data => resolve(JSON.parse(data).path))
        .then(error => {})
    })
}

export function chooseFolder(): Promise<string> {
    return new Promise((resolve, reject) => {
        fetch("http://localhost:3000/choose-folder", {
            method: 'GET',
            mode: 'cors',
            headers: {
                "Content-Type": 'text/plain'
            }
        })
        .then(response => response.text())
        .then(data => resolve(data))
        .then(error => {})
    })
}

// result is whether setting root directory was success or not
export function setMirrorDirectory(dir: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        fetch('http://localhost:3000/set-root-directory', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: dir
        })
        .then(response => response.text())
        .then(data => {
            const res = JSON.parse(data)
            resolve(res.success)
        })
        .then(error => {})
    })
}

export function mergeData(state: BlogState) : Promise<void> {
    return new Promise((resolve, reject) => {
        loadData().then(loaded => {
            // merge data here...
            const merged: BlogState = {
                pages: sortPages([...loaded.pages, ...state.pages]),
                config: loaded.config
            }
            if(!merged.config.fixedBlogPostFooterDesign){
                merged.config.fixedBlogPostFooterDesign = state.config.fixedBlogPostFooterDesign
            }
    
            setData(merged).then(() => resolve())
        })
    })
}

export function setData(state: BlogState) : Promise<void> {
    return new Promise((resolve, reject) => {
        fetch('http://localhost:3000/set-data', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify(state)
        })
        .then(response => response.text())
        .then(data => resolve())
        .then(error => {})
    })
}

export type ResourceTestResult = {
    found: string[]
    missing: string[]
}
export function testResources(): Promise<ResourceTestResult> {
    return new Promise((resolve, reject) => {
        fetch('http://localhost:3000/test-resources', {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain'
            }
        }).then(response => response.text())
        .then(data => {
            resolve(JSON.parse(data) as ResourceTestResult)
        })
    })
}

export function loadData(): Promise<BlogState> {
    // generate random number for cache busting
    return new Promise((resolve, reject) => {
        fetch('http://localhost:3000/load-data?q=' + crypto.randomUUID(), {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain'
            }
        })
        .then(response => response.text())
        .then(data => {
            const res = JSON.parse(data)
            if(res.success){
                // convert any "date" field to actual date object
                convertDateRecursive(res.blogState)
                sortPages(res.blogState.pages)
                const legacyPromises: Promise<boolean>[] = []
                convertLegacyMediaRecursive(res.blogState, legacyPromises)
                Promise.all(legacyPromises).then(() => {
                    resolve(res.blogState)
                })
            } else {
                reject(res.reason)
            }
        })
        .then(error => {})
    })
}

function convertLegacyMediaRecursive(obj: any, donePromises: Promise<boolean>[]) {
    if(!obj){
        return
    }
    // these are properties that have existed on Media since the beginning
    if('unstableAbsoluteOriginalPath' in obj && 'stableRelativePath' in obj && 'type' in obj && 
        ['IMAGE', 'PHOTOSPHERE', 'VIDEO'].includes(obj.type)
    ){
        // this is a Media object
        // delete resizeBehavior, if present (never did anything)
        if('resizeBehavior' in obj){
            delete obj.resizeBehavior
        }
        // if hasCompressedPhotosphereFolder doesn't exist, check for it
        if(!('hasCompressedPhotosphereFolder' in obj)){
            const ps = isPhotosphere(obj.stableRelativePath)
            ps.then(isPS => obj.hasCompressedPhotosphereFolder = isPS)
            donePromises.push(ps)
        }
    } else {
        // recurse through object
        for(const prop in obj){
            if((typeof obj[prop]) === 'object'){
                convertLegacyMediaRecursive(obj[prop], donePromises)
            }
        }
    }
}

function convertDateRecursive(obj: any){
    for(const prop in obj){
        if(prop === 'date'){
            obj[prop] = new Date(Date.parse(obj[prop]))
        }
        if((typeof obj[prop]) === 'object'){
            convertDateRecursive(obj[prop])
        }
    }
}