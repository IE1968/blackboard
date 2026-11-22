/* Handy: Menü hinter den drei Strichen auf- und zuklappen */
(function(){
  var k=document.querySelector('header.top'), b=k&&k.querySelector('.burger'); if(!b) return;
  b.addEventListener('click',function(){ var auf=k.classList.toggle('offen'); b.setAttribute('aria-expanded',auf); b.setAttribute('aria-label',auf?'Menü schließen':'Menü öffnen'); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&k.classList.contains('offen')){ k.classList.remove('offen'); b.setAttribute('aria-expanded','false'); b.focus(); } });
})();
