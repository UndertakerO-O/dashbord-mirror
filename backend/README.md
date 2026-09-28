# Backend Dashboard

Le backend est une API NestJS organisée par domaines fonctionnels.

## Responsabilités

- authentification et sessions ;
- validation des données entrantes ;
- description des services et widgets ;
- gestion future des abonnements et instances de widgets ;
- accès à PostgreSQL avec Prisma ;
- endpoint `GET /about.json`.

## Architecture

```text
src/
├── about/       # Contrat de découverte du serveur
├── auth/        # Inscription, confirmation, connexion et guard
├── dashboard/   # Orchestration du dashboard utilisateur
├── database/    # PrismaService et connexion PostgreSQL
├── services/    # Services externes et connectors
├── users/       # Accès et logique des utilisateurs
└── widgets/     # Logique des widgets
```

Chaque module reste responsable d’un domaine précis. Les accès à la base passent par Prisma et la logique métier reste dans les services NestJS.

## Commandes

```bash
npm install
npm run build
npm run start:dev
```

Les variables nécessaires sont listées dans `.env.example`.
