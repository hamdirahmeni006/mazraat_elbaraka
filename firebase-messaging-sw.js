/* مزرعة البركة — reçoit les notifications quand l'application est fermée.
 *
 * Volontairement minimal : aucun script externe, aucune configuration.
 * Firebase Cloud Messaging envoie un push web standard, ce fichier
 * l'affiche lui-même. Comme il ne charge rien depuis internet, il ne
 * peut pas échouer au démarrage.
 */
self.addEventListener("install",  () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("push", e => {
  let title = "مزرعة البركة";
  let body  = "عندك تنبيه جديد 🌿";
  let page  = "p-dash";
  try{
    const p = e.data.json();
    const n = p.notification || p.data || {};
    if(n.title) title = n.title;
    if(n.body)  body  = n.body;
    if(p.data && p.data.page) page = p.data.page;
  }catch(err){
    try{ const t = e.data && e.data.text(); if(t) body = t; }catch(_){}
  }
  e.waitUntil(self.registration.showNotification(title, {
    body, icon:"./icons/icon-192.png", badge:"./icons/icon-192.png",
    vibrate:[60,40,60], tag:"mazraa", renotify:true, data:{ page }
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const page = (e.notification.data && e.notification.data.page) || "";
  e.waitUntil(self.clients.matchAll({ type:"window", includeUncontrolled:true }).then(list => {
    for(const c of list){ if("focus" in c) return c.focus(); }
    return self.clients.openWindow("./index.html" + (page ? "#" + page : ""));
  }));
});
