import sys,os,json,time; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
"""Live-Quiz als Umfrage (ohne markierte Lösung) – abgeleitet aus test_live_quiz. Ursprünglich: Beamer startet das Quiz, zwei Handys machen per Link mit, antworten, bekommen Punkte; Balken und Rangliste.
Der Echtzeit-Kanal wird im Test nachgebildet. Außerdem: QR-Code ist lesbar aufgebaut (Größe passt zur Version)."""
from playwright.sync_api import sync_playwright
srv=server(); errs=[]
FAKE="""(()=>{ if(location.hostname!=='localhost') return;
  localStorage.setItem('skizix-test-opts','1');
  class FW{ constructor(u){ this.readyState=0; FW.all.push(this); setTimeout(()=>{ this.readyState=1; this.onopen&&this.onopen(); },20); }
    send(t){ const m=JSON.parse(t); if(m.event==='phx_join'){ this.topic=m.topic; setTimeout(()=>this.onmessage&&this.onmessage({data:JSON.stringify({topic:m.topic,event:'phx_reply',ref:m.ref,payload:{status:'ok'}})}),10); return; }
      if(m.event==='broadcast') window.__relay(t); }
    close(){ this.readyState=3; } }
  FW.all=[]; window.WebSocket=FW;
  window.__wsIn=t=>{ const m=JSON.parse(t); for(const w of FW.all) if(w.readyState===1&&w.topic===m.topic) w.onmessage&&w.onmessage({data:JSON.stringify({topic:m.topic,event:'broadcast',payload:m.payload})}); };
})()"""
pages=[]; Q=[]
def relay(src,t): Q.append((src['page'],t))
def pump(ms=500):
    end=time.time()+ms/1000
    while time.time()<end:
        while Q:
            src,t=Q.pop(0)
            for pg in pages:
                if pg is not src:
                    try: pg.evaluate("t=>window.__wsIn&&window.__wsIn(t)",t)
                    except Exception: pass
        for pg in pages: pg.wait_for_timeout(15)
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox'])
  def geraet(w,h,url=URL):
      ctx=br.new_context(viewport={'width':w,'height':h}); ctx.add_init_script(FAKE); ctx.expose_binding('__relay',relay)
      pg=ctx.new_page(); pg.on('pageerror',lambda e: errs.append(str(e))); pg.goto(url); pg.wait_for_timeout(500); pages.append(pg); return pg
  B=geraet(1400,860)
  openFile(B); B.click('#menu [data-m="clear"]'); B.wait_for_timeout(100)
  B.evaluate("()=>{for(let i=0;i<14;i++){const h=[...document.querySelectorAll('.gh')].find(h=>h.getAttribute('aria-expanded')==='false'); if(!h) break; h.click();}}")
  B.focus('.pal[data-kind="quiz"]'); B.keyboard.press('Enter'); B.wait_for_timeout(150); B.keyboard.press('Escape')
  einpassen(B); B.wait_for_timeout(200)
  d=B.evaluate(READ); C=[i for i in d['items'] if i.get('kind')=='check']; C.sort(key=lambda i:i['y'])
  starte(B); B.wait_for_timeout(300)
  check('Präsentation: Knopf Live-Quiz sichtbar',B.is_visible('#presQuiz'))
  B.click('#presQuiz'); pump(300)
  code=B.text_content('#qzHost .qzCodeBig').strip(); vb=B.get_attribute('#qzHost .qzQr svg','viewBox')
  check('Code mit 6 Zeichen',len(code)==6 and code.isalnum(),code)
  check('QR-Code angezeigt',B.locator('#qzHost .qzQr svg path').count()==1)
  link=B.text_content('#qzHost .qzJoin b')
  check('Link enthält den Code',link.endswith('#quiz='+code),link)
  # zwei Handys
  H1=geraet(390,800,URL+'#quiz='+code); pump(200)
  check('Handy: Namensfeld, Code schon drin',H1.is_visible('#qzName') and code in H1.text_content('#qzPlay'))
  H1.fill('#qzName','Ada'); H1.click('.qpGo'); pump(600)
  H2=geraet(390,800,URL); H2.click('#liveBtn'); H2.click('#quizJoinBtn'); H2.wait_for_timeout(100)
  H2.fill('#qzIn',code.lower()); H2.fill('#qzName','Bo'); H2.click('.qpGo'); pump(600)
  check('Beamer zählt 2 Teilnehmende',B.text_content('#qzHost .qzStat').startswith('2'),B.text_content('#qzHost .qzStat'))
  check('Handy zeigt Frage und 3 Antworten',H1.locator('.qpAns button').count()==3 and 'Frage' in H1.text_content('.qpQ h1'))
  check('Tippen auf dem Handy löst keine Board-Kürzel aus („B“ = Pinsel)',H2.evaluate("()=>document.querySelector('#board').getAttribute('class')")=='t-select',H2.evaluate("()=>document.querySelector('#board').getAttribute('class')"))
  check('Beamer zeigt „Umfrage“','Umfrage' in B.text_content('#qzHost .qzStat'))
  H1.click('.qpAns button[data-qa="1"]'); pump(300); H2.click('.qpAns button[data-qa="1"]'); pump(500)
  B.keyboard.press('a'); pump(700)
  check('Umfrage: Danke statt „falsch“',H1.locator('.qpRes.ok').count()==1 and 'Danke' in H1.text_content('.qpQ') and 'falsch' not in H2.text_content('.qpQ'),H1.text_content('.qpQ'))
  check('Umfrage: keine Punkte',all(H.text_content('.qpMe').endswith('0 P.') for H in (H1,H2)),H1.text_content('.qpMe'))
  check('Umfrage: Stimmen auf dem Handy',[t.strip() for t in H1.locator('.qpAns button i').all_text_contents()]==['0','2','0'])
  check('Beamer: Balken in Blau',B.locator('#qzBars rect').count()==1 and B.get_attribute('#qzBars rect','fill')=='#5b8cf5')
  check('Quiz-Knopf Gold mit dunkler Schrift',H1.evaluate("()=>getComputedStyle(document.querySelector('.qpAns button[data-qa=\"2\"]')).color")=='rgb(24, 24, 26)')
  check('keine Fehler',not errs,str(errs[:3]))
  br.close()
finally: srv.terminate()
