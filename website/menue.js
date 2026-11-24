/* Skizix-Website: Menü auf dem Handy, Hell/Dunkel, Beispiel-Boards auf die Breite skalieren, Vorlagen filtern */
(function(){
  var kopf=document.querySelector('.kopf'), navi=document.getElementById('navi'), b=kopf&&kopf.querySelector('.burger');
  if(b&&navi){
    b.addEventListener('click',function(){ var auf=navi.classList.toggle('offen'); kopf.classList.toggle('offen',auf); b.setAttribute('aria-expanded',auf); b.setAttribute('aria-label',auf?'Menü schließen':'Menü öffnen'); });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&navi.classList.contains('offen')){ navi.classList.remove('offen'); kopf.classList.remove('offen'); b.setAttribute('aria-expanded','false'); b.focus(); } });
  }
  /* Hell / Dunkel, wird auf diesem Gerät gemerkt */
  var t=document.getElementById('thema'), root=document.documentElement;
  function zeige(){ var d=root.dataset.thema==='dunkel'; if(t){ t.setAttribute('aria-label',d?'Helle Ansicht einschalten':'Dunkle Ansicht einschalten'); t.setAttribute('aria-pressed',d); }
    var m=document.querySelector('meta[name="theme-color"]'); if(m) m.setAttribute('content',d?'#2B55C4':'#3B6FE8'); }
  if(t) t.addEventListener('click',function(){ var d=root.dataset.thema!=='dunkel'; if(d) root.dataset.thema='dunkel'; else delete root.dataset.thema; try{ localStorage.setItem('skizix-web-thema',d?'dunkel':'hell'); }catch(e){} zeige(); });
  zeige();
  /* Beispiel-Boards sind 440 × 320 Pixel groß und werden auf die verfügbare Breite gebracht */
  var bu=[].slice.call(document.querySelectorAll('.buehne'));
  /* Das Board im Hero darf größer werden: so breit wie seine Spalte, höchstens so hoch wie der Platz bis zum Bildschirmrand */
  /* Board im Hero so groß wie die Boards der Bereiche darunter; dort füllen sie ihre Spalte (zwei Drittel) */
  function skaliere(w,s){ var i=w.firstElementChild; i.style.transform=s!==1?'scale('+s+')':''; w.style.height=(320*s)+'px'; }
  function passe(){
    var ref=document.querySelector('.b-tafel .buehne'), rw=0;
    var boxen=[].slice.call(document.querySelectorAll('main>.held,.breit .bereich'));
    boxen.forEach(function(x){ x.style.height=''; });
    bu.forEach(function(w){ if(w.closest('.held')||w.closest('.b-tafel')){ w.style.width=''; w.style.marginLeft=w.style.marginRight=''; } });
    if(ref&&window.innerWidth>1000) rw=ref.clientWidth;
    bu.forEach(function(w){ var h=w.closest('.held');
      if(h&&rw) w.style.width=Math.min(rw,w.parentNode.clientWidth)+'px';
      var s=w.clientWidth/440||1; if(!h&&!w.closest('.b-tafel')) s=Math.min(1,s);
      skaliere(w,s); });
    /* Breite Ansicht: Hero und die drei Bereiche genau so hoch wie das Menü links; die Boards schrumpfen dafür alle gleich */
    var nh=(navi&&window.innerWidth>1000&&getComputedStyle(navi).position==='sticky')?navi.getBoundingClientRect().height:0;
    if(!nh||!boxen.length) return;
    var smin=9;
    boxen.forEach(function(x){ var w=x.querySelector('.buehne'); if(!w) return;
      var bh=w.getBoundingClientRect().height, frei=nh-(x.getBoundingClientRect().height-bh), s=Math.min(w.clientWidth/440, frei/320);
      smin=Math.min(smin,s); });
    smin=Math.max(.35,smin);
    boxen.forEach(function(x){ var w=x.querySelector('.buehne'); if(!w) return;
      w.style.width=(440*smin)+'px'; w.style.marginLeft=w.style.marginRight='auto'; skaliere(w,smin); });
    boxen.forEach(function(x){ x.style.height=Math.max(nh,x.scrollHeight)+'px'; });
  }
  if(bu.length){ passe(); window.addEventListener('resize',passe); window.addEventListener('load',passe); if(document.fonts) document.fonts.ready.then(passe); }
  /* Kopf: Logo-Kästchen so breit wie das Menü links (rechts bündig), Slogan bündig mit der Überschrift darunter */
  function richte(){
    var m=kopf&&kopf.querySelector('.marke'), sl=kopf&&kopf.querySelector('.slogan'), h=document.querySelector('main h1');
    if(!m) return; m.style.width=''; m.style.marginLeft=''; var w0=m.querySelector('.wort'); if(w0){ w0.style.width=''; w0.style.height=''; } if(sl) sl.style.marginLeft='';
    if(!navi||getComputedStyle(navi).position==='fixed') return;
    var nr=navi.getBoundingClientRect(); if(!nr.width) return;
    var ml=nr.left-m.getBoundingClientRect().left; m.style.marginLeft=ml+'px'; m.style.width=nr.width+'px';
    var w=m.querySelector('.wort'), l=m.querySelector('.logo'); if(w&&l){ var frei=nr.width-l.getBoundingClientRect().width-12; if(frei>60){ w.style.width=frei+'px'; w.style.height=(frei*690/3490)+'px'; } }
    if(sl&&h&&getComputedStyle(sl).display!=='none'){ var d=h.getBoundingClientRect().left-sl.getBoundingClientRect().left; if(d>0) sl.style.marginLeft=d+'px'; }
  }
  richte(); window.addEventListener('resize',richte); if(document.fonts) document.fonts.ready.then(richte);
  /* Beispiel-Boards anhalten und weiterlaufen lassen */
  [].slice.call(document.querySelectorAll('.anhalten')).forEach(function(k){ k.addEventListener('click',function(){
    var w=k.parentNode, p=w.classList.toggle('pause'); k.setAttribute('aria-pressed',p);
    k.querySelector('span').textContent=p?'Abspielen':'Anhalten';
    k.querySelector('svg').innerHTML=p?'<path d="M7 5l12 7-12 7z"/>':'<path d="M9 5v14M15 5v14"/>'; }); });
  /* Vorlagen filtern */
  var fs=[].slice.call(document.querySelectorAll('.filter'));
  fs.forEach(function(f){ f.addEventListener('click',function(){ var k=f.dataset.kat; fs.forEach(function(x){ x.setAttribute('aria-pressed',x===f); });
    [].slice.call(document.querySelectorAll('#vorlagen .vk')).forEach(function(v){ v.hidden=k!=='*'&&v.dataset.kat!==k; }); }); });
})();
