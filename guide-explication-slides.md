# Guide simple pour expliquer les diapositives

Ce document sert à comprendre les idées et les illustrations. Il n’est pas nécessaire de le lire mot à mot pendant la présentation. Chaque partie donne le message principal, une façon simple de l’expliquer et le point à retenir.

## Diapositive 1 : le problème à résoudre

**L’idée :** Quand une route est inondée ou bloquée, rejoindre un centre de santé ou une pharmacie devient plus difficile.

**Comment comprendre l’illustration :** Les routes représentent les trajets dans Dakar. Les points montrent les personnes, les alertes et les services de santé. L’eau peut couper un trajet habituel.

**À retenir :** Le projet cherche à aider les personnes à trouver un chemin plus sûr vers les soins grâce à de meilleures informations sur les routes.

## Diapositive 2 : trois informations différentes

**L’idée :** Pour connaître la situation, il faut réunir trois types d’informations.

**Comment comprendre le diagramme :**

1. La carte indique où se trouvent les rues.
2. La météo et l’historique aident à repérer les zones où le risque peut être élevé.
3. Les usagers et les agents décrivent ce qu’ils observent réellement sur le terrain.

**À retenir :** Une carte ne dit pas si une rue est bloquée aujourd’hui. La pluie ou un ancien épisode d’inondation non plus. Une observation récente doit encore être vérifiée.

## Diapositive 3 : comparer les sources

**L’idée :** Chaque source a une utilité différente. Elles ne se remplacent pas les unes les autres.

**Comment comprendre le schéma :** OpenStreetMap donne une base de rues. Les signalements apportent des informations locales et récentes. La météo et les cartes historiques donnent du contexte. Les sources commerciales ou partenaires ne sont pas nécessaires pour démarrer.

**À retenir :** La combinaison la plus réaliste pour le POC est une carte ouverte, des signalements locaux et un peu de contexte météo ou historique. Les licences, la disponibilité et le détail à Dakar restent à vérifier avant l’intégration.

## Diapositive 4 : de l’observation à l’information partagée

**L’idée :** La collecte commence par les personnes. L’agent garde la responsabilité de vérifier et de mettre à jour le statut.

**Comment comprendre le parcours :** Un usager signale un problème. D’autres usagers peuvent donner leur avis : ils confirment le problème ou signalent que le passage semble praticable. L’agent utilise ces avis comme indices, puis vérifie l’information. Une fois partagée dans une vraie base serveur, l’information peut être consultée par les autres utilisateurs.

**À retenir :** Les votes aident à repérer les alertes qui méritent de l’attention, mais ils ne ferment pas une route et ne remplacent pas la vérification terrain. Dans cette démo, les votes et les signalements sont enregistrés dans le navigateur. Ils ne sont pas encore partagés entre plusieurs appareils.

## Diapositive 5 : une combinaison adaptée au POC

**L’idée :** Il vaut mieux construire une solution simple qui peut être testée que dépendre d’une source difficile d’accès.

**Comment comprendre les trois blocs :**

1. OpenStreetMap sert à situer les rues et à préparer un itinéraire de base.
2. Les signalements et les observations d’agents décrivent les conditions locales.
3. La météo et l’historique donnent des indices complémentaires, sans certifier l’état d’une rue.

**À retenir :** Cette combinaison permet de commencer dans une petite zone pilote, sans attendre l’accès à un service externe incertain.

## Diapositive 6 : avancer en cinq semaines

**L’idée :** Le travail peut progresser par étapes, en commençant par vérifier ce qui est réellement disponible.

**Comment comprendre la ligne du temps :**

1. Vérifier les routes et les sources pour une zone pilote.
2. Préparer le formulaire de collecte.
3. Relier les signalements à une base partagée.
4. Tester la vérification avec des personnes sur le terrain.
5. Présenter une démonstration et les résultats obtenus.

**À retenir :** Le prototype montre déjà le parcours et les rôles, mais le partage réel nécessite une API, une base serveur et des comptes adaptés.

## Comment fonctionne le vote dans cette démo

- Un profil usager peut choisir « Je confirme » ou « C’est praticable » pour un signalement actif.
- Le même profil ne peut garder qu’un avis par signalement. Il peut modifier ou retirer son choix.
- Les profils agents voient le nombre d’avis, mais seuls les agents peuvent confirmer ou résoudre le signalement.
- Les avis sont conservés localement dans le navigateur. Le vote n’est pas encore un vote collectif partagé entre de vrais utilisateurs.
- Pour une vraie communauté, il faudra des comptes, une base serveur commune et des règles contre les abus, les doublons et les informations trompeuses.
