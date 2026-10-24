import { WORDMARK } from '../ui/Logo';

/*
 * Brand loader: the logo assembles while the page loads. The two quarter circles of
 * the C pop in, the blue bar slides in, the two squares fly in and dock last, then
 * the logo slides over and the wordmark appears. Inline CSS and script, so the cover is right from the
 * first paint.
 *
 * Modes (admin, "المظهر وشاشة التحميل"):
 * - always:  covers the first page load only until its first screen is ready (the
 *            HTML is parsed, the font and the hero image are in; at most 0.8s more),
 *            so it never adds to the loading time and a page that opens at once just
 *            fades in. Moving between pages afterwards is instant (the site is a
 *            single-page app), so there is no "leaving" cover as on the Laravel site.
 * - session: the full intro once, on the first page of a visit.
 * - off:     nothing.
 */

const css = `
.cl-loader { display: none; place-items: center; background: var(--bg, #F5F7FA); color: var(--logo-ink, #0B1B3F); }
#page-loader { position: fixed; inset: 0; z-index: 200; }
.is-loading #page-loader, .cl-loader--preview { display: grid; }
.is-loaded #page-loader { opacity: 0; visibility: hidden; pointer-events: none; transition: opacity .45s ease, visibility 0s linear .45s; }
.is-loaded #page-loader .cl-logo { opacity: 0; transform: scale(1.05); transition: opacity .2s ease, transform .45s cubic-bezier(.2, .7, .2, 1); }
.cl-quick #page-loader { transition-duration: .18s, 0s; transition-delay: 0s, .18s; }
.cl-quick #page-loader .cl-logo { transform: none; }
.is-loading:not(.is-loaded) #page-loader { animation: cl-failsafe .4s ease 8s forwards; }
@keyframes cl-failsafe { to { opacity: 0; visibility: hidden; } }
.cl-logo { --cl-t: 1; direction: ltr; }
.cl-svg { display: block; height: 56px; width: auto; overflow: visible; animation: cl-center calc(.55s * var(--cl-t)) cubic-bezier(.2, .7, .2, 1) calc(.6s * var(--cl-t)) both; }
.cl-piece { fill: currentColor; transform-box: fill-box; transform-origin: center; animation: cl-pop calc(.5s * var(--cl-t)) cubic-bezier(.34, 1.56, .64, 1) both; }
.cl-piece:nth-child(2) { animation-delay: calc(.09s * var(--cl-t)); }
.cl-bar, .cl-accent { fill: var(--logo-accent, #0B63CE); transform-box: fill-box; }
.cl-bar { transform-origin: left center; animation: cl-slide calc(.5s * var(--cl-t)) cubic-bezier(.2, .7, .2, 1) calc(.2s * var(--cl-t)) both; }
.cl-accent { transform-origin: center;
    animation: cl-dock calc(.55s * var(--cl-t)) cubic-bezier(.34, 1.4, .64, 1) calc(.36s * var(--cl-t)) both, cl-breathe 1.4s ease-in-out calc(1.3s * var(--cl-t)) infinite; }
.cl-accent + .cl-accent { animation-delay: calc(.46s * var(--cl-t)), calc(1.5s * var(--cl-t)); }
.cl-word { fill: currentColor; animation: cl-word calc(.5s * var(--cl-t)) cubic-bezier(.2, .7, .2, 1) calc(.62s * var(--cl-t)) both; }
@keyframes cl-pop { from { opacity: 0; transform: scale(.3); } }
@keyframes cl-slide { from { opacity: 0; transform: translateX(14px) scaleX(.4); } }
@keyframes cl-dock { from { opacity: 0; transform: translate(14px, -22px) rotate(90deg) scale(.5); } }
@keyframes cl-breathe { 50% { transform: scale(.72); } }
@keyframes cl-word { from { opacity: 0; transform: translateX(-10px); } }
@keyframes cl-center { from { transform: translateX(37.99%); } }
.cl-loader--preview { height: 220px; border-radius: 16px; border: 1px solid rgb(148 163 184 / .3); overflow: hidden; }
@media (prefers-reduced-motion: reduce) {
    .cl-piece, .cl-bar, .cl-accent, .cl-word, .cl-svg { animation: none; }
    .is-loaded #page-loader .cl-logo { transform: none; }
}`;

function script(mode: string): string {
    return `(function(){
var root=document.documentElement, mode=${JSON.stringify(mode)};
var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function read(k){try{return sessionStorage.getItem(k)}catch(e){return null}}
function store(k,v){try{sessionStorage.setItem(k,v)}catch(e){}}
var show=mode==='always'||(mode==='session'&&!read('codlek-intro'));
if(show){
  var least=reduce||mode==='always'?0:1200, start=Date.now(), done=false;
  root.classList.add('is-loading');
  var reveal=function(){
    if(done)return; done=true;
    var elapsed=Date.now()-start;
    if(mode==='always'&&elapsed<400)root.classList.add('cl-quick');
    setTimeout(function(){
      root.classList.add('is-loaded'); store('codlek-intro','1');
      setTimeout(function(){root.classList.remove('is-loading','is-loaded','cl-quick')},500);
    },Math.max(0,least-elapsed));
  };
  var ready=function(){
    var settled=function(){}, waits=[];
    if(document.fonts&&document.fonts.ready)waits.push(document.fonts.ready.then(settled,settled));
    var hero=document.querySelector('main img[fetchpriority="high"]');
    if(hero&&hero.decode)waits.push(hero.decode().then(settled,settled));
    Promise.all(waits).then(reveal,reveal);
    setTimeout(reveal,800);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true}); else ready();
  setTimeout(reveal,6000);
}
window.addEventListener('pageshow',function(e){if(e.persisted)root.classList.remove('is-loading','is-loaded','cl-quick')});
})();`;
}

/** The animated logo (also used as a live preview, without the script). */
export function LoaderLogo({ preview = false }: { preview?: boolean }) {
    return (
        <div {...(preview ? { className: 'cl-loader cl-loader--preview' } : { id: 'page-loader', className: 'cl-loader' })} aria-hidden="true">
            <div className="cl-logo">
                {/* The logo's own 61-unit grid (see ui/Logo), so CSS offsets read close to pixels. */}
                <svg className="cl-svg" viewBox="0 0 254 61" focusable="false">
                    <path className="cl-piece" d="M0 28A28 28 0 0 1 28 0V28Z" />
                    <path className="cl-piece" d="M0 33H28V61A28 28 0 0 1 0 33Z" />
                    <path className="cl-bar" d="M33 0H58A3 3 0 0 1 61 3V9A3 3 0 0 1 58 12H33Z" />
                    <rect className="cl-accent" x="33" y="49" width="12" height="12" rx="3" />
                    <rect className="cl-accent" x="49" y="49" width="12" height="12" rx="3" />
                    <path className="cl-word" d={WORDMARK} />
                </svg>
            </div>
        </div>
    );
}

export function PageLoader({ mode }: { mode: string }) {
    if (mode === 'off') {
        return null;
    }

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: css }} />
            <script dangerouslySetInnerHTML={{ __html: script(mode) }} />
            <LoaderLogo />
        </>
    );
}
