"use strict";
var Store=(function(){
var KEY="kuliahku_v1",BAK="kuliahku_v1_rusak",LISTS=["courses","schedules","notes","tasks"];
var S={data:null,error:null,broken:null};
function empty(){return{version:1,courses:[],schedules:[],notes:[],tasks:[]};}
S.uid=function(){return window.crypto&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);};
S.parse=function(text){
 var d;try{d=JSON.parse(text);}catch(e){return{error:"Berkas bukan JSON yang valid."};}
 if(!d||typeof d!=="object")return{error:"Format data tidak sesuai."};
 var out=empty();
 for(var i=0;i<LISTS.length;i++){var k=LISTS[i],a=d[k];
  if(!Array.isArray(a))return{error:'Bagian "'+k+'" tidak ditemukan.'};
  for(var j=0;j<a.length;j++){
   if(!a[j]||typeof a[j]!=="object"||Array.isArray(a[j]))return{error:'Isi "'+k+'" tidak valid.'};
   if(typeof a[j].id!=="string"||!a[j].id)a[j].id=S.uid();}
  out[k]=a;}
 return{data:out};};
S.load=function(){var raw=null;
 try{raw=localStorage.getItem(KEY);
  if(raw===null){S.data=empty();return S.data;}
  var r=S.parse(raw);if(r.error)throw new Error(r.error);S.data=r.data;
 }catch(e){
  S.error="Data tersimpan tidak dapat dibaca ("+e.message+"). Mode baca saja aktif agar data lama tidak tertimpa.";
  S.broken=raw;try{if(raw)localStorage.setItem(BAK,raw);}catch(_){}
  S.data=empty();}
 return S.data;};
S.save=function(){if(S.error)return false;try{localStorage.setItem(KEY,JSON.stringify(S.data));return true;}catch(e){return false;}};
S.replace=function(d){var o=S.data,oe=S.error;S.data=d;S.error=null;
 if(S.save()){S.broken=null;return true;}S.data=o;S.error=oe;return false;};
S.clearAll=function(){try{localStorage.removeItem(KEY);}catch(e){return false;}S.data=empty();S.error=null;S.broken=null;return true;};
S.exportText=function(){var o=empty();o.app="KULIAHKU";o.exportedAt=new Date().toISOString();
 LISTS.forEach(function(k){o[k]=S.data[k];});return JSON.stringify(o,null,2);};
return S;})();
