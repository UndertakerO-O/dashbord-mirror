# Dashboard

Dashboard personnalisable permettant à un utilisateur authentifié de suivre plusieurs services au même endroit grâce à des widgets configurables.

## Fonctionnalités actuelles

- inscription et confirmation de compte par email avec Mailpit en développement ;
- connexion avec session persistante ;
- frontend Vue.js responsive ;
- dashboard protégé ;
- endpoint obligatoire `/about.json` ;
- architecture NestJS modulaire ;
- persistance PostgreSQL avec Prisma ;
- exécution avec Docker Compose.

Les connecteurs de services externes et les widgets métier seront ajoutés progressivement. Ils ne sont pas encore finalisés.

## Technologies

- Backend : NestJS, Node.js et TypeScript
- Frontend : Vue.js 3, Vite et TypeScript
- Base de données : PostgreSQL
- ORM : Prisma
- Styles : Bootstrap CSS et CSS applicatif
- Conteneurisation : Docker Compose

Bootstrap est utilisé uniquement pour les styles généraux, les formulaires et le responsive. Aucun dashboard ou widget prêt à l’emploi n’est utilisé.

## Démarrage

```bash
docker compose build
docker compose up -d
```

Pour une première installation, appliquer les migrations et le seed :

```bash
docker compose up -d database
cd backend
DATABASE_URL="postgresql://dashboard:dashboard@localhost:5432/dashboard?schema=public" npx prisma migrate deploy
DATABASE_URL="postgresql://dashboard:dashboard@localhost:5432/dashboard?schema=public" npm run prisma:seed
cd ..
docker compose up -d
```

Adresses disponibles :

- frontend : `http://localhost:5173` ;
- backend : `http://localhost:8080` ;
- description serveur : `http://localhost:8080/about.json`.

## Documentation

- [Benchmark](docs/benchmark.md)
- [Architecture](docs/architecture.md)
- [Installation et Docker](docs/setup.md)
- [Emails de développement](docs/email-development.md)
- [API](docs/api.md)
- [Authentification backend](docs/authentication.md)
- [Authentification frontend](docs/frontend-authentication.md)
- [OAuth GitHub manuel](docs/github-oauth.md)
- [Matrice de décision](decision-matrix.md)
- [Guide utilisateur](docs/user-guide.md)
