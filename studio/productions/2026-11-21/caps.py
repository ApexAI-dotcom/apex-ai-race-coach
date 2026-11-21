import json
p=json.load(open('reel-virage-rapide.json',encoding='utf8'))
C=[(0.0,"Tu perds plus de temps"),(1.04,"à 115 km/h…"),(2.8,"qu'à 58."),(4.52,"Virage 1."),(5.68,"Ton meilleur tour le passe"),(6.64,"à 115,"),(7.64,"presque à fond."),(8.76,"Au tour 9…"),(9.88,"un petit lever de pied."),(11.56,"10 km/h de moins."),(13.08,"Résultat :"),(14.1,"24 centièmes de perdus,"),(15.52,"sur 125 mètres."),(17.18,"Et au virage le plus lent"),(18.2,"du circuit, le 8 ?"),(19.92,"Rien."),(20.76,"Zéro centième d'écart."),(22.52,"À haute vitesse,"),(23.48,"chaque km/h perdu"),(24.72,"se paie sur toute"),(25.68,"la ligne droite qui suit."),(27.28,"Alors, à ta prochaine séance…"),(29.36,"regarde ta vitesse mini"),(30.52,"dans ton virage le plus rapide."),(32.44,"Si elle baisse"),(33.0,"d'un tour à l'autre…"),(34.12,"c'est là que tu lèves le pied.")]
ends=[c[0] for c in C[1:]]+[35.75]
caps=[]
for (t0,tx),t1 in zip(C,ends):
    caps.append({"t0":t0,"t1":round(min(t1,t0+3.2),2),"text":tx})
p["captions"]=caps
json.dump(p,open('reel-virage-rapide.json','w',encoding='utf8'),ensure_ascii=False,indent=1)
