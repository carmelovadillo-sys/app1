/* =========================================================
   App 1% · beta final
   Parte 1: utilidades, fechas, guardado, copia en la cuenta y Míster
   ========================================================= */
(function(){
'use strict';
var app = document.getElementById('app');
var VERSION = 'Beta final 5 · 11 nov 2026';
var APP_URL = 'https://carmelovadillo-sys.github.io/app1/';
var KEY = 'app1pct.v1';

/* ---------- utilidades ---------- */
function e(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function ahora(){ return Date.now(); }
function pad(n){ return (n<10?'0':'')+n; }
function iso(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function hoy(){ return iso(new Date(ahora())); }
function deIso(s){ var p=s.split('-'); return new Date(+p[0], +p[1]-1, +p[2], 12); }
function sumar(s,n){ var d=deIso(s); d.setDate(d.getDate()+n); return iso(d); }
function entre(a,b){ return Math.round((deIso(b)-deIso(a))/86400000); }
function dsem(s){ return (deIso(s).getDay()+6)%7; } /* lunes = 0 */
function lunesDe(s){ return sumar(s,-dsem(s)); }
var DIAS = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo'];
var DIAS_C = ['L','M','X','J','V','S','D'];
var MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function cap(t){ t=String(t); return t.charAt(0).toUpperCase()+t.slice(1); }
function fechaLarga(s){ var d=deIso(s); return cap(DIAS[dsem(s)])+' '+d.getDate()+' '+MESES[d.getMonth()].slice(0,3); }
function fechaCorta(s){ var d=deIso(s); return d.getDate()+' '+MESES[d.getMonth()].slice(0,3); }
function num(x,dec){ if(x==null||isNaN(x)) return '—'; var r = dec ? Math.round(x*10)/10 : Math.round(x); return String(r).replace('.',',').replace(/\B(?=(\d{3})+(?!\d))/g,'.'); }
function kg(x){ if(x==null||x==='') return '—'; return String(Math.round(x*100)/100).replace('.',','); }
function mmss(s){ s=Math.max(0,Math.round(s)); var h=Math.floor(s/3600), m=Math.floor((s%3600)/60), ss=s%60; return h? h+':'+pad(m)+':'+pad(ss) : m+':'+pad(ss); }
function dur(ms){ var m=Math.round(ms/60000); if(m<60) return m+' min'; return Math.floor(m/60)+' h '+pad(m%60); }
function uid(){ return Math.random().toString(36).slice(2,9)+ahora().toString(36).slice(-4); }
function sinTildes(t){ return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim(); }
function azar(a){ return a[Math.floor(Math.random()*a.length)]; }
function pct(n){ return Math.round((Math.pow(1.01,n)-1)*100); }

/* ---------- datos guardados ---------- */
function nuevoD(){ return {v:1, perfil:null, dias:{}, entrenos:[], deportes:[], actual:null, rutinas:[], retos:[], propios:[], vistos:{}, usadas:{}, chat:[], ts:0, copia:0, ultimaVisita:null}; }
function normalizar(d){ var b=nuevoD(); for(var k in b){ if(d[k]==null) d[k]=b[k]; } return d; }
function cargar(){ try{ var t=localStorage.getItem(KEY); if(!t) return null; var d=JSON.parse(t); return (d && d.v===1) ? normalizar(d) : null; }catch(err){ return null; } }
var D = cargar() || nuevoD();
var TS_CARGA = D.ts || 0;
var sinGuardar = false;
function guardar(mesTocado){
  D.ts = ahora();
  if(D.chat.length>160) D.chat = D.chat.slice(-160);
  try{ localStorage.setItem(KEY, JSON.stringify(D)); sinGuardar=false; }catch(err){ sinGuardar=true; }
  if(mesTocado) NUBE.sucios[mesTocado]=1;
  nubeProgramar(); if(typeof revisarPronto==='function' && D.perfil) revisarPronto();
}
function dia(f, crear){ var d=D.dias[f]; if(!d && crear){ d=D.dias[f]={h:{}}; } return d; }

/* ---------- copia en la cuenta de Claude (solo si este visitante puede) ---------- */
var NUBE = {db:null, base:null, ok:false, t:null, ocupado:false, otra:false, otraTodo:false, sucios:{}, estado:'no', gen:0};
function nucleo(){ var c={}; for(var k in D){ if(k!=='entrenos') c[k]=D[k]; } return c; }
function mesesEntrenos(){ var m={}; D.entrenos.forEach(function(x){ (m[x.fecha.slice(0,7)]=m[x.fecha.slice(0,7)]||[]).push(x); }); return m; }
function nubeProgramar(){ if(!NUBE.ok) return; clearTimeout(NUBE.t); NUBE.t=setTimeout(nubeSubir, 2500); }
async function nubeSubir(todo){
  if(!NUBE.ok || !D.perfil) return;
  if(NUBE.ocupado){ NUBE.otra=true; NUBE.otraTodo=NUBE.otraTodo||!!todo; return; }
  NUBE.ocupado=true; var gen=NUBE.gen, lista=null;
  try{
    var porMes=mesesEntrenos(), meses=Object.keys(porMes).sort();
    lista = todo ? meses : Object.keys(NUBE.sucios);
    NUBE.sucios={};
    for(var i=0;i<lista.length;i++){ if(gen!==NUBE.gen) break; var m=lista[i]; await NUBE.db.doc(NUBE.base+'/ent-'+m).set({ts:D.ts, lista:JSON.stringify(porMes[m]||[])}); }
    if(gen===NUBE.gen) await NUBE.db.doc(NUBE.base+'/app').set({ts:D.ts, meses:meses, nucleo:JSON.stringify(nucleo())});
    NUBE.estado='ok';
  }catch(err){
    if(err && (err.code==='invalid_argument' || err.code==='not_granted' || err.code==='revoked' || err.code==='capability_disabled')){ NUBE.ok=false; NUBE.estado='no'; }
    else if(err && err.code==='quota_exceeded'){ NUBE.estado='lleno'; }
    else NUBE.estado='pendiente';
    if(lista) lista.forEach(function(m){ NUBE.sucios[m]=1; });
  }
  NUBE.ocupado=false;
  if(NUBE.otra && NUBE.ok){ var t=NUBE.otraTodo; NUBE.otra=false; NUBE.otraTodo=false; nubeSubir(t); }
}
async function nubeIniciar(){
  try{
    if(!window.claude || typeof window.claude.use!=='function') return;
    var user = await window.claude.use('user'); var db = await window.claude.use('db');
    if(!user || !db) return;
    var id = await user.id(); if(!id) return;
    if(user.can){ try{ var c = await user.can('data.write'); if(c===false) return; }catch(err){} }
    NUBE.db=db; NUBE.base='data/users/'+id;
    var snap = await db.doc(NUBE.base+'/app').get();
    var r = snap.exists ? snap.data() : null;
    if(r && r.ts && r.nucleo && (!D.perfil || r.ts > TS_CARGA)){
      var n = normalizar(JSON.parse(r.nucleo)), ent=[];
      for(var i=0;i<(r.meses||[]).length;i++){ var s=await db.doc(NUBE.base+'/ent-'+r.meses[i]).get(); if(s.exists){ try{ ent=ent.concat(JSON.parse(s.data().lista||'[]')); }catch(err){} } }
      ent.sort(function(a,b){ return a.ini-b.ini; });
      var habia = !!D.perfil;
      U.sheet=null; U.guia=null; if(U.pantalla==='cierre'||U.pantalla==='resumen'||U.pantalla==='rutinaEd'||U.pantalla==='entreno') { U.pantalla='hoy'; U.hist=[]; }
      D = n; D.entrenos = ent; D.v=1; D.ts=r.ts;
      try{ localStorage.setItem(KEY, JSON.stringify(D)); }catch(err){}
      NUBE.ok=true; NUBE.estado='ok';
      if(U.pantalla==='bienvenida' || !habia){ U.pantalla='hoy'; U.hist=[]; }
      render(); toast(habia ? 'Traídos tus datos más recientes de tu cuenta.' : 'Recuperados tus datos de tu cuenta de Claude.'); fotosDeNube();
      return;
    }
    NUBE.ok=true; NUBE.estado = r ? 'ok' : 'pendiente';
    if(D.perfil && (!r || TS_CARGA >= r.ts)) nubeSubir(true);
    if(!escribiendo()) render();
  }catch(err){ NUBE.ok=false; }
}

/* ---------- copia de seguridad en archivo ---------- */
function copiaTexto(){ var f={}; Object.keys(FOTOS).forEach(function(k){ f[k]=FOTOS[k]; }); return JSON.stringify({app:'App 1%', formato:1, fecha:hoy(), datos:D, fotos:f}); }
async function descargarCopia(){
  var nombre='app-1-copia-'+hoy()+'.json', txt=copiaTexto();
  try{
    var dl = (window.claude && window.claude.use) ? await window.claude.use('downloads') : null;
    if(dl){ await dl.save({filename:nombre, data:txt}); D.copia=ahora(); guardar(); render(); toast('Copia guardada. Guárdala en Archivos o en iCloud Drive.'); return; }
  }catch(err){ if(err && err.code==='declined'){ toast('Copia cancelada.'); return; } }
  U.sheet={tipo:'copiaTexto'}; render();
}
function restaurarDe(txt){
  try{ var o=JSON.parse(txt); var d = o && o.datos ? o.datos : o;
    if(!d || d.v!==1 || !d.dias || typeof d.dias!=='object') throw new Error('formato'); normalizar(d);
    U.sheet={tipo:'confirmarRestaurar', datos:d, fotos:(o&&o.fotos)||{}}; render();
  }catch(err){ toast('Ese archivo no es una copia de la App 1%.'); }
}

/* ---------- sonido y vibración ---------- */
var AC=null;
function sonar(tipo){ if(D.perfil && (D.perfil.sonido===false || D.perfil.celebra==='tranqui')) return; try{
  AC = AC || new (window.AudioContext||window.webkitAudioContext)(); var t=AC.currentTime;
  function nota(f,ini,du,vol,onda){ var o=AC.createOscillator(), g=AC.createGain(); o.type=onda||'sine'; o.frequency.value=f;
    g.gain.setValueAtTime(0.0001,t+ini); g.gain.exponentialRampToValueAtTime(vol||0.08,t+ini+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+ini+du);
    o.connect(g); g.connect(AC.destination); o.start(t+ini); o.stop(t+ini+du+0.05); }
  if(tipo==='marca'){ nota(880,0,.12,.05); }
  if(tipo==='hecho'){ nota(660,0,.18); nota(880,.12,.22); nota(1320,.26,.4); }
  if(tipo==='descanso'){ nota(988,0,.15,.07); nota(988,.22,.15,.07); nota(1319,.44,.3,.07); }
  if(tipo==='record'){ nota(523,0,.14,.08,'triangle'); nota(659,.12,.14,.08,'triangle'); nota(784,.24,.14,.08,'triangle'); nota(1047,.36,.5,.09,'triangle'); nota(1319,.5,.5,.05); }
  if(tipo==='gol'){ nota(587,0,.12,.07,'triangle'); nota(880,.1,.3,.08,'triangle'); }
  if(tipo==='pito'){ nota(2800,0,.22,.035,'square'); nota(2800,.3,.22,.035,'square'); nota(2800,.6,.75,.035,'square'); }
}catch(err){} }


/* ---------- áreas y lo de cada día ---------- */
var AREAS = {
  entreno:{n:'GYM', t:'Entrenar más o mejor', c:'el gym'},
  moverme:{n:'MOVERME', t:'Moverme más: caminar, pasos', c:'moverte'},
  comida:{n:'COMIDA', t:'Comer mejor', c:'la comida'},
  movil:{n:'MÓVIL', t:'Usar menos el móvil', c:'el móvil'},
  sueno:{n:'SUEÑO', t:'Dormir mejor', c:'el sueño'},
  dejar:{n:'DEJAR', t:'Dejar o reducir algo: tabaco, alcohol, apuestas…', c:'dejarlo'},
  animo:{n:'ÁNIMO', t:'Estar de mejor ánimo', c:'tu ánimo'},
  orden:{n:'ORDEN', t:'Organizarme y no dejarlo todo para luego', c:'organizarte'},
  estudio:{n:'ESTUDIO', t:'Estudiar o concentrarme', c:'el estudio'},
  leer:{n:'APRENDER', t:'Leer o aprender algo nuevo', c:'la lectura'}
};
var ORDEN_AREAS = ['entreno','moverme','comida','movil','sueno','dejar','animo','orden','estudio','leer'];
var DEJAR = {tabaco:['Tabaco o vaper','sin fumar ni vapear','fumar'], alcohol:['Alcohol','sin alcohol','beber'], apuestas:['Apuestas','sin apostar','apostar'], porros:['Porros','sin porros','fumar porros'], energeticas:['Energéticas','sin energéticas','tomar energéticas'], otra:['Otra cosa','sin eso que quieres dejar','caer']};

function planGym(f){ var p=D.perfil; return !!(p && p.diasGym && p.diasGym.indexOf(dsem(f))!==-1); }
function areasDe(f){
  var d=D.dias[f];
  if(d && d.areas && f!==hoy()) return d.areas;
  var p=D.perfil; if(!p) return [];
  return p.areas.filter(function(k){ return k!=='entreno' || planGym(f); });
}
function entrenoEl(f){ return D.entrenos.some(function(x){ return x.fecha===f; }) || deportesDe(f).length>0; }
function gymEl(f){ return D.entrenos.some(function(x){ return x.fecha===f; }); }
function deportesDe(f){ return (D.deportes||[]).filter(function(x){ return x.fecha===f; }); }
function hm(m){ m=Math.round(m||0); var h=Math.floor(m/60), r=m%60; return h ? h+' h'+(r?' '+pad(r):'') : r+' min'; }
function metaDe(k,f){ var p=D.perfil, d=f&&D.dias[f], s=d&&d.metas;
  if(k==='movil') return (s&&s.movil) || p.metaMovilMin || (p.metaMovil||3)*60;
  if(k==='sueno') return (s&&s.sueno) || p.metaSuenoMin || (p.metaSueno||7)*60;
  if(k==='moverme') return (s&&s.pasos) || p.metaPasos || 7500; return null; }
function hecho(k,f){ var d=D.dias[f]||{h:{}};
  if(k==='entreno') return entrenoEl(f) || !!d.h.entreno;
  if(k==='moverme') return !!d.h.moverme || (d.pasos!=null && d.pasos >= metaDe('moverme',f));
  if(k==='movil' && d.movilMin!=null) return d.movilMin <= metaDe('movil',f);
  if(k==='sueno' && d.suenoMin!=null) return d.suenoMin >= metaDe('sueno',f);
  return !!d.h[k]; }
function media7(campo, f){ var s=0,n=0; for(var i=1;i<=7;i++){ var d=D.dias[sumar(f||hoy(),-i)]; if(d && d[campo]!=null){ s+=d[campo]; n++; } } return n ? s/n : null; }
function tareas(f){ var d=D.dias[f]; if(d && d.dificil) return ['minimo']; return areasDe(f); }
function hechoT(k,f){ if(k==='minimo'){ var d=D.dias[f]; return !!(d && d.h.minimo); } return hecho(k,f); }
function nHechas(f){ return tareas(f).filter(function(k){ return hechoT(k,f); }).length; }
function cumplido(f){ var t=tareas(f); return t.length>0 && nHechas(f)===t.length; }
function soloDescanso(f){ var p=D.perfil; return p && p.areas.length && areasDe(f).length===0; }
function inicio(){ return D.perfil ? D.perfil.creado : hoy(); }
function diaN(f){ return entre(inicio(), f||hoy())+1; }
function cumplidosHasta(f){ var n=0, a=inicio(); for(var x=a; x<=f; x=sumar(x,1)){ if(cumplido(x)) n++; } return n; }
function fijarAreasHoy(){ var f=hoy(); if(!D.perfil) return; var d=dia(f,true); var a=areasDe(f); if(JSON.stringify(d.areas)!==JSON.stringify(a)){ d.areas=a.slice(); }
  var p=D.perfil; d.metas={movil:p.metaMovilMin||(p.metaMovil||3)*60, sueno:p.metaSuenoMin||(p.metaSueno||7)*60, pasos:p.metaPasos||7500}; }

function tarea(k,f){ var p=D.perfil, d=D.dias[f]||{h:{}};
  switch(k){
    case 'entreno': var u=ultimaSesion(); return {meta:'Entrenar hoy', uno: u ? 'La última vez, '+u.n.toLowerCase()+' '+(u.kg?kg(u.kg)+' × '+u.reps:u.reps+' repeticiones')+'. Hoy, una más.' : (p.abandono==='tiempo' ? 'Aunque sean 20 minutos, cuenta.' : 'Con '+(p.tiempo&&p.tiempo<60?p.tiempo:30)+' minutos vale. Apunta lo que hagas.')};
    case 'moverme': var mp=metaDe('moverme',f), mdp=media7('pasos',f); return {meta: num(mp)+' pasos', uno: d.pasos!=null ? 'Llevas '+num(d.pasos)+(d.pasos>=mp?'. Dentro.':'. Te faltan '+num(mp-d.pasos)+', o 30 minutos andando.') : (mdp?'Tu media: '+num(mdp)+'. Toca para apuntarlos':'Toca para apuntar tus pasos, o 30 minutos andando')};
    case 'comida': return {meta:'Comer bien hoy', uno:unoComida(p)};
    case 'movil': var mm=metaDe('movil',f), mdm=media7('movilMin',f); return {meta:'Menos de '+hm(mm)+' de pantalla', uno: d.movilMin!=null ? 'Hoy, '+hm(d.movilMin)+(d.movilMin<=mm?'. Dentro.':'. Te pasas '+hm(d.movilMin-mm)+'.') : (mdm?'Tu media: '+hm(mdm)+'. Míralo en Tiempo de uso y apúntalo':'Míralo en Ajustes → Tiempo de uso y apúntalo')};
    case 'sueno': var ms=metaDe('sueno',f); return {meta:'Dormir '+hm(ms)+' o más', uno: d.suenoMin!=null ? 'Anoche, '+hm(d.suenoMin)+(d.suenoMin>=ms?'. Bien.':'. Esta noche, antes a la cama.') : 'Toca para apuntar lo que dormiste anoche'};
    case 'dejar': var q=DEJAR[(p.dejar&&p.dejar.que)||'otra']; return {meta:'Hoy, '+q[1], uno: eurosDia()>0 ? 'Cada día así te ahorras '+num(eurosDia(),1)+' €' : 'Un día más cuenta'};
    case 'animo': return {meta:'Un rato para ti', uno:'10 minutos al aire libre o con alguien'};
    case 'orden': return {meta:'Tu tarea del día', uno:'La que más pereza te da, antes de las 20:00'};
    case 'estudio': return {meta:'Estudiar sin móvil', uno:'45 minutos seguidos, con el móvil en otra habitación'};
    case 'leer': return {meta:'Leer un rato', uno:'10 páginas'};
    case 'minimo': return minimoTarea(p);
  }
  return {meta:'', uno:''};
}
function chungoTxt(p){ p=p||D.perfil||{}; var k=p.chungo||'paseo20'; if(k==='propio' && p.chungoTxt) return p.chungoTxt; var c=CHUNGO.filter(function(x){ return x[0]===k; })[0]; return c&&k!=='propio'?c[1]:'Paseo de 20 minutos'; }
function minimoTarea(p){ var k=(p&&p.chungo)||'paseo20', hr=new Date(ahora()).getHours(), noche=hr>=21||hr<7;
  if(/^paseo/.test(k)) return noche ? {meta:'Estirar 10 minutos', uno:'De noche, mejor esto que salir. Tu paseo, mañana. Con eso, hoy vale.'} : {meta:chungoTxt(p), uno:'Con eso, hoy vale.'};
  if(k==='casa') return {meta:'Una serie corta en casa', uno:'10 minutos: sentadillas, flexiones o lo que te salga. Con eso vale.'};
  if(k==='ducha') return {meta:'Ducha y a dormir pronto', uno:'Hoy toca recargar. Con eso, hoy vale.'};
  if(k==='estirar') return {meta:'Estirar 10 minutos', uno:'Con eso, hoy vale.'};
  return {meta:chungoTxt(p), uno:'Lo que tú elegiste. Con eso, hoy vale.'}; }
function eurosDia(){ var p=D.perfil; return (p && p.dejar && p.dejar.euros) ? p.dejar.euros/7 : 0; }
function diasSinDejar(){ var n=0; for(var x=inicio(); x<=hoy(); x=sumar(x,1)){ var d=D.dias[x]; if(d && d.h && d.h.dejar) n++; } return n; }

/* ---------- gym: historial y récords ---------- */
function sesiones(n){ var r=[]; for(var i=D.entrenos.length-1;i>=0;i--){ var x=D.entrenos[i]; for(var j=0;j<x.ej.length;j++){ if(x.ej[j].n===n){ r.push({fecha:x.fecha, s:x.ej[j].s, id:x.id}); break; } } } return r; }
function mejor(n, sinId){ var b=null; D.entrenos.forEach(function(x){ if(x.id===sinId) return; x.ej.forEach(function(ej){ if(ej.n!==n) return; ej.s.forEach(function(s){ if(s[2]) return; if(!b || s[0]>b[0] || (s[0]===b[0] && s[1]>b[1])) b=[s[0],s[1]]; }); }); }); return b; }
function e1rm(k,r){ return (k>0 && r>0) ? k*(1+Math.min(r,15)/30) : 0; }
function ultimaSesion(){ for(var i=D.entrenos.length-1;i>=0;i--){ var x=D.entrenos[i]; var sv=x.ej.length ? x.ej[0].s.filter(function(z){ return !z[2]; }) : []; if(sv.length){ var s=sv.reduce(function(a,b){ return (b[0]>a[0]||(b[0]===a[0]&&b[1]>a[1]))?b:a; }); return {n:x.ej[0].n, kg:s[0], reps:s[1]}; } } return null; }
function volumen(ej){ var v=0, n=0; ej.forEach(function(x){ x.s.forEach(function(s){ if(s[2]) return; v+=(s[0]||0)*(s[1]||0); n++; }); }); return {v:v, n:n}; }
function records(x){ var r=[]; x.ej.forEach(function(ej){ var b=mejor(ej.n, x.id); if(!b) return; var top=null; ej.s.forEach(function(s){ if(s[0]>b[0] || (s[0]===b[0] && s[1]>b[1])){ if(!top || s[0]>top[0] || (s[0]===top[0]&&s[1]>top[1])) top=s; } }); if(top) r.push({n:ej.n, kg:top[0], reps:top[1]}); }); return r; }
function entrenosSemana(lunes){ var fin=sumar(lunes,6); var dias={}; D.entrenos.concat(D.deportes||[]).forEach(function(x){ if(x.fecha>=lunes && x.fecha<=fin) dias[x.fecha]=1; }); for(var f=lunes; f<=fin; f=sumar(f,1)){ var d=D.dias[f]; if(d && d.h && d.h.entreno) dias[f]=1; } return Object.keys(dias).length; }

/* ---------- calorías (estimación con METs) ---------- */
var DEPORTES = [['padel','Pádel',6],['futbol','Fútbol',7],['correr','Correr',9],['bici','Bici',7.5],['natacion','Natación',7],['baloncesto','Baloncesto',6.5],['tenis','Tenis',7],['senderismo','Senderismo',5],['boxeo','Boxeo',9],['escalada','Escalada',7.5],['yoga','Yoga',3],['otro','Otro',5]];
var MET_GYM = 4.5;
function pesoKcal(){ var p=D.perfil||{}; return +p.peso||70; }
function kcalDe(met, min){ return Math.round(met*3.5*pesoKcal()/200*Math.max(0,Math.min(min,240))); }
function kcalEntreno(x){ return kcalDe(MET_GYM, ((x.fin||x.ini)-x.ini)/60000); }
function depInfo(k){ return DEPORTES.filter(function(d){ return d[0]===k; })[0] || DEPORTES[DEPORTES.length-1]; }
function kcalDeporte(x){ return kcalDe(depInfo(x.dep)[2], x.min||0); }
function nombreDeporte(x){ return x.dep==='otro' && x.nombre ? x.nombre : depInfo(x.dep)[1]; }
function kcalEntre(a, b){ var k=0; D.entrenos.forEach(function(x){ if(x.fecha>=a && x.fecha<=b) k+=kcalEntreno(x); }); (D.deportes||[]).forEach(function(x){ if(x.fecha>=a && x.fecha<=b) k+=kcalDeporte(x); }); return k; }
function grasaTxt(kcal){ var g=kcal/7.7; return g>=1000 ? num(g/1000,1)+' kg' : num(g)+' g'; }
var KCAL_DONDE = 'Calorías = MET × 3,5 × tu peso ÷ 200 × minutos. Pesas: MET 4,5 de media; cada deporte, el suyo (Compendium of Physical Activities). Grasa: 7.700 kcal ≈ 1 kg. Es una estimación: lo que pierdes de verdad depende también de lo que comes.';

/* ---------- Tú contra ti ---------- */
function jugadas(lunes, hasta){
  var p=D.perfil, previo=sumar(lunes,-7), lim=Math.min(dsem(hasta),6), primera = lunesDe(inicio())===lunes;
  var hoyAbierto = hasta===hoy() && !((D.dias[hoy()]||{}).cerrado), limR = hoyAbierto ? lim-1 : lim;
  function cuenta(desde, fn){ var n=0, l2 = desde===lunes ? lim : limR; for(var i=0;i<=l2;i++){ var f=sumar(desde,i); if(f>=inicio() && f<=hoy() && fn(f)) n++; } return n; }
  var js=[];
  function add(nombre, det, tu, su, fmt, inv){ var r = tu>su?'tu':(tu<su?'su':'eq'); if(inv && tu && su) r = tu<su?'tu':(tu>su?'su':'eq'); if(inv && (!tu||!su)) r = 'nada'; if(tu===0 && su===0) r='nada'; js.push({n:nombre, d:det, tu:tu, su:su, r:r, f:fmt}); }
  function mediaR(desde, campo, l2){ var s=0,n=0; for(var i=0;i<=l2;i++){ var x=D.dias[sumar(desde,i)]; if(x && x[campo]!=null){ s+=x[campo]; n++; } } return n?Math.round(s/n):0; }
  var riv = primera ? null : previo;
  add('Tu 1%','días cumplido', cuenta(lunes,cumplido), riv?cuenta(riv,cumplido):0);
  add('Días cerrados','', cuenta(lunes,function(f){ var d=D.dias[f]; return d&&d.cerrado; }), riv?cuenta(riv,function(f){ var d=D.dias[f]; return d&&d.cerrado; }):0);
  p.areas.forEach(function(k){
    if(k==='entreno'){ var a=0,b=0; if(primera && p.base){ var bd={'0':0,'1-2':2,'3-4':3,'5+':5}[p.base.deporte]||0; b=Math.floor(bd*(limR+1)/7); } for(var i=0;i<=lim;i++){ if(entrenoEl(sumar(lunes,i))||((D.dias[sumar(lunes,i)]||{h:{}}).h.entreno)) a++; if(riv && i<=limR && (entrenoEl(sumar(riv,i))||((D.dias[sumar(riv,i)]||{h:{}}).h.entreno))) b++; } add('Gym','días entrenados',a,b); return; }
    if(k==='moverme'){ var pa=0,pb=0; for(var j=0;j<=lim;j++){ var x=D.dias[sumar(lunes,j)]; if(x&&x.pasos) pa+=x.pasos; var y=riv&&j<=limR&&D.dias[sumar(riv,j)]; if(y&&y.pasos) pb+=y.pasos; } if(primera && p.base && +p.base.pasos){ var dp=0; for(var z=0;z<=limR;z++){ if(sumar(lunes,z)>=inicio()) dp++; } pb=(+p.base.pasos)*dp; } add('Pasos','en total',pa,pb,'num'); return; }
    if(k==='movil' || k==='sueno'){ var campo=k==='movil'?'movilMin':'suenoMin', ta=mediaR(lunes,campo,lim), tb=riv?mediaR(riv,campo,limR):0;
      if(primera && p.base){ tb = k==='movil' ? Math.round((+p.base.movil||0)*60) : ({'5':330,'6':390,'7':450,'8':510}[p.base.sueno]||0); }
      if(ta||tb){ add(k==='movil'?'Móvil':'Sueño', 'media al día', ta, tb, 'hm', k==='movil'); return; } }
    add(k==='dejar' ? cap(DEJAR[(p.dejar&&p.dejar.que)||'otra'][1]) : cap(AREAS[k].n.toLowerCase()), 'días hecho', cuenta(lunes,function(f){ return hecho(k,f); }), riv?cuenta(riv,function(f){ return hecho(k,f); }):0);
  });
  return js;
}
function marcador(js){ var a=0,b=0; js.forEach(function(j){ if(j.r==='tu')a++; if(j.r==='su')b++; }); return [a,b]; }
function partidoOn(){ return D.perfil && D.perfil.partido!==false; }

/* ---------- Míster ---------- */
function tonoReal(feliz){ var t=D.perfil.tono||'directo';
  if(t==='auto') t = feliz==null ? 'directo' : (feliz>=8?'exigente':(feliz>=6?'directo':'suave'));
  if(feliz!=null && feliz<=5) t='suave';
  var hd=D.dias[sumar(hoy(),-1)]; if(hd && hd.feliz!=null && hd.feliz<=3 && t==='exigente') t='directo';
  if((D.perfil.animo==='bajo'||D.perfil.animo==='muybajo') && t==='exigente') t='directo';
  return t; }
function huecos(extra){ var p=D.perfil, f=hoy(), l=lunesDe(f), m=marcador(jugadas(l,f));
  var h={nombre:p.nombre, 'día':DIAS[dsem(f)], curva:'+'+pct(cumplidosHasta(f))+' %', cumplidos:String(cumplidosHasta(f)), dia_n:String(diaN()), marcador:m[0]+'–'+m[1], 'área':AREAS[p.areas[0]].c};
  if(p.areas.indexOf('entreno')!==-1 && p.diasGym && p.diasGym.length){ h.hecho=String(entrenosSemana(l)); h.meta=String(p.diasGym.length); }
  for(var k in extra) h[k]=extra[k];
  return h; }
function rellenar(t,h){ var falta=false; var r=t.replace(/\[([a-z_áéíóú]+)\]/g,function(m,k){ if(h[k]==null||h[k]===''){ falta=true; return m; } return h[k]; }); return falta?null:r; }
function hash(t){ var h=0; for(var i=0;i<t.length;i++){ h=(h*31+t.charCodeAt(i))|0; } return 'h'+(h>>>0).toString(36); }
function frase(sit, extra, feliz){ var B=BANCO[sit]; if(!B) return null; var t=tonoReal(feliz); var lista=B[t]||B.suave||B.directo; if(sit==='Día difícil') lista=B.suave;
  var h=huecos(extra||{}), ok=[];
  var tres = D.perfil && tareas(hoy()).length===3;
  lista.forEach(function(x){ if(/\b(te aviso|aviso|avisar|avise|avisos|te escribo a las|qu[eé] hora te|hora te pongo|notificaci)/i.test(x)) return; if(!tres && /\b(tres|las 3)\b/i.test(x)) return; if(/\b(dos de tres|2 de 3)\b/i.test(x) && !tres) return; var r=rellenar(x,h); if(r) ok.push(r); });
  if(!ok.length) return null;
  var lim=sumar(hoy(),-30), libres=ok.filter(function(r){ var u=D.usadas[hash(r)]; return !u || u<lim; });
  var r=azar(libres.length?libres:ok); D.usadas[hash(r)]=hoy();
  for(var k in D.usadas){ if(D.usadas[k]<lim) delete D.usadas[k]; }
  return r; }
function msgDelDia(){ var f=hoy(), n=diaN(f), lab=dsem(f)===0?'lunes':(dsem(f)>=5?'finde':'general');
  var c=DIAMSG.filter(function(x){ return x[0]===lab; }); if(!c.length) c=DIAMSG;
  if(!(D.perfil && tareas(hoy()).length===3)) c=c.filter(function(x){ return !/\btres\b/i.test(x[1]); }) || c;
  var x=c[(n-1)%c.length]; return rellenar(x[1],huecos({}))||rellenar(DIAMSG[(n-1)%DIAMSG.length][1],huecos({}))||'Hoy, un poco mejor que ayer. Con eso vale.'; }
function decir(t, f){ if(!t) return; D.chat.push({m:t, f:f||hoy()}); }
function mensajeDeHoy(){
  var f=hoy(); if(!D.perfil || D.vistos['msg-'+f]) return;
  D.vistos['msg-'+f]=1;
  var n=diaN(f), ult=D.ultimaVisita, aus = ult ? entre(ult,f) : 0, t=null, ds=dsem(f);
  if(n===1) t=frase('Día 1, recién acabado el test');
  else if(aus>=30) t=frase('Vuelve tras un mes o más');
  else if(aus>=7) t=frase('Vuelve tras una semana sin abrir');
  else if(n===7) t=frase('Día 7');
  else if(n===30) t=frase('Cumple un mes en la app');
  else if(n<=3) t=frase('Días 2 y 3');
  else if(ds===0 && partidoOn() && lunesDe(inicio())!==f) t=frase('Empieza el partido', {rival:rivalTxt()});
  else if(ds===0) t=frase('Lunes');
  else if(ds===4) t=frase('Viernes');
  else if((ds===2||ds===3) && partidoOn()){ var m=marcador(jugadas(lunesDe(f),sumar(f,-1))); t=frase(m[0]>m[1]?'Vas ganando a mitad de semana':(m[0]<m[1]?'Vas perdiendo a mitad de semana':'Empate a mitad de semana'), {marcador:m[0]+'–'+m[1]}); }
  if(!t) t=msgDelDia();
  decir(t,f);
}
function rivalTxt(){ var l=sumar(lunesDe(hoy()),-7), n=0; for(var i=0;i<7;i++){ if(cumplido(sumar(l,i))) n++; } return n+(n===1?' día':' días')+' con tu 1% cumplido'; }

/* ---------- lo que te sienta mejor ---------- */
function pista(){
  var cerr=[]; for(var x=inicio(); x<=hoy(); x=sumar(x,1)){ var d=D.dias[x]; if(d && d.feliz!=null) cerr.push(x); }
  if(cerr.length<7) return {falta: 7-cerr.length};
  var best=null;
  D.perfil.areas.forEach(function(k){ var a=[],b=[]; cerr.forEach(function(f){ if(k==='entreno' && !planGym(f) && !hecho(k,f)) return; (hecho(k,f)?a:b).push(D.dias[f].feliz); });
    if(a.length>=3 && b.length>=3){ var ma=a.reduce(function(s,v){return s+v;},0)/a.length, mb=b.reduce(function(s,v){return s+v;},0)/b.length; var dif=ma-mb; if(!best || Math.abs(dif)>Math.abs(best.dif)) best={k:k,dif:dif,ma:ma,mb:mb,na:a.length,nb:b.length}; } });
  if(!best || Math.abs(best.dif)<0.3) return {nada:true, n:cerr.length};
  return best; }

/* =========================================================
   Parte 2: piezas de interfaz y pantallas (sin el gym)
   ========================================================= */
var U = {pantalla: D.perfil ? 'hoy' : 'bienvenida', hist:[], toast:'', undo:null, sheet:null, t:{}, guia:null, cierreDe:null, ck:null, mes:null, ultimo:null, busca:'', grupo:'Todos', modoEj:'ver', ejSel:null, vista:0, pausa:false, rutinaEd:null, retoSel:null, nuevoReto:null, prevPant:null};

var I = {
  back:'<path d="M15 5l-7 7 7 7"/>', arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>', check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  circle:'<circle cx="12" cy="12" r="9"/>', plus:'<path d="M12 5v14M5 12h14"/>', minus:'<path d="M5 12h14"/>', play:'<path d="M8 5l11 7-11 7z"/>',
  chev:'<path d="M9 5l7 7-7 7"/>', chevL:'<path d="M15 5l-7 7 7 7"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>', search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.5"/>', trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  dots:'<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  car:'<path d="M3 16v-3.5l2.2-5h9.6l3.2 5H21V16z"/><circle cx="7" cy="16.5" r="1.8"/><circle cx="17" cy="16.5" r="1.8"/>',
  hoy:'<path d="M3.5 3.5h7v7h-7zM13.5 3.5h7v7h-7zM3.5 13.5h7v7h-7zM13.5 13.5h7v7h-7z"/>',
  gym:'<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
  progreso:'<path d="M3.5 4.5h17v16h-17zM3.5 9.5h17M8 2.5v4M16 2.5v4"/>',
  mister:'<path d="M4 5h16v11H9l-5 4z"/>', person:'<circle cx="12" cy="4.5" r="2"/><path d="M12 7v6M12 13l-4 3v4M12 13l4 3v4M6 9h12"/>',
  pausa:'<path d="M8 5v14M16 5v14"/>', camara:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  retos:'<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5v1.5A3.5 3.5 0 0 0 8.5 11M16 6h3v1.5A3.5 3.5 0 0 1 15.5 11M12 13v4M8.5 20h7M10 17h4v3h-4z"/>', reloj:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>'
};
function ic(k,s,w){ s=s||22; w=w||2.4; return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+I[k]+'</svg>'; }
function M(t){ return '<div class="mister"><span class="tag">MÍSTER</span><p>'+t+'</p></div>'; }
function cta(label,a,v,right,cls,extra){ return '<button type="button" class="cta '+(cls||'')+'" data-a="'+a+'" data-v="'+e(v==null?'':v)+'"'+(extra||'')+'><span class="cta-t">'+label+'</span>'+(right===undefined?ic('arrow'):right)+'</button>'; }
function opt(inner,on,a,v,cls){ return '<button type="button" class="opt '+(cls||'')+(on?' on':'')+'" aria-pressed="'+(on?'true':'false')+'" data-a="'+a+'" data-v="'+e(v)+'">'+inner+'</button>'; }
function backBtn(){ return '<button type="button" class="ib" data-a="back" aria-label="Atrás">'+ic('back',24)+'</button>'; }
function head(title){ return '<div class="row">'+backBtn()+'<h1 class="h1 m" style="font-size:36px">'+title+'</h1></div>'; }
function headLbl(lbl, derecha){ return '<div class="row">'+backBtn()+'<span class="lbl" style="flex:1">'+lbl+'</span>'+(derecha||'')+'</div>'; }
function ini(){ return ((D.perfil&&D.perfil.nombre)||'?').trim().charAt(0).toUpperCase()||'?'; }
function avatarIn(){ return (typeof FOTOS!=='undefined' && FOTOS.perfil) ? '<img src="'+FOTOS.perfil+'" alt="">' : e(ini()); }
function plural(n,a,b){ return n+' '+(n===1?a:b); }

/* ====================== TEST INICIAL (20 preguntas) ====================== */
var V = {};
var PREG = {
  nombre:{b:'Tú', tipo:'nombre'},
  edad:{b:'Tú', tipo:'edad'},
  mejorar:{b:'Tu objetivo', tipo:'areas'},
  deporte:{b:'Ahora mismo', h:'¿Cuántos días haces deporte a la semana?', p:'Cuenta cualquier cosa: gym, fútbol, correr, pádel… Lo que haces de verdad.', grid:2, ops:[['0','Ninguno'],['1-2','1 o 2'],['3-4','3 o 4'],['5+','5 o más']]},
  movil:{b:'Ahora mismo', h:'¿Cuántas horas de móvil al día?', p:'Míralo en Ajustes del iPhone → Tiempo de uso. Nadie más lo ve.', ops:[['1.5','Menos de 2 horas'],['2.5','De 2 a 3 horas'],['3.5','De 3 a 4 horas'],['5','De 4 a 6 horas'],['7','Más de 6 horas']]},
  sueno:{b:'Ahora mismo', h:'¿Cuántas horas duermes entre semana?', grid:2, ops:[['5','Menos de 6'],['6','6 o 7'],['7','7 u 8'],['8','Más de 8']]},
  comida:{b:'Ahora mismo', h:'¿Cómo comes normalmente?', ops:[['bien','Bien, casi siempre'],['normal','Normal, sin más'],['regular','Regular: mucho picoteo o comida rápida'],['mal','Mal, y lo sé']]},
  pasos:{b:'Ahora mismo', h:'¿Cuánto caminas al día?', p:'Lo ves en la app Salud del iPhone, en Pasos.', ops:[['3000','Poco: menos de 4.000 pasos'],['6000','Normal: de 4.000 a 8.000'],['9000','Bastante: más de 8.000'],['0','No lo sé']]},
  dejar:{b:'Ahora mismo', tipo:'dejar'},
  retoTest:{b:'Un reto', tipo:'reto'},
  diasGym:{b:'Gym', tipo:'dias'},
  nivel:{b:'Gym', h:'¿Cuánto tiempo llevas entrenando?', ops:[['nuevo','Empiezo ahora'],['poco','Menos de 1 año'],['medio','De 1 a 3 años'],['alto','Más de 3 años']]},
  objetivo:{b:'Gym', h:'¿Qué buscas en el gym?', grid:2, ops:[['musculo','Ganar músculo'],['fuerza','Ganar fuerza'],['grasa','Perder grasa'],['salud','Estar en forma']]},
  donde:{b:'Gym', h:'¿Dónde entrenas?', ops:[['gym','En un gimnasio'],['casa','En casa, con algo de material'],['nada','Sin material, con mi cuerpo']]},
  tiempo:{b:'Gym', h:'¿Cuánto tiempo tienes para cada entreno?', grid:2, ops:[['30','30 minutos'],['45','45 minutos'],['60','1 hora'],['90','Más de 1 hora']]},
  animo:{b:'Cómo eres', tipo:'animo'},
  chungo:{b:'Cómo eres', tipo:'chungo'},
  abandono:{b:'Cómo eres', h:'Cuando dejas algo, ¿por qué suele ser?', p:'Con esto sé cómo ayudarte justo donde sueles fallar.', ops:[['tiempo','Por falta de tiempo'],['motivacion','Se me pasan las ganas'],['aburro','Me aburro de hacer siempre lo mismo'],['dificil','Me lo pongo demasiado difícil'],['otro','No suelo dejar las cosas']]},
  motiva:{b:'Cómo eres', h:'¿Qué te motiva más?', ops:[['numeros','Ver mis números subir'],['ganar','Ganarme a mí mismo'],['celebrar','Que me celebren cuando lo hago bien'],['apretar','Que me aprieten']]},
  tono:{b:'Cómo eres', tipo:'tono'},
  celebra:{b:'Tu app', h:'¿Cómo quieres que celebre tus logros?', p:'Récords, días cumplidos, goles, semanas completas… Solo cuando lo ganas de verdad.', ops:[['tope','A tope: confeti, sonido y vibración'],['normal','Normal: confeti en lo importante'],['tranqui','Tranquilo: sin ruido ni confeti']]},
  aspecto:{b:'Tu app', tipo:'aspecto'}
};
function pasosTest(){ var t=U.t, o=['nombre','edad','mejorar','deporte','movil','sueno','comida','pasos','dejar','retoTest'];
  if(t.areas && t.areas.indexOf('entreno')!==-1) o=o.concat(['diasGym','nivel','objetivo','donde','tiempo']);
  return o.concat(['animo','chungo','abandono','motiva','tono','celebra','aspecto']); }
function testTop(){ var o=pasosTest(), n=o.indexOf(U.pantalla)+1, q=PREG[U.pantalla];
  return '<div class="obtop">'+backBtn()+'<span class="bar" aria-hidden="true"><span style="width:'+Math.round(n/o.length*100)+'%"></span></span><span class="lbl">'+n+' de '+o.length+'</span></div>'+(q&&q.b?'<span class="lbl acc" style="margin-top:-4px">'+q.b+'</span>':''); }
function testSig(){ var o=pasosTest(), i=o.indexOf(U.pantalla); var sig = i<o.length-1 ? o[i+1] : 'plan'; return cta(i<o.length-1?'SIGUIENTE':'VER MI PLAN','testSig',sig,undefined,faltaTest()?'off':''); }
function faltaTest(){ var t=U.t, k=U.pantalla, q=PREG[k];
  if(k==='nombre') return (t.nombre||'').trim()?'':'Escribe tu nombre o un apodo.';
  if(k==='edad'){ var n=parseInt(t.edad,10); if(!t.edad || isNaN(n)) return 'Escribe tu edad.'; if(n<16) return 'Con menos de 16 años todavía no puedes usar la app.'; if(n>99) return 'Revisa la edad.'; return cuerpoMal(t.peso, t.altura); }
  if(k==='chungo'){ if(!t.chungo) return 'Elige tu mínimo para un día chungo.'; if(t.chungo==='propio' && !String(t.chungoTxt||'').trim()) return 'Escribe tu mínimo.'; return ''; }
  if(k==='retoTest') return t.reto!=null?'':'Elige un reto o «Ahora no».';
  if(k==='mejorar') return (t.areas&&t.areas.length)?'':'Elige al menos una.';
  if(k==='diasGym') return (t.diasGym&&t.diasGym.length)?'':'Elige al menos un día.';
  if(k==='dejar'){ if(!t.dejar||!t.dejar.que) return 'Elige una opción.'; if(t.areas.indexOf('dejar')!==-1 && t.dejar.que==='nada') return 'Has elegido dejar algo: dime qué.'; return ''; }
  if(k==='animo') return t.animo?'':'Elige cómo has estado. No hay respuesta mala.';
  if(q && q.ops) return t[k]!=null?'':'Elige una opción.';
  return ''; }
function preg(k){ var q=PREG[k], t=U.t, h='', larga=q.ops.some(function(o){ return o[1].length>16; });
  q.ops.forEach(function(o){ var on=t[k]===o[0]; h+= (q.grid && !larga) ? opt('<span class="t" style="font-size:17px">'+o[1]+'</span>', on,'t:'+k,o[0],'mid c') : opt('<span class="dot" aria-hidden="true"></span><span>'+o[1]+'</span>', on,'t:'+k,o[0],'calm'); });
  var extra = respuestaTest(k);
  return testTop()+'<h1 class="h1 q">'+q.h+'</h1>'+(q.p?'<p class="p2">'+q.p+'</p>':'')+'<div class="'+((q.grid&&!larga)?'grid2':'col')+'" style="gap:8px">'+h+'</div>'+(extra?'<div class="box pad rev">'+M(extra)+'</div>':'')+'<div class="fill"></div>'+testSig(); }
function respuestaTest(k){ var t=U.t, v=t[k]; if(v==null) return '';
  switch(k){
    case 'deporte': return {'0':'Empezamos de cero, sin prisa.','1-2':'Hay base. Desde ahí, un poco más.','3-4':'Buena base. Ahora, que sea constante.','5+':'Eres constante. Vamos a por progresar.'}[v];
    case 'movil': return +v>=4 ? 'Sin juicios. Tu meta será un poco menos de lo que haces ahora, no la mitad.' : 'Bien. Lo mantenemos o rascamos un poco.';
    case 'sueno': return +v<=5 ? 'Dormir poco lo empeora todo. Lo cuidamos.' : '';
    case 'comida': return (v==='regular'||v==='mal') ? 'Empezamos por una sola comida buena al día. Nada de dietas.' : '';
    case 'nivel': return v==='nuevo' ? 'Perfecto. Te enseño cada ejercicio con su animación y empezamos con pesos cómodos.' : '';
    case 'objetivo': return {musculo:'Series de 8 a 12 y descansos de 90 segundos.',fuerza:'Series cortas y pesadas, con descansos de 2 minutos y medio.',grasa:'Descansos cortos, de 1 minuto, y moverte también fuera del gym.',salud:'Un poco de todo y, sobre todo, constancia.'}[v];
    case 'abandono': return {tiempo:'Entonces nada de planes largos: los días justos, cuenta lo mínimo.',motivacion:'Para eso están el partido contra ti y las celebraciones. Y yo, dándote la lata.',aburro:'Te iré proponiendo retos cortos para cambiar de aire.',dificil:'Entonces empezamos más fácil de lo que crees. Ya subiremos.',otro:'Me gusta. Pues a demostrarlo.'}[v];
    case 'motiva': return {numeros:'Tendrás tu curva y tus marcas siempre a la vista.',ganar:'Cada semana juegas contra tu yo de la semana pasada.',celebrar:'Hecho. Cada logro de verdad tendrá su fiesta.',apretar:'Te pongo el tono exigente. Lo puedes cambiar.'}[v];
  } return ''; }
V.bienvenida = function(){ return ''+
  '<div class="row" style="gap:12px;margin-top:16px"><span class="logo" aria-hidden="true" style="margin-top:0">1%</span><span class="nuevo">BETA</span></div>'+
  '<h1 class="h1 xl" style="margin-top:16px">Un <span class="hl">1%</span> mejor cada día.</h1>'+
  '<p class="p2 lg">Para ser constante con el gym y con lo que quieras cambiar: moverte más, el móvil, la comida, el sueño o dejar algo. Sin rachas que se rompen y sin culpa cuando fallas.</p>'+
  '<div class="fill"></div>'+
  '<div class="box pad">'+M('Antes de empezar, unas preguntas rápidas: unos 3 minutos. Con ellas hago la app a tu medida.')+'</div>'+
  cta('EMPEZAR','testInicio')+
  '<label class="link c" style="display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative">¿Ya la usabas? Recupera tu copia<input type="file" accept=".json,application/json" data-f="restaurar" style="position:absolute;width:1px;height:1px;opacity:0"></label>'+
  '<p class="nota c">Desde 16 años · tus datos se quedan en tu móvil</p>'; };
V.nombre = function(){ return testTop()+'<h1 class="h1 q">¿Cómo quieres que te llame?</h1>'+
  '<div class="sec"><label class="lbl" for="in-nombre">Tu nombre o un apodo</label><input id="in-nombre" class="input big" type="text" maxlength="20" autocomplete="nickname" placeholder="Tu nombre o apodo" value="'+e(U.t.nombre||'')+'" data-in="t.nombre"></div>'+
  '<div class="box pad">'+M('Así te llamo cuando te escriba. Lo puedes cambiar cuando quieras.')+'</div><div class="fill"></div>'+testSig(); };
V.edad = function(){ var n=parseInt(U.t.edad,10);
  return testTop()+'<h1 class="h1 q">¿Cuántos años tienes?</h1><p class="p2">Con 16 o 17 años algunas cosas cambian para cuidarte mejor.</p>'+
  '<div class="sec"><label class="lbl" for="in-edad">Tu edad</label><div class="row"><input id="in-edad" class="input big" style="width:140px;text-align:center" type="text" inputmode="numeric" maxlength="2" placeholder="18" value="'+e(U.t.edad||'')+'" data-in="t.edad"><span class="num" style="font-size:30px">AÑOS</span></div></div>'+
  '<p class="nota" id="edad-aviso" style="color:var(--text)"'+(!isNaN(n) && n<16 ? '' : ' hidden')+'>Con menos de 16 años todavía no puedes usar la app. Cuando los cumplas, aquí te espero.</p>'+
  cuerpoCampos(U.t.peso, U.t.altura, 't')+
  '<div class="fill"></div>'+testSig(); };
/* Peso y altura: opcionales y con el valor exacto */
function numCuerpo(v){ var x=parseFloat(String(v==null?'':v).replace(',','.')); return isNaN(x)?null:x; }
function cuerpoMal(peso, altura){ var pk=numCuerpo(peso), al=numCuerpo(altura);
  if(String(peso||'').trim() && (pk==null || pk<30 || pk>250)) return 'Revisa el peso: en kilos, por ejemplo 72,5.';
  if(String(altura||'').trim() && (al==null || al<120 || al>230)) return 'Revisa la altura: en centímetros, por ejemplo 178.';
  return ''; }
function cuerpoCampos(peso, altura, pre){ return '<div class="sec"><span class="lbl">Peso y altura · opcional</span><div class="grid2">'+
  '<label class="cuerpo"><span class="row" style="gap:6px"><input id="in-'+pre+'peso" class="input" type="text" inputmode="decimal" maxlength="5" placeholder="Peso" value="'+e(peso==null?'':String(peso).replace('.',','))+'" data-in="'+pre+'.peso"><span class="num">KG</span></span></label>'+
  '<label class="cuerpo"><span class="row" style="gap:6px"><input id="in-'+pre+'altura" class="input" type="text" inputmode="numeric" maxlength="3" placeholder="Altura" value="'+e(altura==null?'':altura)+'" data-in="'+pre+'.altura"><span class="num">CM</span></span></label></div>'+
  '<span style="font-size:13px;color:var(--text2)">Para calcular calorías y kilómetros de verdad. Si no quieres, déjalo en blanco: lo puedes poner luego en Ajustes.</span></div>'; }
V.mejorar = function(){ var h='', a=U.t.areas||[];
  ORDEN_AREAS.forEach(function(k){ var on=a.indexOf(k)!==-1; h+=opt('<span class="ar"><span>'+AREAS[k].n+'</span>'+(on?ic('check',16,3):'')+'</span><span class="t">'+AREAS[k].t+'</span>', on,'t:area',k,'mid'); });
  return testTop()+'<h1 class="h1 q">¿Qué quieres mejorar primero?</h1><p class="p2">Elige hasta tres. Empezar con poco es lo que hace que dure; luego puedes añadir más.</p><div class="grid2">'+h+'</div>'+
  (a.length>=3?'<div class="box pad rev">'+M('Tres a la vez son muchas para empezar. Con dos y una tercera más adelante suele ir mejor. Tú decides.')+'</div>':'')+testSig(); };
['deporte','movil','sueno','comida','pasos','nivel','objetivo','donde','tiempo','abandono','motiva','celebra'].forEach(function(k){ V[k]=function(){ return preg(k); }; });
V.dejar = function(){ var h='', t=U.t.dejar||{}, menor=parseInt(U.t.edad,10)<18, eligio=U.t.areas.indexOf('dejar')!==-1;
  Object.keys(DEJAR).forEach(function(k){ h+=opt(DEJAR[k][0], t.que===k,'t:dejar',k,'c'); });
  if(!eligio) h+=opt('Nada, de momento', t.que==='nada','t:dejar','nada','c');
  return testTop()+'<h1 class="h1 q">¿Hay algo que quieras dejar o reducir?</h1><p class="p2">Aquí no hay juicio. '+(eligio?'Cada día, sí o no, y llevas la cuenta del dinero que te ahorras.':'Si eliges algo, lo añado a lo que sigues.')+'</p><div class="grid2">'+h+'</div>'+
  (t.que && t.que!=='nada' ? '<div class="sec"><label class="lbl" for="in-euros">¿Cuánto te gastas a la semana? (opcional)</label><div class="row"><input id="in-euros" class="input" type="text" inputmode="decimal" placeholder="Por ejemplo, 20" value="'+e(t.euros||'')+'" data-in="t.euros" style="flex:1"><span class="num" style="font-size:28px">€</span></div></div>'+
    (menor ? '<p class="nota">Con 16 o 17 años, esto es siempre para dejarlo o reducirlo. Si te cuesta mucho, habla con tu médico.</p>' : '<p class="nota">Si hay dependencia (por ejemplo, del alcohol), habla antes con tu médico: dejarlo de golpe puede ser peligroso.</p>') : '')+
  '<div class="fill"></div>'+testSig(); };
V.diasGym = function(){ var h='', d=U.t.diasGym||[];
  DIAS.forEach(function(x,i){ var on=d.indexOf(i)!==-1; h+=opt('<span class="num" style="font-size:22px">'+DIAS_C[i]+'</span>', on,'t:dia',String(i),'c'); });
  var n=d.length, txt = n===0 ? 'Toca los días que vas a entrenar. Solo esos cuentan; los demás son descanso y no son fallo.' : (n<=2 ? n+' días. Para empezar, perfecto.' : (n<=4 ? n+' días. Buena base; que sean días que puedas de verdad.' : n+' días. Exigente: si una semana no llegas, bajamos sin drama.'));
  return testTop()+'<h1 class="h1 q">¿Qué días vas a entrenar?</h1><p class="p2">Gym, fútbol, correr, pádel… Lo que vayas a hacer de verdad, no lo que te gustaría.</p><div class="grid7" style="gap:6px">'+h+'</div><div class="box pad">'+M(txt)+'</div><div class="fill"></div>'+testSig(); };
var ANIMO = [['bien','Bien','Me alegro. Pues a aprovecharlo.'],['normal','Normal, con altibajos','Lo normal. Cada noche te pregunto cómo estás y con el tiempo vemos qué te sienta mejor.'],['bajo','Más bien bajo','Gracias por contármelo. Voy a ir con calma, y si un día cuesta, tienes el modo día difícil a mano.'],['muybajo','Muy bajo','Gracias por contármelo, de verdad. Voy a ir con calma contigo. Si lo estás pasando mal, hablar con alguien ayuda, y la línea 024 está para eso.']];
V.animo = function(){ var h='', f=''; ANIMO.forEach(function(a){ var on=U.t.animo===a[0]; if(on) f=a[2]; h+=opt('<span class="dot" aria-hidden="true"></span><span>'+a[1]+'</span>', on,'t:animo',a[0],'calm'); });
  return testTop()+'<h1 class="h1 q">¿Cómo ha estado tu ánimo las últimas dos semanas?</h1><p class="p2">No es un test médico. Sirve para que Míster sepa cómo hablarte.</p><div class="col" style="gap:8px">'+h+'</div>'+(f?'<div class="box pad">'+M(f)+'</div>':'')+
  (U.t.animo==='muybajo'?'<div class="box pad col" style="gap:4px"><span class="lbl">Línea 024</span><span style="font-size:15px;font-weight:700">Llama al 024. Es gratuita y atiende a cualquier hora.</span></div>':'')+'<div class="fill"></div>'+testSig(); };
var CHUNGO = [['paseo10','Paseo de 10 minutos'],['paseo20','Paseo de 20 minutos'],['paseo30','Paseo de 30 minutos'],['estirar','Estirar 10 minutos'],['casa','Una serie corta en casa'],['ducha','Ducha y a dormir pronto'],['propio','Escribir el mío']];
function chungoOpciones(sel, txt, a, pre){ var h=''; CHUNGO.forEach(function(c){ h+=opt('<span class="dot" aria-hidden="true"></span><span>'+c[1]+'</span>', sel===c[0], a, c[0], 'calm'); });
  return '<div class="col" style="gap:8px">'+h+'</div>'+(sel==='propio'?'<div class="sec"><label class="lbl" for="in-chungo">Tu mínimo</label><input id="in-chungo" class="input" type="text" maxlength="40" placeholder="Por ejemplo, 15 minutos de bici" value="'+e(txt||'')+'" data-in="'+pre+'.chungoTxt"></div>':''); }
V.chungo = function(){ return testTop()+'<h1 class="h1 q" style="font-size:40px">Un día chungo, ¿qué mínimo te vale?</h1><p class="p2">Los días malos, tu 1% pasa a ser solo esto. Lo justo para no soltarlo del todo.</p>'+chungoOpciones(U.t.chungo, U.t.chungoTxt, 't:chungo', 't')+'<div class="fill"></div>'+testSig(); };
V.retoTest = function(){ var t=U.t, p=perfilDeTest(t), pt=retosParaTi(p, 3), h='', todos='';
  pt.forEach(function(i){ var R=RETOS[i]; h+=opt('<span class="col" style="gap:3px;text-align:left"><span class="lbl" style="color:inherit;opacity:.75">'+R.tema+'</span><strong style="font-size:16px">'+R.n+'</strong><span style="font-size:13px;opacity:.8">'+R.total+' días · te valen '+R.vale+'</span></span>', t.reto===String(i), 't:reto', String(i), 'calm'); });
  if(U.tRetosTodos) RETOS.forEach(function(R,i){ if(pt.indexOf(i)!==-1 || R.k==='otra') return; todos+='<button type="button" class="chip'+(t.reto===String(i)?' on':'')+'" aria-pressed="'+(t.reto===String(i))+'" data-a="t:reto" data-v="'+i+'">'+R.n+'</button>'; });
  return testTop()+'<h1 class="h1 q">¿Empiezas con un reto?</h1><p class="p2">Opcional. Cortos, con principio y fin, y con margen: un mal día no lo rompe.</p>'+
  (h?'<span class="lbl">Para ti</span><div class="col" style="gap:8px">'+h+'</div>':'')+
  (U.tRetosTodos?'<span class="lbl">Todos</span><div class="chips">'+todos+'</div>':'<button type="button" class="link" style="align-self:flex-start" data-a="tRetosTodos">Ver todos los retos</button>')+
  opt('<span class="dot" aria-hidden="true"></span><span>Ahora no</span>', t.reto==='no', 't:reto', 'no', 'calm')+
  (t.reto && t.reto!=='no' && RETOS[+t.reto] && RETOS[+t.reto].dejar ? '<p class="nota">Al empezar te pregunto un par de cosas para tus cifras.</p>' : '')+
  '<div class="fill"></div>'+testSig(); };
var TONOS = [['suave','SUAVE','','«Hoy no ha salido. ¿Lo dejamos para mañana?»'],['directo','DIRECTO','',"«Al final no lo hiciste. ¿Mañana a la misma hora?»"],['exigente','EXIGENTE','','«Quedamos en hacerlo y no lo hiciste. Mañana, sin excusas.»'],['auto','QUE CAMBIE SEGÚN ESTÉ','','Exigente en tus días buenos y suave en los malos.']];
var TONO_N = {suave:'Suave',directo:'Directo',exigente:'Exigente',auto:'Según cómo esté'};
function tonoOpciones(sel, a){ var h=''; TONOS.forEach(function(t){ h+=opt('<span class="row sb"><span class="q">'+t[1]+'</span><span class="lbl" style="color:inherit">'+(sel===t[0]&&a==='t:tono'&&U.t._tonoSug?'PARA TI':'')+'</span></span><span class="ej">'+t[3]+'</span>', sel===t[0],a,t[0]); }); return h; }
V.tono = function(){ return testTop()+'<h1 class="h1 q" style="font-size:38px">¿Cómo quieres que te hable Míster?</h1><p class="p2">Ejemplo: quedaste en hacer algo y al final no lo hiciste.</p><div class="col" style="gap:8px">'+tonoOpciones(U.t.tono,'t:tono')+'</div><p class="nota">En un día malo, Míster siempre baja a suave.</p><div class="fill"></div>'+testSig(); };
var COLORES = [['amarillo','Amarillo','#FFD60A'],['azul','Azul','#2563EB'],['verde','Verde','#22C55E'],['naranja','Naranja','#FF6B1A'],['morado','Morado','#6D4AFF'],['byn','Blanco y negro','linear-gradient(90deg,#F2F2EE 50%,#101113 50%)']];
function aspectoOpciones(tema,color,aT,aC){ var t='', k='';
  [['auto','Automático'],['oscuro','Oscuro'],['claro','Claro']].forEach(function(x){ t+=opt(x[1], tema===x[0],aT,x[0],'c'); });
  COLORES.forEach(function(x){ var on=color===x[0]; k+='<button type="button" class="opt c col-op'+(on?' on2':'')+'" style="height:76px" aria-pressed="'+on+'" data-a="'+aC+'" data-v="'+x[0]+'"><span aria-hidden="true" style="width:30px;height:30px;box-sizing:border-box;border-radius:15px;border:1px solid var(--text3);background:'+x[2]+'"></span><span style="font-size:13px">'+x[1]+'</span></button>'; });
  return '<div class="sec"><span class="lbl">Tema</span><div class="grid3">'+t+'</div>'+(tema==='auto'?'<span style="font-size:13px;color:var(--text2)">Sigue a tu iPhone: claro u oscuro según lo tengas.</span>':'')+'</div><div class="sec"><span class="lbl">Color</span><div class="grid3">'+k+'</div></div>'; }
function muestraAspecto(){ return '<div class="sec"><span class="lbl">Así se ve</span><div class="box col" style="padding:14px;gap:10px;background:var(--bg)"><span class="h1" style="font-size:40px">Todo <span class="hl">hecho.</span></span><div class="grid2"><div class="tile on" style="height:76px"><span class="tt">TU 1%</span><span class="num" style="position:relative;font-size:26px">3 DE 3</span></div><div class="tile" style="height:76px"><span class="tt" style="color:var(--text3)">CURVA</span><span class="num acc" style="font-size:26px">+12 %</span></div></div></div></div>'; }
V.aspecto = function(){ if(!U.t.tema) U.t.tema='auto'; if(!U.t.color) U.t.color='amarillo';
  return testTop()+'<h1 class="h1 q">¿Cómo quieres ver la app?</h1><p class="p2">Pruébalo: la app cambia mientras eliges.</p>'+aspectoOpciones(U.t.tema,U.t.color,'t:tema','t:color')+muestraAspecto()+'<div class="fill"></div>'+testSig(); };

/* ---------- lo que sale del test ---------- */
var MOVIL_META = {'1.5':1,'2.5':2,'3.5':3,'5':4,'7':6};
function perfilDeTest(t){ var eu=parseFloat(String((t.dejar&&t.dejar.euros)||'').replace(',','.')), dif=t.abandono==='dificil';
  var areas=t.areas.slice(); var dj = t.dejar && t.dejar.que && t.dejar.que!=='nada' ? {que:t.dejar.que, euros:isNaN(eu)?0:eu} : null;
  if(dj && areas.indexOf('dejar')===-1 && areas.length<3) areas.push('dejar');
  areas.sort(function(a,b){ return ORDEN_AREAS.indexOf(a)-ORDEN_AREAS.indexOf(b); });
  var pasosB=+t.pasos||0, metaPasos = pasosB===3000?5000:(pasosB===6000?7500:(pasosB===9000?10000:6000)); if(dif) metaPasos=Math.max(4000,metaPasos-1000);
  var metaMovil = MOVIL_META[t.movil]||3; if(dif) metaMovil=Math.min(6,metaMovil+1);
  var metaSueno = {'5':6,'6':7,'7':7,'8':8}[t.sueno]||7;
  var obj=t.objetivo||'salud';
  return {nombre:t.nombre.trim(), edad:parseInt(t.edad,10), areas:areas, diasGym:(t.diasGym||[]).slice().sort(), metaPasos:metaPasos, metaMovil:metaMovil, metaSueno:metaSueno, dejar:dj,
    base:{deporte:t.deporte, movil:t.movil, sueno:t.sueno, comida:t.comida, pasos:t.pasos},
    nivel:t.nivel||null, objetivo:t.objetivo||null, donde:t.donde||null, tiempo:t.tiempo?+t.tiempo:null, abandono:t.abandono, motiva:t.motiva,
    animo:t.animo, tono:t.tono||'directo', celebra:t.celebra||'normal', tema:t.tema||'auto', color:t.color||'amarillo', partido:true, pitido:true, sonido:t.celebra!=='tranqui',
    descanso:{fuerza:150,musculo:90,grasa:60,salud:75}[obj], reps:{fuerza:6,musculo:10,grasa:12,salud:10}[obj], creado:hoy(),
    peso:numCuerpo(t.peso), altura:numCuerpo(t.altura)!=null?Math.round(numCuerpo(t.altura)):null, chungo:t.chungo||'paseo20', chungoTxt:t.chungo==='propio'?String(t.chungoTxt||'').trim():''}; }
function adaptaciones(p){ var r=[];
  if(p.areas.indexOf('entreno')!==-1){ r.push('Gym: '+plural(p.diasGym.length,'día','días')+' ('+p.diasGym.map(function(i){ return DIAS[i]; }).join(', ')+'). Los demás, descanso sin culpa.');
    if(p.objetivo) r.push('Para '+{musculo:'ganar músculo',fuerza:'ganar fuerza',grasa:'perder grasa',salud:'estar en forma'}[p.objetivo]+': series de '+p.reps+' repeticiones y descansos de '+mmss(p.descanso)+'.');
    if(p.nivel==='nuevo') r.push('Como empiezas, cada ejercicio tiene su animación y empezamos con pesos cómodos.');
    if(p.donde && p.donde!=='gym') r.push('Te enseño primero los ejercicios que puedes hacer '+(p.donde==='casa'?'en casa':'sin material')+'.'); }
  if(p.areas.indexOf('movil')!==-1) r.push('Móvil: menos de '+p.metaMovil+' h al día, un poco menos de lo que haces ahora.');
  if(p.areas.indexOf('moverme')!==-1) r.push('Pasos: '+num(p.metaPasos)+' al día, o 30 minutos andando.');
  if(p.areas.indexOf('sueno')!==-1) r.push('Sueño: '+p.metaSueno+' horas o más.');
  if(p.dejar) r.push('Dejar: cada día '+DEJAR[p.dejar.que][1]+(p.dejar.euros?', y la cuenta de lo que te ahorras (unos '+num(p.dejar.euros/7,1)+' € al día)':'')+'.');
  if(p.abandono==='dificil') r.push('Empezamos más fácil de lo que crees. Cuando lo bordes, subimos.');
  if(p.abandono==='tiempo') r.push('Los días justos, con lo mínimo vale.');
  if(p.abandono==='aburro') r.push('Te propongo retos cortos para cambiar de aire.');
  r.push('Un día chungo, tu 1% es solo esto: '+chungoTxt(p).toLowerCase()+'.');
  if(U.t && U.t.reto && U.t.reto!=='no' && RETOS[+U.t.reto]){ var Rt=RETOS[+U.t.reto]; r.push('Reto desde hoy: '+Rt.n.toLowerCase()+'. '+Rt.total+' días; te valen '+Rt.vale+'.'); }
  r.push('Tu primer partido es contra tu yo de antes: lo que me has contado hoy.');
  r.push('Míster te habla en tono '+TONO_N[p.tono].toLowerCase()+' y celebra '+{tope:'a tope',normal:'lo importante',tranqui:'sin ruido'}[p.celebra]+'.');
  return r; }
V.plan = function(){ var t=U.t, p=perfilDeTest(t), filas='', ad='';
  p.areas.forEach(function(k,i){ var x=planTxt(k,p); filas+='<div class="fila rev" style="animation-delay:'+(0.15+i*0.1)+'s;border-top:'+(i?'var(--fina)':'none')+'"><span class="bx" aria-hidden="true"></span><span class="col" style="gap:2px;flex:1"><span class="lbl">'+AREAS[k].n+'</span><strong style="font-size:15px">'+x[0]+'</strong><span style="font-size:13px;color:var(--text2)">'+x[1]+'</span></span></div>'; });
  adaptaciones(p).forEach(function(x,i){ ad+='<div class="row rev" style="align-items:flex-start;gap:10px;animation-delay:'+(0.5+i*0.08)+'s"><span class="acc" style="flex-shrink:0;margin-top:1px">'+ic('check',18,3)+'</span><span style="font-size:14px;line-height:1.45">'+x+'</span></div>'; });
  return '<h1 class="h1" style="margin-top:12px">Listo, <span class="hl">'+e(p.nombre)+'</span>.</h1><p class="p2">Este es tu plan. Todo sale de lo que me has contado.</p>'+
  '<section class="box col rev" style="padding:12px 14px 4px;gap:4px;animation-delay:.05s" aria-label="Tu plan"><span class="lbl" style="color:var(--text)">Cada día · tu 1%</span>'+filas+'</section>'+
  '<section class="box col" style="padding:14px;gap:10px" aria-label="Así me adapto a ti"><span class="lbl acc">Así me adapto a ti</span>'+ad+'</section>'+
  '<div class="box col" style="padding:12px 14px;gap:4px"><span class="lbl">Cómo funciona</span><span style="font-size:14px;line-height:1.45;color:var(--text2)">Cada día que cumples todo lo de hoy, tu curva sube un 1%. Si un día no, se queda igual: nunca baja.</span></div>'+
  M('Empezamos por '+p.areas.map(function(k){return AREAS[k].c;}).join(' y ')+'. Esta noche cierras el día y me cuentas.')+
  cta('EMPEZAR MI DÍA 1','empezar'); };
function planTxt(k,p){ switch(k){
  case 'entreno': return ['Entrenar '+plural(p.diasGym.length,'día','días')+' a la semana', p.diasGym.map(function(i){ return DIAS[i]; }).join(', ')];
  case 'moverme': return [num(p.metaPasos)+' pasos al día','O 30 minutos andando'];
  case 'dejar': return ['Cada día, '+DEJAR[p.dejar.que][1], p.dejar.euros ? 'Te ahorras unos '+num(p.dejar.euros/7,1)+' € al día' : 'Llevas la cuenta de los días'];
  case 'movil': return ['Menos de '+p.metaMovil+' h de pantalla al día','Lo cambias en Ajustes'];
  case 'comida': return ['Comer bien cada día', unoComida(p)];
  case 'sueno': return ['Dormir '+p.metaSueno+' horas o más','Cada mañana cuentas la noche'];
  case 'animo': return ['Un rato para ti cada día','10 minutos al aire libre o con alguien'];
  case 'orden': return ['Tu tarea del día','La que más pereza te da, antes de las 20:00'];
  case 'estudio': return ['Estudiar sin móvil','45 minutos seguidos, con el móvil en otra habitación'];
  case 'leer': return ['Leer un rato','10 páginas al día'];
} return ['',''] }
function unoComida(p){ var b=p.base&&p.base.comida; return b==='bien' ? 'Sin picar entre horas' : (b==='mal'||b==='regular' ? 'Una comida hecha en casa' : 'Una comida hecha en casa, sin bollería ni fritos'); }

/* ====================== HOY ====================== */
function filaTarea(k,f){ /* móvil, sueño y pasos abren su número */ var x=tarea(k,f), on=hechoT(k,f), nm = k==='minimo' ? 'LO MÍNIMO' : AREAS[k].n;
  return '<button type="button" class="fila'+(on?' on':'')+(U.recien===k?' pop':'')+'" data-a="marcar" data-v="'+k+'" aria-pressed="'+on+'"><span class="bx" aria-hidden="true">'+(on?ic('check',20,3):'')+'</span><span class="col" style="gap:2px;min-width:0;flex:1"><span class="lbl">'+nm+'</span><strong style="font-size:15px">'+x.meta+'</strong><span class="uno"><span class="tg">TU 1%</span><span>'+x.uno+'</span></span></span>'+((k==='moverme'||k==='entreno'||k==='movil'||k==='sueno')?'<span style="color:var(--text3);align-self:center">'+ic('chev',16)+'</span>':'')+'</button>'; }
function matchMini(){ var f=hoy(), m=marcador(jugadas(lunesDe(f),f)), pri=lunesDe(inicio())===lunesDe(f);
  var txt = pri ? (m[0]>0 ? 'Le vas ganando a tu yo de antes' : 'Tu primer partido: contra tu yo de antes') : (m[0]>m[1] ? 'Vas ganando a tu semana pasada' : (m[0]===m[1] ? 'Empatas con tu semana pasada' : 'Tu semana pasada va ganando'));
  return '<button type="button" class="match" data-a="go" data-v="partido" style="flex-direction:row;align-items:center;justify-content:space-between;gap:12px"><span class="col" style="gap:3px;min-width:0"><span class="lbl live" style="color:var(--text)">Tú contra ti</span><span style="font-size:14px;font-weight:700">'+txt+'</span></span><span class="sc nw" style="font-size:36px">'+m[0]+'–'+m[1]+'</span></button>'; }
function pitidoCard(){ var f=hoy(); if(!partidoOn() || D.perfil.pitido===false) return ''; var l=lunesDe(f), prev=sumar(l,-7);
  if(prev<lunesDe(inicio()) || D.vistos['pit-'+prev]) return '';
  var js=jugadas(prev, sumar(prev,6)), m=marcador(js); if(!js.some(function(j){ return j.r!=='nada'; })) return '';
  var r = m[0]>m[1]?'Ganaste':(m[0]<m[1]?'Perdiste':'Empataste');
  if(m[0]>m[1] && !D.vistos['pitcele-'+prev]){ D.vistos['pitcele-'+prev]=1; setTimeout(function(){ guardar(); sonar('pito'); celebrar({tipo:'semana', eyebrow:'Pitido final · semana pasada', titulo:'¡Partido ganado!', grande:m[0]+'–'+m[1], sub:'Le has ganado a tu yo de la semana anterior.', frase:frase2(m[1]===0&&m[0]>=3?'Pitido final: ganas de calle':'Pitido final: ganas',{marcador:m[0]+'–'+m[1]})||'Partido ganado. El lunes empieza otro.', toast:'Partido ganado '+m[0]+'–'+m[1]+'.'}); }, 500); }
  return '<div class="box col" style="padding:12px 14px;gap:8px;border:var(--lleno)"><div class="row sb"><span class="lbl acc">Pitido final · semana pasada</span><button type="button" class="link" style="min-height:32px;padding:0" data-a="cerrarPitido" data-v="'+prev+'">Cerrar</button></div><div class="row sb"><strong style="font-size:17px">'+r+' a tu yo de antes</strong><span class="sc nw" style="font-size:40px">'+m[0]+'–'+m[1]+'</span></div><button type="button" class="link" style="align-self:flex-start;min-height:32px;padding:0" data-a="verSemana" data-v="'+prev+'">Ver las jugadas</button></div>'; }
function anillo(n,t){ var R=26, C=2*Math.PI*R, de=U.anillo==null?0:U.anillo, a=t?n/t:0; U.anillo=a;
  return '<span class="anillo" aria-label="'+n+' de '+t+'"><svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="'+R+'" fill="none" stroke="var(--off)" stroke-width="7"/><circle class="arco" cx="32" cy="32" r="'+R+'" fill="none" stroke="var(--acc)" stroke-width="7" stroke-linecap="round" stroke-dasharray="'+C.toFixed(1)+'" style="--de:'+(C*(1-de)).toFixed(1)+';--a:'+(C*(1-a)).toFixed(1)+';stroke-dashoffset:'+(C*(1-a)).toFixed(1)+'" transform="rotate(-90 32 32)"/></svg><span class="anillo-n num">'+n+'<small>/'+t+'</small></span></span>'; }
V.hoy = function(){ var f=hoy(), p=D.perfil, d=D.dias[f]||{h:{}}, ts=tareas(f), n=nHechas(f), seg='', filas='';
  fijarAreasHoy();
  ts.forEach(function(k,i){ seg+='<span class="'+(i<n?'on':'')+'"></span>'; filas+=filaTarea(k,f); });
  var descansoGym = p.areas.indexOf('entreno')!==-1 && !planGym(f) && !d.dificil;
  if(descansoGym) filas+='<button type="button" class="fila" data-a="'+(D.actual?'go':'tab')+'" data-v="'+(D.actual?'entreno':'gym')+'" style="opacity:.85"><span class="bx" aria-hidden="true" style="border-style:dashed"></span><span class="col" style="gap:2px;flex:1"><span class="lbl">GYM</span><strong style="font-size:15px">'+(entrenoEl(f)?'Entreno extra hecho':(D.actual?'Entreno en curso':'Hoy no toca gym'))+'</strong><span style="font-size:13px;color:var(--text2)">'+(entrenoEl(f)?'Suma en tu semana de gym':(D.actual?'Al terminarlo, suma en tu semana de gym':'Descansar también es parte del plan. No cuenta como fallo.'))+'</span></span></button>';
  retosActivos().forEach(function(r){ filas+=filaReto(r,f); });
  var todo = ts.length>0 && n===ts.length, falta=ts.length-n, c=cumplidosHasta(f);
  var titular = d.dificil ? 'Hoy, lo <span class="hl nw">mínimo.</span>' : (d.cerrado ? 'Día <span class="hl nw">cerrado.</span>' : (todo ? 'Todo <span class="hl nw">hecho.</span>' : (ts.length===0 ? 'Hoy <span class="hl nw">descansas.</span>' : (diaN(f)===1 && n===0 ? 'Hoy <span class="hl nw">empiezas.</span>' : (falta===1 ? 'Te falta <span class="hl nw">una.</span>' : 'A por <span class="hl nw">hoy.</span>')))));
  var pie = ts.length===0 ? 'Hoy no tienes nada que cumplir. Tu curva se queda en +'+pct(c)+' %.' : (todo ? 'Tu 1% de hoy está hecho. Curva: +'+pct(c)+' %.' : 'Cumple todo y tu curva sube a +'+pct(c+1)+' %. Si no, se queda igual.');
  var ultimo = D.chat.length ? D.chat[D.chat.length-1].m : '';
  var ayer=sumar(f,-1), dAyer=D.dias[ayer], ayerSinCerrar = ayer>=inicio() && !(dAyer && dAyer.cerrado);
  var copiaVieja = diaN(f)>=7 && (!D.copia || ahora()-D.copia > 7*86400000) && !NUBE.ok && !D.vistos['copia-'+lunesDe(f)];
  var sinTest = !p.base ? '<button type="button" class="box col" style="padding:14px;gap:6px;border:var(--lleno);text-align:left;width:100%" data-a="retest"><span class="lbl acc">Nuevo · 3 minutos</span><strong style="font-size:16px">Haz el test completo</strong><span style="font-size:13px;color:var(--text2)">Para que la app se adapte a ti: metas, descansos, ejercicios y celebraciones. No pierdes nada de lo que llevas.</span></button>' : '';
  var nv=nivelDe(c);
  var instalar = (!esInstalada() && !D.vistos.instalar && diaN(f)>=1 && (APP_URL || !EN_CLAUDE)) ? '<div class="box col" style="padding:12px 14px;gap:8px"><div class="row sb"><strong style="font-size:15px">Tenla como una app</strong><button type="button" class="link" style="min-height:32px;padding:0" data-a="cerrarInstalar">Cerrar</button></div><span style="font-size:13px;color:var(--text2)">Con su icono, a pantalla completa y sin internet en el gym.</span><button type="button" class="chip" style="border:var(--lleno)" data-a="instalarSheet">Cómo instalarla</button></div>' : '';
  return sinTest+instalar+(sinGuardar?'<div class="box pad" style="border:2px solid #D93A40"><strong>Este navegador no deja guardar.</strong><p class="p2" style="font-size:14px">Puede que estés en una ventana privada. Ábrela en una normal o tus datos se perderán al cerrarla.</p></div>':'')+'<div class="row sb"><span class="lbl">'+fechaLarga(f)+' · día '+diaN(f)+'</span><span class="row" style="gap:8px"><button type="button" class="nivel-chip" data-a="go" data-v="medallas" aria-label="Nivel '+nv.i+': '+nv.n+'. Ver medallas">'+ic('retos',14,2.4)+'<span>'+nv.n+'</span></button><button type="button" class="ayuda" data-a="guia" aria-label="Cómo funciona">?</button><button type="button" class="avatar" data-a="go" data-v="ajustes" aria-label="Tu perfil y ajustes">'+avatarIn()+'</button></span></div>'+
  '<h1 class="h1" style="margin-top:-6px">'+titular+'</h1>'+
  wrapCard(f)+compromisoCard(f)+
  pitidoCard()+
  (partidoOn() ? matchMini() : '')+
  '<section class="box col hoy-box'+(todo?' todo':'')+'" style="padding:12px 14px 0;gap:8px" aria-label="Lo de hoy">'+
  '<div class="row" style="gap:14px">'+anillo(n,ts.length)+'<span class="col" style="gap:2px;flex:1;min-width:0"><span class="lbl" style="color:var(--text)">Lo de hoy · tu 1%</span><span style="font-size:13px;color:var(--text2)">'+(todo?'Hecho. Curva +'+pct(c)+' %':(ts.length?'Te '+(falta===1?'falta 1':'faltan '+falta)+' para subir al +'+pct(c+1)+' %':'Hoy, descanso'))+'</span></span><span class="col" style="align-items:flex-end;gap:0"><span class="num acc" style="font-size:26px">+'+pct(c)+'%</span><span class="lbl">Curva</span></span></div>'+
  filas+'<p style="margin:0;padding:10px 0 12px;border-top:var(--fina);font-size:13px;color:var(--text2)">'+pie+'</p></section>'+
  dejarCard()+
  (!retosActivos().length ? '<button type="button" class="box row sb" style="padding:12px 14px;text-align:left;width:100%" data-a="tab" data-v="retos"><span class="row" style="gap:12px"><span class="thumb" aria-hidden="true">'+ic('retos',24,2.2)+'</span><span class="col" style="gap:2px"><strong style="font-size:15px">Empieza un reto</strong><span style="font-size:13px;color:var(--text2)">Cortos, de 5 a 30 días, con margen</span></span></span><span style="color:var(--text3)">'+ic('chev',18)+'</span></button>' : '')+
  (ayerSinCerrar ? '<button type="button" class="box row sb" style="padding:12px 14px;text-align:left;width:100%" data-a="cerrarDia" data-v="'+ayer+'"><span class="col" style="gap:2px"><strong style="font-size:15px">Ayer se quedó sin cerrar</strong><span style="font-size:13px;color:var(--text2)">Ciérralo ahora: son 30 segundos.</span></span><span style="color:var(--text3)">'+ic('chev',18)+'</span></button>' : '')+
  (copiaVieja ? '<div class="box col" style="padding:12px 14px;gap:8px"><strong style="font-size:15px">Haz una copia de tus datos</strong><span style="font-size:13px;color:var(--text2)">Se guardan en este móvil. Si borras los datos de Safari, se pierden. Una copia a la semana y listo.</span><div class="grid2"><button type="button" class="chip" style="border:var(--lleno)" data-a="copia">Descargar copia</button><button type="button" class="chip" data-a="copiaLuego" data-v="'+lunesDe(f)+'">Luego</button></div></div>' : '')+
  '<button type="button" class="box pad" style="text-align:left;width:100%" data-a="tab" data-v="mister" aria-label="Míster: '+e(misterHoy(f))+'. Abrir el chat">'+M(e(misterHoy(f)))+'</button>'+
  (d.cerrado ? '' : (d.dificil ? '<button type="button" class="link" data-a="dificil" data-v="0">Quitar el modo día difícil</button>' : '<button type="button" class="link" data-a="dificil" data-v="1">¿Hoy te cuesta? Pon el modo día difícil</button>'))+
  (d.cerrado ? cta('DÍA CERRADO · EDITAR','cerrarDia',f,ic('check'),'done') : '');
};
/* Lo que dice Míster en Hoy: algo útil ahora (lo que falta, un dato tuyo, el siguiente paso) */
function datoReal(f){ var p=D.perfil, ops=[], l=lunesDe(f), c=cumplidosHasta(f);
  if(p.areas.indexOf('entreno')!==-1 && (p.diasGym||[]).length){ var g=entrenosSemana(l), m=p.diasGym.length; ops.push(g>=m?'Gym de la semana, completo: '+g+' de '+m+'.':'Gym esta semana: '+g+' de '+m+'.'); }
  if(partidoOn() && dsem(f)>0){ var mm=marcador(jugadas(l,f)); if(mm[0]||mm[1]) ops.push((mm[0]>mm[1]?'Vas ganando ':(mm[0]<mm[1]?'Vas perdiendo ':'Vas empatando '))+mm[0]+'–'+mm[1]+' a tu semana pasada.'); }
  var nv=nivelDe(c); if(nv.sig) ops.push('Te '+(nv.sig[0]-c===1?'falta 1 día cumplido':'faltan '+(nv.sig[0]-c)+' días cumplidos')+' para ser '+nv.sig[1]+'.');
  if(p.dejar && p.dejar.desde && p.areas.indexOf('dejar')!==-1){ var dd=Math.floor((ahora()-p.dejar.desde)/86400000); if(dd>=1) ops.push('Llevas '+plural(dd,'día','días')+' '+DEJAR[p.dejar.que||'otra'][1]+(eurosDia()?': '+num(dd*eurosDia())+' € que no has gastado.':'.')); }
  retosActivos(f).forEach(function(r){ if(r.ini<=f){ var fl=r.vale-hechosReto(r); if(fl>0) ops.push('Reto «'+nombreReto(r).toLowerCase()+'»: te '+(fl===1?'falta 1 día':'faltan '+fl+' días')+'.'); } });
  if(!ops.length) return ''; return ops[diaN(f)%ops.length]; }
function misterHoy(f){ var p=D.perfil, d=D.dias[f]||{h:{}}, ts=tareas(f), pend=ts.filter(function(k){ return !hechoT(k,f); }), c=cumplidosHasta(f), t;
  if(d.cerrado){ var m=sumar(f,1), tm=p.areas.filter(function(k){ return k!=='entreno' || planGym(m); }), u=ultimaSesion();
    if(tm.indexOf('entreno')!==-1) return 'Día cerrado. Mañana toca gym'+(u?': la última vez, '+u.n.toLowerCase()+' '+(u.kg?kg(u.kg)+' × '+u.reps:u.reps+' repeticiones')+'. Mañana, una más.':'.');
    return 'Día cerrado. Mañana, '+(tm.length?tarea(tm[0],m).meta.toLowerCase().replace(/ hoy\b/,''):'descanso')+'. Ahora, a descansar.'; }
  if(d.dificil) return hechoT('minimo',f) ? 'Lo mínimo, hecho. Hoy ya vale: tu curva no baja.' : 'Hoy solo cuenta esto: '+minimoTarea(p).meta.toLowerCase()+'. Con eso, vale.';
  if(!ts.length) t='Hoy no tienes nada que cumplir. Descansar también es parte del plan.';
  else if(!pend.length) t='Todo hecho. Te queda cerrar el día: 30 segundos.';
  else { var k=pend[0], x=tarea(k,f); t=(pend.length===1?'Solo te falta una: ':'Lo siguiente: ')+x.meta.charAt(0).toLowerCase()+x.meta.slice(1)+'.'; if(x.uno && !/^Toca /.test(x.uno)) t+=' '+x.uno.replace(/\.?$/,'.'); }
  var dr=datoReal(f); return dr ? t+' '+dr : t; }
function barraCierre(){ var d=D.dias[hoy()]; return U.pantalla==='hoy' && D.perfil && !(d&&d.cerrado) && !U.sheet; }

/* ---------- Cerrar el día ---------- */
var EMOS = ['Calma','Energía','Alegría','Orgullo','Cansancio','Estrés','Tristeza','Enfado'];
function empezarCierre(f){ var d=D.dias[f]||{h:{}}; U.cierreDe=f;
  U.ck={movilMin:d.movilMin==null?null:d.movilMin, suenoMin:d.suenoMin==null?null:d.suenoMin, feliz:d.feliz==null?null:d.feliz, emo:d.emo||null, nota:d.nota||'', pasos:d.pasos==null?'':d.pasos, h:JSON.parse(JSON.stringify(d.h||{})), retos:JSON.parse(JSON.stringify(d.retos||{})), t0:ahora()}; }
V.cierre = function(){ var f=U.cierreDe, c=U.ck, p=D.perfil, esHoy=f===hoy(), fz='', em='', extra='';
  for(var i=1;i<=10;i++){ fz+=opt('<span class="num" style="font-size:24px">'+i+'</span>', c.feliz===i,'ck:feliz',String(i),'c'); }
  EMOS.forEach(function(x){ em+=opt(x, c.emo===x,'ck:emo',x,'c tiny'); });
  function sino(clave,l,q,val){ var r=''; [['si','Sí'],['no','No']].forEach(function(x){ r+=opt(x[1], val===x[0],'ck:'+clave,x[0],'c'); }); return '<div class="sec"><span class="lbl">'+l+'</span><span style="font-weight:700">'+q+'</span><div class="grid2">'+r+'</div></div>'; }
  var d=D.dias[f]||{}, lista = d.dificil ? ['minimo'] : areasDe(f);
  lista.forEach(function(k){
    if(k==='entreno' && entrenoEl(f)){ extra+='<div class="box row sb" style="padding:12px 14px"><span class="col" style="gap:2px"><span class="lbl">Gym</span><strong>Entreno apuntado</strong></span><span class="lbl acc">Hecho</span></div>'; return; }
    if(k==='movil' || k==='sueno'){ var cv=k==='movil'?c.movilMin:c.suenoMin, mt=metaDe(k,f), okv = cv!=null && (k==='movil'?cv<=mt:cv>=mt);
      extra+='<div class="sec"><span class="lbl">'+(k==='movil'?'Móvil '+(esHoy?'hoy':'ese día')+' · meta, menos de '+hm(mt):'Sueño · anoche · meta, '+hm(mt))+'</span><div class="box row sb" style="padding:6px"><button type="button" class="paso" data-a="ck:num" data-v="'+k+'.-15" aria-label="15 minutos menos">−</button><span class="col" style="align-items:center;gap:0"><span class="num'+(okv?' acc':'')+'" style="font-size:32px">'+(cv==null?'—':hm(cv))+'</span><span style="font-size:12px;color:var(--text3)">'+(cv==null?'Toca + o − para apuntarlo':(okv?'Dentro de tu meta':(k==='movil'?'Por encima de tu meta':'Por debajo de tu meta')))+'</span></span><button type="button" class="paso" data-a="ck:num" data-v="'+k+'.15" aria-label="15 minutos más">+</button></div></div>'; return; }
    if(k==='moverme'){ extra+='<div class="sec"><label class="lbl" for="in-ckpasos">Pasos '+(esHoy?'de hoy':'de ese día')+' · meta '+num(p.metaPasos)+'</label><div class="row" style="gap:8px"><input id="in-ckpasos" class="input" type="text" inputmode="numeric" placeholder="Por ejemplo, 8200" value="'+e(c.pasos)+'" data-in="ck.pasos" style="flex:1"><button type="button" class="chip'+(c.h.moverme?' on':'')+'" style="min-height:56px" aria-pressed="'+(!!c.h.moverme)+'" data-a="ck:h" data-v="moverme">30 min andando</button></div></div>'; return; }
    var x=tarea(k,f), meta = esHoy ? x.meta : x.meta.replace(/ hoy\b/,''), q = k==='minimo' ? meta+'. ¿Hecho?' : (k==='dejar' ? (esHoy?'¿Hoy, ':'¿Ese día, ')+DEJAR[(p.dejar&&p.dejar.que)||'otra'][1]+'?' : meta+'. ¿Hecho?');
    extra+=sino('h.'+k, (k==='minimo'?'LO MÍNIMO':AREAS[k].n), q, c.h[k]===true?'si':(c.h[k]===false?'no':null)); });
  retosActivos(f).forEach(function(r){ var R=retoDef(r.n); if(!R || R.auto || r.ini>f || retoLibre(r,f)) return; extra+=sino('r.'+r.id,'Reto · '+e(nombreReto(r).toLowerCase()), qReto(r,R), c.retos[r.id]||null)+retoCierreExtra(r,f,c); });
  return headLbl(esHoy?'Cerrar el día':'Cerrar '+(f===sumar(hoy(),-1)?'ayer':fechaLarga(f)).toLowerCase())+
  '<h1 class="h1 q" style="margin-top:-4px">'+(esHoy?'¿Qué tal hoy, ':'¿Qué tal fue, ')+e(p.nombre)+'?</h1>'+
  '<div class="sec"><span class="lbl">¿Cómo de feliz '+(esHoy?'has estado hoy':'estuviste')+'? Del 1 al 10</span><div class="grid5">'+fz+'</div></div>'+
  '<div class="sec"><span class="lbl">Lo que más has sentido (opcional)</span><div class="grid4">'+em+'</div></div>'+
  extra+
  '<div class="sec"><label class="lbl" for="in-nota">Una nota, si quieres</label><textarea id="in-nota" class="input" placeholder="Lo que quieras recordar" data-in="ck.nota">'+e(c.nota)+'</textarea></div>'+
  cta('GUARDAR','guardarCierre','',ic('check'),c.feliz?'':'off'); };
function guardarCierre(){ var c=U.ck, f=U.cierreDe; if(!c.feliz){ toast('Toca cómo de feliz has estado. Con eso ya vale.'); return; }
  var d=dia(f,true), antesCumplido=cumplido(f), antes=cumplidosHasta(hoy());
  if(f===hoy()) fijarAreasHoy(); else if(!d.areas) d.areas=areasDe(f);
  d.feliz=c.feliz; d.emo=c.emo; d.nota=(c.nota||'').trim();
  var ps=parseInt(String(c.pasos).replace(/\D/g,''),10); d.pasos = isNaN(ps)?null:ps;
  if(c.movilMin!=null) d.movilMin=c.movilMin; if(c.suenoMin!=null) d.suenoMin=c.suenoMin;
  for(var k in c.h){ if(c.h[k]===true) d.h[k]=true; else if(c.h[k]===false) delete d.h[k]; }
  var retosAntes=d.retos||{}; d.retos=c.retos; d.cerrado=true; retoTrasDia(f, retosAntes, c);
  if(c.feliz<=3 && f===hoy() && !d.dificil && !cumplido(f)){ d.dificil=true; }
  var segs=Math.max(5,Math.round((ahora()-c.t0)/1000));
  var ok=cumplido(f), hechas=nHechas(f), tot=tareas(f).length, sit;
  if(c.feliz<=3) sit='Día difícil'; else if(ok && c.feliz>=6) sit='día bueno'; else if(hechas>0 || c.feliz>=4) sit=(hechas===0?'día malo':'día normal'); else sit='día malo';
  if(diaN(f)===1) sit = c.feliz<=3 ? 'Día difícil' : 'Cierra su primer día';
  var fr = frase(sit,{},c.feliz) || frase('día normal',{},c.feliz) || 'Día cerrado. Mañana, otro.';
  if(f!==hoy()) fr = frase('Rellena ayer',{},c.feliz) || fr;
  decir(fr, hoy());
  evaluarRetos();
  guardar();
  U.cierreRes={f:f, segs:segs, ok:ok, hechas:hechas, tot:tot, frase:fr, sube: ok && !antesCumplido, feliz:c.feliz};
  U.sheet={tipo:'cerrado', anim:true}; U.hist=[]; U.pantalla='hoy';
  sonar('hecho'); vibrar(ok?[30,50,30,50,80]:[20,30,20]); render(); if(U.cierreRes.sube) setTimeout(function(){ confeti(70); }, 300); }
function cerradoHTML(){ var r=U.cierreRes, f=r.f, l='', sem='', anim=U.sheet.anim; U.sheet.anim=false;
  var ks = tareas(f);
  ks.forEach(function(k,i){ var on=hechoT(k,f); l+='<div class="crow'+(anim?' anim':'')+'" style="animation-delay:'+(0.2+i*0.12).toFixed(2)+'s"><span class="bx'+(on?' on':'')+'" aria-hidden="true">'+(on?ic('check',16,3):'')+'</span><span>'+(k==='minimo'?'Lo mínimo':cap(AREAS[k].n.toLowerCase()))+'</span><span style="margin-left:auto;font-size:13px;font-weight:600;color:var(--text3)">'+(on?'Hecho':'Otro día')+'</span></div>'; });
  var lu=lunesDe(f); for(var i=0;i<7;i++){ var x=sumar(lu,i), cls = x<inicio() ? 'vac' : (x>hoy() ? 'fut' : (cumplido(x)?'si':'')); if(x===f && cumplido(x)) cls+=' nuevo'+(anim?' anim':''); sem+='<span class="cd '+cls+'"><span class="lbl" style="color:inherit">'+DIAS_C[i]+'</span></span>'; }
  var c=cumplidosHasta(hoy());
  return '<div class="overlay" role="dialog" aria-modal="true" aria-label="Día cerrado"><div class="cele'+(anim?' anim':'')+'">'+
  '<span class="lbl acc">'+(f===hoy()?'Día '+diaN(f):'Ayer')+' · '+r.segs+' segundos</span><span class="h1" style="font-size:48px;line-height:.95">Día <span class="nw">cerrado.</span></span>'+
  (ks.length?'<div class="col" style="gap:8px">'+l+'</div>':'')+
  '<div class="semana" aria-hidden="true">'+sem+'</div>'+
  M(e(r.frase))+
  (r.sube ? '<div class="row sb"><span class="lbl">Tu curva</span><span class="num acc gol" style="font-size:34px">+'+pct(c)+' %</span></div>' : '<p class="nota">Tu curva se queda en +'+pct(c)+' %. No baja.</p>')+
  (r.feliz<=3 ? '<div class="box col" style="padding:12px 14px;gap:6px"><strong style="font-size:15px">Mañana, con calma.</strong><span style="font-size:14px;color:var(--text2);line-height:1.4">Si lo estás pasando mal, hablar con alguien ayuda. La línea 024 es gratuita y atiende a cualquier hora. Si estás en peligro ahora mismo, llama al 112.</span></div>' : '')+
  cta('HASTA MAÑANA','cerrarSheet','',ic('check'),'sm')+'</div></div>'; }

/* ---------- Partido ---------- */
var RES = {tu:['GOL TUYO','tu'], su:['GOL SUYO','su'], eq:['EMPATE','eq'], nada:['—','eq']};
V.partido = function(){ var f=hoy(), l=U.semana||lunesDe(f), fin = l===lunesDe(f) ? f : sumar(l,6), js=jugadas(l,fin), m=marcador(js), pri=lunesDe(inicio())===l, li='';
  js.forEach(function(j){ var fm=function(v){ return j.f==='num'?num(v):(j.f==='hm'?(v?Math.floor(v/60)+'h'+pad(v%60):'—'):v); }; li+='<div class="jug"><span class="col" style="gap:1px;min-width:0"><strong>'+j.n+'</strong><span style="font-size:12px;color:var(--text3)">'+j.d+'</span></span><span class="v">'+fm(j.tu)+'</span><span class="v" style="color:var(--text2)">'+fm(j.su)+'</span><span class="chipres '+RES[j.r][1]+'">'+RES[j.r][0]+'</span></div>'; });
  var actual = l===lunesDe(f), titulo = actual ? (pri?'Tu primer partido':'Esta semana') : 'Semana del '+fechaCorta(l);
  var txt = pri ? 'La primera semana juegas contra tu yo de antes de empezar, que no tiene nada apuntado. Desde el lunes, contra tu semana pasada.' : 'Comparo esta semana con la pasada hasta el mismo día. Lo que haces mejor es gol tuyo; lo que hiciste mejor la semana pasada, gol suyo. Los días de descanso no cuentan.';
  return headLbl('Tú contra ti · '+titulo)+
  '<div class="match"><span class="row sb"><span class="lbl live" style="color:var(--text)">'+(actual?'En juego':'Final')+'</span><span class="lbl">'+(actual?cap(DIAS[dsem(f)]):'Domingo')+'</span></span>'+
  '<span class="mrow"><span class="who"><span class="lbl" style="color:var(--text)">Tú</span><span style="font-size:13px;color:var(--text2)">'+(actual?'Esta semana':'Esa semana')+'</span></span><span class="sc nw" style="font-size:60px">'+m[0]+' – '+m[1]+'</span><span class="who r"><span class="lbl" style="color:var(--text)">Tú</span><span style="font-size:13px;color:var(--text2)">'+(pri?'Antes de empezar':'Semana anterior')+'</span></span></span></div>'+
  '<p class="nota">'+txt+'</p>'+
  '<div class="jug" style="min-height:28px;border-bottom:var(--borde)"><span class="lbl">Jugada</span><span class="lbl c">Tú</span><span class="lbl c">'+(pri?'Antes':'Pasada')+'</span><span></span></div>'+li; };

/* ---------- Míster ---------- */
V.mister = function(){ var c='', ult=null;
  D.chat.forEach(function(x){ if(x.f!==ult){ c+='<span class="lbl day">'+(x.f===hoy()?'HOY':(x.f===sumar(hoy(),-1)?'AYER':fechaLarga(x.f).toUpperCase()))+'</span>'; ult=x.f; } if(x.u) c+='<p class="bubble me">'+e(x.u)+'</p>'; else c+='<p class="bubble">'+e(x.m)+'</p>'; });
  if(U.escribe) c+='<p class="bubble"><span class="escribe" aria-label="Míster está escribiendo"><i></i><i></i><i></i></span></p>';
  var q = U.qr==='cuesta'
    ? '<button type="button" class="chip" style="border:var(--lleno)" data-a="dificil" data-v="1">Poner el modo día difícil</button><button type="button" class="chip" data-a="qr" data-v="sigo">Gracias, sigo</button>'
    : '<button type="button" class="chip" data-a="qr" data-v="voy">¿Cómo voy?</button><button type="button" class="chip" data-a="qr" data-v="cuesta">Hoy me cuesta</button><button type="button" class="chip" data-a="qr" data-v="empujon">Dame un empujón</button><button type="button" class="chip" data-a="qr" data-v="mejor">¿Qué me sienta mejor?</button>';
  return '<div class="row sb"><h1 class="h1 m">Míster</h1><button type="button" class="chip" data-a="go" data-v="ajTono">Tono: '+TONO_N[D.perfil.tono].toLowerCase()+'</button></div>'+
  (c||'<p class="nota">Aquí te escribe Míster cada día.</p>')+'<div class="chips" style="margin-top:4px">'+q+'</div>'; };
function responder(v){ var f=hoy(), yo={voy:'¿Cómo voy?',cuesta:'Hoy me cuesta',empujon:'Dame un empujón',mejor:'¿Qué me sienta mejor?',sigo:'Gracias, sigo'}[v], r='';
  if(v==='voy'){ var m=marcador(jugadas(lunesDe(f),f)), c=cumplidosHasta(f), n=nHechas(f), t=tareas(f).length;
    r = (partidoOn() ? 'Esta semana vas '+m[0]+'–'+m[1]+' contra '+(lunesDe(inicio())===lunesDe(f)?'tu yo de antes de empezar':'tu semana pasada')+'. ' : '')+'Llevas '+plural(c,'día','días')+' con tu 1% cumplido y tu curva va en +'+pct(c)+' %.'+(t? ' Hoy, '+n+' de '+t+'.' : ' Hoy descansas.'); }
  if(v==='cuesta'){ var dej = D.perfil.areas.indexOf('dejar')!==-1 || retosActivos().some(function(x){ var R=retoDef(x.n); return R && R.dejar; });
    r = dej ? 'Vale. Aguanta diez minutos. Las ganas suben y bajan como una ola; en diez minutos suelen bajar. Mientras, bebe agua o cambia de sitio.' : (frase('Día difícil',{},2) || 'Vale. Hoy no hace falta hacerlo todo. Elige una cosa pequeña y lo demás, mañana.'); U.qr='cuesta'; }
  if(v==='empujon'){ r = frase('Buenos días con tu 1%', {uno: tareas(f).length ? tarea(tareas(f)[0],f).uno.toLowerCase() : ''}) || msgDelDia(); }
  if(v==='mejor'){ var x=pista();
    if(x.falta) r='Aún no lo sé. Necesito 7 días cerrados para ver algo; te faltan '+x.falta+'. Nunca me invento nada.';
    else if(x.nada) r='Con '+x.n+' días cerrados, no veo diferencias claras todavía. Sigue cerrando el día y te aviso cuando salga algo.';
    else r='Los días que cumples '+AREAS[x.k].c+', tu felicidad media es '+num(x.ma,1)+'; los que no, '+num(x.mb,1)+'. Son '+x.na+' días frente a '+x.nb+'. Es una pista, no una regla.'; }
  if(v==='sigo'){ r='Aquí estoy. Esta noche, cierra el día aunque sea con lo mínimo.'; U.qr=null; }
  D.chat.push({u:yo, f:f}); U.escribe=true; guardar(); render(); bajarChat();
  setTimeout(function(){ U.escribe=false; D.chat.push({m:r, f:f}); guardar(); if(U.pantalla==='mister'){ render(); sonar('marca'); bajarChat(); } }, 800); }
function bajarChat(){ var s=document.getElementById('scr'); if(s) s.scrollTop=s.scrollHeight; }

/* ---------- Progreso ---------- */
V.progreso = function(){ var f=hoy(), m=U.mes||f.slice(0,7), y=+m.slice(0,4), mo=+m.slice(5,7)-1, g='', c=cumplidosHasta(f);
  DIAS_C.forEach(function(x){ g+='<span class="lbl c">'+x+'</span>'; });
  var primero=m+'-01', off=dsem(primero), nd=new Date(y,mo+1,0).getDate();
  for(var i=0;i<off;i++) g+='<span class="cell vac" aria-hidden="true"></span>';
  for(var dd=1; dd<=nd; dd++){ var x=m+'-'+pad(dd), cls;
    if(x<inicio()) cls='vac'; else if(x>f) cls='fut'; else if(cumplido(x)) cls='si'; else if(soloDescanso(x)) cls='no hatch'; else if(D.dias[x]&&D.dias[x].cerrado) cls='no cer'; else cls='no';
    if(x===f) cls+=' hoy'; g+='<span class="cell '+cls+'">'+dd+'</span>'; }
  var prevM = mo===0 ? (y-1)+'-12' : y+'-'+pad(mo), nextM = mo===11 ? (y+1)+'-01' : y+'-'+pad(mo+2);
  var puedePrev = prevM >= inicio().slice(0,7), puedeNext = nextM <= f.slice(0,7);
  /* curva */
  var pts=[], n0=0, tot=entre(inicio(),f)+1; for(var j=0;j<tot;j++){ var x2=sumar(inicio(),j); if(cumplido(x2)) n0++; pts.push(n0); }
  var curva=''; if(pts.length>=2){ var maxY=Math.max(1,pct(n0)), W=320, H=60, path=''; pts.forEach(function(v,k){ var px=(k/(pts.length-1))*W, py=H-4-(pct(v)/maxY)*(H-10); path+=(k?'L':'M')+px.toFixed(1)+' '+py.toFixed(1)+' '; });
    curva='<svg width="100%" height="64" viewBox="0 0 320 64" preserveAspectRatio="none" aria-hidden="true"><path d="'+path+'" fill="none" stroke="var(--accTxt)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>'; }
  /* semanas */
  var sems=''; for(var w=1; w<=6; w++){ var l=sumar(lunesDe(f),-7*w); if(l<lunesDe(inicio())) break; var js=jugadas(l,sumar(l,6)), mm=marcador(js); sems+='<button type="button" class="it" data-a="verSemana" data-v="'+l+'"><span class="l">Semana del '+fechaCorta(l)+'</span><span class="v">'+(mm[0]>mm[1]?'Ganaste ':(mm[0]<mm[1]?'Perdiste ':'Empate '))+mm[0]+'–'+mm[1]+'</span><span style="color:var(--text3)">'+ic('chev',16)+'</span></button>'; }
  /* gym */
  var gym=''; if(D.perfil.areas.indexOf('entreno')!==-1){ var w2='', meta=D.perfil.diasGym.length; for(var s=5;s>=0;s--){ var l2=sumar(lunesDe(f),-7*s); if(l2<lunesDe(inicio())) continue; var nn=entrenosSemana(l2); w2+='<div><span class="num" style="font-size:16px">'+nn+'</span><span class="b'+(nn<meta?' lo':'')+'" style="height:'+Math.max(4,Math.min(5,nn)/Math.max(meta,1)*56)+'px"></span><span class="lbl">'+fechaCorta(l2).split(' ')[0]+'</span></div>'; }
    gym='<section class="box col" style="padding:12px 14px;gap:8px" aria-label="Gym por semana"><span class="lbl">Gym por semana · meta '+meta+'</span><div class="wk">'+w2+'</div></section>'; }
  /* pista */
  var pi=pista(), pistaH = pi.falta ? '<div class="box pad col" style="gap:4px"><span class="lbl">Lo que te sienta mejor</span><span style="font-size:14px;color:var(--text2);line-height:1.4">Con 7 días cerrados empiezo a ver qué te sienta mejor. Te faltan '+pi.falta+'.</span></div>' : (pi.nada ? '' : '<div class="box col" style="padding:14px;gap:6px;border:var(--lleno)"><span class="lbl acc">Pista · con '+(pi.na+pi.nb)+' días</span><strong style="font-size:16px;line-height:1.35">Los días que cumples '+AREAS[pi.k].c+', tu felicidad media es '+num(pi.ma,1)+'. Los que no, '+num(pi.mb,1)+'.</strong><span style="font-size:13px;color:var(--text2)">Es una pista, no una regla.</span></div>');
  var dinero = D.perfil.areas.indexOf('dejar')!==-1 ? '<div class="box row sb" style="padding:12px 14px"><span class="col" style="gap:2px"><span class="lbl">Días '+DEJAR[(D.perfil.dejar&&D.perfil.dejar.que)||'otra'][1]+'</span><span style="font-size:13px;color:var(--text2)">'+(eurosDia()?'Te has ahorrado':'Desde que empezaste')+'</span></span><span class="num acc" style="font-size:30px">'+(eurosDia()? num(diasSinDejar()*eurosDia())+' €' : diasSinDejar())+'</span></div>' : '';
  return '<div class="row sb" style="align-items:flex-end"><span class="row" style="gap:4px"><button type="button" class="ib" style="margin-left:-12px;'+(puedePrev?'':'visibility:hidden')+'" data-a="mes" data-v="'+prevM+'" aria-label="Mes anterior">'+ic('chevL',22)+'</button><h1 class="h1 m" style="font-size:'+(MESES[mo].length>7?34:42)+'px">'+cap(MESES[mo])+'</h1>'+(puedeNext?'<button type="button" class="ib" style="margin-left:0" data-a="mes" data-v="'+nextM+'" aria-label="Mes siguiente">'+ic('chev',22)+'</button>':'')+'</span><span class="col" style="align-items:flex-end;gap:2px;flex-shrink:0"><span class="num acc" style="font-size:30px">'+c+'</span><span class="lbl">Cumplidos</span></span></div>'+
  '<section class="sec" aria-label="Calendario"><div class="grid7">'+g+'</div>'+
  '<div class="row" style="gap:14px;flex-wrap:wrap;font-size:13px;color:var(--text2)"><span class="row" style="gap:6px"><span class="sw" style="background:var(--acc)"></span>Tu 1% cumplido</span><span class="row" style="gap:6px"><span class="sw hatch" style="border:var(--fina)"></span>Descanso</span><span class="row" style="gap:6px"><span class="sw" style="border:var(--borde);background:var(--caja)"></span>No cumplido</span></div></section>'+
  '<div class="box col" style="padding:12px 14px;gap:6px"><div class="row sb"><span class="lbl">Tu curva del 1%</span><span class="num acc" style="font-size:24px">+'+pct(c)+' %</span></div>'+curva+'<span style="font-size:13px;color:var(--text2)">Sube un 1% cada día que cumples todo. Si un día no, se queda igual: nunca baja.</span></div>'+
  (function(){ var nn=D.medallas?Object.keys(D.medallas).length:0, nv2=nivelDe(c); return '<button type="button" class="box row sb" style="padding:12px 14px;text-align:left;width:100%" data-a="go" data-v="medallas"><span class="row" style="gap:12px">'+medallaSVG(MEDALLAS[0][0], nn>0)+'<span class="col" style="gap:2px"><span class="lbl">Nivel '+nv2.i+' · '+nv2.n+'</span><strong>'+nn+' de '+MEDALLAS.length+' medallas</strong></span></span><span style="color:var(--text3)">'+ic('chev',18)+'</span></button>'; })()+
  dinero+pistaH+pasosProgreso()+gym+
  (partidoOn() && sems ? '<section class="sec"><span class="lbl">Tus partidos</span><div class="list">'+sems+'</div></section>' : '')+
  '<button type="button" class="box row sb" style="padding:12px 14px;text-align:left;width:100%" data-a="go" data-v="retos"><span class="col" style="gap:2px"><span class="lbl">Retos</span><strong>'+(retosActivos().length?plural(retosActivos().length,'reto en marcha','retos en marcha'):'Empezar un reto')+'</strong></span><span style="color:var(--text3)">'+ic('chev',18)+'</span></button>'; };

function pasosProgreso(){ var p=D.perfil, f=hoy(), hay=false, b='', tot=0, n=0, mx=1, dias=[];
  for(var i=6;i>=0;i--){ var x=sumar(f,-i), ps=(D.dias[x]||{}).pasos; if(x<inicio()) continue; dias.push([x,ps]); if(ps!=null){ hay=true; tot+=ps; n++; if(ps>mx) mx=ps; } }
  if(!hay && p.areas.indexOf('moverme')===-1) return '';
  var meta=metaDe('moverme',f); mx=Math.max(mx, meta);
  dias.forEach(function(d){ var ps=d[1]; b+='<div><span class="num" style="font-size:13px">'+(ps!=null?(ps>=1000?num(ps/1000,1)+'k':num(ps)):'—')+'</span><span class="b'+(ps!=null&&ps>=meta?'':' lo')+'" style="height:'+(ps!=null?Math.max(4,Math.round(ps/mx*56)):2)+'px"></span><span class="lbl">'+DIAS_C[dsem(d[0])]+'</span></div>'; });
  return '<button type="button" class="box col" style="padding:12px 14px;gap:8px;text-align:left;width:100%" data-a="go" data-v="pasosHist" aria-label="Tus pasos"><div class="row sb"><span class="lbl">Pasos · últimos 7 días</span><span style="color:var(--text3)">'+ic('chev',16)+'</span></div>'+
    (hay?'<div class="wk">'+b+'</div><span style="font-size:13px;color:var(--text2)">Media: '+num(tot/n)+' al día · meta '+num(meta)+'</span>':'<span style="font-size:14px;color:var(--text2)">Aún no hay pasos apuntados. Toca Moverme en Hoy o tráelos de Salud.</span>')+'</button>'; }
V.pasosHist = function(){ var f=hoy(), h='', mes='', tot=0, n=0, mejor=null;
  for(var x=f; x>=inicio(); x=sumar(x,-1)){ var d=D.dias[x]||{}, ps=d.pasos; if(ps==null) continue; tot+=ps; n++; if(!mejor||ps>mejor[1]) mejor=[x,ps];
    var m=x.slice(0,7); if(m!==mes){ mes=m; h+=(h?'</div>':'')+'<span class="lbl" style="margin-top:6px">'+cap(MESES[+m.slice(5)-1])+'</span><div class="list">'; }
    var mt=(d.metas&&d.metas.pasos)||metaDe('moverme',x), ok=ps>=mt; h+='<div class="it" style="cursor:default"><span class="l">'+fechaLarga(x)+'</span><span class="v'+(ok?' acc':'')+'" style="font-weight:700">'+num(ps)+(ok?' ✓':'')+'</span></div>'; }
  var pf=D.perfil, alt=+pf.altura||175, km=tot*alt*0.415/100000;
  return head('Tus pasos')+(n?'<section class="score s"><div><span class="lbl">Días</span><span class="num">'+n+'</span></div><div><span class="lbl">Media</span><span class="num">'+num(tot/n)+'</span></div><div><span class="lbl">Mejor</span><span class="num acc">'+num(mejor[1])+'</span></div></section><p class="nota" style="margin-top:-4px">En total, '+num(tot)+' pasos: unos '+num(km,1)+' km'+(pf.altura?'':' (con una altura media; pon la tuya en Ajustes)')+'.</p>'+h+'</div>':'<p class="nota">Aún no hay pasos apuntados.</p>')+
    '<button type="button" class="chip" style="min-height:48px;border:var(--lleno)" data-a="go" data-v="atajoPasos">Traer los pasos de Salud</button>'; };
V.atajoPasos = function(){ var u=APP_URL||location.href.split('?')[0];
  function paso(n,t,s){ return '<div class="row" style="align-items:flex-start;gap:12px"><span class="num acc" style="font-size:24px;width:22px;flex-shrink:0">'+n+'</span><span class="col" style="gap:3px"><strong style="font-size:15px;line-height:1.35">'+t+'</strong>'+(s?'<span style="font-size:14px;color:var(--text2);line-height:1.4">'+s+'</span>':'')+'</span></div>'; }
  return head('Pasos de Salud')+
  '<p class="p2" style="margin-top:-6px">Apple no deja que una app web lea Salud. El truco: un Atajo del iPhone coge tus pasos de hoy y los copia; aquí los pegas con un toque. Se crea una vez.</p>'+
  '<section class="box col" style="padding:14px;gap:14px" aria-label="Crear el Atajo">'+
  paso(1,'Abre la app Atajos y toca «+».','Viene con el iPhone. Si la borraste, está gratis en la App Store.')+
  paso(2,'Añade la acción «Buscar muestras de salud».','Tipo: Pasos. Fecha de inicio: hoy. Si te pregunta, dale permiso para leer los pasos.')+
  paso(3,'Añade «Calcular estadísticas» y elige «Suma».','Así suma todos los pasos del día en un solo número.')+
  paso(4,'Añade «Redondear número» y luego «Copiar en el portapapeles».','')+
  paso(5,'Llámalo «Mis pasos 1%» y guárdalo.','Para tenerlo a mano: mantenlo pulsado → Compartir → Añadir a pantalla de inicio, o díselo a Siri.')+'</section>'+
  '<section class="box col" style="padding:14px;gap:10px"><span class="lbl acc">Cada día</span><span style="font-size:15px;line-height:1.45">Toca el Atajo, abre la app, toca <b>Moverme</b> y luego <b>Pegar de Salud</b>. Listo.</span><span style="font-size:13px;color:var(--text2);line-height:1.4">Si quieres, en Atajos → Automatización puedes hacer que se ejecute solo cada noche a la hora que elijas; luego solo te queda pegar.</span></section>'+
  '<details class="rp-donde"><summary>¿Usas la app desde Safari, sin instalar?</summary><p>Cambia el paso 4 por «Abrir URL» con esta dirección y el número al final: '+e(u)+'?pasos= . Se abre la app con tus pasos ya puestos.</p></details>'+
  '<p class="nota">Cuando haya app de verdad para iPhone, los pasos llegarán solos desde Salud.</p>'; };

/* ====================== RETOS ====================== */
var RETOS = [
  {tema:'MÓVIL',n:'Sin móvil en la cama',total:7,vale:5,k:'cama',q:'¿Anoche dejaste el móvil fuera de la cama?'},
  {tema:'MÓVIL',n:'Primera hora del día sin redes',total:7,vale:5,k:'redes',q:'¿Hoy, la primera hora sin redes?'},
  {tema:'MÓVIL',n:'Menos horas de pantalla',total:14,vale:10,k:'pantalla',q:'¿Hoy has estado por debajo de tu meta de pantalla?'},
  {tema:'ENTRENO',n:'4 días de gym en una semana',total:7,vale:4,k:'gym',auto:'gym',q:'Se cuenta solo con tus entrenos.'},
  {tema:'MOVERME',n:'8.000 pasos al día',total:7,vale:5,k:'pasos',auto:'pasos',q:'Se cuenta solo con los pasos que apuntas.'},
  {tema:'SUEÑO',n:'Misma hora de levantarte',total:7,vale:5,k:'levantarse',q:'¿Hoy te has levantado a tu hora?'},
  {tema:'SUEÑO',n:'A la cama a tu hora',total:14,vale:10,k:'dormir',q:'¿Anoche estabas en la cama a tu hora?'},
  {tema:'MENTE',n:'10 páginas al día',total:7,vale:5,k:'paginas',q:'¿Hoy has leído tus 10 páginas?'},
  {tema:'ESTUDIO',n:'Mis minutos de estudio',total:14,vale:8,k:'estudio',q:'¿Hoy has estudiado?'},
  {tema:'ÁNIMO',n:'3 cosas buenas del día',total:21,vale:17,k:'buenas',auto:'buenas',q:'Cuenta el día cuando apuntas tus 3 cosas buenas.'},
  {tema:'COMIDA',n:'Sal de casa con algo en la mochila',total:7,vale:5,k:'mochila',q:'¿Hoy has salido con algo de comer?'},
  {tema:'COMIDA',n:'Sin bollería ni fritos entre semana',total:5,vale:4,k:'bolleria',q:'¿Hoy, sin bollería ni fritos?'},
  {tema:'COMIDA',n:'2 litros de agua al día',total:14,vale:10,k:'agua',auto:'agua',q:'Cuenta el día cuando llegas a 8 vasos.'},
  {tema:'ALCOHOL',n:'Sin alcohol entre semana',total:14,vale:9,k:'alcohol',q:'¿Hoy, sin alcohol?',dejar:1},
  {tema:'ALCOHOL',n:'30 días sin alcohol',total:30,vale:27,k:'alcohol',q:'¿Hoy, sin alcohol?',dejar:1},
  {tema:'TABACO',n:'Sin fumar ni vapear',total:7,vale:6,k:'tabaco',q:'¿Hoy, sin fumar ni vapear?',dejar:1},
  {tema:'BEBIDAS',n:'Sin energéticas ni refrescos',total:7,vale:6,k:'bebidas',q:'¿Hoy, sin energéticas ni refrescos?',dejar:1},
  {tema:'CANNABIS',n:'Sin porros',total:14,vale:12,k:'porros',q:'¿Hoy, sin porros?',dejar:1},
  {tema:'APUESTAS',n:'Sin apuestas online',total:30,vale:28,k:'apuestas',q:'¿Hoy, sin apostar?',dejar:1},
  {tema:'HÁBITOS',n:'Sin morderte las uñas',total:14,vale:12,k:'unas',q:'¿Hoy, sin morderte las uñas?',dejar:1},
  {tema:'DEJAR',n:'Sin compras por impulso',total:30,vale:26,k:'compras',q:'¿Hoy, sin compras por impulso?',dejar:1},
  {tema:'DEJAR',n:'Mi reto: dejar otra cosa',total:30,vale:26,k:'otra',q:'¿Hoy, sin eso?',dejar:1}
];
var RETO_ALIAS = {'Una semana sin energéticas':'Sin energéticas ni refrescos'};
var AVISO_SALUD = {ALCOHOL:'Si bebes mucho a diario, habla antes con tu médico o tu farmacéutico. Dejar el alcohol de golpe puede ser peligroso si hay dependencia.', TABACO:'Si fumas a diario, tu médico o tu farmacéutico te pueden ayudar a dejarlo.', CANNABIS:'Aquí no hay juicio, solo sí o no. Si te cuesta mucho, tu médico te puede ayudar.', APUESTAS:'Si apuestas a menudo y te cuesta parar, pide ayuda: no hace falta hacerlo solo.'};
function retoDef(n){ n=RETO_ALIAS[n]||n; for(var i=0;i<RETOS.length;i++){ if(RETOS[i].n===n) return RETOS[i]; } return null; }
function retosActivos(f){ f=f||hoy(); return D.retos.filter(function(r){ return !r.fin && r.ini<=f; }).concat(D.retos.filter(function(r){ return !r.fin && r.ini>f; })); }
function diaReto(r,f){ return entre(r.ini,f)+1; }
function okReto(r,f){ var R=retoDef(r.n); if(!R) return false;
  if(R.auto==='gym') return entrenoEl(f) || !!((D.dias[f]||{h:{}}).h.entreno);
  if(R.auto==='pasos'){ var d=D.dias[f]; return !!(d && d.pasos>=8000); }
  if(R.auto==='agua') return vasosDia(r,f)>=8;
  if(R.auto==='buenas') return buenasDia(r,f).length>=3;
  if(retoLibre(r,f)) return false;
  var d2=D.dias[f]; return !!(d2 && d2.retos && d2.retos[r.id]==='si'); }
function hechosReto(r){ var n=0, fin=sumar(r.ini, r.total-1); for(var f=r.ini; f<=hoy() && f<=fin; f=sumar(f,1)){ if(okReto(r,f)) n++; } return n; }
function evaluarRetos(){ D.retos.forEach(function(r){ if(r.fin) return; var fin=sumar(r.ini,r.total-1), h=hechosReto(r);
  if(hoy()>fin || (h>=r.vale && hoy()===fin && (D.dias[fin]||{}).cerrado)){ r.fin = h>=r.vale ? 'ok' : 'ko';
    if(r.fin==='ok') setTimeout(function(){ celebrar({tipo:'hito', eyebrow:'Reto completado', titulo:'¡Reto superado!', sub:r.n+': '+h+' de '+r.total+' días.', frase:frase2('Completa un reto',{reto:'«'+r.n+'»', hecho:String(h), meta:String(r.vale)})||'Reto superado. A por otro cuando quieras.', toast:'Reto superado: '+r.n+'.'}); }, 400); decir(frase(r.fin==='ok'?'Completa un reto':'No completa un reto',{reto:'«'+r.n+'»', hecho:String(h), meta:String(r.vale), 'días':String(h)}) || (r.fin==='ok'?'Reto completado: '+r.n.toLowerCase()+'.':'El reto «'+r.n.toLowerCase()+'» no ha salido esta vez. Se puede volver a empezar.'), hoy()); } }); }
function filaReto(r,f){ var R=retoDef(r.n), emp = r.ini<=f, sub = emp ? 'Día '+diaReto(r,f)+' de '+r.total+' · te valen '+r.vale : 'Empieza '+(r.ini===sumar(f,1)?'mañana':fechaLarga(r.ini).toLowerCase());
  var hoyOk = emp && okReto(r,f);
  return '<button type="button" class="fila'+(hoyOk?' on':'')+'" data-a="verReto" data-v="'+r.id+'"><span class="bx" aria-hidden="true" style="font-size:13px">'+hechosReto(r)+'/'+r.vale+'</span><span class="col" style="gap:2px;flex:1;min-width:0"><span class="lbl">RETO'+(R?' · '+R.tema:'')+'</span><strong style="font-size:15px">'+e(nombreReto(r))+'</strong><span style="font-size:13px;color:var(--text2)">'+sub+'</span></span><span style="color:var(--text3);align-self:center">'+ic('chev',16)+'</span></button>'; }
var TEMA_AREA = {'MÓVIL':'movil','ENTRENO':'entreno','MOVERME':'moverme','SUEÑO':'sueno','MENTE':'leer','COMIDA':'comida','ESTUDIO':'estudio','ÁNIMO':'animo'};
var TEMA_DEJAR = {alcohol:'ALCOHOL',tabaco:'TABACO',porros:'CANNABIS',apuestas:'APUESTAS',energeticas:'BEBIDAS'};
function retosParaTi(pp, lim){ var p=pp||D.perfil, out=[];
  RETOS.forEach(function(R,i){ if(D.perfil && retosActivos().some(function(x){ return x.n===R.n; })) return; if(pp && R.k==='otra') return;
    var a=TEMA_AREA[R.tema], ok = (a && (p.areas.indexOf(a)!==-1 || (a==='leer' && p.areas.indexOf('estudio')!==-1))) || (p.dejar && TEMA_DEJAR[p.dejar.que]===R.tema) || (p.dejar && p.dejar.que==='otra' && R.k==='otra');
    if(!ok && p.base){ if(R.tema==='MÓVIL' && +p.base.movil>=4) ok=true; if(R.tema==='SUEÑO' && +p.base.sueno<=5) ok=true; if(R.tema==='MOVERME' && +p.base.pasos===3000) ok=true; if(R.tema==='COMIDA' && (p.base.comida==='mal'||p.base.comida==='regular')) ok=true; }
    if(ok) out.push(i); });
  if(pp && out.length<3){ [0,1,9,12].forEach(function(i){ if(out.length<3 && out.indexOf(i)===-1 && !(D.perfil && retosActivos().some(function(x){ return x.n===RETOS[i].n; }))) out.push(i); }); }
  return out.slice(0,lim||4); }
function tarjetaReto(i){ var R=RETOS[i]; return '<button type="button" class="tile reto-t" data-a="nuevoReto" data-v="'+i+'"><span class="tt" style="color:var(--text3)">'+R.tema+'</span><span class="v2" style="position:relative;line-height:1.25">'+R.n+'</span><span class="s2" style="position:relative">'+R.total+' días · te valen '+R.vale+'</span></button>'; }
V.retos = function(){ var a='', l='', hist='', f=hoy(), pt=retosParaTi(), temas=[], ch='';
  retosActivos().forEach(function(r){ var R=retoDef(r.n)||{}, h=hechosReto(r), emp=r.ini<=f, d=D.dias[f]||{}, v=(d.retos||{})[r.id], pr=Math.min(100,Math.round(h/r.vale*100));
    var rapido = (emp && !R.auto && !retoLibre(r,f)) ? '<div class="row" style="gap:8px"><span style="flex:1;font-size:14px;font-weight:700">'+qReto(r,R)+'</span><button type="button" class="chip'+(v==='si'?' on':'')+'" data-a="retoRapido" data-v="'+r.id+'.si" aria-pressed="'+(v==='si')+'">Sí</button><button type="button" class="chip'+(v==='no'?' on2':'')+'" data-a="retoRapido" data-v="'+r.id+'.no" aria-pressed="'+(v==='no')+'">No</button></div>' : '';
    a+='<div class="box col reto-act" style="padding:12px 14px;gap:10px;border:var(--lleno)"><button type="button" class="row" style="gap:12px;border:none;background:none;padding:0;text-align:left;width:100%" data-a="verReto" data-v="'+r.id+'"><span class="col" style="flex:1;gap:3px;min-width:0"><span class="lbl acc">'+(emp?'Día '+diaReto(r,f)+' de '+r.total:'Empieza '+(r.ini===sumar(f,1)?'mañana':fechaCorta(r.ini)))+'</span><strong style="font-size:16px">'+e(nombreReto(r))+'</strong>'+retoResumen(r)+'</span><span class="num'+(U.recienReto===r.id?' gol':'')+'" style="font-size:32px">'+h+'/'+r.vale+'</span></button><div class="mbar"><span class="llena" style="--w:'+pr+'%"></span></div>'+rapido+'</div>'; });
  U.recienReto=null;
  RETOS.forEach(function(R){ if(temas.indexOf(R.tema)===-1) temas.push(R.tema); });
  var tf=U.temaReto||'Todos'; ['Todos'].concat(temas).forEach(function(t){ ch+='<button type="button" class="chip'+(tf===t?' on':'')+'" aria-pressed="'+(tf===t)+'" data-a="temaReto" data-v="'+t+'">'+cap(t.toLowerCase())+'</button>'; });
  RETOS.forEach(function(R,i){ if(retosActivos().some(function(x){ return x.n===R.n; })) return; if(tf!=='Todos' && R.tema!==tf) return; if(tf==='Todos' && pt.indexOf(i)!==-1) return; l+=tarjetaReto(i); });
  D.retos.filter(function(r){ return r.fin; }).slice(-5).reverse().forEach(function(r){ hist+='<div class="it" style="cursor:default"><span class="l">'+e(nombreReto(r))+'</span><span class="v">'+(r.fin==='ok'?'Superado':'No salió')+' · '+hechosReto(r)+'/'+r.vale+'</span></div>'; });
  var superados=D.retos.filter(function(r){ return r.fin==='ok'; }).length;
  return '<div class="row sb"><h1 class="h1 m">Retos</h1>'+(superados?'<span class="col" style="align-items:flex-end;gap:0"><span class="num acc" style="font-size:28px">'+superados+'</span><span class="lbl">Superados</span></span>':'')+'</div>'+
  '<p class="p2" style="margin-top:-6px">Cortos, con principio y fin, y con margen: un mal día no lo rompe.</p>'+
  (a?'<span class="lbl">En marcha</span>'+a:'')+
  (pt.length && tf==='Todos' ? '<span class="lbl">Para ti</span><div class="grid2">'+pt.map(tarjetaReto).join('')+'</div>' : '')+
  '<span class="lbl">'+(tf==='Todos'?'Todos los retos':cap(tf.toLowerCase()))+'</span><div class="chips" style="flex-wrap:nowrap;overflow-x:auto;padding-bottom:2px">'+ch+'</div><div class="grid2">'+(l||'<p class="nota">Ya tienes en marcha todos los de este tema.</p>')+'</div>'+
  (hist?'<section class="sec"><span class="lbl">Terminados</span><div class="list">'+hist+'</div></section>':'')+
  '<p class="nota">Con 16 o 17 años, los de alcohol, tabaco, porros y apuestas son siempre para dejarlo o reducirlo.</p>'; };
V.nuevoReto = function(){ var R=RETOS[U.nuevoReto.i], ini='', av=AVISO_SALUD[R.tema];
  [['hoy','Hoy'],['manana','Mañana']].forEach(function(x){ ini+=opt(x[1], U.nuevoReto.cuando===x[0],'retoCuando',x[0],'c'); });
  return headLbl('Reto · '+R.tema.toLowerCase())+'<h1 class="h1" style="font-size:46px;margin-top:-6px">'+R.n+'.</h1>'+
  '<section class="score s" aria-label="Cómo es el reto"><div><span class="lbl">Dura</span><span class="num">'+R.total+' DÍAS</span></div><div><span class="lbl">Te valen</span><span class="num acc">'+R.vale+'</span></div><div><span class="lbl">Cuenta</span><span class="num">'+(R.auto?'SOLO':'SÍ / NO')+'</span></div></section>'+
  '<p class="p2">'+(R.auto ? R.q : 'Cada noche, al cerrar el día: «'+R.q+'» Sí o no, y listo.')+' Un mal día no lo tira todo.'+(R.dejar?' Llevarás un reloj con el tiempo que llevas sin hacerlo.':'')+'</p>'+
  (av?'<div class="box row" style="padding:12px 14px;align-items:flex-start"><span style="flex-shrink:0;margin-top:1px">'+ic('info',20,2.2)+'</span><p style="margin:0;font-size:14px;line-height:1.45">'+av+'</p></div>':'')+
  retoPreguntas()+'<div class="sec"><span class="lbl">¿Cuándo empiezas?</span><div class="grid2">'+ini+'</div></div><div class="fill"></div>'+cta('EMPEZAR EL RETO','empezarReto','','',retoCfgOk()?'':'off'); };
V.reto = function(){ var r=D.retos.filter(function(x){ return x.id===U.retoSel; })[0]; if(!r) return head('Reto');
  var R=retoDef(r.n)||{q:''}, f=hoy(), cel='', h=hechosReto(r), emp=r.ini<=f;
  for(var i=0;i<Math.min(r.total,35);i++){ var x=sumar(r.ini,i), cls = x>f ? 'fut' : (okReto(r,x)?'si':(retoLibre(r,x)?'libre':'no')); if(x===f) cls+=' hoy'; cel+='<span class="cell '+cls+'">'+(cls.indexOf('si')===0?ic('check',14,3):(i+1))+'</span>'; }
  var falta=Math.max(0,r.vale-h), txt = !emp ? 'Empieza '+(r.ini===sumar(f,1)?'mañana':fechaLarga(r.ini).toLowerCase())+'.' : (falta ? 'Te valen '+r.vale+' de '+r.total+'. Te faltan '+falta+'.' : 'Ya lo tienes: '+r.vale+' de '+r.total+'. Lo que venga, suma.');
  var hoyR = (emp && !R.auto && !retoLibre(r,f) && !r.fin) ? (function(){ var d=D.dias[f]||{}, v=(d.retos||{})[r.id]; var b=''; [['si','Sí'],['no','No']].forEach(function(o){ b+=opt(o[1], v===o[0],'retoHoy',o[0],'c'); }); return '<div class="box col" style="padding:12px 14px;gap:10px;border:var(--lleno)"><span class="lbl acc">Hoy</span><strong style="font-size:16px">'+qReto(r,R)+'</strong><div class="grid2">'+b+'</div></div>'; })() : '';
  return headLbl('Reto · '+(R.tema||'').toLowerCase())+'<h1 class="h1" style="font-size:44px;margin-top:-6px">'+e(nombreReto(r))+'.</h1>'+
  retoPanel(r)+hoyR+'<section class="box col" style="padding:14px;gap:12px" aria-label="Cómo vas"><div class="row sb" style="align-items:baseline"><span class="num acc" style="font-size:44px">'+h+' DE '+r.vale+'</span><span class="lbl">Cumplidos</span></div><div class="grid7">'+cel+'</div><p class="p2" style="font-size:14px">'+txt+'</p></section>'+
  (R.auto?'<p class="nota">'+R.q+'</p>':'')+
  (AVISO_SALUD[R.tema]?'<div class="box row" style="padding:12px 14px;align-items:flex-start"><span style="flex-shrink:0;margin-top:1px">'+ic('info',20,2.2)+'</span><p style="margin:0;font-size:14px;line-height:1.45">'+AVISO_SALUD[R.tema]+'</p></div>':'')+
  '<button type="button" class="link" data-a="dejarReto" data-v="'+r.id+'">Dejar el reto</button>'; };

/* ====================== AJUSTES ====================== */
V.ajustes = function(){ var p=D.perfil;
  function it(l,v,a,val){ return '<button type="button" class="it" data-a="'+a+'" data-v="'+e(val||'')+'"><span class="l">'+l+'</span><span class="v">'+v+'</span><span style="color:var(--text3)">'+ic('chev',16)+'</span></button>'; }
  function sw(l,on,a){ return '<button type="button" class="it" data-a="'+a+'" aria-pressed="'+on+'"><span class="l">'+l+'</span><span class="sw33'+(on?' on':'')+'" aria-hidden="true"></span></button>'; }
  function sec(t,rows){ return '<section class="sec" aria-label="'+t+'"><span class="lbl">'+t+'</span><div class="list">'+rows+'</div></section>'; }
  var areas=p.areas.map(function(k){ return cap(AREAS[k].n.toLowerCase()); }).join(', ');
  var copia = D.copia ? 'hace '+plural(Math.max(0,Math.floor((ahora()-D.copia)/86400000)),'día','días') : 'nunca';
  var donde = NUBE.ok ? 'En este móvil y en tu cuenta de Claude' : 'En este móvil';
  return head('Ajustes')+
  '<div class="box row" style="min-height:84px;padding:10px 14px;gap:14px"><label class="perfil-foto" aria-label="'+(FOTOS.perfil?'Cambiar tu foto':'Poner tu foto')+'"><span class="avatar xl">'+avatarIn()+'</span><span class="cam" aria-hidden="true">'+ic('camara',14,2.4)+'</span><input type="file" accept="image/*" data-f="perfilFoto"></label><span class="col" style="gap:2px;min-width:0"><strong style="font-size:16px">'+e(p.nombre)+'</strong><span style="font-size:13px;color:var(--text2)">Empezaste el '+fechaLarga(p.creado).toLowerCase()+' · día '+diaN()+'</span>'+(FOTOS.perfil?'<button type="button" class="link" style="align-self:flex-start;min-height:30px;padding:0;font-size:13px" data-a="quitarFotoPerfil">Quitar foto</button>':'<span style="font-size:13px;color:var(--text3)">Toca el círculo para poner tu foto</span>')+'</span></div>'+
  sec('Lo que sigues', it('Áreas',areas,'go','ajAreas')+(p.areas.indexOf('entreno')!==-1?it('Días de gym',p.diasGym.map(function(i){return DIAS_C[i];}).join(' '),'go','ajGym'):'')+(p.areas.indexOf('moverme')!==-1?it('Meta de pasos',num(p.metaPasos),'go','ajPasos'):'')+(p.areas.indexOf('movil')!==-1?it('Meta de móvil','Menos de '+hm(metaDe('movil')),'go','ajMovil'):'')+(p.areas.indexOf('dejar')!==-1?it('Qué dejas',DEJAR[(p.dejar&&p.dejar.que)||'otra'][0],'go','ajDejar')+it('Tus razones',plural(((p.dejar&&p.dejar.razones)||[]).length,'razón','razones'),'go','razones'):'')+it('Retos',plural(retosActivos().length,'en marcha','en marcha'),'go','retos')+it('Mi día chungo',chungoTxt(p),'go','ajChungo')+it('Peso y altura',(p.peso||p.altura)?[p.peso?num(p.peso,1)+' kg':'',p.altura?p.altura+' cm':''].filter(Boolean).join(' · '):'Sin poner','go','ajCuerpo'))+
  sec('Míster', it('Cómo te llama',e(p.nombre),'go','ajNombre')+it('Tono',TONO_N[p.tono],'go','ajTono'))+
  sec('Tú contra ti', sw('Partido semanal',partidoOn(),'swPartido')+(partidoOn()?sw('Resultado del domingo',p.pitido!==false,'swPitido'):''))+
  sec('Tu app', it('Celebraciones',{tope:'A tope',normal:'Normal',tranqui:'Tranquilas'}[p.celebra||'normal'],'go','ajCelebra')+it('Repetir el test','Unos 3 minutos','retest','')+it('Tema',{oscuro:'Oscuro',claro:'Claro',auto:'Automático'}[p.tema||'auto'],'go','ajAspecto')+it('Color',{amarillo:'Amarillo',azul:'Azul',verde:'Verde',naranja:'Naranja',morado:'Morado',byn:'Blanco y negro'}[p.color||'amarillo'],'go','ajAspecto')+sw('Sonidos',p.sonido!==false,'swSonido'))+
  '<section class="sec" aria-label="Tus datos"><span class="lbl">Tus datos</span><div class="list"><div class="it" style="cursor:default"><span class="l">Dónde se guardan</span><span class="v">'+donde+'</span></div>'+it('Descargar una copia','Última: '+copia,'copia','')+
  '<label class="it" style="cursor:pointer"><span class="l">Recuperar una copia</span><span class="v">Desde un archivo</span><span style="color:var(--text3)">'+ic('chev',16)+'</span><input type="file" accept=".json,application/json" data-f="restaurar" style="position:absolute;width:1px;height:1px;opacity:0"></label>'+
  it('Privacidad','','go','privacidad')+'<button type="button" class="it" data-a="borrarTodo"><span class="l" style="color:#D93A40">Borrar todos mis datos</span></button></div>'+
  (NUBE.ok?'':'<p class="nota">Se guardan solo en este móvil y en este navegador. Descarga una copia de vez en cuando por si cambias de móvil o borras los datos de Safari.</p>')+'</section>'+
  sec('Avisos', it('Recordatorio diario', p.recordatorio ? 'A las '+p.recordatorio : 'Añadir al calendario','recordatorioSheet','')+(esInstalada()?'':it('Instalar en el iPhone','Como una app','instalarSheet','')))+
  sec('Ayuda', it('Cómo funciona','','guia','')+it('Medallas',(D.medallas?Object.keys(D.medallas).length:0)+' de '+MEDALLAS.length,'go','medallas')+'<div class="it" style="cursor:default"><span class="l">Línea 024</span><span class="v">Gratis, a cualquier hora</span></div>')+
  '<p class="nota c">App 1% · '+VERSION+'</p>'; };
V.ajAreas = function(){ var h='', a=D.perfil.areas;
  ORDEN_AREAS.forEach(function(k){ var on=a.indexOf(k)!==-1; h+=opt('<span class="ar"><span>'+AREAS[k].n+'</span>'+(on?ic('check',16,3):'')+'</span><span class="t">'+AREAS[k].t+'</span>', on,'ajArea',k,'mid'); });
  return head('Áreas')+'<p class="p2" style="margin-top:-6px">Hasta 4. Los cambios valen desde hoy; los días anteriores se quedan como estaban.</p><div class="grid2">'+h+'</div>'; };
V.ajGym = function(){ var h='', d=D.perfil.diasGym;
  DIAS.forEach(function(x,i){ h+=opt('<span class="num" style="font-size:22px">'+DIAS_C[i]+'</span>', d.indexOf(i)!==-1,'ajDia',String(i),'c'); });
  return head('Días de gym')+'<p class="p2" style="margin-top:-6px">Solo esos días cuentan para tu 1%. Los demás, descanso. Si un día extra entrenas, suma igual.</p><div class="grid7" style="gap:6px">'+h+'</div>'; };
V.ajPasos = function(){ var h=''; [5000,6000,7500,8000,10000,12000].forEach(function(x){ h+=opt('<span class="num" style="font-size:24px">'+num(x)+'</span>', D.perfil.metaPasos===x,'ajPasos',String(x),'c'); });
  return head('Meta de pasos')+'<div class="grid3">'+h+'</div><p class="nota">Si un día no los miras, también vale con 30 minutos andando.</p>'; };
V.ajMovil = function(){ var h='', m=metaDe('movil'); [60,90,120,150,180,210,240,270,300,360].forEach(function(x){ h+=opt('<span class="num" style="font-size:22px">'+hm(x).toUpperCase()+'</span>', m===x,'ajMovil',String(x),'c'); });
  return head('Meta de móvil')+'<p class="p2" style="margin-top:-6px">Menos de cuántas horas de pantalla al día. Lo ves en Ajustes del iPhone → Tiempo de uso.</p><div class="grid3">'+h+'</div>'; };
V.ajDejar = function(){ var h='', t=D.perfil.dejar||{};
  Object.keys(DEJAR).forEach(function(k){ h+=opt(DEJAR[k][0], t.que===k,'ajDejar',k,'c'); });
  return head('Qué dejas')+'<div class="grid2">'+h+'</div><div class="sec"><label class="lbl" for="in-ajeuros">¿Cuánto te gastabas a la semana?</label><div class="row"><input id="in-ajeuros" class="input" type="text" inputmode="decimal" value="'+e(t.euros||'')+'" data-in="p.euros" placeholder="Por ejemplo, 20" style="flex:1"><span class="num" style="font-size:28px">€</span></div></div>'; };
V.ajChungo = function(){ var p=D.perfil; return head('Mi día chungo')+'<p class="p2" style="margin-top:-6px">Con el modo día difícil, tu 1% pasa a ser solo esto.</p>'+chungoOpciones(p.chungo||'paseo20', p.chungoTxt, 'ajChungo', 'p')+'<p class="nota">Por la noche, si tu mínimo es un paseo, te propongo estirar en su lugar.</p>'; };
V.ajCuerpo = function(){ var p=D.perfil; return head('Peso y altura')+cuerpoCampos(p.peso, p.altura, 'p')+'<p class="nota">Se guarda solo. Se usa para las calorías del gym y los kilómetros de tus pasos. No sale nunca en las tarjetas para compartir.</p>'; };
V.ajNombre = function(){ return head('Tu nombre')+'<div class="sec"><label class="lbl" for="in-ajnombre">Cómo te llama Míster</label><input id="in-ajnombre" class="input big" type="text" maxlength="20" value="'+e(D.perfil.nombre)+'" data-in="p.nombre"></div><p class="nota">Se guarda solo.</p>'; };
V.ajTono = function(){ return head('Tono de Míster')+'<div class="col" style="gap:8px">'+tonoOpciones(D.perfil.tono,'ajTono')+'</div><p class="nota">En un día malo, Míster siempre baja a suave.</p>'; };
V.ajAspecto = function(){ var p=D.perfil; return head('Aspecto')+aspectoOpciones(p.tema||'auto',p.color||'amarillo','ajTema','ajColor')+muestraAspecto(); };
V.ajCelebra = function(){ var h='', p=D.perfil; PREG.celebra.ops.forEach(function(o){ h+=opt('<span class="dot" aria-hidden="true"></span><span>'+o[1]+'</span>', (p.celebra||'normal')===o[0],'ajCelebra',o[0],'calm'); });
  return head('Celebraciones')+'<p class="p2" style="margin-top:-6px">Solo cuando lo ganas: récords, días cumplidos, goles, semanas completas y retos.</p><div class="col" style="gap:8px">'+h+'</div><button type="button" class="chip" style="min-height:48px" data-a="probarCele">Probar</button><p class="nota">En iPhone, la vibración funciona con iOS 18 o más y es un toque suave: Safari no deja más.</p>'; };
V.privacidad = function(){ return head('Privacidad')+M('Lo que apuntas aquí es tuyo. Te lo explico sin letra pequeña.')+
  '<div class="list"><div class="it" style="cursor:default"><span class="l">Dónde están tus datos</span><span class="v">'+(NUBE.ok?'Tu móvil y tu cuenta':'En tu móvil')+'</span></div><div class="it" style="cursor:default"><span class="l">Quién los ve</span><span class="v">Solo tú</span></div><div class="it" style="cursor:default"><span class="l">Anuncios</span><span class="v">Ninguno</span></div><div class="it" style="cursor:default"><span class="l">Cuenta</span><span class="v">No hace falta</span></div></div>'+
  '<p class="p2" style="font-size:14px">Tus datos se guardan en este navegador. Nadie más los ve: ni el que te pasó el enlace ni tus amigos. '+(NUBE.ok?'Como has entrado con tu cuenta de Claude, además se guarda una copia privada en ella. ':'')+'Si borras los datos de Safari o cambias de móvil, se pierden salvo que tengas una copia.</p>'+
  '<p class="p2" style="font-size:14px">No hay avisos, ni Salud de Apple, ni widgets: esta beta es una página web. Llegarán con la app de verdad.</p>'; };

/* =========================================================
   Parte 3: gym (entreno, ejercicios, fichas, rutinas, historial)
   ========================================================= */
function nombresEj(){ return EJ.map(function(x){ return x[0]; }).concat(D.propios); }
function infoEj(n){ for(var i=0;i<EJ.length;i++){ if(EJ[i][0]===n) return EJ[i]; } return [n,'Propio','—','',n,0]; }
function fichaDe(n){ var k=FICHA_DE[n]; return k && FICHAS[k] && FIG[k] ? k : null; }
function seriesPrevias(n){ var s=sesiones(n); return s.length ? s[0].s : null; }
function nuevoEjercicio(n, nSeries, reps){ var prev=seriesPrevias(n), s=[];
  if(prev){ prev.forEach(function(p){ s.push({kg:p[0], r:p[1], ok:false, w:!!p[2]}); }); }
  else { for(var i=0;i<(nSeries||3);i++) s.push({kg:null, r:reps||(D.perfil&&D.perfil.reps)||10, ok:false}); }
  if(nSeries && s.length!==nSeries){ while(s.length<nSeries){ var u=s[s.length-1]; s.push({kg:u.kg, r:u.r, ok:false}); } if(s.length>nSeries) s=s.slice(0,nSeries); }
  return {n:n, s:s}; }
function empezarEntreno(desde){ if(D.actual){ U.pantalla='entreno'; render(); return; }
  var a={id:uid(), ini:ahora(), fecha:hoy(), nombre:'', rutina:null, ej:[], desc:null};
  if(desde && desde.rutina){ var r=D.rutinas.filter(function(x){ return x.id===desde.rutina; })[0]; if(r){ a.nombre=r.nombre; a.rutina=r.id; r.ej.forEach(function(x){ a.ej.push(nuevoEjercicio(x.n, x.series, x.reps)); }); } }
  if(desde && desde.repetir){ var x=D.entrenos.filter(function(y){ return y.id===desde.repetir; })[0]; if(x){ a.nombre=/^Entreno del \S+$/.test(x.nombre)?'':x.nombre; x.ej.forEach(function(ej){ a.ej.push(nuevoEjercicio(ej.n, ej.s.length)); }); } }
  if(!a.nombre) a.nombre = 'Entreno del '+DIAS[dsem(hoy())];
  D.actual=a; guardar(); U.sheet=null; U.hist=[]; U.pantalla='entreno'; render(); }
function cronoTxt(){ return D.actual ? mmss((ahora()-D.actual.ini)/1000) : '0:00'; }

V.gym = function(){ var f=hoy(), p=D.perfil, l=lunesDe(f), cel='', hayGym=p.areas.indexOf('entreno')!==-1;
  for(var i=0;i<7;i++){ var x=sumar(l,i), hecho2=entrenoEl(x)||((D.dias[x]||{h:{}}).h.entreno), pl=p.diasGym&&p.diasGym.indexOf(i)!==-1, cls = hecho2?'si':(x>f?'fut':(x<inicio()?'vac':'no')); if(pl && !hecho2) cls+=' plan'; if(x===f) cls+=' hoy'; cel+='<span class="cell '+cls+'">'+DIAS_C[i]+'</span>'; }
  var hechos=entrenosSemana(l), meta=(p.diasGym||[]).length;
  var rut=''; D.rutinas.forEach(function(r){ rut+='<div class="lrow"><button type="button" class="row" style="flex:1;min-width:0;border:none;background:none;text-align:left;padding:8px 0;gap:12px" data-a="empezarRutina" data-v="'+r.id+'"><span class="thumb" aria-hidden="true">'+ic('play',20,2.4)+'</span><span class="col" style="gap:3px;min-width:0"><strong style="font-size:15px">'+e(r.nombre)+'</strong><span style="font-size:13px;color:var(--text2)">'+plural(r.ej.length,'ejercicio','ejercicios')+'</span></span></button><button type="button" class="link" style="min-height:44px" data-a="editarRutina" data-v="'+r.id+'">Editar</button></div>'; });
  var todosE=actividades(), his=''; todosE.slice(0,4).forEach(function(x){ his+=filaActividad(x); });
  var kSem=kcalEntre(l, sumar(l,6)), kTot=kcalEntre('0000', '9999');
  var recs=listaRecords().slice(0,4), rec=''; recs.forEach(function(r){ rec+='<button type="button" class="it" data-a="verEj" data-v="'+e(r.n)+'"><span class="l">'+e(r.n)+'</span><span class="v">'+(r.kg?kg(r.kg)+' kg × '+r.reps:r.reps+' reps')+'</span><span style="color:var(--text3)">'+ic('chev',16)+'</span></button>'; });
  return '<div class="row sb"><h1 class="h1 m">Gym</h1><span class="lbl">'+(hayGym?'Esta semana · '+hechos+' de '+meta:'Esta semana · '+hechos)+'</span></div>'+
  '<section class="box col" style="padding:12px;gap:10px" aria-label="Esta semana"><div class="grid7">'+cel+'</div>'+(hayGym?'<span style="font-size:13px;color:var(--text2)">'+(planGym(f)?(entrenoEl(f)?'Hoy, hecho.':'Hoy toca entrenar.'):'Hoy no toca. Si entrenas, suma igual.')+' Los días con borde son los que toca.</span>':'')+'</section>'+
  (D.actual ? cta('SEGUIR ENTRENO','go','entreno','<span class="small" id="crono2">'+cronoTxt()+'</span>') : cta('EMPEZAR ENTRENO','empezarSheet','',ic('play')))+
  '<button type="button" class="chip" style="min-height:48px" data-a="deporteSheet">+ He hecho otro deporte</button>'+
  (kTot ? '<button type="button" class="box col" style="padding:12px 14px;gap:6px;text-align:left;width:100%" data-a="kcalInfo"><div class="row sb"><span class="lbl">Quemado entrenando · estimación</span><span style="color:var(--text3)">'+ic('info',16,2.2)+'</span></div><div class="grid2"><span class="col" style="gap:0"><span class="num acc" style="font-size:26px">'+num(kSem)+' KCAL</span><span style="font-size:13px;color:var(--text2)">esta semana</span></span><span class="col" style="gap:0"><span class="num" style="font-size:26px">'+num(kTot)+' KCAL</span><span style="font-size:13px;color:var(--text2)">en total</span></span></div><span style="font-size:14px;font-weight:700">Ya llevas el equivalente a '+grasaTxt(kTot)+' de grasa.</span></button>' : '')+
  '<section class="sec" aria-label="Rutinas"><div class="row sb"><span class="lbl">Tus rutinas</span><button type="button" class="link" style="min-height:36px;padding:0" data-a="nuevaRutina">+ Nueva rutina</button></div>'+
  (rut?'<div class="col" style="gap:0">'+rut+'</div>':'<div class="box pad"><p class="p2" style="font-size:14px">Crea una rutina (Pierna, Empuje, Tirón…) y la empiezas con un toque. También puedes guardar como rutina cualquier entreno al acabarlo.</p></div>')+'</section>'+
  (his?'<section class="sec" aria-label="Últimos entrenos"><div class="row sb"><span class="lbl">Últimos entrenos</span>'+(todosE.length>4?'<button type="button" class="link" style="min-height:36px;padding:0" data-a="go" data-v="historial">Ver todos ('+todosE.length+')</button>':'')+'</div><div class="list">'+his+'</div></section>':'')+
  (rec?'<section class="sec" aria-label="Récords"><div class="row sb"><span class="lbl">Tus mejores marcas</span><button type="button" class="link" style="min-height:36px;padding:0" data-a="go" data-v="records">Ver todas</button></div><div class="list">'+rec+'</div></section>':'')+
  '<button type="button" class="box row" style="min-height:52px;padding:0 14px;gap:10px;width:100%;text-align:left" data-a="buscarEj" data-v="ver"><span style="color:var(--text3)">'+ic('search',18)+'</span><span style="flex:1;color:var(--text2);font-size:15px">Buscar entre '+(EJ.length+D.propios.length)+' ejercicios</span></button>'+
  fichasGrid(); };
function fichasGrid(){ var ks=Object.keys(FICHAS), lim=U.fichasTodas?ks.length:6, h='';
  ks.slice(0,lim).forEach(function(k){ var F=FICHAS[k]; h+='<button type="button" class="fcard" data-a="verEj" data-v="'+e(F.t)+'"><span class="pl" aria-hidden="true">'+ic('play',14,2.6)+'</span><strong style="padding-right:18px">'+e(F.t)+'</strong><span class="s2">'+e(F.sub)+'</span></button>'; });
  return '<section class="sec" aria-label="Técnica"><div class="row sb"><span class="lbl">Técnica · '+ks.length+' ejercicios animados</span><button type="button" class="link" style="min-height:36px;font-size:13px;padding:0" data-a="fichasTodas">'+(U.fichasTodas?'Ver menos':'Ver los '+ks.length)+'</button></div><div class="fgrid">'+h+'</div></section>'; }
function listaRecords(){ var m={}; D.entrenos.forEach(function(x){ x.ej.forEach(function(ej){ ej.s.forEach(function(s){ if(s[2]) return; var b=m[ej.n]; if(!b || s[0]>b.kg || (s[0]===b.kg && s[1]>b.reps)) m[ej.n]={n:ej.n, kg:s[0], reps:s[1], f:x.fecha}; }); }); });
  return Object.keys(m).map(function(k){ return m[k]; }).sort(function(a,b){ return a.f<b.f?1:(a.f>b.f?-1:0); }); }

/* ---------- entreno en curso ---------- */
V.entreno = function(){ var a=D.actual; if(!a){ U.pantalla='gym'; return V.gym(); }
  var h='';
  a.ej.forEach(function(ej,i){ var prev=seriesPrevias(ej.n), filas='';
    var nn=0; ej.s.forEach(function(s,j){ if(!s.w) nn++; filas+='<div class="srow'+(s.ok?' ok':'')+(s.w?' w':'')+(s.rec?' rec':'')+'"><button type="button" class="sn" data-a="serieW" data-v="'+i+'.'+j+'" aria-label="'+(s.w?'Serie de calentamiento. Toca para que cuente':'Serie '+nn+'. Toca para marcarla como calentamiento')+'">'+(s.w?'C':nn)+'</button>'+
      '<input class="sin" type="text" inputmode="decimal" enterkeyhint="next" aria-label="Kilos de la serie '+(j+1)+'" placeholder="kg" value="'+(s.kg==null?'':kg(s.kg))+'" data-in="s.'+i+'.'+j+'.kg">'+
      '<input class="sin" type="text" inputmode="numeric" enterkeyhint="done" aria-label="Repeticiones de la serie '+(j+1)+'" placeholder="reps" value="'+(s.r==null?'':s.r)+'" data-in="s.'+i+'.'+j+'.r">'+
      '<button type="button" class="sck" data-a="serieOk" data-v="'+i+'.'+j+'" aria-pressed="'+s.ok+'" aria-label="'+(s.ok?'Serie hecha':'Marcar serie hecha')+'">'+ic('check',20,3)+'</button></div>'; });
    var ult = prev ? 'La última vez: '+prev.map(function(p){ return (p[2]?'C ':'')+(p[0]?kg(p[0])+'×':'')+p[1]; }).join(' · ') : 'Primera vez: un peso con el que hagas '+((D.perfil&&D.perfil.reps)||10)+' cómodas.';
    h+='<section class="ejcard" aria-label="'+e(ej.n)+'"><div class="row sb" style="gap:8px"><button type="button" class="ejtit" data-a="verEj" data-v="'+e(ej.n)+'">'+e(ej.n)+(fichaDe(ej.n)?'<span class="acc" aria-hidden="true">'+ic('play',12,2.6)+'</span>':'')+'</button><button type="button" class="ib" style="margin:0" data-a="ejMenu" data-v="'+i+'" aria-label="Opciones de '+e(ej.n)+'">'+ic('dots',22)+'</button></div>'+
      '<span class="ult">'+ult+'</span>'+
      '<div class="srow cab" aria-hidden="true"><span title="Toca el número para marcar calentamiento">SERIE</span><span>KG</span><span>REPS</span><span></span></div>'+filas+
      '<div class="row" style="gap:8px"><button type="button" class="chip" style="flex:1" data-a="serieMas" data-v="'+i+'">+ Serie</button>'+(ej.s.length>1?'<button type="button" class="chip" style="flex:1" data-a="serieMenos" data-v="'+i+'">− Serie</button>':'')+'</div></section>'; });
  var hechas=0; a.ej.forEach(function(x){ x.s.forEach(function(s){ if(s.ok) hechas++; }); });
  return '<div class="row sb">'+backBtn()+'<span class="lbl" style="flex:1">En curso · '+plural(hechas,'serie hecha','series hechas')+'</span><span class="num" id="crono" style="font-size:26px">'+cronoTxt()+'</span></div>'+
  '<input class="input" style="font-family:var(--display);font-size:28px;height:56px;text-transform:uppercase" type="text" maxlength="30" aria-label="Nombre del entreno" value="'+e(a.nombre)+'" data-in="act.nombre">'+
  (a.ej.length ? h : '<div class="box pad col" style="gap:6px"><strong>Añade tu primer ejercicio.</strong><p class="p2" style="font-size:14px">Busca entre los 345. Si tiene animación, verás cómo se hace.</p></div>')+
  '<button type="button" class="chip" style="min-height:52px;border:var(--lleno)" data-a="buscarEj" data-v="add">+ Añadir ejercicio</button>'+
  cta('TERMINAR ENTRENO','terminarSheet','',ic('check'))+
  '<button type="button" class="link" data-a="descartarSheet">Descartar este entreno</button>'; };
function descansoHTML(){ var a=D.actual; if(!a || !a.desc) return ''; var q=Math.max(0,Math.round((a.desc.fin-ahora())/1000));
  return '<div class="descanso" role="status"><span class="col" style="gap:0"><span class="lbl acc">Descanso</span><span class="num" id="desc" style="font-size:30px">'+mmss(q)+'</span></span><span class="row" style="gap:6px"><button type="button" class="paso sm" data-a="descMas" data-v="-15" aria-label="15 segundos menos">−15</button><button type="button" class="paso sm" data-a="descMas" data-v="15" aria-label="15 segundos más">+15</button><button type="button" class="chip" data-a="descSaltar">Saltar</button></span></div>'; }
function terminarEntreno(){ var a=D.actual; if(!a) return; var m0=marcadorHoy(), cAntes=cumplido(a.fecha||hoy());
  var ej=[]; a.ej.forEach(function(x){ var s=x.s.filter(function(y){ return y.ok; }).map(function(y){ return y.w ? [y.kg||0, y.r||0, 1] : [y.kg||0, y.r||0]; }); if(s.length) ej.push({n:x.n, s:s}); });
  if(!ej.length){ U.sheet={tipo:'sinSeries'}; render(); return; }
  var x={id:a.id, fecha:a.fecha||hoy(), ini:a.ini, fin:ahora(), nombre:(a.nombre||'Entreno').trim()||'Entreno', rutina:a.rutina, ej:ej};
  x.rec = D.entrenos.length ? records(x) : [];
  D.entrenos.push(x); D.actual=null; fijarAreasHoy();
  var t = x.rec.length ? frase('Récord en el gym',{ejercicio:x.rec[0].n.toLowerCase(), marca:(x.rec[0].kg?kg(x.rec[0].kg)+' kg × '+x.rec[0].reps:x.rec[0].reps+' repeticiones')}) : null;
  if(!t) t = D.entrenos.length===1 ? 'Primer entreno apuntado. Lo de hoy queda como tu marca; la próxima vez te pido una más.' : (frase('Tu 1% del gym',{}) || 'Entreno hecho. La próxima, a por una repetición más.');
  x.msg=t; decir(t, hoy());
  guardar(x.fecha.slice(0,7)); evaluarRetos(); guardar(x.fecha.slice(0,7));
  U.sheet=null; U.ultimo=x.id; U.hist=[]; U.pantalla='resumen'; U.prevPant='terminado'; sonar('hecho'); vibrar([30,40,60]); render();
  if(!celebrarSemanaGym(x.fecha) && (x.rec||[]).length){ confeti(60); }
  if(x.fecha===hoy() && !cAntes && cumplido(x.fecha) && !D.vistos['uno-'+x.fecha]){ D.vistos['uno-'+x.fecha]=1; guardar(); celebrarDia(cumplidosHasta(x.fecha), x.fecha); }
  setTimeout(function(){ if(!U.cele) avisarGol(m0); }, 600); }

function celebrarSemanaGym(fecha){ var p=D.perfil, lu=lunesDe(fecha), meta=(p.diasGym||[]).length, nS=entrenosSemana(lu);
  if(!(p.areas.indexOf('entreno')!==-1 && meta && nS>=meta && !D.vistos['semgym-'+lu])) return false; D.vistos['semgym-'+lu]=1; guardar();
  celebrar({tipo:'semana', eyebrow:'Semana de gym', titulo:nS>meta?'¡Más de la meta!':'¡Semana completa!', grande:nS+' DE '+meta, sub:nS>meta?'Has entrenado más días de los que te pusiste.':'Todos los días de gym de esta semana, hechos.', frase:frase2(nS>meta?'Supera la meta':'Cumple la meta de la semana',{hecho:String(nS),meta:String(meta)})||'Semana de gym completa. Así se hace.', toast:'Semana de gym completa: '+nS+' de '+meta+'.'}); return true; }
V.resumen = function(){ var x=D.entrenos.filter(function(y){ return y.id===U.ultimo; })[0]; if(!x){ U.pantalla='gym'; return V.gym(); }
  var v=volumen(x.ej), l='', recN={}; (x.rec||[]).forEach(function(r){ recN[r.n]=r; });
  x.ej.forEach(function(ej){ var b=ej.s.reduce(function(a,s){ return (s[0]>a[0]||(s[0]===a[0]&&s[1]>a[1]))?s:a; });
    l+='<div class="row sb" style="min-height:52px;border-bottom:var(--fina);gap:10px"><span class="col" style="gap:2px;min-width:0"><strong>'+e(ej.n)+'</strong><span style="font-size:13px;color:var(--text2)">'+ej.s.map(function(s){ return (s[2]?'C ':'')+(s[0]?kg(s[0])+'×':'')+s[1]; }).join(' · ')+'</span></span>'+(recN[ej.n]?'<span class="tag" style="font-size:12px">RÉCORD</span>':'<span style="font-size:13px;color:var(--text3);white-space:nowrap">'+plural(ej.s.length,'serie','series')+'</span>')+'</div>'; });
  var coches=v.v/1400, cars=''; if(coches>=1){ for(var i=0;i<Math.floor(Math.min(coches,8));i++) cars+=ic('car',28,2); }
  var recien = U.prevPant==='terminado';
  var esRut = D.rutinas.some(function(r){ return r.id===x.rutina; });
  var p=D.perfil, lu=lunesDe(x.fecha), meta=(p.diasGym||[]).length, nS=entrenosSemana(lu);
  var foto = FOTOS[x.id] ? '<figure class="foto"><img src="'+FOTOS[x.id]+'" alt="Foto del entreno '+e(x.nombre)+'"><figcaption class="row" style="gap:6px"><label class="chip" style="cursor:pointer;position:relative">Cambiar<input type="file" accept="image/*" data-f="foto" data-id="'+x.id+'" style="position:absolute;width:1px;height:1px;opacity:0"></label><button type="button" class="chip" data-a="quitarFoto" data-v="'+x.id+'">Quitar</button></figcaption></figure>'
    : '<label class="foto-add"><span class="foto-ic" aria-hidden="true">'+ic('camara',26,2.2)+'</span><span class="col" style="gap:2px"><strong style="font-size:16px">Añade una foto</strong><span style="font-size:13px;color:var(--text2)">Para recordar este entreno. Sale en tu tarjeta para stories.</span></span><input type="file" accept="image/*" data-f="foto" data-id="'+x.id+'" style="position:absolute;width:1px;height:1px;opacity:0"></label>';
  var semana = (p.areas.indexOf('entreno')!==-1 && meta && lu===lunesDe(hoy())) ? '<div class="box col" style="padding:12px 14px;gap:8px"><div class="row sb"><span class="lbl">Gym esta semana</span><span class="num acc" style="font-size:22px">'+nS+' DE '+meta+'</span></div><div class="mbar"><span class="llena" style="--w:'+Math.min(100,Math.round(nS/meta*100))+'%"></span></div></div>' : '';
  return headLbl((recien?'Entreno terminado · ':'')+fechaLarga(x.fecha))+
  '<h1 class="h1" style="font-size:52px;margin-top:-4px">'+e(x.nombre)+'</h1>'+
  '<section class="score s" aria-label="Resumen del entreno"><div><span class="lbl">Tiempo</span><span class="num">'+dur(x.fin-x.ini).toUpperCase()+'</span></div>'+(v.v?'<div><span class="lbl">Volumen</span><span class="num"><span'+(recien?' data-cuenta="'+Math.round(v.v)+'"':'')+'>'+num(v.v)+'</span> KG</span></div>':'<div><span class="lbl">Repeticiones</span><span class="num">'+x.ej.reduce(function(a,ej){ return a+ej.s.reduce(function(b,s){ return b+s[1]; },0); },0)+'</span></div>')+'<div><span class="lbl">Récords</span><span class="num acc">'+(x.rec||[]).length+'</span></div></section>'+
  foto+semana+kcalBox(kcalEntreno(x))+
  (cars?'<div class="box pad col" style="gap:8px"><div class="cars" aria-hidden="true">'+cars+'</div><span style="font-weight:700">Has movido lo que '+(Math.round(coches*2)/2===1?'pesa un coche':'pesan '+num(Math.round(coches*2)/2,1)+' coches')+'.</span></div>':'')+
  '<div class="col" style="gap:0">'+l+'</div>'+
  (x.msg && recien ? M(e(x.msg)) : '')+
  (!esRut ? '<button type="button" class="chip" style="min-height:52px;border:var(--lleno)" data-a="guardarRutina" data-v="'+x.id+'">Guardar como rutina</button>' : '')+
  '<div class="grid2">'+cta('COMPARTIR','compartir','entreno','','ghost sm')+(recien?cta('HECHO','tab','gym',ic('check'),'sm'):cta('REPETIR','repetir',x.id,ic('play'),'sm'))+'</div>'+
  (!recien?'<button type="button" class="link" data-a="borrarEntreno" data-v="'+x.id+'">Borrar este entreno</button>':''); };
function kcalBox(k){ if(!k) return ''; var pf=D.perfil||{};
  return '<div class="box col" style="padding:12px 14px;gap:6px"><div class="row sb"><span class="lbl">Calorías · estimación</span><span class="num acc" style="font-size:26px">≈ '+num(k)+' KCAL</span></div><span style="font-size:14px;font-weight:700">Equivale a '+grasaTxt(k)+' de grasa.</span>'+
    (pf.peso?'':'<button type="button" class="link" style="align-self:flex-start;min-height:32px;padding:0;font-size:13px;text-align:left" data-a="go" data-v="ajCuerpo">Con un peso medio de 70 kg. Pon el tuyo para que sea exacto</button>')+
    '<details class="rp-donde"><summary>¿De dónde sale?</summary><p>'+KCAL_DONDE+'</p></details></div>'; }
V.story = function(){ var x=D.entrenos.filter(function(y){ return y.id===U.ultimo; })[0]; if(!x) return head('Tarjeta');
  var v=volumen(x.ej), r=(x.rec||[])[0], b=null; x.ej.forEach(function(ej){ ej.s.forEach(function(s){ if(!b || s[0]*s[1]>b.v) b={n:ej.n,kg:s[0],r:s[1],v:s[0]*s[1]}; }); });
  var top = r ? {t:'RÉCORD', x:r.n+' '+(r.kg?kg(r.kg)+' × '+r.reps:r.reps+' reps')} : {t:'MEJOR SERIE', x:b.n+' '+(b.kg?kg(b.kg)+' × '+b.r:b.r+' reps')};
  return headLbl('Tarjeta para stories')+
  '<div class="story'+(FOTOS[x.id]?' confoto':'')+'" role="img" aria-label="Tarjeta del entreno"'+(FOTOS[x.id]?' style="background-image:linear-gradient(180deg,rgba(10,11,12,.35) 0%,rgba(10,11,12,.15) 35%,rgba(10,11,12,.92) 75%),url('+FOTOS[x.id]+')"':'')+'>'+
  '<div class="row sb"><span class="mk">1%</span><span style="font-size:12px;font-weight:800;letter-spacing:.1em;color:#A6AAB2">'+fechaLarga(x.fecha).toUpperCase()+'</span></div>'+
  '<div class="fill"></div><span class="num" style="font-size:'+(x.nombre.length>10?44:64)+'px;line-height:.92;overflow-wrap:anywhere">'+e(x.nombre.toUpperCase())+'</span><span class="num ylw" style="font-size:50px">'+dur(x.fin-x.ini).toUpperCase()+'</span>'+
  '<div style="border-top:1px solid #2C3035;padding-top:10px;display:flex;flex-direction:column;gap:6px"><span style="font-size:12px;font-weight:800;letter-spacing:.1em;color:#A6AAB2">'+top.t+'</span><span class="num" style="font-size:22px">'+e(top.x.toUpperCase())+'</span></div>'+
  '<div style="display:flex;gap:16px">'+(v.v?'<span><span style="display:block;font-size:12px;font-weight:800;letter-spacing:.1em;color:#A6AAB2">VOLUMEN</span><span class="num" style="font-size:22px">'+num(v.v)+' KG</span></span>':'')+'<span><span style="display:block;font-size:12px;font-weight:800;letter-spacing:.1em;color:#A6AAB2">SERIES</span><span class="num ylw" style="font-size:22px">'+v.n+'</span></span></div></div>'+
  '<p class="nota c">Haz una captura de pantalla y súbela a tus stories. Solo con lo que has hecho de verdad.</p>'; };
function actividades(){ return D.entrenos.map(function(x){ return {t:'gym', x:x, f:x.fecha, o:x.ini||0}; }).concat((D.deportes||[]).map(function(x){ return {t:'dep', x:x, f:x.fecha, o:x.t||0}; })).sort(function(a,b){ return a.f<b.f?1:(a.f>b.f?-1:b.o-a.o); }); }
function filaActividad(a, larga){ var x=a.x;
  if(a.t==='dep') return '<button type="button" class="it" data-a="verDeporte" data-v="'+x.id+'">'+(FOTOS[x.id]?'<img class="mini" src="'+FOTOS[x.id]+'" alt="">':'')+'<span class="l">'+e(nombreDeporte(x))+'</span><span class="v">'+fechaCorta(x.fecha)+' · '+hm(x.min)+'</span><span style="color:var(--text3)">'+ic('chev',16)+'</span></button>';
  var v=volumen(x.ej); return '<button type="button" class="it" data-a="verEntreno" data-v="'+x.id+'">'+(FOTOS[x.id]?'<img class="mini" src="'+FOTOS[x.id]+'" alt="">':'')+'<span class="l">'+e(x.nombre)+'</span><span class="v">'+fechaCorta(x.fecha)+' · '+(larga?num(v.v)+' kg':dur(x.fin-x.ini))+'</span><span style="color:var(--text3)">'+ic('chev',16)+'</span></button>'; }
V.historial = function(){ var h='', mes='';
  actividades().forEach(function(a){ var m=a.f.slice(0,7); if(m!==mes){ mes=m; h+=(h?'</div>':'')+'<span class="lbl" style="margin-top:6px">'+cap(MESES[+m.slice(5)-1])+' '+m.slice(0,4)+'</span><div class="list">'; }
    h+=filaActividad(a, true); });
  return head('Entrenos')+(h?h+'</div>':'<p class="nota">Aún no hay entrenos.</p>'); };
V.records = function(){ var h=''; listaRecords().forEach(function(r){ h+='<button type="button" class="it" data-a="verEj" data-v="'+e(r.n)+'"><span class="l">'+e(r.n)+'</span><span class="v">'+(r.kg?kg(r.kg)+' kg × '+r.reps:r.reps+' reps')+' · '+fechaCorta(r.f)+'</span></button>'; });
  return head('Tus marcas')+'<p class="p2" style="margin-top:-6px">Tu mejor serie de cada ejercicio: más kilos, o los mismos kilos con más repeticiones.</p>'+(h?'<div class="list">'+h+'</div>':'<p class="nota">Aún no hay marcas.</p>'); };

/* ---------- buscador de ejercicios ---------- */
function casi(a,b){ if(Math.abs(a.length-b.length)>1) return false; var i=0,j=0,d=0; while(i<a.length&&j<b.length){ if(a[i]===b[j]){i++;j++;continue;} if(++d>1) return false; if(a.length>b.length) i++; else if(b.length>a.length) j++; else {i++;j++;} } return d+(a.length-i)+(b.length-j)<=1; }
function coincide(x,q,fz){ if(!q) return 1; var h=sinTildes(x[0]+' '+x[4]+' '+x[3]+' '+x[2]), ws=h.split(' '), toks=q.split(' '), pts=0;
  for(var i=0;i<toks.length;i++){ var t=toks[i], ok=h.indexOf(t)!==-1; if(!ok && fz && t.length>=4){ for(var k=0;k<ws.length;k++){ if(casi(t,ws[k].slice(0,t.length))||casi(t,ws[k])){ ok=true; break; } } } if(!ok) return 0; pts+= sinTildes(x[0]).indexOf(t)===0 ? 3 : 1; }
  return pts; }
function listaEj(){ var q=sinTildes(U.busca||''), res=[], todos=EJ.concat(D.propios.map(function(n){ return [n,'Propios','—','Propio',n,0]; }));
  var usados={}; D.entrenos.forEach(function(x){ x.ej.forEach(function(ej){ usados[ej.n]=(usados[ej.n]||0)+1; }); });
  var dnd=D.perfil&&D.perfil.donde, bonus=function(x){ if(dnd==='nada') return x[2]==='Peso corporal'?5:(x[2]==='Banda'?1:-3); if(dnd==='casa') return /Mancuernas|Peso corporal|Banda|Kettlebell/.test(x[2])?3:(/Máquina|Polea|Multipower/.test(x[2])?-2:0); return 0; };
  [false,true].forEach(function(fz){ if(res.length) return; todos.forEach(function(x){ if(U.grupo!=='Todos' && x[1]!==U.grupo) return; var c=coincide(x,q,fz); if(c) res.push([c+(x[5]?2:0)+(usados[x[0]]?4:0)+bonus(x),x]); }); });
  res.sort(function(a,b){ return b[0]-a[0] || a[1][0].localeCompare(b[1][0],'es'); });
  var modo=U.modoEj, h='<p class="nota" style="margin:4px 0 2px">'+(res.length===1?'1 ejercicio':res.length+' ejercicios')+(U.grupo!=='Todos'?' de '+U.grupo.toLowerCase():'')+'</p>';
  res.slice(0,60).forEach(function(r){ var x=r[1], an=!!fichaDe(x[0]), ya = modo==='add' && D.actual && D.actual.ej.some(function(y){ return y.n===x[0]; });
    var principal = modo==='ver' ? 'verEj' : 'elegirEj';
    h+='<div class="lrow"><button type="button" class="row" style="flex:1;min-width:0;border:none;background:none;text-align:left;padding:8px 0;gap:12px" data-a="'+principal+'" data-v="'+e(x[0])+'"><span class="thumb'+(an?' anim':'')+'" aria-hidden="true">'+(an?ic('play',20,2.4):ic('person',26,2))+'</span><span class="col" style="gap:3px;min-width:0"><strong style="font-size:15px">'+e(x[0])+'</strong><span style="font-size:13px;color:var(--text2)">'+e(x[3]||x[1])+(x[2]&&x[2]!=='—'?' · '+e(x[2]):'')+(usados[x[0]]?' · <span class="acc" style="font-weight:700">'+plural(usados[x[0]],'vez','veces')+'</span>':'')+'</span></span></button>'+
      (modo==='ver' ? '' : (ya ? '<span class="lbl acc" style="padding:0 6px">Ya está</span>' : '<button type="button" class="sq" aria-label="Añadir '+e(x[0])+'" data-a="elegirEj" data-v="'+e(x[0])+'">'+ic('plus',18,2.6)+'</button>'))+'</div>'; });
  if(res.length>60) h+='<p class="nota c" style="padding:10px 0">Hay más. Escribe un poco más para afinar.</p>';
  if(U.busca && U.busca.trim() && !todos.some(function(x){ return sinTildes(x[0])===q; }))
    h+='<div class="box pad col" style="gap:8px;margin-top:6px">'+(res.length?'':'<strong>No lo encuentro.</strong>')+'<p class="p2" style="font-size:14px">Créalo con ese nombre y queda guardado para la próxima.</p><button type="button" class="chip" style="border:var(--lleno);min-height:44px" data-a="crearEj">Crear «'+e(U.busca.trim())+'»</button></div>';
  return h; }
V.ejercicios = function(){ var f='';
  ['Todos','Piernas','Glúteos','Pecho','Espalda','Hombros','Brazos','Core','Cardio','Cuerpo entero'].concat(D.propios.length?['Propios']:[]).forEach(function(x){ var on=U.grupo===x; f+='<button type="button" class="chip'+(on?' on':'')+'" aria-pressed="'+on+'" data-a="grupoEj" data-v="'+x+'">'+x+'</button>'; });
  var tit = U.modoEj==='add' ? 'Añadir ejercicio' : (U.modoEj==='rutina' ? 'Añadir a la rutina' : 'Ejercicios');
  return head(tit)+
  '<div class="box row" style="min-height:48px;padding:0 14px"><span style="color:var(--text3)">'+ic('search',18)+'</span><input id="in-buscar" type="search" autocomplete="off" aria-label="Buscar ejercicio" placeholder="Buscar: banca, sentadilla, curl…" value="'+e(U.busca||'')+'" data-in="busca" style="flex:1;min-width:0;height:44px;border:none;background:transparent;color:var(--text);font:inherit;font-size:16px"></div>'+
  '<div class="chips" style="flex-wrap:nowrap;overflow-x:auto;padding-bottom:2px">'+f+'</div>'+
  '<div class="col" id="ej-lista" style="gap:0">'+listaEj()+'</div>'; };

/* ---------- ficha de un ejercicio ---------- */
var FIG_ALTAS=['dominada','piernasColgado','fondosParalelas']; /* colgados: más altos para que el cuerpo se vea grande */
V.ejercicio = function(){ var n=U.ejSel, k=fichaDe(n), F=k?FICHAS[k]:null, x=infoEj(n), ses=sesiones(n), b=mejor(n), h='';
  if(F){ var vi=F.vistas[U.vista]||F.vistas[0], seg='', mus='';
    if(F.vistas.length>1) F.vistas.forEach(function(v,i){ var on=v[0]===vi[0]; seg+='<button type="button" class="fv'+(on?' on':'')+'" aria-pressed="'+on+'" data-a="vista" data-v="'+i+'">'+v[1]+'</button>'; });
    F.p.forEach(function(m){ mus+='<span class="mus p">'+m+'</span>'; }); F.s.forEach(function(m){ mus+='<span class="mus s">'+m+'</span>'; });
    h+='<figure class="fig-ej'+(FIG_ALTAS.indexOf(k)!==-1?' alta':'')+(U.pausa?' pausa':'')+'"><div class="fig-svg">'+FIG[k][vi[0]]+'</div>'+(seg?'<div class="fv-wrap">'+seg+'</div>':'')+'<button type="button" class="fig-play" data-a="pausa" aria-label="'+(U.pausa?'Seguir la animación':'Parar la animación')+'">'+(U.pausa?ic('play',16,2.4):ic('pausa',16,3))+'</button><span class="fig-tempo">'+F.tempo+'</span><div class="fig-ley" aria-hidden="true"><span><i class="lp"></i>Principales</span><span><i class="ls"></i>Secundarios</span></div></figure>'+
      '<div class="sec"><span class="lbl">Músculos</span><div class="chips">'+mus+'</div></div>'; }
  else if(x[3]) h+='<p class="p2">'+e(x[3])+(x[2]&&x[2]!=='—'?' · '+e(x[2]):'')+'</p>';
  if(ses.length){ var ult=ses[0], hist='';
    ses.slice(0,6).forEach(function(s){ hist+='<div class="row sb" style="min-height:44px;border-bottom:var(--fina);gap:10px"><span style="font-size:14px;font-weight:700;white-space:nowrap">'+fechaCorta(s.fecha)+'</span><span style="font-size:13px;color:var(--text2);text-align:right">'+s.s.map(function(p){ return (p[2]?'C ':'')+(p[0]?kg(p[0])+'×':'')+p[1]; }).join(' · ')+'</span></div>'; });
    h+=graficaEj(n, ses)+'<div class="sec"><span class="lbl">Tú con este ejercicio</span><section class="score s" aria-label="Tu historial"><div><span class="lbl">Veces</span><span class="num">'+ses.length+'</span></div><div><span class="lbl">Mejor serie</span><span class="num">'+(b[0]?kg(b[0])+'×'+b[1]:b[1])+'</span></div><div><span class="lbl">La próxima</span><span class="num acc">'+(b[0]?kg(b[0])+'×'+(b[1]+1):(b[1]+1))+'</span></div></section><p class="p2" style="font-size:14px">Tu 1%: una repetición más que tu mejor serie, o los mismos kilos con mejor técnica.</p><div class="col" style="gap:0">'+hist+'</div></div>'; }
  else h+='<div class="box pad col" style="gap:4px"><strong>Aún no lo has hecho.</strong><p class="p2" style="font-size:14px">La primera vez, elige un peso con el que hagas 10 repeticiones cómodas. Desde ahí, cada vez, un poco más.</p></div>';
  if(F){ function lista(a){ var r=''; a.forEach(function(t,i){ r+='<div class="row" style="align-items:flex-start;gap:12px"><span class="num" style="width:26px;height:26px;flex-shrink:0;border-radius:6px;background:var(--caja2);display:flex;align-items:center;justify-content:center;font-size:15px">'+(i+1)+'</span><span style="font-size:15px;line-height:1.45">'+t+'</span></div>'; }); return r; }
    var err=''; F.err.forEach(function(t){ err+='<div class="row" style="align-items:flex-start;gap:12px"><span style="color:var(--text2);flex-shrink:0">'+ic('x',18,2.6)+'</span><span style="font-size:15px;line-height:1.45">'+t+'</span></div>'; });
    h+='<div class="sec"><span class="lbl">Preparación</span>'+lista(F.prep)+'</div><div class="sec"><span class="lbl">Cómo se hace</span>'+lista(F.ejec)+'</div><div class="sec"><span class="lbl">Errores comunes</span>'+err+'</div><div class="box pad col" style="gap:4px"><span class="lbl">Seguridad</span><span style="font-size:15px;line-height:1.45">'+F.seg+'</span></div>'; }
  var enAct = D.actual && D.actual.ej.some(function(y){ return y.n===n; });
  return headLbl(F?F.sub:(x[1]||'Ejercicio'))+'<h1 class="h1 m" style="font-size:40px;margin-top:-6px">'+e(n)+'</h1>'+h+
  (D.actual && !enAct ? cta('AÑADIR AL ENTRENO','elegirEjDirecto',n,ic('plus')) : ''); };

function graficaEj(n, ses){ var pts=ses.slice().reverse().map(function(x){ var vs=x.s.filter(function(z){ return !z[2]; }); var best=0, kgb=vs.some(function(z){ return z[0]>0; }); vs.forEach(function(z){ var v = kgb ? e1rm(z[0],z[1]) : z[1]; if(v>best) best=v; }); return {f:x.fecha, v:best, kg:kgb}; }).filter(function(p){ return p.v>0; });
  if(pts.length<2) return pts.length ? '<div class="box row sb" style="padding:12px 14px"><span class="col" style="gap:2px"><span class="lbl">'+(pts[0].kg?'1RM estimado':'Mejor serie')+'</span><span style="font-size:13px;color:var(--text2)">Con dos entrenos más sale tu gráfica</span></span><span class="num acc" style="font-size:28px">'+(pts[0].kg?kg(Math.round(pts[0].v))+' KG':pts[0].v+' REPES')+'</span></div>' : '';
  var W=320,H=110, mn=Math.min.apply(null,pts.map(function(p){return p.v;})), mx=Math.max.apply(null,pts.map(function(p){return p.v;})), rg=Math.max(1,mx-mn), path='', area='', dots='';
  pts.forEach(function(p,i){ var x=8+(i/(pts.length-1))*(W-16), y=H-14-((p.v-mn)/rg)*(H-34); path+=(i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)+' '; if(i===pts.length-1) dots='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="5" fill="var(--acc)" stroke="var(--caja)" stroke-width="2"/>'; });
  area=path+'L'+(W-8)+' '+(H-6)+' L8 '+(H-6)+' Z';
  var u=pts[pts.length-1], p0=pts[0], dif=u.v-p0.v;
  return '<div class="box col" style="padding:12px 14px;gap:6px"><div class="row sb"><span class="lbl">'+(u.kg?'1RM estimado':'Mejor serie')+'</span><span class="num acc" style="font-size:26px">'+(u.kg?kg(Math.round(u.v))+' KG':u.v+' REPES')+'</span></div>'+
    '<svg viewBox="0 0 '+W+' '+H+'" width="100%" height="'+H+'" aria-label="Tu progreso en '+e(n)+'" role="img"><path d="'+area+'" fill="var(--soft)"/><path d="'+path+'" fill="none" stroke="var(--accTxt)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>'+dots+'</svg>'+
    '<span style="font-size:13px;color:var(--text2)">'+(dif>0?'+'+(u.kg?kg(Math.round(dif*10)/10)+' kg':dif+' repeticiones')+' desde el '+fechaCorta(p0.f)+'. Eso es tu 1%.':'Desde el '+fechaCorta(p0.f)+'. A por la siguiente marca.')+'</span></div>'; }
var DISCOS=[25,20,15,10,5,2.5,1.25];
function discos(total, barra){ var lado=(total-barra)/2, r=[]; if(lado<=0) return {r:[], resto:0}; DISCOS.forEach(function(d){ while(lado>=d-1e-9){ r.push(d); lado=Math.round((lado-d)*100)/100; } }); return {r:r, resto:lado}; }
/* ---------- rutinas ---------- */
V.rutinaEd = function(){ var r=U.rutinaEd, l='';
  r.ej.forEach(function(x,i){ l+='<div class="ejcard"><div class="row sb" style="gap:8px"><strong style="font-size:16px">'+e(x.n)+'</strong><button type="button" class="ib" style="margin:0" data-a="rutQuitar" data-v="'+i+'" aria-label="Quitar '+e(x.n)+'">'+ic('trash',20,2.2)+'</button></div>'+
    '<div class="grid2"><div class="col" style="gap:6px;align-items:center"><span class="lbl">Series</span><div class="row" style="gap:6px"><button type="button" class="paso sm" data-a="rutNum" data-v="'+i+'.series.-1" aria-label="Una serie menos">−</button><span class="num" style="font-size:28px;min-width:34px;text-align:center">'+x.series+'</span><button type="button" class="paso sm" data-a="rutNum" data-v="'+i+'.series.1" aria-label="Una serie más">+</button></div></div>'+
    '<div class="col" style="gap:6px;align-items:center"><span class="lbl">Reps</span><div class="row" style="gap:6px"><button type="button" class="paso sm" data-a="rutNum" data-v="'+i+'.reps.-1" aria-label="Una repetición menos">−</button><span class="num" style="font-size:28px;min-width:34px;text-align:center">'+x.reps+'</span><button type="button" class="paso sm" data-a="rutNum" data-v="'+i+'.reps.1" aria-label="Una repetición más">+</button></div></div></div></div>'; });
  return head(r.id?'Editar rutina':'Nueva rutina')+
  '<div class="sec"><label class="lbl" for="in-rutnombre">Nombre</label><input id="in-rutnombre" class="input big" type="text" maxlength="24" placeholder="Pierna, Empuje, Tirón…" value="'+e(r.nombre)+'" data-in="rut.nombre"></div>'+
  (l||'<p class="nota">Añade los ejercicios en el orden en que los haces.</p>')+
  '<button type="button" class="chip" style="min-height:52px;border:var(--lleno)" data-a="buscarEj" data-v="rutina">+ Añadir ejercicio</button>'+
  '<p class="nota">Los kilos los pone la app: al empezar, salen los de la última vez.</p>'+
  cta('GUARDAR RUTINA','guardarRutinaEd','',ic('check'),(r.nombre.trim()&&r.ej.length)?'':'off')+
  (r.id?'<button type="button" class="link" data-a="borrarRutina" data-v="'+r.id+'">Borrar esta rutina</button>':''); };

/* =========================================================
   Parte 5: celebraciones, vibración, récords en directo y fotos
   ========================================================= */
function nivelCele(){ return (D.perfil && D.perfil.celebra) || (U.t && U.t.celebra) || 'normal'; }
var menosMov = false; try{ menosMov = window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(err){}

/* Vibración: Android usa la API normal; en iPhone, Safari no la tiene, así que se usa el toque
   que hace iOS al cambiar un interruptor (iOS 18 o más). */
var HAP=null;
function toqueIOS(){ try{ if(!HAP){ HAP=document.createElement('label'); HAP.setAttribute('aria-hidden','true'); HAP.style.cssText='position:fixed;left:-200px;top:0;width:1px;height:1px;overflow:hidden;opacity:0'; var i=document.createElement('input'); i.type='checkbox'; i.setAttribute('switch',''); i.tabIndex=-1; HAP.appendChild(i); document.body.appendChild(HAP); } HAP.click(); }catch(err){} }
function vibrar(p){ var pat = Array.isArray(p) ? p : [p||15];
  if(nivelCele()==='tranqui') pat=[12];
  try{ if(navigator.userActivation && !navigator.userActivation.hasBeenActive) return; if(navigator.vibrate && navigator.vibrate(pat)) return; }catch(err){}
  var n=Math.max(1,Math.ceil(pat.length/2)), t=0; for(var i=0;i<n;i++){ setTimeout(toqueIOS, t); t+= (pat[i*2]||20)+(pat[i*2+1]||60); } }

/* Confeti */
function confeti(n, origen){ if(menosMov || nivelCele()==='tranqui') return; var capa=document.createElement('div'); capa.className='conf'; capa.setAttribute('aria-hidden','true');
  var cs=getComputedStyle(app), cols=[cs.getPropertyValue('--fd').trim()||'#FFD60A', cs.getPropertyValue('--text').trim()||'#fff', cs.getPropertyValue('--td').trim()||'#FFD60A', '#FF6B6B', '#4ADE80', '#6EA0FF'];
  for(var i=0;i<n;i++){ var p=document.createElement('i'); var x=origen?origen.x:Math.random()*100;
    p.style.left=(origen? x+(Math.random()*40-20) : x)+'%'; p.style.top=(origen?origen.y+'%':'-14px'); p.style.background=cols[i%cols.length];
    p.style.setProperty('--dx',(Math.random()*160-80).toFixed(0)+'px'); p.style.setProperty('--rot',(Math.random()*900-450).toFixed(0)+'deg');
    p.style.animationDelay=(Math.random()*0.25).toFixed(2)+'s'; p.style.animationDuration=(1.2+Math.random()*1.1).toFixed(2)+'s';
    if(i%3===0){ p.style.width='7px'; p.style.height='7px'; p.style.borderRadius='4px'; }
    capa.appendChild(p); }
  app.appendChild(capa); setTimeout(function(){ capa.remove(); }, 2800); }

/* Celebración grande: tarjeta, contador que sube, Míster, confeti, sonido y vibración */
function celebrar(o){
  var nv=nivelCele();
  if(o.tipo==='mini'){ confeti(40); sonar('hecho'); vibrar([20,40,20]); return; }
  if(nv==='tranqui' && o.tipo!=='record'){ if(o.toast) toast(o.toast); vibrar(12); return; }
  if(U.cele){ U.colaCele=U.colaCele||[];
    if(U.colaCele.length>=1 && o.tipo!=='record'){ (U.extraCele=U.extraCele||[]).push(o.toast||o.titulo); return; }
    U.colaCele.push(o); return; }
  U.cele=o; U.ultimaCele=o; o.anim=true; render();
  setTimeout(function(){ confeti(o.tipo==='record'||o.tipo==='hito'||o.tipo==='semana'?110:80); }, 60);
  sonar(o.tipo==='record'?'record':'hecho'); vibrar(o.tipo==='record'?[50,60,50,60,160]:[30,50,30,50,80]);
}
function celeHTML(){ var o=U.cele, anim=o.anim; o.anim=false;
  return '<div class="overlay cele-ov" role="dialog" aria-modal="true" aria-label="'+e(o.titulo)+'"><div class="cele2'+(anim?' anim':'')+'">'+
  '<span class="lbl acc">'+e(o.eyebrow||'')+'</span>'+
  (o.medalla ? '<div class="c">'+medallaSVG(o.medalla,true).replace('width="56" height="56"','width="110" height="110"')+'</div>' : '')+
  (o.grande ? '<span class="cele-grande'+(anim?' anim':'')+'">'+o.grande+'</span>' : '')+
  '<span class="h1" style="font-size:'+(o.titulo.length>18?40:52)+'px;line-height:.95">'+o.titulo+'</span>'+
  (o.sub?'<span style="font-size:15px;color:var(--text2);font-weight:600">'+o.sub+'</span>':'')+
  (o.contador ? '<div class="row sb cele-cnt"><span class="lbl">'+o.contador.l+'</span><span class="num acc" id="cnt" data-de="'+o.contador.de+'" data-a="'+o.contador.a+'" data-suf="'+e(o.contador.suf||'')+'" style="font-size:40px">'+o.contador.pre+o.contador.de+(o.contador.suf||'')+'</span></div>' : '')+
  (o.frase ? M(e(o.frase)) : '')+
  cta(o.boton||'¡VAMOS!','cerrarCele','',ic('check'),'sm')+
  ((o.tipo==='record'||o.tipo==='hito'||o.tipo==='semana') ? '<button type="button" class="link c" style="min-height:40px" data-a="compartir" data-v="cele">Compartir en stories o WhatsApp</button>' : '')+'</div></div>'; }
function contarArriba(){ var el=document.getElementById('cnt'); if(!el || el.dataset.hecho) return; el.dataset.hecho=1;
  if(U.cele && U.cele.contado){ el.textContent=(+el.dataset.a>=0?'+':'')+el.dataset.a+(el.dataset.suf||''); el.classList.add('gol'); return; }
  if(U.cele) U.cele.contado=1; var de=+el.dataset.de, a=+el.dataset.a, suf=el.dataset.suf, pre=a>=0?'+':'', t0=null;
  if(menosMov){ el.textContent=pre+a+suf; return; }
  function paso(ts){ if(!t0) t0=ts; var p=Math.min(1,(ts-t0)/900), ease=1-Math.pow(1-p,3); el.textContent=pre+Math.round(de+(a-de)*ease)+suf; if(p<1) requestAnimationFrame(paso); else { el.classList.add('gol'); } }
  setTimeout(function(){ requestAnimationFrame(paso); }, 250); }
function cerrarCele(){ U.cele=null; var sig=(U.colaCele||[]).shift(); render();
  if(sig){ setTimeout(function(){ celebrar(sig); }, 250); return; }
  if(U.extraCele && U.extraCele.length){ var t='Y además: '+U.extraCele.map(function(x){ return String(x).replace(/\.$/,''); }).join(' · ')+'.'; U.extraCele=[]; decir(t, hoy()); guardar(); toast(t); } }

/* Día cumplido, hitos y goles */
var HITOS = [7,14,21,30,50,70,100,150,200,365];
function celebrarDia(c, f){ var hito = HITOS.indexOf(c)!==-1, doble = c===70;
  var frase = hito ? (frase2(doble?'La curva llega al doble':'Hito de la curva') ) : frase2('Cumple las tres');
  celebrar({tipo: hito?'hito':'dia', eyebrow: hito ? plural(c,'día cumplido','días cumplidos') : 'Día '+diaN(f)+' · tu 1%', titulo: hito ? (doble?'¡Has doblado!':'¡Hito!') : 'Todo hecho.', sub: hito ? 'Eres un '+pct(c)+' % mejor que el día que empezaste.' : 'Tu curva sube un 1%.',
    contador:{l:'Tu curva', de:pct(c-1), a:pct(c), pre:'+', suf:' %'}, frase:frase || 'Tu 1% de hoy, hecho.', toast:'Tu 1% de hoy, hecho. Curva: +'+pct(c)+' %.'}); }
function frase2(sit, extra){ try{ return frase(sit, extra||{}); }catch(err){ return null; } }
function marcadorHoy(){ var f=hoy(); return partidoOn() ? marcador(jugadas(lunesDe(f),f)) : [0,0]; }
function avisarGol(antes){ if(!partidoOn()) return false; var m=marcadorHoy(); if(m[0]>antes[0]){ sonar('gol'); vibrar([25,40,60]); U.golToast=true; toast('¡Gol tuyo! '+m[0]+'–'+m[1]+' contra '+(lunesDe(inicio())===lunesDe(hoy())?'tu yo de antes':'tu semana pasada')+'.'); return true; } return false; }

/* Récords en directo: peso (más kilos que nunca) o repeticiones (más repes que nunca con ese peso o más) */
function seriesPrevias2(n, sinActual, hasta){ var r=[]; D.entrenos.forEach(function(x){ x.ej.forEach(function(ej){ if(ej.n===n) ej.s.forEach(function(s){ if(!s[2]) r.push([s[0]||0, s[1]||0]); }); }); });
  if(!sinActual && D.actual){ D.actual.ej.forEach(function(ej){ if(ej.n!==n) return; ej.s.forEach(function(s){ if(s.ok && !s.w && s!==hasta) r.push([s.kg||0, s.r||0]); }); }); }
  return r; }
function esRecord(kgv, reps, prev){ if(!prev.length || !reps) return null; kgv=kgv||0;
  var maxKg=Math.max.apply(null, prev.map(function(p){ return p[0]; }));
  if(kgv>0 && kgv>maxKg){ var b=prev.filter(function(p){ return p[0]===maxKg; }).reduce(function(a,p){ return p[1]>a[1]?p:a; }); return {tipo:'peso', antes:b}; }
  var comp = prev.filter(function(p){ return kgv>0 ? p[0]>=kgv : p[0]===0; }); if(!comp.length) return null;
  var mr = comp.reduce(function(a,p){ return p[1]>a[1]?p:a; });
  if(reps>mr[1]) return {tipo:'reps', antes:mr};
  if(kgv>0){ var be=prev.reduce(function(a,p){ return e1rm(p[0],p[1])>e1rm(a[0],a[1])?p:a; }); var eA=e1rm(be[0],be[1]), eN=e1rm(kgv,reps); if(eA>0 && eN-eA>=0.5) return {tipo:'fuerza', antes:be, de:eA, a:eN}; }
  return null; }
function txtSerie(k,r){ return k ? kg(k)+' kg × '+r : r+' repeticiones'; }
function recordEnSerie(ej, s){ if(s.w || !seriesPrevias2(ej.n, true).length) return false; var r=esRecord(s.kg, s.r, seriesPrevias2(ej.n, false, s)); if(!r) return false; s.rec=r.tipo;
  var marca=txtSerie(s.kg,s.r), fr=frase2('Récord en el gym',{ejercicio:ej.n.toLowerCase(), marca:marca}) || 'Récord. Esto es tu 1%.';
  var gr = r.tipo==='peso' ? '+'+kg(Math.round((s.kg-r.antes[0])*100)/100)+' KG' : (r.tipo==='reps' ? '+'+(s.r-r.antes[1])+(s.r-r.antes[1]===1?' REPE':' REPES') : '+'+kg(Math.round((r.a-r.de)*10)/10)+' KG');
  celebrar({tipo:'record', eyebrow: ({peso:'Récord de peso',reps:'Récord de repeticiones',fuerza:'Récord de fuerza'})[r.tipo]+' · '+ej.n, grande: gr, titulo:'¡Récord!', sub: r.tipo==='fuerza' ? 'Tu 1RM estimado sube a '+kg(Math.round(r.a*10)/10)+' kg con '+marca+'.' : 'Hoy '+marca+'. Antes, '+txtSerie(r.antes[0],r.antes[1])+'.', frase:fr, boton:'A POR LA SIGUIENTE', share:{tipo:'record', ej:ej.n, marca:marca, gr:gr, eyebrow:({peso:'RÉCORD DE PESO',reps:'RÉCORD DE REPES',fuerza:'RÉCORD DE FUERZA'})[r.tipo]}});
  return true; }
/* récords al guardar el entreno, con la misma regla */
records = function(x){ var out=[]; x.ej.forEach(function(ej){ var prev=[]; D.entrenos.forEach(function(y){ if(y.id===x.id) return; y.ej.forEach(function(e2){ if(e2.n===ej.n) e2.s.forEach(function(s){ if(!s[2]) prev.push([s[0]||0,s[1]||0]); }); }); });
  if(!prev.length) return; var top=null; ej.s.forEach(function(s){ if(s[2]) return; var r=esRecord(s[0],s[1],prev); if(r && (!top || s[0]>top.kg || (s[0]===top.kg && s[1]>top.reps))) top={n:ej.n, kg:s[0], reps:s[1], tipo:r.tipo}; prev.push([s[0]||0,s[1]||0]); });
  if(top) out.push(top); }); return out; };

/* ---------- Fotos del entreno ---------- */
var FOTOS={}, IDB=null;
function idbAbrir(){ return new Promise(function(res){ try{ var r=indexedDB.open('app1pct-fotos',1); r.onupgradeneeded=function(){ r.result.createObjectStore('f'); }; r.onsuccess=function(){ res(r.result); }; r.onerror=function(){ res(null); }; }catch(err){ res(null); } }); }
async function fotosCargar(){ IDB = await idbAbrir(); if(!IDB) return; try{ var rq=IDB.transaction('f','readonly').objectStore('f').openCursor(); rq.onsuccess=function(){ var c=rq.result; if(c){ FOTOS[c.key]=c.value; c.continue(); } else if(Object.keys(FOTOS).length && !escribiendo()) render(); }; }catch(err){} }
function fotoPut(id,url){ FOTOS[id]=url; try{ if(IDB) IDB.transaction('f','readwrite').objectStore('f').put(url,id); }catch(err){} }
function fotoDel(id){ delete FOTOS[id]; try{ if(IDB) IDB.transaction('f','readwrite').objectStore('f').delete(id); }catch(err){} if(NUBE.ok){ NUBE.db.doc(NUBE.base+'/foto-'+id).delete().catch(function(){}); } }
function comprimir(file){ return new Promise(function(res,rej){ var fr=new FileReader(); fr.onerror=rej; fr.onload=function(){ var im=new Image(); im.onerror=rej; im.onload=function(){
    function hacer(max,q){ var w=im.naturalWidth, h=im.naturalHeight, k=Math.min(1,max/Math.max(w,h)); var c=document.createElement('canvas'); c.width=Math.round(w*k); c.height=Math.round(h*k); c.getContext('2d').drawImage(im,0,0,c.width,c.height); return c.toDataURL('image/jpeg',q); }
    var u=hacer(1000,.72); if(u.length>235000) u=hacer(820,.62); if(u.length>235000) u=hacer(640,.55); res(u); }; im.src=fr.result; }; fr.readAsDataURL(file); }); }
async function fotoDeArchivo(id, file){ try{ var url=await comprimir(file); fotoPut(id,url); var x=D.entrenos.filter(function(y){ return y.id===id; })[0]; if(x){ x.foto=true; guardar(x.fecha.slice(0,7)); }
    if(NUBE.ok){ NUBE.db.doc(NUBE.base+'/foto-'+id).set({img:url}).catch(function(){}); }
    render(); confeti(30); vibrar(15); toast('Foto guardada con tu entreno.'); }catch(err){ toast('No he podido leer esa foto. Prueba con otra.'); } }
function fotoPerfil(file){ var fr=new FileReader(); fr.onerror=function(){ toast('No he podido leer esa foto. Prueba con otra.'); };
  fr.onload=function(){ var im=new Image(); im.onerror=function(){ toast('No he podido leer esa foto. Prueba con otra.'); }; im.onload=function(){ var L=Math.min(im.naturalWidth, im.naturalHeight), c=document.createElement('canvas'); c.width=c.height=360;
    c.getContext('2d').drawImage(im, (im.naturalWidth-L)/2, (im.naturalHeight-L)/2, L, L, 0, 0, 360, 360); var url=c.toDataURL('image/jpeg', .8);
    fotoPut('perfil', url); D.perfil.foto=true; guardar(); if(NUBE.ok){ NUBE.db.doc(NUBE.base+'/foto-perfil').set({img:url}).catch(function(){}); } render(); vibrar(15); toast('Foto puesta.'); }; im.src=fr.result; }; fr.readAsDataURL(file); }
async function fotosDeNube(){ if(!NUBE.ok) return; var extra=(D.deportes||[]).filter(function(x){ return x.foto; }).map(function(x){ return x.id; }); if(D.perfil && D.perfil.foto) extra.push('perfil'); for(var j=0;j<extra.length;j++){ if(!FOTOS[extra[j]]){ try{ var s2=await NUBE.db.doc(NUBE.base+'/foto-'+extra[j]).get(); if(s2.exists && s2.data().img) fotoPut(extra[j], s2.data().img); }catch(err){} } } for(var i=0;i<D.entrenos.length;i++){ var x=D.entrenos[i]; if(x.foto && !FOTOS[x.id]){ try{ var s=await NUBE.db.doc(NUBE.base+'/foto-'+x.id).get(); if(s.exists && s.data().img) fotoPut(x.id, s.data().img); }catch(err){} } } if(!escribiendo()) render(); }
/* Números que suben al aparecer (resumen del entreno) */
function ajustarGrande(){ var el=app.querySelector('.cele-grande'); if(!el) return;
  el.style.fontSize=''; var caja=el.parentElement, max=caja.clientWidth - 2;
  if(!max) return; var t=68;
  while(el.scrollWidth>max && t>32){ t-=2; el.style.fontSize=t+'px'; } }
function animarCuentas(){ var els=app.querySelectorAll('[data-cuenta]:not([data-hecho])'); U.contado=U.contado||{};
  [].forEach.call(els,function(el){ el.dataset.hecho=1; var a=+el.dataset.cuenta, suf=el.dataset.suf||'', t0=null; if(menosMov||!a) return;
  var llave=(U.pantalla||'')+'|'+(U.ultimo||'')+'|'+a+suf; if(U.contado[llave]) return; U.contado[llave]=1;
  el.textContent='0'+suf; function paso(ts){ if(!t0) t0=ts; var p=Math.min(1,(ts-t0)/1100), ease=1-Math.pow(1-p,3); el.textContent=num(a*ease)+suf; if(p<1) requestAnimationFrame(paso); } requestAnimationFrame(paso); }); }

/* =========================================================
   Parte 6: lo que hace que te quedes
   - Tu 1% de verdad: las metas suben solas
   - Compromiso de la mañana, niveles y medallas
   - Resumen de la semana (lunes)
   - Dejar algo: contador en vivo, razones, "tengo ganas", hitos
   ========================================================= */

/* ---------- datos viejos al día ---------- */
function ponerAlDia(){ var p=D.perfil; if(!p) return;
  if(!p.metaMovilMin) p.metaMovilMin=(p.metaMovil||3)*60;
  if(!p.metaSuenoMin) p.metaSuenoMin=(p.metaSueno||7)*60;
  if(!p.metaPasos) p.metaPasos=7500;
  if(!p.ajuste) p.ajuste={};
  if(p.dejar && !p.dejar.desde){ p.dejar.desde = p.creado===hoy() ? ahora() : deIso(p.creado).getTime() - 12*3600000; /* desde que empezó */
    p.dejar.hitos=p.dejar.hitos||{}; var dd0=(ahora()-p.dejar.desde)/86400000; HITOS_DEJAR.forEach(function(x){ if(dd0>=x) p.dejar.hitos[x+'@'+p.dejar.desde]=hoy(); }); }
  if(p.dejar && !p.dejar.razones) p.dejar.razones=[];
  if(!D.ganas) D.ganas=0; }

/* ---------- Tu 1% de verdad: metas que suben solas ---------- */
var AJUSTE = {
  movil:{campo:'movilMin', meta:'metaMovilMin', paso:-10, tope:30, ok:function(v,m){ return v<=m; }, txt:function(m){ return 'menos de '+hm(m)+' de móvil'; }, grande:function(p){ return '−'+Math.abs(p)+' MIN'; }},
  sueno:{campo:'suenoMin', meta:'metaSuenoMin', paso:10, tope:540, ok:function(v,m){ return v>=m; }, txt:function(m){ return hm(m)+' de sueño'; }, grande:function(p){ return '+'+p+' MIN'; }},
  moverme:{campo:'pasos', meta:'metaPasos', paso:500, tope:15000, ok:function(v,m){ return v>=m; }, txt:function(m){ return num(m)+' pasos'; }, grande:function(p){ return '+'+num(p)+' PASOS'; }}
};
function ajustarMetas(){ var p=D.perfil, f=hoy(); if(!p) return;
  Object.keys(AJUSTE).forEach(function(k){ if(p.areas.indexOf(k)===-1) return; var A=AJUSTE[k], ult=p.ajuste[k]||p.creado; if(entre(ult,f)<7) return;
    var n=0, ok=0, m=p[A.meta]; for(var i=1;i<=7;i++){ var d=D.dias[sumar(f,-i)]; if(d && d[A.campo]!=null){ n++; if(A.ok(d[A.campo], (d.metas&&d.metas[k==='moverme'?'pasos':k])||m)) ok++; } }
    if(n<5) return;
    p.ajuste[k]=f;
    if(ok>=5){ var nueva = A.paso<0 ? Math.max(A.tope, m+A.paso) : Math.min(A.tope, m+A.paso); if(nueva===m) return; p[A.meta]=nueva; fijarAreasHoy();
      var t='Has cumplido '+ok+' de 7 días. Tu nueva meta: '+A.txt(nueva)+'. Eso es tu 1%.'; decir(t,f);
      setTimeout(function(){ celebrar({tipo:'hito', eyebrow:'Tu 1% sube · '+AREAS[k].n.toLowerCase(), titulo:'¡Meta nueva!', grande:A.grande(A.paso), sub:'Ahora, '+A.txt(nueva)+'.', frase:frase2('Tu 1% se ajusta')||t, toast:'Meta nueva: '+A.txt(nueva)+'.'}); }, 700); }
    else if(ok<=2){ var facil = A.paso<0 ? Math.min(m+15, 8*60) : Math.max(k==='moverme'?3000:300, m-Math.abs(A.paso)); p[A.meta]=facil; fijarAreasHoy();
      decir('Esta semana la meta de '+AREAS[k].c+' se te ha hecho cuesta arriba ('+ok+' de 7). La dejo en '+A.txt(facil)+': mejor constante que perfecto.', f); }
  }); }

/* ---------- niveles ---------- */
var NIVELES = [[0,'Novato'],[3,'En marcha'],[7,'Constante'],[21,'Disciplinado'],[50,'Imparable'],[100,'Máquina'],[200,'Leyenda']];
function nivelDe(c){ var r=NIVELES[0], i; for(i=0;i<NIVELES.length;i++){ if(c>=NIVELES[i][0]) r=NIVELES[i]; } var sig=NIVELES[NIVELES.indexOf(r)+1]||null; return {n:r[1], i:NIVELES.indexOf(r)+1, desde:r[0], sig:sig}; }

/* ---------- medallas: solo por cosas reales ---------- */
function totalKg(){ var v=0; D.entrenos.forEach(function(x){ x.ej.forEach(function(ej){ ej.s.forEach(function(s){ if(!s[2]) v+=(s[0]||0)*(s[1]||0); }); }); }); return v; }
function nRecords(){ var n=0; D.entrenos.forEach(function(x){ n+=(x.rec||[]).length; }); return n; }
function partidosGanados(){ var n=0, l=lunesDe(inicio()); while(sumar(l,6)<hoy()){ var m=marcador(jugadas(l,sumar(l,6))); if(m[0]>m[1]) n++; l=sumar(l,7); } return n; }
function semanasGym(){ var p=D.perfil, meta=(p.diasGym||[]).length, n=0, l=lunesDe(inicio()); if(!meta) return 0; while(l<=hoy()){ if(entrenosSemana(l)>=meta) n++; l=sumar(l,7); } return n; }
function diasSinDejarAhora(){ var p=D.perfil; return (p&&p.dejar&&p.dejar.desde) ? (ahora()-p.dejar.desde)/86400000 : 0; }
function nCompromisos(){ var n=0; for(var k in D.dias){ if(D.dias[k].compromiso) n++; } return n; }
function difSuperado(){ for(var k in D.dias){ var d=D.dias[k]; if(d.dificil && d.h && d.h.minimo) return true; } return false; }
var MEDALLAS = [
  ['primerDia','Primer paso','Cierra tu primer día', function(){ for(var k in D.dias){ if(D.dias[k].cerrado) return true; } return false; }],
  ['uno1','Tu primer 1%','Cumple todo lo de un día', function(c){ return c>=1; }],
  ['uno7','Una semana entera','7 días cumplidos', function(c){ return c>=7; }],
  ['uno21','Hábito hecho','21 días cumplidos', function(c){ return c>=21; }],
  ['uno50','Medio centenar','50 días cumplidos', function(c){ return c>=50; }],
  ['doble','El doble','70 días cumplidos: tu curva pasa del +100 %', function(c){ return c>=70; }],
  ['madruga','Palabra dada','7 compromisos por la mañana', function(){ return nCompromisos()>=7; }],
  ['dificil','Aguantar el tirón','Haz lo mínimo un día difícil', function(){ return difSuperado(); }],
  ['ent1','Primer entreno','Apunta tu primer entreno', function(){ return D.entrenos.length>=1; }],
  ['ent10','Diez de diez','10 entrenos', function(){ return D.entrenos.length>=10; }],
  ['ent50','Cincuenta','50 entrenos', function(){ return D.entrenos.length>=50; }],
  ['rec1','Primer récord','Bate una marca tuya', function(){ return nRecords()>=1; }],
  ['rec10','Coleccionista','10 récords', function(){ return nRecords()>=10; }],
  ['semGym','Semana completa','Todos los días de gym de una semana', function(){ return semanasGym()>=1; }],
  ['semGym4','Un mes sin fallar','4 semanas de gym completas', function(){ return semanasGym()>=4; }],
  ['ton10','10 toneladas','10.000 kg movidos en total', function(){ return totalKg()>=10000; }],
  ['ton100','100 toneladas','100.000 kg movidos en total', function(){ return totalKg()>=100000; }],
  ['partido1','Primer partido ganado','Gánale a tu semana anterior', function(){ return partidosGanados()>=1; }],
  ['partido5','Racha de partidos','5 partidos ganados', function(){ return partidosGanados()>=5; }],
  ['reto1','Reto superado','Supera tu primer reto', function(){ return D.retos.some(function(r){ return r.fin==='ok'; }); }],
  ['reto3','Tres de tres','3 retos superados', function(){ return D.retos.filter(function(r){ return r.fin==='ok'; }).length>=3; }],
  ['dejar7','Una semana sin','7 días seguidos sin lo que dejas', function(){ return diasSinDejarAhora()>=7; }],
  ['dejar30','Un mes sin','30 días seguidos sin lo que dejas', function(){ return diasSinDejarAhora()>=30; }],
  ['ganas10','Más fuerte que las ganas','Supera 10 veces las ganas', function(){ return (D.ganas||0)>=10; }],
  ['foto','Para el recuerdo','Añade una foto a un entreno', function(){ return D.entrenos.some(function(x){ return x.foto; }); }]
];
/* Qué es cada medalla y cuánto te falta (se ve al tocarla) */
var MED_INFO = {
  primerDia:['Al acabar el día, toca «Cerrar el día» y contesta. Con eso ya es tuya.'],
  uno1:['Haz todo lo de tu 1% de un día: cada área marcada como hecha.', function(c){ return [c,1]; }],
  uno7:['Suma 7 días con todo tu 1% hecho. No hace falta que sean seguidos.', function(c){ return [c,7]; }],
  uno21:['21 días con todo hecho. Dicen que es cuando algo empieza a salir solo.', function(c){ return [c,21]; }],
  uno50:['50 días con todo tu 1% hecho, seguidos o no.', function(c){ return [c,50]; }],
  doble:['70 días cumplidos: tu curva pasa del +100 %. Eres el doble que el día que empezaste.', function(c){ return [c,70]; }],
  madruga:['Toca «Hoy voy a por mi 1%» por la mañana, 7 días. Sale en Hoy antes de las 15:00.', function(){ return [nCompromisos(),7]; }],
  dificil:['Un día difícil, activa el modo día difícil y haz lo mínimo. Aguantar también cuenta.'],
  ent1:['Apunta un entreno en la pestaña Gym y termínalo.', function(){ return [D.entrenos.length,1]; }],
  ent10:['Apunta 10 entrenos en la pestaña Gym.', function(){ return [D.entrenos.length,10]; }],
  ent50:['Apunta 50 entrenos en la pestaña Gym.', function(){ return [D.entrenos.length,50]; }],
  rec1:['Supera tu mejor marca en un ejercicio: más kilos, más repeticiones o más fuerza estimada.', function(){ return [nRecords(),1]; }],
  rec10:['Bate 10 marcas tuyas en el gym.', function(){ return [nRecords(),10]; }],
  semGym:['Entrena todos los días de gym que te pusiste en una misma semana.', function(){ return [semanasGym(),1]; }],
  semGym4:['Completa 4 semanas de gym con todos tus días hechos.', function(){ return [semanasGym(),4]; }],
  ton10:['Suma 10.000 kg entre todas tus series (kilos × repeticiones). El calentamiento no cuenta.', function(){ return [Math.round(totalKg()),10000,' kg']; }],
  ton100:['Suma 100.000 kg entre todas tus series.', function(){ return [Math.round(totalKg()),100000,' kg']; }],
  partido1:['Gana un partido de «Tú contra ti»: termina una semana mejor que la anterior.', function(){ return [partidosGanados(),1]; }],
  partido5:['Gana 5 partidos de «Tú contra ti».', function(){ return [partidosGanados(),5]; }],
  reto1:['Termina un reto llegando a los días que pide. Están en la pestaña Retos.', function(){ return [D.retos.filter(function(r){ return r.fin==='ok'; }).length,1]; }],
  reto3:['Supera 3 retos.', function(){ return [D.retos.filter(function(r){ return r.fin==='ok'; }).length,3]; }],
  dejar7:['Aguanta 7 días seguidos sin lo que quieres dejar (área «Dejar algo»).', function(){ return [Math.floor(diasSinDejarAhora()),7,' días']; }],
  dejar30:['Aguanta 30 días seguidos sin lo que quieres dejar.', function(){ return [Math.floor(diasSinDejarAhora()),30,' días']; }],
  ganas10:['Cuando tengas ganas, toca «Tengo ganas», respira y luego «Lo he superado». 10 veces.', function(){ return [D.ganas||0,10]; }],
  foto:['Al terminar un entreno, añade una foto.']
};
function medallaHoja(id){ var m=MEDALLAS.filter(function(x){ return x[0]===id; })[0]; if(!m) return ''; var info=MED_INFO[id]||[m[2]+'.'], on=!!(D.medallas&&D.medallas[id]), c=cumplidosHasta(hoy()), pr=null;
  if(!on && info[1]){ try{ pr=info[1](c); }catch(err){} }
  var est = on ? '<p class="p2" style="font-weight:700">Ganada el '+fechaLarga(D.medallas[id]).toLowerCase()+'.</p>'
    : (pr ? '<div class="col" style="gap:6px"><div class="mbar"><span class="llena" style="--w:'+Math.max(3,Math.min(100,Math.round(Math.min(pr[0],pr[1])/pr[1]*100)))+'%"></span></div><span style="font-size:14px;color:var(--text2)">Llevas '+num(Math.min(pr[0],pr[1]))+(pr[2]||'')+' de '+num(pr[1])+(pr[2]||'')+'.</span></div>' : '<p class="p2">Aún no la tienes.</p>');
  return hoja('Medalla', e(m[1]), '<div class="row" style="justify-content:center">'+medallaSVG(id,on)+'</div><p class="p2">'+info[0]+'</p>'+est); }
var revisandoT=null;
function revisarMedallas(silencio){ if(!D.perfil) return; var c=cumplidosHasta(hoy()), nuevas=[];
  var primeraVez = !D.medallas; if(primeraVez) D.medallas={};
  var quitadas=0; MEDALLAS.forEach(function(m){ if(D.medallas[m[0]]===hoy()){ var sigue=false; try{ sigue=m[3](c); }catch(err){} if(!sigue){ delete D.medallas[m[0]]; quitadas++; } } });
  MEDALLAS.forEach(function(m){ if(D.medallas[m[0]]) return; var ok=false; try{ ok=m[3](c); }catch(err){} if(ok){ D.medallas[m[0]]=hoy(); nuevas.push(m); } });
  var niv=nivelDe(c), subeNivel = D.nivel && niv.i>D.nivel; var habiaNivel=D.nivel; D.nivel=Math.max(D.nivel||0, niv.i);
  if(!nuevas.length && !quitadas && !subeNivel && !primeraVez && habiaNivel) return;
  D.ts=ahora(); try{ localStorage.setItem(KEY, JSON.stringify(D)); }catch(err){} nubeProgramar();
  if(primeraVez || silencio) return;
  if(subeNivel) celebrar({tipo:'hito', eyebrow:'Nivel '+niv.i, titulo:'¡Ahora eres '+niv.n+'!', grande:'NIVEL '+niv.i, sub:plural(c,'día cumplido','días cumplidos')+'.'+(niv.sig?' Próximo nivel, a los '+niv.sig[0]+'.':''), frase:'Esto no lo regala nadie: son tus días.', toast:'Subes a nivel '+niv.i+': '+niv.n+'.'});
  nuevas.forEach(function(m){ celebrar({tipo:'hito', eyebrow:'Medalla nueva', titulo:m[1], medalla:m[0], sub:m[2]+'.', frase:'Una más para la colección.', toast:'Medalla nueva: '+m[1]+'.', boton:'¡VAMOS!'}); });
}
function revisarPronto(){ clearTimeout(revisandoT); revisandoT=setTimeout(function(){ revisarMedallas(); }, 900); }
function medallaSVG(id, on){ var i=MEDALLAS.map(function(m){ return m[0]; }).indexOf(id), n=(i+1);
  return '<span class="medalla'+(on?' on':'')+'" aria-hidden="true"><svg viewBox="0 0 64 64" width="56" height="56"><path d="M20 4h10l2 14h-8zM44 4H34l-2 14h8z" fill="'+(on?'var(--accTxt)':'var(--off)')+'"/><circle cx="32" cy="38" r="20" fill="'+(on?'var(--acc)':'var(--off)')+'"/><circle cx="32" cy="38" r="15" fill="none" stroke="'+(on?'var(--onAcc)':'var(--text3)')+'" stroke-opacity=".35" stroke-width="2"/><text x="32" y="45" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="18" fill="'+(on?'var(--onAcc)':'var(--text3)')+'">'+(on?n:'?')+'</text></svg></span>'; }
V.medallas = function(){ var h='', n=0;
  MEDALLAS.forEach(function(m){ var on=!!(D.medallas&&D.medallas[m[0]]); if(on) n++; h+='<button type="button" class="med-c'+(on?' on':'')+'" data-a="medalla" data-v="'+m[0]+'" aria-label="'+e(m[1])+': '+(on?'ganada':'cómo se consigue')+'">'+medallaSVG(m[0],on)+'<strong>'+m[1]+'</strong><span>'+(on?fechaCorta(D.medallas[m[0]]):m[2])+'</span></button>'; });
  var c=cumplidosHasta(hoy()), nv=nivelDe(c), pr = nv.sig ? Math.round((c-nv.desde)/(nv.sig[0]-nv.desde)*100) : 100;
  var nivTxt = nv.sig ? (c ? 'Llevas '+plural(c,'día cumplido','días cumplidos')+'. ' : 'Aún no has cumplido ningún día entero. ')+'Con '+nv.sig[0]+' eres '+nv.sig[1]+(nv.sig[0]-c===1?': te falta uno.':': te faltan '+(nv.sig[0]-c)+'.') : 'Nivel máximo. Leyenda.';
  return head('Medallas')+'<div class="box col" style="padding:14px;gap:10px;border:var(--lleno)"><div class="row sb" style="align-items:flex-end"><span class="col" style="gap:2px"><span class="lbl acc">Nivel '+nv.i+'</span><strong style="font-size:20px">'+nv.n+'</strong></span><span class="col" style="gap:0;align-items:flex-end"><span class="num" style="font-size:28px;line-height:1">'+n+'<span style="color:var(--text3);font-size:18px">/'+MEDALLAS.length+'</span></span><span class="lbl">medallas</span></span></div><div class="mbar"><span class="llena" style="--w:'+Math.max(pr,4)+'%"></span></div><span style="font-size:13px;color:var(--text2);line-height:1.4">'+nivTxt+' Un día cumplido es hacer todo lo que te toca ese día.</span></div>'+
  '<div class="med-grid">'+h+'</div><p class="nota">Toca una para ver cómo se consigue. Solo se ganan haciendo cosas de verdad, nada al azar.</p>'; };

/* ---------- compromiso de la mañana ---------- */
function compromisoCard(f){ var d=D.dias[f]||{}, hr=new Date(ahora()).getHours(); if(d.compromiso || d.cerrado || d.dificil || hr>=15 || !tareas(f).length || nHechas(f)>0) return '';
  return '<div class="box col compromiso" style="padding:14px;gap:10px"><span class="lbl acc">'+(hr<12?'Buenos días':'Aún estás a tiempo')+'</span><strong style="font-size:18px;line-height:1.25">¿Vas a por tu 1% hoy?</strong><span style="font-size:14px;color:var(--text2)">'+tareas(f).map(function(k){ return tarea(k,f).meta.toLowerCase(); }).join(' · ')+'</span>'+cta('ME COMPROMETO','comprometo','',ic('check'),'sm')+'</div>'; }

/* ---------- resumen de la semana (lunes) ---------- */
function datosSemana(l){ var fin=sumar(l,6), c=0, cer=0, fz=[], kgs=0, recs=0, ent=0, mejor=null;
  for(var i=0;i<7;i++){ var f=sumar(l,i); if(f<inicio()||f>hoy()) continue; if(cumplido(f)) c++; var d=D.dias[f]; if(d&&d.cerrado) cer++; if(d&&d.feliz!=null){ fz.push(d.feliz); if(!mejor||d.feliz>mejor.feliz) mejor={f:f,feliz:d.feliz}; } }
  D.entrenos.forEach(function(x){ if(x.fecha>=l && x.fecha<=fin){ ent++; recs+=(x.rec||[]).length; x.ej.forEach(function(ej){ ej.s.forEach(function(s){ if(!s[2]) kgs+=(s[0]||0)*(s[1]||0); }); }); } });
  var meds=[]; if(D.medallas){ MEDALLAS.forEach(function(m){ var g=D.medallas[m[0]]; if(g && g>=l && g<=fin) meds.push(m[1]); }); }
  var m=marcador(jugadas(l,fin));
  var kcal=kcalEntre(l, fin);
  return {kcal:kcal, c:c, cer:cer, feliz: fz.length ? fz.reduce(function(a,b){return a+b;},0)/fz.length : null, mejor:mejor, kg:kgs, recs:recs, ent:ent, meds:meds, m:m, antes:cumplidosHasta(sumar(l,-1)), despues:cumplidosHasta(fin)}; }
function wrapCard(f){ var l=lunesDe(f), prev=sumar(l,-7); if(prev<lunesDe(inicio()) || D.vistos['wrap-'+prev]) return '';
  var w=datosSemana(prev); if(!w.cer && !w.ent && !w.c) return '';
  return '<button type="button" class="box col wrap-card" style="padding:14px;gap:6px;text-align:left;width:100%" data-a="verWrap" data-v="'+prev+'"><span class="lbl acc">Nuevo · tu semana en resumen</span><strong style="font-size:18px">'+plural(w.c,'día cumplido','días cumplidos')+(w.ent?' · '+plural(w.ent,'entreno','entrenos'):'')+(w.recs?' · '+plural(w.recs,'récord','récords'):'')+'</strong><span style="font-size:13px;color:var(--text2)">Toca para verla. Tiene tarjeta para tus stories.</span></button>'; }
V.wrap = function(){ var l=U.wrapL, w=datosSemana(l), p=U.wrapP||0, slides=[];
  slides.push({e:'Semana del '+fechaCorta(l), g:w.c+'/7', t:'días con tu 1% cumplido', s:'Tu curva pasó de +'+pct(w.antes)+' % a +'+pct(w.despues)+' %.'});
  if(w.ent) slides.push({e:'Gym', g:num(w.kg)+' KG', t:plural(w.ent,'entreno','entrenos')+' esta semana'+(w.kcal?' · ≈ '+num(w.kcal)+' kcal':''), s: w.recs ? plural(w.recs,'récord','récords')+'. '+(w.kg>=1400?(Math.floor(w.kg/1400)===1?'Lo que pesa un coche.':'Lo que pesan '+num(Math.floor(w.kg/1400))+' coches.'):'') : 'Sin récords esta vez. La próxima, una repetición más.'});
  if(partidoOn()) slides.push({e:'Tú contra ti', g:w.m[0]+'–'+w.m[1], t: w.m[0]>w.m[1]?'Partido ganado':(w.m[0]<w.m[1]?'Esta vez ganó tu semana anterior':'Empate'), s:'El lunes empieza otro.'});
  if(w.mejor) slides.push({e:'Tu mejor día', g:cap(DIAS[dsem(w.mejor.f)]), t:'Felicidad '+w.mejor.feliz+' de 10', s: w.feliz!=null ? 'Tu media de la semana: '+num(w.feliz,1)+'.' : ''});
  if(w.meds.length) slides.push({e:'Medallas', g:'+'+w.meds.length, t:w.meds.join(' · '), s:'Ganadas esta semana.'});
  slides.push({e:'Míster', g:w.c>=5?'¡BRUTAL!':(w.c>=3?'BIEN':'OTRA'), t:w.c>=5?'Así se hace una semana.':(w.c>=3?'Semana sólida. A por una más.':'Esta semana costó. La siguiente empieza hoy.'), s:'', ult:true});
  var sl=slides[Math.min(p,slides.length-1)], dots=''; slides.forEach(function(_,i){ dots+='<span class="'+(i<=p?'on':'')+'"></span>'; });
  return '<div class="wrap" data-a="wrapSig" data-v="'+slides.length+'"><div class="wrap-dots">'+dots+'</div><button type="button" class="ib wrap-x" data-a="back" aria-label="Cerrar">'+ic('x',24)+'</button>'+
    '<div class="wrap-c" key="'+p+'"><span class="lbl acc">'+sl.e+'</span><span class="wrap-g">'+sl.g+'</span><strong class="wrap-t">'+sl.t+'</strong>'+(sl.s?'<span class="wrap-s">'+sl.s+'</span>':'')+'</div>'+
    (sl.ult ? '<div class="col" style="gap:10px;width:100%">'+cta('COMPARTIR MI SEMANA','compartir','semana',ic('arrow'))+'<button type="button" class="link" data-a="back">Cerrar</button></div>' : '<span class="nota c" style="width:100%">Toca para seguir</span>')+'</div>'; };

/* ---------- dejar algo: contador en vivo ---------- */
var HITOS_DEJAR=[1,3,7,14,30,60,90,180,365];
function dejarTxt(){ var p=D.perfil; return DEJAR[(p.dejar&&p.dejar.que)||'otra']; }
function contador(ms){ var s=Math.max(0,Math.floor(ms/1000)), d=Math.floor(s/86400), h=Math.floor((s%86400)/3600), m=Math.floor((s%3600)/60); return d+' d '+pad(h)+' h '+pad(m)+' min '+pad(s%60)+' s'; }
function dejarCard(){ var p=D.perfil; if(!p || p.areas.indexOf('dejar')===-1 || !p.dejar) return ''; var ms=ahora()-p.dejar.desde, dd=ms/86400000, sig=HITOS_DEJAR.filter(function(x){ return x>dd; })[0], ant=HITOS_DEJAR.filter(function(x){ return x<=dd; }).pop()||0, pr= sig ? Math.round((dd-ant)/(sig-ant)*100) : 100;
  var eur = eurosDia() ? num(dd*eurosDia())+' €' : '';
  return '<section class="box col dejar-card" style="padding:14px;gap:10px" aria-label="Llevas sin '+e(dejarTxt()[2])+'"><div class="row sb"><span class="lbl acc">'+cap(dejarTxt()[1])+'</span>'+(eur?'<span class="num acc" style="font-size:22px">'+eur+'</span>':'')+'</div><span class="num" id="dejar-cnt" style="font-size:34px">'+contador(ms).toUpperCase()+'</span>'+
    (sig?'<div class="mbar"><span class="llena" style="--w:'+pr+'%"></span></div><span style="font-size:13px;color:var(--text2)">Próximo hito: '+plural(sig,'día','días')+'.'+(p.dejar.mejor?' Tu mejor marca: '+plural(Math.floor(p.dejar.mejor),'día','días')+'.':'')+'</span>':'')+
    '<div class="grid2"><button type="button" class="chip" style="min-height:48px;border:var(--lleno)" data-a="ganas">Tengo ganas</button><button type="button" class="chip" style="min-height:48px" data-a="caida">He caído</button></div></section>'; }
function revisarHitosDejar(){ var p=D.perfil; if(!p || p.areas.indexOf('dejar')===-1 || !p.dejar) return; var dd=(ahora()-p.dejar.desde)/86400000; p.dejar.hitos=p.dejar.hitos||{};
  var nuevos=HITOS_DEJAR.filter(function(x){ return dd>=x && !p.dejar.hitos[x+'@'+p.dejar.desde]; }); if(!nuevos.length) return;
  nuevos.forEach(function(x){ p.dejar.hitos[x+'@'+p.dejar.desde]=hoy(); }); guardar(); var x=nuevos.pop();
  celebrar({tipo:'hito', eyebrow:cap(dejarTxt()[1]), titulo: x===1?'¡Primer día!':'¡'+x+' días!', grande: eurosDia() ? num(dd*eurosDia())+' €' : x+(x===1?' DÍA':' DÍAS'), sub: eurosDia()?'Ahorrados desde que lo dejaste.':'Sin '+dejarTxt()[2]+'. Uno a uno.', frase:'Cada hora cuenta. Sigue así.', toast:plural(x,'día','días')+' '+dejarTxt()[1]+'.'}); }
function ganasHTML(){ var s=U.sheet, q=Math.max(0,Math.round((s.fin-ahora())/1000)), raz=(D.perfil.dejar&&D.perfil.dejar.razones)||[], rt=s.reto?retoPorId(s.reto):null, antojo=rt&&kReto(rt)==='bolleria';
  return '<div class="overlay guia-ov" role="dialog" aria-modal="true" aria-label="Tengo ganas"><div class="sheet'+(s.anim?' anim':'')+'"><div class="row sb"><span class="lbl acc">Aguanta 10 minutos</span><button type="button" class="link" style="min-height:36px" data-a="cerrarSheet">Cerrar</button></div>'+
    '<div class="respira" aria-hidden="true"><span></span></div><p class="c" style="margin:0;font-weight:700">Respira con el círculo: entra el aire cuando crece, sale cuando se encoge.</p>'+
    '<span class="num c" id="ganas-cnt" style="font-size:44px">'+mmss(q)+'</span>'+
    '<p class="p2 c" style="font-size:14px">Las ganas suben y bajan como una ola. En unos minutos suelen bajar. Bebe agua o cambia de sitio.</p>'+
    (raz.length?'<div class="box col" style="padding:12px 14px;gap:6px"><span class="lbl">Por qué lo dejas</span>'+raz.map(function(r){ return '<span style="font-size:15px;font-weight:700">· '+e(r)+'</span>'; }).join('')+'</div>':'')+
    '<div class="grid2">'+cta('LO HE SUPERADO','ganasOk',s.reto||'',ic('check'),'sm')+(antojo?cta('CERRAR','cerrarSheet','','','ghost sm'):(rt?cta('HE RECAÍDO','rRecaida',rt.id,'','ghost sm'):cta('HE CAÍDO','caida','','','ghost sm')))+'</div></div></div>'; }
V.razones = function(){ var r=(D.perfil.dejar&&D.perfil.dejar.razones)||[], h='';
  r.forEach(function(x,i){ h+='<div class="it" style="cursor:default"><span class="l">'+e(x)+'</span><button type="button" class="ib" style="margin:0" data-a="quitarRazon" data-v="'+i+'" aria-label="Quitar">'+ic('x',18)+'</button></div>'; });
  return head('Tus razones')+'<p class="p2" style="margin-top:-6px">Por qué quieres dejarlo. Te las enseño cuando tengas ganas.</p>'+(h?'<div class="list">'+h+'</div>':'')+
    (r.length<5?'<div class="row" style="gap:8px"><input id="in-razon" class="input" type="text" maxlength="60" placeholder="Por ejemplo: subir escaleras sin ahogarme" data-in="razon" style="flex:1"><button type="button" class="paso" data-a="addRazon" aria-label="Añadir">'+ic('plus',22,2.6)+'</button></div>':'')+
    '<p class="nota">Tus razones no salen del móvil.</p>'; };

/* =========================================================
   Parte 7: compartir (tarjetas de imagen), recordatorio diario
   y copias que funcionan también en la app instalada
   ========================================================= */
var EN_CLAUDE = !!(window.claude && typeof window.claude.use==='function');
function colorAcc(){ var c=getComputedStyle(app).getPropertyValue('--fd').trim(); return c||'#FFD60A'; }
function textoAcc(){ var c=getComputedStyle(app).getPropertyValue('--od').trim(); return c||'#101113'; }
async function fuentesListas(){ try{ await Promise.all([document.fonts.load('120px Anton'), document.fonts.load('700 40px Inter'), document.fonts.load('800 40px Inter')]); }catch(err){} }
function ajustarTexto(ctx, t, max, size, fam){ var s=size; ctx.font=s+'px '+fam; while(ctx.measureText(t).width>max && s>30){ s-=4; ctx.font=s+'px '+fam; } return s; }
function cargarImg(src){ return new Promise(function(res){ var i=new Image(); i.onload=function(){ res(i); }; i.onerror=function(){ res(null); }; i.src=src; }); }
async function tarjeta(o){ await fuentesListas(); var W=1080, H=1920, c=document.createElement('canvas'); c.width=W; c.height=H; var x=c.getContext('2d'), acc=colorAcc();
  x.fillStyle='#101113'; x.fillRect(0,0,W,H);
  if(o.foto){ var im=await cargarImg(o.foto); if(im){ var k=Math.max(W/im.width,H/im.height), w=im.width*k, h=im.height*k; x.drawImage(im,(W-w)/2,(H-h)/2,w,h); var g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,'rgba(10,11,12,.45)'); g.addColorStop(.4,'rgba(10,11,12,.15)'); g.addColorStop(.72,'rgba(10,11,12,.9)'); g.addColorStop(1,'rgba(10,11,12,1)'); x.fillStyle=g; x.fillRect(0,0,W,H); } }
  else { var r=x.createRadialGradient(250,300,40,250,300,1300); r.addColorStop(0,acc+'55'); r.addColorStop(1,'rgba(16,17,19,0)'); x.fillStyle=r; x.fillRect(0,0,W,H); }
  /* logo */
  x.fillStyle=acc; x.beginPath(); if(x.roundRect) x.roundRect(80,110,150,150,34); else x.rect(80,110,150,150); x.fill();
  x.fillStyle=textoAcc(); x.font='76px Anton, Impact, sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('1%',155,190);
  x.textAlign='left'; x.textBaseline='alphabetic'; x.fillStyle='#A6AAB2'; x.font='800 34px Inter, sans-serif'; x.fillText((o.fecha||fechaLarga(hoy())).toUpperCase(), 270, 168);
  /* tu foto y tu nombre */
  var nom=(D.perfil&&D.perfil.nombre)||'', av=FOTOS.perfil?await cargarImg(FOTOS.perfil):null, ax=270, ay=232;
  if(av){ x.save(); x.beginPath(); x.arc(ax+30, ay-12, 30, 0, Math.PI*2); x.closePath(); x.clip(); x.drawImage(av, ax, ay-42, 60, 60); x.restore(); x.strokeStyle=acc; x.lineWidth=4; x.beginPath(); x.arc(ax+30, ay-12, 31, 0, Math.PI*2); x.stroke(); ax+=78; }
  if(nom){ x.fillStyle='#F2F2EE'; x.font='800 38px Inter, sans-serif'; x.fillText(nom.slice(0,20), ax, ay); }
  /* medir primero y colocar el bloque justo encima de los números de abajo */
  var bloques=[], fam='Anton, Impact, sans-serif';
  if(o.eyebrow) bloques.push({t:String(o.eyebrow).toUpperCase().slice(0,40), font:'800 40px Inter, sans-serif', h:56, color:acc});
  if(o.grande){ var s=ajustarTexto(x, String(o.grande), W-160, 230, fam); bloques.push({t:String(o.grande), font:s+'px '+fam, h:s*1.0, color:acc}); }
  if(o.titulo){ var s2=ajustarTexto(x, String(o.titulo).toUpperCase(), W-160, 120, fam); bloques.push({t:String(o.titulo).toUpperCase(), font:s2+'px '+fam, h:s2*1.18, color:'#F2F2EE'}); }
  if(o.sub){ x.font='700 40px Inter, sans-serif'; var pal=String(o.sub).split(' '), lin='', ls=[]; pal.forEach(function(w){ var t=lin?lin+' '+w:w; if(x.measureText(t).width>W-160){ ls.push(lin); lin=w; } else lin=t; }); if(lin) ls.push(lin); ls.slice(0,4).forEach(function(l,k){ bloques.push({t:l, font:'700 40px Inter, sans-serif', h:k===0?72:54, color:'#D5D8DD'}); }); }
  var total=bloques.reduce(function(a,b){ return a+b.h; },0), y=H-300-total;
  bloques.forEach(function(b){ y+=b.h; x.font=b.font; x.fillStyle=b.color; x.fillText(b.t, 80, y); });
  if(o.stats && o.stats.length){ var sy=H-170, sx=80, cw=(W-160)/o.stats.length; o.stats.forEach(function(st,i){ x.fillStyle='#A6AAB2'; x.font='800 28px Inter, sans-serif'; x.fillText(st[0].toUpperCase(), sx+i*cw, sy); x.fillStyle=i===o.stats.length-1?acc:'#F2F2EE'; x.font='64px Anton, Impact, sans-serif'; x.fillText(st[1], sx+i*cw, sy+70); }); }
  x.fillStyle='rgba(255,255,255,.12)'; x.fillRect(80,H-250,W-160,2);
  x.fillStyle='#A6AAB2'; x.font='700 28px Inter, sans-serif'; x.textAlign='right'; x.fillText('App 1% · un 1% mejor cada día', W-80, H-40); x.textAlign='left';
  return new Promise(function(res){ c.toBlob(function(b){ res(b); }, 'image/png'); }); }
/* Tarjeta del entreno, estilo A (foto a sangre). fmt 'ig' = stories 1080×1920; 'wa' = WhatsApp 1080×1080 */
function datosEntreno(){ var xx=D.entrenos.filter(function(y){ return y.id===U.ultimo; })[0]; if(!xx) return null; var v=volumen(xx.ej), r=(xx.rec||[])[0];
  return {fecha:fechaLarga(xx.fecha), foto:FOTOS[xx.id], rutina:xx.nombre, tiempo:dur(xx.fin-xx.ini), series:String(v.n), kg:num(v.v)+' kg', rec: r ? ('Récord · '+r.n+' '+(r.kg?kg(r.kg)+' × '+r.reps:r.reps+' reps')) : ''}; }
function pastilla(x, t, px, py, alto, acc){ x.font='800 '+Math.round(alto*.44)+'px Inter, sans-serif'; var w=x.measureText(t).width+alto*.9;
  x.fillStyle=acc; x.beginPath(); if(x.roundRect) x.roundRect(px, py-alto, w, alto, alto/2); else x.rect(px, py-alto, w, alto); x.fill();
  x.fillStyle=textoAcc(); x.textBaseline='middle'; x.fillText(t, px+alto*.45, py-alto/2+2); x.textBaseline='alphabetic'; return w; }
async function tarjetaEntreno(d, fmt){ await fuentesListas(); var W=1080, H=fmt==='wa'?1080:1920, M=fmt==='wa'?72:88, c=document.createElement('canvas'); c.width=W; c.height=H; var x=c.getContext('2d'), acc=colorAcc(), fam='Anton, Impact, sans-serif';
  x.fillStyle='#101113'; x.fillRect(0,0,W,H);
  var im=d.foto?await cargarImg(d.foto):null;
  if(im){ var k=Math.max(W/im.width,H/im.height), w=im.width*k, h=im.height*k; x.drawImage(im,(W-w)/2,(H-h)/2,w,h);
    var g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,'rgba(10,11,12,.5)'); g.addColorStop(.22,'rgba(10,11,12,0)'); g.addColorStop(.48,'rgba(10,11,12,.12)'); g.addColorStop(fmt==='wa'?.7:.78,'rgba(10,11,12,.9)'); g.addColorStop(1,'#0A0B0C'); x.fillStyle=g; x.fillRect(0,0,W,H); }
  else { var r=x.createRadialGradient(W*.2,H*.12,40,W*.2,H*.12,H*.8); r.addColorStop(0,acc+'48'); r.addColorStop(1,'rgba(16,17,19,0)'); x.fillStyle=r; x.fillRect(0,0,W,H); }
  /* arriba: (logo en WhatsApp) + tu foto y tu nombre + fecha */
  var ty=fmt==='wa'?M+40:M+70, ax=M;
  if(fmt==='wa'){ x.fillStyle=acc; x.beginPath(); if(x.roundRect) x.roundRect(M,ty-62,124,124,28); else x.rect(M,ty-62,124,124); x.fill(); x.fillStyle=textoAcc(); x.font='64px '+fam; x.textAlign='center'; x.textBaseline='middle'; x.fillText('1%',M+62,ty+2); x.textAlign='left'; x.textBaseline='alphabetic'; ax=M+150; }
  var nom=(D.perfil&&D.perfil.nombre)||'', av=FOTOS.perfil?await cargarImg(FOTOS.perfil):null, R=34;
  if(av){ x.save(); x.beginPath(); x.arc(ax+R, ty, R, 0, Math.PI*2); x.clip(); x.drawImage(av, ax, ty-R, R*2, R*2); x.restore(); x.strokeStyle=acc; x.lineWidth=5; x.beginPath(); x.arc(ax+R, ty, R+1, 0, Math.PI*2); x.stroke(); ax+=R*2+20; }
  x.fillStyle='#F2F2EE'; x.font='800 40px Inter, sans-serif'; x.textBaseline='middle'; if(nom) x.fillText(nom.slice(0,16), ax, ty+2);
  x.fillStyle='#C9CCD2'; x.font='800 30px Inter, sans-serif'; x.textAlign='right'; x.fillText(d.fecha.toUpperCase(), W-M, ty+2); x.textAlign='left'; x.textBaseline='alphabetic';
  /* abajo, de abajo arriba: marca, cifras, rutina y récord */
  var y=H-M;
  if(fmt==='ig'){ x.fillStyle='#A6AAB2'; x.font='700 30px Inter, sans-serif'; x.fillText('1% · un 1% mejor cada día', M, y); y-=96; }
  var st = fmt==='wa' ? [['Tiempo',d.tiempo],['Series',d.series],['Movidos',d.kg]] : [['Tiempo',d.tiempo],['Movidos',d.kg]], nsz=fmt==='wa'?92:118, cw=(W-2*M)/st.length;
  st.forEach(function(a,i){ x.fillStyle='#A6AAB2'; x.font='800 '+(fmt==='wa'?28:32)+'px Inter, sans-serif'; x.fillText(a[0].toUpperCase(), M+i*cw, y);
    x.fillStyle=i===st.length-1?acc:'#F2F2EE'; var sz=ajustarTexto(x, a[1].toUpperCase(), cw-24, nsz, fam); x.font=sz+'px '+fam; x.fillText(a[1].toUpperCase(), M+i*cw, y-(fmt==='wa'?46:52)); });
  y-=(fmt==='wa'?46:52)+nsz+28;
  var tsz=ajustarTexto(x, d.rutina.toUpperCase(), W-2*M, fmt==='wa'?168:220, fam); x.fillStyle='#F2F2EE'; x.font=tsz+'px '+fam; x.fillText(d.rutina.toUpperCase(), M, y); y-=tsz*.98;
  if(d.rec){ var t=d.rec.toUpperCase(), alto=fmt==='wa'?62:72; x.font='800 '+Math.round(alto*.44)+'px Inter, sans-serif'; while(x.measureText(t).width>W-2*M-alto && t.length>12) t=t.slice(0,-2); pastilla(x, t, M, y, alto, acc); }
  return new Promise(function(res){ c.toBlob(function(b){ res(b); }, 'image/png'); }); }
async function compartirEntreno(){ var d=datosEntreno(); if(!d){ toast('No hay nada que compartir todavía.'); return; }
  U.sheet={tipo:'compEnt', anim:true, ig:null, wa:null}; render(); if(U.sheet) U.sheet.anim=false;
  var bi=await tarjetaEntreno(d,'ig'), bw=await tarjetaEntreno(d,'wa'); if(!U.sheet || U.sheet.tipo!=='compEnt') return;
  U.sheet.bi=bi; U.sheet.bw=bw; U.sheet.ig=URL.createObjectURL(bi); U.sheet.wa=URL.createObjectURL(bw); render(); }
async function compartirBlob(blob, nombre){ var file; try{ file=new File([blob],nombre,{type:'image/png'}); }catch(err){ file=null; }
  if(file && navigator.canShare && navigator.canShare({files:[file]})){ try{ await navigator.share({files:[file]}); return; }catch(err){ if(err && err.name==='AbortError') return; } }
  if(EN_CLAUDE){ try{ var dl=await window.claude.use('downloads'); if(dl){ await dl.save({filename:nombre, data:blob}); toast('Tarjeta guardada.'); return; } }catch(err){ if(err && err.code==='declined') return; } }
  U.sheet={tipo:'imagen', url:URL.createObjectURL(blob), anim:true}; render(); }
function datosTarjeta(tipo){ var p=D.perfil;
  if(tipo==='entreno'){ var xx=D.entrenos.filter(function(y){ return y.id===U.ultimo; })[0]; if(!xx) return null; var v=volumen(xx.ej), r=(xx.rec||[])[0];
    return {fecha:fechaLarga(xx.fecha), foto:FOTOS[xx.id], eyebrow: r?'Récord · '+r.n:'Entreno hecho', titulo:xx.nombre, sub: r ? (r.kg?kg(r.kg)+' kg × '+r.reps:r.reps+' repeticiones')+'. Mejor que nunca.' : plural(v.n,'serie','series')+' y todo apuntado.', stats:[['Tiempo',dur(xx.fin-xx.ini)],['Volumen',num(v.v)+' kg'],['Récords',String((xx.rec||[]).length)]]}; }
  if(tipo==='semana'){ var w=datosSemana(U.wrapL); return {fecha:'Semana del '+fechaCorta(U.wrapL), eyebrow:'Mi semana', grande:w.c+'/7', titulo:'días cumplidos', sub:'Mi curva va en +'+pct(w.despues)+' %.'+(w.ent?' '+plural(w.ent,'entreno','entrenos')+(w.recs?' y '+plural(w.recs,'récord','récords'):'')+'.':''), stats:[['Entrenos',String(w.ent)],['Kg movidos',num(w.kg)],['Partido',w.m[0]+'–'+w.m[1]]]}; }
  if(tipo==='cele' && U.ultimaCele){ var o=U.ultimaCele, sh=o.share||{}; return {eyebrow: sh.eyebrow||o.eyebrow, grande: sh.gr||o.grande, titulo: sh.ej||o.titulo.replace(/[¡!]/g,''), sub: sh.marca ? 'Hoy, '+sh.marca+'.' : (o.sub||''), stats:[['Nivel',nivelDe(cumplidosHasta(hoy())).n],['Curva','+'+pct(cumplidosHasta(hoy()))+' %']]}; }
  return null; }
async function compartir(tipo){ var d=datosTarjeta(tipo); if(!d){ toast('No hay nada que compartir todavía.'); return; }
  toast('Preparando tu tarjeta…'); var blob=await tarjeta(d); if(!blob){ toast('No he podido hacer la tarjeta.'); return; }
  var file; try{ file=new File([blob],'app1-'+tipo+'.png',{type:'image/png'}); }catch(err){ file=null; }
  if(file && navigator.canShare && navigator.canShare({files:[file]})){ try{ await navigator.share({files:[file]}); U.toast=''; render(); return; }catch(err){ if(err && err.name==='AbortError'){ U.toast=''; render(); return; } } }
  if(EN_CLAUDE){ try{ var dl=await window.claude.use('downloads'); if(dl){ await dl.save({filename:'app1-'+tipo+'.png', data:blob}); toast('Tarjeta guardada.'); return; } }catch(err){ if(err && err.code==='declined'){ U.toast=''; render(); return; } } }
  var url=URL.createObjectURL(blob); U.sheet={tipo:'imagen', url:url, anim:true}; U.toast=''; render(); }

/* ---------- archivos: copia y recordatorio ---------- */
async function darArchivo(nombre, texto, tipoMime, directo){ var blob=new Blob([texto],{type:tipoMime});
  if(EN_CLAUDE){ try{ var dl=await window.claude.use('downloads'); if(dl){ await dl.save({filename:nombre, data:texto}); return 'ok'; } }catch(err){ if(err && err.code==='declined') return 'no'; if(err && (err.code==='rejected_extension'||err.code==='extension_not_enabled')) return 'formato'; } return 'nada'; }
  var file; try{ file=new File([blob],nombre,{type:tipoMime}); }catch(err){}
  if(!directo && file && navigator.canShare && navigator.canShare({files:[file]})){ try{ await navigator.share({files:[file]}); return 'ok'; }catch(err){ if(err && err.name==='AbortError') return 'no'; } }
  try{ var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=nombre; document.body.appendChild(a); a.click(); setTimeout(function(){ a.remove(); },1000); return 'ok'; }catch(err){ return 'nada'; } }
descargarCopia = async function(){ var r=await darArchivo('app-1-copia-'+hoy()+'.json', copiaTexto(), 'application/json');
  if(r==='ok'){ D.copia=ahora(); guardar(); render(); toast('Copia lista. Guárdala en Archivos o en iCloud Drive.'); return; }
  if(r==='no'){ toast('Copia cancelada.'); return; }
  U.sheet={tipo:'copiaTexto'}; render(); };
function icsTexto(hora){ var hh=hora.split(':'), f=hoy().replace(/-/g,''), p=D.perfil; p.recUid=p.recUid||('app1-'+uid2()+'@app1');
  var ini=f+'T'+pad(+hh[0])+pad(+hh[1])+'00', st=new Date(ahora()).toISOString().replace(/[-:]/g,'').slice(0,15)+'Z';
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//App 1%//ES','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT','UID:'+p.recUid,'DTSTAMP:'+st,'DTSTART:'+ini,'DURATION:PT5M','RRULE:FREQ=DAILY','SUMMARY:Cierra el día en la App 1% (30 s)','DESCRIPTION:Tu 1% de hoy: ábrela y cierra el día.','BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:Cierra el día en la App 1%','TRIGGER:PT0M','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n')+'\r\n'; }
function uid2(){ return Math.random().toString(36).slice(2,10); }
async function crearRecordatorio(hora){ var hh=(hora||'22:00').split(':'), m=(+hh[0])*60+(+hh[1]||0); m=Math.round(m/30)*30%1440; var h2=pad(Math.floor(m/60))+'-'+pad(m%60), txt=pad(Math.floor(m/60))+':'+pad(m%60);
  if(EN_CLAUDE){ toast('El recordatorio funciona en la app instalada en tu iPhone.'); return; }
  D.perfil.recordatorio=txt; guardar(); U.sheet=null; render();
  toast('Toca «Añadir todo» y el calendario te avisará cada día a las '+txt+'.');
  setTimeout(function(){ location.href='recordatorios/'+h2+'.ics'; }, 400); }
function esInstalada(){ try{ return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true; }catch(err){ return false; } }

/* =========================================================
   Parte 8: el motor de las figuras de los ejercicios.
   Antes cada pieza del muñeco se movía sola, con su propio reloj dentro
   del SVG. En Safari eso se desacompasa: desaparece un brazo o un músculo
   se queda atrás. Aquí se mueve todo desde un único reloj.
   ========================================================= */
var FIG_CACHE={};

function anNums(s){ var p=s.trim().split(/[\s,]+/), r=[], i; for(i=0;i<p.length;i++){ r.push(parseFloat(p[i])); } return r; }
function anTrozos(d){ /* separa un path en letras y números, para poder mezclarlo */
  var t=d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g)||[], letras='', nums=[], i;
  for(i=0;i<t.length;i++){ if(/[a-zA-Z]/.test(t[i])) letras+=t[i]+'|'+nums.length+';'; else nums.push(parseFloat(t[i])); }
  return {l:letras, n:nums, t:t};
}
function anPathMezcla(a,b,k){ /* a y b tienen la misma forma: solo cambian los números */
  var r='', ia=0;
  for(ia=0;ia<a.t.length;ia++){ var x=a.t[ia];
    if(/[a-zA-Z]/.test(x)) r+=x;
    else { var va=parseFloat(x), vb=parseFloat(b.t[ia]); r+=(va+(vb-va)*k).toFixed(2)+' '; } }
  return r;
}
function anBezier(x1,y1,x2,y2,x){ /* el suavizado de las curvas, como en el SVG */
  if(x<=0) return 0; if(x>=1) return 1;
  var t=x, i, f, d;
  for(i=0;i<8;i++){
    var u=1-t, bx=3*u*u*t*x1+3*u*t*t*x2+t*t*t;
    f=bx-x; if(f>-1e-4 && f<1e-4) break;
    d=3*u*u*x1+6*u*t*(x2-x1)+3*t*t*(1-x2);
    if(d<1e-6) break;
    t-=f/d; if(t<0) t=0; if(t>1) t=1;
  }
  var u2=1-t; return 3*u2*u2*t*y1+3*u2*t*t*y2+t*t*t;
}
function anPrepara(tabla){
  return tabla.map(function(o){
    var vs=o.v.split(';'), n=vs.length, kt, ks=null, i;
    if(o.kt){ kt=o.kt.split(';').map(parseFloat); }
    else { kt=[]; for(i=0;i<n;i++) kt.push(n>1?i/(n-1):0); }
    if(o.ks) ks=o.ks.split(';').map(anNums);
    var val;
    if(o.k===2){ val=vs.map(anTrozos); }
    else if(o.k===1){ val=vs.map(parseFloat); }
    else { val=vs.map(anNums); }
    return {i:o.i, k:o.k, t:o.t, a:o.a?1:0, b:o.b||'', d:o.d?1:0, kt:kt, ks:ks, v:val, n:n};
  });
}
function anValor(a, p){
  var kt=a.kt, n=a.n, j=0;
  if(p<=kt[0]) j=0;
  else if(p>=kt[n-1]) j=n-1;
  else { while(j<n-2 && kt[j+1]<=p) j++; }
  if(a.d || j>=n-1 || kt[j+1]===kt[j]) return {j:j, k:0};
  var k=(p-kt[j])/(kt[j+1]-kt[j]);
  if(a.ks && a.ks[j]) k=anBezier(a.ks[j][0],a.ks[j][1],a.ks[j][2],a.ks[j][3],k);
  return {j:j, k:k};
}
function anAplica(els, lista, p){
  var trans={}, i;
  for(i=0;i<lista.length;i++){
    var a=lista[i], el=els[a.i]; if(!el) continue;
    var q=anValor(a,p), j=q.j, k=q.k;
    if(a.k===1){ var o1=a.v[j], o2=(j<a.n-1?a.v[j+1]:o1); el.setAttribute('opacity', (o1+(o2-o1)*k).toFixed(3)); continue; }
    if(a.k===2){ var d1=a.v[j], d2=(j<a.n-1?a.v[j+1]:d1);
      el.setAttribute('d', (k>0 && d1.t.length===d2.t.length) ? anPathMezcla(d1,d2,k) : d1.t.join(' ')); continue; }
    var c1=a.v[j], c2=(j<a.n-1?a.v[j+1]:c1), c=[], z;
    for(z=0;z<c1.length;z++){ var w1=c1[z], w2=(c2[z]==null?w1:c2[z]); c.push(+(w1+(w2-w1)*k).toFixed(3)); }
    var s = a.t==='r' ? 'rotate('+c.join(' ')+')' : (a.t==='s' ? 'scale('+c.join(' ')+')' : 'translate('+c.join(' ')+')');
    if(!trans[a.i] || !a.a) trans[a.i] = (a.a && a.b ? a.b+' ' : '') + s;
    else trans[a.i] += ' '+s;
  }
  for(var id in trans){ if(els[id]) els[id].setAttribute('transform', trans[id]); }
}
var FIG_LOOP=null;
function figuraParar(){ if(FIG_LOOP){ cancelAnimationFrame(FIG_LOOP.raf); FIG_LOOP=null; } }
function figuraArranca(k, vista){
  figuraParar();
  var svg=app.querySelector('.fig-svg svg'); if(!svg || !FIGA[k] || !FIGA[k][vista]) return;
  var clave=k+'/'+vista;
  if(!FIG_CACHE[clave]) FIG_CACHE[clave]=anPrepara(FIGA[k][vista][1]);
  var lista=FIG_CACHE[clave], dur=(FIGA[k][vista][0]||4)*1000, els={}, i;
  var nodos=svg.querySelectorAll('[data-an]');
  for(i=0;i<nodos.length;i++) els[nodos[i].getAttribute('data-an')]=nodos[i];
  var est={raf:0, t0:0, p:0};
  FIG_LOOP=est;
  anAplica(els, lista, 0);
  if(menosMov){ anAplica(els, lista, 0.5); return; }
  function paso(ts){
    if(FIG_LOOP!==est) return;
    if(!svg.isConnected){ figuraParar(); return; }
    if(U.pausa){ est.t0=ts-est.p*dur; est.raf=requestAnimationFrame(paso); return; }
    if(!est.t0) est.t0=ts;
    est.p=((ts-est.t0)%dur)/dur;
    anAplica(els, lista, est.p);
    est.raf=requestAnimationFrame(paso);
  }
  est.raf=requestAnimationFrame(paso);
}
function figuraAlDia(){
  if(U.pantalla!=='ejercicio'){ figuraParar(); return; }
  var k=fichaDe(U.ejSel); if(!k){ figuraParar(); return; }
  var F=FICHAS[k], vi=F.vistas[U.vista]||F.vistas[0];
  figuraArranca(k, vi[0]);
}

/* =========================================================
   Parte 9: estadísticas de los retos.
   Cada reto tiene su tipo (R.k), dos preguntas al empezar (r.cfg)
   y una tarjeta con sus cifras. Reloj solo en los de dejar algo.
   Lo acumulado nunca baja: una recaída solo reinicia el reloj.
   Detalle de lo decidido: claude/estadisticas-retos.md
   ========================================================= */
var DIA_MS = 86400000, HORA_MS = 3600000, MIN_MS = 60000;
var VALK = {redes:1, estudio:1, paginas:1};          // retos que preguntan una cifra al cumplirlos
var EQ_EUR = [[10,'una entrada de cine'],[25,'una cena'],[40,'un mes de gimnasio'],[80,'unas zapatillas'],[150,'unos auriculares buenos'],[300,'un viaje a Roma'],[600,'un móvil nuevo'],[1000,'una semana de vacaciones'],[2000,'un viaje a Japón']];
var TAGS_BUENAS = [['gente','Gente','#5B8CFF'],['logro','Un logro','#FFD60A'],['salud','Salud','#3DDC84'],['placer','Un pequeño placer','#FF7A59'],['aprendi','Algo que aprendí','#B45BFF']];

function eur(x){ return (Math.round(x*100)/100).toFixed(2).replace('.',',')+' €'; }
function eur0(x){ return x>=100 ? num(Math.round(x))+' €' : eur(x); }
function kReto(r){ var R=retoDef(r.n); return (R&&R.k)||''; }
function cfgR(r){ return r.cfg||{}; }
function edadP(){ var e1=D.perfil && +D.perfil.edad; return e1>0 ? e1 : 25; }
function inicioDia(f){ return deIso(f).getTime(); }
function dowIdx(f){ return (deIso(f).getDay()+6)%7; }
function minHora(h){ if(!h) return null; var p=String(h).split(':'), m=(+p[0])*60+(+p[1]||0); if(+p[0]<12) m+=1440; return m; }
function finReto(r){ return sumar(r.ini, r.total-1); }
function limiteReto(r){ var fin=finReto(r), f=hoy(); return f<fin ? f : fin; }

function nombreReto(r){ var c=cfgR(r), k=kReto(r);
  if(k==='otra' && c.nombre) return cap(c.nombre);
  if(k==='estudio' && c.que) return 'Estudiar '+c.que;
  return r.n; }
function sinTxt(nom){ nom=String(nom||'').trim(); if(!nom) return 'sin eso'; return /^sin\b/i.test(nom) ? nom.charAt(0).toLowerCase()+nom.slice(1) : 'sin '+nom; }
function qReto(r, R){ R=R||retoDef(r.n)||{q:''}; var c=cfgR(r);
  switch(R.k){
    case 'otra': return '¿Hoy, '+sinTxt(c.nombre)+'?';
    case 'dormir': return c.hora ? '¿Anoche estabas en la cama antes de las '+c.hora+'?' : R.q;
    case 'levantarse': return c.hora ? '¿Hoy te has levantado a las '+c.hora+'?' : R.q;
    case 'estudio': return '¿Hoy has estudiado'+(c.que?' '+c.que:'')+'?';
    case 'pantalla': return c.meta ? '¿Hoy, menos de '+c.meta+' h de pantalla?' : R.q;
    case 'bebidas': return c.que==='energeticas' ? '¿Hoy, sin energéticas?' : (c.que==='refrescos' ? '¿Hoy, sin refrescos?' : R.q);
  }
  return R.q; }
function retoLibre(r, f){ var c=cfgR(r); return kReto(r)==='estudio' && c.dias && c.dias.length && c.dias.indexOf(dowIdx(f))===-1; }
function desdeReto(r){ return r.desde || inicioDia(r.ini); }

/* ---------- preguntas al empezar (y en "Cambiar") ---------- */
function opsH(lista){ return lista.map(function(x){ return [x,x]; }); }
var PREG_RETO = {
  cama:[{id:'min',t:'¿Cuánto tiempo sueles estar con el móvil en la cama?',ops:[[15,'15 min'],[30,'30 min'],[45,'45 min'],[60,'1 h'],[90,'1 h 30 o más']],def:30},
        {id:'dormir',t:'¿A qué hora te dormías?',op:1,ops:opsH(['23:00','00:00','00:30','01:00','01:30','02:00'])}],
  redes:[{id:'antes',t:'¿Cuánto rato de redes solías pasar por la mañana?',ops:[[15,'15 min'],[30,'30 min'],[45,'45 min'],[60,'1 h'],[90,'1 h 30']],def:30},
         {id:'hacer',t:'¿Qué vas a hacer en ese rato?',op:1,ops:[['desayunar','Desayunar tranquilo'],['entrenar','Entrenar'],['estudiar','Estudiar o leer'],['otra','Otra cosa']]}],
  pasos:[{id:'antes',t:'¿Cuántos pasos hacías normalmente?',ops:[[3000,'3.000'],[5000,'5.000'],[7000,'7.000'],[9000,'9.000']],def:5000},
         {id:'altura',t:'¿Cuánto mides? Para que los km sean reales.',ops:[[155,'155'],[160,'160'],[165,'165'],[170,'170'],[175,'175'],[180,'180'],[185,'185'],[190,'190'],[195,'195+']],def:175,u:'cm'},
         {id:'peso',t:'¿Cuánto pesas? Para las calorías.',op:1,ops:[[55,'55'],[60,'60'],[65,'65'],[70,'70'],[75,'75'],[80,'80'],[85,'85'],[90,'90'],[100,'100'],[110,'110+']],u:'kg'}],
  levantarse:[{id:'hora',t:'¿A qué hora quieres levantarte?',ops:opsH(['06:00','06:30','07:00','07:30','08:00','08:30','09:00']),def:'07:30'},
              {id:'antes',t:'¿Y a qué hora te levantabas antes?',op:1,ops:[[0,'Igual'],[30,'30 min más tarde'],[60,'1 h más tarde'],[90,'1 h 30 más tarde'],[120,'2 h o más']]}],
  mochila:[{id:'eur',t:'¿Cuánto gastas cada vez que comes fuera?',ops:[[5,'5 €'],[8,'8 €'],[10,'10 €'],[12,'12 €'],[15,'15 €'],[20,'20 €']],def:10}],
  bolleria:[{id:'tipo',t:'¿Qué solías pillar?',ops:[['dulce','Bollería'],['frito','Fritos'],['ambos','Las dos']],def:'ambos'},
            {id:'eur',t:'¿Cuánto te costaba cada vez?',ops:[[1,'1 €'],[1.5,'1,50 €'],[2,'2 €'],[3,'3 €'],[4,'4 €']],def:2}],
  alcohol:[{id:'n',t:'¿Cuántas bebidas tomabas a la semana?',ops:[[2,'2'],[4,'4'],[6,'6'],[8,'8'],[12,'12'],[16,'16'],[20,'20'],[30,'30 o más']],def:8},
           {id:'eur',t:'¿Cuánto cuesta cada una de media?',ops:[[1.5,'1,50 €'],[2,'2 €'],[3,'3 €'],[4,'4 €'],[5,'5 €'],[7,'7 €']],def:3}],
  tabaco:[{id:'tipo',t:'¿Qué es lo tuyo?',ops:[['cig','Cigarrillos'],['vaper','Vaper']],def:'cig'},
          {id:'n',t:function(c){ return c.tipo==='vaper'?'¿Cuántos pods a la semana?':'¿Cuántos cigarrillos al día?'; },
           ops:function(c){ return c.tipo==='vaper'?[[1,'1'],[2,'2'],[3,'3'],[5,'5'],[7,'7']]:[[3,'3'],[5,'5'],[10,'10'],[15,'15'],[20,'20'],[30,'30']]; },def:10},
          {id:'precio',t:function(c){ return c.tipo==='vaper'?'¿Cuánto cuesta un pod?':'¿Cuánto cuesta la cajetilla?'; },
           ops:function(c){ return c.tipo==='vaper'?[[2,'2 €'],[3,'3 €'],[4,'4 €'],[5,'5 €']]:[[5,'5 €'],[5.5,'5,50 €'],[6,'6 €'],[6.5,'6,50 €']]; },def:5.5}],
  bebidas:[{id:'que',t:'¿Qué dejas?',ops:[['energeticas','Energéticas'],['refrescos','Refrescos'],['ambos','Las dos']],def:'energeticas'},
           {id:'n',t:'¿Cuántas tomabas a la semana?',ops:[[2,'2'],[4,'4'],[7,'7'],[10,'10'],[14,'14'],[21,'21']],def:7},
           {id:'tam',t:'¿Lata normal o grande?',ops:[['normal','Normal'],['grande','Grande']],def:'normal'},
           {id:'precio',t:'¿Cuánto cuesta cada una?',ops:[[1,'1 €'],[1.5,'1,50 €'],[2,'2 €'],[2.5,'2,50 €'],[3,'3 €']],def:1.5}],
  porros:[{id:'n',t:'¿Cuántos a la semana?',ops:[[1,'1'],[3,'3'],[5,'5'],[7,'7'],[14,'14'],[21,'21 o más']],def:5},
          {id:'mes',t:'¿Cuánto gastabas al mes en eso?',ops:[[10,'10 €'],[20,'20 €'],[40,'40 €'],[60,'60 €'],[100,'100 €'],[150,'150 €']],def:40}],
  apuestas:[{id:'sem',t:'¿Cuánto dinero apostabas a la semana?',ops:[[10,'10 €'],[20,'20 €'],[50,'50 €'],[100,'100 €'],[200,'200 €'],[500,'500 €']],def:50},
            {id:'perd',t:'¿Cuánto calculas que perdías a la semana?',ops:[[5,'5 €'],[10,'10 €'],[25,'25 €'],[50,'50 €'],[100,'100 €'],[250,'250 €']],def:25}],
  unas:[{id:'veces',t:'¿Cuántas veces al día te las muerdes?',op:1,ops:[[3,'Unas 3'],[5,'Unas 5'],[10,'Unas 10'],[20,'Muchas']]},
        {id:'cuando',t:'¿Cuándo te pasa más?',op:1,ops:[['nervios','Con nervios'],['movil','Con el móvil'],['estudiando','Estudiando'],['tele','Viendo algo']]}],
  estudio:[{id:'que',t:'¿Qué quieres estudiar?',tipo:'txt',ph:'Por ejemplo, Matemáticas o inglés'},
           {id:'min',t:'¿Cuántos minutos al día?',ops:[[15,'15'],[25,'25'],[30,'30'],[45,'45'],[60,'1 h'],[90,'1 h 30'],[120,'2 h']],def:30},
           {id:'dias',t:'¿Qué días?',tipo:'dias',def:[0,1,2,3,4]}],
  dormir:[{id:'hora',t:'¿A qué hora quieres estar en la cama?',ops:opsH(['22:30','23:00','23:30','00:00','00:30','01:00']),def:'23:30'},
          {id:'antes',t:'¿A qué hora te acostabas antes?',ops:opsH(['00:00','00:30','01:00','01:30','02:00','02:30']),def:'01:00'}],
  pantalla:[{id:'antes',t:'¿Cuántas horas de pantalla tienes ahora al día? Lo ves en Ajustes del iPhone → Tiempo de uso.',ops:[[3,'3 h'],[4,'4 h'],[5,'5 h'],[6,'6 h'],[7,'7 h'],[8,'8 h'],[10,'10 h']],def:5},
            {id:'meta',t:'¿Por debajo de cuántas horas quieres estar?',ops:[[1,'1 h'],[2,'2 h'],[3,'3 h'],[4,'4 h'],[5,'5 h'],[6,'6 h']],def:3}],
  compras:[{id:'mes',t:'¿Cuánto gastabas al mes en caprichos?',ops:[[20,'20 €'],[50,'50 €'],[100,'100 €'],[150,'150 €'],[200,'200 €'],[300,'300 €'],[500,'500 €']],def:100},
           {id:'donde',t:'¿Dónde caes más?',op:1,ops:[['online','Comprando online'],['tiendas','En tiendas'],['comida','Comida a domicilio'],['todo','De todo un poco']]}],
  otra:[{id:'nombre',t:'¿Cómo se llama tu reto?',tipo:'txt',ph:'Por ejemplo, Sin TikTok'},
        {id:'veces',t:'¿Cuántas veces lo hacías?',ops:[[1,'1 al día'],[3,'3 al día'],[5,'5 al día'],[10,'10 al día'],[2/7,'2 a la semana'],[5/7,'5 a la semana']],def:1},
        {id:'eur',t:'¿Te cuesta dinero cada vez?',ops:[[0,'No'],[1,'1 €'],[2,'2 €'],[3,'3 €'],[5,'5 €'],[10,'10 €']],def:0}]
};
function pregDe(k){ var l=PREG_RETO[k]||[], pf=D.perfil||{}; return l.filter(function(q){ return !((q.id==='altura' && pf.altura) || (q.id==='peso' && k==='pasos' && pf.peso)); }); }
function cfgDefecto(k){ var c={}; pregDe(k).forEach(function(q){ if(q.def!==undefined) c[q.id]= Array.isArray(q.def)? q.def.slice() : q.def; }); return c; }
function retoCfgOk(){ var k=U.rqK, c=U.rq||{}; return pregDe(k).every(function(q){ return q.tipo!=='txt' || String(c[q.id]||'').trim(); }) && !(k==='estudio' && !(c.dias&&c.dias.length)) && !(k==='pantalla' && +c.meta>=+c.antes); }
function retoPreguntas(){ var k=U.rqK, c=U.rq||{}, h='';
  pregDe(k).forEach(function(q){ var t=typeof q.t==='function'?q.t(c):q.t, inner='';
    if(q.tipo==='txt') inner='<input id="in-rq-'+q.id+'" class="input" type="text" maxlength="40" placeholder="'+e(q.ph||'')+'" value="'+e(c[q.id]||'')+'" data-in="rq.'+q.id+'">';
    else if(q.tipo==='dias'){ var d=''; DIAS_C.forEach(function(x,i){ d+=opt('<span class="num" style="font-size:20px">'+x+'</span>', (c.dias||[]).indexOf(i)!==-1,'rqDia',String(i),'c'); }); inner='<div class="grid7" style="gap:6px">'+d+'</div>'; }
    else { var ops=typeof q.ops==='function'?q.ops(c):q.ops, b='';
      ops.forEach(function(o){ b+='<button type="button" class="chip'+(c[q.id]===o[0]?' on':'')+'" aria-pressed="'+(c[q.id]===o[0])+'" data-a="rq" data-v="'+e(q.id+'|'+JSON.stringify(o[0]))+'">'+o[1]+(q.u?' '+q.u:'')+'</button>'; });
      inner='<div class="chips">'+b+'</div>'; }
    h+='<div class="sec rq"><span class="rq-t">'+t+(q.op?' <span class="rq-op">Opcional</span>':'')+'</span>'+inner+'</div>'; });
  if(k==='pantalla' && +c.meta>=+c.antes) h+='<p class="nota">La meta tiene que ser menos de lo que tienes ahora.</p>';
  return h ? '<div class="col rq-caja" style="gap:14px"><span class="lbl acc">Para tus estadísticas</span>'+h+'<p class="nota" style="margin:0">Con esto calculo tus cifras. Lo puedes cambiar cuando quieras.</p></div>' : ''; }
V.retoCfg = function(){ var r=D.retos.filter(function(x){ return x.id===U.retoSel; })[0]; if(!r) return head('Reto');
  return headLbl('Reto · '+e(nombreReto(r).toLowerCase()))+'<h1 class="h1" style="font-size:40px;margin-top:-6px">Tus respuestas.</h1>'+retoPreguntas()+'<div class="fill"></div>'+cta('GUARDAR','retoCfgOk','',ic('check'),retoCfgOk()?'':'off'); };

/* ---------- datos de cada día ---------- */
function valDia(r, f){ var d=D.dias[f], v=d&&d.rv&&d.rv[r.id]; if(v!=null) return v; var c=cfgR(r), k=kReto(r);
  if(k==='redes') return +c.antes||30; if(k==='estudio') return +c.min||30; if(k==='paginas') return 10; return 0; }
function diasSi(r){ var out=[], lim=limiteReto(r); for(var f=r.ini; f<=lim; f=sumar(f,1)) if(okReto(r,f)) out.push(f); return out; }
function rachaReto(r){ var n=0, f=limiteReto(r); if(f<r.ini) return 0; if(!okReto(r,f) && f===hoy()) f=sumar(f,-1);
  while(f>=r.ini){ if(retoLibre(r,f)){ f=sumar(f,-1); continue; } if(okReto(r,f)){ n++; f=sumar(f,-1); } else break; } return n; }
function mejorRachaReto(r){ var m=0, n=0, lim=limiteReto(r); for(var f=r.ini; f<=lim; f=sumar(f,1)){ if(retoLibre(r,f)) continue; if(okReto(r,f)){ n++; if(n>m) m=n; } else if(f!==hoy()) n=0; } return m; }
function evDe(r, tipo, f){ return (r.ev||[]).filter(function(x){ return x.k===tipo && (!f || x.f===f); }); }
function vasosDia(r, f){ return evDe(r,'vaso',f).length; }
function buenasDia(r, f){ var x=evDe(r,'buenas',f)[0]; return x ? x.c : []; }

/* ---------- ritmo de lo que se deja (por día) ---------- */
function vidaAlcoholDia(n){ var g=n*10, L = g<100?0 : (g<200?0.5 : (g<350?1.5:4.5)), R=Math.max(10, 80-edadP()); return L/R*1440; } // minutos de vida por día sin beber
function tasa(r){ var c=cfgR(r), k=kReto(r);
  switch(k){
    case 'alcohol': var na=+c.n||8; return {u:na/7, p:+c.eur||3, un:['bebida','bebidas'], kcalU:150, vidaDia:vidaAlcoholDia(na)};
    case 'tabaco': if(c.tipo==='vaper') return {u:(+c.n||3)/7, p:+c.precio||3, un:['pod','pods']};
      return {u:+c.n||10, p:(+c.precio||5.5)/20, un:['cigarrillo','cigarrillos'], vidaU:20, tiempoU:5};
    case 'bebidas': var lat=c.tam==='grande'?2:1, ref=c.que==='refrescos', amb=c.que==='ambos';
      return {u:(+c.n||7)/7, p:+c.precio||1.5, un:['lata','latas'], azucarU:(ref?35:(amb?31:27))*lat, cafeU: ref?0:(amb?40:80)*lat};
    case 'porros': var np=+c.n||5; return {u:np/7, p:(+c.mes||40)/(np*4.33), un:['porro','porros']};
    case 'apuestas': return {u:0, p:0, eurDia:(+c.sem||50)/7, perdDia:(+c.perd||25)/7};
    case 'unas': return {u:+c.veces||5, p:0, un:['vez','veces']};
    case 'otra': return {u:+c.veces||1, p:+c.eur||0, un:['vez','veces']};
    case 'compras': return {u:0, p:0};
  }
  return null; }
function msLimpio(r){ var ini=desdeReto(r), now=ahora(); if(now<ini) return 0; var fin=inicioDia(sumar(finReto(r),1)); if(r.fin && now>fin) now=fin; return Math.max(0, now-ini); }
function msTotal(r){ return (r.accMs||0)+msLimpio(r); }
function relojTxt(ms){ ms=Math.max(0,ms); var d=Math.floor(ms/DIA_MS), h=Math.floor(ms%DIA_MS/HORA_MS), m=Math.floor(ms%HORA_MS/MIN_MS), sg=Math.floor(ms%MIN_MS/1000); return {d:d,h:h,m:m,s:sg}; }
function durTxt(ms){ var t=relojTxt(ms); return t.d ? t.d+' d '+t.h+' h' : (t.h? t.h+' h '+pad(t.m)+' min' : t.m+' min'); }

/* ---------- equivalencias ---------- */
function temaEdad(){ var ed=edadP(), est=D.perfil && D.perfil.areas.indexOf('estudio')!==-1;
  if(ed<18) return {m:120, s:'tema del insti', p:'temas del insti'};
  if(ed<=25) return {m:180, s:'tema de la uni', p:'temas de la uni'};
  if(est) return {m:180, s:'tema de tu oposición o curso', p:'temas de tu oposición o curso'};
  return {m:120, s:'capítulo de un curso', p:'capítulos de un curso'}; }
function eqLista(valor, lista, fmtFalta){ var on=[], prox=null; lista.forEach(function(q){ if(valor>=q[0]) on.push(q); else if(!prox) prox=q; }); return {on:on, prox:prox, falta: prox ? fmtFalta(prox[0]-valor) : ''}; }

/* ---------- lo que enseña cada reto ---------- */
function statsReto(r){
  var k=kReto(r), c=cfgR(r), s={k:k, cards:[], eq:null, hitos:null, valor:0, reloj:null, dinero:null, calc:'', donde:'', big:null, sinCfg: !r.cfg && pregDe(k).length>0};
  var si=diasSi(r), nSi=si.length, racha=rachaReto(r), mejor=mejorRachaReto(r);
  function card(n,l,o){ o=o||{}; s.cards.push({n:n, l:l, acc:o.acc, est:o.est}); }
  var T=tasa(r);
  if(T){ // dejar algo: reloj
    var ms=msLimpio(r), tot=msTotal(r), dias=tot/DIA_MS;
    s.reloj=ms; s.mejor=Math.max(r.mejorMs||0, ms);
    if(k==='compras'){ var ev=evDe(r,'compra'), sum=0; ev.forEach(function(x){ sum+=+x.eur||0; }); s.dinero=sum; s.dineroL='Te has ahorrado';
      card(ev.length, ev.length===1?'capricho que no te has comprado':'caprichos que no te has comprado');
      var may=ev.slice().sort(function(a,b){ return (b.eur||0)-(a.eur||0); })[0];
      if(may) card(eur0(+may.eur), 'el mayor: '+e(may.que||'un capricho'));
      card(durTxt(s.mejor), 'tu mejor marca');
      s.lista=ev.slice(-5).reverse(); s.calc=eur0(+c.mes||100)+' al mes en caprichos';
      s.donde='El dinero es la suma real de lo que has evitado: cada vez que tocas «Lo he evitado» apuntas qué era y cuánto costaba.';
    } else if(k==='apuestas'){ s.dinero=dias*T.eurDia; s.dineroL='Dinero que no has apostado';
      card(eur0(dias*T.perdDia), 'que no has perdido', {acc:1, est:1}); card(Math.floor(dias), Math.floor(dias)===1?'día sin apostar':'días sin apostar'); card(durTxt(s.mejor), 'tu mejor marca');
      s.calc=eur0(+c.sem||50)+' apostados a la semana · '+eur0(+c.perd||25)+' perdidos';
      s.donde='El dinero sale de lo que me dijiste que apostabas y perdías cada semana, repartido por días. Es tu dinero: muévelo a un ahorro si quieres verlo crecer.';
    } else {
      var und=dias*T.u, unN=Math.floor(und);
      if(T.p>0){ s.dinero=und*T.p; s.dineroL='Ahorrado'; }
      card(unN, (k==='unas'||k==='otra') ? (unN===1?'vez que no lo has hecho':'veces que no lo has hecho') : (T.un[unN===1?0:1]+' que no '+(k==='alcohol'?'has tomado':(k==='bebidas'?'te has tomado':(k==='porros'?'has fumado':(T.un[0]==='pod'?'has usado':'has fumado'))))));
      if(T.vidaU) card(hm(und*T.vidaU), 'de vida ganada', {acc:1, est:1});
      if(k==='alcohol'){ if(T.vidaDia>0) card(hm(dias*T.vidaDia), 'de vida ganada', {acc:1, est:1}); card(num(und*T.kcalU), 'kcal que no has tomado', {est:1}); card(Math.floor(dias), Math.floor(dias)===1?'noche sin alcohol':'noches sin alcohol'); }
      if(T.tiempoU) card(hm(und*T.tiempoU), 'que ya no pasas fumando');
      if(k==='bebidas'){ card(num(und*T.azucarU/4), 'terrones de azúcar que no te has tomado', {est:1}); if(T.cafeU) card(num(und*T.cafeU/1000,1)+' g', 'de cafeína menos', {est:1}); }
      card(durTxt(s.mejor), 'tu mejor marca');
      if(k==='alcohol') s.calc=(+c.n||8)+' bebidas a la semana · '+eur(+c.eur||3)+' cada una';
      if(k==='tabaco') s.calc= c.tipo==='vaper' ? (+c.n||3)+' pods a la semana · '+eur(+c.precio||3)+' el pod' : (+c.n||10)+' al día · '+eur(+c.precio||5.5)+' la cajetilla';
      if(k==='bebidas') s.calc=(+c.n||7)+' a la semana · lata '+(c.tam==='grande'?'grande':'normal')+' · '+eur(+c.precio||1.5);
      if(k==='porros') s.calc=(+c.n||5)+' a la semana · '+eur0(+c.mes||40)+' al mes';
      if(k==='unas') s.calc=c.veces ? 'unas '+c.veces+' veces al día' : 'unas 5 veces al día (cámbialo si quieres)';
      if(k==='otra') s.calc=(+c.veces>=1 ? (+c.veces)+' al día' : Math.round((+c.veces||0)*7)+' a la semana')+(+c.eur?' · '+eur(+c.eur)+' cada vez':'');
      if(k==='tabaco') s.donde= c.tipo==='vaper' ? 'Los pods y el dinero salen de lo que me dijiste. Para el vaper no hay una cifra fiable de vida, así que no la pongo.' : 'Vida ganada: cada cigarrillo que no fumas son unos 20 minutos de vida (estudio de la UCL en la revista Addiction, 2024). Es una estimación. El dinero y los cigarrillos salen de lo que me dijiste.';
      if(k==='alcohol') s.donde= T.vidaDia>0 ? 'Vida ganada: un estudio de The Lancet (2018, casi 600.000 personas) vio que beber más de 100 g de alcohol a la semana resta esperanza de vida (de 6 meses a 5 años según la cantidad). Lo reparto según tu edad y lo que bebías. Es una estimación. Una bebida son unos 10 g de alcohol.' : 'Con lo que bebías, el estudio de The Lancet (2018) no da una cifra de vida, así que no la pongo. El resto sale de lo que me dijiste. Las calorías son aproximadas (unas 150 por bebida).';
      if(k==='bebidas') s.donde='Azúcar y cafeína son aproximados: unos 27 g de azúcar y 80 mg de cafeína por energética normal, y unos 35 g de azúcar por refresco. Un terrón son 4 g.';
    }
    if(s.dinero!=null && k!=='compras') s.eq=eqLista(s.dinero, EQ_EUR, function(x){ return 'te faltan '+eur(x); });
    if(k==='compras') s.eq=eqLista(s.dinero, EQ_EUR, function(x){ return 'te faltan '+eur(x); });
    s.hitos={valor:ms/DIA_MS, lista:[[1,'1 día'],[3,'3 días'],[7,'1 semana'],[14,'2 semanas'],[21,'3 semanas'],[30,'1 mes'],[60,'2 meses'],[90,'3 meses'],[180,'6 meses'],[365,'1 año']], falta:function(x){ return 'te faltan '+durTxt(x*DIA_MS); }, clave:'d'};
    return s; }

  switch(k){
    case 'cama': var mc=+c.min||30, sue=nSi*mc;
      s.big={v:hm(sue), l:'Sueño ganado'}; card(racha, racha===1?'noche seguida':'noches seguidas'); card(nSi, nSi===1?'noche cumplida':'noches cumplidas'); card(mejor, 'mejor racha');
      s.eq=eqLista(sue, [[90,'Una peli'],[180,'Dos pelis'],[480,'Una noche entera de sueño'],[960,'Dos noches enteras']], function(x){ return 'te faltan '+hm(x); });
      s.hitos={valor:sue, lista:[[60,'1 h de sueño'],[180,'3 h de sueño'],[300,'5 h de sueño'],[480,'Una noche entera'],[900,'Casi dos noches']], falta:function(x){ return 'te faltan '+hm(x); }};
      s.calc=(mc>=90?'1 h 30 o más':hm(mc))+' con el móvil en la cama cada noche'; break;
    case 'redes': var mr=0, mejorM=0; si.forEach(function(f){ var v=valDia(r,f); mr+=v; if(v>mejorM) mejorM=v; }); var te=temaEdad();
      s.big={v:hm(mr), l:'Minutos de vida ganados'}; card(nSi, nSi===1?'mañana sin redes':'mañanas sin redes'); card(mejorM?hm(mejorM):'—', 'tu mejor mañana'); card(num(mr/te.m,1), 'te da para '+te.p);
      s.eq=eqLista(mr, [[te.m,'Un '+te.s],[te.m*2,'Dos '+te.p],[te.m*5,'Cinco '+te.p],[te.m*10,'Diez '+te.p]], function(x){ return 'te faltan '+hm(x); });
      s.hitos={valor:mr, lista:[[60,'1 h ganada'],[180,'3 h ganadas'],[300,'5 h ganadas'],[600,'10 h ganadas'],[1200,'20 h ganadas']], falta:function(x){ return 'te faltan '+hm(x); }};
      s.calc=hm(+c.antes||30)+' de redes por la mañana antes del reto'; s.donde='Suma los minutos que me dices cada día que has estado sin redes ni móvil desde que te levantas. Un '+te.s+' son unas '+hm(te.m)+' de estudio.'; break;
    case 'gym': var ents=D.entrenos.filter(function(x){ return x.fecha>=r.ini && x.fecha<=limiteReto(r); }), kg=0;
      ents.forEach(function(x){ try{ kg+=volumen(x.ej||[]).v; }catch(err){} });
      var sem={}; ents.forEach(function(x){ if(x.fecha>sumar(hoy(),-7)) sem[x.fecha]=1; }); var ns=Object.keys(sem).length;
      var ult=D.entrenos.length ? D.entrenos[D.entrenos.length-1].fecha : null;
      s.big={v:ns+'/4', l:'Esta semana'}; card(ents.length, ents.length===1?'entreno en el reto':'entrenos en el reto'); card(num(kg)+' kg', 'movidos en el reto');
      card(ult ? (entre(ult,hoy())===0?'Hoy':(entre(ult,hoy())===1?'Ayer':'Hace '+entre(ult,hoy())+' días')) : '—', 'tu último entreno');
      s.hitos={valor:ents.length, lista:[[1,'1 entreno'],[4,'4 entrenos'],[8,'8 entrenos'],[12,'12 entrenos']], falta:function(x){ return 'te faltan '+x; }}; break;
    case 'pasos': var tp=0, mejorP=0, nd=0; for(var f=r.ini; f<=limiteReto(r); f=sumar(f,1)){ var pd=(D.dias[f]||{}).pasos; if(pd){ tp+=pd; nd++; if(pd>mejorP) mejorP=pd; } }
      var pf=D.perfil||{}, alt=+c.altura||+pf.altura||175, peso=+c.peso||+pf.peso||70, km=tp*alt*0.415/100000, kcal=0.5*peso*km;
      s.big={v:num(km,1)+' km', l:'Has andado'}; card(num(tp), 'pasos en el reto'); card(num(kcal), 'kcal quemadas andando', {acc:1, est:1}); card(num(kcal/7.7)+' g', 'de grasa, en equivalencia', {est:1});
      card(mejorP?num(mejorP):'—', 'tu mejor día'); if(nd && c.antes) card((tp/nd-c.antes>=0?'+':'')+num(tp/nd-c.antes), 'pasos al día frente a antes');
      s.eq=eqLista(km, [[5,'Una carrera de 5 km'],[10,'Un 10K'],[21.1,'Una media maratón'],[42.2,'Una maratón'],[70,'De Madrid a Toledo'],[355,'De Madrid a Valencia']], function(x){ return 'te faltan '+num(x,1)+' km'; });
      s.hitos={valor:km, lista:[[5,'5 km'],[10,'10 km'],[21.1,'Media maratón'],[42.2,'Una maratón'],[70,'70 km']], falta:function(x){ return 'te faltan '+num(x,1)+' km'; }};
      s.calc=num(alt)+' cm'+((c.peso||pf.peso)?' · '+num(peso,1)+' kg':' · peso medio (ponlo para afinar)')+' · antes '+num(+c.antes||5000)+' pasos';
      s.donde='Km: largo del paso ≈ altura × 0,415. Calorías: unas 0,5 kcal por kilo de peso y km andado (lo que gastas de más por andar). Grasa: 7.700 kcal ≈ 1 kg. Son estimaciones.'; break;
    case 'levantarse': var ga=(+c.antes||0)*nSi;
      s.big={v:String(nSi), l:nSi===1?'Día a tu hora':'Días a tu hora'}; card(racha, racha===1?'día seguido':'días seguidos'); card(mejor,'mejor racha'); if(ga) card(hm(ga), 'de mañana ganadas', {acc:1});
      s.hitos={valor:nSi, lista:[[3,'3 madrugones'],[5,'5 madrugones'],[7,'7 madrugones'],[14,'14 madrugones']], falta:function(x){ return 'te faltan '+x; }};
      s.calc='a las '+(c.hora||'07:30')+(c.antes?' · antes, '+hm(+c.antes)+' más tarde':''); break;
    case 'paginas': var pg=0, mejorPg=0; si.forEach(function(f){ var v=valDia(r,f); pg+=v; if(v>mejorPg) mejorPg=v; });
      s.big={v:num(pg), l:'Páginas leídas'}; card(nSi, nSi===1?'día leyendo':'días leyendo'); card(racha, racha===1?'día seguido':'días seguidos'); card(mejorPg||'—','tu mejor día (páginas)');
      s.hitos={valor:pg, lista:[[50,'50 páginas'],[100,'100 páginas'],[250,'250 páginas'],[500,'500 páginas'],[1000,'1.000 páginas']], falta:function(x){ return 'te faltan '+num(x); }}; break;
    case 'mochila': var em=(+c.eur||10)*nSi;
      s.dinero=em; s.dineroL='Ahorrado'; card(nSi, nSi===1?'vez que saliste preparado':'veces que saliste preparado'); card(racha, racha===1?'día seguido':'días seguidos');
      s.eq=eqLista(em, EQ_EUR, function(x){ return 'te faltan '+eur(x); }); s.hitos={valor:nSi, lista:[[3,'3 veces'],[5,'5 veces'],[7,'7 veces']], falta:function(x){ return 'te faltan '+x; }};
      s.calc=eur0(+c.eur||10)+' cada vez que comías fuera'; break;
    case 'bolleria': var an=evDe(r,'antojo').length, kc=c.tipo==='frito'?300:(c.tipo==='dulce'?350:325), eb=an*(+c.eur||2);
      s.big={v:String(an), l:an===1?'Antojo evitado':'Antojos evitados'}; card(num(an*kc), 'kcal que te has ahorrado', {acc:1, est:1}); card(num(an*kc/7.7)+' g', 'de grasa, en equivalencia', {est:1}); card(eur0(eb), 'que no te has gastado'); card(nSi, nSi===1?'día cumplido':'días cumplidos');
      s.hitos={valor:an, lista:[[1,'Primer antojo'],[5,'5 antojos'],[10,'10 antojos'],[25,'25 antojos'],[50,'50 antojos']], falta:function(x){ return 'te faltan '+x; }};
      s.calc=({dulce:'bollería',frito:'fritos',ambos:'bollería y fritos'}[c.tipo||'ambos'])+' · '+eur(+c.eur||2)+' cada vez';
      s.donde='Cada antojo evitado son unas '+kc+' kcal (una ración media de '+({dulce:'bollería',frito:'fritos',ambos:'bollería o fritos'}[c.tipo||'ambos'])+'). Grasa: 7.700 kcal ≈ 1 kg. Son estimaciones.'; break;
    case 'estudio': var me=0; si.forEach(function(f){ me+=valDia(r,f); }); var te2=temaEdad(), toca=0; for(var f2=r.ini; f2<=limiteReto(r); f2=sumar(f2,1)) if(!retoLibre(r,f2)) toca++;
      s.big={v:hm(me), l:'Estudiado'+(c.que?' · '+e(c.que):'')}; card(nSi+'/'+toca, 'días cumplidos de los que tocaban'); card(racha, racha===1?'día seguido':'días seguidos'); card(num(me/te2.m,1), te2.p+' en equivalencia');
      s.eq=eqLista(me, [[te2.m,'Un '+te2.s],[te2.m*3,'Tres '+te2.p],[te2.m*5,'Cinco '+te2.p],[te2.m*10,'Diez '+te2.p]], function(x){ return 'te faltan '+hm(x); });
      s.hitos={valor:me/60, lista:[[5,'5 horas'],[10,'10 horas'],[25,'25 horas'],[50,'50 horas'],[100,'100 horas']], falta:function(x){ return 'te faltan '+hm(x*60); }};
      s.calc=(c.que?e(c.que)+' · ':'')+hm(+c.min||30)+' · '+((c.dias||[]).map(function(i){ return DIAS_C[i]; }).join(' ')||'todos los días'); break;
    case 'buenas': var bs=[]; (r.ev||[]).forEach(function(x){ if(x.k==='buenas') x.c.forEach(function(y){ bs.push(y); }); }); var cuenta={};
      bs.forEach(function(y){ if(y.tag) cuenta[y.tag]=(cuenta[y.tag]||0)+1; }); var top=Object.keys(cuenta).sort(function(a,b){ return cuenta[b]-cuenta[a]; })[0];
      s.tarro=bs; s.big={v:String(bs.length), l:bs.length===1?'Cosa buena guardada':'Cosas buenas guardadas'}; card(racha, racha===1?'día seguido':'días seguidos');
      if(top) card(TAGS_BUENAS.filter(function(t){ return t[0]===top; })[0][1], 'lo que más te alegra');
      var an1=animoMedio(r.ini, limiteReto(r)), an0=animoMedio(sumar(r.ini,-14), sumar(r.ini,-1)); if(an1 && an0) card((an1-an0>=0?'+':'')+num(an1-an0,1), 'de ánimo frente a antes (del 1 al 10)', {acc:an1>=an0});
      var pasadas=(r.ev||[]).filter(function(x){ return x.k==='buenas' && x.f<hoy() && x.c.length; }); if(pasadas.length){ var sel=pasadas[(+hoy().replace(/-/g,''))%pasadas.length], cc=sel.c[0]; s.recuerdo={f:sel.f, x:cc.x}; }
      s.hitos={valor:bs.length, lista:[[21,'21 cosas buenas'],[50,'50 cosas buenas'],[100,'100 cosas buenas'],[365,'365 cosas buenas']], falta:function(x){ return 'te faltan '+x; }}; break;
    case 'dormir': var gd=Math.max(0,(minHora(c.antes||'01:00')||0)-(minHora(c.hora||'23:30')||0)), sg=gd*nSi;
      s.big={v:hm(sg), l:'Sueño ganado'}; card(nSi, nSi===1?'noche a tu hora':'noches a tu hora'); card(racha, racha===1?'noche seguida':'noches seguidas'); card(mejor,'mejor racha');
      s.eq=eqLista(sg, [[90,'Una peli'],[480,'Una noche entera de sueño'],[960,'Dos noches enteras']], function(x){ return 'te faltan '+hm(x); });
      s.hitos={valor:nSi, lista:[[3,'3 noches'],[7,'7 noches'],[10,'10 noches'],[14,'14 noches']], falta:function(x){ return 'te faltan '+x; }};
      s.calc='a la cama a las '+(c.hora||'23:30')+' · antes, a las '+(c.antes||'01:00'); break;
    case 'pantalla': var gp=Math.max(0,((+c.antes||5)-(+c.meta||3))*60), hr=gp*nSi, te3=temaEdad();
      s.big={v:hm(hr), l:'Horas recuperadas'}; card(nSi, nSi===1?'día por debajo':'días por debajo'); card(racha, racha===1?'día seguido':'días seguidos'); card(num(hr/te3.m,1), te3.p+' en equivalencia');
      s.eq=eqLista(hr, [[120,'Una peli larga'],[te3.m*2,'Dos '+te3.p],[600,'10 h: un día de curro'],[1440,'Un día entero']], function(x){ return 'te faltan '+hm(x); });
      s.hitos={valor:hr, lista:[[120,'2 h'],[300,'5 h'],[600,'10 h'],[1200,'20 h']], falta:function(x){ return 'te faltan '+hm(x); }};
      s.calc=(+c.antes||5)+' h de pantalla antes · meta, menos de '+(+c.meta||3)+' h'; break;
    case 'agua': var vs=evDe(r,'vaso'), hoyV=vasosDia(r,hoy());
      s.big={v:num(vs.length*0.25,1)+' L', l:'Agua bebida'}; s.agua=hoyV; card(hoyV+'/8', 'vasos hoy', {acc:hoyV>=8}); card(nSi, nSi===1?'día con 2 litros':'días con 2 litros'); card(racha, racha===1?'día seguido':'días seguidos');
      s.hitos={valor:vs.length*0.25, lista:[[10,'10 litros'],[25,'25 litros'],[50,'50 litros'],[100,'100 litros']], falta:function(x){ return 'te faltan '+num(x,1)+' L'; }}; break;
  }
  return s; }
function animoMedio(a, b){ var t=0, n=0; for(var f=a; f<=b; f=sumar(f,1)){ var d=D.dias[f]; if(d && d.feliz){ t+=d.feliz; n++; } } return n>=3 ? t/n : 0; }

/* ---------- logros: hitos y equivalencias, con celebración ---------- */
function logrosReto(r, silencio){
  if(!r || r.fin) return; var s=statsReto(r), nuevos=[]; r.vistos=r.vistos||{};
  var primera = !r.vistosOk; r.vistosOk=1;
  if(s.hitos){ s.hitos.lista.forEach(function(h){ var key=(s.hitos.clave==='d' ? 'd'+h[0]+'@'+desdeReto(r) : 'h'+h[0]); if(s.hitos.valor>=h[0] && !r.vistos[key]){ r.vistos[key]=1; nuevos.push({t:'hito', h:h, s:s}); } }); }
  if(s.eq){ s.eq.on.forEach(function(q){ var key='e'+q[0]; if(!r.vistos[key]){ r.vistos[key]=1; nuevos.push({t:'eq', q:q, s:s}); } }); }
  if(!nuevos.length) return; guardarPronto();
  if(silencio || primera) return;
  var x=nuevos[nuevos.length-1], nom=nombreReto(r);
  if(x.t==='hito' && x.s.hitos.clave==='d') celebrar({tipo:'hito', eyebrow:'Reto · '+nom, titulo:x.h[1]+'.', grande:durTxt(x.s.reloj), sub:frasesDejar(r, x.s), frase:'Sigue así. Cada minuto cuenta.', toast:nom+': '+x.h[1]+'.'});
  else if(x.t==='hito') celebrar({tipo:'hito', eyebrow:'Reto · '+nom, titulo:x.h[1]+'.', sub:x.s.big?x.s.big.l+': '+x.s.big.v+'.':'', frase:'Lo has hecho tú, día a día.', toast:nom+': '+x.h[1]+'.'});
  else if(x.s.dinero!=null) celebrar({tipo:'hito', eyebrow:x.s.k==='compras'?'Te lo has ahorrado':'Con lo ahorrado', titulo:'¡'+cap(x.q[1])+'!', grande:eur0(x.s.dinero), sub:'Con eso te podrías pagar '+x.q[1]+'.', frase:'Dinero que se queda en tu bolsillo.', toast:'Con lo ahorrado: '+x.q[1]+'.'});
  else celebrar({tipo:'hito', eyebrow:'Reto · '+nom, titulo:x.q[1]+'.', sub:x.s.big?x.s.big.l+': '+x.s.big.v+'.':'', frase:'Eso que has ganado ya no te lo quita nadie.', toast:nom+': '+x.q[1]+'.'});
}
function frasesDejar(r, s){ var c=s.cards[0]; return c ? c.n+' '+c.l+(s.dinero!=null?' y '+eur0(s.dinero):'')+'.' : ''; }
function logrosTodos(silencio){ retosActivos().forEach(function(r){ if(r.ini<=hoy()) logrosReto(r, silencio); }); }

/* ---------- lo que se pinta ---------- */
function relojHTML(ms, id){ var t=relojTxt(ms); return '<div class="rp-reloj" data-rv="'+id+':reloj"><span class="u"><span class="n">'+t.d+'</span><span class="t">D</span></span><span class="u"><span class="n">'+pad(t.h)+'</span><span class="t">H</span></span><span class="u"><span class="n">'+pad(t.m)+'</span><span class="t">MIN</span></span><span class="u rs"><span class="n">'+pad(t.s)+'</span><span class="t">S</span></span></div>'; }
function vivoHTML(r, s){ var h='';
  if(s.reloj!=null) h+=relojHTML(s.reloj, r.id);
  else if(s.big) h+='<div class="col" style="gap:4px"><span class="lbl">'+s.big.l+'</span><span class="num rp-big">'+s.big.v+'</span></div>';
  if(s.dinero!=null) h+='<div class="rp-dinero"><span class="lbl">'+s.dineroL+'</span><span class="num">'+eur(s.dinero)+'</span></div>';
  if(s.cards.length) h+='<div class="rp-grid">'+s.cards.map(function(c){ return '<div class="rp-st"><span class="num'+(c.acc?' acc':'')+'">'+c.n+'</span><span class="k">'+c.l+'</span>'+(c.est?'<span class="est">Estimación</span>':'')+'</div>'; }).join('')+'</div>';
  return h; }
function hitoHTML(s){ if(!s.hitos) return ''; var v=s.hitos.valor, prev=0, sig=null; for(var i=0;i<s.hitos.lista.length;i++){ if(v<s.hitos.lista[i][0]){ sig=s.hitos.lista[i]; break; } prev=s.hitos.lista[i][0]; }
  if(!sig) return '<div class="rp-hito"><div class="mbar"><span class="llena" style="--w:100%"></span></div><div class="row sb"><span>Todos los hitos conseguidos</span><span></span></div></div>';
  var pct=Math.max(3, Math.min(100, Math.round((v-prev)/(sig[0]-prev)*100)));
  return '<div class="rp-hito"><div class="mbar"><span class="llena" style="--w:'+pct+'%"></span></div><div class="row sb"><span>Próximo: '+sig[1]+'</span><span>'+s.hitos.falta(sig[0]-v)+'</span></div></div>'; }
function eqHTML(s){ if(!s.eq || (!s.eq.on.length && !s.eq.prox)) return ''; var lbl = s.dinero!=null ? (s.k==='compras'?'Con lo que no te has gastado':'Con lo ahorrado') : 'Lo que ya has ganado';
  return '<div class="col" style="gap:8px"><span class="lbl">'+lbl+'</span><div class="rp-eq">'+s.eq.on.map(function(q){ return '<span class="on">'+cap(q[1])+'</span>'; }).join('')+(s.eq.prox?'<span class="prox">'+cap(s.eq.prox[1])+': '+s.eq.falta+'</span>':'')+'</div></div>'; }
function tarroHTML(s){ var bs=s.tarro||[], n=bs.length, vis=bs.slice(-140), nuevos=U.tarroNuevo||0; U.tarroNuevo=0;
  var bol=vis.map(function(y,i){ var t=TAGS_BUENAS.filter(function(x){ return x[0]===y.tag; })[0]; return '<i'+(i>=vis.length-nuevos?' class="cae" style="animation-delay:'+((i-(vis.length-nuevos))*0.12)+'s"':'')+' style="background:'+(t?t[2]:'var(--text3)')+'"></i>'; }).join('');
  return '<div class="tarro" aria-label="Tu tarro tiene '+n+' cosas buenas"><span class="tapa"></span><div class="cristal">'+(bol||'<span class="vacio">Aquí caen tus cosas buenas</span>')+'</div></div>'; }
function accionesReto(r, s){ var k=s.k, f=hoy(), h='';
  if(r.ini>f || r.fin) return '';
  if(k==='bolleria') h+=cta('HE EVITADO UN ANTOJO','rAntojo',r.id,'<span class="small">+1</span>','sm');
  if(k==='compras') h+=cta('LO HE EVITADO','rCompra',r.id,ic('chev',18),'sm');
  if(k==='agua') h+='<div class="grid2">'+cta('+1 VASO','rVaso',r.id,'<span class="small">'+s.agua+'/8</span>','sm')+cta('QUITAR','rVasoMenos',r.id,'','ghost sm')+'</div>';
  if(k==='buenas'){ var b=buenasDia(r,f); h+=cta(b.length?'CAMBIAR LAS DE HOY':'MIS 3 DE HOY','rBuenas',r.id,'<span class="small">'+b.length+'/3</span>','sm'); }
  if(s.reloj!=null || k==='bolleria') h+='<button type="button" class="chip ganas-btn" data-a="ganas" data-v="'+r.id+'">Tengo ganas · respira 10 min</button>';
  if(s.reloj!=null) h+='<button type="button" class="link c" data-a="rRecaida" data-v="'+r.id+'">He recaído</button>';
  return h; }
function retoPanel(r){ var s=statsReto(r), k=s.k, dej=s.reloj!=null;
  return '<section class="box col rp'+(dej?' dej':'')+'" aria-label="Tus estadísticas">'+
    (r.ini>hoy() ? '<p class="p2">Empieza '+(r.ini===sumar(hoy(),1)?'mañana':fechaLarga(r.ini).toLowerCase())+'. Aquí verás tus cifras.</p>' : '')+
    (dej?'<span class="lbl acc">Llevas '+e(sinTxt(k==='otra'?cfgR(r).nombre:({alcohol:'alcohol',tabaco:'fumar',bebidas:({energeticas:'energéticas',refrescos:'refrescos'})[cfgR(r).que]||'energéticas ni refrescos',porros:'porros',apuestas:'apostar',unas:'morderte las uñas',compras:'compras por impulso'})[k]))+'</span>':'')+
    (k==='buenas'?tarroHTML(s):'')+
    '<div class="col" style="gap:12px" data-rvivo="'+r.id+'">'+vivoHTML(r,s)+'</div>'+
    hitoHTML(s)+eqHTML(s)+
    (s.recuerdo?'<div class="rp-recuerdo"><span class="lbl">'+(entre(s.recuerdo.f,hoy())===1?'Ayer':'Hace '+entre(s.recuerdo.f,hoy())+' días')+' apuntaste</span><span>«'+e(s.recuerdo.x)+'»</span></div>':'')+
    (s.lista&&s.lista.length?'<div class="col" style="gap:6px"><span class="lbl">Lo último que no compraste</span>'+s.lista.map(function(x){ return '<div class="row sb rp-li"><span>'+e(x.que||'Un capricho')+'</span><span class="num">'+eur0(+x.eur||0)+'</span></div>'; }).join('')+'</div>':'')+
    (s.donde?'<details class="rp-donde"><summary>¿De dónde salen estas cifras?</summary><p>'+s.donde+'</p></details>':'')+
    (s.sinCfg ? '<button type="button" class="box row sb rp-afinar" data-a="rCambiar" data-v="'+r.id+'"><span class="col" style="gap:2px"><strong>Responde 2 preguntas</strong><span>Así tus cifras son las tuyas, no una media.</span></span>'+ic('chev',16)+'</button>'
      : (pregDe(k).length?'<div class="rp-calc"><span>Calculado con lo que me dijiste: <b>'+s.calc+'</b></span><button type="button" class="link" data-a="rCambiar" data-v="'+r.id+'">Cambiar</button></div>':''))+
    accionesReto(r,s)+'</section>'; }
function retoResumen(r){ if(r.ini>hoy()) return ''; var s=statsReto(r), t;
  if(s.reloj!=null){ var x=relojTxt(s.reloj); t=x.d+' d '+pad(x.h)+' h '+pad(x.m)+' min '+pad(x.s)+' s'+(s.dinero!=null?' · '+eur(s.dinero):''); }
  else if(s.big) t=s.big.l+': '+s.big.v; else return '';
  return '<span class="rp-res" data-rres="'+r.id+'">'+t+'</span>'; }

/* ---------- en vivo: reloj y dinero, cada segundo ---------- */
/* Solo cambia el texto que cambia (los segundos, el dinero): la tarjeta no se repinta ni salta. */
var _plantilla=document.createElement('template');
function parchear(el, html){ _plantilla.innerHTML=html; var nuevo=_plantilla.content;
  function igualForma(a,b){ if(a.childNodes.length!==b.childNodes.length) return false; for(var i=0;i<a.childNodes.length;i++){ var x=a.childNodes[i], y=b.childNodes[i]; if(x.nodeType!==y.nodeType || x.nodeName!==y.nodeName) return false; if(x.nodeType===1 && (x.className!==y.className || !igualForma(x,y))) return false; } return true; }
  if(!igualForma(el, nuevo)){ el.innerHTML=html; return; }
  (function copia(a,b){ for(var i=0;i<a.childNodes.length;i++){ var x=a.childNodes[i], y=b.childNodes[i]; if(x.nodeType===3){ if(x.nodeValue!==y.nodeValue) x.nodeValue=y.nodeValue; } else if(x.nodeType===1) copia(x,y); } })(el, nuevo); }
setInterval(function(){
  if(!D.perfil || document.hidden) return;
  var els=app.querySelectorAll('[data-rvivo]'), i;
  for(i=0;i<els.length;i++){ var r=D.retos.filter(function(x){ return x.id===els[i].dataset.rvivo; })[0]; if(!r) continue; var h=vivoHTML(r, statsReto(r)); if(els[i].dataset.ult!==h){ parchear(els[i], h); els[i].dataset.ult=h; } }
  var rs=app.querySelectorAll('[data-rres]'); for(i=0;i<rs.length;i++){ var r2=D.retos.filter(function(x){ return x.id===rs[i].dataset.rres; })[0]; if(!r2) continue; var t=retoResumen(r2).replace(/<[^>]+>/g,''); if(rs[i].textContent!==t) rs[i].textContent=t; }
}, 1000);
setInterval(function(){ if(!D.perfil || document.hidden || U.cele || U.sheet || (typeof escribiendo==='function' && escribiendo())) return; logrosTodos(false); }, 20000);

/* ---------- recaída: el reloj vuelve a cero, lo ganado se queda ---------- */
function recaer(r, cuando){ var t=cuando||ahora(), ini=desdeReto(r); if(t<=ini) return;
  r.deshacer={desde:r.desde, accMs:r.accMs||0, mejorMs:r.mejorMs||0, f:hoy()};
  var ms=t-ini; r.accMs=(r.accMs||0)+ms; r.mejorMs=Math.max(r.mejorMs||0, ms); r.desde=t; }
function deshacerRecaida(r){ if(!r.deshacer) return; r.desde=r.deshacer.desde; r.accMs=r.deshacer.accMs; r.mejorMs=r.deshacer.mejorMs; r.deshacer=null; }
function trasMarcar(r, f, antes, ahoraV){ var R=retoDef(r.n)||{};
  if(R.dejar && R.k!=='bolleria'){
    if(ahoraV==='no' && antes!=='no'){ recaer(r, f===hoy() ? ahora() : inicioDia(sumar(f,1))); }
    else if(antes==='no' && ahoraV!=='no' && r.deshacer){ deshacerRecaida(r); }
  }
}

/* ---------- hojas propias ---------- */
function retoSheetHTML(s){ var r=D.retos.filter(function(x){ return x.id===s.id; })[0]; if(!r) return ''; var k=kReto(r);
  if(s.modo==='valor'){ var t, ops;
    if(k==='redes'){ t='¿Cuántos minutos has estado sin redes ni móvil desde que te has levantado?'; ops=[30,45,60,90,120,180]; }
    else if(k==='estudio'){ t='¿Cuántos minutos has estudiado'+(cfgR(r).que?' '+e(cfgR(r).que):'')+'?'; ops=[15,25,30,45,60,90,120,180]; }
    else { t='¿Cuántas páginas has leído?'; ops=[10,15,20,30,50,100]; }
    var b=ops.map(function(x){ return opt('<span class="num" style="font-size:22px">'+(k==='paginas'?x:hm(x).toUpperCase())+'</span>', valDia(r,s.f)===x,'rVal',r.id+'|'+s.f+'|'+x,'c'); }).join('');
    return hoja('Reto · '+e(nombreReto(r).toLowerCase()), t, '<div class="grid3">'+b+'</div><p class="nota">Esto es lo que suma a tus estadísticas.</p>'); }
  if(s.modo==='buenas'){ var cuerpo='';
    for(var i=0;i<3;i++){ var tags=TAGS_BUENAS.map(function(x){ return '<button type="button" class="chip mini-chip'+(s['g'+i]===x[0]?' on':'')+'" data-a="rsTag" data-v="'+i+'.'+x[0]+'" aria-pressed="'+(s['g'+i]===x[0])+'"><i style="background:'+x[2]+'"></i>'+x[1]+'</button>'; }).join('');
      cuerpo+='<div class="col" style="gap:8px"><input id="in-bn'+i+'" class="input" type="text" maxlength="90" placeholder="'+['Por ejemplo, comí con mi abuela','Por ejemplo, terminé el trabajo','Por ejemplo, el café de la mañana'][i]+'" value="'+e(s['c'+i]||'')+'" data-in="rs.c'+i+'"><div class="chips" style="gap:6px">'+tags+'</div></div>'; }
    return hoja('3 cosas buenas', 'Hoy ha ido bien…', cuerpo+'<p class="nota">Se queda solo en tu móvil.</p>', cta('GUARDAR','rBuenasOk',r.id,ic('check'),'sm')); }
  if(s.modo==='compra'){
    return hoja('Sin compras por impulso','¿Qué era y cuánto costaba?', '<input id="in-cq" class="input" type="text" maxlength="50" placeholder="Por ejemplo, unas zapatillas" value="'+e(s.que||'')+'" data-in="rs.que"><div class="row" style="gap:8px"><input id="in-ce" class="input" type="text" inputmode="decimal" placeholder="Precio" value="'+e(s.eur||'')+'" data-in="rs.eur" style="flex:1"><span class="num" style="font-size:28px">€</span></div>', cta('GUARDAR','rCompraOk',r.id,ic('check'),'sm')); }
  return ''; }

/* ---------- en el cierre del día ---------- */
function retoCierreExtra(r, f, c){ var k=kReto(r); if(!VALK[k] || (c.retos||{})[r.id]!=='si') return ''; var ops = k==='redes'?[30,45,60,90,120,180]:(k==='estudio'?[15,25,30,45,60,90,120]:[10,15,20,30,50]);
  var cur=(c.rv&&c.rv[r.id]!=null)?c.rv[r.id]:valDia(r,f);
  return '<div class="chips" style="gap:6px;margin-top:-4px"><span class="lbl" style="width:100%">'+(k==='redes'?'¿Cuántos minutos sin redes ni móvil desde que te levantaste?':(k==='estudio'?'¿Cuántos minutos?':'¿Cuántas páginas?'))+'</span>'+
    ops.map(function(x){ return '<button type="button" class="chip'+(cur===x?' on':'')+'" data-a="ck:rv" data-v="'+r.id+'.'+x+'">'+(k==='paginas'?x:hm(x))+'</button>'; }).join('')+'</div>'; }
function retoTrasDia(f, antes, c){ var d=dia(f,true);
  if(c && c.rv){ d.rv=d.rv||{}; Object.keys(c.rv).forEach(function(id){ d.rv[id]=c.rv[id]; }); }
  D.retos.forEach(function(r){ if(r.fin || r.ini>f) return; trasMarcar(r, f, (antes||{})[r.id], (d.retos||{})[r.id]); }); }

/* ---------- acciones ---------- */
function retoPorId(id){ return D.retos.filter(function(x){ return x.id===id; })[0]; }
function retoAccion(a, v){ var f=hoy(), r, s=U.sheet;
  switch(a){
    case 'nuevoReto': var R0=RETOS[+v]; U.rqK=R0&&R0.k; U.rq=cfgDefecto(U.rqK); return false;
    case 'rq': var p=String(v).split('|'), val=JSON.parse(p.slice(1).join('|')); U.rq[p[0]]=val;
      if(U.rqK==='tabaco' && p[0]==='tipo'){ if(val==='vaper'){ U.rq.n=3; U.rq.precio=3; } else { U.rq.n=10; U.rq.precio=5.5; } }
      render(); return true;
    case 'rqDia': var di=+v, ds=U.rq.dias=U.rq.dias||[], ix=ds.indexOf(di); if(ix===-1) ds.push(di); else ds.splice(ix,1); ds.sort(); render(); return true;
    case 'empezarReto': if(!retoCfgOk()){ toast(U.rqK==='otra'?'Ponle nombre a tu reto.':(U.rqK==='estudio'?'Dime qué quieres estudiar y qué días.':'Revisa las respuestas.')); return true; }
      var n0=D.retos.length, cfg=U.rq, kk=U.rqK;
      setTimeout(function(){ var nr=D.retos[D.retos.length-1]; if(!nr || D.retos.length===n0) return;
        if(pregDe(kk).length) nr.cfg=cfg; nr.desde = nr.ini===hoy() ? ahora() : inicioDia(nr.ini); nr.ev=[]; nr.vistos={}; nr.vistosOk=1;
        if(kk==='estudio' && cfg.dias && cfg.dias.length){ var toca=0; for(var x=nr.ini; x<=finReto(nr); x=sumar(x,1)) if(cfg.dias.indexOf(dowIdx(x))!==-1) toca++; nr.vale=Math.max(1, Math.ceil(toca*0.8)); }
        guardar(); render(); }, 0);
      return false;
    case 'rCambiar': r=retoPorId(v); if(!r) return true; U.retoSel=v; U.rqK=kReto(r); U.rq=JSON.parse(JSON.stringify(r.cfg||cfgDefecto(U.rqK))); go('retoCfg'); return true;
    case 'retoCfgOk': r=retoPorId(U.retoSel); if(!r) return true; if(!retoCfgOk()){ toast('Revisa las respuestas.'); return true; } r.cfg=U.rq; guardar(); back(); toast('Listo. Cifras recalculadas.'); return true;
    case 'retoRapido': case 'retoHoy':
      var id = a==='retoHoy' ? U.retoSel : String(v).split('.')[0], rr=retoPorId(id); if(!rr) return false;
      var antes=((D.dias[f]||{}).retos||{})[id];
      setTimeout(function(){ var ahoraV=((D.dias[f]||{}).retos||{})[id]; trasMarcar(rr, f, antes, ahoraV);
        if(ahoraV==='si' && antes!=='si' && VALK[kReto(rr)]){ U.sheet={tipo:'reto', modo:'valor', id:id, f:f, anim:true}; }
        logrosReto(rr); guardar(); render(); }, 0);
      return false;
    case 'rVal': var pv=String(v).split('|'); r=retoPorId(pv[0]); if(!r) return true; var dd=dia(pv[1],true); dd.rv=dd.rv||{}; dd.rv[r.id]=+pv[2]; U.sheet=null; guardar(); logrosReto(r); render();
      toast(kReto(r)==='paginas' ? '+'+pv[2]+' páginas.' : '+'+hm(+pv[2])+(kReto(r)==='redes'?' de vida ganados.':' de estudio.')); vibrar(15); return true;
    case 'ck:rv': var pc=String(v).split('.'); U.ck.rv=U.ck.rv||{}; U.ck.rv[pc[0]]=+pc[1]; render(); return true;
    case 'rAntojo': r=retoPorId(v); if(!r) return true; (r.ev=r.ev||[]).push({k:'antojo', t:ahora(), f:f}); guardar();
      var kc=cfgR(r).tipo==='frito'?300:(cfgR(r).tipo==='dulce'?350:325); celebrar({tipo:'mini'}); render(); toast('Antojo evitado: unas '+kc+' kcal menos.'); logrosReto(r); return true;
    case 'rVaso': r=retoPorId(v); if(!r) return true; (r.ev=r.ev||[]).push({k:'vaso', t:ahora(), f:f}); var nv=vasosDia(r,f); guardar(); vibrar(12);
      if(nv===8){ celebrar({tipo:'mini'}); toast('¡2 litros hoy! Día cumplido.'); } else toast('Vaso '+nv+' de 8.'); logrosReto(r); render(); return true;
    case 'rVasoMenos': r=retoPorId(v); if(!r) return true; var evs=r.ev||[]; for(var j=evs.length-1;j>=0;j--){ if(evs[j].k==='vaso' && evs[j].f===f){ evs.splice(j,1); break; } } guardar(); render(); return true;
    case 'rBuenas': r=retoPorId(v); if(!r) return true; var b=buenasDia(r,f), sh={tipo:'reto', modo:'buenas', id:r.id, anim:true}; b.forEach(function(x,i){ sh['c'+i]=x.x; sh['g'+i]=x.tag; }); U.sheet=sh; render(); return true;
    case 'rsTag': if(!s) return true; var pt=String(v).split('.'); s['g'+pt[0]] = s['g'+pt[0]]===pt[1] ? null : pt[1]; s.anim=false; render(); return true;
    case 'rBuenasOk': r=retoPorId(v); if(!r || !s) return true; var cs=[]; for(var q=0;q<3;q++){ var tx=String(s['c'+q]||'').trim(); if(tx) cs.push({x:tx, tag:s['g'+q]||null}); }
      if(!cs.length){ toast('Escribe al menos una.'); return true; }
      r.ev=(r.ev||[]).filter(function(x){ return !(x.k==='buenas' && x.f===f); }); var antesN=0; r.ev.forEach(function(x){ if(x.k==='buenas') antesN+=x.c.length; });
      r.ev.push({k:'buenas', t:ahora(), f:f, c:cs}); U.tarroNuevo=cs.length; U.sheet=null; guardar(); render(); vibrar([15,40,15]);
      toast(cs.length===3?'Tres más a tu tarro.':'Guardadas. Con 3, el día cuenta.'); logrosReto(r); return true;
    case 'rCompra': r=retoPorId(v); if(!r) return true; U.sheet={tipo:'reto', modo:'compra', id:r.id, anim:true}; render(); return true;
    case 'rCompraOk': r=retoPorId(v); if(!r || !s) return true; var pe=parseFloat(String(s.eur||'').replace(',','.')); if(!(pe>0)){ toast('Pon cuánto costaba.'); return true; }
      var antesE=0; evDe(r,'compra').forEach(function(x){ antesE+=+x.eur||0; });
      (r.ev=r.ev||[]).push({k:'compra', t:ahora(), f:f, que:String(s.que||'').trim()||'Un capricho', eur:pe}); U.sheet=null; guardar(); render();
      var tot=antesE+pe, eqn=null; EQ_EUR.forEach(function(q){ if(antesE<q[0] && tot>=q[0]) eqn=q; });
      if(!eqn) toast('Te has ahorrado '+eur0(pe)+'. Llevas '+eur0(tot)+'.'); logrosReto(r); vibrar([15,40,15]); return true;
    case 'rRecaida': U.sheet={tipo:'confirmar', anim:true, lbl:'Reto', t:'¿Has recaído?', p:'Sin culpa. El reloj vuelve a cero, pero tu mejor marca y todo lo que has ganado se quedan.', si:'SÍ, HE RECAÍDO', a:'rRecaidaSi', v:v}; render(); return true;
    case 'rRecaidaSi': r=retoPorId(v); if(!r) return true; recaer(r); r.deshacer=null; U.sheet=null; guardar(); render(); toast('Apuntado. Lo ganado se queda. El reloj empieza otra vez.'); return true;
  }
  return false; }

/* =========================================================
   Parte 4: hojas, guía, render, acciones y arranque
   ========================================================= */
function hoja(lbl, titulo, cuerpo, botones, cerrar){ return '<div class="overlay guia-ov" role="dialog" aria-modal="true" aria-label="'+e(titulo.replace(/<[^>]+>/g,''))+'" data-a="'+(cerrar===false?'':'cerrarSheet')+'" data-fondo="1"><div class="sheet'+(U.sheet&&U.sheet.anim!==false?' anim':'')+'">'+
  '<div class="row sb"><span class="lbl acc">'+lbl+'</span>'+(cerrar===false?'':'<button type="button" class="link" style="min-height:36px" data-a="cerrarSheet">Cerrar</button>')+'</div>'+
  '<h2 class="h1" style="font-size:32px;line-height:.98">'+titulo+'</h2>'+cuerpo+(botones||'')+'</div></div>'; }
function sheetHTML(){ var s=U.sheet; if(!s) return ''; var h='';
  switch(s.tipo){
    case 'cerrado': return cerradoHTML();
    case 'ganas': return ganasHTML();
    case 'medalla': h=medallaHoja(s.id); break;
    case 'compEnt': var prev=function(u,fmt){ return u?'<img src="'+u+'" alt="" style="width:100%;display:block;border-radius:12px;border:var(--fina)">':'<div style="aspect-ratio:'+(fmt==='wa'?'1/1':'9/16')+';border-radius:12px;background:var(--caja2)"></div>'; };
      h=hoja('Compartir','Tu entreno', '<div class="grid2" style="align-items:end"><button type="button" class="col" style="gap:8px;border:none;background:none;padding:0;text-align:left" data-a="compartirFmt" data-v="ig" aria-label="Compartir para Instagram">'+prev(s.ig,'ig')+'<strong style="font-size:15px">Instagram</strong><span style="font-size:13px;color:var(--text2);margin-top:-6px">Stories, vertical</span></button><button type="button" class="col" style="gap:8px;border:none;background:none;padding:0;text-align:left" data-a="compartirFmt" data-v="wa" aria-label="Compartir para WhatsApp">'+prev(s.wa,'wa')+'<strong style="font-size:15px">WhatsApp</strong><span style="font-size:13px;color:var(--text2);margin-top:-6px">Cuadrada, para chats</span></button></div>'+
        (s.ig?'':'<p class="nota">Preparando tus tarjetas…</p>')+'<p class="nota">Toca la que quieras para compartirla. Solo salen tu rutina, el tiempo, las series, los kilos y el récord si lo hay.</p>'); break;
    case 'imagen': h=hoja('Tu tarjeta','Guárdala y compártela', '<img class="share-img" src="'+s.url+'" alt="Tu tarjeta para compartir"><p class="nota">Mantén pulsada la imagen y toca «Guardar en Fotos». Luego súbela a tus stories o mándala por WhatsApp.</p>'); break;
    case 'recordatorio': h=hoja('Recordatorio','¿A qué hora te aviso?', '<p class="p2">Lo añado a tu calendario del iPhone: te avisará cada día a esa hora para cerrar el día.</p><div class="grid3">'+['21:00','22:00','23:00'].map(function(x){ return opt('<span class="num" style="font-size:22px">'+x+'</span>', s.hora===x,'recHora',x,'c'); }).join('')+'</div><div class="hora"><label class="lbl" for="in-rec" style="flex:1">U otra hora</label><input id="in-rec" type="time" value="'+e(s.hora)+'" data-in="sh.hora"></div>', cta('AÑADIR AL CALENDARIO','crearRec','',ic('check'))); break;
    case 'instalar': h=hoja('Instalar','Tenla como una app', '<div class="col" style="gap:12px"><div class="row" style="gap:12px;align-items:flex-start"><span class="num acc" style="font-size:26px;width:24px">1</span><span style="font-size:15px;line-height:1.4">Abre '+(APP_URL?'<strong>'+e(APP_URL.replace(/^https?:\/\//,''))+'</strong>':'esta página')+' en <strong>Safari</strong>.</span></div><div class="row" style="gap:12px;align-items:flex-start"><span class="num acc" style="font-size:26px;width:24px">2</span><span style="font-size:15px;line-height:1.4">Toca el botón <strong>Compartir</strong> (el cuadrado con la flecha).</span></div><div class="row" style="gap:12px;align-items:flex-start"><span class="num acc" style="font-size:26px;width:24px">3</span><span style="font-size:15px;line-height:1.4">Elige <strong>Añadir a pantalla de inicio</strong>.</span></div></div>'+
      (EN_CLAUDE?'<p class="p2" style="font-size:14px">Para llevarte lo que ya tienes: descarga una copia aquí (Ajustes → Descargar una copia) y en la app nueva toca «Recupera tu copia».</p>':'<p class="nota">Funciona sin internet y tus datos se quedan en tu iPhone.</p>')); break;
    case 'caida': h=hoja('Sin culpa','¿Has caído?', '<p class="p2">Pasa, y no borra lo que has conseguido. Tu contador vuelve a empezar, pero tu mejor marca y lo que has ahorrado se quedan.</p>'+(((D.perfil.dejar||{}).razones||[]).length?'<p class="p2" style="font-size:14px">Recuerda por qué: '+D.perfil.dejar.razones.map(e).join(' · ')+'</p>':''), '<div class="grid2">'+cta('NO, SIGO','cerrarSheet','','','ghost sm')+cta('SÍ, EMPIEZO DE NUEVO','caidaSi','','','sm')+'</div>'); break;
    case 'empezar': var r='';
      D.rutinas.forEach(function(x){ r+='<button type="button" class="it" data-a="empezarRutina" data-v="'+x.id+'"><span class="l">'+e(x.nombre)+'</span><span class="v">'+plural(x.ej.length,'ejercicio','ejercicios')+'</span><span style="color:var(--text3)">'+ic('play',16,2.4)+'</span></button>'; });
      var ult=D.entrenos[D.entrenos.length-1];
      h=hoja('Empezar','¿Qué entrenas hoy?', (r?'<div class="list">'+r+'</div>':'')+(ult?'<button type="button" class="it" style="border:var(--borde);border-radius:12px" data-a="repetir" data-v="'+ult.id+'"><span class="l">Repetir el último</span><span class="v">'+e(ult.nombre)+'</span></button>':''), cta('EN BLANCO','empezarBlanco','',ic('plus')));
      break;
    case 'terminar': var n=0, sin=0; D.actual.ej.forEach(function(x){ x.s.forEach(function(y){ if(y.ok) n++; else sin++; }); });
      h=hoja('Terminar','¿Terminar el entreno?', '<p class="p2">'+plural(n,'serie hecha','series hechas')+' en '+cronoTxt()+'.'+(sin?' Las '+plural(sin,'serie','series')+' sin marcar no se guardan.':'')+'</p>', '<div class="grid2">'+cta('SEGUIR','cerrarSheet','','','ghost sm')+cta('TERMINAR','terminarSi','',ic('check'),'sm')+'</div>'); break;
    case 'sinSeries': h=hoja('Terminar','No has marcado ninguna serie.', '<p class="p2">Marca con ✓ cada serie al acabarla. Si hoy no ha habido entreno, descártalo.</p>', '<div class="grid2">'+cta('SEGUIR','cerrarSheet','','','ghost sm')+cta('DESCARTAR','descartarSi','',ic('x'),'sm')+'</div>'); break;
    case 'descartar': h=hoja('Descartar','¿Descartar este entreno?', '<p class="p2">Se borra lo que llevas apuntado de hoy. No se puede deshacer.</p>', '<div class="grid2">'+cta('SEGUIR','cerrarSheet','','','ghost sm')+cta('DESCARTAR','descartarSi','',ic('x'),'sm')+'</div>'); break;
    case 'ejMenu': var x=D.actual.ej[s.i];
      h=hoja('Ejercicio', e(x.n), '<div class="list">'+'<button type="button" class="it" data-a="verEj" data-v="'+e(x.n)+'"><span class="l">'+(fichaDe(x.n)?'Ver cómo se hace':'Ver tu historial')+'</span></button>'+'<button type="button" class="it" data-a="discosSheet" data-v="'+s.i+'"><span class="l">Calcular discos</span></button>'+(s.i>0?'<button type="button" class="it" data-a="ejSubir" data-v="'+s.i+'"><span class="l">Subir en la lista</span></button>':'')+'<button type="button" class="it" data-a="ejQuitar" data-v="'+s.i+'"><span class="l" style="color:#D93A40">Quitar del entreno</span></button></div>'); break;
    case 'pasos': var p=D.perfil, d=D.dias[hoy()]||{h:{}};
      h=hoja('Moverme','¿Cuántos pasos llevas?', '<p class="p2">Los ves en la app Salud del iPhone. Meta: '+num(p.metaPasos)+'.</p><input id="in-pasos" class="input big" type="text" inputmode="numeric" placeholder="Pasos" value="'+e(s.pasos!=null?s.pasos:(d.pasos!=null?d.pasos:''))+'" data-in="sh.pasos"><div class="grid2"><button type="button" class="chip" style="min-height:48px;border:var(--lleno)" data-a="pegarPasos">Pegar de Salud</button><button type="button" class="chip'+(s.min?' on':'')+'" style="min-height:48px" aria-pressed="'+(!!s.min)+'" data-a="pasosMin">He andado 30 min</button></div><button type="button" class="link" style="align-self:flex-start;min-height:32px;padding:0;font-size:13px" data-a="go" data-v="atajoPasos">Traer los pasos de Salud con un Atajo</button>', cta('GUARDAR','guardarPasos','',ic('check'))); break;
    case 'entrenoHoy': var dd=D.dias[hoy()]||{h:{}}, dh=deportesDe(hoy());
      h=hoja('Gym','¿Entrenas hoy?', '<p class="p2">Apunta el entreno en la app y se marca solo. Si hoy toca otro deporte (pádel, fútbol, correr…), apúntalo: cuenta igual.</p>'+(dh.length?'<div class="list">'+dh.map(function(x){ return filaActividad({t:'dep',x:x}); }).join('')+'</div>':''), (D.actual?cta('SEGUIR ENTRENO','go','entreno',ic('play')):cta('EMPEZAR ENTRENO','empezarSheet','',ic('play')))+'<button type="button" class="chip" style="min-height:52px;border:var(--lleno)" data-a="deporteSheet">He hecho otro deporte</button>'+(dd.h.entreno?'<button type="button" class="link" data-a="entrenoFuera">Quitar «he entrenado fuera»</button>':'')); break;
    case 'deporte': var ops=DEPORTES.map(function(dp){ return opt(dp[1], s.dep===dp[0],'depElige',dp[0],'c tiny'); }).join(''), mins=[20,30,45,60,75,90,120].map(function(m){ return '<button type="button" class="chip'+(s.min===m?' on':'')+'" aria-pressed="'+(s.min===m)+'" data-a="depMin" data-v="'+m+'">'+hm(m)+'</button>'; }).join('');
      var kc = s.dep && s.min ? kcalDe(depInfo(s.dep)[2], s.min) : 0;
      h=hoja('Otro deporte','¿Qué has hecho?', '<div class="grid3">'+ops+'</div>'+(s.dep==='otro'?'<input id="in-depn" class="input" type="text" maxlength="30" placeholder="¿Cuál? Por ejemplo, surf" value="'+e(s.nombre||'')+'" data-in="sh.nombre">':'')+
        '<div class="sec"><span class="lbl">¿Cuánto rato?</span><div class="chips">'+mins+'</div></div>'+
        (kc?'<p class="nota" style="margin:0">Unas '+num(kc)+' kcal, estimación.</p>':'')+
        (s.foto?'<figure class="foto" style="margin:0"><img src="'+s.foto+'" alt="Tu foto"><figcaption class="row" style="gap:6px"><button type="button" class="chip" data-a="depFotoQuitar">Quitar foto</button></figcaption></figure>':'<label class="chip" style="min-height:48px;cursor:pointer;position:relative;display:flex;align-items:center;justify-content:center;gap:8px">'+ic('camara',18,2.2)+'<span>Añadir una foto (opcional)</span><input type="file" accept="image/*" data-f="depFoto" style="position:absolute;width:1px;height:1px;opacity:0"></label>'),
        cta('GUARDAR','guardarDeporte','',ic('check'),(s.dep&&s.min&&(s.dep!=='otro'||String(s.nombre||'').trim()))?'':'off')); break;
    case 'verDeporte': var xd=(D.deportes||[]).filter(function(y){ return y.id===s.id; })[0]; if(!xd){ h=''; break; } var kd=kcalDeporte(xd);
      h=hoja(fechaLarga(xd.fecha), e(nombreDeporte(xd)), (FOTOS[xd.id]?'<img class="share-img" src="'+FOTOS[xd.id]+'" alt="Foto de '+e(nombreDeporte(xd))+'">':'')+'<section class="score s"><div><span class="lbl">Tiempo</span><span class="num">'+hm(xd.min).toUpperCase()+'</span></div><div><span class="lbl">Kcal</span><span class="num acc">≈ '+num(kd)+'</span></div><div><span class="lbl">Grasa</span><span class="num">'+grasaTxt(kd).toUpperCase()+'</span></div></section><p class="nota">Cuenta como el entreno de ese día. Los récords y los kilos son solo del gym.</p>',
        '<button type="button" class="link" data-a="borrarDeporte" data-v="'+xd.id+'">Borrar</button>'); break;
    case 'kcalInfo': h=hoja('Calorías','Cómo lo calculo', '<p class="p2">'+KCAL_DONDE+'</p><p class="p2">'+((D.perfil||{}).peso?'Uso tu peso: '+num(D.perfil.peso,1)+' kg.':'Ahora uso un peso medio de 70 kg.')+'</p>', cta('PESO Y ALTURA','go','ajCuerpo','','ghost sm')); break;
    case 'copiaTexto':
      h=hoja('Copia','Copia tus datos', '<p class="p2">Aquí no se puede descargar el archivo. Copia este texto y guárdalo en Notas. Para recuperarlo, pégalo en un archivo .json.</p><textarea id="copia-txt" class="input" style="height:120px;font-size:12px" readonly>'+e(copiaTexto())+'</textarea>', cta('COPIAR','copiar','',ic('check'))); break;
    case 'confirmarRestaurar': var dd2=s.datos;
      h=hoja('Recuperar','¿Cambiar tus datos por los de la copia?', '<p class="p2">La copia es de '+e((dd2.perfil&&dd2.perfil.nombre)||'alguien')+', con '+plural(Object.keys(dd2.dias||{}).length,'día','días')+' y '+plural((dd2.entrenos||[]).length,'entreno','entrenos')+'. Lo que hay ahora en este móvil se sustituye.</p>', '<div class="grid2">'+cta('NO','cerrarSheet','','','ghost sm')+cta('SÍ, CAMBIAR','restaurarSi','',ic('check'),'sm')+'</div>'); break;
    case 'borrar': h=hoja('Borrar','¿Borrar todos tus datos?', '<p class="p2">Se borran tus días, entrenos, rutinas y retos'+(NUBE.ok?', también la copia de tu cuenta':'')+'. No se puede deshacer. Si quieres, antes descarga una copia.</p>', '<div class="grid2">'+cta('NO','cerrarSheet','','','ghost sm')+cta('BORRAR','borrarSi','',ic('trash'),'sm')+'</div>'); break;
    case 'discos': var dd=discos(s.kg||0, s.barra), vis=''; dd.r.forEach(function(x){ vis+='<span class="disco d'+String(x).replace('.','_')+'">'+kg(x)+'</span>'; });
      h=hoja('Calculadora','Discos por lado', '<div class="row sb" style="gap:8px"><button type="button" class="paso" data-a="discoKg" data-v="-2.5" aria-label="2,5 kg menos">−</button><span class="col" style="align-items:center"><span class="num" style="font-size:40px">'+kg(s.kg||0)+' KG</span><span style="font-size:13px;color:var(--text3)">en total</span></span><button type="button" class="paso" data-a="discoKg" data-v="2.5" aria-label="2,5 kg más">+</button></div>'+
        '<div class="grid3">'+[20,15,10].map(function(b){ return opt('Barra '+b, s.barra===b,'discoBarra',String(b),'c'); }).join('')+'</div>'+
        '<div class="barra-vis" aria-label="Discos por lado: '+(dd.r.length?dd.r.map(kg).join(', '):'ninguno')+'"><span class="eje"></span>'+(vis||'<span class="nota">Solo la barra</span>')+'</div>'+
        (dd.resto>0?'<p class="nota">Sobran '+kg(dd.resto)+' kg por lado: no hay discos tan pequeños.</p>':'<p class="nota">Pon esto en cada lado de la barra.</p>')); break;
    case 'num': var esM=s.k==='movil', mt=metaDe(s.k,hoy()), okn = esM ? s.val<=mt : s.val>=mt;
      h=hoja(esM?'Móvil':'Sueño', esM?'¿Cuánto móvil llevas hoy?':'¿Cuánto dormiste anoche?', '<p class="p2">'+(esM?'Míralo en Ajustes del iPhone → Tiempo de uso. Meta: menos de '+hm(mt)+'.':'Desde que te dormiste hasta que te levantaste. Meta: '+hm(mt)+' o más.')+'</p><div class="box row sb" style="padding:8px"><button type="button" class="paso" data-a="numPaso" data-v="-15" aria-label="15 minutos menos">−</button><span class="col" style="align-items:center;gap:2px"><span class="num'+(okn?' acc':'')+'" id="num-val" style="font-size:44px">'+hm(s.val).toUpperCase()+'</span><span style="font-size:13px;color:var(--text3)" id="num-est">'+(okn?'Dentro de tu meta':(esM?'Por encima de tu meta':'Por debajo de tu meta'))+'</span></span><button type="button" class="paso" data-a="numPaso" data-v="15" aria-label="15 minutos más">+</button></div>', cta('GUARDAR','guardarNum','',ic('check'))); break;
    case 'reto': h=retoSheetHTML(s); break;
    case 'confirmar': h=hoja(s.lbl, s.t, '<p class="p2">'+s.p+'</p>', '<div class="grid2">'+cta('NO','cerrarSheet','','','ghost sm')+cta(s.si,s.a,s.v,ic('check'),'sm')+'</div>'); break;
  }
  s.anim=false; return h; }

/* ---------- guía de la primera vez ---------- */
function guiaHTML(){ var g=U.guia, pasos=[
    {h:'Toca cada cosa cuando la hagas.', w:function(){ return '<button type="button" class="fila'+(g.ok?' on pop':'')+'" style="border:var(--borde);border-radius:12px;padding:10px 12px" data-a="guiaHacer" aria-pressed="'+g.ok+'"><span class="bx" aria-hidden="true">'+(g.ok?ic('check',20,3):'')+'</span><span class="col" style="gap:2px"><span class="lbl">EJEMPLO</span><strong style="font-size:15px">Leer un rato</strong><span class="uno"><span class="tg">TU 1%</span><span>10 páginas</span></span></span></button>'+(g.ok?'<p class="nota">Así. Si te equivocas, abajo sale «Deshacer».</p>':'<p class="nota">Tócalo.</p>'); }},
    {h:'Cumple todo y tu curva sube un 1%.', w:function(){ return '<div class="box row sb" style="padding:12px 14px"><span class="col" style="gap:2px"><span class="lbl">Tu curva</span><span style="font-size:13px;color:var(--text2)">Cada día que cumples todo</span></span><span class="num acc gol" style="font-size:34px">+1 %</span></div><p class="nota">Si un día no puedes, no baja: se queda igual. Los días de descanso del gym no cuentan como fallo.</p>'; }},
    {h:'Por la noche, cierras el día.', w:function(){ return cta('CERRAR EL DÍA','','','<span class="small">30 s</span>')+'<p class="nota">Cómo estás y qué has hecho. El botón está siempre abajo en Hoy. Si se te olvida, lo cierras al día siguiente.</p>'; }}
  ];
  if(partidoOn()) pasos.push({h:'Cada semana, tú contra ti.', w:function(){ return '<div class="match" style="flex-direction:row;align-items:center;justify-content:space-between"><span class="col" style="gap:2px"><span class="lbl" style="color:var(--text)">Tú</span><span style="font-size:13px;color:var(--text2)">Esta semana</span></span><span class="sc nw" style="font-size:44px">3 – 1</span><span class="col" style="gap:2px;align-items:flex-end"><span class="lbl" style="color:var(--text)">Tú</span><span style="font-size:13px;color:var(--text2)">Semana pasada</span></span></div><p class="nota">Lo que haces mejor que la semana pasada es gol tuyo. Si no te motiva, se apaga en Ajustes.</p>'; }});
  var p=pasos[g.paso], ult=g.paso===pasos.length-1, dots=''; pasos.forEach(function(_,i){ dots+='<span class="'+(i<=g.paso?'on':'')+'"></span>'; });
  var anim=g.anim; g.anim=false;
  return '<div class="overlay guia-ov" role="dialog" aria-modal="true" aria-label="Cómo funciona"><div class="sheet'+(anim?' anim':'')+'">'+
  '<div class="row sb"><span class="lbl acc">Cómo funciona</span><button type="button" class="link" style="min-height:36px" data-a="guiaSaltar">Saltar</button></div>'+
  '<h2 class="h1" style="font-size:32px;line-height:.98">'+p.h+'</h2><div class="col" style="gap:10px">'+p.w()+'</div>'+
  '<div class="row sb" style="min-height:56px;gap:12px"><span class="dots" aria-hidden="true">'+dots+'</span><button type="button" class="cta sm" style="width:auto;min-height:52px" data-a="guiaSig"><span class="cta-t">'+(ult?'ENTENDIDO':'SIGUIENTE')+'</span></button></div></div></div>'; }

/* ---------- render ---------- */
var TEST = ['bienvenida','plan'].concat(Object.keys(PREG));
var TAB_DE = {hoy:'hoy',partido:'hoy',cierre:'hoy',ajustes:'hoy',atajoPasos:'progreso',pasosHist:'progreso',ajChungo:'hoy',ajCuerpo:'hoy',ajAreas:'hoy',ajGym:'hoy',ajPasos:'hoy',ajMovil:'hoy',ajDejar:'hoy',ajNombre:'hoy',ajTono:'hoy',ajAspecto:'hoy',privacidad:'hoy',
  gym:'gym',entreno:'gym',ejercicios:'gym',ejercicio:'gym',resumen:'gym',story:'gym',historial:'gym',records:'gym',rutinaEd:'gym',
  progreso:'progreso',medallas:'progreso',razones:'hoy',wrap:'hoy',retos:'retos',reto:'retos',nuevoReto:'retos', mister:'mister'};
var TABS = [['hoy','HOY'],['gym','GYM'],['retos','RETOS'],['progreso','PROGRESO'],['mister','MÍSTER']];
function tabbar(cur){ var h='<nav class="tabbar" aria-label="Secciones">'; TABS.forEach(function(t){ h+='<button type="button" class="tb" data-a="tab" data-v="'+t[0]+'"'+(cur===t[0]?' aria-current="page"':'')+'>'+ic(t[0],24,2.2)+'<span>'+t[1]+'</span></button>'; }); return h+'</nav>'; }
var ultimaPant=null, toastT=null, toastPrev='';
function render(){
  if(!D.perfil && TEST.indexOf(U.pantalla)===-1) U.pantalla='bienvenida';
  var scr=document.getElementById('scr'), keep=(ultimaPant===U.pantalla && scr) ? scr.scrollTop : 0;
  var enTest = TEST.indexOf(U.pantalla)!==-1 || U.pantalla==='wrap', tab = enTest ? null : (TAB_DE[U.pantalla]||'hoy');
  var p=D.perfil||{tema:U.t&&U.t.tema, color:U.t&&U.t.color};
  app.dataset.tema = p.tema||'auto'; app.dataset.color = p.color||'amarillo';
  var barra = !enTest && barraCierre(), desc = !enTest && D.actual && D.actual.desc && !U.sheet ? descansoHTML() : '';
  app.classList.toggle('notab', enTest); app.classList.toggle('conbarra', !!barra); app.classList.toggle('condesc', !!desc);
  var vista = V[U.pantalla] ? V[U.pantalla]() : V.hoy();
  app.innerHTML = '<div class="screen'+(ultimaPant!==null && ultimaPant!==U.pantalla?' entra':'')+'" id="scr">'+vista+'</div>'+
    (barra ? '<div class="barra-cta">'+cta('CERRAR EL DÍA','cerrarDia',hoy(),'<span class="small">30 s</span>')+'</div>' : '')+
    desc + (tab ? tabbar(tab) : '') +
    (U.toast ? '<div class="toast row sb'+(U.toast!==toastPrev?' in':'')+(U.golToast?' gol':'')+'" role="status"><span>'+e(U.toast)+'</span>'+(U.undo?'<button type="button" class="link" style="color:var(--onCta) !important;min-height:32px;padding:0 4px" data-a="deshacer">Deshacer</button>':'')+'</div>' : '') +
    sheetHTML() + (U.guia ? guiaHTML() : '') + (U.cele ? celeHTML() : '');
  toastPrev=U.toast;
  document.getElementById('scr').scrollTop = keep;
  U.recien=null; ultimaPant=U.pantalla; pintarFondo();
  if(U.cele){ ajustarGrande(); contarArriba(); } animarCuentas(); figuraAlDia();
  if(D.perfil && U.pantalla==='hoy' && !D.vistos.guiaHoy && !U.guia && !U.sheet){ D.vistos.guiaHoy=1; guardar(); U.guia={paso:0, ok:false, anim:true}; render(); }
}
function pintarFondo(){ try{ document.body.style.background = window.innerWidth<600 ? getComputedStyle(app).getPropertyValue('--bg').trim() : ''; }catch(err){} }
function toast(t, undo){ if(!/^¡Gol/.test(t)) U.golToast=false; U.toast=t; U.undo=undo||null; render(); clearTimeout(toastT); toastT=setTimeout(function(){ U.toast=''; U.undo=null; if(!escribiendo()) render(); else { var tt=app.querySelector('.toast'); if(tt) tt.remove(); } }, undo?4000:2800); }
function escribiendo(){ var a=document.activeElement; return a && (a.tagName==='INPUT'||a.tagName==='TEXTAREA') && app.contains(a) && a.type!=='file'; }
function go(s){ if(TABS.some(function(t){ return t[0]===s; })){ U.hist=[]; } else U.hist.push(U.pantalla); U.prevPant=U.pantalla; U.pantalla=s; U.toast=''; U.sheet=null; render(); }
function back(){ U.toast=''; U.sheet=null; U.prevPant=U.pantalla; if(U.hist.length){ U.pantalla=U.hist.pop(); } else { U.pantalla = D.perfil ? (TAB_DE[U.pantalla]||'hoy') : 'bienvenida'; if(U.pantalla===U.prevPant) U.pantalla = D.perfil?'hoy':'bienvenida'; } render(); }

/* ---------- acciones ---------- */
function marcarTarea(k){ var f=hoy(), d=dia(f,true), antes=cumplido(f);
  if(k==='entreno'){ if(gymEl(f)){ toast('Hecho con tu entreno de hoy.'); return; } U.sheet={tipo:'entrenoHoy', anim:true}; render(); return; }
  if(k==='movil' || k==='sueno'){ var campo=k==='movil'?'movilMin':'suenoMin', md=media7(campo); U.sheet={tipo:'num', k:k, anim:true, val: d[campo]!=null ? d[campo] : (md ? Math.round(md/15)*15 : metaDe(k,f))}; render(); return; }
  if(k==='moverme'){ U.sheet={tipo:'pasos', anim:true, min:!!d.h.moverme}; render(); setTimeout(function(){ var i=document.getElementById('in-pasos'); if(i) i.focus(); },350); return; }
  fijarAreasHoy();
  if(d.h[k]) delete d.h[k]; else { d.h[k]=true; U.recien=k; sonar('marca'); vibrar(15); }
  guardar(); despuesDeMarcar(antes, (d.h[k]?'Hecho: ':'Desmarcado: ')+(k==='minimo'?'lo mínimo':AREAS[k].n.toLowerCase()), k); }
function despuesDeMarcar(antes, txt, k){ var f=hoy();
  if(!antes && cumplido(f)){ var c=cumplidosHasta(f);
    if(!D.vistos['uno-'+f]){ D.vistos['uno-'+f]=1; guardar(); celebrarDia(c,f); var fr=U.cele&&U.cele.frase; decir(fr||'Tu 1% de hoy, hecho.', f); guardar(); if(!U.cele) toast('Tu 1% de hoy, hecho. Curva: +'+pct(c)+' %.', k); return; }
    sonar('hecho'); vibrar([30,40,60]); toast('Tu 1% de hoy, hecho otra vez. Curva: +'+pct(c)+' %.', k); return; }
  if(U.m0 && avisarGol(U.m0)) { U.undo=k; return; }
  toast(txt, k); }
function deshacer(){ var k=U.undo; if(!k) return; var d=dia(hoy(),true); if(d.h[k]) delete d.h[k]; else d.h[k]=true; guardar(); U.undo=null; U.toast=''; render(); }
function empezarApp(){ var t=U.t;
  if(D.perfil){ var viejo=D.perfil, np=perfilDeTest(t); np.creado=viejo.creado; np.partido=viejo.partido; np.pitido=viejo.pitido; if(viejo.descansoTocado) np.descanso=viejo.descanso;
    np.metaMovilMin=viejo.metaMovilMin&&viejo.ajuste&&viejo.ajuste.movil?viejo.metaMovilMin:np.metaMovil*60; np.metaSuenoMin=np.metaSueno*60; np.ajuste=viejo.ajuste||{}; if(viejo.dejar&&np.dejar&&viejo.dejar.que===np.dejar.que){ np.dejar.desde=viejo.dejar.desde; np.dejar.mejor=viejo.dejar.mejor; np.dejar.razones=viejo.dejar.razones; np.dejar.hitos=viejo.dejar.hitos; }
    if(np.dejar && !np.dejar.desde) np.dejar.desde=ahora();
    var aj=viejo.ajuste||{}; if(aj.sueno) np.metaSuenoMin=viejo.metaSuenoMin; if(aj.moverme) np.metaPasos=viejo.metaPasos; np.recordatorio=viejo.recordatorio; np.recUid=viejo.recUid;
    if(viejo.foto) np.foto=viejo.foto;
    D.perfil=np; retoDelTest(t); ponerAlDia(); fijarAreasHoy(); decir('Hecho: app ajustada a lo que me has contado. Seguimos donde lo dejaste.', hoy()); guardar(); U.t={}; U.hist=[]; U.pantalla='hoy'; render(); celebrar({tipo:'mini'}); toast('Plan actualizado. No has perdido nada.'); return; }
  D=nuevoD(); D.perfil=perfilDeTest(t); retoDelTest(t); ponerAlDia(); D.medallas={}; D.nivel=1;
  mensajeDeHoy(); D.ultimaVisita=hoy(); fijarAreasHoy(); guardar(); U.t={}; U.hist=[]; U.pantalla='hoy'; render(); if(NUBE.db) { NUBE.ok=true; nubeSubir(true); } }
function retoDelTest(t){ if(!t.reto || t.reto==='no') return; var R=RETOS[+t.reto]; if(!R || D.retos.some(function(x){ return !x.fin && x.n===R.n; })) return;
  D.retos.push({id:uid(), n:R.n, total:R.total, vale:R.vale, ini:hoy(), fin:null, desde:ahora(), ev:[], vistos:{}, vistosOk:1}); }
function act(a,v,el){
  if(retoAccion(a,v)) return;
  if(D.perfil && (a==='marcar'||a==='guardarPasos'||a==='entrenoFuera'||a==='guardarNum'||a==='guardarDeporte')) U.m0=marcadorHoy(); else U.m0=null;
  if(a.indexOf('t:')===0) return accTest(a.slice(2),v);
  if(a.indexOf('ck:')===0) return accCierre(a.slice(3),v);
  var p=D.perfil, f=hoy(), A=D.actual;
  switch(a){
    case 'go': if(v==='partido') U.semana=null; go(v); break;
    case 'back': back(); break;
    case 'tab': U.hist=[]; U.prevPant=U.pantalla; U.pantalla=v; U.toast=''; U.sheet=null; if(v==='progreso') U.mes=null; if(v==='mister') U.qr=U.qr==='cuesta'?'cuesta':null; render(); if(v==='mister') bajarChat(); break;
    case 'retest': var pp=D.perfil, b=pp.base||{}; U.t={nombre:pp.nombre, edad:typeof pp.edad==='number'?String(pp.edad):'', areas:pp.areas.slice(), diasGym:(pp.diasGym||[]).slice(), dejar:pp.dejar?{que:pp.dejar.que, euros:pp.dejar.euros||''}:{}, deporte:b.deporte, movil:b.movil, sueno:b.sueno, comida:b.comida, pasos:b.pasos, nivel:pp.nivel, objetivo:pp.objetivo, donde:pp.donde, tiempo:pp.tiempo?String(pp.tiempo):null, animo:pp.animo, abandono:pp.abandono, motiva:pp.motiva, tono:pp.tono, celebra:pp.celebra, tema:pp.tema||'auto', color:pp.color||'amarillo', peso:pp.peso!=null?String(pp.peso):'', altura:pp.altura!=null?String(pp.altura):'', chungo:pp.chungo||null, chungoTxt:pp.chungoTxt||'', reto:null, _tonoTocado:true, _celebraTocado:!!pp.celebra}; U.tRetosTodos=false; U.hist=[]; go('nombre'); break;
    case 'ajCelebra': p.celebra=v; p.sonido = v!=='tranqui'; guardar(); render(); if(v==='tope') celebrar({tipo:'mini'}); break;
    case 'probarCele': celebrar({tipo:'record', eyebrow:'Así se celebra un récord', titulo:'¡Récord!', grande:'+1 REPE', sub:'Ejemplo: hoy 60 kg × 11. Antes, 60 kg × 10.', frase:'Así suena cuando lo ganas de verdad.', boton:'ENTENDIDO'}); break;
    case 'testInicio': U.t={areas:[], diasGym:[], tono:'directo', dejar:{}, tema:'auto', color:'amarillo'}; U.tRetosTodos=false; go('nombre'); break;
    case 'testSig': var fl=faltaTest(); if(fl){ toast(fl); break; } go(v); break;
    case 'tRetosTodos': U.tRetosTodos=true; render(); break;
    case 'empezar': empezarApp(); break;
    case 'marcar': marcarTarea(v); break;
    case 'deshacer': deshacer(); break;
    case 'dificil': var d=dia(f,true); fijarAreasHoy(); d.dificil = v==='1'; guardar(); if(v==='1'){ U.qr=null; decir(frase('Día difícil',{},2)||'Hoy, lo mínimo. Con eso vale.', f); guardar(); U.hist=[]; U.pantalla='hoy'; render(); toast('Modo día difícil: hoy, solo lo mínimo.'); } else render(); break;
    case 'cerrarDia': empezarCierre(v||f); go('cierre'); break;
    case 'guardarCierre': guardarCierre(); break;
    case 'cerrarSheet': if(el && el.dataset.fondo && el!==U._clickEl) break; U.sheet=null; render(); break;
    case 'cerrarPitido': D.vistos['pit-'+v]=1; var js=jugadas(v,sumar(v,6)), m=marcador(js); decir(frase(m[0]>m[1]?(m[1]===0&&m[0]>=3?'Pitido final: ganas de calle':'Pitido final: ganas'):(m[0]<m[1]?'Pitido final: pierdes':'Pitido final: empate'),{marcador:m[0]+'–'+m[1]}), f); guardar(); render(); break;
    case 'verSemana': D.vistos['pit-'+v]=1; guardar(); U.semana=v; U.hist.push(U.pantalla); U.pantalla='partido'; render(); break;
    case 'qr': responder(v); break;
    case 'mes': U.mes=v; render(); break;
    case 'guia': U.guia={paso:0, ok:false, anim:true}; render(); break;
    case 'guiaHacer': if(U.guia){ U.guia.ok=!U.guia.ok; if(U.guia.ok){ sonar('marca'); vibrar(15); } render(); } break;
    case 'guiaSig': if(U.guia){ U.guia.paso++; U.guia.ok=false; if(U.guia.paso >= (partidoOn()?4:3)) U.guia=null; render(); } break;
    case 'guiaSaltar': U.guia=null; render(); break;
    case 'copia': descargarCopia(); break;
    case 'copiaLuego': D.vistos['copia-'+v]=1; guardar(); render(); break;
    case 'copiar': var ta=document.getElementById('copia-txt'); try{ navigator.clipboard.writeText(ta.value).then(function(){ D.copia=ahora(); guardar(); toast('Copiado. Pégalo en Notas.'); }, function(){ ta.select(); toast('Selecciónalo y cópialo.'); }); }catch(err){ ta.select(); toast('Selecciónalo y cópialo.'); } break;
    case 'restaurarSi': var fts=U.sheet.fotos||{}; Object.keys(fts).forEach(function(id){ fotoPut(id,fts[id]); if(NUBE.ok) NUBE.db.doc(NUBE.base+'/foto-'+id).set({img:fts[id]}).catch(function(){}); }); D=normalizar(U.sheet.datos); TS_CARGA=D.ts; guardar(); if(NUBE.ok) nubeSubir(true); U.sheet=null; U.hist=[]; U.pantalla='hoy'; render(); toast('Datos recuperados.'); break;
    case 'borrarTodo': U.sheet={tipo:'borrar', anim:true}; render(); break;
    case 'borrarSi': clearTimeout(NUBE.t); NUBE.sucios={}; NUBE.gen++; NUBE.otra=false; var meses=Object.keys(mesesEntrenos()); D.entrenos.forEach(function(x){ if(x.foto||FOTOS[x.id]) fotoDel(x.id); }); D=nuevoD(); try{ localStorage.removeItem(KEY); }catch(err){} if(NUBE.ok){ (async function(){ try{ for(var i=0;i<meses.length;i++) await NUBE.db.doc(NUBE.base+'/ent-'+meses[i]).delete(); await NUBE.db.doc(NUBE.base+'/app').delete(); }catch(err){} })(); }
      U={pantalla:'bienvenida', hist:[], toast:'', sheet:null, t:{}, busca:'', grupo:'Todos', modoEj:'ver', vista:0}; render(); toast('Datos borrados.'); break;
    /* retos */
    case 'nuevoReto': U.nuevoReto={i:+v, cuando:'hoy'}; go('nuevoReto'); break;
    case 'retoCuando': U.nuevoReto.cuando=v; render(); break;
    case 'temaReto': U.temaReto=v; render(); break;
    case 'retoRapido': var rq=v.split('.'), drq=dia(f,true); drq.retos=drq.retos||{}; var rid=rq[0], nuevoV=drq.retos[rid]===rq[1]?null:rq[1]; var rr=D.retos.filter(function(x){ return x.id===rid; })[0], hAntes=rr?hechosReto(rr):0;
      if(nuevoV) drq.retos[rid]=nuevoV; else delete drq.retos[rid]; guardar();
      if(rr && hechosReto(rr)>hAntes){ U.recienReto=rid; sonar('marca'); vibrar([20,40,20]); if(hechosReto(rr)===rr.vale){ render(); celebrar({tipo:'hito', eyebrow:'Reto · '+rr.n, titulo:'¡Ya lo tienes!', grande:rr.vale+'/'+rr.vale, sub:'Has llegado a los '+rr.vale+' días que te valen. Lo que venga, suma.', frase:frase2('Reto: empieza o va por la mitad',{reto:'«'+rr.n+'»'})||'Reto asegurado.', toast:'Reto asegurado: '+rr.n+'.'}); break; } }
      render(); break;
    case 'empezarReto': var R=RETOS[U.nuevoReto.i], r={id:uid(), n:R.n, total:R.total, vale:R.vale, ini: U.nuevoReto.cuando==='hoy'?f:sumar(f,1), fin:null}; D.retos.push(r);
      decir(frase('Reto: empieza o va por la mitad',{reto:'«'+R.n+'»', hecho:'0', meta:String(R.vale), 'días':String(R.total)})||'Reto en marcha: '+R.n.toLowerCase()+'.', f); guardar(); U.hist=[]; U.pantalla='retos'; render(); confeti(30); vibrar(15); toast(r.ini===f?'Reto en marcha desde hoy.':'Apuntado: empieza mañana.'); break;
    case 'verReto': U.retoSel=v; go('reto'); break;
    case 'retoHoy': var dr=dia(f,true); dr.retos=dr.retos||{}; dr.retos[U.retoSel]= dr.retos[U.retoSel]===v ? undefined : v; if(!dr.retos[U.retoSel]) delete dr.retos[U.retoSel]; else if(v==='si'){ sonar('marca'); vibrar(15); } guardar(); render(); break;
    case 'dejarReto': U.sheet={tipo:'confirmar', anim:true, lbl:'Reto', t:'¿Dejar el reto?', p:'Se quita de tu lista. Lo puedes volver a empezar cuando quieras.', si:'DEJARLO', a:'dejarRetoSi', v:v}; render(); break;
    case 'dejarRetoSi': D.retos=D.retos.filter(function(x){ return x.id!==v; }); guardar(); U.sheet=null; back(); toast('Reto dejado.'); break;
    /* ajustes */
    case 'ajArea': var i=p.areas.indexOf(v); if(i!==-1){ if(p.areas.length===1){ toast('Deja al menos una.'); break; } p.areas.splice(i,1); } else { if(p.areas.length>=4){ toast('Como mucho 4. Quita una antes.'); break; } p.areas.push(v);
        if(v==='entreno' && (!p.diasGym||!p.diasGym.length)){ p.diasGym=[0,2,4]; toast('Gym: lunes, miércoles y viernes. Cámbialo en Días de gym.'); }
        if(v==='dejar' && !p.dejar){ p.dejar={que:'otra',euros:0,desde:ahora(),razones:[]}; toast('Elige qué dejas en Ajustes → Qué dejas.'); } }
      p.areas.sort(function(a,b){ return ORDEN_AREAS.indexOf(a)-ORDEN_AREAS.indexOf(b); }); ponerAlDia(); fijarAreasHoy(); guardar(); render(); break;
    case 'ajDia': var j=p.diasGym.indexOf(+v); if(j!==-1){ if(p.diasGym.length===1){ toast('Deja al menos un día.'); break; } p.diasGym.splice(j,1); } else p.diasGym.push(+v); p.diasGym.sort(); fijarAreasHoy(); guardar(); render(); break;
    case 'ajPasos': p.metaPasos=+v; p.ajuste=p.ajuste||{}; p.ajuste.moverme=f; fijarAreasHoy(); guardar(); render(); break;
    case 'ajMovil': p.metaMovilMin=+v; p.ajuste=p.ajuste||{}; p.ajuste.movil=f; fijarAreasHoy(); guardar(); render(); break;
    case 'ajDejar': p.dejar=p.dejar||{euros:0}; if(p.dejar.que!==v){ p.dejar.que=v; p.dejar.desde=ahora(); p.dejar.mejor=0; } guardar(); render(); break;
    case 'ajTono': p.tono=v; guardar(); render(); break;
    case 'ajChungo': p.chungo=v; guardar(); render(); if(v==='propio') setTimeout(function(){ var i=document.getElementById('in-chungo'); if(i) i.focus(); },150); break;
    case 'ajTema': p.tema=v; guardar(); render(); break;
    case 'ajColor': p.color=v; guardar(); render(); break;
    case 'swPartido': p.partido = !partidoOn(); guardar(); render(); break;
    case 'swPitido': p.pitido = p.pitido===false; guardar(); render(); break;
    case 'swSonido': p.sonido = p.sonido===false; guardar(); render(); if(p.sonido) sonar('marca'); break;
    /* gym */
    case 'empezarSheet': U.sheet = D.rutinas.length||D.entrenos.length ? {tipo:'empezar', anim:true} : null; if(!U.sheet) empezarEntreno(); else render(); break;
    case 'empezarBlanco': empezarEntreno(); break;
    case 'empezarRutina': empezarEntreno({rutina:v}); break;
    case 'repetir': empezarEntreno({repetir:v}); break;
    case 'buscarEj': U.modoEj=v; U.busca=''; U.grupo='Todos'; go('ejercicios'); setTimeout(function(){ var i=document.getElementById('in-buscar'); if(i && v!=='ver') i.focus(); },300); break;
    case 'grupoEj': U.grupo=v; render(); break;
    case 'elegirEj': elegirEj(v); break;
    case 'elegirEjDirecto': U.modoEj='add'; elegirEj(v); break;
    case 'crearEj': var nn=U.busca.trim().replace(/\s+/g,' '); if(!nn) break; nn=cap(nn); if(D.propios.indexOf(nn)===-1 && !EJ.some(function(x){ return x[0]===nn; })) D.propios.push(nn); guardar(); if(U.modoEj==='ver'){ U.ejSel=nn; U.vista=0; go('ejercicio'); } else elegirEj(nn); break;
    case 'verEj': U.ejSel=v; U.vista=0; U.pausa=false; go('ejercicio'); break;
    case 'vista': U.vista=+v; U.pausa=false; render(); break;
    case 'pausa': U.pausa=!U.pausa; var ff=app.querySelector('.fig-ej'); if(ff) ff.classList.toggle('pausa', U.pausa); var pb=app.querySelector('.fig-play'); if(pb){ pb.innerHTML=U.pausa?ic('play',16,2.4):ic('pausa',16,3); pb.setAttribute('aria-label',U.pausa?'Seguir la animación':'Parar la animación'); } break;
    case 'fichasTodas': U.fichasTodas=!U.fichasTodas; render(); break;
    case 'serieOk': var q=v.split('.'), s=A.ej[+q[0]].s[+q[1]]; if(!s.ok){ if(!s.r || s.r<=0){ toast('Pon las repeticiones.'); break; } if(s.kg==null) s.kg=0; s.ok=true; A.desc={fin:ahora()+(p.descanso||90)*1000}; U.recienSerie=v; guardar(); if(!recordEnSerie(A.ej[+q[0]], s)){ sonar('marca'); vibrar(15); render(); } else guardar(); } else { s.ok=false; delete s.rec; guardar(); render(); } break;
    case 'cerrarCele': cerrarCele(); break;
    case 'quitarFoto': var xf=D.entrenos.filter(function(y){ return y.id===v; })[0]; fotoDel(v); if(xf){ xf.foto=false; guardar(xf.fecha.slice(0,7)); } render(); toast('Foto quitada.'); break;
    case 'serieMas': var ej=A.ej[+v], u=ej.s[ej.s.length-1]; ej.s.push({kg:u?u.kg:null, r:u?u.r:10, ok:false}); guardar(); render(); break;
    case 'serieMenos': var ej2=A.ej[+v]; if(ej2.s.length>1) ej2.s.pop(); guardar(); render(); break;
    case 'ejMenu': U.sheet={tipo:'ejMenu', i:+v, anim:true}; render(); break;
    case 'ejSubir': var k2=+v, t2=A.ej[k2]; A.ej.splice(k2,1); A.ej.splice(k2-1,0,t2); U.sheet=null; guardar(); render(); break;
    case 'ejQuitar': A.ej.splice(+v,1); U.sheet=null; guardar(); render(); break;
    case 'descMas': if(A && A.desc){ A.desc.fin+= (+v)*1000; p.descansoTocado=true; p.descanso=Math.max(15,Math.min(600,(p.descanso||90)+(+v))); if(A.desc.fin<=ahora()) A.desc=null; guardar(); render(); } break;
    case 'descSaltar': if(A){ A.desc=null; guardar(); render(); } break;
    case 'terminarSheet': U.sheet={tipo:'terminar', anim:true}; render(); break;
    case 'terminarSi': terminarEntreno(); break;
    case 'descartarSheet': U.sheet={tipo:'descartar', anim:true}; render(); break;
    case 'descartarSi': D.actual=null; guardar(); U.sheet=null; U.hist=[]; U.pantalla='gym'; render(); toast('Entreno descartado.'); break;
    case 'verEntreno': U.ultimo=v; U.prevPant='historial'; U.hist.push(U.pantalla); U.pantalla='resumen'; U.sheet=null; render(); break;
    case 'borrarEntreno': U.sheet={tipo:'confirmar', anim:true, lbl:'Entreno', t:'¿Borrar este entreno?', p:'Se quita de tu historial y de tus marcas. No se puede deshacer.', si:'BORRAR', a:'borrarEntrenoSi', v:v}; render(); break;
    case 'borrarEntrenoSi': var bx=D.entrenos.filter(function(x){ return x.id===v; })[0]; fotoDel(v); D.entrenos=D.entrenos.filter(function(x){ return x.id!==v; }); guardar(bx?bx.fecha.slice(0,7):null); U.sheet=null; back(); toast('Entreno borrado.'); break;
    case 'guardarRutina': var ex=D.entrenos.filter(function(x){ return x.id===v; })[0]; if(!ex) break; U.rutinaEd={id:null, nombre:ex.nombre.replace(/^Entreno del \S+$/,''), ej:ex.ej.map(function(x){ return {n:x.n, series:x.s.length, reps:x.s[0][1]||10}; }), desde:ex.id}; go('rutinaEd'); break;
    case 'nuevaRutina': U.rutinaEd={id:null, nombre:'', ej:[]}; go('rutinaEd'); break;
    case 'editarRutina': var rr=D.rutinas.filter(function(x){ return x.id===v; })[0]; U.rutinaEd=JSON.parse(JSON.stringify(rr)); go('rutinaEd'); break;
    case 'rutQuitar': U.rutinaEd.ej.splice(+v,1); render(); break;
    case 'rutNum': var w=v.split('.'), x3=U.rutinaEd.ej[+w[0]]; x3[w[1]]=Math.max(1,Math.min(w[1]==='series'?10:50, x3[w[1]]+(+w[2]))); render(); break;
    case 'guardarRutinaEd': var re=U.rutinaEd; if(!re.nombre.trim()){ toast('Ponle un nombre.'); break; } if(!re.ej.length){ toast('Añade al menos un ejercicio.'); break; }
      var obj={id:re.id||uid(), nombre:re.nombre.trim(), ej:re.ej.map(function(x){ return {n:x.n, series:x.series, reps:x.reps}; })};
      if(re.id) D.rutinas=D.rutinas.map(function(x){ return x.id===re.id?obj:x; }); else D.rutinas.push(obj);
      var mesR=null; if(re.desde){ D.entrenos.forEach(function(x){ if(x.id===re.desde){ x.rutina=obj.id; mesR=x.fecha.slice(0,7); } }); }
      guardar(mesR); U.rutinaEd=null; back(); toast('Rutina guardada: '+obj.nombre+'.'); break;
    case 'borrarRutina': U.sheet={tipo:'confirmar', anim:true, lbl:'Rutina', t:'¿Borrar esta rutina?', p:'Tus entrenos hechos con ella no se borran.', si:'BORRAR', a:'borrarRutinaSi', v:v}; render(); break;
    case 'borrarRutinaSi': D.rutinas=D.rutinas.filter(function(x){ return x.id!==v; }); guardar(); U.sheet=null; U.rutinaEd=null; back(); toast('Rutina borrada.'); break;
    case 'numPaso': var sn=U.sheet; sn.val=Math.max(0,Math.min(24*60,sn.val+(+v))); var ne=document.getElementById('num-val'), est=document.getElementById('num-est'), mtn=metaDe(sn.k,f), okk = sn.k==='movil'? sn.val<=mtn : sn.val>=mtn; if(ne){ ne.textContent=hm(sn.val).toUpperCase(); ne.classList.toggle('acc',okk); } if(est) est.textContent = okk?'Dentro de tu meta':(sn.k==='movil'?'Por encima de tu meta':'Por debajo de tu meta'); vibrar(8); break;
    case 'guardarNum': var dn=dia(f,true), anN=cumplido(f), sk=U.sheet.k; fijarAreasHoy(); dn[sk==='movil'?'movilMin':'suenoMin']=U.sheet.val; U.sheet=null; guardar(); var okN=hecho(sk,f); if(okN){ sonar('marca'); vibrar(15); } despuesDeMarcar(anN, (sk==='movil'?'Móvil: ':'Sueño: ')+hm(dn[sk==='movil'?'movilMin':'suenoMin'])+(okN?'. Dentro de tu meta.':'. Fuera de tu meta.'), null); break;
    case 'comprometo': var dc=dia(f,true); dc.compromiso=true; fijarAreasHoy(); decir(frase2('Buenos días con tu 1%',{uno: tareas(f).length ? tarea(tareas(f)[0],f).meta.toLowerCase() : ''}) || 'Dicho y apuntado. A por ello.', f); guardar(); render(); confeti(35); sonar('marca'); vibrar([15,30,15]); toast('Comprometido. A por tu 1%.'); break;
    case 'verWrap': D.vistos['wrap-'+v]=1; guardar(); U.wrapL=v; U.wrapP=0; go('wrap'); break;
    case 'wrapSig': if((U.wrapP||0) < (+v)-1){ U.wrapP=(U.wrapP||0)+1; vibrar(8); render(); if(U.wrapP===(+v)-1) confeti(50); } break;
    case 'ganas': U.sheet={tipo:'ganas', anim:true, fin:ahora()+600000, reto:v||null}; render(); U.sheet.anim=false; break;
    case 'ganasOk': D.ganas=(D.ganas||0)+1; U.sheet=null; var rg=v?retoPorId(v):null; if(rg){ (rg.ev=rg.ev||[]).push({k:kReto(rg)==='bolleria'?'antojo':'ganas', t:ahora(), f:f}); logrosReto(rg); } decir('Ganas superadas. Llevas '+plural(D.ganas,'vez','veces')+' ganándoles. Cada vez es más fácil.', f); guardar(); render(); celebrar({tipo:'dia', eyebrow:'Más fuerte que las ganas', titulo:'¡Superado!', grande:'×'+D.ganas, sub:'Veces que les has ganado a las ganas.', frase:'Así se hace. La ola ha pasado.', toast:'Ganas superadas.'}); break;
    case 'caida': U.sheet={tipo:'caida', anim:true}; render(); break;
    case 'medalla': U.sheet={tipo:'medalla', anim:true, id:v}; render(); break;
    case 'quitarFotoPerfil': fotoDel('perfil'); D.perfil.foto=false; guardar(); render(); toast('Foto quitada.'); break;
    case 'caidaSi': var pd=p.dejar, dias=(ahora()-pd.desde)/86400000; pd.mejor=Math.max(pd.mejor||0, dias); pd.desde=ahora(); var dk=dia(f,true); delete dk.h.dejar; U.sheet=null; decir('Empezamos de nuevo. Tu mejor marca, '+plural(Math.floor(pd.mejor),'día','días')+', no te la quita nadie. Hoy cuenta igual.', f); guardar(); render(); toast('Contador a cero. Tu mejor marca se queda.'); break;
    case 'addRazon': var ri=document.getElementById('in-razon'), rv=ri?ri.value.trim():''; if(!rv) break; p.dejar.razones=p.dejar.razones||[]; p.dejar.razones.push(rv); guardar(); render(); break;
    case 'quitarRazon': p.dejar.razones.splice(+v,1); guardar(); render(); break;
    case 'serieW': var qw=v.split('.'), sw2=A.ej[+qw[0]].s[+qw[1]]; sw2.w=!sw2.w; if(sw2.w) delete sw2.rec; guardar(); render(); toast(sw2.w?'Serie de calentamiento: no cuenta para récords.':'Ahora cuenta como serie normal.'); break;
    case 'discosSheet': var ej3=A.ej[+v], sx=ej3.s.filter(function(z){ return !z.ok; })[0]||ej3.s[ej3.s.length-1]; U.sheet={tipo:'discos', anim:true, kg:(sx&&sx.kg)||60, barra:20}; render(); break;
    case 'discoKg': U.sheet.kg=Math.max(0,(U.sheet.kg||0)+(+v)); U.sheet.anim=false; render(); break;
    case 'discoBarra': U.sheet.barra=+v; U.sheet.anim=false; render(); break;
    case 'compartir': if(v==='entreno') compartirEntreno(); else compartir(v); break;
    case 'compartirFmt': var sb=U.sheet&&(v==='wa'?U.sheet.bw:U.sheet.bi); if(sb) compartirBlob(sb, 'app1-entreno-'+(v==='wa'?'whatsapp':'stories')+'.png'); break;
    case 'recordatorioSheet': U.sheet={tipo:'recordatorio', anim:true, hora:(p.recordatorio||'22:00')}; render(); break;
    case 'recHora': U.sheet.hora=v; U.sheet.anim=false; render(); break;
    case 'crearRec': crearRecordatorio(U.sheet.hora||'22:00'); break;
    case 'instalarSheet': U.sheet={tipo:'instalar', anim:true}; render(); break;
    case 'cerrarInstalar': D.vistos.instalar=1; guardar(); render(); break;
    case 'pasosMin': U.sheet.min=!U.sheet.min; var pm=app.querySelector('[data-a="pasosMin"]'); if(pm){ pm.classList.toggle('on',U.sheet.min); pm.setAttribute('aria-pressed',U.sheet.min); } break;
    case 'guardarPasos': var dp=dia(f,true), antes=cumplido(f), ps=parseInt(String(U.sheet.pasos!=null?U.sheet.pasos:(dp.pasos!=null?dp.pasos:'')).replace(/\D/g,''),10); fijarAreasHoy();
      dp.pasos = isNaN(ps)?null:ps; if(U.sheet.min) dp.h.moverme=true; else delete dp.h.moverme; U.sheet=null; guardar(); if(hecho('moverme',f)){ sonar('marca'); vibrar(15); } despuesDeMarcar(antes, hecho('moverme',f)?'Moverme: hecho.':'Pasos apuntados.', null); break;
    case 'deporteSheet': U.sheet={tipo:'deporte', anim:true, dep:null, min:null, nombre:'', foto:null}; render(); break;
    case 'depElige': U.sheet.dep=v; U.sheet.anim=false; render(); if(v==='otro') setTimeout(function(){ var i=document.getElementById('in-depn'); if(i) i.focus(); },120); break;
    case 'depMin': U.sheet.min=+v; U.sheet.anim=false; render(); break;
    case 'depFotoQuitar': U.sheet.foto=null; U.sheet.anim=false; render(); break;
    case 'guardarDeporte': var sd=U.sheet; if(!sd.dep || !sd.min){ toast('Elige el deporte y cuánto rato.'); break; } if(sd.dep==='otro' && !String(sd.nombre||'').trim()){ toast('Dime qué deporte.'); break; }
      var antD=cumplido(f), xd={id:uid(), fecha:f, t:ahora(), dep:sd.dep, nombre:sd.dep==='otro'?String(sd.nombre).trim():'', min:sd.min, foto:!!sd.foto}; D.deportes=D.deportes||[]; D.deportes.push(xd);
      if(sd.foto){ fotoPut(xd.id, sd.foto); if(NUBE.ok){ NUBE.db.doc(NUBE.base+'/foto-'+xd.id).set({img:sd.foto}).catch(function(){}); } }
      U.sheet=null; fijarAreasHoy(); guardar(); sonar('marca'); vibrar([20,40,20]); evaluarRetos();
      decir(cap(nombreDeporte(xd).toLowerCase())+', '+hm(xd.min)+'. Cuenta como tu entreno de hoy: unas '+num(kcalDeporte(xd))+' kcal.', f); guardar();
      if(!celebrarSemanaGym(f)) despuesDeMarcar(antD, nombreDeporte(xd)+': '+hm(xd.min)+'. Cuenta como entreno.', null); else render(); break;
    case 'verDeporte': U.sheet={tipo:'verDeporte', id:v, anim:true}; render(); break;
    case 'borrarDeporte': U.sheet={tipo:'confirmar', anim:true, lbl:'Deporte', t:'¿Borrarlo?', p:'Se quita de tu historial. Si era tu entreno de hoy, ya no cuenta.', si:'BORRAR', a:'borrarDeporteSi', v:v}; render(); break;
    case 'borrarDeporteSi': fotoDel(v); D.deportes=(D.deportes||[]).filter(function(x){ return x.id!==v; }); fijarAreasHoy(); U.sheet=null; guardar(); render(); toast('Borrado.'); break;
    case 'kcalInfo': U.sheet={tipo:'kcalInfo', anim:true}; render(); break;
    case 'pegarPasos': (function(){ var fin=function(t){ var n=parseInt(String(t||'').replace(/[^\d]/g,''),10); if(isNaN(n) || n>200000){ toast('Lo copiado no son pasos. Usa el Atajo o escríbelos.'); return; } U.sheet.pasos=String(n); var i=document.getElementById('in-pasos'); if(i) i.value=n; toast('Pegado: '+num(n)+' pasos. Toca Guardar.'); };
      try{ navigator.clipboard.readText().then(fin, function(){ toast('No me deja leer lo copiado. Escríbelos a mano.'); }); }catch(err){ toast('No me deja leer lo copiado. Escríbelos a mano.'); } })(); break;
    case 'entrenoFuera': var de=dia(f,true), an=cumplido(f); fijarAreasHoy(); if(de.h.entreno) delete de.h.entreno; else de.h.entreno=true; U.sheet=null; guardar(); despuesDeMarcar(an, de.h.entreno?'Gym: hecho fuera.':'Gym: desmarcado.', null); break;
  }
}
function elegirEj(n){ if(U.modoEj==='rutina'){ if(U.rutinaEd.ej.some(function(x){ return x.n===n; })){ toast('Ya está en la rutina.'); return; } var s=seriesPrevias(n); U.rutinaEd.ej.push({n:n, series:s?s.length:3, reps:s?s[0][1]:10}); back(); return; }
  if(!D.actual) empezarEntreno();
  if(D.actual.ej.some(function(x){ return x.n===n; })){ toast('Ya está en el entreno.'); return; }
  D.actual.ej.push(nuevoEjercicio(n)); guardar(); U.hist=[]; U.pantalla='entreno'; U.prevPant='ejercicios'; render();
  var cards=app.querySelectorAll('.ejcard'); if(cards.length){ cards[cards.length-1].scrollIntoView({block:'center'}); } }
function accTest(k,v){ var t=U.t;
  if(PREG[k] && PREG[k].ops){ t[k]=v;
    if(k==='motiva' && !t._tonoTocado){ t.tono = v==='apretar' ? 'exigente' : 'directo'; t._tonoSug = v==='apretar'; }
    if(k==='motiva' && !t._celebraTocado){ t.celebra = v==='celebrar' ? 'tope' : (v==='numeros'?'normal':(t.celebra||null)); }
    if(k==='celebra') t._celebraTocado=true;
    if(k==='celebra' && v==='tope'){ celebrar({tipo:'mini'}); }
    render(); return; }
  if(k==='tema') t.tema=v;
  if(k==='color') t.color=v;
  if(k==='area'){ var i=t.areas.indexOf(v); if(i!==-1) t.areas.splice(i,1); else { var mx=D.perfil?4:3; if(t.areas.length>=mx){ toast(mx===3?'Como mucho tres para empezar. Toca una para quitarla.':'Como mucho 4. Quita una antes.'); return; } t.areas.push(v); } t.areas.sort(function(a,b){ return ORDEN_AREAS.indexOf(a)-ORDEN_AREAS.indexOf(b); }); }
  if(k==='dia'){ var j=t.diasGym.indexOf(+v); if(j!==-1) t.diasGym.splice(j,1); else t.diasGym.push(+v); t.diasGym.sort(); }
  if(k==='pasos') t.metaPasos=+v;
  if(k==='dejar'){ t.dejar=t.dejar||{}; t.dejar.que=v; }
  if(k==='area' && t.areas.indexOf('dejar')!==-1 && t.dejar && t.dejar.que==='nada') t.dejar.que=null;
  if(k==='animo') t.animo=v;
  if(k==='chungo'){ t.chungo=v; if(v==='propio') setTimeout(function(){ var i=document.getElementById('in-chungo'); if(i) i.focus(); },150); }
  if(k==='reto') t.reto=v;
  if(k==='tono'){ t.tono=v; t._tonoTocado=true; t._tonoSug=false; }
  render(); }
function accCierre(k,v){ var c=U.ck;
  if(k==='feliz') c.feliz=+v;
  else if(k==='emo') c.emo = c.emo===v ? null : v;
  else if(k==='h'){ c.h[v] = !c.h[v]; }
  else if(k.indexOf('h.')===0){ var a=k.slice(2), val = v==='si'; c.h[a] = (c.h[a]===val) ? undefined : val; }
  else if(k==='num'){ var q=v.split('.'), campo=q[0]==='movil'?'movilMin':'suenoMin', base = c[campo]!=null ? c[campo] : (media7(campo, U.cierreDe) ? Math.round(media7(campo,U.cierreDe)/15)*15 : metaDe(q[0], U.cierreDe)); c[campo] = c[campo]==null ? base : Math.max(0, Math.min(24*60, base+(+q[1]))); }
  else if(k.indexOf('r.')===0){ var id=k.slice(2); c.retos[id] = c.retos[id]===v ? undefined : v; if(!c.retos[id]) delete c.retos[id]; }
  render(); }

/* ---------- eventos ---------- */
app.addEventListener('click', function(ev){ var t=ev.target.closest('[data-a]'); if(!t || !app.contains(t)) return; if(t.tagName==='A') return;
  if(t.dataset.fondo && ev.target!==t) return; /* clic dentro de la hoja, no en el fondo */
  if(!t.dataset.a) return;
  if(t.classList.contains('off') && (t.dataset.a==='testSig' || t.dataset.a==='guardarCierre' || t.dataset.a==='guardarRutinaEd')){ var msg = t.dataset.a==='testSig' ? faltaTest() : (t.dataset.a==='guardarCierre' ? 'Toca cómo de feliz has estado. Con eso ya vale.' : 'Ponle nombre y al menos un ejercicio.'); toast(msg); return; }
  U._clickEl=t; act(t.dataset.a, t.dataset.v, t); });
var guardarT=null, pendiente=false; function guardarPronto(){ pendiente=true; clearTimeout(guardarT); guardarT=setTimeout(function(){ pendiente=false; guardar(); }, 600); }
function vaciarPendiente(){ if(pendiente && D.perfil){ clearTimeout(guardarT); pendiente=false; guardar(); } }
app.addEventListener('input', function(ev){ var t=ev.target, k=t.dataset && t.dataset.in; if(!k) return; var v=t.value;
  if(k==='t.nombre'){ U.t.nombre=v; var b=app.querySelector('#scr .cta'); if(b) b.classList.toggle('off', !v.trim()); }
  else if(k==='t.euros'){ U.t.dejar=U.t.dejar||{}; U.t.dejar.euros=v; }
  else if(k==='t.peso' || k==='t.altura'){ U.t[k.slice(2)]=v.replace(/[^\d,.]/g,''); var b3=app.querySelector('#scr .cta'); if(b3) b3.classList.toggle('off', !!faltaTest()); }
  else if(k==='t.chungoTxt'){ U.t.chungoTxt=v; var b4=app.querySelector('#scr .cta'); if(b4) b4.classList.toggle('off', !!faltaTest()); }
  else if(k==='p.chungoTxt'){ D.perfil.chungoTxt=v.trim(); guardarPronto(); }
  else if(k==='p.peso' || k==='p.altura'){ var cq=k.slice(2), nv=numCuerpo(v), okc = cq==='peso' ? (nv==null || (nv>=30&&nv<=250)) : (nv==null || (nv>=120&&nv<=230)); if(okc){ D.perfil[cq] = nv==null?null:(cq==='altura'?Math.round(nv):nv); guardarPronto(); } }
  else if(k==='t.edad'){ U.t.edad=v.replace(/\D/g,''); var b2=app.querySelector('#scr .cta'); if(b2) b2.classList.toggle('off', !!faltaTest()); var av=document.getElementById('edad-aviso'), ne=parseInt(U.t.edad,10); if(av) av.hidden = !(ne<16); }
  else if(k==='ck.pasos'){ U.ck.pasos=v; }
  else if(k.indexOf('rq.')===0 && U.rq){ U.rq[k.slice(3)]=v; var bq=app.querySelector('#scr .cta'); if(bq) bq.classList.toggle('off', !retoCfgOk()); }
  else if(k.indexOf('rs.')===0 && U.sheet){ U.sheet[k.slice(3)]=v; }
  else if(k==='ck.nota'){ U.ck.nota=v; }
  else if(k==='p.nombre'){ if(v.trim()){ D.perfil.nombre=v.trim(); guardarPronto(); } }
  else if(k==='p.euros'){ var n=parseFloat(v.replace(',','.')); D.perfil.dejar=D.perfil.dejar||{que:'otra'}; D.perfil.dejar.euros=isNaN(n)?0:n; guardarPronto(); }
  else if(k==='act.nombre'){ if(D.actual){ D.actual.nombre=v; guardarPronto(); } }
  else if(k==='rut.nombre'){ U.rutinaEd.nombre=v; var c=app.querySelector('[data-a="guardarRutinaEd"]'); if(c) c.classList.toggle('off', !(v.trim()&&U.rutinaEd.ej.length)); }
  else if(k==='busca'){ U.busca=v; var l=document.getElementById('ej-lista'); if(l) l.innerHTML=listaEj(); }
  else if(k==='sh.pasos'){ if(U.sheet) U.sheet.pasos=v; }
  else if(k==='sh.nombre'){ if(U.sheet){ U.sheet.nombre=v; var cg=app.querySelector('[data-a="guardarDeporte"]'); if(cg) cg.classList.toggle('off', !(U.sheet.dep&&U.sheet.min&&v.trim())); } }
  else if(k==='sh.hora'){ if(U.sheet) U.sheet.hora=v; }
  else if(k==='razon'){ }
  else if(k.indexOf('s.')===0){ var q=k.split('.'), s=D.actual && D.actual.ej[+q[1]] && D.actual.ej[+q[1]].s[+q[2]]; if(!s) return;
    if(q[3]==='kg'){ var x=parseFloat(v.replace(',','.')); s.kg = (v.trim()===''||isNaN(x)) ? null : Math.max(0,x); }
    else { var r=parseInt(v,10); s.r = isNaN(r) ? null : Math.max(0,r); }
    guardarPronto(); }
});
app.addEventListener('keydown', function(ev){ var t=ev.target; if(ev.key!=='Enter' || !t.classList || !t.classList.contains('sin')) return; ev.preventDefault();
  var ins=[].slice.call(app.querySelectorAll('input.sin')), i=ins.indexOf(t); if(i>=0 && i<ins.length-1) ins[i+1].focus(); else t.blur(); });
app.addEventListener('change', function(ev){ var t=ev.target; if(t.dataset && t.dataset.f==='foto' && t.files && t.files[0]){ fotoDeArchivo(t.dataset.id, t.files[0]); t.value=''; return; }
  if(t.dataset && t.dataset.f==='depFoto' && t.files && t.files[0]){ var fl=t.files[0]; t.value=''; comprimir(fl).then(function(u){ if(U.sheet && U.sheet.tipo==='deporte'){ U.sheet.foto=u; U.sheet.anim=false; render(); } }, function(){ toast('No he podido leer esa foto. Prueba con otra.'); }); return; }
  if(t.dataset && t.dataset.f==='perfilFoto' && t.files && t.files[0]){ var fp=t.files[0]; t.value=''; fotoPerfil(fp); return; }
  if(t.dataset && t.dataset.f==='restaurar' && t.files && t.files[0]){ var fr=new FileReader(); fr.onload=function(){ restaurarDe(String(fr.result)); }; fr.readAsText(t.files[0]); t.value=''; } });

/* ---------- deslizar desde el borde izquierdo para volver, como en el iPhone ---------- */
var SW=null;
function puedeVolver(){ if(U.cele || U.guia) return false; if(U.sheet) return U.sheet.tipo!=='cerrado';
  if(!D.perfil) return TEST.indexOf(U.pantalla)!==-1 && U.pantalla!=='bienvenida';
  if(U.pantalla==='wrap') return true; return !TABS.some(function(t){ return t[0]===U.pantalla; }); }
function swEl(){ return U.sheet ? app.querySelector('.overlay .sheet') : document.getElementById('scr'); }
app.addEventListener('touchstart', function(ev){ SW=null; if(ev.touches.length!==1) return; var t=ev.touches[0]; if(t.clientX>28 || !puedeVolver()) return; SW={x:t.clientX, y:t.clientY, dx:0, on:false, t0:Date.now()}; }, {passive:true});
app.addEventListener('touchmove', function(ev){ if(!SW) return; var t=ev.touches[0], dx=t.clientX-SW.x, dy=t.clientY-SW.y;
  if(!SW.on){ if(Math.abs(dy)>14 && Math.abs(dy)>dx){ SW=null; return; } if(dx>12){ SW.on=true; SW.el=swEl(); if(SW.el){ SW.el.style.transition='none'; SW.el.style.willChange='transform'; } } }
  if(SW.on && SW.el){ SW.dx=Math.max(0,dx); SW.el.style.transform='translate3d('+SW.dx+'px,0,0)'; } }, {passive:true});
function swFin(ok){ var w=SW; SW=null; if(!w || !w.on || !w.el) return; var el=w.el, vel=w.dx/Math.max(1,Date.now()-w.t0);
  var vale = ok && (w.dx>90 || (w.dx>40 && vel>0.5)), dur=menosMov?0:200;
  el.style.transition='transform '+dur+'ms cubic-bezier(.2,.8,.2,1)';
  if(vale){ el.style.transform='translate3d('+window.innerWidth+'px,0,0)'; setTimeout(function(){ el.style.transform=''; el.style.transition=''; el.style.willChange=''; if(U.sheet){ U.sheet=null; render(); } else back(); vibrar(8); }, dur); }
  else { el.style.transform=''; setTimeout(function(){ el.style.transition=''; el.style.willChange=''; }, dur); } }
app.addEventListener('touchend', function(){ swFin(true); }, {passive:true});
app.addEventListener('touchcancel', function(){ swFin(false); }, {passive:true});

/* ---------- reloj: cronómetro, descanso y cambio de día ---------- */
U.dia = hoy();
function nuevoDia(){ if(!D.perfil) return; if(U.dia!==hoy()){ U.dia=hoy(); mensajeDeHoy(); evaluarRetos(); ajustarMetas(); D.ultimaVisita=hoy(); fijarAreasHoy(); guardar(); if(!escribiendo()) render(); } }
setInterval(function(){
  var a=D.actual;
  if(a){ var c=document.getElementById('crono'); if(c) c.textContent=cronoTxt(); var c2=document.getElementById('crono2'); if(c2) c2.textContent=cronoTxt();
    if(a.desc){ var q=Math.round((a.desc.fin-ahora())/1000), d=document.getElementById('desc'); if(d) d.textContent=mmss(q);
      if(q<=0){ a.desc=null; guardar(); sonar('descanso'); vibrar([60,60,120]); if(escribiendo()){ var b=app.querySelector('.descanso'); if(b) b.remove(); app.classList.remove('condesc'); } else toast('Descanso terminado. A por la siguiente.'); } } }
}, 1000);
setInterval(nuevoDia, 20000);
setInterval(function(){ var p=D.perfil; var el=document.getElementById('dejar-cnt'); if(el && p && p.dejar) el.textContent=contador(ahora()-p.dejar.desde).toUpperCase();
  var g=document.getElementById('ganas-cnt'); if(g && U.sheet && U.sheet.tipo==='ganas'){ var q=Math.round((U.sheet.fin-ahora())/1000); g.textContent=mmss(q); if(q<=0 && !U.sheet.fin0){ U.sheet.fin0=true; vibrar([40,60,40]); sonar('hecho'); g.textContent='¡10 MIN!'; } }
  if(p && !U.cele && !U.sheet && !U.guia && !escribiendo() && U.pantalla==='hoy') revisarHitosDejar(); }, 1000);
document.addEventListener('visibilitychange', function(){ if(document.hidden) vaciarPendiente(); else nuevoDia(); });
window.addEventListener('pagehide', vaciarPendiente);
window.addEventListener('resize', pintarFondo);
try{ window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', pintarFondo); }catch(err){}

/* ---------- pasos que llegan por la dirección (Atajo de Salud) ---------- */
function pasosDeURL(){ try{ var q=new URLSearchParams(location.search), v=q.get('pasos'); if(v==null) return;
  q.delete('pasos'); var fq=q.get('f'); q.delete('f'); history.replaceState(null,'', location.pathname+(q.toString()?'?'+q.toString():'')+location.hash);
  var n=parseInt(String(v).replace(/[^\d]/g,''),10), f=(fq && /^\d{4}-\d{2}-\d{2}$/.test(fq) && fq<=hoy() && fq>=inicio()) ? fq : hoy(); if(!D.perfil || isNaN(n) || n>200000) return;
  var antes=cumplido(f), d=dia(f,true); if(f===hoy()) fijarAreasHoy(); d.pasos=n; guardar();
  setTimeout(function(){ if(f===hoy()) despuesDeMarcar(antes, 'Pasos de Salud: '+num(n)+(hecho('moverme',f)?'. Moverme, hecho.':'.'), null); else toast('Pasos de Salud: '+num(n)+'.'); }, 900); }catch(err){} }

/* ---------- arranque ---------- */
if(D.perfil){ ponerAlDia(); if(D.actual && D.actual.desc && D.actual.desc.fin<ahora()) D.actual.desc=null; mensajeDeHoy(); evaluarRetos(); ajustarMetas(); revisarMedallas(!D.medallas); D.ultimaVisita=hoy(); fijarAreasHoy(); guardar(); if(D.actual) U.pantalla='hoy'; }
render(); pasosDeURL();
nubeIniciar(); fotosCargar();
})();
