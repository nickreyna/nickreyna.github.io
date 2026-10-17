// Cache only public application shell. NEVER cache Supabase/auth/API responses.
const CACHE = 'nick-crm-shell-v5';
const ASSETS = ['./admin.css','./admin.js','./cotizador-pdf.js','./icons/logo-pdf.jpg','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-512-maskable.png','./icons/apple-touch-icon.png'];
self.addEventListener('install', event => {
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event => {
 event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
 const req=event.request;
 if(req.method!=='GET' || new URL(req.url).origin!==self.location.origin) return;
 if(req.mode==='navigate') return; // Always get pages online; no sensitive snapshots.
 const url = new URL(req.url);
 if(!ASSETS.some(a=>url.pathname.endsWith(a.replace('./','/')))) return;
 event.respondWith(fetch(req).then(res=>{ if(res.ok){const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy));} return res; }).catch(()=>caches.match(req)));
});
