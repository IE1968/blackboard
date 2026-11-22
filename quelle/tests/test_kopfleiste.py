import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from hilfe import *
from playwright.sync_api import sync_playwright
srv=server()
try:
 with sync_playwright() as p:
  br=p.chromium.launch(executable_path=CHROME)
  for w,h in ((1024,700),(1100,700),(1280,760),(1366,768),(1440,850),(1536,900),(1920,1080)):
    pg=br.new_page(viewport={'width':w,'height':h}); pg.goto(URL); pg.wait_for_timeout(400)
    r=pg.evaluate("()=>{const k=document.getElementById('ktBtn').getBoundingClientRect(),l=document.getElementById('liveBtn').getBoundingClientRect();return [k.right,l.left,innerWidth,document.querySelector('.brand .logo').getBoundingClientRect().width]}")
    check(f'Kopfleiste {w} px: Live und Konto sichtbar, Logo da',r[0]<=r[2]+0.5 and r[1]>0 and r[3]>10,str(r))
    pg.close()
  br.close()
finally: srv.terminate()
