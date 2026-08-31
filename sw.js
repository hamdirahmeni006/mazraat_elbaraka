/* مزرعة البركة — service worker : cache offline + notifications */
const VERSION = "2.6.0";            /* ← bouger ce numéro à chaque mise en ligne */
const CACHE   = "mazraa-" + VERSION;
const ASSETS  = ["./", "./index.html", "./manifest.json",
                 "./icons/icon-192.png", "./icons/icon-512.png", "./icons/favicon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

/* réseau d'abord, cache en secours : l'app reste utilisable sans connexion */
self.addEventListener("fetch", e => {
  if(e.request.method !== "GET") return;
  if(!e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});

self.addEventListener("message", e => {
  if(e.data === "version")     e.source?.postMessage({ version: VERSION });
  if(e.data === "skipWaiting") self.skipWaiting();
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const page = e.notification.data && e.notification.data.page;
  e.waitUntil(clients.matchAll({ type:"window", includeUncontrolled:true }).then(list => {
    for(const c of list){ if("focus" in c) return c.focus(); }
    return clients.openWindow("./index.html" + (page ? "#" + page : ""));
  }));
});

/* push envoyé par Firebase Cloud Messaging */
self.addEventListener("push", e => {
  let d = { title:"مزرعة البركة", body:"عندك تنبيه جديد 🌿" };
  try{ const j = e.data.json(); d = j.notification || j.data || d; }catch(err){}
  e.waitUntil(self.registration.showNotification(d.title, {
    body: d.body, icon:"./icons/icon-192.png", badge:"./icons/icon-192.png", vibrate:[60,40,60]
  }));
});
