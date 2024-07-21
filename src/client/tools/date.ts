export function getDateInputStr(date: SimpleDate){
    const month = date.month + 1
    const day = date.day
    return date.year + '-' + 
        (month < 10 ? '0' + month : month) + '-' +
        (day < 10 ? '0' + day : day)
}

const monthStrings = [
    'January', 'February', 'March', 'April', 'May',
    'June', 'July', 'August', 'September', 'October', 'November', 'December'
]

export function getReadableDateString(date: SimpleDate){
    return monthStrings[date.month] + ' ' + date.day + ', ' + date.year
}

export function getShortReadableDateString(date: SimpleDate){
    const month = date.month + 1
    return month + '/' + date.day + '/' + date.year
}

export function currentSimpleDate(): SimpleDate {
    const date = new Date()
    return {
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate()
    }
}

export function padk(n: number, k: number): string {
    let res = '' + n 
    while(res.length < k){
        res = '0' + res
    }
    return res
}

export function toDate(date: SimpleDate): Date {
    return new Date(Date.parse(padk(date.year,4) + '-' + padk(date.month + 1, 2) + '-' + padk(date.day, 2)) + ':00:00.000Z')
}

export type SimpleDate = {
    year: number, // i.e. 2024
    month: number, // 0 indexed, with 0 January, 1 February, etc.
    day: number // 1 indexed, so 4 means the 4th (this matches Date.getDate())
}