/* App 1% · idiomas
   La app está escrita en español. Este archivo, si el idioma no es el español,
   traduce lo que sale en pantalla con el diccionario de i18n/<idioma>.js:
   - textos exactos ("Cerrar el día" -> "Close the day");
   - textos con números o nombres ("Llevas 5 días" -> "5 days in"), con huecos {0}, {1}…;
   - las frases de Míster se cambian antes de rellenarlas (I18N_TR);
   - fechas, números, dinero y teléfonos de ayuda según el país.
   Por dentro todo sigue en español (claves, datos guardados), así que cambiar de
   idioma no toca nada de lo guardado. */
(function(){
'use strict';
var LKEY = 'app1pct.lang';
var IDIOMAS = { es:'Español', en:'English', fr:'Français', de:'Deutsch', pt:'Português' };

/* ---------- qué idioma y qué país ---------- */
function elegido(){ try{ return localStorage.getItem(LKEY) || 'auto'; }catch(e){ return 'auto'; } }
function delMovil(){
  var ls = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || 'es'];
  for(var i=0;i<ls.length;i++){ var c=String(ls[i]||'').toLowerCase().slice(0,2); if(IDIOMAS[c]) return { l:c, tag:String(ls[i]) }; }
  return { l:'en', tag:String(ls[0]||'en') };
}
var el = elegido(), mv = delMovil();
var LANG = (el!=='auto' && IDIOMAS[el]) ? el : mv.l;
var region = (function(){ var tag = mv.l===LANG ? mv.tag : ''; var m = /[-_]([A-Za-z]{2})\b/.exec(tag); return m ? m[1].toUpperCase() : ''; })();
var POR_DEFECTO = { es:'ES', en:'US', fr:'FR', de:'DE', pt:'BR' };
var PAISES_OK = { es:['ES'], en:['US','GB','IE','CA','AU','NZ'], fr:['FR','BE','CH','CA'], de:['DE','AT','CH'], pt:['BR','PT'] };
if(PAISES_OK[LANG].indexOf(region)===-1) region = POR_DEFECTO[LANG];

/* Ayuda, emergencias y moneda por país. f = cuánto se multiplican los importes de ejemplo. */
var PAIS = {
  ES:{ linea:'024', lineaN:'Línea 024', em:'112', mon:'EUR', f:1 },
  US:{ linea:'988', lineaN:'the 988 Lifeline', em:'911', mon:'USD', f:1 },
  CA:{ linea:'988', lineaN:'the 988 helpline', em:'911', mon:'CAD', f:1 },
  GB:{ linea:'116 123', lineaN:'Samaritans (116 123)', em:'999', mon:'GBP', f:1 },
  IE:{ linea:'116 123', lineaN:'Samaritans (116 123)', em:'112', mon:'EUR', f:1 },
  AU:{ linea:'13 11 14', lineaN:'Lifeline (13 11 14)', em:'000', mon:'AUD', f:1 },
  NZ:{ linea:'1737', lineaN:'the 1737 helpline', em:'111', mon:'NZD', f:1 },
  FR:{ linea:'3114', lineaN:'3114', em:'112', mon:'EUR', f:1 },
  BE:{ linea:'0800 32 123', lineaN:'0800 32 123', em:'112', mon:'EUR', f:1 },
  CH:{ linea:'143', lineaN:(LANG==='de'?'Dargebotene Hand (143)':'143'), em:'112', mon:'CHF', f:1 },
  DE:{ linea:'0800 111 0 111', lineaN:'TelefonSeelsorge (0800 111 0 111)', em:'112', mon:'EUR', f:1 },
  AT:{ linea:'142', lineaN:'TelefonSeelsorge (142)', em:'112', mon:'EUR', f:1 },
  BR:{ linea:'188', lineaN:'CVV (188)', em:'192', mon:'BRL', f:3 },
  PT:{ linea:'808 24 24 24', lineaN:'SNS 24 (808 24 24 24)', em:'112', mon:'EUR', f:1 }
};
var P = PAIS[region] || PAIS.ES;
document.documentElement.lang = LANG + (LANG==='pt' ? '-'+region : '');

/* API pública mínima: idioma actual, lista y cambio */
window.I18N_INFO = { lang:LANG, region:region, elegido:el, idiomas:IDIOMAS, pais:P,
  poner:function(c){ try{ if(c==='auto') localStorage.removeItem(LKEY); else localStorage.setItem(LKEY,c); }catch(e){} location.reload(); } };

if(LANG==='es' || !window.I18N || window.I18N.lang!==LANG){ window.I18N_TR=null; return; }
var DIC = window.I18N;

/* ---------- formatos ---------- */
var DEC = LANG==='en' ? '.' : ',', MIL = LANG==='en' ? ',' : (LANG==='fr' ? ' ' : '.');
if(region==='CH' && LANG==='de') MIL = '’';
function grupos(s){ return s.replace(/\B(?=(\d{3})+(?!\d))/g, MIL); }
function num(x,dec){ if(x==null||isNaN(x)) return '—'; var r = dec ? Math.round(x*10)/10 : Math.round(x); var p=String(Math.abs(r)).split('.'); return (r<0?'−':'')+grupos(p[0])+(p[1]?DEC+p[1]:''); }
function kg(x){ if(x==null||x==='') return '—'; return String(Math.round(x*100)/100).replace('.', DEC); }
var SIMB = { EUR:'€', USD:'$', CAD:'$', AUD:'$', NZD:'$', GBP:'£', CHF:'CHF', BRL:'R$' };
function moneda(n){
  if(P.mon==='EUR') return LANG==='en' ? '€'+n : n+'\u00a0€';
  if(P.mon==='CHF' || P.mon==='BRL') return SIMB[P.mon]+'\u00a0'+n;
  return SIMB[P.mon]+n;
}
function eur(x){ var v=(Math.round(x*100)/100).toFixed(2).split('.'); return moneda(grupos(v[0])+DEC+v[1]); }
function eur0(x){ return x>=100 ? moneda(num(Math.round(x))) : eur(x); }
/* "12,50 €" o "12 €" que llegan escritos en español -> moneda del país */
function cambiaEuros(s){
  return s.replace(/(\d[\d.,\u202f]*)\s?€/g, function(m,n){ if(LANG==='en' && /^\d+,\d{1,2}$/.test(n)) n=n.replace(',','.'); return moneda(n); });
}

var LOC = DIC.loc; /* días, meses y fechas */
window.I18N_LOC = {
  lang:LANG, dias:LOC.dias, diasC:LOC.diasC, meses:LOC.meses,
  fechaLarga:function(d, ds){ return LOC.larga(d, ds); },
  fechaCorta:function(d){ return LOC.corta(d); },
  num:num, kg:kg, eur:eur, eur0:eur0, moneda:moneda, f:P.f,
  val:function(v){ return v==null ? v : traducir(String(v)); },
  escalar:escalar
};

/* importes de ejemplo de los retos y equivalencias, a la escala del país */
function bonito(v){ if(v<10) return Math.round(v); if(v<100) return Math.round(v/5)*5; if(v<1000) return Math.round(v/10)*10; return Math.round(v/100)*100; }
function escalar(PREG, EQ){
  var f=P.f; if(!f || f===1) return;
  var DINERO = { eur:1, precio:1, mes:1, sem:1, perd:1 };
  function ops(l){ return l.map(function(o){ return (typeof o[0]==='number' && o[0]>0) ? [bonito(o[0]*f), moneda(num(bonito(o[0]*f)))] : o; }); }
  Object.keys(PREG).forEach(function(k){ PREG[k].forEach(function(q){ if(!DINERO[q.id]) return;
    if(typeof q.ops==='function'){ var fo=q.ops; q.ops=function(c){ return ops(fo(c)); }; } else if(q.ops) q.ops=ops(q.ops);
    if(typeof q.def==='number' && q.def>0) q.def=bonito(q.def*f); }); });
  if(EQ) EQ.forEach(function(q){ q[0]=bonito(q[0]*f); });
}

/* ---------- diccionario ---------- */
var EXACTO = Object.create(null), MIN = Object.create(null), PATS = [];
var HUECO = /\{(\d+)\}/g;
function esc(s){ return s.replace(/[.*+?^$()|[\]\\]/g,'\\$&'); }
function cargar(obj){
  for(var k in obj){ var v=obj[k]; if(v==null || v==='') continue;
    if(/\{\d+\}/.test(k)){
      var partes=k.split(/\{\d+\}/), largo='';
      partes.forEach(function(p){ if(p.length>largo.length) largo=p; });
      if(!/[A-Za-zÀ-ÿ]/.test(largo) || /\}\{/.test(k)) continue;
      var orden=[]; k.replace(HUECO,function(m,n){ orden.push(+n); return m; });
      var re = new RegExp('^'+partes.map(esc).join('(.+?)')+'$');
      PATS.push({ re:re, ancla:largo, orden:orden, t:v, n:k.length });
      EXACTO[k]=v;
    } else {
      EXACTO[k]=v; MIN[k.toLowerCase()]=v;
      if(/\d/.test(k)) generaliza(k,v);
    }
  }
}
/* "10 páginas" -> también vale para "12 páginas" */
var NUMK = /\d+(?:[.,]\d+)*/g;
function generaliza(k,v){
  var a=k.match(NUMK)||[], b=v.match(NUMK)||[];
  if(!a.length || a.length!==b.length) return;
  var dig=function(x){ return x.replace(/\D/g,''); }, usado=[], mapa=[];
  for(var i=0;i<a.length;i++){ var j=-1; for(var q=0;q<b.length;q++){ if(!usado[q] && dig(b[q])===dig(a[i])){ j=q; break; } } if(j<0) return; usado[j]=1; mapa[j]=i; }
  var n=0, k2=k.replace(NUMK,function(){ return '{'+(n++)+'}'; });
  var m=0, v2=v.replace(NUMK,function(){ return '{'+mapa[m++]+'}'; });
  if(EXACTO[k2]==null){ EXACTO[k2]=v2; MIN[k2.toLowerCase()]=v2; }
}
cargar(DIC.ui || {});
PATS.sort(function(a,b){ return b.n-a.n; });

/* frases de Míster: se cambian antes de rellenar los huecos */
var BANCO = DIC.banco || {};
window.I18N_TR = function(s){ return (s && BANCO[s]!=null) ? BANCO[s] : s; };

/* ---------- traducir un texto ---------- */
var MEMO = new Map(), FALLOS = new Set(), FALLOS_C = new Set();
function mayus(s){ return s.toLocaleUpperCase(LANG); }
function caso(orig, t){
  if(orig===orig.toLocaleUpperCase('es') && orig!==orig.toLocaleLowerCase('es')) return mayus(t);
  var c=orig.charAt(0); if(c!==c.toLocaleLowerCase('es')) return t.charAt(0).toLocaleUpperCase(LANG)+t.slice(1);
  if(LANG!=='de' && c===c.toLocaleLowerCase('es') && c!==c.toLocaleUpperCase('es')) return t.charAt(0).toLocaleLowerCase(LANG)+t.slice(1);
  return t;
}
function exacto(s){
  if(EXACTO[s]!=null) return EXACTO[s];
  var m=MIN[s.toLowerCase()]; if(m!=null) return caso(s, m);
  return null;
}
/* listas: "el gym y moverte y dejarlo" -> "the gym, moving and quitting" */
var Y = { en:' and ', fr:' et ', de:' und ', pt:' e ' }[LANG];
function porLista(s){
  if(!/ y |, /.test(s)) return null;
  var ps=s.split(/, | y /); if(ps.length<2) return null;
  var out=[];
  for(var i=0;i<ps.length;i++){ var t=uno(ps[i]); if(t==null) return null; out.push(t); }
  return out.slice(0,-1).join(', ')+Y+out[out.length-1];
}
var NUM = /\d+(?:[.,]\d+)*/g;
function porNumeros(s){
  /* "Llevas 5 días" -> clave "Llevas {0} días" */
  var nums=[], k=s.replace(NUM, function(m){ nums.push(m); return '{'+(nums.length-1)+'}'; });
  if(!nums.length) return null;
  var t=EXACTO[k];
  if(t==null){ var m=MIN[k.toLowerCase()]; if(m!=null) t=caso(s,m); }
  if(t==null) return null;
  return t.replace(HUECO, function(x,i){ return nums[+i]!=null ? fmtNum(nums[+i]) : x; });
}
function fmtNum(n){ return n; } /* num(), kg() y eur() ya dan el formato del idioma */
/* señales de que un trozo sigue en español */
var ES_RE = /[ñ¿¡]|\b(?:el|y|los|las|con|para|por|una|ya|día|días|has|ningún|aún|muy|pero|más|lo|hoy|semana|tu|te)\b/i;
function porPatron(s){
  for(var i=0;i<PATS.length;i++){ var p=PATS[i];
    if(s.indexOf(p.ancla)===-1) continue;
    var m=p.re.exec(s); if(!m) continue;
    var caps=m.slice(1);
    /* un hueco no puede tragarse otra frase: eso lo resuelve porTrozos */
    if(caps.some(function(c){ return c && /[.!?:] (?![A-Za-zÀ-ÿ]{3,5}(?:\.|$))/.test(c); })) continue;
    var mal=false;
    var r=p.t.replace(HUECO, function(x,j){ var c=caps[+j]; if(c==null) return x; if(/^[\d\s.,%−+-]+$/.test(c)) return fmtNum(c); var tc=traducir(c); if(tc===c && ES_RE.test(c)) mal=true; return tc; });
    if(mal) continue;
    return r;
  }
  return null;
}
var SEP = / · | — | – |: |\. /;
function porTrozos(s){
  if(!SEP.test(s)) return null;
  /* fechas como "15. Nov." o "nov. ·" no son final de frase */
  var PD='\u2024';
  s=s.replace(/(\d)\. (?=[A-ZÄÖÜa-zäöüéû]{3,5}\.)/g,'$1'+PD+' ').replace(/(\b[A-Za-zÀ-ÿ]{3,5})\.(?= ·|,| \d)/g,'$1'+PD);
  var tr=s.split(/( · | — | – |: |\. )/), out='', ok=false;
  for(var q=0;q<tr.length;q++) tr[q]=tr[q].split(PD).join('.');
  for(var i=0;i<tr.length;i++){
    var x=tr[i];
    if(i%2){ out+=(x===': ' && LANG==='fr') ? '\u00a0: ' : x; continue; }
    if(!x) continue;
    if(!/[A-Za-zÀ-ÿ]/.test(x)){ out+=x; continue; }
    var t=null;
    if(tr[i+1]==='. '){ t=uno(x+'.'); if(t!=null) t=t.replace(/\.$/,''); }
    if(t==null && tr[i+1]===': '){ t=uno(x+':'); if(t!=null) t=t.replace(/\s?:$/,''); }
    if(t==null) t=uno(x);
    if(t==null && i===tr.length-1 && /[.!?]$/.test(x)){ var t0=uno(x.replace(/[.!?]$/,'')); if(t0!=null) t=t0+x.slice(-1); }
    if(t==null) return null;
    out+=t; ok=true;
  }
  return ok ? out : null;
}
function uno(s){
  return exacto(s) || porNumeros(s) || porPatron(s);
}
var prof=0;
function traducir(s){
  if(MEMO.has(s)) return MEMO.get(s);
  var lim=s.replace(/^[\s ]+|[\s ]+$/g,'');
  if(!lim || !/[A-Za-zÀ-ÿ¿¡€]/.test(lim)){ return s; }
  var r=null;
  if(++prof<6){
    var lk=lim.replace(/ /g,' ');
    r = uno(lk) || porTrozos(lk) || porLista(lk);
    if(r==null){ var pm=/^([·•—–:,.]+\s*)(.+)$/.exec(lk); if(pm){ var r2=traducir(pm[2]); if(r2!==pm[2]) r=pm[1]+r2; } }
    if(r==null){ var sm=/^(.+?)([:.,;]+)$/.exec(lk); if(sm){ var r3=uno(sm[1]); if(r3!=null) r=r3+sm[2]; } }
    if(r==null && lim==='€') r=SIMB[P.mon];
  }
  prof--;
  var out;
  if(r==null){ out=s; if(window.I18N_DEBUG) FALLOS.add(lim); }
  else out = s.slice(0, s.indexOf(lim.charAt(0))) + r + s.slice(s.lastIndexOf(lim.charAt(lim.length-1))+1);
  out = fichas(out);
  if(MEMO.size>20000) MEMO.clear();
  MEMO.set(s,out); if(out!==s) MEMO.set(out,out);
  return out;
}
/* teléfonos y moneda del país */
function fichas(s){
  if(s.indexOf('⟦')!==-1){ s=s.replace(/⟦linea⟧/g,P.linea).replace(/⟦lineaN⟧/g,P.lineaN).replace(/⟦em⟧/g,P.em); if(LANG==='en') s=s.replace(/(^|[.!?]\s+)the /g, function(m,a){ return a+'The '; }); }
  if(s.indexOf('€')!==-1 && (P.mon!=='EUR' || LANG==='en')) s=cambiaEuros(s);
  return s;
}
window.I18N_T = traducir;
window.I18N_FALLOS = FALLOS; window.I18N_FALLOS_C = FALLOS_C;

/* ---------- barrer la pantalla ---------- */
var HECHO = new WeakMap();
var ATTRS = ['placeholder','aria-label','title','alt'];
var SALTA = { SCRIPT:1, STYLE:1, TEXTAREA:1, INPUT:1, CODE:1, NOSCRIPT:1 };
/* etiquetas de la barra de abajo: más cortas donde no caben */
var TABT = ({ fr:{ 'HOY':'ACCUEIL' }, de:{ 'PROGRESO':'VERLAUF' } })[LANG] || {};
function nodoTexto(n){
  var v=n.nodeValue; if(!v || HECHO.get(n)===v) return;
  var p=n.parentNode; if(p && (SALTA[p.nodeName] || (p.closest && p.closest('[data-noi18n],[contenteditable="true"]')))) return;
  var t=(p && p.parentNode && p.parentNode.classList && p.parentNode.classList.contains('tb') && TABT[v]) || traducir(v); if(t!==v) n.nodeValue=t; HECHO.set(n,t);
}
function atributos(e){
  for(var i=0;i<ATTRS.length;i++){ var a=ATTRS[i]; if(!e.hasAttribute(a)) continue; var v=e.getAttribute(a), t=traducir(v); if(t!==v) e.setAttribute(a,t); }
  if(e.nodeName==='INPUT' && (e.type==='button'||e.type==='submit') && e.value){ var t2=traducir(e.value); if(t2!==e.value) e.value=t2; }
}
/* frases partidas por un resaltado: "Un <span>1%</span> mejor cada día." -> clave "Un <0> mejor cada día." */
var COMP = DIC.comp || {}, HAYCOMP = Object.keys(COMP).length>0;
var INLINE = { SPAN:1, B:1, STRONG:1, EM:1, I:1 };
function compuesta(e){
  if(!HAYCOMP || e.childNodes.length<2 || e.childNodes.length>9 || HECHO.get(e)) return;
  var k='', els=[], ok=false, n;
  for(var i=0;i<e.childNodes.length;i++){ n=e.childNodes[i];
    if(n.nodeType===3) k+=n.nodeValue;
    else if(n.nodeType===1 && INLINE[n.nodeName] && n.children.length===0){ k+='<'+els.length+'>'; els.push(n); ok=true; }
    else return; }
  if(!ok) return;
  k=k.replace(/[\s\u00a0]+/g,' ').trim();
  if(!/[A-Za-zÀ-ÿ]{2}/.test(k.replace(/<\d+>/g,''))) return;
  var nums=[], t=COMP[k];
  if(t==null){ var k2=k.split(/(<\d+>)/).map(function(x){ return /^<\d+>$/.test(x) ? x : x.replace(NUM, function(m){ nums.push(m); return '{'+(nums.length-1)+'}'; }); }).join(''); t=COMP[k2];
    if(t==null){ if(window.I18N_DEBUG) FALLOS_C.add(k2); return; }
    t=t.replace(HUECO, function(x,i){ return nums[+i]!=null ? nums[+i] : x; }); }
  HECHO.set(e,1);
  var partes=t.split(/(<\d+>)/), frag=document.createDocumentFragment();
  partes.forEach(function(p){ var m=/^<(\d+)>$/.exec(p); if(m){ var x=els[+m[1]]; if(x) frag.appendChild(x); } else if(p){ var tn=document.createTextNode(p); HECHO.set(tn,p); frag.appendChild(tn); } });
  while(e.firstChild) e.removeChild(e.firstChild);
  e.appendChild(frag);
}
function barrer(raiz){
  if(!raiz) return;
  if(raiz.nodeType===3){ nodoTexto(raiz); return; }
  if(raiz.nodeType!==1) return;
  if(SALTA[raiz.nodeName]){ if(raiz.nodeName==='INPUT'||raiz.nodeName==='TEXTAREA') atributos(raiz); return; }
  if(raiz.closest && raiz.closest('[data-noi18n]')) return;
  atributos(raiz); compuesta(raiz);
  var w=document.createTreeWalker(raiz, NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT, null), n;
  while((n=w.nextNode())){ if(n.nodeType===3) nodoTexto(n); else if(!SALTA[n.nodeName]){ atributos(n); compuesta(n); } else if(n.nodeName==='INPUT'||n.nodeName==='TEXTAREA') atributos(n); }
}
window.I18N_RT = { barrer:barrer, traducir:traducir };

var obs = new MutationObserver(function(ms){
  for(var i=0;i<ms.length;i++){ var m=ms[i];
    if(m.type==='characterData') nodoTexto(m.target);
    else if(m.type==='attributes'){ if(m.target.nodeType===1) atributos(m.target); }
    else for(var j=0;j<m.addedNodes.length;j++) barrer(m.addedNodes[j]);
  }
});
function arrancar(){ barrer(document.body); obs.observe(document.body, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:ATTRS }); }
if(document.body) arrancar(); else document.addEventListener('DOMContentLoaded', arrancar);
document.title = traducir(document.title);

/* ---------- textos pintados en las tarjetas (canvas) ---------- */
try{
  var C2=CanvasRenderingContext2D.prototype, fT=C2.fillText, sT=C2.strokeText, mT=C2.measureText;
  C2.fillText=function(t){ arguments[0]=traducir(String(t)); return fT.apply(this, arguments); };
  C2.strokeText=function(t){ arguments[0]=traducir(String(t)); return sT.apply(this, arguments); };
  C2.measureText=function(t){ return mT.call(this, traducir(String(t))); };
}catch(e){}

/* ---------- ejercicios: que el buscador entienda el idioma ---------- */
window.I18N_DATOS = function(){
  try{
    if(!window.EJ) return;
    var sin=function(t){ return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]/g,' '); };
    window.EJ.forEach(function(x){
      var extra=[x[0], x[1], x[2]].concat(String(x[3]).split(', ')).map(function(t){ var r=EXACTO[t]; return r? sin(r) : ''; }).join(' ');
      var al = DIC.alias && DIC.alias[x[0]];
      x[4] = x[4]+' '+extra+(al?' '+sin(al):'');
    });
  }catch(e){}
};
})();
