# Installation et exécution

## Prérequis

- Node.js 22 ou supérieur ;
- npm ;
- Docker et Docker Compose.

Mailpit est lancé automatiquement par Docker Compose pour intercepter les emails de développement.

## Avec Docker Compose

```bash
docker compose build
docker compose up -d
```

La première initialisation de la base nécessite :

```bash
docker compose up -d database
cd backend
DATABASE_URL="postgresql://dashboard:dashboard@localhost:5432/dashboard?schema=public" npx prisma migrate deploy
DATABASE_URL="postgresql://dashboard:dashboard@localhost:5432/dashboard?schema=public" npm run prisma:seed
cd ..
docker compose up -d
```

## Vérifications

```bash
curl http://localhost:8080/about.json
```

Le frontend est disponible à l’adresse `http://localhost:5173`.

L'interface Mailpit est disponible à `http://localhost:8025`.

## Arrêt

```bash
docker compose down
```

Les données PostgreSQL restent dans le volume Docker `dashboard-postgres-data`.
