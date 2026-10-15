"use strict";
/* AI lokal berbasis aturan. BUKAN model bahasa: hanya mengenali pola kalimat dan membaca data aplikasi.
   Untuk AI online: ganti AI.provider.reply dengan fungsi yang memanggil backend milikmu sendiri
   (kunci API hanya di server, kirim data hanya dengan persetujuan pengguna). */
var AI=(function(){
const KEY="kuliahku_chat_v1",BAK="kuliahku_chat_v1_rusak",MAX=60;
const DAYS=["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"],PRI={high:"tinggi",mid:"sedang",low:"rendah"},NEED={high:3,mid:2,low:1};
const SLOTS=[["16:00","17:00"],["19:00","20:00"],["13:00","14:00"],["08:00","09:00"]];
const STOP="yang dan di ke dari untuk pada adalah ini itu dengan atau juga akan dapat dalam oleh sebagai karena para suatu lebih sudah telah bisa agar saat serta antara tidak ada the of and to in is".split(" ");
const ERR="Data aplikasi tidak dapat dibaca, jadi saya belum bisa melihat mata kuliah, jadwal, catatan, atau tugasmu. Pulihkan dulu lewat menu Data.";
const HELP="Saya asisten lokal KULIAHKU berbasis aturan (bukan model bahasa besar). Yang bisa saya lakukan:\n• Menampilkan jadwal (\"jadwal besok\", \"jadwal minggu ini\")\n• Menampilkan tugas (\"tugas yang paling dekat tenggatnya\")\n• Menyusun urutan pengerjaan (\"prioritas tugas\") dan jadwal belajar (\"susun jadwal belajar\")\n• Mencari catatan (\"catatan tentang oktet\") dan daftar mata kuliah\n• Merangkum teks yang kamu tempel (\"Ringkas: ...\")\n\nKeterbatasan: saya tidak punya pengetahuan umum, tidak memahami kalimat bebas, dan tidak mengubah data. Semua berjalan di perangkatmu; tidak ada yang dikirim ke server.";
const TIPS="Beberapa tips umum:\n• Teknik Pomodoro: 25 menit fokus, 5 menit istirahat.\n• Kerjakan tugas dengan tenggat terdekat lebih dulu; pecah tugas besar jadi langkah kecil.\n• Ulangi materi sehari setelah kuliah, bukan menunggu ujian.\n• Tulis ulang inti materi dengan kata-katamu sendiri.\nIni saran umum, bukan hasil analisis datamu. Untuk saran berdasarkan datamu, coba \"prioritas tugas\".";
const pad=n=>("0"+n).slice(-2),ymd=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()),dayIdx=d=>(d.getDay()+6)%7;
const left=(due,now)=>Math.round((new Date(due+"T00:00")-new Date(ymd(now)+"T00:00"))/864e5);
const when=d=>d<0?"terlambat "+(-d)+" hari":d===0?"hari ini":d===1?"besok":d+" hari lagi";
const nameOf=(c,id)=>{const x=c.data.courses.find(k=>k.id===id);return x?x.name:"";};
const open=c=>c.data.tasks.filter(t=>t.status!=="done").sort((a,b)=>(a.due||"9").localeCompare(b.due||"9"));
const pr=t=>PRI[t.priority]||"sedang";
const tline=(t,c)=>"• "+t.title+(nameOf(c,t.courseId)?" ("+nameOf(c,t.courseId)+")":"")+(t.due?" — "+t.due+", "+when(left(t.due,c.now)):" — tanpa tenggat")+" [prioritas "+pr(t)+"]";

function taskList(m,c){const o=open(c);if(!o.length)return"Tidak ada tugas yang belum selesai.";
 const late=o.filter(t=>t.due&&left(t.due,c.now)<0).length;
 let s;
 if(/paling dekat|terdekat/.test(m)){s="Tenggat paling dekat:\n"+tline(o[0],c);if(o.length>1)s+="\n\nTugas lain yang belum selesai:\n"+o.slice(1,7).map(t=>tline(t,c)).join("\n");}
 else s="Tugas belum selesai ("+o.length+"):\n"+o.slice(0,8).map(t=>tline(t,c)).join("\n");
 return s+(late?"\n\nPerhatian: "+late+" tugas sudah lewat tenggat.":"");}
function schedule(m,c){const S=c.data.schedules;if(!S.length)return"Belum ada jadwal kuliah. Tambahkan lewat menu Jadwal.";
 const t=dayIdx(c.now);let days,label;
 if(/minggu ini|pekan ini|seminggu|sepekan|minggu depan/.test(m)){days=[0,1,2,3,4,5,6];label="minggu ini";}
 else if(/besok/.test(m)){days=[(t+1)%7];label="besok ("+DAYS[(t+1)%7]+")";}
 else{const i=DAYS.findIndex(d=>m.indexOf(d.toLowerCase())>-1);if(i>-1){days=[i];label="hari "+DAYS[i];}else{days=[t];label="hari ini ("+DAYS[t]+")";}}
 const out=[];
 days.forEach(i=>{const r=S.filter(s=>s.day===DAYS[i]).sort((a,b)=>a.start.localeCompare(b.start));
  if(r.length)out.push((days.length>1?DAYS[i]+":\n":"")+r.map(s=>"• "+s.start+"–"+s.end+" "+(nameOf(c,s.courseId)||"(mata kuliah terhapus)")+(s.room?", ruang "+s.room:"")).join("\n"));});
 return out.length?"Jadwal "+label+":\n"+out.join("\n"):"Tidak ada jadwal kuliah untuk "+label+".";}
function notes(m,c){const N=c.data.notes;if(!N.length)return"Belum ada catatan. Tambahkan lewat menu Catatan.";
 const k=(m.match(/(?:tentang|soal|mengenai|berisi)\s+(.+?)[?.!]*$/)||[])[1];
 const r=(k?N.filter(n=>(n.title+" "+String(n.body||"")).toLowerCase().indexOf(k)>-1):N.slice()).sort((a,b)=>(b.updated||0)-(a.updated||0));
 if(!r.length)return'Tidak ada catatan yang memuat "'+k+'".';
 return(k?'Catatan yang memuat "'+k+'" ('+r.length+"):":"Catatan terakhir ("+N.length+" total):")+"\n"+r.slice(0,5).map(n=>{const b=String(n.body||"").replace(/\s+/g," ");return"• "+n.title+(nameOf(c,n.courseId)?" ("+nameOf(c,n.courseId)+")":"")+(b?" — "+b.slice(0,80)+(b.length>80?"…":""):"");}).join("\n");}
function courses(m,c){const C=c.data.courses;if(!C.length)return"Belum ada mata kuliah. Tambahkan lewat menu Kuliah.";
 const sks=C.reduce((a,x)=>a+(Number(x.credits)||0),0);
 return"Mata kuliah ("+C.length+", total "+sks+" SKS):\n"+C.map(x=>"• "+x.name+(x.code?" ("+x.code+")":"")+[x.lecturer,x.credits!==""&&x.credits!=null?x.credits+" SKS":"",x.semester?"semester "+x.semester:""].filter(Boolean).map((v,i)=>(i?", ":" — ")+v).join("")).join("\n");}
function taskPlan(m,c){const o=open(c);if(!o.length)return"Tidak ada tugas yang belum selesai.";
 const sc=t=>(t.due?left(t.due,c.now):99)-(t.priority==="high"?2:t.priority==="low"?-2:0);
 return"Urutan pengerjaan yang saya sarankan (tenggat dulu, lalu prioritas):\n"+o.slice().sort((a,b)=>sc(a)-sc(b)).slice(0,8).map((t,i)=>(i+1)+". "+t.title+" — "+(t.due?when(left(t.due,c.now)):"tanpa tenggat")+", prioritas "+pr(t)).join("\n")+"\n\nMulai dari nomor 1. Tugas besar lebih mudah jika dipecah (kerangka, isi, cek ulang).";}
function studyPlan(m,c){const o=open(c);if(!o.length)return"Tidak ada tugas aktif, jadi belum ada yang perlu dijadwalkan. Tambahkan tugas di menu Tugas dulu.";
 const need={},hm=pad(c.now.getHours())+":"+pad(c.now.getMinutes()),lines=[];
 o.forEach(t=>need[t.id]=NEED[t.priority]||2);
 for(let d=0;d<7;d++){const dt=new Date(c.now.getFullYear(),c.now.getMonth(),c.now.getDate()+d),di=dayIdx(dt),cl=c.data.schedules.filter(s=>s.day===DAYS[di]);
  const got=[];
  SLOTS.filter(s=>(d>0||s[0]>hm)&&!cl.some(k=>s[0]<k.end&&k.start<s[1])).slice(0,2).forEach(s=>{
   const t=o.find(t=>need[t.id]>0&&(!t.due||left(t.due,c.now)>=d||left(t.due,c.now)<0));
   if(t){need[t.id]--;got.push([s[0],s[0]+"–"+s[1]+" "+t.title]);}});
  if(got.length)lines.push(DAYS[di]+" "+pad(dt.getDate())+"/"+pad(dt.getMonth()+1)+":\n"+got.sort((a,b)=>a[0].localeCompare(b[0])).map(g=>"• "+g[1]).join("\n"));}
 const rest=o.filter(t=>need[t.id]>0);
 return"Usulan jadwal belajar 7 hari (hanya saran, belum disimpan; slot menghindari jam kuliahmu):\n"+(lines.join("\n")||"Tidak ada slot kosong.")+(rest.length?"\n\nBelum muat: "+rest.map(t=>t.title).join(", ")+".":"")+"\n\nAsumsi: 1 sesi = 1 jam; prioritas tinggi 3 sesi, sedang 2, rendah 1.";}
function summarize(text){
 const s=(text.replace(/\s+/g," ").match(/[^.!?]+[.!?]*/g)||[]).map(x=>x.trim()).filter(x=>x.length>20);
 if(s.length<4)return"Teksnya terlalu pendek untuk dirangkum (minimal sekitar 4 kalimat). Tempel teks yang lebih panjang.";
 const f={},w=x=>(x.toLowerCase().match(/[a-z0-9]+/g)||[]).filter(k=>k.length>3&&STOP.indexOf(k)<0);
 s.forEach(x=>w(x).forEach(k=>f[k]=(f[k]||0)+1));
 const sc=s.map((x,i)=>{const ws=w(x);return{i:i,v:ws.length?ws.reduce((a,k)=>a+f[k],0)/ws.length:0};});
 const n=Math.max(2,Math.min(4,Math.round(s.length/4)));
 const pick=sc.slice().sort((a,b)=>b.v-a.v).slice(0,n).sort((a,b)=>a.i-b.i),kw=Object.keys(f).sort((a,b)=>f[b]-f[a]).slice(0,5);
 return"Rangkuman otomatis ("+n+" dari "+s.length+" kalimat; saya memilih kalimat penting, bukan menulis ulang):\n"+pick.map(p=>"• "+s[p.i]).join("\n")+"\n\nKata kunci: "+kw.join(", ")+".";}

const RULES=[[/jadwal belajar|rencana belajar|susun belajar|atur waktu belajar/,studyPlan],[/prioritas|rencanakan tugas|rencana tugas|kerjakan dulu|mulai dari mana/,taskPlan],[/tugas|deadline|tenggat/,taskList],[/jadwal|kelas hari|kuliah hari/,schedule],[/catatan/,notes],[/mata kuliah|matkul|\bsks\b|dosen/,courses]];
function answer(msg,ctx){const m=msg.toLowerCase().replace(/\s+/g," ").trim();
 if(/\b(ringkas|rangkum|simpulkan)/.test(m)){const i=msg.search(/[:\n]/);let b=i>-1?msg.slice(i+1).trim():"";if(b.length<80&&msg.length>300)b=msg;
  return b?summarize(b):"Tempel teks yang ingin dirangkum setelah perintah, misalnya:\nRingkas: (teks di sini)";}
 if(/tips|cara belajar|pomodoro|fokus|manajemen waktu|semangat/.test(m))return TIPS;
 for(const r of RULES)if(r[0].test(m))return ctx.broken?ERR:r[1](m,ctx);
 if(/^(halo|hai|hi|hello|assalamualaikum|pagi|siang|sore|malam)\b|bantuan|bisa apa|help/.test(m))return HELP;
 return"Maaf, saya belum paham maksudnya. Saya AI lokal berbasis aturan, bukan model bahasa, jadi saya tidak punya pengetahuan umum dan tidak bisa menjawab pertanyaan materi di luar data dan teks yang kamu berikan.\n\nCoba: \"jadwal besok\", \"tugas paling dekat\", \"susun jadwal belajar\", atau \"Ringkas: (teks)\". Ketik \"bantuan\" untuk daftar lengkap.";}

const provider={name:"Lokal (berbasis aturan)",online:false,
 reply:(msg,ctx)=>new Promise(res=>setTimeout(()=>{try{res(answer(msg,ctx));}catch(e){res("Terjadi kesalahan saat memproses pesan. Coba ulangi dengan kalimat lain.");}},250))};
const okMsg=m=>m&&(m.role==="user"||m.role==="bot")&&typeof m.text==="string";
function loadChat(){let raw=null;
 try{raw=localStorage.getItem(KEY);if(!raw)return[];const a=JSON.parse(raw);if(!Array.isArray(a))throw new Error("format");return a.filter(okMsg).slice(-MAX);}
 catch(e){try{if(raw)localStorage.setItem(BAK,raw);}catch(_){}return[];}}
function saveChat(l){try{localStorage.setItem(KEY,JSON.stringify(l.slice(-MAX)));return true;}catch(e){return false;}}
function clearChat(){try{localStorage.removeItem(KEY);return true;}catch(e){return false;}}
return{answer:answer,provider:provider,loadChat:loadChat,saveChat:saveChat,clearChat:clearChat,MAX:MAX,
 SUGGESTIONS:["Jadwal kuliah hari ini","Tugas apa yang paling dekat tenggatnya?","Susun jadwal belajar","Prioritas tugas saya","Catatan terakhir saya","Tips belajar efektif"]};
})();
