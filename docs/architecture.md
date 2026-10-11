# Architecture du Dashboard

## Vue d’ensemble

```text
Navigateur
    │
    ├── Vue.js + Vue Router + Bootstrap CSS :5173
    │
    └── NestJS REST API :8080
             │
             ├── AuthModule et OAuth GitHub manuel
             ├── ServicesModule et connecteurs externes
             ├── WidgetsModule
             ├── Prisma ORM
             └── PostgreSQL :5432
```

## Backend NestJS

Le backend est organisé par modules :

- `auth` : inscription, confirmation, connexion, sessions et OAuth GitHub ;
- `users` : accès aux utilisateurs ;
- `services` : registre des connecteurs GitHub et Open-Meteo ;
- `widgets` : route générique d’exécution des widgets ;
- `dashboard` : logique liée au dashboard utilisateur ;
- `database` : connexion Prisma ;
- `about` : endpoint de découverte demandé par le sujet.

Le connecteur GitHub récupère le token OAuth chiffré en base et appelle l’API GitHub. Le connecteur météo appelle Open-Meteo pour le géocodage, la météo actuelle, la probabilité de pluie.

## Frontend Vue.js

Le frontend est organisé en API, composants, vues et router. `DashboardView.vue` gère l’ajout guidé, la configuration, la sauvegarde locale, le déplacement, la suppression et le rafraîchissement des widgets. Aucun composant de dashboard ou widget préfabriqué n’est utilisé.

## Données et sécurité

PostgreSQL conserve les utilisateurs, sessions, services, connexions OAuth et états OAuth. Les paramètres d’affichage des widgets sont sauvegardés dans le `localStorage` du navigateur. Les secrets et tokens OAuth restent côté backend.
