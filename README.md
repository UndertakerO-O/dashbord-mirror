# Dashboard

Dashboard personnalisable permettant à un utilisateur authentifié de suivre plusieurs services au même endroit grâce à des widgets configurables.

## Fonctionnalités actuelles

- inscription et confirmation de compte par email avec Mailpit en développement ;
- connexion locale avec session persistante ;
- connexion et liaison GitHub avec OAuth 2.0 implémenté manuellement ;
- recherche de dépôts GitHub par nom ;
- widgets GitHub : commits récents, pull requests ouvertes et activité publique ;
- widgets météo Open-Meteo : météo actuelle et probabilité de pluie ;
- recherche de villes avec autocomplétion ;
- ajout, configuration, déplacement, suppression et rafraîchissement individuel des widgets ;
- sauvegarde de la configuration du dashboard dans le navigateur ;
- endpoint obligatoire `/about.json` ;
- architecture NestJS modulaire, PostgreSQL et Prisma ;
- exécution avec Docker Compose.

## Technologies

- Backend : NestJS, Node.js et TypeScript
- Frontend : Vue.js 3, Vite et TypeScript
- Base de données : PostgreSQL
- ORM : Prisma
- Styles : Bootstrap CSS et CSS applicatif écrit dans le projet
- Conteneurisation : Docker Compose
- APIs externes : GitHub API et Open-Meteo

Bootstrap est utilisé uniquement pour la grille, les formulaires, les espacements et le responsive. Aucun dashboard, widget ou composant métier prêt à l’emploi n’est utilisé.

## Démarrage

```bash
docker compose build
docker compose up
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
- description serveur : `http://localhost:8080/about.json` ;
- Mailpit : `http://localhost:8025`.

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
