/* App 1% · funciona sin internet: lo guardado primero y, por detrás, se actualiza */
var CACHE='app1-3b64a2a1';
var ARCHIVOS=["./", "index.html", "manifest.webmanifest", "datos.js?v=3b64a2a1", "banco.js?v=3b64a2a1", "app.js?v=3b64a2a1", "fuentes/fuentes.css", "fuentes/anton-latin.woff2", "fuentes/anton-latin-ext.woff2", "fuentes/inter-latin.woff2", "fuentes/inter-latin-ext.woff2", "iconos/icon-180.png", "iconos/icon-192.png", "iconos/icon-512.png"];
self.addEventListener('install',function(e){ e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ARCHIVOS); }).then(function(){ return self.skipWaiting(); })); });
self.addEventListener('activate',function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
self.addEventListener('fetch',function(e){ var r=e.request; if(r.method!=='GET' || new URL(r.url).origin!==location.origin) return;
  if(r.mode==='navigate'){ e.respondWith(fetch(r).then(function(res){ var cp=res.clone(); caches.open(CACHE).then(function(c){ c.put('index.html',cp); }); return res; }).catch(function(){ return caches.match('index.html'); })); return; }
  e.respondWith(caches.match(r).then(function(m){ var red=fetch(r).then(function(res){ if(res.ok){ var cp=res.clone(); caches.open(CACHE).then(function(c){ c.put(r,cp); }); } return res; }).catch(function(){ return m; }); return m || red; })); });
