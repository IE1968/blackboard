/* Vorschlagsphase: drei Kopfleisten zum Vergleichen (?kopf=1, 2 oder 3). Wird nach der Entscheidung entfernt. */
(function(){
  var k=null; try{ k=new URLSearchParams(location.search).get('kopf')||localStorage.getItem('skizix-kopf'); }catch(e){}
  if(!/^[123]$/.test(k||'')) k='1';
  try{ localStorage.setItem('skizix-kopf',k); }catch(e){}
  document.documentElement.className+=' kopf-'+k;
  document.addEventListener('DOMContentLoaded',function(){
    var b=document.createElement('div'); b.className='kopfwahl';
    b.innerHTML='<span>Kopfleiste:</span>'+['1','2','3'].map(function(n){return '<button type="button" data-k="'+n+'"'+(n===k?' aria-pressed="true"':'')+'>Vorschlag '+n+'</button>';}).join('');
    b.addEventListener('click',function(e){ var t=e.target.closest('[data-k]'); if(!t) return; try{localStorage.setItem('skizix-kopf',t.dataset.k);}catch(_){} var u=new URL(location.href); u.searchParams.set('kopf',t.dataset.k); location.href=u.toString(); });
    document.body.appendChild(b);
  });
})();
