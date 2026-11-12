/* ouverture en haut de page : sans defilement doux, renforce apres chaque rendu */
try{history.scrollRestoration="manual"}catch(e){}
function haut(){ if(location.hash) return; try{ document.documentElement.style.scrollBehavior="auto"; window.scrollTo({top:0,left:0,behavior:"instant"}); document.documentElement.scrollTop=0; document.body.scrollTop=0; const t=document.querySelector(".topstrip"); if(t&&t.scrollIntoView) t.scrollIntoView({block:"start",behavior:"instant"}); }catch(e){ window.scrollTo(0,0); } }
haut();
window.addEventListener("pageshow",haut);
document.addEventListener("DOMContentLoaded",()=>{ haut(); [60,250,700,1500].forEach(ms=>setTimeout(()=>{ if(!window._pnScrolled) haut(); },ms)); });
window.addEventListener("load",haut);
["wheel","touchstart","keydown","mousedown"].forEach(ev=>window.addEventListener(ev,()=>{window._pnScrolled=true},{once:true,passive:true}));
/* PronoNexa - composants communs : navigation, cookies (RGPD), assistant SAV, gestion d'erreurs */
const CONFIG = { SAV_ENDPOINT: "", /* URL d'un agent IA hebergé (optionnel). Vide = assistant à base de réponses intégrées */
  EMAIL: "doumer938002@gmail.com", PUB_ACTIVES: false /* mettre true seulement apres accord ANJ/regie + consentement */ };
const $ = s => document.querySelector(s);
function nav(){ const f=location.pathname.split("/").pop()||"index.html"; document.querySelectorAll("nav.main a").forEach(a=>{ if(a.getAttribute("href")===f) a.setAttribute("aria-current","page"); }); const b=$(".menu-b"), n=$("nav.main"); if(b) b.onclick=()=>{const o=n.classList.toggle("on"); b.setAttribute("aria-expanded",o)}; }
/* --- cookies : refus aussi simple que l'acceptation, rien de publicitaire avant consentement --- */
function cookies(){ let c; try{c=localStorage.getItem("pn_cookies")}catch(e){}
  if(c){ if(c==="oui") window.dispatchEvent(new Event("pn-consent")); return; }
  const d=document.createElement("div"); d.id="ck"; d.setAttribute("role","dialog"); d.setAttribute("aria-label","Cookies");
  d.innerHTML='<p><b>Vos choix sur les cookies.</b> Ce site utilise uniquement des cookies techniques. Avec votre accord, nous pourrons aussi afficher des publicités de partenaires et mesurer l’audience. <a href="cookies.html">En savoir plus</a></p><div class="row"><button class="btn" data-v="oui">Tout accepter</button><button class="btn ghost" data-v="non">Tout refuser</button></div>';
  document.body.appendChild(d); d.style.display="block";
  d.onclick=e=>{const v=e.target.dataset.v; if(!v) return; try{localStorage.setItem("pn_cookies",v)}catch(x){} d.remove(); if(v==="oui") window.dispatchEvent(new Event("pn-consent"));};
}
function rouvrirCookies(){ try{localStorage.removeItem("pn_cookies")}catch(e){} location.reload(); }
/* --- encarts partenaires : n'affichent rien tant que pas de consentement + PUB_ACTIVES --- */
function pubs(){ document.querySelectorAll(".pubslot").forEach(el=>{ const ok=localStorage.getItem("pn_cookies")==="oui"&&CONFIG.PUB_ACTIVES; el.hidden=!ok&&!el.dataset.demo; }); }
/* --- assistant SAV --- */
const FAQ=[
 [/mot de passe|connexion|connecter|login/i,"Mot de passe oublié ? Depuis l’appli, écrivez-nous via « Signaler un problème » avec votre e-mail : nous réinitialisons votre accès sous 48 h."],
 [/install|apk|telecharg|télécharg|android|iphone|ios|appli/i,"PronoNexa est pour l’instant un site pour ordinateur. Une application arrivera plus tard : suivez les actualités sur la page d’accueil."],
 [/gagn|garanti|sûr|sur\b|fiable|pari/i,"Les pronostics de NEXA sont des estimations statistiques à titre indicatif : aucun gain n’est garanti, et PronoNexa ne prend aucun pari. Jouez avec modération."],
 [/donn[ée]es|rgpd|supprim|effacer|compte/i,"Vous pouvez demander l’accès, la correction ou la suppression de vos données à tout moment (RGPD) via le formulaire de contact ou "+CONFIG.EMAIL+". Réponse sous 30 jours maximum."],
 [/pub|partenaire|affili/i,"Certaines pages affichent des liens de partenaires agréés ANJ ; PronoNexa peut être rémunérée si vous vous inscrivez. Cela n’influence pas les pronostics. Détails sur la page Partenaires."],
 [/addict|aide|probl[eè]me de jeu|perd|dette/i,"Si le jeu vous pose problème, appelez Joueurs Info Service au 09 74 75 13 13 (appel non surtaxé, 7j/7) ou rendez-vous sur joueurs-info-service.fr. Vous pouvez aussi demander une interdiction volontaire de jeux sur anj.fr."],
 [/bug|erreur|marche pas|plante|bloqu/i,"Désolé pour ça ! Essayez d’actualiser la page ou de vider le cache. Si le problème persiste, décrivez-le ici : je transmets un ticket avec la page et le code d’erreur."]];
function sav(){ const b=document.createElement("button"); b.id="sav-b"; b.setAttribute("aria-label","Ouvrir l’assistant d’aide"); b.textContent="💬";
 const w=document.createElement("div"); w.id="sav"; w.setAttribute("role","dialog"); w.setAttribute("aria-label","Assistant PronoNexa");
 w.innerHTML='<header><span>🤖 NEXA · Assistance</span><button aria-label="Fermer" style="background:none;border:0;color:#fff;font-size:18px;cursor:pointer">✕</button></header><div class="log" aria-live="polite"></div><div class="sug"></div><form><input aria-label="Votre question" placeholder="Posez votre question…" maxlength="400"><button class="btn" style="padding:8px 14px">Envoyer</button></form>';
 document.body.append(b,w); const log=w.querySelector(".log"), inp=w.querySelector("input");
 const say=(t,c)=>{const m=document.createElement("div"); m.className="m "+c; m.textContent=t; log.appendChild(m); log.scrollTop=1e9;};
 const tickets=()=>{try{return JSON.parse(localStorage.getItem("pn_tickets")||"[]")}catch(e){return[]}};
 async function repondre(q){ say(q,"u");
  if(CONFIG.SAV_ENDPOINT){ try{ const r=await fetch(CONFIG.SAV_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({q,page:location.pathname})}); const j=await r.json(); return say(j.reponse||"Je n’ai pas de réponse.","b"); }catch(e){ journalErreur("sav",e); } }
  const f=FAQ.find(x=>x[0].test(q)); if(f) return say(f[1],"b");
  const t=tickets(); t.push({q,page:location.pathname,date:new Date().toISOString()}); try{localStorage.setItem("pn_tickets",JSON.stringify(t))}catch(e){}
  say("Je n’ai pas de réponse sûre à cette question. Écrivez-nous à "+CONFIG.EMAIL+" en précisant votre demande : un humain vous répondra.","b"); }
 b.onclick=()=>{w.classList.toggle("on"); if(!log.children.length){ say("Bonjour, je suis NEXA 👋 Je réponds sur le site, votre compte, vos données et le jeu responsable.","b"); const s=w.querySelector(".sug"); ["Comment ça marche","Mes données","Les pronostics sont-ils garantis ?","J’ai un problème de jeu"].forEach(t=>{const x=document.createElement("button"); x.type="button"; x.textContent=t; x.onclick=()=>repondre(t); s.appendChild(x);}); } };
 w.querySelector("header button").onclick=()=>w.classList.remove("on");
 w.querySelector("form").onsubmit=e=>{e.preventDefault(); const q=inp.value.trim(); if(q){inp.value=""; repondre(q);} };
}
/* --- gestion des erreurs : journal local + message clair, sans casser la page --- */
function journalErreur(src,e){ try{ const L=JSON.parse(localStorage.getItem("pn_erreurs")||"[]"); L.push({src,msg:String(e&&e.message||e),page:location.pathname,t:new Date().toISOString()}); localStorage.setItem("pn_erreurs",JSON.stringify(L.slice(-30))); }catch(x){} }
window.addEventListener("error",e=>journalErreur("js",e.error||e.message));
window.addEventListener("unhandledrejection",e=>journalErreur("promesse",e.reason));
document.addEventListener("DOMContentLoaded",()=>{nav();cookies();sav();pubs();});
window.addEventListener("pn-consent",pubs);
