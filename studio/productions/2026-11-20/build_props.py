import json
W=[("Ton",0,0.133),("tour",0.16,0.42),("lent…",0.48,0.8),("bat",1.28,1.44),("ton",1.52,1.6),("meilleur",1.68,1.92),("tour.",2,2.4),("Le",3.029,3.04),("tour",3.12,3.2),("9 ?",3.28,4.08),("Une",4.16,4.24),("demi-seconde",4.32,4.8),("derrière",4.88,5.12),("le",5.16,5.2),("tour",5.28,5.44),("4,",5.48,5.84),("au",5.88,5.92),("chrono.",6.12,6.8),("Mais",6.84,6.88),("au",6.92,6.96),("virage",7.04,7.28),("3…",7.36,8),("c'est",8.053,8.16),("lui",8.2,8.4),("qui",8.48,8.56),("passe",8.613,8.72),("plus",8.8,8.88),("vite.",8.92,9.52),("4",9.56,9.68),("centièmes",9.76,10.16),("de",10.2,10.24),("mieux.",10.32,10.88),("Pourquoi ?",10.96,11.78),("Il",11.902,11.92),("garde",12,12.24),("plus",12.36,12.48),("de",12.52,12.56),("vitesse",12.6,12.88),("au",12.92,12.96),("point",13.04,13.12),("de",13.16,13.2),("corde :",13.28,13.88),("78 km/h,",13.92,15.36),("contre",15.48,15.6),("76.",15.68,16.8),("Et",16.84,16.88),("au",16.92,16.96),("virage",17.04,17.28),("12 ?",17.32,17.95),("Pareil.",17.973,18.64),("Encore",18.76,19.04),("4",19.12,19.28),("centièmes.",19.36,20.4),("Ton",20.48,20.56),("meilleur",20.6,20.88),("tour…",21.04,21.52),("n'est",21.56,21.76),("pas",21.84,21.92),("meilleur",21.96,22.24),("partout.",22.36,23.2),("Alors,",23.24,23.6),("à",23.64,23.68),("ta",23.76,23.84),("prochaine",23.92,24.16),("séance,",24.24,24.8),("ne",24.88,24.96),("jette",25.04,25.28),("pas",25.36,25.44),("tes",25.52,25.6),("tours",25.68,25.84),("lents.",25.88,26.48),("Cherche",26.52,26.8),("le",26.84,26.88),("virage",26.96,27.2),("où",27.24,27.333),("ils",27.387,27.44),("passent",27.52,27.68),("plus",27.76,27.84),("vite…",27.88,28.48),("et",28.56,28.64),("refais-le.",28.76,29.44)]
# groups: split by count of words in each group
caps=[];cur=[]
for w in W:
    cur.append(w)
    end=w[0][-1] in ".?…,:" 
    if (end and len(cur)>=2) or len(cur)>=4 or (end and w[0][-1] in ".?…" ):
        caps.append({"t0":round(cur[0][1],2),"t1":round(cur[-1][2]+0.15,2),"text":" ".join(x[0] for x in cur)});cur=[]
if cur: caps.append({"t0":round(cur[0][1],2),"t1":round(cur[-1][2]+0.15,2),"text":" ".join(x[0] for x in cur)})
for a,b in zip(caps,caps[1:]):
    if a["t1"]>b["t0"]: a["t1"]=b["t0"]
beats=[
 {"dur":3.0,"kind":"hook","title":"Ton tour lent bat *ton meilleur tour.*","visual":"trace-zoom","corner":3},
 {"dur":3.85,"kind":"hero","number":"+0,51","unit":"s","tone":"red","title":"Tour 9, au chrono.","sub":"Une demi-seconde derrière le tour 4.","sfx":"soft-impact"},
 {"dur":2.7,"kind":"visual","visual":"trace-zoom","corner":3,"title":"Mais au *virage 3…*","sfx":"marker"},
 {"dur":2.35,"kind":"hero","number":"−0,04","unit":"s","tone":"green","title":"pour le tour 9.","sub":"Il bat le meilleur tour ici.","sfx":"pings"},
 {"dur":1.95,"kind":"text","title":"Il garde plus de vitesse *au point de corde.*"},
 {"dur":3.0,"kind":"hero","number":"77,9","unit":"km/h","tone":"green","title":"au point de corde, tour 9.","sub":"Contre 75,6 km/h au tour 4.","sfx":"soft-impact"},
 {"dur":3.6,"kind":"visual","visual":"trace-zoom","corner":12,"title":"Virage 12 : *−0,04 s.*","sfx":"marker"},
 {"dur":2.77,"kind":"text","title":"Ton meilleur tour n'est pas *meilleur partout.*"},
 {"dur":3.28,"kind":"text","title":"À ta prochaine séance, ne jette pas *tes tours lents.*"},
 {"dur":3.1,"kind":"text","title":"Cherche le virage où ils passent plus vite. *Refais-le.*"},
 {"dur":2.6,"kind":"cta","sfx":"sonic-logo"}]
print(sum(b["dur"] for b in beats))
p={"label":"","voice":"voice/2026-11-20-reel-tour-lent.mp3","voiceVolume":1,"music":"music/apexai-theme-2026-11-20.mp3","musicVolume":0.1,"beats":beats,"captions":caps}
json.dump(p,open("reel-tour-lent.json","w"),ensure_ascii=False,indent=1)
for c in caps: print(c)
