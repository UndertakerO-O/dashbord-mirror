# Matrice de décision technologique

Cette matrice compare plusieurs technologies adaptées au projet Dashboard.

Les notes vont de 1 à 5 :

- 1 = mauvais choix
- 5 = excellent choix

Le score est calculé ainsi : `note × coefficient`.

## Choix du backend

| Critère | Coefficient | Node.js / NestJS | Python / FastAPI | Java / Spring |
|---|---:|---:|---:|---:|
| Facilité d’apprentissage | 3 | 5 -> 15 | 4 -> 12 | 3 -> 9 |
| Qualité de l’écosystème | 3 | 5 -> 15 | 5 -> 15 | 5 -> 15 |
| API REST et temps réel | 3 | 5 -> 15 | 4 -> 12 | 4 -> 12 |
| Intégration Docker | 2 | 5 -> 10 | 5 -> 10 | 4 -> 8 |
| Communauté et documentation | 3 | 5 -> 15 | 5 -> 15 | 5 -> 15 |
| Progression personnelle | 2 | 5 -> 10 | 4 -> 8 | 3 -> 6 |
| **Total** | **16** | **80** | **72** | **65** |

## Choix du frontend

| Critère | Coefficient | Vue.js | React | Angular |
|---|---:|---:|---:|---:|
| Facilité d’apprentissage | 3 | 5 -> 15 | 4 -> 12 | 3 -> 9 |
| Qualité de l’écosystème | 3 | 4 -> 12 | 5 -> 15 | 5 -> 15 |
| Création de dashboards | 3 | 5 -> 15 | 5 -> 15 | 4 -> 12 |
| Intégration avec Docker | 2 | 5 -> 10 | 5 -> 10 | 4 -> 8 |
| Communauté et documentation | 3 | 5 -> 15 | 5 -> 15 | 5 -> 15 |
| Progression personnelle | 2 | 5 -> 10 | 4 -> 8 | 4 -> 8 |
| **Total** | **16** | **77** | **75** | **67** |

## Recommandation

L’utilisation de NestJS pour le backend et de Vue.js pour le frontend. Ces technologies répondent bien aux besoins du projet Dashboard : API REST, authentification, intégration de services externes, widgets configurables et rafraîchissement régulier des données.

Les deux critères les plus importants sont d’abord la facilité d’apprentissage, car le projet comporte plusieurs fonctionnalités à développer, puis la qualité de l’écosystème. NestJS fournit une architecture claire et modulaire, idéale pour organiser les utilisateurs, services, widgets et authentifications. Vue.js permet de construire rapidement une interface réactive et personnalisable, ce qui correspond parfaitement à un dashboard.

Le principal compromis accepté est que React possède un écosystème légèrement plus vaste que Vue.js. Pour limiter cet inconvénient, nous utiliserons des bibliothèques reconnues comme, Pinia et Vue Router. Nous pourrons également ajouter des composants spécialisés pour les graphiques et le glisser-déposer.

Vue.js est simple à prendre en main et offre une structure davantage guidée. Pour ce projet, Vue.js permet donc de produire rapidement une application propre, maintenable et responsive.

Mon choix final est donc : **NestJS + Vue.js + **.
