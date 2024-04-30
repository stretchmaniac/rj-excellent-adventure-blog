export function getDateInputStr(date: Date){
    const month = date.getMonth() + 1
    const day = date.getDate()
    return date.getFullYear() + '-' + 
        (month < 10 ? '0' + month : month) + '-' +
        (day < 10 ? '0' + day : day)
}

export function getReadableDateString(date: Date){
    const month = date.getMonth() + 1
    const day = date.getDate()
    const year = date.getFullYear()
    return month + '/' + day + '/' + year
}