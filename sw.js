"use strict";
/* Ubah nomor versi CACHE setiap kali berkas aplikasi diperbarui. */
const CACHE="kuliahku-v1";
const FILES=["./","index.html","styles.css","app.js","storage.js","ai.js","pwa.js","manifest.webmanifest","assets/logo.svg","assets/icon-180.png","assets/icon-192.png","assets/icon-512.png","assets/icon-maskable-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{const r=e.request;
 if(r.method!=="GET"||new URL(r.url).origin!==location.origin)return;
 e.respondWith((async()=>{const c=await caches.open(CACHE),hit=await c.match(r,{ignoreSearch:true});
  const net=fetch(r).then(res=>{if(res.ok&&res.status===200)c.put(r,res.clone()).catch(()=>{});return res;}).catch(()=>null);
  e.waitUntil(net);
  if(hit)return hit;
  return (await net)||(r.mode==="navigate"?await c.match("index.html"):Response.error());})());});
