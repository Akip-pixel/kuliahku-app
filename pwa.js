"use strict";
var PWA=(function(){
var ev=null,h=location.hostname;
var P={standalone:(window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone===true,
 supported:"serviceWorker" in navigator&&(location.protocol==="https:"||h==="localhost"||h==="127.0.0.1")};
window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();ev=e;});
window.addEventListener("appinstalled",function(){ev=null;P.standalone=true;});
P.canPrompt=function(){return !!ev;};
P.install=function(){if(!ev)return Promise.resolve(false);var e=ev;ev=null;e.prompt();return e.userChoice.then(function(r){return r.outcome==="accepted";});};
if(P.supported)window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(e){console.warn("Service worker gagal:",e);});});
return P;})();
