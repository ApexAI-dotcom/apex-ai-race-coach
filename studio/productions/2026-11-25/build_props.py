import json
W=json.load(open("words.json",encoding="utf8"))['words']
ws=[(w["text"],w["start"],w["end"]) for w in W if w.get("type","word")=="word" and w["text"]!="..."]
# phrase corrigée (voir splice_voice.py) : nouveaux temps de mots, suite décalée de 0,42 s
NEW=[("Il",0,.16),("coûtait",.2,.48),("sur",.56,.64),("la",.72,.8),("plupart",.84,1.12),("des",1.2,1.28),("tours.",1.32,1.69)]
D=0.42
ws=([w for w in ws if w[1]<15.4]+[(t,15.44+a,15.44+b) for t,a,b in NEW]
    +[(t,a+D,b+D) for t,a,b in ws if a>17])
m=[]
for t,a,b in ws:
    if t in ("?",":") and m: m[-1]=(m[-1][0]+" "+t,m[-1][1],b)
    elif t in ("virgule","vingt-six") and m[-1][0] in ("zéro","0,26"): m[-1]=("0,26",m[-1][1],b)
    else: m.append((t,a,b))
# sous-titres : groupes choisis à la main (nombre de mots, texte affiché), calés sur les temps de la transcription
G=[(4,"Tu rates un virage"),(2,"une fois."),(3,"Faut-il s'en inquiéter ?"),(4,"Regarde ce virage 10."),
(4,"Presque tous les passages"),(4,"perdent trois fois rien."),(4,"Un seul en perd"),(2,"0,26 seconde."),
(3,"Une erreur isolée,"),(6,"ça arrive à tout le monde."),(3,"Le virage 7,"),(3,"dans l'épisode 1,"),(2,"c'était l'inverse."),(2,"Il coûtait"),(5,"sur la plupart des tours."),
(3,"Isolée, ou répétée ?"),(4,"C'est la seule question."),(3,"Une erreur isolée,"),(1,"oublie-la."),(4,"Une erreur qui revient,"),(1,"travaille-la."),
(3,"Enregistre cette règle,"),(5,"ou envoie-la à un pilote"),(3,"de ton circuit."),(5,"Épisode 3 la semaine prochaine.")]
caps=[];i=0
for n,txt in G:
    caps.append({"t0":round(m[i][1],2),"t1":round(m[i+n-1][2]+0.2,2),"text":txt}); i+=n
assert i==len(m),(i,len(m))
for a,b in zip(caps,caps[1:]):
    if a["t1"]>b["t0"]: a["t1"]=b["t0"]
# temps perdu par passage au virage 10 (analyse du 22/11), ordre de la séance, sans numéro de tour
V10=[0.114,0.066,0.056,0.007,0.015,0.0,0.258,0.042,0.031,0.007]
beats=[
 {"dur":3.1,"kind":"hook","center":True,"title":"Raté une fois. *Inquiétant ?*","visual":"trace-zoom","corner":10},
 {"dur":1.6,"kind":"visual","visual":"trace-zoom","corner":10,"title":"Regarde le *virage 10.*"},
 {"dur":7.9,"kind":"passes","values":V10,"title":"Presque tous : *trois fois rien.*","title2":"Une erreur *isolée.*","title2At":5.5,"cues":[2.75,4.65],"sfx":"soft-impact","sfxAt":4.65},
 {"dur":4.92,"kind":"visual","visual":"trace-zoom","corner":7,"label":"Rappel · épisode 1","title":"Virage 7 : *l'inverse.*","sub":"Il coûtait sur la plupart des tours.","subAt":2.8},
 {"dur":3.2,"kind":"text","center":True,"title":"*Isolée* ou *répétée ?*","sub":"C'est la seule question.","subAt":1.95},
 {"dur":4.3,"kind":"rule","label":"La règle à garder","cues":[2.05],"sfx":"pings","sfxAt":2.05},
 {"dur":5.68,"kind":"cta","title":"*Enregistre* la règle. Envoie-la à un pilote.","sub":"Épisode 3 la semaine prochaine","button":"","sfx":"sonic-logo"}]
print(round(sum(b["dur"] for b in beats),2))
p={"label":"","voice":"voice/2026-11-25-reel-une-seule-fois-v2.mp3","voiceVolume":1,"music":"music/apexai-theme-2026-11-25.mp3","musicVolume":0.1,"beats":beats,"captions":caps}
json.dump(p,open("reel-une-seule-fois.json","w",encoding="utf8"),ensure_ascii=False,indent=1)
for c in caps: print(c["t0"],c["t1"],c["text"])
