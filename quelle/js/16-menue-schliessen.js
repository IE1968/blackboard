/* ---------- Menü schließen ---------- */
function closeMenu(focus){ if(menu.hidden) return; menu.hidden=true; $('menuBtn').setAttribute('aria-expanded','false'); if(focus) $('menuBtn').focus(); }
document.addEventListener('keydown',e=>{   /* Esc schließt das Menü, auch wenn der Fokus in einem Eingabefeld steht */
  if(e.key!=='Escape'||menu.hidden) return; e.preventDefault(); e.stopImmediatePropagation(); closeMenu(true);
},true);
/* Der frühere Abgleich über ein GitHub-Repository ist entfernt (ersetzt durch das Konto). Gespeicherte Zugangsdaten werden gelöscht. */
try{ localStorage.removeItem('blackboard-sync'); }catch(e){}

