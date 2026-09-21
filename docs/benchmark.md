# Benchmark technologique

## Objectif

Le projet consiste à créer un dashboard personnalisable permettant à un utilisateur authentifié de s’abonner à des services et d’ajouter des widgets configurables. Les données doivent être actualisées périodiquement.

Le sujet impose également :

- un serveur accessible sur le port `8080` ;
- un endpoint `GET /about.json` ;
- une authentification utilisateur ;
- une gestion des services, widgets et abonnements ;
- une interface responsive et accessible ;
- une documentation des choix techniques ;
- une utilisation de `docker-compose build` et `docker-compose up`.

## Choix retenus

| Technologie | Utilisation | Justification |
|---|---|---|
| Node.js | Runtime backend | Même langage côté serveur et côté client, écosystème adapté aux API et aux appels externes. |
| NestJS | Framework backend | Architecture modulaire, injection de dépendances, validation et organisation claire des fonctionnalités. |
| Vue.js 3 | Framework frontend | Syntaxe accessible, composants réutilisables et réactivité adaptée à un dashboard. |
| Vite | Outil frontend | Démarrage rapide et configuration légère pour Vue.js. |
| PostgreSQL | Base de données | Base relationnelle adaptée aux utilisateurs, services, widgets et relations entre ces éléments. |
| Prisma | ORM | Schéma typé, migrations explicites et bonne intégration avec TypeScript. |
| Docker Compose | Environnement d’exécution | Démarrage reproductible du backend, du frontend et de PostgreSQL. |

## Contraintes pédagogiques

### OAuth

Le flux OAuth sera implémenté manuellement à partir de la documentation du fournisseur. Nous utiliserons les fonctionnalités bas niveau de Node.js, comme `fetch` et `crypto`, pour :

1. générer et vérifier le paramètre `state` ;
2. rediriger l’utilisateur vers le fournisseur ;
3. recevoir le callback avec le code d’autorisation ;
4. échanger le code contre un token ;
5. récupérer l’identité de l’utilisateur ;
6. l’associer à un compte local ;
7. créer une session applicative.

Aucune librairie ne devra implémenter l’intégralité du flux OAuth à ma place.

### Widgets et dashboard

Les widgets, leur configuration, leur position, leur suppression et leur rafraîchissement seront développés par l’équipe. Je n’utiliserons pas de bibliothèque qui fournit directement un dashboard ou un système de widgets complet, comme NuxtUI ou UntitledUI React.

Bootstrap sera limité aux styles généraux, à la grille, aux formulaires et au responsive.

## Librairies à vérifier avant utilisation

Chaque dépendance supplémentaire devra être documentée et validée selon son rôle. En particulier, nous éviterons les librairies qui fournissent directement :

- un flux OAuth complet ;
- un dashboard prêt à l’emploi ;
- des widgets métier prêts à l’emploi ;
- un système de glisser-déposer spécialisé pour dashboards.

Les librairies utilitaires bas niveau et les outils de test restent à justifier dans la documentation.

## Architecture cible

```text
Navigateur
    │
    ├── frontend/ Vue.js + Vite + Bootstrap
    │
    └── backend/ NestJS :8080
             │
             ├── Prisma ORM
             └── PostgreSQL
```

## Décision finale

La stack retenue est :

**NestJS + Vue.js + Prisma + PostgreSQL + Bootstrap + Docker Compose**.

Cette décision devra être réévaluée uniquement si une contrainte du sujet ou une validation des encadrants l’exige.
