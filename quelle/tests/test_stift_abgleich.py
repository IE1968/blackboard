import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
"""Stifteinstellungen gleichen sich zwischen eigenen Geräten (gleiches Konto) über den Live-Kanal ab.
Ein anderes Konto auf demselben Kanal übernimmt nichts. Der Live-Kanal wird im Test nachgebildet."""
import json
from playwright.sync_api import sync_playwright
srv=server(); mock=subprocess.Popen([sys.executable,os.path.join(HIER,'supabase_attrappe.py')]); time.sleep(1); errs=[]
FAKE="""(()=>{ if(location.hostname!=='localhost') return;
  localStorage.setItem('skizix-test-sb','http://127.0.0.1:8767'); localStorage.setItem('skizix-test-opts','1');
  class FW{ constructor(u){ this.readyState=0; FW.all.push(this); setTimeout(()=>{ this.readyState=1; this.onopen&&this.onopen(); },30); }
    send(t){ const m=JSON.parse(t); if(m.event==='phx_join'){ this.topic=m.topic; setTimeout(()=>this.onmessage&&this.onmessage({data:JSON.stringify({topic:m.topic,event:'phx_reply',ref:m.ref,payload:{status:'ok'}})}),10); return; }
      if(m.event==='broadcast') window.__relay(t); }
    close(){ this.readyState=3; } }
  FW.all=[]; window.WebSocket=FW;
  window.__wsIn=t=>{ const m=JSON.parse(t); for(const w of FW.all) if(w.readyState===1&&w.topic===m.topic) w.onmessage&&w.onmessage({data:JSON.stringify({topic:m.topic,event:'broadcast',payload:m.payload.payload?{event:'m',payload:m.payload.payload}:m.payload})}); };
})()"""
pages=[]; Q=[]
def relay(src,t): Q.append((src['page'],t))
def pump(ms=600):
    end=time.time()+ms/1000
    while time.time()<end:
        while Q:
            src,t=Q.pop(0)
            for pg in pages:
                if pg is not src:
                    try: pg.evaluate("t=>window.__wsIn&&window.__wsIn(t)",t)
                    except Exception: pass
        for pg in pages: pg.wait_for_timeout(20)
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox'])
  def geraet(uid):
      ctx=br.new_context(viewport={'width':1300,'height':850}); ctx.add_init_script(FAKE); ctx.expose_binding('__relay',relay)
      pg=ctx.new_page(); pg.on('pageerror',lambda e: errs.append(str(e))); pg.goto(URL); pg.wait_for_timeout(400)
      pg.evaluate("""uid=>{ localStorage.setItem('skizix-konto',JSON.stringify({access_token:'a',refresh_token:'r',expires_at:Date.now()+3600e3,email:'x@y.de',uid}));
        const b=JSON.parse(localStorage.getItem('blackboard-boards')); const c=b.list.find(x=>x.id===b.cur); c.live='k1'; localStorage.setItem('blackboard-boards',JSON.stringify(b)); }""",uid)
      pg.reload(); pages.append(pg); pump(1200); return pg
  A=geraet('u1'); B=geraet('u1'); C=geraet('u2')
  # Gerät A: Pinsel wählen, Farbe und Stärke über die Eigenschaften ändern
  A.click('#tools [data-tool="brush"]'); A.wait_for_timeout(200)
  A.click('#props [data-drop="stroke"]'); A.wait_for_timeout(200)
  sent=A.evaluate("""()=>{ const b=[...document.querySelectorAll('[data-act="stroke"][data-val^="#"]')].find(x=>x.getAttribute('aria-pressed')!=='true'&&x.dataset.val!=='#ffffff'); if(!b) return null; b.click(); return b.title; }""")
  pump(800)
  check('Farbknopf für den Pinsel gefunden',bool(sent),str(sent))
  def col(pg):
      pg.click('#tools [data-tool="brush"]'); pg.wait_for_timeout(150)
      return pg.get_attribute('#props [data-drop="stroke"]','title')
  vb=col(B); vc=col(C)
  check('Gerät B (gleiches Konto) übernimmt die Pinselfarbe',vb.endswith(': '+sent),str(vb))
  check('Anderes Konto übernimmt nichts',not vc.endswith(': '+sent),str(vc))
  # Neues Gerät D kommt später dazu und erhält den aktuellen Stand
  D=geraet('u1'); pump(800); vd=col(D)
  check('Später verbundenes Gerät bekommt die Farbe',vd.endswith(': '+sent),str(vd))
  check('Keine Seitenfehler',not errs,str(errs[:3]))
  br.close()
finally: srv.terminate(); mock.terminate()

