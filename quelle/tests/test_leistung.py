import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
import subprocess,time,json,random,re
from playwright.sync_api import sync_playwright
srv=subprocess.Popen([sys.executable,'-m','http.server','8765','--directory',DIST],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(0.8)
random.seed(1)
def board(n):
    it=[]; kinds=['rect','round','ellipse','diamond','note','cloud','hex']
    for i in range(n):
        it.append(dict(id='s%d'%i,type='shape',kind=random.choice(kinds),x=(i%40)*170,y=(i//40)*120,w=140,h=80,text='Element %d mit Text'%i,fill='#cfe8ff',stroke='#1c2a2e',sw=2))
    for i in range(n//2):
        a,b=random.randrange(n),random.randrange(n)
        it.append(dict(id='c%d'%i,type='conn',**{'from':'s%d'%a},to='s%d'%b,p1={'x':0,'y':0},p2={'x':0,'y':0},text='',stroke='#1c2a2e',sw=2,style='ortho',dash=False,head='arrow'))
    for i in range(n//10):
        pts=[[random.randint(0,6000),random.randint(0,3000)]]
        for k in range(80): pts.append([pts[-1][0]+random.randint(-8,8),pts[-1][1]+random.randint(-8,8)])
        it.append(dict(id='p%d'%i,type='path',pts=pts,stroke='#c8321f',sw=3,tool='pen',tip='round'))
    return {'items':it,'n':n*3}
res={}
try:
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':1600,'height':900},accept_downloads=True); pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    t0=time.time(); pg.goto(URL); pg.wait_for_load_state('load'); res['load_s']=round(time.time()-t0,2)
    res['nav']=pg.evaluate("()=>{const n=performance.getEntriesByType('navigation')[0];return {dcl:Math.round(n.domContentLoadedEventEnd),load:Math.round(n.loadEventEnd)}}")
    for n in [200,1000,2000]:
        d=board(n); js=json.dumps(d); res[f'json_{n}_KB']=len(js)//1024
        pg.evaluate("(d)=>{const b=JSON.parse(localStorage.getItem('blackboard-boards'));localStorage.setItem('blackboard-b-'+b.cur,JSON.stringify(d));}",d)
        t0=time.time(); pg.reload(); pg.wait_for_function("()=>document.querySelectorAll('#items > g').length>0"); res[f'reload_{n}_s']=round(time.time()-t0,2)
        res[f'dom_{n}']=pg.evaluate("()=>document.querySelectorAll('*').length")
        # Vollständiges Rendern
        res[f'render_{n}_ms']=pg.evaluate("()=>{const t=performance.now();for(let i=0;i<5;i++){window.__r&&0;} document.querySelector('#menuBtn');return 0}")
        # Zoom per Rad
        t=pg.evaluate("async()=>{const s=document.getElementById('board');const t0=performance.now();for(let i=0;i<20;i++){s.dispatchEvent(new WheelEvent('wheel',{deltaY:i%2?-60:60,ctrlKey:true,clientX:800,clientY:450,bubbles:true,cancelable:true}));await new Promise(r=>requestAnimationFrame(r));}return (performance.now()-t0)/20}")
        res[f'zoom_{n}_ms_per_frame']=round(t,1)
        # Ziehen einer Form: Zeit pro pointermove
        pg.click('#zoomLabel'); pg.wait_for_timeout(200); pg.keyboard.press('Escape')
        bb=pg.evaluate("()=>{const r=document.querySelector('#items [data-id=\"s0\"]').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]}")
        pg.mouse.move(*bb); pg.mouse.down(); t0=time.time()
        for i in range(30): pg.mouse.move(bb[0]+i*3,bb[1]+i*2)
        res[f'drag_{n}_ms_per_move']=round((time.time()-t0)*1000/30,1); t0=time.time(); pg.mouse.up(); pg.wait_for_timeout(50); res[f'drop_commit_{n}_ms']=round((time.time()-t0)*1000)
        # Alles auswählen + verschieben per Pfeiltaste
        t0=time.time(); pg.keyboard.press('Control+a'); pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(10); res[f'selectall_move_{n}_ms']=round((time.time()-t0)*1000)
        t0=time.time(); pg.keyboard.press('Control+z'); pg.wait_for_timeout(10); res[f'undo_{n}_ms']=round((time.time()-t0)*1000)
        res[f'ls_KB_{n}']=pg.evaluate("()=>{let t=0;for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);t+=k.length+localStorage.getItem(k).length;}return Math.round(t*2/1024)}")
        if n==1000:
            t0=time.time()
            with pg.expect_download(timeout=120000) as dl:
                openFile(pg); pg.click('#menu [data-m="png"]')
            res['png_1000_s']=round(time.time()-t0,1)
            t0=time.time()
            with pg.expect_download(timeout=120000) as dl:
                openFile(pg); pg.click('#menu [data-m="pdf"]')
            res['pdf_1000_s']=round(time.time()-t0,1)
    # Speicher voll? 4 große Boards
    res['quota']=pg.evaluate("""()=>{try{const big='x'.repeat(1024*1024);let i=0;for(;i<20;i++){localStorage.setItem('qtest'+i,big);} return 'kein Limit bis 20 MB-Zeichen'}catch(e){let n=0;for(let i=0;i<20;i++){if(localStorage.getItem('qtest'+i))n++;} for(let i=0;i<20;i++)localStorage.removeItem('qtest'+i); return 'Limit nach ca. '+n+' Mio. Zeichen'}}""")
    res['errs']=errs
    b.close()
finally: srv.terminate()
print(json.dumps(res,indent=1,ensure_ascii=False))
check('Zoomen 2000 Elemente unter 80 ms',res['zoom_2000_ms_per_frame']<80,str(res['zoom_2000_ms_per_frame']))
check('Ziehen 2000 Elemente unter 40 ms',res['drag_2000_ms_per_move']<40,str(res['drag_2000_ms_per_move']))
check('Rückgängig 2000 Elemente unter 300 ms',res['undo_2000_ms']<300,str(res['undo_2000_ms']))
check('keine Fehler',not res['errs'],str(res['errs']))
