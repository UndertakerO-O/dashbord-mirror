# Backend Dashboard

Le backend est une API NestJS organisée par domaines fonctionnels.

## Responsabilités

- authentification, confirmation email et sessions ;
- validation des données entrantes ;
- description des services et widgets avec `/about.json` ;
- connecteurs GitHub et Open-Meteo ;
- exécution des widgets via une route générique ;
- accès à PostgreSQL avec Prisma.

## Architecture

```text
src/
├── about/       # Contrat de découverte du serveur
├── auth/        # Inscription, OAuth GitHub, connexion et guard
├── dashboard/   # Orchestration du dashboard utilisateur
├── database/    # PrismaService et connexion PostgreSQL
├── services/    # Connecteurs GitHub et Open-Meteo
├── users/       # Accès aux utilisateurs
└── widgets/     # Route d'exécution des widgets
```

Les controllers exposent HTTP, les services portent la logique métier et les repositories isolent l’accès aux données. Le connecteur GitHub récupère le token OAuth chiffré depuis la base ; le token n’est jamais envoyé au frontend.

## Commandes

```bash
npm install
npm run build
npm run start:dev
```

Les variables nécessaires sont listées dans `.env.example` et dans la documentation de configuration.
