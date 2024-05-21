import { copyResource } from "./http"

export enum MediaType {
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    PHOTOSPHERE = 'PHOTOSPHERE'
}

export type MediaResizeParams = {
    // todo 
}

export type PhotosphereOptions = {
    initialPitch: number,
    initialYaw: number
}

export type Media = {
    type: MediaType,
    photosphereOptions?: PhotosphereOptions
    unstableAbsoluteOriginalPath: string, // may become obsolete at any point, do NOT use for building website
    stableRelativePath: string, // path of copied resource within save folder
    resizeBehavior: MediaResizeParams
}

export function registerMedia(unstableAbsoluteOriginalPath: string): Promise<Media> {
    return new Promise((resolve, reject) => {
        const mediaType = ['mp4', 'MP4', 'webm', 'WEBM', 'avi', 'AVI', 'mov', 'MOV', 'wmv', 'WMV'].filter(
            t => unstableAbsoluteOriginalPath.endsWith(t)
        ).length > 0 ? MediaType.VIDEO : MediaType.IMAGE
        copyResource(unstableAbsoluteOriginalPath, 'media', null, false).then(path => {
            resolve({
                type: mediaType,
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