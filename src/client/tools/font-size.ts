export function fontMap(size: string){
    if(size === 'xx-small'){
        return 10
    }
    if(size === 'x-small'){
        return 12
    }
    if(size === 'small'){
        return 16
    }
    if(size === 'medium'){
        return 20
    }
    return 20
}