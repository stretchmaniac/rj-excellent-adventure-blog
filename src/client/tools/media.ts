import { copyResource } from "./http"

export enum MediaType {
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    PHOTOSPHERE = 'PHOTOSPHERE'
}

export type MediaResizeParams = {
    // todo 
}

export type Media = {
    type: MediaType,
    unstableAbsoluteOriginalPath: string, // may become obsolete at any point, do NOT use for building website
    stableRelativePath: string, // path of copied resource within save folder
    resizeBehavior: MediaResizeParams
}

export function registerMedia(unstableAbsoluteOriginalPath: string): Promise<Media> {
    return new Promise((resolve, reject) => {
        copyResource(unstableAbsoluteOriginalPath).then(path => {
            resolve({
                type: MediaType.IMAGE,
                unstableAbsoluteOriginalPath: unstableAbsoluteOriginalPath,
                stableRelativePath: 'http://localhost:3000/' + path,
                resizeBehavior: {}
            })
        })
    })
}

export function hasImageExt(fileName: string): boolean {
    const exts = ['.png', '.jpg', '.jpeg', '.bmp']
    for(const ext of exts){
        if(fileName.endsWith(ext)){
            return true
        }
    }
    return false
}