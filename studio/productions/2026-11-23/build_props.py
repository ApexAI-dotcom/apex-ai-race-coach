import json
W=json.load(open("words.json",encoding="utf8"))['words']
sub={"Quatre-vingt-sept":"87","quarante-neuf.":"49.","Cinquante-neuf":"59","deux au troisième.":"2 au 3e.","au troisième tour,":"au 3e tour,","trois premiers tours,":"3 premiers tours,","au troisième,":"au 3e,"}
ws=[(w["text"],w["start"],w["end"]) for w in W if w["type"]=="word"]
m=[]
for t,a,b in ws:
    if t in ("?",":") and m: m[-1]=(m[-1][0]+" "+t,m[-1][1],b)
    else: m.append((t,a,b))
caps=[];cur=[]
def sw(t):
    t=t.replace("Quatre-vingt-sept","87").replace("quarante-neuf","49").replace("Cinquante-neuf","59").replace("troisième","3e").replace("trois ","3 ")
    if t=="deux": t="2"
    if t=="trois": t="3"
    return t
for t,a,b in m:
    cur.append((sw(t),a,b))
    if t[-1] in ".?" or (t[-1] in ",:" and len(cur)>=2) or len(cur)>=4:
        caps.append({"t0":round(cur[0][1],2),"t1":round(cur[-1][2]+0.2,2),"text":" ".join(x[0] for x in cur)});cur=[]
if cur: caps.append({"t0":round(cur[0][1],2),"t1":round(cur[-1][2]+0.2,2),"text":" ".join(x[0] for x in cur)})
for a,b in zip(caps,caps[1:]):
    if a["t1"]>b["t0"]: a["t1"]=b["t0"]
beats=[
 {"dur":3.3,"kind":"hook","title":"*0,87 s.* Dans un seul virage.","visual":"trace-zoom","corner":7},
 {"dur":4.6,"kind":"visual","visual":"trace-zoom","corner":7,"title":"Début de séance.","sub":"Virage 7 : 0,87 s face au meilleur passage.","sfx":"marker"},
 {"dur":3.9,"kind":"hero","number":"0,49","unit":"s","tone":"red","title":"au 3e tour, virage 7.","sub":"Il coûte encore.","sfx":"soft-impact"},
 {"dur":3.85,"kind":"hero","number":"0,02","unit":"s","tone":"green","title":"au 3e tour, virage 3.","sub":"Après 0,59 s aux deux premiers tours.","sfx":"pings"},
 {"dur":3.95,"kind":"text","title":"Certains virages *se règlent tout seuls.* D'autres *traînent.*"},
 {"dur":6.0,"kind":"text","title":"Compare tes 3 premiers tours *virage par virage.* Celui qui coûte encore au 3e, *c'est ta priorité.*"},
 {"dur":7.4,"kind":"cta","title":"*Enregistre* pour ta prochaine séance. Envoie à ton pote.","sub":"Le virage qui coûte, épisode 1","sfx":"sonic-logo"}]
print(sum(b["dur"] for b in beats))
p={"label":"","voice":"voice/2026-11-23-reel-virage-qui-coute.mp3","voiceVolume":1,"music":"music/apexai-theme-2026-11-23.mp3","musicVolume":0.1,"beats":beats,"captions":caps}
json.dump(p,open("reel-virage-qui-coute.json","w",encoding="utf8"),ensure_ascii=False,indent=1)
for c in caps: print(c)
