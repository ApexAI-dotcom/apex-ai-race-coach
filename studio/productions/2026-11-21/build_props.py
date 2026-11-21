import json
W=json.load(open("words.json",encoding="utf8"))['words']
sub={"cent quinze kilomètres-heure…":"115 km/h…","cinquante-huit.":"58.","cent quinze,":"115,","Dix kilomètres-heure":"10 km/h","vingt-quatre centièmes":"24 centièmes","cent vingt-cinq mètres.":"125 mètres.","kilomètre-heure":"km/h"}
ws=[(w["text"],w["start"],w["end"]) for w in W if w["type"]=="word" and not w["text"].startswith("[") and not w["text"].endswith("]")]
# merge '?' and ':' into previous
m=[]
for t,a,b in ws:
    if t in ("?",":") and m: m[-1]=(m[-1][0]+" "+t,m[-1][1],b)
    else: m.append((t,a,b))
# number merges
out=[];i=0
while i<len(m):
    done=False
    for k,v in sub.items():
        n=len(k.split(" "))
        if " ".join(x[0] for x in m[i:i+n])==k:
            out.append((v,m[i][1],m[i+n-1][2]));i+=n;done=True;break
    if not done: out.append(m[i]);i+=1
caps=[];cur=[]
for w in out:
    cur.append(w)
    end=w[0][-1] in ".?…,:"
    if (end and len(cur)>=2) or len(cur)>=4 or (end and w[0][-1] in ".?…"):
        caps.append({"t0":round(cur[0][1],2),"t1":round(cur[-1][2]+0.15,2),"text":" ".join(x[0] for x in cur)});cur=[]
if cur: caps.append({"t0":round(cur[0][1],2),"t1":round(cur[-1][2]+0.15,2),"text":" ".join(x[0] for x in cur)})
for a,b in zip(caps,caps[1:]):
    if a["t1"]>b["t0"]: a["t1"]=b["t0"]
beats=[
 {"dur":4.5,"kind":"hook","title":"Tu perds plus à *115 km/h qu'à 58.*","visual":"trace-zoom","corner":1},
 {"dur":4.2,"kind":"hero","number":"115","unit":"km/h","tone":"white","title":"Virage 1, presque à fond.","sub":"Ton meilleur tour, au point de corde.","sfx":"soft-impact"},
 {"dur":2.8,"kind":"visual","visual":"trace-zoom","corner":1,"title":"Au tour 9 : *un lever de pied.*","sfx":"marker"},
 {"dur":1.55,"kind":"hero","number":"−10","unit":"km/h","tone":"red","title":"au virage 1.","sub":"Au plus lent du virage."},
 {"dur":4.1,"kind":"hero","number":"+0,24","unit":"s","tone":"red","title":"perdues, juste là.","sub":"Sur les 125 m qui suivent.","sfx":"soft-impact"},
 {"dur":2.75,"kind":"visual","visual":"trace-zoom","corner":8,"title":"Et au virage *le plus lent ?*","sfx":"marker"},
 {"dur":2.6,"kind":"hero","number":"0,00","unit":"s","tone":"white","title":"d'écart au virage 8.","sub":"Le tour 9 y fait jeu égal.","sfx":"pings"},
 {"dur":4.75,"kind":"text","title":"À haute vitesse, chaque km/h perdu *se paie sur toute la ligne droite.*"},
 {"dur":5.15,"kind":"text","title":"À ta prochaine séance : ta vitesse mini *dans ton virage le plus rapide.*"},
 {"dur":3.3,"kind":"text","title":"Elle baisse d'un tour à l'autre ? *C'est là que tu lèves.*"},
 {"dur":2.6,"kind":"cta","sfx":"sonic-logo"}]
print(sum(b["dur"] for b in beats))
p={"label":"","voice":"voice/2026-11-21-reel-virage-rapide.mp3","voiceVolume":1,"music":"music/apexai-theme-2026-11-21.mp3","musicVolume":0.1,"beats":beats,"captions":caps}
json.dump(p,open("reel-virage-rapide.json","w",encoding="utf8"),ensure_ascii=False,indent=1)
for c in caps: print(c)
