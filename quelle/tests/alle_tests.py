#!/usr/bin/env python3
"""Baut Skizix und lässt alle Tests laufen.

Voraussetzungen: Python 3, Playwright (pip install playwright), Google Chrome.
Für den PDF-Test zusätzlich, falls vorhanden: pdfinfo, pdftotext, qpdf.

Aufruf:  python3 quelle/tests/alle_tests.py            alle Tests
         python3 quelle/tests/alle_tests.py leistung   nur Tests, deren Name "leistung" enthält
"""
import os,sys,subprocess,time,re
HIER=os.path.dirname(os.path.abspath(__file__))
r=subprocess.run([sys.executable,os.path.join(os.path.dirname(HIER),'build.py')])
if r.returncode: sys.exit('Build fehlgeschlagen')
wahl=sys.argv[1:]
tests=sorted(f for f in os.listdir(HIER) if f.startswith('test_') and f.endswith('.py') and (not wahl or any(w in f for w in wahl)))
gesamt_ok=gesamt=0; schlecht=[]
for t in tests:
    t0=time.time()
    try: p=subprocess.run([sys.executable,os.path.join(HIER,t)],capture_output=True,text=True,timeout=600); out=p.stdout+p.stderr; code=p.returncode
    except subprocess.TimeoutExpired: out='Zeitüberschreitung'; code=1
    ok=len(re.findall(r'^PASS ',out,re.M)); fail=re.findall(r'^FAIL .*',out,re.M)
    absturz=code!=0 or 'Traceback' in out
    gesamt_ok+=ok; gesamt+=ok+len(fail)+(1 if absturz and not fail else 0)
    status='OK  ' if not fail and not absturz and ok else 'FEHL'
    print(f'{status} {t[5:-3]:<28} {ok:>3} bestanden{"":2}{len(fail)} fehlgeschlagen  ({time.time()-t0:.0f} s)')
    for f in fail: print('       '+f[:160])
    if absturz and not fail: print('       Abbruch:\n'+'\n'.join('       '+l for l in out.strip().splitlines()[-6:]))
    if status=='FEHL': schlecht.append(t)
print(f'\nErgebnis: {gesamt_ok} von {gesamt} Prüfungen bestanden' + (', alle Tests grün.' if not schlecht else f', Probleme in: {", ".join(schlecht)}'))
sys.exit(1 if schlecht else 0)
