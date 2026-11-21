"""Nachbildung der Supabase-Teile, die Skizix nutzt (Anmeldung, Konto-Tabelle, Board-Funktionen), für die Tests.
Läuft auf Port 8767. /__state zeigt den Inhalt, /__reset leert alles."""
import json,re,sys,itertools
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlparse,parse_qs,unquote
USERS={'ich@test.de':('geheim123','u1')}
S={}
def reset(): S.clear(); S.update(boards={},konto=[],tokens={},refresh={},log=[])
reset(); N=itertools.count(1)
class H(BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def cors(self):
        self.send_header('Access-Control-Allow-Origin','*'); self.send_header('Access-Control-Allow-Headers','apikey,authorization,content-type,prefer,x-client-info')
        self.send_header('Access-Control-Allow-Methods','GET,POST,PATCH,DELETE,OPTIONS')
    def out(self,code,obj=None):
        b=b'' if obj is None else json.dumps(obj).encode()
        self.send_response(code); self.cors(); self.send_header('Content-Type','application/json'); self.send_header('Content-Length',str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_OPTIONS(self): self.send_response(204); self.cors(); self.end_headers()
    def body(self):
        n=int(self.headers.get('Content-Length') or 0); return json.loads(self.rfile.read(n) or b'null')
    def uid(self):
        a=self.headers.get('Authorization',''); return S['tokens'].get(a[7:]) if a.startswith('Bearer ') else None
    def issue(self,uid,email):
        n=next(N); at,rt=f'at{n}',f'rt{n}'; S['tokens'][at]=uid; S['refresh'][rt]=(uid,email)
        return {'access_token':at,'refresh_token':rt,'expires_in':3600,'token_type':'bearer','user':{'id':uid,'email':email}}
    def do_GET(self):
        u=urlparse(self.path)
        if u.path=='/__state': return self.out(200,S)
        if u.path=='/__reset': reset(); return self.out(200,{})
        if u.path=='/rest/v1/skizix_konto_boards':
            uid=self.uid()
            if not uid: return self.out(401,{'message':'JWT expired'})
            return self.out(200,[{k:r[k] for k in ('key','name','del')} for r in S['konto'] if r['user_id']==uid])
        self.out(404,{'message':'not found'})
    def do_PATCH(self):
        u=urlparse(self.path); uid=self.uid(); q=parse_qs(u.query); b=self.body()
        if u.path!='/rest/v1/skizix_konto_boards' or not uid: return self.out(401,{'message':'no'})
        m=re.match(r'in\.\((.*)\)$',unquote(q['key'][0])); keys=m.group(1).split(',') if m else [q['key'][0][3:]]
        for r in S['konto']:
            if r['user_id']==uid and r['key'] in keys: r.update(b)
        S['log'].append(('patch',keys,b)); self.out(204)
    def do_POST(self):
        u=urlparse(self.path); q=parse_qs(u.query); b=self.body()
        if u.path=='/auth/v1/token':
            g=q.get('grant_type',[''])[0]
            if g=='password':
                e=b.get('email'); p=USERS.get(e)
                if not p or p[0]!=b.get('password'): return self.out(400,{'error_code':'invalid_credentials','msg':'Invalid login credentials'})
                S['log'].append(('login',e)); return self.out(200,self.issue(p[1],e))
            if g=='refresh_token':
                r=S['refresh'].pop(b.get('refresh_token'),None)
                if not r: return self.out(400,{'error_code':'refresh_token_not_found','msg':'Invalid Refresh Token'})
                S['log'].append(('refresh',)); return self.out(200,self.issue(*r))
        if u.path=='/auth/v1/logout':
            a=self.headers.get('Authorization','')[7:]; S['tokens'].pop(a,None); S['log'].append(('logout',)); return self.out(204)
        if u.path=='/rest/v1/skizix_konto_boards':
            uid=self.uid()
            if not uid: return self.out(401,{'message':'JWT expired'})
            for row in b:
                ex=next((r for r in S['konto'] if r['user_id']==uid and r['key']==row['key']),None)
                if ex: ex.update(row)
                else: r=dict(user_id=uid,name='Board'); r['del']=False; r.update(row); S['konto'].append(r)
            return self.out(201)
        m=re.match(r'/rest/v1/rpc/(\w+)$',u.path)
        if m:
            fn=m.group(1)
            if fn=='skizix_get':
                x=S['boards'].get(b['p_id']); return self.out(200,[x] if x else [])
            if fn=='skizix_save':
                x=S['boards'].setdefault(b['p_id'],{'chan':'c'+str(next(N))}); x.update(name=b['p_name'],doc=b['p_doc']); return self.out(200,None)
            if fn in ('skizix_tget','skizix_link_list'): return self.out(200,[])
        self.out(404,{'message':'not found'})
if __name__=='__main__':
    ThreadingHTTPServer(('127.0.0.1',int(sys.argv[1]) if len(sys.argv)>1 else 8767),H).serve_forever()
