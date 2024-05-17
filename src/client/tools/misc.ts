export function numberArrEq(arr1: number[] | null, arr2: number[] | null): boolean {
    if(arr1 === null && arr2 === null){
        return true
    }
    if(arr1 === null || arr2 === null){
        return false
    }
    if(arr1.length !== arr2.length){
        return false
    }

    for(let i = 0; i < arr1.length; i++){
        if(arr1[i] !== arr2[i]){
            return false
        }
    }
    return true
}