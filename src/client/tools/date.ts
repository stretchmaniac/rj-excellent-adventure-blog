export function getDateInputStr(date: Date){
    const month = date.getMonth() + 1
    const day = date.getDate()
    return date.getFullYear() + '-' + 
        (month < 10 ? '0' + month : month) + '-' +
        (day < 10 ? '0' + day : day)
}

const monthStrings = [
    'January', 'February', 'March', 'April', 'May',
    'June', 'July', 'August', 'September', 'October', 'November', 'December'
]

export function getReadableDateString(date: Date){
    const month = date.getMonth()
    const day = date.getDate()
    const year = date.getFullYear()
    return monthStrings[month] + ' ' + day + ', ' + year
}

export function getShortReadableDateString(date: Date){
    const month = date.getMonth() + 1
    const day = date.getDate()
    const year = date.getFullYear()
    return month + '/' + day + '/' + year
}