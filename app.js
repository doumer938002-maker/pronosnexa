/* PronoNexa : affichage des pronostics NEXA (données lues dans data/pronos.json) */
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pc=(x,d=0)=>x==null?"–":(x*100).toFixed(d).replace(".",",")+" %";
function fusionLive(D,L){ if(!D||!L||!L.courses) return D; let n=0;
  (D.courses||[]).forEach(c=>{ const l=L.courses[c.id]; if(!l) return; c.partants.forEach(p=>{ const q=l.partants&&l.partants[String(p.num)]; if(!q) return; if(q.cote) p.cote=q.cote; if(q.np) p.np=true; });
    if(l.arrivee&&l.arrivee.length){ c.arrivee=l.arrivee; n++; } });
  (D.tickets||[]).forEach(t=>{ const l=L.courses[t.course&&(D.courses.find(c=>c.label===t.course&&c.hippo===t.hippo)||{}).id]; if(l&&l.arrivee&&l.arrivee.length){ t.arrivee=l.arrivee; t.statut="terminee"; } });
  D.live_maj=L.maj; return D; }
async function charger(){ let D=null; try{ const r=await fetch("data/pronos.json",{cache:"no-store"}); if(!r.ok) throw new Error(r.status); D=await r.json(); }
  catch(e){ if(typeof journalErreur==="function") journalErreur("data",e); D=window.PRONOS_FALLBACK||null; }
  try{ const r=await fetch("data/live.json",{cache:"no-store"}); if(r.ok) D=fusionLive(D,await r.json()); }catch(e){}
  return D; }
function spark(v,w=84,h=26){ if(!v||v.length<2) return ""; const mn=Math.min(...v),mx=Math.max(...v),r=mx-mn||1;
  const pts=v.map((y,i)=>`${(i/(v.length-1)*w).toFixed(1)},${(h-3-(y-mn)/r*(h-6)).toFixed(1)}`).join(" ");
  const down=v[v.length-1]<v[0]; return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline fill="none" stroke="${down?'#9dff3c':'#ff8a7a'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="${pts}"/></svg>`; }
function gauge(p,label){ const R=44,C=2*Math.PI*R; return `<div class="gauge"><svg viewBox="0 0 110 110" width="120" height="120" role="img" aria-label="${esc(label)} ${pc(p)}"><circle cx="55" cy="55" r="${R}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="10"/><circle class="gv" cx="55" cy="55" r="${R}" fill="none" stroke="url(#gg)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-to="${C*(1-p)}" transform="rotate(-90 55 55)"/><defs><linearGradient id="gg"><stop offset="0" stop-color="#4aa3ff"/><stop offset="1" stop-color="#9dff3c"/></linearGradient></defs><text x="55" y="61" text-anchor="middle" fill="#fff" font-family="Bricolage Grotesque,sans-serif" font-weight="800" font-size="22">${(p*100).toFixed(0)}%</text></svg><small>${esc(label)}</small></div>`; }
const _meteo={};
const CIEL=c=>c<20?"Dégagé":c<60?"Peu nuageux":c<90?"Nuageux":"Couvert";
async function meteoLive(root){ root.querySelectorAll(".cond[data-lat]").forEach(async el=>{ const la=el.dataset.lat,lo=el.dataset.lon,k=la+","+lo;
  try{ if(!_meteo[k]) _meteo[k]=fetch(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&current=temperature_2m,precipitation,wind_speed_10m,cloud_cover&timezone=Europe%2FParis`).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()});
    const j=(await _meteo[k]).current; if(!j||!el.isConnected) return;
    el.querySelector(".mt").textContent=`${CIEL(j.cloud_cover)} · ${Math.round(j.temperature_2m)}°C`; el.querySelector(".mv").textContent=`${Math.round(j.wind_speed_10m)} km/h`; el.querySelector(".mp").textContent=`${j.precipitation} mm`; el.classList.add("live");
  }catch(e){ if(typeof journalErreur==="function") journalErreur("meteo",e); } }); }
function animer(root=document){ meteoLive(root); root.querySelectorAll(".gv").forEach(c=>requestAnimationFrame(()=>{c.style.transition="stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)";c.style.strokeDashoffset=c.dataset.to;}));
  root.querySelectorAll("[data-count]").forEach(el=>{ const to=+el.dataset.count,d=el.dataset.dec|0,t0=performance.now(); const f=t=>{const k=Math.min(1,(t-t0)/1200),e=1-Math.pow(1-k,3);el.textContent=(to*e).toFixed(d).replace(".",",")+(el.dataset.suf||"");if(k<1)requestAnimationFrame(f)};requestAnimationFrame(f);});
  root.querySelectorAll(".bar2 i").forEach(b=>{const w=b.dataset.w;b.style.width="0";requestAnimationFrame(()=>requestAnimationFrame(()=>{b.style.transition="width .9s ease";b.style.width=w;}));}); }
function bandeauStats(S){ if(!S) return ""; return `<div class="ia-stats"><div class="ia-g">${gauge(S.gagnant_top3,"Vainqueur dans le top 3 de NEXA")}${gauge(S.gagnant_top1,"1er choix gagnant")}${gauge(S.place_top1,"1er choix placé")}</div>
<div class="ia-n"><div><b data-count="${S.courses}">0</b><span>courses analysées</span></div><div><b data-count="${S.jours}">0</b><span>jours de suivi</span></div><div><b data-count="${((S.gagnant_top1/S.favori_marche-1)*100).toFixed(0)}" data-suf=" %">0</b><span>de victoires de plus que le favori des cotes</span></div></div></div>`; }
const nc=v=>esc(v==null||v===""?"n.c.":v);
function detail(p){ if(!p.pere&&!p.entraineur&&!p.proprietaire) return ""; return `<details class="dt"><summary>Fiche complète</summary><dl><div><dt>Père</dt><dd>${nc(p.pere)}</dd></div><div><dt>Mère</dt><dd>${nc(p.mere)}</dd></div><div><dt>Propriétaire</dt><dd>${nc(p.proprietaire)}</dd></div><div><dt>Écurie</dt><dd>${nc(p.ecurie)}</dd></div><div><dt>Entraîneur</dt><dd>${nc(p.entraineur)}</dd></div><div><dt>Âge</dt><dd>${esc(p.age)} ans</dd></div><div><dt>Ferrure</dt><dd>${nc(p.deferre)}</dd></div><div><dt>Œillères</dt><dd>${nc(p.oeilleres)}</dd></div><div><dt>Carrière</dt><dd>${esc(p.victoires)} vict. / ${esc(p.courses)} courses</dd></div></dl></details>`; }
const _ok=x=>/^#[0-9a-f]{3,6}$/i.test(x||"")?x:null;
function bulle(num,cas,cls=""){ const c=(cas||[]).map(_ok).filter(Boolean); const bg=c.length>1?`linear-gradient(135deg,${c[0]} 0 50%,${c[1]} 50% 100%)`:(c[0]||"var(--lime)");
  return `<span class="nb bl ${cls}" style="background:${bg}" title="Casaque du jockey">${esc(num)}</span>`; }
const PN={map:{}};
function indexer(D){ [...(D.courses||[]),...(D.quintes?[...D.quintes.aujourdhui,...D.quintes.demain]:[])].forEach(c=>{ const m={}; (c.partants||[]).forEach(p=>m[p.num]=p); PN.map[c.label]=m; }); }
function carte(p,rang,max){ const cn=p.proba>0?1/p.proba:null, ec=cn&&p.cote?p.cote/cn:1;
  const tag=ec>=1.3?['sous','Sous-estimé par le marché']:ec<=.8?['sur','Très joué']:['eq','Cote cohérente'];
  return `<article class="hc ${rang<=3?'top':''}"><div class="rk">${rang}</div>${bulle(p.num,p.casaque,"lg")}
<div class="hi"><h3>${esc(p.nom)}</h3><small>${esc(p.jockey)}</small><div class="forme"><span class="cas" title="Casaque">${(p.casaque||[]).map(x=>`<u style="background:${/^#[0-9a-f]{3,6}$/i.test(x)?x:"#888"}"></u>`).join("")}</span>${(p.forme||[]).map(f=>`<i class="f${/^[123]$/.test(f)?' g':''}">${esc(f)}</i>`).join("")}</div></div>
<div class="hp"><div class="pl"><b>${pc(p.proba,1)}</b><span>victoire</span></div><div class="bar2"><i data-w="${Math.min(100,p.proba*320)}%"></i></div><small>Top 3 : ${pc(p.top3)}</small></div>
<div class="hc2"><div><small>Cote marché</small><b>${p.cote==null?"–":p.cote}</b></div><div><small>Cote NEXA</small><b>${cn?cn.toFixed(1).replace(".",","):"–"}</b></div>${spark(p.evol)}<span class="vt ${tag[0]}">${tag[1]}</span></div>${detail(p)}</article>`; }
function conditions(c){ if(!c.meteo) return ""; const m=c.meteo; return `<div class="cond" ${c.lat!=null?`data-lat="${+c.lat}" data-lon="${+c.lon}"`:""}><div><small>Terrain</small><b>${esc(c.terrain)}</b></div><div><small>Pénétromètre</small><b>${esc(c.penetrometre)}</b></div><div><small>Météo</small><b class="mt">${esc(m.ciel)} · ${esc(m.temp)}°C</b></div><div><small>Vent</small><b class="mv">${esc(m.vent)} km/h</b></div><div><small>Pluie</small><b class="mp">${esc(m.pluie_mm)} mm</b></div></div>`; }
function rendreCourse(c,tri){ const L=[...c.partants].sort((a,b)=>tri==="num"?a.num-b.num:b.proba-a.proba);
  return `<div class="ch"><h2>${esc(c.label)} · ${esc(c.hippo)}</h2><span class="pill b">${esc(c.discipline)}</span><span class="pill">${esc(c.heure)}</span>${c.quinte?'<span class="pill q">Quinté+</span>':""}</div>
${conditions(c)}<div class="list">${L.map((p,i)=>carte(p,tri==="num"?[...c.partants].sort((a,b)=>b.proba-a.proba).findIndex(x=>x.num===p.num)+1:i+1)).join("")}</div>`; }
function pagePronos(D,sel){ const el=document.getElementById("pronos"); if(!el) return; let cur=0,tri="rang";
  const draw=()=>{ el.innerHTML=`${bandeauStats(D.stats)}<div class="tabs2" role="tablist">${D.courses.filter(c=>!sel||c.quinte===(sel==="quinte")).map((c,i)=>`<button role="tab" aria-selected="${i===cur}" data-i="${i}">${esc(c.heure)} <b>${esc(c.label)}</b></button>`).join("")}<span class="sp"></span><label>Trier <select id="tri"><option value="rang">Par probabilité</option><option value="num">Par numéro</option></select></label></div><div id="cc"></div>`;
    const L=D.courses.filter(c=>!sel||c.quinte===(sel==="quinte")); const cc=el.querySelector("#cc"); if(!L.length){cc.innerHTML='<div class="card"><p>Aucune course à afficher pour le moment.</p></div>';return;}
    cc.innerHTML=rendreCourse(L[cur],tri); el.querySelector("#tri").value=tri;
    el.querySelectorAll(".tabs2 button").forEach(b=>b.onclick=()=>{cur=+b.dataset.i;draw();}); el.querySelector("#tri").onchange=e=>{tri=e.target.value;draw();}; animer(el); };
  draw(); }
function pageStats(D){ const el=document.getElementById("stats"); if(!el) return; const S=D.stats,h=S.derniers_30j||[]; const w=560,H=150,mx=Math.max(...h,.4);
  const pts=h.map((y,i)=>`${(i/(h.length-1)*w).toFixed(1)},${(H-10-y/mx*(H-24)).toFixed(1)}`).join(" ");
  const cmp=(l,a,b)=>`<div class="cmp"><b>${l}</b><div class="bar2 big"><i data-w="${a*300}%"></i><em>NEXA ${pc(a)}</em></div><div class="bar2 big mk"><i data-w="${b*300}%"></i><em>Favori des cotes ${pc(b)}</em></div></div>`;
  el.innerHTML=`${bandeauStats(S)}<div class="grid" style="grid-template-columns:1fr 1fr"><div class="card"><h3>NEXA contre le favori du marché</h3>${cmp("Gagnant",S.gagnant_top1,S.favori_marche)}${cmp("Placé",S.place_top1,S.favori_marche_place)}<p class="note2">Mesuré sur des courses que l’IA n’avait jamais vues.</p></div>
<div class="card"><h3>Réussite sur 30 jours (1er choix gagnant)</h3><svg viewBox="0 0 ${w} ${H}" width="100%" role="img" aria-label="Courbe de réussite sur 30 jours"><polyline fill="none" stroke="#9dff3c" stroke-width="3" stroke-linejoin="round" points="${pts}"/><polyline fill="rgba(157,255,60,.12)" stroke="none" points="0,${H} ${pts} ${w},${H}"/></svg><p class="note2">Les creux sont publiés comme les pics.</p></div></div>
<div class="notice" style="margin-top:20px">Ces statistiques décrivent le passé. <b>Elles ne garantissent aucun résultat futur</b> et PronoNexa ne prend aucun pari.</div>`; animer(el); }
function pageResultats(D){ const el=document.getElementById("resultats"); if(!el) return; const T={gagnant:["pill","Gagnant ✔"],place:["pill b","Placé"],rate:["pill r","Raté"]};
  el.innerHTML=`<table class="t"><thead><tr><th>Course</th><th>Arrivée</th><th>1er choix NEXA</th><th>Résultat</th></tr></thead><tbody>${D.resultats.map(r=>`<tr><td>${esc(r.course)}</td><td>${r.arrivee.map(esc).join(" · ")}</td><td>n°${esc(r.nexa_top1)}</td><td><span class="${T[r.statut][0]}">${T[r.statut][1]}</span></td></tr>`).join("")}</tbody></table>`; }
function accueil(D){ const el=document.getElementById("home-ia"); if(!el) return; el.innerHTML=bandeauStats(D.stats); animer(el);
  const t=document.getElementById("home-top"); if(t){ const c=D.courses.find(x=>x.quinte)||D.courses[0]; t.innerHTML=rendreCourse({...c,partants:[...c.partants].sort((a,b)=>b.proba-a.proba).slice(0,5)},"rang"); animer(t);} }
document.addEventListener("DOMContentLoaded",async()=>{ const D=await charger(); if(D) indexer(D); const ban=document.querySelectorAll(".demo-slot");
  if(!D){ document.querySelectorAll("#pronos,#stats,#resultats,#home-ia,#home-top").forEach(e=>e.innerHTML='<div class="card"><p>Les données sont momentanément indisponibles. Réessayez dans quelques minutes.</p></div>'); return; }
  if(D.demo) ban.forEach(b=>b.innerHTML='<div class="demo">⚙️ <b>Données d’exemple.</b> Chevaux, probabilités et statistiques sont fictifs ; ils seront remplacés par les vrais calculs de NEXA.</div>');
  pagePronos(D,document.getElementById("pronos")?.dataset.sel||""); pageStats(D); pageResultats(D); accueil(D); });
