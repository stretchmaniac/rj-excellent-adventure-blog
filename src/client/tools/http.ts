import { BlogState } from "../types/blog-state"
import { sortPages } from "./empty-page"

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
        .then(data => resolve(data.split('\n').map(s => s.trim())))
        .then(error => {
            console.log('Error accessing files', error)
            resolve([])
        })
    })
}

export function copyResource(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fetch('http://localhost:3000/copy-resource', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify({path: path})
        })
        .then(response => response.text())
        .then(data => resolve(JSON.parse(data).path))
        .then(error => {
            console.log('Error setting copy resource directory!')
            resolve('')
        })
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
        .then(error => {
            resolve('')
        })
    })
}

export function setMirrorDirectory(dir: string): Promise<void> {
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
        .then(data => resolve())
        .then(error => {
            console.log('Error setting mirror directory!', error)
            resolve()
        })
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
        .then(error => {
            console.log('Error setting data!', error)
            resolve()
        })
    })
}

export function loadData(): Promise<BlogState> {
    return new Promise((resolve, reject) => {
        fetch('http://localhost:3000/load-data', {
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
                resolve(res.blogState)
            } else {
                reject(res.reason)
            }
        })
        .then(error => {
            console.log('Error merging data!', error)
            resolve({
                pages: [],
                config: {
                    localSaveFolder: null
                }
            })
        })
    })
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