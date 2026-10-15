"use strict";
(function(){
const DAYS=["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"];
const PRI={high:"Tinggi",mid:"Sedang",low:"Rendah"},STA={todo:"Belum dikerjakan",doing:"Sedang dikerjakan",done:"Selesai"};
const D=()=>Store.data,$=s=>document.querySelector(s);
Store.load();

function add(e,c){if(c==null||c===false)return;if(Array.isArray(c))c.forEach(x=>add(e,x));else e.append(c.nodeType?c:document.createTextNode(c));}
function h(t,a,...kids){const e=document.createElement(t);a=a||{};
 for(const k in a){const v=a[k];if(v==null||v===false)continue;
  if(k==="class")e.className=v;else if(k.startsWith("on"))e.addEventListener(k.slice(2),v);else e.setAttribute(k,v===true?"":v);}
 add(e,kids);return e;}
function toast(m){const t=$("#toast");t.textContent=m;t.className="show";clearTimeout(toast.t);toast.t=setTimeout(()=>t.className="",3500);}
function commit(fn){
 if(Store.error){toast("Mode baca saja: data tersimpan rusak.");return false;}
 const snap=JSON.stringify(D());fn();
 if(Store.save())return true;
 Store.data=JSON.parse(snap);toast("Gagal menyimpan. Periksa ruang penyimpanan browser.");return false;}
const find=(l,id)=>D()[l].find(x=>x.id===id);
const cname=id=>{const c=find("courses",id);return c?c.name:"";};
const pad=n=>("0"+n).slice(-2);
const today=()=>{const d=new Date();return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());};
const fmt=ts=>!ts?"-":new Date(ts).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"});
const courseOpts=()=>[["","— Tidak ada —"]].concat(D().courses.map(c=>[c.id,c.name]));
function download(name,text){const a=h("a",{href:URL.createObjectURL(new Blob([text],{type:"application/json"})),download:name});
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}

function openForm(title,fields,vals,onSave){
 const dlg=h("dialog",{onclose:()=>dlg.remove()}),err=h("p",{class:"err",role:"alert"}),form=h("form",{novalidate:true}),inp={};
 fields.forEach(f=>{let i;
  if(f.type==="select")i=h("select",{id:"f_"+f.k},f.opts.map(o=>h("option",{value:o[0]},o[1])));
  else if(f.type==="textarea")i=h("textarea",{id:"f_"+f.k,rows:f.rows||4,maxlength:f.len||2000});
  else i=h("input",{id:"f_"+f.k,type:f.type||"text",maxlength:f.len,min:f.min,max:f.maxv});
  if(f.type==="checkbox")i.checked=!!vals[f.k];else i.value=vals[f.k]==null?"":vals[f.k];
  inp[f.k]=i;
  form.append(f.type==="checkbox"?h("label",{class:"chk"},i,f.label):h("label",null,f.label+(f.req?" *":""),i));});
 form.append(err,h("div",{class:"row"},h("button",{type:"submit"},"Simpan"),h("button",{type:"button",class:"sec",onclick:()=>dlg.close()},"Batal")));
 form.addEventListener("submit",e=>{e.preventDefault();const v={};
  for(const f of fields){let x=f.type==="checkbox"?inp[f.k].checked:inp[f.k].value.trim();
   if(f.req&&x===""){err.textContent=f.label+" wajib diisi.";inp[f.k].focus();return;}
   if(f.type==="number"&&x!==""){x=Number(x);if(isNaN(x)||x<f.min||x>f.maxv){err.textContent=f.label+" harus antara "+f.min+" dan "+f.maxv+".";inp[f.k].focus();return;}}
   v[f.k]=x;}
  const r=onSave(v);if(typeof r==="string")err.textContent=r;else dlg.close();});
 dlg.append(h("h2",null,title),form);document.body.append(dlg);dlg.showModal();
 const first=dlg.querySelector("input,select,textarea");if(first)first.focus();}

function save(l,old,v){
 const ok=commit(()=>{const now=Date.now();
  if(old.id)Object.assign(find(l,old.id),v,{updated:now});
  else D()[l].push(Object.assign(v,{id:Store.uid(),created:now,updated:now}));});
 if(!ok)return "Data tidak tersimpan.";render();}
function remove(l,it,msg,extra){if(!confirm(msg))return;
 if(commit(()=>{D()[l]=D()[l].filter(x=>x.id!==it.id);if(extra)extra();}))render();}

function editCourse(c){c=c||{};
 openForm(c.id?"Ubah mata kuliah":"Tambah mata kuliah",[
  {k:"name",label:"Nama mata kuliah",req:1,len:100},{k:"code",label:"Kode",len:20},{k:"lecturer",label:"Dosen",len:100},
  {k:"credits",label:"SKS",type:"number",min:0,maxv:10},{k:"semester",label:"Semester",type:"number",min:1,maxv:14},
  {k:"description",label:"Deskripsi",type:"textarea",rows:3,len:500}],c,v=>save("courses",c,v));}
function delCourse(c){remove("courses",c,"Hapus mata kuliah "+c.name+"? Jadwalnya ikut terhapus; catatan dan tugas tetap ada tanpa mata kuliah.",()=>{
 D().schedules=D().schedules.filter(s=>s.courseId!==c.id);
 D().notes.concat(D().tasks).forEach(x=>{if(x.courseId===c.id)x.courseId="";});});}

const clashes=(v,id)=>D().schedules.filter(s=>s.id!==id&&s.day===v.day&&s.start<v.end&&v.start<s.end);
function editSchedule(s){s=s||{};
 if(!D().courses.length){toast("Tambahkan mata kuliah terlebih dahulu.");location.hash="#/courses";return;}
 openForm(s.id?"Ubah jadwal":"Tambah jadwal",[
  {k:"courseId",label:"Mata kuliah",type:"select",req:1,opts:courseOpts()},{k:"day",label:"Hari",type:"select",opts:DAYS.map(d=>[d,d])},
  {k:"start",label:"Jam mulai",type:"time",req:1},{k:"end",label:"Jam selesai",type:"time",req:1},
  {k:"room",label:"Ruang kelas",len:50},{k:"note",label:"Catatan",len:200}],s.id?s:{day:DAYS[0]},v=>{
  if(v.end<=v.start)return "Jam selesai harus setelah jam mulai.";
  const x=clashes(v,s.id);
  if(x.length&&!confirm("Bentrok dengan "+x.map(o=>(cname(o.courseId)||"?")+" "+o.start+"–"+o.end).join(", ")+". Tetap simpan?"))return "Jadwal belum disimpan.";
  return save("schedules",s,v);});}

function editNote(n){n=n||{};
 openForm(n.id?"Ubah catatan":"Tambah catatan",[
  {k:"title",label:"Judul",req:1,len:120},{k:"courseId",label:"Mata kuliah",type:"select",opts:courseOpts()},
  {k:"body",label:"Isi catatan",type:"textarea",rows:7,len:20000},{k:"fav",label:"Favorit",type:"checkbox"}],n,v=>save("notes",n,v));}

function editTask(t){t=t||{};
 openForm(t.id?"Ubah tugas":"Tambah tugas",[
  {k:"title",label:"Judul tugas",req:1,len:120},{k:"courseId",label:"Mata kuliah",type:"select",opts:courseOpts()},
  {k:"due",label:"Tenggat",type:"date"},
  {k:"priority",label:"Prioritas",type:"select",opts:Object.entries(PRI)},{k:"status",label:"Status",type:"select",opts:Object.entries(STA)},
  {k:"description",label:"Deskripsi",type:"textarea",rows:3,len:1000}],t.id?t:{priority:"mid",status:"todo"},v=>save("tasks",t,v));}

const head=(t,fn,lbl)=>h("div",{class:"head"},h("h2",null,t),fn&&h("button",{onclick:()=>fn()},"+ "+lbl));
const none=t=>h("p",{class:"empty"},t);
const acts=(e,d)=>h("div",{class:"row"},h("button",{class:"sec",onclick:e},"Ubah"),h("button",{class:"danger",onclick:d},"Hapus"));
const search=p=>h("input",{type:"search",placeholder:p,"aria-label":p});
function listUI(ctrls,fill){const box=h("div"),run=()=>box.replaceChildren(...fill());
 ctrls.forEach(c=>c.addEventListener("input",run));run();return[h("div",{class:"filters"},ctrls),box];}
const byDue=(a,b)=>(a.due||"9").localeCompare(b.due||"9");
function dueBadge(t){if(!t.due||t.status==="done")return null;
 const d=Math.round((new Date(t.due+"T00:00")-new Date(today()+"T00:00"))/864e5);
 return d<0?h("span",{class:"badge bad"},"Terlambat "+(-d)+" hari"):d===0?h("span",{class:"badge warn"},"Hari ini"):h("span",{class:"badge "+(d<=3?"warn":"ok")},d+" hari lagi");}

function pCourses(){const q=search("Cari mata kuliah…"),sem=[...new Set(D().courses.map(c=>c.semester).filter(Boolean))].sort((a,b)=>a-b),
 sm=h("select",{"aria-label":"Filter semester"},h("option",{value:""},"Semua semester"),sem.map(s=>h("option",{value:s},"Semester "+s)));
 return[head("Mata kuliah",()=>editCourse(),"Tambah"),listUI([q,sm],()=>{
  const t=q.value.toLowerCase(),r=D().courses.filter(c=>(!sm.value||String(c.semester)===sm.value)&&[c.name,c.code,c.lecturer].join(" ").toLowerCase().includes(t)).sort((a,b)=>a.name.localeCompare(b.name));
  return r.length?r.map(c=>h("article",{class:"card"},h("strong",null,c.name+(c.code?" ("+c.code+")":"")),
   h("p",{class:"sub"},[c.lecturer,c.credits!==""&&c.credits!=null?c.credits+" SKS":"",c.semester?"Semester "+c.semester:""].filter(Boolean).join(" · ")||"Belum ada detail"),
   c.description&&h("p",null,c.description),acts(()=>editCourse(c),()=>delCourse(c)))):[none(D().courses.length?"Tidak ada hasil.":"Belum ada mata kuliah. Tambahkan yang pertama.")];})];}

function pSchedule(){const out=[head("Jadwal kuliah",()=>editSchedule(),"Tambah")];
 DAYS.forEach(d=>{const r=D().schedules.filter(s=>s.day===d).sort((a,b)=>a.start.localeCompare(b.start));if(!r.length)return;
  out.push(h("h3",null,d),r.map(s=>{const c=find("courses",s.courseId)||{};
   return h("article",{class:"card"},h("strong",null,s.start+"–"+s.end+"  "+(c.name||"(mata kuliah terhapus)")),
    h("p",{class:"sub"},[c.lecturer,s.room&&"Ruang "+s.room].filter(Boolean).join(" · ")),s.note&&h("p",null,s.note),
    clashes(s,s.id).length?h("span",{class:"badge warn"},"Bentrok dengan jadwal lain"):null,
    acts(()=>editSchedule(s),()=>remove("schedules",s,"Hapus jadwal ini?")));}));});
 if(out.length===1)out.push(none("Belum ada jadwal."));return out;}

function pNotes(){const q=search("Cari catatan…"),f=h("select",{"aria-label":"Filter"},h("option",{value:""},"Semua catatan"),h("option",{value:"1"},"Favorit saja"));
 return[head("Catatan",()=>editNote(),"Tambah"),listUI([q,f],()=>{
  const t=q.value.toLowerCase(),r=D().notes.filter(n=>(!f.value||n.fav)&&[n.title,n.body,cname(n.courseId)].join(" ").toLowerCase().includes(t)).sort((a,b)=>(b.updated||0)-(a.updated||0));
  return r.length?r.map(n=>h("article",{class:"card"},h("strong",null,(n.fav?"★ ":"")+n.title),
   h("p",{class:"sub"},[cname(n.courseId),"Diperbarui "+fmt(n.updated)].filter(Boolean).join(" · ")),
   n.body&&h("p",null,n.body.length>200?n.body.slice(0,200)+"…":n.body),acts(()=>editNote(n),()=>remove("notes",n,"Hapus catatan "+n.title+"?")))):[none(D().notes.length?"Tidak ada hasil.":"Belum ada catatan.")];})];}

function pTasks(){const st=h("select",{"aria-label":"Filter status"},h("option",{value:""},"Semua status"),Object.entries(STA).map(e=>h("option",{value:e[0]},e[1]))),
 pr=h("select",{"aria-label":"Filter prioritas"},h("option",{value:""},"Semua prioritas"),Object.entries(PRI).map(e=>h("option",{value:e[0]},e[1])));
 return[head("Tugas",()=>editTask(),"Tambah"),listUI([st,pr],()=>{
  const r=D().tasks.filter(t=>(!st.value||t.status===st.value)&&(!pr.value||t.priority===pr.value)).sort(byDue);
  return r.length?r.map(t=>h("article",{class:"card"},h("strong",null,t.title),
   h("p",{class:"sub"},[cname(t.courseId),t.due&&"Tenggat "+t.due,"Prioritas "+PRI[t.priority],STA[t.status]].filter(Boolean).join(" · ")),
   dueBadge(t),t.description&&h("p",null,t.description),
   h("div",{class:"row"},h("button",{onclick:()=>{if(commit(()=>{const x=find("tasks",t.id);x.status=x.status==="done"?"todo":"done";x.updated=Date.now();}))render();}},t.status==="done"?"Buka lagi":"Tandai selesai"),
    h("button",{class:"sec",onclick:()=>editTask(t)},"Ubah"),h("button",{class:"danger",onclick:()=>remove("tasks",t,"Hapus tugas "+t.title+"?")},"Hapus")))):[none(D().tasks.length?"Tidak ada hasil.":"Belum ada tugas.")];})];}

function nextClass(){const n=new Date(),di=(n.getDay()+6)%7,hm=pad(n.getHours())+":"+pad(n.getMinutes());
 for(let o=0;o<8;o++){const d=DAYS[(di+o)%7],r=D().schedules.filter(s=>s.day===d&&(o>0||s.end>hm)).sort((a,b)=>a.start.localeCompare(b.start));
  if(r.length)return{s:r[0],when:o===0?"Hari ini":o===1?"Besok":d};}return null;}
function pHome(){const n=new Date(),hr=n.getHours(),g=hr<11?"Selamat pagi":hr<15?"Selamat siang":hr<19?"Selamat sore":"Selamat malam";
 const open=D().tasks.filter(t=>t.status!=="done").sort(byDue),nx=nextClass(),ln=D().notes.slice().sort((a,b)=>(b.updated||0)-(a.updated||0))[0];
 return[h("section",{class:"hero"},h("h1",null,g+", Mahasiswa"),h("p",null,n.toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"}))),
  h("section",{class:"stats"},[["Mata kuliah",D().courses.length],["Tugas aktif",open.length],["Catatan",D().notes.length]].map(s=>h("div",{class:"card"},h("b",null,s[1]),s[0]))),
  h("div",{class:"row"},h("button",{onclick:()=>editCourse()},"+ Mata kuliah"),h("button",{onclick:()=>editSchedule()},"+ Jadwal"),h("button",{onclick:()=>editNote()},"+ Catatan"),h("button",{onclick:()=>editTask()},"+ Tugas")),
  h("h3",null,"Jadwal berikutnya"),nx?h("div",{class:"card"},h("strong",null,nx.when+", "+nx.s.start+"–"+nx.s.end),h("p",null,cname(nx.s.courseId)+(nx.s.room?" · Ruang "+nx.s.room:""))):none("Belum ada jadwal kuliah."),
  h("h3",null,"Tenggat terdekat"),open.length?open.slice(0,3).map(t=>h("div",{class:"card"},h("strong",null,t.title),h("p",{class:"sub"},[cname(t.courseId),t.due].filter(Boolean).join(" · ")||"Tanpa tenggat"),dueBadge(t))):none("Tidak ada tugas yang belum selesai."),
  h("h3",null,"Catatan terakhir"),ln?h("div",{class:"card"},h("strong",null,ln.title),h("p",{class:"sub"},"Diperbarui "+fmt(ln.updated))):none("Belum ada catatan.")];}

function pwaCard(){const body=PWA.standalone?"Aplikasi sudah dipasang dan berjalan mandiri.":!PWA.supported?"Pemasangan dan mode offline butuh HTTPS atau localhost; saat ini dibuka lewat "+location.protocol+"//. Lihat README untuk cara hosting.":'Di Chrome Android: menu ⋮ lalu "Pasang aplikasi" atau "Tambahkan ke layar utama". Di iPhone (Safari): Bagikan lalu "Tambah ke Layar Utama".';
 return h("div",{class:"card"},h("strong",null,"Pasang KULIAHKU"),h("p",null,body),PWA.canPrompt()&&!PWA.standalone?h("div",{class:"row"},h("button",{onclick:()=>PWA.install().then(ok=>toast(ok?"Memasang aplikasi…":"Pemasangan dibatalkan."))},"Pasang sekarang")):null);}
function pData(){const f=h("input",{type:"file",accept:".json,application/json","aria-label":"Pilih berkas cadangan"});
 f.addEventListener("change",()=>{const file=f.files[0];if(!file)return;if(file.size>5e6){toast("Berkas terlalu besar (maks 5 MB).");return;}
  const r=new FileReader();
  r.onload=()=>{const p=Store.parse(String(r.result));if(p.error){toast(p.error);return;}const c=p.data;
   if(!confirm("Ganti semua data saat ini dengan cadangan ini? ("+c.courses.length+" mata kuliah, "+c.schedules.length+" jadwal, "+c.notes.length+" catatan, "+c.tasks.length+" tugas)"))return;
   if(Store.replace(c)){toast("Data berhasil dipulihkan.");render();}else toast("Gagal menyimpan data impor.");};
  r.onerror=()=>toast("Berkas tidak dapat dibaca.");r.readAsText(file);f.value="";});
 return[head("Data & profil"),pwaCard(),
  h("div",{class:"card"},h("strong",null,"Cadangkan data"),h("p",null,"Data hanya tersimpan di browser dan alamat situs ini. Pindah HP, browser, atau domain berarti data kosong, kecuali kamu memulihkan dari cadangan."),
   h("div",{class:"row"},h("button",{onclick:()=>{download("kuliahku-cadangan-"+today()+".json",Store.exportText());toast("Cadangan diunduh.");}},"Unduh cadangan (.json)"))),
  h("div",{class:"card"},h("strong",null,"Pulihkan dari cadangan"),h("p",{class:"sub"},"Memilih berkas akan meminta konfirmasi sebelum mengganti data."),f),
  h("div",{class:"card"},h("strong",null,"Hapus semua data"),h("p",{class:"sub"},"Unduh cadangan dulu jika data masih dibutuhkan."),
   h("div",{class:"row"},h("button",{class:"danger",onclick:()=>{if(confirm("Hapus SEMUA data di browser ini? Tindakan ini tidak bisa dibatalkan.")&&Store.clearAll()){toast("Semua data dihapus.");render();}}},"Hapus semua"))),
  h("div",{class:"card"},h("strong",null,"Tentang & privasi"),h("p",null,"KULIAHKU versi lokal, dibuat untuk AKIP LESTALUHU. Tidak ada data yang dikirim ke server. Riwayat chat AI disimpan terpisah (hapus lewat menu AI) dan tidak ikut cadangan. Login dan peran Developer/Member belum tersedia di versi ini. Jangan simpan informasi rahasia.")) ];}

let chatList=null,pending=false;
function pAI(){
 if(!chatList)chatList=AI.loadChat();
 const log=h("div",{class:"chat",role:"log","aria-live":"polite"}),
  ta=h("textarea",{rows:2,maxlength:8000,placeholder:"Tulis pertanyaan atau tempel teks…","aria-label":"Pesan untuk asisten"}),
  send=h("button",{type:"submit",disabled:pending},"Kirim");
 const paint=()=>{log.replaceChildren(...(chatList.length?chatList.map(m=>h("div",{class:"msg "+m.role},m.text)):[none("Belum ada percakapan. Pilih contoh di bawah atau tulis pesanmu.")]));log.scrollTop=log.scrollHeight;};
 async function ask(text){text=text.trim();if(!text||pending)return;pending=true;send.disabled=true;
  chatList.push({role:"user",text:text,ts:Date.now()});paint();ta.value="";
  log.append(h("div",{class:"msg bot typing"},"AI sedang memproses…"));log.scrollTop=log.scrollHeight;
  let out;try{out=await AI.provider.reply(text,{data:D(),now:new Date(),broken:!!Store.error});}catch(e){out="Layanan AI gagal merespons. Coba lagi.";}
  chatList.push({role:"bot",text:String(out),ts:Date.now()});chatList=chatList.slice(-AI.MAX);
  if(!AI.saveChat(chatList))toast("Riwayat chat tidak tersimpan (penyimpanan penuh atau dibatasi).");
  pending=false;send.disabled=false;paint();}
 ta.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();ask(ta.value);}});
 paint();
 return[h("div",{class:"head"},h("h2",null,"Asisten AI"),h("button",{class:"sec danger",onclick:()=>{if(!confirm("Hapus seluruh riwayat percakapan?"))return;if(!AI.clearChat())toast("Riwayat tidak dapat dihapus.");chatList=[];paint();}},"Hapus chat")),
  h("p",{class:"sub"},"Asisten lokal berbasis aturan, bukan model bahasa. Berjalan di perangkatmu, membaca datamu, dan tidak mengubah data."),
  log,h("div",{class:"chips"},AI.SUGGESTIONS.map(s=>h("button",{type:"button",class:"sec chip",onclick:()=>ask(s)},s)),h("button",{type:"button",class:"sec chip",onclick:()=>{ta.value="Ringkas:\n";ta.focus();}},"Ringkas teks…")),
  h("form",{class:"composer",onsubmit:e=>{e.preventDefault();ask(ta.value);}},ta,send)];}

const R=[["home","⌂","Beranda",pHome],["courses","☰","Kuliah",pCourses],["schedule","▦","Jadwal",pSchedule],["notes","✎","Catatan",pNotes],["tasks","✓","Tugas",pTasks],["ai","✧","AI",pAI],["data","⚙","Data",pData]];
function banner(){return Store.error&&h("div",{class:"card bad",role:"alert"},h("strong",null,"Data tidak dapat dibaca"),h("p",null,Store.error),
 h("div",{class:"row"},Store.broken&&h("button",{class:"sec",onclick:()=>download("kuliahku-data-rusak.json",Store.broken)},"Unduh salinan data rusak"),
  h("button",{class:"danger",onclick:()=>{if(confirm("Hapus data rusak dan mulai dari awal? Kamu juga bisa memulihkan dari berkas cadangan di menu Data.")&&Store.clearAll())render();}},"Mulai dari awal")));}
function render(){const k=location.hash.slice(2)||"home",r=R.find(x=>x[0]===k)||R[0],v=$("#view");
 $("#nav").replaceChildren(...R.map(x=>h("a",{href:"#/"+x[0],"aria-current":x===r?"page":null},h("span",{"aria-hidden":"true"},x[1]),x[2])));
 v.replaceChildren();add(v,[banner(),r[3]()]);document.title=r[2]+" · KULIAHKU";}
window.addEventListener("hashchange",()=>{render();scrollTo(0,0);});
render();
})();
