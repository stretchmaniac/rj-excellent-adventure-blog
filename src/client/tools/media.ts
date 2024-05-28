import { copyResource, isPhotosphere } from "./http"

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
            const res = {
                type: mediaType,
                unstableAbsoluteOriginalPath: unstableAbsoluteOriginalPath,
                stableRelativePath: 'http://localhost:3000/' + path,
                resizeBehavior: {}
            }
            if(mediaType === MediaType.IMAGE){
                // check whether it is a photosphere or not
                isPhotosphere(res.stableRelativePath).then(yesPhotosphere => {
                    res.type = yesPhotosphere ? MediaType.PHOTOSPHERE : MediaType.IMAGE
                    resolve(res)
                })
            } else {
                resolve(res)
            }
        })
    })
}

// see https://stackoverflow.com/questions/9388412/data-uri-to-object-url-with-createobjecturl-in-chrome-ff
export function dataURItoBlob(dataURI: string) {
    var mime = dataURI.split(',')[0].split(':')[1].split(';')[0];
    var binary = atob(dataURI.split(',')[1]);
    var array = [];
    for (var i = 0; i < binary.length; i++) {
       array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], {type: mime});
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