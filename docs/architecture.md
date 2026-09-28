# Architecture du Dashboard

## Vue d’ensemble

```text
Navigateur
    │
    ├── Vue.js + Vue Router + Bootstrap CSS :5173
    │
    └── NestJS REST API :8080
             │
             ├── Modules métier
             ├── AuthGuard et sessions
             ├── Prisma ORM
             └── PostgreSQL :5432
```

## Backend NestJS

Le backend est organisé par modules :

- `auth` : inscription, confirmation, connexion, déconnexion et protection des routes ;
- `users` : accès aux utilisateurs et données de compte ;
- `services` : catalogue des services et futurs connectors ;
- `widgets` : configuration et exécution des widgets ;
- `dashboard` : instances de widgets propres à un utilisateur ;
- `database` : connexion Prisma ;
- `about` : endpoint de découverte demandé par le sujet.

Les controllers exposent HTTP, les services portent la logique métier et les repositories isolent l’accès aux données.

## Modèle de données

Les principaux modèles Prisma sont `User`, `Session`, `Service`, `Widget`, `WidgetParameter`, `Subscription` et `DashboardWidget`.

## Frontend Vue.js

Le frontend est organisé en API, composants, vues et router. Les widgets seront construits comme des composants Vue internes au projet. Aucune librairie de dashboard ou de widgets préfabriqués ne sera ajoutée.
