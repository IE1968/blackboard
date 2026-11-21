import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
import asyncio,json,urllib.request
from playwright.async_api import async_playwright
CFG=json.dumps({'owner':'IE','repo':'Boards','token':'goodtoken','api':'http://127.0.0.1:8766'})
def state(): return json.load(urllib.request.urlopen('http://127.0.0.1:8766/__state'))
async def dev(b,name,pre=None):
    ctx=await b.new_context(viewport={'width':1200,'height':800}); pg=await ctx.new_page(); pg.errs=[]
    pg.on('pageerror',lambda e:pg.errs.append(name+': '+str(e)))
    await pg.goto('http://127.0.0.1:8765/'); await pg.wait_for_timeout(300)
    if pre: await pg.evaluate(pre)
    await pg.evaluate("c=>localStorage.setItem('blackboard-sync',c)",CFG); await pg.reload(); await pg.wait_for_timeout(2500)
    return pg
async def info(pg):
    return await pg.evaluate("(()=>{const b=JSON.parse(localStorage.getItem('blackboard-boards'));return {n:document.querySelectorAll('#items [data-id]').length,boards:b.list.map(x=>x.name+(x.dirty?'*':'')),cur:document.getElementById('boardName').value,sync:document.getElementById('menuBtn').dataset.sync}})()")
async def add(pg,kind='rect'):
    await pg.click(f'.pal[data-kind="{kind}"]'); await pg.keyboard.press('Escape')
async def sync(pg):
    await pg.click('#menuBtn'); await pg.click('[data-m="syncnow"]'); await pg.wait_for_timeout(1800)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=CHROME,args=['--no-sandbox'])
        A=await dev(b,'A'); print('1 A start (pristine, nothing uploaded):',await info(A),list(state()['files']))
        await add(A); await A.wait_for_timeout(6500); print('2 A after edit:',await info(A),list(state()['files']))
        check('Upload nach Änderung',any(f.startswith('boards/') for f in state()['files']),str(list(state()['files'])))
        B=await dev(b,'B'); iA,iB=await info(A),await info(B); check('Zweites Gerät holt das Board',iB['n']==iA['n'] and iB['n']>0,f'{iA} {iB}')
        await add(B,'star'); await B.fill('#boardName','Netzplan'); await B.wait_for_timeout(6500); await sync(A)
        iA,iB=await info(A),await info(B); check('Änderung und neuer Name kommen an',iA['cur']=='Netzplan' and iA['n']==iB['n'],f'{iA} {iB}')
        await add(A,'tri'); await add(B,'hex'); await sync(A); await sync(B); await B.wait_for_timeout(2500); await sync(A)
        iA,iB=await info(A),await info(B); check('Konflikt: nichts geht verloren',any('Kopie' in x for x in iA['boards']+iB['boards']),f'{iA} {iB}')
        # B deletes its copy board
        await B.click('#menuBtn'); await B.click('#boardList button:has-text("lokale Kopie")'); await B.wait_for_timeout(300)
        await B.click('#menuBtn'); await B.click('#delBoard'); await B.click('#delBoard'); await B.wait_for_timeout(3500); await sync(A)
        print('6 delete: A',await info(A),'| B',await info(B),list(state()['files']))
        await A.click('#menuBtn'); await A.click('[data-m="new"]'); await add(A,'cloud'); await A.wait_for_timeout(6500); await sync(B)
        iA,iB=await info(A),await info(B); check('Neues Board erscheint auf beiden Geräten',len(iA['boards'])==len(iB['boards'])>=2,f'{iA} {iB}')
        old="(()=>{localStorage.setItem('blackboard-boards',JSON.stringify({cur:'b1',list:[{id:'b1',name:'Altes Board'}]}));localStorage.setItem('blackboard-b-b1',JSON.stringify({items:[{id:'i1',type:'shape',kind:'rect',x:0,y:0,w:100,h:60,text:'alt',fill:'#ffffff',stroke:'#1c2a2e',sw:2}],n:1}))})()"
        C=await dev(b,'C',old); await C.wait_for_timeout(2500); iC=await info(C); check('Altes Gerät behält sein Board als Kopie','Altes Board (lokale Kopie)' in iC['boards'],str(iC))
        # wrong token
        await C.evaluate("localStorage.setItem('blackboard-sync',JSON.stringify({owner:'IE',repo:'Boards',token:'bad',api:'http://127.0.0.1:8766'}))"); await C.reload(); await C.wait_for_timeout(2500)
        check('Falscher Schlüssel wird erkannt',(await info(C))['sync']=='auth')
        # dialog flow with wrong then right token
        await C.click('#menuBtn'); await C.click('[data-m="synccfg"]'); await C.click('#syGo'); await C.wait_for_timeout(800); m1=await C.inner_text('#syMsg')
        await C.fill('#syToken','goodtoken'); await C.click('#syGo'); await C.wait_for_timeout(2500)
        check('Dialog: Fehlermeldung, dann Erfolg',bool(m1) and await C.is_hidden('#syncDlg') and (await info(C))['sync']=='ok',m1[:60])
        check('keine Fehler',not (A.errs+B.errs+C.errs),str(A.errs+B.errs+C.errs)); print('requests',len(state()['log']))
        await b.close()
srv=server(PWA,8765); mock=subprocess.Popen([sys.executable,os.path.join(HIER,'github_attrappe.py')]); time.sleep(1)
try: asyncio.run(main())
finally: srv.terminate(); mock.terminate()
