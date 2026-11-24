import json
# transcription mot a mot (ElevenLabs scribe) de la voix Sid, 18,96 s
raw="Moi 0 0.32|Je 0.72 0.8|freine 0.88 1.12|toujours 1.16 1.44|au 1.48 1.52|même 1.6 1.68|panneau. 1.76 2.08|Ma 2.587 2.64|trace 2.8 2.96|dit 3.04 3.12|autre 3.16 3.36|chose. 3.44 3.76|Neuf 4.24 4.4|tours. 4.48 5.28|Les 5.36 5.44|points 5.52 5.6|de 5.64 5.68|freinage 5.72 6.08|s'étalent 6.16 6.48|sur 6.56 6.8|toute 6.853 6.96|la 7.04 7.12|zone. 7.2 7.52|Sur 8.027 8.08|un 8.12 8.16|autre 8.24 8.4|virage, 8.52 9.04|tu 9.12 9.2|freines 9.28 9.44|au 9.52 9.6|même 9.68 9.84|endroit. 9.92 10.56|Donc 10.64 10.76|tu 10.8 10.88|sais 10.92 11.04|le 11.08 11.12|faire. 11.2 11.44|Choisis 11.947 12.24|un 12.28 12.32|repère 12.44 12.72|fixe 12.84 13|par 13.04 13.2|virage. 13.32 14|Puis 14.08 14.24|vérifie-le 14.48 14.96|sur 15.04 15.12|ta 15.2 15.28|trace. 15.48 15.88|Identifie 16.293 16.56|le 16.64 16.8|pote 16.88 17.04|qui 17.12 17.2|freine 17.28 17.6|toujours 17.64 18|au 18.04 18.08|même 18.16 18.24|endroit. 18.32 18.96"
ws=[]
for x in raw.split("|"):
    t,a,b=x.split(" "); ws.append((t,float(a),float(b)))
ws[0]=("Moi ?",0.0,0.68)
groups=[];cur=[]
for w in ws:
    cur.append(w)
    if w[0][-1] in ".?,": groups.append(cur);cur=[]
if cur: groups.append(cur)
sg=[]
for g in groups:
    if len(g)>5:
        k=(len(g)+1)//2; sg+= [g[:k],g[k:]]
    else: sg.append(g)
# Moi ? seul puis la suite
caps=[{"t0":round(g[0][1],2),"t1":round(g[-1][2]+0.2,2),"text":" ".join(x[0] for x in g)} for g in sg]
caps[0]["t0"]=0.0
for a,b in zip(caps,caps[1:]):
    if a["t1"]>b["t0"]: a["t1"]=b["t0"]
beats=[
 {"dur":2.4,"kind":"hook","title":"POV : tu freines toujours *au même panneau.*","visual":"trace-zoom","corner":2},
 {"dur":1.8,"kind":"visual","visual":"trace-zoom","corner":2,"title":"Ta trace dit *autre chose.*","sfx":"marker"},
 {"dur":3.7,"kind":"hero","number":"9","unit":"tours","tone":"red","title":"Tes points de freinage *s'étalent.*","sfx":"soft-impact"},
 {"dur":4.0,"kind":"text","title":"Sur un autre virage, *tu freines au même endroit.* Donc *tu sais le faire.*"},
 {"dur":4.3,"kind":"text","title":"Un repère fixe *par virage.* Puis *vérifie-le* sur ta trace."},
 {"dur":4.2,"kind":"cta","title":"*Identifie* le pote qui freine toujours au même endroit.","sub":"POV paddock, épisode 1","sfx":"sonic-logo"}]
print(sum(b["dur"] for b in beats))
p={"label":"","voice":"voice/2026-11-24-reel-pov-freinage.mp3","voiceVolume":1,"music":"music/apexai-theme-2026-11-24.mp3","musicVolume":0.1,"beats":beats,"captions":caps}
json.dump(p,open("reel-pov-freinage.json","w",encoding="utf8"),ensure_ascii=False,indent=1)
for c in caps: print(c)
