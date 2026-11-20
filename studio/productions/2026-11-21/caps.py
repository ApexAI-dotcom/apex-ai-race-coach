import json
p=json.load(open('reel-virage-rapide.json'))
C=[(0.0,"Tu perds plus de temps"),(1.0,"à 115 km/h…"),(2.72,"qu'à 58."),(4.16,"Virage 1."),(5.28,"Ton meilleur tour le passe"),(6.32,"à 115,"),(7.32,"presque à fond."),(8.36,"Au tour 9…"),(9.48,"un petit lever de pied."),(11.2,"10 km/h de moins."),(12.72,"Résultat :"),(13.6,"24 centièmes de perdus,"),(15.12,"sur 140 mètres."),(16.56,"Et au virage le plus lent"),(17.6,"du circuit, le 8 ?"),(19.28,"Rien."),(20.16,"Zéro centième d'écart."),(21.84,"À haute vitesse,"),(22.8,"chaque km/h perdu"),(24.0,"se paie sur toute"),(24.96,"la ligne droite qui suit."),(26.48,"Alors, à ta prochaine séance…"),(28.48,"regarde ta vitesse mini"),(29.73,"dans ton virage le plus rapide."),(31.52,"Si elle baisse"),(32.12,"d'un tour à l'autre…"),(33.32,"c'est là que tu lèves le pied.")]
ends=[c[0] for c in C[1:]]+[35.03]
caps=[]
for (t0,tx),t1 in zip(C,ends):
    caps.append({"t0":t0,"t1":round(min(t1,t0+3.2),2),"text":tx})
p["captions"]=caps
json.dump(p,open('reel-virage-rapide.json','w'),ensure_ascii=False,indent=1)
