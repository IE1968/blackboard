// Skizix: speichert die App für den Offline-Betrieb.
const CACHE='skizix-v12';
const FILES=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url);
  // Die Website (Ordner website/) und Video-Teilabrufe gehören nicht zur App: ungefiltert übers Netz.
  const basis=new URL('./',self.location).pathname;
  if(url.origin===self.location.origin&&(url.pathname.startsWith(basis+'website')||req.headers.has('range'))) return;
  if(url.origin===self.location.origin){
    // App-Dateien: online immer beim Server nachfragen (kein 10-Minuten-Zwischenspeicher des Browsers), offline die gespeicherte nehmen.
    e.respondWith(fetch(req.url,{cache:'no-cache',credentials:'same-origin'}).then(res=>{ if(res.redirected) return Response.redirect(res.url,301); const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy)); return res; })
      .catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('index.html'))));
  } else if(/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)){
    // Schriften: einmal laden, danach aus dem Speicher.
    e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy)); return res; })));
  }
  // Alles andere (z. B. der Abgleich mit GitHub) läuft unverändert übers Netz.
});
