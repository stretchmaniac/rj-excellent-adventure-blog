import { Page } from '../types/PageType'
import { currentSimpleDate, getReadableDateString, SimpleDate } from './date';
import { Media, MediaType, hasImageExt } from './media';

export function nextID(): string {
    return '' + crypto.randomUUID()
}

function emptyPage(): Page {
    const id = nextID()
    return {
        id: id,
        title: 'Untitled',
        autoSummary: true,
        summaryText: '',
        autoSummaryImg: true,
        summaryImg: null, 
        date: currentSimpleDate(),
        isBlogPost: true,
        linkedFromHeader: false,
        headerSortOrder: '0',
        familyPrivate: false,
        design: []
    }
}

export function homePageAlias(): Page {
    return {
        id: '-1:home',
        title: 'Home Page',
        date: currentSimpleDate(),
        isBlogPost: false,
        linkedFromHeader: false,
        headerSortOrder: '0',
        summaryText: '',
        autoSummary: false,
        autoSummaryImg: false,
        summaryImg: null,
        familyPrivate: false,
        design: []
    }
}

export function emptyBlogPost(): Page {
    return {
        ...emptyPage(),
        isBlogPost: true
    }
}

function compareDates(a: SimpleDate, b: SimpleDate){
    // Sorted by year, then month, then day.
    // Using an alias A = a.year * 32 * 12 + a.month * 32 + day would also work
    if(a.year < b.year){
        return -1
    } else if(a.year > b.year){
        return 1
    }

    if(a.month < b.month){
        return -1
    } else if(a.month > b.month){
        return 1
    }

    if(a.day < b.day){
        return -1
    } else if(a.day > b.day){
        return 1
    }

    return 0
}

export function sortPages(newPages: Page[]){
    newPages.sort((a, b) => {
        const cmp = compareDates(a.date, b.date)
        if(cmp !== 0){
            return -cmp
        }
        // sort alphabetically according to title next
        if(a.title !== b.title){
            return a.title < b.title ? -1 : 1
        }
        // sort by id finally
        return a.id < b.id ? -1 : 1
    })
    return newPages
}

export type ReferencedMedia = {
    fileName: string,
    type: MediaType
}

export function getAllReferencedMedia(pages: Page[]): ReferencedMedia[] {
    let res: ReferencedMedia[] = []
    for(let p of pages){
        getAllRefMedia(res, p)
    }
    return res
}

function getAllRefMedia(workingList: ReferencedMedia[], obj: any){
    // look for any string with value containing "http://localhost:\d{4}/media/.*"
    const r = /http:\/\/localhost:\d{4}(\/|\\)media(\/|\\)/
    for(let key in obj){
        if(typeof obj[key] === 'object'){
            getAllRefMedia(workingList, obj[key])
        } else if(Array.isArray(obj[key])){
            for(let el of obj[key]){
                getAllRefMedia(workingList, el)
            }
        } else if(typeof obj[key] === 'string' && obj[key].match(r)){
            // don't include localhost part
            const spl: string[] = obj[key].split(r) // splits on all capturing groups
            const type = 'type' in obj ? obj.type as MediaType : MediaType.IMAGE
            workingList.push({
                fileName: spl[spl.length - 1],
                type: type 
            })
        }
    }
}

export function getFirstNonEmptyRootParLoc(page: Page): TextAndLocation {
    if(page.design.length < 2){
        return {
            text: '',
            designLoc: null
        }
    }
    // find first non-empty paragraph at the root level
    // first entry is header-container, second is content-container, first entry in content-container is date
    let i = 0
    for(const obj of page.design[1].children.slice(1)){
        i++
        if(obj.type === 'paragraph'){
            let contents = ''
            for(const child of obj.children){
                if('text' in child){
                    contents += child.text
                }
                if(child.type === 'a'){
                    contents += child.children[0].text
                }
            }
            if(contents.trim().length > 0){
                return {
                    text: contents,
                    designLoc: [1, i]
                }
            }
        }
    }
    return {
        text: '',
        designLoc: null
    }
}

export type TextAndLocation = {
    text: string
    designLoc: number[] | null
}

export function getSummaryText(page: Page): TextAndLocation {
    if(!page.autoSummary){
        return {
            text: page.summaryText,
            designLoc: null
        }
    }
    const res = getFirstNonEmptyRootParLoc(page)
    return {
        text: res.text.trim(),
        designLoc: res.designLoc
    }
}

export function getSummaryImg(page: Page): Media | null {
    if(!page.autoSummaryImg){
        return page.summaryImg
    }
    if(page.design.length < 2){
        return null
    }
    // generate auto image; find first non-empty media box at root level
    // first entry is header-container, second is content-container, first entry in content-container is date
    for(const obj of page.design[1].children){
        if(obj.type === 'media-parent'){
            // check children
            for(const child of obj.children){
                if(child.type === 'media-child' && child.content !== null && child.content.type === MediaType.IMAGE){
                    // check extension on content
                    const m = child.content as Media
                    if(hasImageExt(m.stableRelativePath)){
                        return m
                    }
                }
            }
        }
    }
    return null
}

export function fixedBlogHeader(title: string, date: SimpleDate, footer: any[]) {
    return [
        {
            type: 'header-container',
            readOnly: true,
            children: [
                {
                    type: 'h1',
                    readOnly: true,
                    children: [{text: title}]
                }
            ]
        },
        {
            type: 'content-container',
            readOnly: false,
            children: [
                {
                    type: 'paragraph',
                    readOnly: true,
                    children: [{text: getReadableDateString(date), fontSize: 'small', font: 'open sans'}]
                }, {
                    type: 'paragraph',
                    readOnly: true,
                    children: [{text: '', fontSize: 'medium'}]  
                }
            , ...footer]
        }
    ]
}

export function emptyBlogPostWithTitleDate(title: string, date: SimpleDate, footer: any[]) : Page {
    const p = emptyBlogPost()
    p.title = title
    p.date = date
    p.design = fixedBlogHeader(title, date, footer)
    p.design[1].children.splice(2, 0, {
        type: 'paragraph',
        children: [{text: sampleFirstParagraph()}]
    })
    return p
}

function sampleFirstParagraph(){
    const options = [
        "Sometime the ugly duckling turns out to be a swan, but sometimes it's just a Canadian Goose. Even as a young bird Gustav learned that looks aren't everything.",
        "This week, a squirrel ate through the wall of the black tank. It was a crappy situation.",
        "A new record this week -- Julie booked a campsite 5 years in the future!",
        "Gustav is BACK!",
        "The truck is now pushing the camper instead of pulling it. Rick did the math and we get 0.5 mpg better efficiency.",
        "The water at Lake Aquawetloch Pond is extremely moist.",
        "Did you know that there's a tunnel from Florida to Mississippi? Apparently Alabama doesn't allow alligators to be strapped on the hoods of cars on the interstate.",
        "We've taken up bird-watching in our free time. Julie got binoculars, and now we can see Gustav's black, beady eyes in great detail whenever he strolls past.",
        "The ladder leaks, the adder speaks. The latter possibly got blown up by some propane. And hit an airplane.",
        "Today we took apart the slide for the 73rd time. Turns out the manufacturer made the rollers square instead of cylindrical.",
        "In a predictable turn of events, Stretch learned the value of existing friendships when Gustav refused to acknowledge his existence.",
        "Canadian geese can dive 30 feet underwater 24 hours after hatching. Gustav, of course, did not, citing \"plenty of food elsewhere\".",
        "Today we hiked around the \"Grand Canyon of Kentucky\" which turned out to be ditch filled with Bourbon.",
        "Our greatest fears: 1) No dump station, 2) No gas station, 3) Hurricanes and 4) A low bridge not on the GPS.",
        "Wherefore art thou, Gustav? How thy honks used to linger among the weedy ponds, uncouth and weighty.",
        "Both Rick and I purchased laser loon T-shirts on Saturday at the Minnesota \"Gray ducks that are not ducks but also not Geese\" festival.",
        "Our campsite this week was a unique one. Rick jerry-rigged pool noodle pontoons on the bottom of the camper and we floated on the lake!",
        "🪿",
        "Once more unto the beach, dear friends, once more. Or should you like not the beach, a lake.",
        "Wednesday was St. Patrick's day, and the locals though it would be a fun idea to paintball our camper green and parade it down Main Street. Mom was not impressed.",
        "Illinois has actually closed down every interstate within its borders for construction. To compensate for the dried-up revenue stream, smaller roads such as Spring Road in Elmhurst are now I-Pass only.",
        "The confoundingly-fashionable Koval parents are now officially influencers. We've always influenced lots of things, like Gustav's attention and the flow of crud at a dump station. But now we are proud to announce our official sponsor, Zip Tie America (TM)!",
        "The infestation this week was beavers. We found three in the skylight, two between the window pane and screen, and another one chewing on the electrical wires.",
        "Mired in cattails, the pool noodle bobs ungracefully in the ebbing tide. Covered as it is in mud, one might mistake it " +
            "for an rather uniform log but for three neon splotches of yellow-green. Gustav visits regularly. Most believe that Gustav " +
            "has an unbreakable association between man and food that extends to man's creations. Others (more optimistically anthropomorphizing) think " +
            "that Gustav understands \"noodle\" to be a food and is waiting dutifully for man's designation to bear fruit in reality. I " +
            "for one guess that Gustav is looking for a replacement brain -- his noodle is certainly smaller. If only it would fit in that little head of his.",
        "The local HOA requires a 3\" lawn, neatly maintained and weeded. Our only option was the roof... and now our camper is a giant Chia Pet!",
        "We should have known that the camp store was NOT the place to get deli ham. But we were hungry, and it looked so tasty!",
        "Aaahhhhh... the camper life. Sipping home-made iced tea, cherishing our noisy (we mean \"joyful\" of course) neighbors, and bathing in that sweet balm of retirement.",
        "Let's discuss representations of numbers in decimal form. It's an easy topic -- since everyone knows how to write a number -- but one that may " +
            "reveal gaps in your understanding. The most popular question is whether 0.99999... is in fact the same number as 1.0. You probably already know " +
            "the answer. Yes, it is. But why? Were you thinking that 0.99999... divided by three is 0.33333... which we all seem to agree is a third? Would you " +
            "attempt a subtraction 1.0 - .99999... and wrestle with the existence of number with infinitely-many zeros after the decimal and then a one? " + 
            "But why should 0.33333... be a third, when multiplied by three it's 0.99999... which (a priori) might be short of 1.0? Ask yourself this -- how many " +
            "decimal representations of a number are there? The answer is the following: there is exactly one decimal representation for zero and any irrational number. " +
            "Otherwise there are exactly two representations for every rational. To understand why, one must wrap their head around the fact that numbers aren't actually " +
            "strings of digits. They are non-unique limits of (infinite) sequences of rational numbers. Equivalent digit representations are sequences in disguise " +
            "so that (sum_n^N a_n 10^n) - (sum_n^N b_n 10^n) = sum_n^N (a_n - b_n) 10^n tends to 0 as N tends to infinity. And this bit of seeming word salad is as pristine a representation " +
            "of math that you'll ever get -- a completely satisfying and utterly incomprehensible (to the uninitiated) solution to a problem that no normal person would bother to ask.",
        "We are now Canadian wanderers above the sea of fog. We don't really have the reddish hair to show for it, nor fancy wooden stick, " +
            "but hey, our scenery has been just as good!",
        "Rick installed a new gadget in our plumbing this week. Now all our intake water goes through electrolysis and the resulting " +
            "hydrogen is burned off, recombining into 100% pure water. Reverse-osmosis is nice and all, but does it really have the " +
            "bang of combustion? We didn't think so.",
        "We didn't pump the tire / We are always learning / Since the wheel's been turning / We didn't pump the tire / No, we " +
            "didn't check it / and now (yikes) we blew it...",
        "A fetching hairdo can right many ills. Consider, for example, the brilliant coat of Sasquatch whose alluring fur makes " +
            "up for his giant feet.",
        "The Chinese Remainder Theorem states that (Z/pqZ) is isomorphic to (Z/pZ) x (Z/qZ) if p and q are relatively prime. " +
            "When extended to polynomial rings, this theorem is the basis for the Toom-Cook class of extended-precision multiplication " +
            "algorithms via the ring isomorphism mapping Z[x]/((x-k)(x-k+1)...(s+k)) to (Z[x]/(x-k)) x (Z[x]/(x-k+1)) x ... " +
            "x (Z[x]/(x+k))."
    ]
    return options[Math.floor(Math.random() * options.length)]
}

export function emptyStaticPage(): Page {
    return {
        ...emptyPage(),
        isBlogPost: false
    }
}

export function emptyStaticPageWithTitleDate(title: string, date: SimpleDate): Page {
    const p = emptyStaticPage()
    p.title = title 
    p.date = date 
    p.design = [{
        type: 'h1',
        children: [{text: title}]
    }, {
        type: 'paragraph',
        children: [{text: 'A static page!'}]
    }]
    return p
}