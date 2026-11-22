/* Entwurfsphase: zwischen den Designs umschalten (Dunkel, Hell, Papier).
   Nach der Entscheidung wird diese Datei entfernt und nur noch das gewählte Design eingebunden. */
(function(){
  var D={dunkel:'Dunkel',hell:'Hell',papier:'Papier'}, q=null, d=null;
  try{ q=new URLSearchParams(location.search).get('design'); }catch(e){}
  try{ d=q||localStorage.getItem('skizix-web-design'); if(q) localStorage.setItem('skizix-web-design',q); }catch(e){ d=q; }
  if(!D[d]) d='dunkel'; window.__design=d;
  if(d!=='dunkel') document.write('<link rel="stylesheet" href="stil-'+d+'.css">');
  document.addEventListener('DOMContentLoaded',function(){
    var b=document.createElement('div'); b.className='designwahl';
    b.innerHTML='<span>Design:</span>'+Object.keys(D).map(function(k){return '<button type="button" data-d="'+k+'"'+(k===d?' aria-pressed="true"':'')+'>'+D[k]+'</button>';}).join('');
    b.addEventListener('click',function(e){ var t=e.target.closest('[data-d]'); if(!t) return;
      try{ localStorage.setItem('skizix-web-design',t.dataset.d); }catch(_){}
      var u=new URL(location.href); u.searchParams.set('design',t.dataset.d); location.href=u.toString(); });
    document.body.appendChild(b);
    /* Links innerhalb der Website behalten das Design */
    document.querySelectorAll('a[href$=".html"],a[href*=".html#"]').forEach(function(a){ var u=new URL(a.getAttribute('href'),location.href); u.searchParams.set('design',d); a.href=u.toString(); });
  });
})();
