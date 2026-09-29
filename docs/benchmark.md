# Benchmark technologique

## Objectif

Le projet consiste à créer un dashboard personnalisable permettant à un utilisateur authentifié de s'abonner à des services et d'ajouter des widgets configurables. Les données doivent être récupérées depuis plusieurs sources et actualisées périodiquement.

Le sujet impose notamment :

- un serveur accessible sur le port `8080` ;
- un endpoint `GET /about.json` ;
- une authentification utilisateur avec confirmation de compte ;
- une autorisation OAuth 2.0 pour les services externes ;
- une gestion des services, widgets, abonnements et instances de dashboard ;
- une interface responsive et accessible ;
- une documentation des choix techniques ;
- une utilisation de `docker compose build` et `docker compose up`.

## Comparaison des choix

### Backend

| Option | Points forts | Limites | Décision |
|---|---|---|---|
| NestJS | Architecture modulaire, injection de dépendances, guards et DTOs | Plus structuré qu'Express seul | Retenu |
| Express | Très flexible et léger | Il faut organiser manuellement le projet | Non retenu |
| Fastify | Performant et léger | Moins familier pour l'équipe et moins intégré à notre structure | Non retenu |

### Frontend

| Option | Points forts | Limites | Décision |
|---|---|---|---|
| Vue.js | Composants réactifs, syntaxe accessible, bonne intégration TypeScript | Écosystème plus réduit que React | Retenu |
| React | Écosystème important et très répandu | Plus de choix à structurer pour une équipe débutante | Non retenu |
| Angular | Framework complet et fortement structuré | Plus lourd pour notre besoin | Non retenu |

### Base de données

| Option | Points forts | Limites | Décision |
|---|---|---|---|
| PostgreSQL | Relations, contraintes d'intégrité, JSONB et bonne compatibilité Docker | Nécessite un schéma relationnel | Retenu |
| MySQL | Relationnel et répandu | Moins adapté à certains usages PostgreSQL/JSONB | Non retenu |
| MongoDB | Schéma flexible et documents JSON | Moins adapté aux nombreuses relations du projet | Non retenu |

### ORM

| Option | Points forts | Limites | Décision |
|---|---|---|---|
| Prisma | Client TypeScript typé, schéma lisible et migrations versionnées | Ajoute une couche d'abstraction | Retenu |
| TypeORM | Intégration NestJS et approche orientée objet | Typage et migrations moins prévisibles selon les usages | Non retenu |
| SQL natif | Contrôle complet des requêtes | Plus de code répétitif et moins de typage applicatif | Non retenu |

## Choix retenus

| Technologie | Utilisation | Justification |
|---|---|---|
| Node.js | Runtime backend | Même langage côté serveur et côté client, adapté aux API et aux appels externes. |
| NestJS | Framework backend | Architecture modulaire avec controllers, services, guards, DTOs et injection de dépendances. |
| Vue.js 3 | Framework frontend | Composants réutilisables et réactivité adaptée à un dashboard personnalisable. |
| Vite | Outil frontend | Démarrage rapide et configuration légère pour Vue.js. |
| PostgreSQL | Base de données | Modèle relationnel adapté aux utilisateurs, services, widgets et abonnements. |
| Prisma | ORM | Schéma typé, migrations explicites et intégration TypeScript. |
| Bootstrap CSS | Styles généraux | Grille, formulaires, espacements et responsive sans fournir de dashboard prêt à l'emploi. |
| Docker Compose | Environnement | Démarrage reproductible du frontend, du backend et de PostgreSQL. |

## Architecture

```text
Navigateur
    │
    ├── frontend/ Vue.js + Vite + Bootstrap CSS :5173
    │
    └── backend/ NestJS :8080
             │
             ├── AuthModule
             ├── UsersModule
             ├── ServicesModule
             ├── WidgetsModule
             ├── DashboardModule
             ├── AboutModule
             ├── Prisma ORM
             └── PostgreSQL :5432
```

Le projet contient une migration Prisma unique :

```text
backend/prisma/migrations/init_dashbord/migration.sql
```

## OAuth manuel

Le sujet interdit les bibliothèques qui implémentent OAuth entièrement à la place de l'équipe. Le flux GitHub est donc développé avec les fonctionnalités natives de Node.js et NestJS :

- `fetch` pour les appels HTTP ;
- `URLSearchParams` pour construire l'URL d'autorisation ;
- `crypto.randomBytes` pour le `state` ;
- `crypto.createHash` pour stocker le hash du `state` ;
- `crypto.createCipheriv` avec AES-256-GCM pour chiffrer le token ;
- Prisma pour les états OAuth et les connexions externes.

La dméarche du projet fonctionne comme ça :

1. l'utilisateur se connecte au dashboard avec son compte local ;
2. il demande à connecter GitHub ;
3. le backend génère un `state` temporaire et redirige vers GitHub ;
4. GitHub renvoie un `code` et le `state` ;
5. le backend vérifie le `state` ;
6. le backend échange le code contre un token ;
7. le profil GitHub est récupéré ;
8. le compte GitHub est associé à l'utilisateur local ;
9. le token est chiffré avant son stockage.

Le secret GitHub reste uniquement côté backend. Il n'est jamais transmis au frontend.

## Contraintes frontend

L'utilisation de bibliothèque qui fournit directement un dashboard, des widgets ou une interface d'administration complète, comme Nuxt UI, Untitled UI React, Vuetify, PrimeVue, CoreUI ou AdminLTE sont interdites.

Bootstrap est utilisé uniquement comme outil CSS. Il ne crée ni la structure métier du dashboard, ni les widgets, ni leur logique de configuration.

Chaque dépendance supplémentaire devra être justifiée selon :

- le besoin couvert ;
- les alternatives étudiées ;
- l'impact sur la sécurité et la maintenance ;
- la conformité avec les consignes du sujet.

## Sécurité

Les données sensibles sont traitées côté backend :

- les mots de passe utilisent `crypto.scrypt` et un sel aléatoire ;
- les tokens de confirmation et de session sont hashés en base ;
- le token de session est placé dans un cookie `HttpOnly` ;
- le token OAuth GitHub est chiffré en AES-256-GCM ;
- les secrets sont fournis par l'environnement et ne doivent pas être commit ;
- les routes protégées utilisent un guard NestJS.

## Décision finale

La stack retenue est :

**NestJS + Vue.js + Prisma + PostgreSQL + Bootstrap CSS + Docker Compose**.

Une API modulaire, une interface composable, une base relationnelle, des migrations versionnées et un environnement reproductible.
