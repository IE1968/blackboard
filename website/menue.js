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
  function passe(){ bu.forEach(function(w){ var s=Math.min(1,w.clientWidth/440)||1, i=w.firstElementChild; i.style.transform=s<1?'scale('+s+')':''; w.style.height=(320*s)+'px'; }); }
  if(bu.length){ passe(); window.addEventListener('resize',passe); }
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
