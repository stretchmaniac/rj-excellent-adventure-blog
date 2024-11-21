import { MediaChild } from "../components/PageDesign"
import { copyResource, fileExists, isPhotosphere } from "./http"

export enum MediaType {
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    PHOTOSPHERE = 'PHOTOSPHERE'
}

export type PhotosphereOptions = {
    initialPitch: number,
    initialYaw: number
}

// DO NOT change Media attribute names without also changing
// http.ts/convertLegacyMediaRecursive
export type Media = {
    type: MediaType
    hasCompressedPhotosphereFolder: boolean
    photosphereOptions?: PhotosphereOptions
    unstableAbsoluteOriginalPath: string, // may become obsolete at any point, do NOT use for building website
    stableRelativePath: string // path of copied resource within save folder
}

export type ReimportImageResult = {
    originalFileName: string, 
    fileStillExists: boolean
}

// returns the file names of images unable to be located by their original (unstable) location
export function reimportImages(design: any[]): Promise<ReimportImageResult>[] {
    return reimportImagesInternal(design)
}

function reimportImagesInternal(obj: any): Promise<ReimportImageResult>[] {
    const results: Promise<ReimportImageResult>[] = []
    if(obj.type && obj.type === 'media-child'){
        const md = obj as MediaChild
        if(md.content){
            const m = md.content as Media
            if(m.type === MediaType.IMAGE){
                // check if original file exists
                results.push(new Promise((resolve, reject) => {
                    fileExists(m.unstableAbsoluteOriginalPath).then(exists => {
                        if(!exists){
                            resolve({originalFileName: m.unstableAbsoluteOriginalPath, fileStillExists: false})
                        } else {
                            // do the re-import
                            registerMedia(m.unstableAbsoluteOriginalPath).then(newMedia => {
                                m.stableRelativePath = newMedia.stableRelativePath
                                resolve({originalFileName: m.unstableAbsoluteOriginalPath, fileStillExists: true})
                            })
                        }
                    })
                }))
            }
        }
    } else {
        // iterate through lower objects
        for(const prop in obj){
            if(obj[prop] && (typeof obj[prop]) === 'object'){
                results.push(...reimportImagesInternal(obj[prop]))
            }
        }
    }
    return results
}

export function registerMedia(unstableAbsoluteOriginalPath: string): Promise<Media> {
    return new Promise((resolve, reject) => {
        const mediaType = ['mp4', 'MP4', 'webm', 'WEBM', 'avi', 'AVI', 'mov', 'MOV', 'wmv', 'WMV'].filter(
            t => unstableAbsoluteOriginalPath.endsWith(t)
        ).length > 0 ? MediaType.VIDEO : MediaType.IMAGE
        copyResource(unstableAbsoluteOriginalPath, 'media', null, false).then(path => {
            const res: Media = {
                type: mediaType,
                unstableAbsoluteOriginalPath: unstableAbsoluteOriginalPath,
                stableRelativePath: 'http://localhost:3000/' + path,
                hasCompressedPhotosphereFolder: false
            }
            if(mediaType === MediaType.IMAGE){
                // check whether it is a photosphere or not
                isPhotosphere(res.stableRelativePath).then(yesPhotosphere => {
                    res.type = yesPhotosphere ? MediaType.PHOTOSPHERE : MediaType.IMAGE
                    if(yesPhotosphere){
                        res.hasCompressedPhotosphereFolder = true
                    }
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