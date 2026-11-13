// Blackboard: speichert die App für den Offline-Betrieb. Bei jeder neuen Version die Nummer erhöhen.
const CACHE='blackboard-v1';
const FILES=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const same=new URL(req.url).origin===self.location.origin;
  if(same){
    // Online: frische Version holen und merken. Offline: gespeicherte Version nehmen.
    e.respondWith(fetch(req).then(res=>{ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy)); return res; })
      .catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('index.html'))));
  } else {
    // Schriften: einmal laden, danach aus dem Speicher.
    e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy)); return res; })));
  }
});
