import { serializeToHTML } from "../components/slate/Serializer";
import { Page } from "../types/PageType";
import { getHeaderCssFragment, getHeaderHtmlFragment } from "./preview";

export function pageHtml(pages: Page[], page: Page, idMap: Map<string, string>): string {
    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>${page.title}</title>
        <link rel="stylesheet" type="text/css" href="styles.css">
      </head>
      <body>
        <main>
            <div class="root">
                <div class="header-box">
                    ${getHeaderHtmlFragment(pages, idMap, '../', false)}
                    <div class="content-root">
                        ${serializeToHTML(page.design)}
                    </div>
                </div>
            </div>
        </main>
        <script src="page.js"></script>
      </body>
    </html>`
}

export function pageCss(page: Page): string {
return `
${getHeaderCssFragment()}

.content-root{
    width: 100%;
}
`
}

export function pageJs(page: Page): string{
return `
`
}