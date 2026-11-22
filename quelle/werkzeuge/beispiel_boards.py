"""Fertige Beispiel-Boards für das Vorführvideo (als Skizix-Sicherungsdateien)."""
import json, os
INK='#1c2a2e'
class Doc:
    def __init__(s): s.items=[]; s.n=0
    def id(s): s.n+=1; return f'i{s.n}'
    def S(s,kind,x,y,w,h,text='',**o):
        it=dict(id=s.id(),type='shape',kind=kind,x=x,y=y,w=w,h=h,text=text,fill=o.pop('fill','#ffffff'),stroke=o.pop('stroke',INK),sw=o.pop('sw',2)); it.update(o); s.items.append(it); return it['id']
    def C(s,a,b,text='',**o):
        it=dict(id=s.id(),type='conn',**{'from':a},to=b,p1={'x':0,'y':0},p2={'x':0,'y':0},text=text,stroke=INK,sw=2,style=o.pop('style','ortho'),arrow=o.pop('arrow',True),dash=o.pop('dash',False)); it.update(o); s.items.append(it); return it['id']
    def json(s,bg): return json.dumps({'items':s.items,'n':s.n,'bg':bg,'fmt':3},ensure_ascii=False)

def netzwerk():
    d=Doc(); T=lambda x,y,w,t,fs=26: d.S('text',x,y,w,40,t,fill='none',stroke='none',fs=fs,bold=True)
    T(40,0,600,'Firmennetz Muster GmbH')
    net=d.S('cloud',525,90,150,95,'Internet')
    fw=d.S('netfw',565,230,70,60,'Firewall')
    r=d.S('netrouter',565,330,70,70,'Router')
    sw=d.S('netswitch',550,450,100,50,'Switch')
    srv=d.S('netserver',120,560,60,90,'Server')
    nas=d.S('db',260,565,80,80,'Backup')
    pc1=d.S('netpc',420,570,80,70,'PC Büro 1'); pc2=d.S('netpc',560,570,80,70,'PC Büro 2')
    pr=d.S('netprinter',700,570,80,70,'Drucker')
    ap=d.S('netap',880,440,70,70,'WLAN')
    lap=d.S('netlaptop',830,580,100,60,'Notebook'); ph=d.S('netphone',1010,575,40,70,'Smartphone')
    for a,b in [(net,fw),(fw,r),(r,sw),(sw,srv),(sw,nas),(sw,pc1),(sw,pc2),(sw,pr),(sw,ap)]: d.C(a,b,arrow=False,style='straight')
    for b in (lap,ph): d.C(ap,b,arrow=False,style='straight',dash=True)
    d.S('note',930,130,200,120,'VLAN 10: Büro\nVLAN 20: Gäste-WLAN',fill='#fff3b0')
    return d.json({'s':'white','p':'dots'})

def bpmn():
    d=Doc()
    d.S('text',40,0,700,40,'IT-Störung bearbeiten',fill='none',stroke='none',fs=26,bold=True)
    d.S('pool',40,60,1180,220,'Service Desk',fill='#e3e8ea')
    d.S('pool',40,280,1180,190,'2nd Level',fill='#e6dcff')
    st=d.S('evstart',100,150,40,40,'Störung\ngemeldet',fill='#d3f0dc')
    a=d.S('round',180,130,140,80,'Ticket erfassen')
    b=d.S('round',370,130,140,80,'Störung analysieren',fill='#cfe8ff')
    g=d.S('gwx',565,145,50,50,'Lösung\nbekannt?')
    c=d.S('round',670,130,140,80,'Lösung umsetzen',fill='#d3f0dc')
    e=d.S('round',870,130,140,80,'Nutzer informieren')
    en=d.S('evend',1080,150,40,40,'Ticket\ngeschlossen',fill='#ffd9c7')
    f=d.S('round',700,335,140,80,'Störung beheben',fill='#ffd9c7')
    d.S('annot',1000,370,180,60,'SLA: Lösung innerhalb von 4 Stunden',fill='none')
    for x,y,t in [(st,a,''),(a,b,''),(b,g,''),(g,c,'Ja'),(c,e,''),(e,en,''),(g,f,'Nein'),(f,e,'')]: d.C(x,y,t)
    return d.json({'s':'paper','p':'grid'})

def schreiben(ordner):
    os.makedirs(ordner,exist_ok=True)
    for name,fn in (('netzwerk',netzwerk),('bpmn',bpmn)):
        open(os.path.join(ordner,name+'.json'),'w').write(fn())
if __name__=='__main__': schreiben('/tmp/skizix-beispiele'); print('ok')
