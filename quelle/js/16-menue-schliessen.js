/* ---------- Menü schließen ---------- */
/* Die Datei-Leiste bleibt am PC offen; auf Tablet und Handy liegt sie über der Tafel und schließt nach einer Aktion */
function closeMenu(focus){ if(!document.body.classList.contains('compact')||palState.propsClosed) return; palState.propsClosed=true; savePal(); applySides(); if(focus) $('propsToggle').focus(); }
document.addEventListener('keydown',e=>{   /* Esc schließt das Menü, auch wenn der Fokus in einem Eingabefeld steht */
  if(e.key!=='Escape'||palState.propsClosed||!document.body.classList.contains('compact')) return; e.preventDefault(); e.stopImmediatePropagation(); closeMenu(true);
},true);
/* Der frühere Abgleich über ein GitHub-Repository ist entfernt (ersetzt durch das Konto). Gespeicherte Zugangsdaten werden gelöscht. */
try{ localStorage.removeItem('blackboard-sync'); }catch(e){}

