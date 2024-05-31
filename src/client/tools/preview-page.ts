import { serializeToHTML } from "../components/slate/Serializer";
import { Page } from "../types/PageType";
import { getHeaderCssFragment, getHeaderHtmlFragment, getNoIndexMetaTag } from "./preview";

export function pageHtml(pages: Page[], page: Page, idMap: Map<string, string>): string {
    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        ${getNoIndexMetaTag()}
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
                        ${serializeToHTML(page, idMap)}
                    </div>
                    <div class="page-footer">
                      <div class="page-footer-icon">
                        ${lizardSVG()}
                      </div>
                      <div class="page-footer-text">stretch powered</div>
                    </div>
                </div>
                <div class="image-viewer-overlay" style="display:none">
                  <div class="image-viewer-non-controls">
                    <div class="image-viewer-box">
                      <div class="image-viewer-img-container">
                        <img class="image-viewer-img"/>
                      </div>
                    </div>
                  </div>
                  <div class="image-viewer-controls-box">
                    <div class="image-viewer-controls">
                      <button class="image-view-back-to-blog-button" onClick="closeImageOverlay()">Back to Blog</button>
                      <button class="image-viewer-previous-button" onClick="imageOverlayPreviousButton()">Previous</button>
                      <div class="image-viewer-counter">1/10</div>
                      <button class="image-viewer-next-button" onClick="imageOverlayNextButton()">Next</button>
                    </div>
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

.image-viewer-counter {
  width: 70px;
  text-align: center;
  font-family: 'Open Sans';
}

.image-viewer-non-controls {
  width: 100%;
  flex-grow: 1;
  position: relative;
}

.image-viewer-controls-box {
  display: flex;
  width: 100%;
  justify-content: center;
}

.image-viewer-controls {
  display: flex;
  flex-direction: row;
  justify-content: center;
  background-color: white;
  border-radius: 5px;
  padding: 5px;
}

.image-view-back-to-blog-button {
  margin-right: 20px;
}

.image-viewer-img {
  max-width: calc(100vw - 20px);
  max-height: calc(100vh - 50px);
  display: block;
}

.image-viewer-box {
  max-width: 100%;
  max-height: 100%;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: 5px;
  background-color: white;
  padding: 5px;
}

.image-viewer-overlay {
  width: 100%;
  height: 100%;
  position: absolute;
  background-color: black;
  z-index: 1;
  display: flex;
  flex-direction: column;
}

.page-footer {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding-top: 5px;
}

.page-footer-text {
  padding-bottom: 5px;
  font-family: 'Open Sans';
  font-size: 14px;
}

.content-root{
    width: 100%;
    background-color: white;
    padding-bottom: 20px;
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

.emphasized-p::first-line {
  color: #53824A;
}
.emphasized-p::first-letter {
  font-size: 50px;
  vertical-align: bottom;
  line-height: .9em;
}
@media screen and (max-width: 600px) {
  .header-container, .content-container {
      padding-left: 25px !important;
      padding-right: 25px !important;
  }
}

.header-container, .content-container {
  padding-left: 10%;
  padding-right: 10%;
}

blockquote { 
  background-color: rgb(255, 255, 255); 
  color: rgb(83,130,74); 
  font-style: italic; 
  font-weight: 600; 
  padding: 5px;
} 
`
}

export function pageJs(page: Page): string{
return `
let imgSrcs = [];
let currentImgSrcIndex = 0;

function closeImageOverlay(omitHistoryEntry){
  const el = document.querySelector('.image-viewer-overlay');
  if(document.fullscreenElement){
    document.exitFullscreen();
  }
  if(el.style.display !== 'none'){
    el.style.display = 'none';
    // add history state so back button will take us back to open popup
    if(!omitHistoryEntry){
      history.pushState({imageViewerOpen: false}, '');
    }
  }
}

function imageOverlayNextButton(){
  currentImgSrcIndex = (currentImgSrcIndex + 1) % imgSrcs.length;
  openImageOverlayByIndex(currentImgSrcIndex);
}

function imageOverlayPreviousButton(){
  currentImgSrcIndex = (currentImgSrcIndex + imgSrcs.length - 1) % imgSrcs.length;
  openImageOverlayByIndex(currentImgSrcIndex);
}

function openImageOverlay(srcsetTarget) {
  let imageIndex = -1;
  for(let i = 0; i < imgSrcs.length; i++){
    if(xLargeSrcFromSrcset(srcsetTarget) === imgSrcs[i]){
      imageIndex = i;
      currentImgSrcIndex = i;
      break;
    }
  }
  openImageOverlayByIndex(imageIndex);
}

function openImageOverlayByIndex(imageIndex, omitHistoryEntry){
  if(imageIndex < 0 || imageIndex >= imgSrcs.length){
    return false;
  }
  const src = imgSrcs[imageIndex];
  const el = document.querySelector('.image-viewer-overlay');
  if(el.style.display === 'none'){
    el.style.display = 'flex';
    // add history state so back button will take us out of the popup
    if(!omitHistoryEntry){
      history.pushState({imageViewerOpen: true, imageViewerIndex: imageIndex}, '');
    }
    // request full screen for image-viewer-overlay
    el.requestFullscreen();
  }
  document.querySelector('.image-viewer-img').src = src;
  document.querySelector('.image-viewer-counter').textContent = (1 + imageIndex) + ' / ' + imgSrcs.length; 

  return true;
}

function loadPannellumDivs(){
  const pannellums = document.getElementsByClassName('pannellum-div');
  for(const pan of pannellums){
    const folder = pan.dataset.imgfolder;
    const pitch = pan.dataset.pitch;
    const yaw = pan.dataset.yaw;

    if(folder === ''){
      // we have no photosphere folder, resort to backup image (this might not be an actual photosphere)
      const config = {
        autoLoad: true,
        pitch: pitch ? parseFloat(pitch) : 0,
        yaw: yaw ? parseFloat(yaw) : 0,
        mouseZoom: false,
        type: 'equirectangular',
        panorama: pan.dataset.imgbackupsrc
      }

      window.pannellum.viewer(pan, config)
      
    } else {
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
}

function xLargeSrcFromSrcset(srcset) {
  const srcs = srcset.split(' ');
    if(srcset !== '' && srcs.length > 0){
      const src = srcs[0];
      // replace "_small", "_medium", "_large" with "_x-large"
      return src.replace(/(_small|_medium|_large)(\\.[a-zA-Z0-9]+$)/, '_x-large$2');
    }
    return null;
}

window.onload = () => {
  loadPannellumDivs();

  // initialize click events for image overlay
  const overlay = document.querySelector('.image-viewer-overlay');
  const box = document.querySelector('.image-viewer-box');
  box.onclick = (e) => e.stopPropagation();
  const controls = document.querySelector('.image-viewer-controls');
  controls.onclick = (e) => e.stopPropagation();
  overlay.onclick = () => closeImageOverlay(); 

  // populate imgSrcs with images in the blog
  const images = document.getElementsByTagName('img');
  for(let img of images){
    const src = xLargeSrcFromSrcset(img.srcset);
    if(!!src){
      imgSrcs.push(src);
      // add click event listener for image
      img.onclick = (e) => openImageOverlay(e.target.srcset)
    }
  }
}

window.addEventListener('popstate', e => {
  if(!e.state){
    closeImageOverlay(true);
  }
  else if('imageViewerOpen' in e.state){
    if(!e.state.imageViewerOpen){
      closeImageOverlay(true);
    } else {
      openImageOverlayByIndex(e.state.imageViewerIndex, true);
    }
  }
})
`
}

function lizardSVG(): string {
  return `
  <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
  height="35" viewBox="0 0 1200.000000 980.000000"
  preserveAspectRatio="xMidYMid meet">
 <metadata>
 Created by potrace 1.15, written by Peter Selinger 2001-2017
 </metadata>
 <g transform="translate(-100.000000,600.000000) scale(0.100000,-0.100000) rotate(-60, 320, 600)"
 fill="#000000" stroke="none">
 <path d="M3557 12786 c-47 -17 -62 -29 -100 -85 -39 -58 -43 -61 -95 -61 -73
 0 -125 -33 -167 -105 -10 -17 -14 -16 -52 12 -23 16 -63 38 -89 48 l-47 18
 -19 -23 c-21 -26 -23 -62 -6 -93 16 -31 37 -45 86 -58 23 -6 45 -15 48 -20 3
 -5 -20 -25 -51 -44 -51 -33 -74 -59 -63 -70 2 -2 46 -9 98 -15 120 -14 138
 -18 149 -39 8 -15 16 -83 36 -329 l6 -63 -43 -37 c-60 -53 -112 -109 -155
 -168 -58 -80 -92 -98 -186 -103 l-79 -3 -46 50 c-26 27 -85 112 -132 187 -102
 165 -165 228 -283 284 -70 34 -91 50 -142 111 -62 74 -99 107 -150 132 -31 16
 -159 43 -257 54 -50 5 -61 11 -92 45 -62 70 -138 84 -218 43 -25 -13 -40 -13
 -103 -3 -42 6 -125 10 -192 7 -164 -6 -238 -40 -284 -130 -46 -89 -4 -253 117
 -459 38 -66 44 -83 44 -133 0 -90 40 -144 121 -166 48 -13 73 -45 136 -175 57
 -118 115 -183 188 -210 28 -10 77 -29 110 -42 33 -14 127 -49 209 -79 193 -69
 406 -194 406 -238 0 -7 -12 -41 -27 -77 -25 -59 -28 -75 -28 -197 0 -122 -2
 -135 -20 -148 -28 -22 -71 -10 -116 30 -62 57 -104 64 -218 37 -53 -13 -102
 -25 -108 -27 -26 -7 -12 -30 35 -57 26 -15 62 -39 81 -52 41 -30 91 -45 151
 -45 59 0 90 -21 90 -63 0 -28 -15 -47 -120 -148 -115 -112 -136 -139 -107
 -139 8 0 19 -11 25 -25 23 -51 95 -21 161 69 46 62 62 69 147 69 50 0 73 -7
 133 -38 142 -74 172 -49 231 187 40 157 43 162 75 123 31 -38 158 -286 224
 -437 96 -223 130 -338 156 -540 35 -277 79 -449 144 -573 40 -77 65 -198 56
 -271 -3 -30 -10 -54 -14 -54 -5 0 -38 20 -75 44 -80 54 -361 193 -413 204 -51
 11 -97 0 -146 -34 -65 -46 -101 -110 -157 -278 -52 -157 -84 -221 -110 -221
 -12 0 -15 17 -16 76 -2 86 -14 112 -73 153 -52 36 -75 34 -95 -9 -15 -31 -16
 -44 -5 -93 6 -31 24 -86 40 -121 37 -82 48 -141 26 -141 -15 0 -109 69 -122
 90 -4 6 -25 25 -47 41 -46 33 -105 38 -148 14 -14 -8 -38 -15 -55 -15 -62 -1
 -64 -12 -20 -96 22 -42 59 -97 81 -123 38 -42 48 -47 125 -65 92 -21 129 -39
 129 -62 0 -41 -109 -138 -190 -170 -71 -27 -97 -50 -125 -109 -17 -38 -38 -64
 -66 -82 -39 -26 -56 -59 -45 -88 12 -33 180 -8 255 37 20 12 70 54 112 94 84
 81 109 94 176 94 102 0 163 -84 163 -224 0 -83 17 -173 45 -243 16 -41 53 -67
 79 -57 20 8 98 250 90 278 -3 11 -21 44 -39 71 -18 28 -40 73 -49 101 l-17 51
 59 60 c64 66 107 131 173 266 24 48 49 87 55 87 14 0 110 -106 199 -219 32
 -40 71 -81 87 -90 16 -9 31 -27 35 -41 4 -14 -1 -117 -11 -230 -9 -113 -24
 -286 -33 -385 -18 -217 -13 -451 17 -705 57 -486 160 -895 361 -1434 116 -311
 164 -423 322 -751 231 -481 315 -679 406 -951 101 -306 132 -472 138 -754 6
 -236 -7 -383 -52 -608 -68 -333 -225 -643 -447 -877 -108 -114 -135 -136 -571
 -467 -237 -181 -347 -271 -406 -335 -101 -107 -104 -129 -20 -127 46 1 68 8
 115 36 98 59 241 127 405 193 201 81 340 151 448 225 288 198 551 520 741 905
 116 236 158 372 192 625 16 124 16 491 -1 650 -51 491 -188 1037 -469 1870
 -49 146 -104 312 -122 370 -17 58 -49 159 -70 225 -68 212 -117 447 -152 730
 -17 134 -13 401 9 545 13 83 18 177 18 335 l0 220 33 111 c41 135 45 143 69
 127 67 -47 177 -106 295 -158 75 -34 144 -68 154 -75 23 -20 15 -110 -27 -301
 -23 -105 -31 -171 -32 -244 0 -116 10 -173 65 -345 27 -87 47 -177 63 -295 30
 -211 37 -237 82 -286 50 -56 84 -73 109 -54 19 13 18 15 -3 78 -21 59 -21 67
 -8 94 8 16 17 54 21 86 6 51 4 63 -26 120 -30 59 -31 66 -19 92 22 44 41 51
 91 34 50 -16 127 -90 212 -203 31 -41 69 -84 84 -95 16 -11 70 -31 122 -46 52
 -15 103 -31 113 -37 14 -7 23 -6 34 5 13 13 13 17 0 38 -8 13 -18 45 -21 70
 -10 66 -53 126 -164 227 -156 142 -154 139 -150 169 7 60 129 122 303 153 55
 10 108 22 117 25 27 11 31 37 8 65 -11 14 -29 42 -40 63 l-20 37 -68 0 c-43 0
 -94 -9 -143 -24 -64 -20 -128 -31 -162 -27 -4 1 15 31 43 67 100 130 121 200
 75 247 -58 57 -111 40 -183 -60 l-47 -65 -3 66 c-2 51 7 110 38 244 53 227 52
 271 -8 397 -51 106 -106 184 -197 283 -72 78 -258 236 -368 315 -37 26 -72 58
 -77 72 -14 36 6 232 35 360 64 275 86 394 95 523 27 373 -56 764 -244 1157
 -115 239 -231 411 -390 577 -107 110 -140 157 -209 295 -26 50 -69 130 -97
 178 -73 122 -90 163 -90 218 0 88 45 145 191 245 88 59 129 101 161 162 20 38
 23 60 23 146 0 96 -2 103 -37 175 -21 40 -83 137 -138 213 -107 149 -117 176
 -77 214 30 29 94 41 208 42 64 0 101 4 114 14 17 13 16 16 -26 66 -24 28 -51
 56 -61 61 -26 14 -78 10 -138 -11 -30 -11 -58 -19 -62 -20 -19 0 -4 30 40 85
 58 72 82 115 82 149 0 45 -58 58 -133 32z"/>
 </g>
 </svg>
  `
}