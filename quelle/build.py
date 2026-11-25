#!/usr/bin/env python3
"""Baut Skizix aus den Quelldateien zusammen und schreibt die fertige index.html
eine Ebene höher, also in den Hauptordner des Repos (von dort veröffentlicht GitHub Pages).

Aufruf:  python3 quelle/build.py           bauen
         python3 quelle/build.py --pruefen  nur prüfen, ob index.html zum Quellcode passt
"""
import os,re,shutil,subprocess,sys,hashlib,base64
Q=os.path.dirname(os.path.abspath(__file__)); ZIEL=os.path.join(os.path.dirname(Q),'index.html')
def lies(p): return open(os.path.join(Q,p),encoding='utf-8').read()
def baue():
    s=lies('seite.html')
    js=''.join(lies('js/'+f) for f in sorted(os.listdir(os.path.join(Q,'js'))) if f.endswith('.js'))
    s=re.sub(r'\{\{(css/[\w.-]+)\}\}',lambda m: lies(m.group(1)),s)
    assert s.count('{{js}}')==1, 'Platzhalter {{js}} fehlt'
    s=s.replace('{{js}}',js)
    # Content-Security-Policy: nur unser eigenes Skript (per Prüfsumme), Verbindungen nur zu Supabase
    # (127.0.0.1 nur für die automatischen Tests mit der Supabase-Attrappe).
    skript=re.search(r'<script>(.*?)</script>',s,re.S).group(1)
    h=base64.b64encode(hashlib.sha256(skript.encode('utf-8')).digest()).decode()
    csp=("default-src 'self'; script-src 'sha256-"+h+"'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; "
         "connect-src 'self' https://*.supabase.co wss://*.supabase.co http://127.0.0.1:* ws://127.0.0.1:*; worker-src 'self'; manifest-src 'self'; "
         "media-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'")
    assert s.count('{{csp}}')==1, 'Platzhalter {{csp}} fehlt'
    return s.replace('{{csp}}',csp)
def syntax(s):   # Syntaxprüfung des Programmteils, falls Node.js vorhanden ist
    if not shutil.which('node'): return
    t=os.path.join(Q,'.pruefung.js'); open(t,'w',encoding='utf-8').write(re.search(r'<script>\n(.*)</script>',s,re.S).group(1))
    r=subprocess.run(['node','--check',t],capture_output=True,text=True); os.remove(t)
    if r.returncode: sys.exit('Syntaxfehler:\n'+r.stderr)
s=baue(); syntax(s)
if '--pruefen' in sys.argv:
    alt=open(ZIEL,encoding='utf-8').read() if os.path.exists(ZIEL) else ''
    sys.exit(0 if alt==s else 'index.html passt nicht zum Quellcode: bitte python3 quelle/build.py ausführen')
open(ZIEL,'w',encoding='utf-8').write(s)
print(f'index.html gebaut ({len(s.encode())//1024} KB)')
