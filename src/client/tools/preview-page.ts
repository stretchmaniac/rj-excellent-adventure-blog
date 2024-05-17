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
        <link rel="stylesheet" type="text/css" href="../pannellum.css">
      </head>
      <body>
        <main>
            <div class="root">
                <div class="header-box">
                    ${getHeaderHtmlFragment(pages, idMap, '../', false)}
                    <div class="content-root">
                        ${serializeToHTML(page.design, page.id, idMap)}
                    </div>
                </div>
            </div>
        </main>
        <script src="page.js"></script>
        <script src="../pannellum.js"></script>
      </body>
    </html>`
}

export function pageCss(page: Page): string {
return `
${getHeaderCssFragment('../')}

.content-root{
    width: 100%;
}

div {
  --x-small-width: 335px;
  --x-small-height: 335px;

  --small-width: 400px;
  --small-height: 400px;

  --medium-width: 506px;
  --medium-height: 506px;

  --large-width: 800px;
  --large-height: 800px;

  --x-large-width: 1125px;
  --x-large-height: 800px;
}

.x-small-box {
  max-width: min(var(--x-small-width), 100%)
}
.x-small-pannellum, .x-small {
  max-width: 100%;
  width: var(--x-small-width);
  height: var(--x-small-height);
}

.small-box {
  max-width: min(var(--small-width), 100%);
}
.small-pannellum, .small {
  max-width: 100%;
  width: var(--small-width);
  height: var(--small-height);
}

.medium-box {
  max-width: min(var(--medium-width), 100%);
}
.medium-pannellum, .medium {
  max-width: 100%;
  width: var(--medium-width);
  height: var(--medium-height);
}

.large-box {
  max-width: min(var(--large-width), 100%);
}
.large-pannellum, .large {
  max-width: 100%;
  width: var(--large-width);
  height: var(--large-height);
}

.x-large-box {
  max-width: min(var(--x-large-width), 100%);
}
.x-large-pannellum, .x-large {
  max-width: 100%;
  width: var(--x-large-width);
  height: var(--x-large-height);
}
`
}

export function pageJs(page: Page): string{
return `
function loadPannellumDivs(){
  const pannellums = document.getElementsByClassName('pannellum-div');
  for(const pan of pannellums){
    const folder = pan.dataset.imgfolder;
    const pitch = pan.dataset.pitch;
    const yaw = pan.dataset.yaw;

    // load config files for photosphere
    fetch(folder + '/config.json', {
      method: 'GET',
      headers: {
        "Content-Type": 'text/plain'
      }
    }).then(response => response.text())
    .then(data => {
      const config = JSON.parse(data);
      // specify some other options
      config.autoLoad = true;
      config.pitch = pitch ? parseFloat(pitch) : 0;
      config.yaw = yaw ? parseFloat(yaw) : 0;
      config.basePath = './' + folder;
      config.mouseZoom = false;

      window.pannellum.viewer(pan, config)
    })
  }
}

window.onload = () => {
  loadPannellumDivs();
}
`
}