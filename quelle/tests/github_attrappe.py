import json,hashlib,base64,re,sys
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
FILES={}  # path -> bytes
LOG=[]
def sha(b): return hashlib.sha1(b'blob %d\0'%len(b)+b).hexdigest()
class H(BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def cors(self):
        self.send_header('Access-Control-Allow-Origin','*'); self.send_header('Access-Control-Allow-Headers','Authorization, Accept, Content-Type'); self.send_header('Access-Control-Allow-Methods','GET, PUT, DELETE, OPTIONS')
    def out(self,code,obj=None,raw=None):
        body=raw if raw is not None else json.dumps(obj if obj is not None else {}).encode()
        self.send_response(code); self.cors(); self.send_header('Content-Type','application/json'); self.send_header('Content-Length',str(len(body))); self.end_headers(); self.wfile.write(body)
    def do_OPTIONS(self): self.send_response(204); self.cors(); self.end_headers()
    def auth(self):
        if self.headers.get('Authorization')!='Bearer goodtoken': self.out(401,{'message':'Bad credentials'}); return False
        return True
    def path0(self): return self.path.split('?')[0]
    def do_GET(self):
        p=self.path0(); LOG.append('GET '+p)
        if p=='/__state': return self.out(200,{'files':{k:sha(v) for k,v in FILES.items()},'log':LOG})
        if not self.auth(): return
        if p=='/repos/IE/Boards': return self.out(200,{'name':'Boards','private':True,'permissions':{'push':True,'pull':True}})
        m=re.match(r'^/repos/IE/Boards/contents/(.*)$',p)
        if not m: return self.out(404,{'message':'Not Found'})
        q=m.group(1)
        if q=='boards':
            fs=[k for k in FILES if k.startswith('boards/')]
            if not fs: return self.out(404,{'message':'Not Found'})
            return self.out(200,[{'name':k.split('/')[1],'path':k,'sha':sha(FILES[k]),'type':'file','size':len(FILES[k])} for k in sorted(fs)])
        if q in FILES:
            if 'raw' in self.headers.get('Accept',''): return self.out(200,raw=FILES[q])
            return self.out(200,{'sha':sha(FILES[q]),'content':base64.b64encode(FILES[q]).decode()})
        self.out(404,{'message':'Not Found'})
    def body(self): return json.loads(self.rfile.read(int(self.headers.get('Content-Length','0'))) or b'{}')
    def do_PUT(self):
        p=self.path0(); LOG.append('PUT '+p)
        if not self.auth(): return
        q=re.match(r'^/repos/IE/Boards/contents/(.*)$',p).group(1); b=self.body()
        if q in FILES and b.get('sha')!=sha(FILES[q]): return self.out(409 if b.get('sha') else 422,{'message':'sha mismatch'})
        if q not in FILES and b.get('sha'): return self.out(409,{'message':'gone'})
        new=q not in FILES; FILES[q]=base64.b64decode(b['content']); self.out(201 if new else 200,{'content':{'sha':sha(FILES[q])}})
    def do_DELETE(self):
        p=self.path0(); LOG.append('DELETE '+p)
        if not self.auth(): return
        q=re.match(r'^/repos/IE/Boards/contents/(.*)$',p).group(1); b=self.body()
        if q not in FILES: return self.out(404,{})
        if b.get('sha')!=sha(FILES[q]): return self.out(409,{})
        del FILES[q]; self.out(200,{})
ThreadingHTTPServer(('127.0.0.1',8766),H).serve_forever()
