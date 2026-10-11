# Dashboard

## Présentation du projet

Dashboard est une application web personnalisable qui regroupe plusieurs services externes dans une seule interface. L’utilisateur crée un compte, confirme son adresse email, associe éventuellement son compte GitHub, puis compose son propre espace de suivi à l’aide de widgets.

L’objectif du projet est de construire un dashboard simple à comprendre et à faire évoluer : chaque service est isolé dans un connecteur backend, chaque widget possède sa propre configuration et le frontend permet de gérer l’affichage sans imposer une interface de dashboard préfabriquée.

Le projet met particulièrement l’accent sur :

- une architecture NestJS modulaire et explicable ;
- une interface Vue.js responsive et accessible ;
- une authentification locale avec confirmation par email ;
- une implémentation manuelle du flux OAuth GitHub ;
- l’intégration de services externes au moyen de connecteurs dédiés ;
- la sauvegarde et l’actualisation indépendantes des widgets.

## Parcours utilisateur

1. L’utilisateur crée un compte avec une adresse email et un mot de passe répondant aux règles affichées.
2. Le backend envoie un email de confirmation. En développement, le message est consultable dans Mailpit.
3. Après confirmation, l’utilisateur ouvre une session avec un cookie `HttpOnly`.
4. Depuis le dashboard, il peut associer un compte GitHub avec OAuth ou utiliser le service météo sans OAuth.
5. Il ajoute, configure, déplace, actualise ou supprime ses widgets.
6. La configuration du dashboard est restaurée dans le navigateur lors d’une nouvelle visite.

## Fonctionnalités actuelles

- inscription et confirmation de compte par email ;
- connexion locale et session persistante ;
- liaison GitHub avec OAuth 2.0 implémenté manuellement ;
- sélection du compte GitHub avec `prompt=select_account` ;
- recherche de dépôts GitHub par nom ;
- widgets GitHub : commits récents, pull requests ouvertes et activité publique ;
- widgets météo Open-Meteo : météo actuelle et probabilité de pluie ;
- recherche de villes avec autocomplétion ;
- ajout guidé et configuration des widgets ;
- déplacement, suppression et rafraîchissement individuel des widgets ;
- affichage en mode consultation ou en mode édition ;
- sauvegarde locale de la configuration et des résultats ;
- endpoint obligatoire `/about.json` ;
- exécution avec Docker Compose.

## Architecture en bref

```text
Vue.js 3 + Vue Router + Bootstrap CSS
                 │
                 ▼
          API REST NestJS
          ├── Authentification et OAuth manuel
          ├── Gestion des widgets
          ├── Connecteur GitHub
          ├── Connecteur Open-Meteo
          └── Prisma ORM
                 │
                 ▼
             PostgreSQL
```

Le frontend ne contacte pas directement GitHub avec le token OAuth. Le backend récupère le token chiffré en base, appelle les APIs externes et renvoie uniquement les données nécessaires à l’affichage. Les paramètres d’affichage des widgets sont conservés dans le `localStorage` du navigateur.

## Technologies et justification

- **Backend : NestJS, Node.js et TypeScript** — architecture par modules, controllers et services clairement séparés.
- **Frontend : Vue.js 3, Vue Router et TypeScript** — interface réactive avec une structure accessible pour un projet de cette taille.
- **Base de données : PostgreSQL** — stockage relationnel des utilisateurs, sessions et connexions OAuth.
- **ORM : Prisma** — accès typé à la base et migrations versionnées.
- **Styles : Bootstrap CSS et CSS applicatif** — grille, formulaires, espacements et responsive.
- **Conteneurisation : Docker Compose** — démarrage reproductible du backend, du frontend, de PostgreSQL et de Mailpit.
- **APIs externes : GitHub API et Open-Meteo** — données réelles pour les widgets GitHub et météo.

Bootstrap est utilisé uniquement comme base CSS. Aucun dashboard, widget, générateur de page ou composant métier prêt à l’emploi n’est utilisé. La logique des widgets, leur configuration et leur affichage sont développés dans le projet.

## Démarrage avec Docker

### Prérequis

- Docker et Docker Compose ;
- Git ;
- un compte GitHub et une OAuth App uniquement pour tester les widgets GitHub.

Construire et démarrer les services :

```bash
docker compose up -d --build
```

Pour une première installation, initialiser la base :

```bash
docker compose up -d database
cd backend
DATABASE_URL="postgresql://dashboard:dashboard@localhost:5432/dashboard?schema=public" npx prisma migrate deploy
DATABASE_URL="postgresql://dashboard:dashboard@localhost:5432/dashboard?schema=public" npm run prisma:seed
cd ..
docker compose up -d
```

Pour utiliser GitHub OAuth, définir les variables de `backend/.env.example` dans l’environnement utilisé par Docker, notamment `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_REDIRECT_URI` et `OAUTH_ENCRYPTION_KEY`.

## Adresses disponibles

- frontend : `http://localhost:5173` ;
- backend : `http://localhost:8080` ;
- description serveur : `http://localhost:8080/about.json` ;
- interface Mailpit : `http://localhost:8025` ;
- PostgreSQL : `localhost:5432`.

Arrêter les conteneurs :

```bash
docker compose down
```

Le volume `dashboard-postgres-data` conserve les données PostgreSQL entre les redémarrages.

## Développement sans Docker

Backend :

```bash
cd backend
npm install
npm run start:dev
```

Frontend :

```bash
cd frontend
npm install
npm run dev
```

Les services PostgreSQL et Mailpit restent nécessaires pour utiliser toutes les fonctionnalités.

## Vérifications

```bash
cd backend && npm run build
cd ../frontend && npm run build
```

## Limites actuelles

- Mailpit intercepte les emails en développement ; un SMTP réel devra être configuré en production.
- La configuration du dashboard est sauvegardée dans le navigateur et n’est pas encore synchronisée entre plusieurs appareils.
- L’activité GitHub repose sur les événements publics récents et ne représente pas tout l’historique privé de contributions.
- Les services disponibles sont actuellement GitHub et Open-Meteo ; l’architecture permet d’ajouter d’autres connecteurs.

## Documentation

- [Benchmark et justification des choix](docs/benchmark.md)
- [Matrice de décision initiale](decision-matrix.md)
- [Architecture technique](docs/architecture.md)
- [Installation et Docker](docs/setup.md)
- [Guide utilisateur](docs/user-guide.md)
- [API](docs/api.md)
- [Authentification backend](docs/authentication.md)
- [Authentification frontend](docs/frontend-authentication.md)
- [OAuth GitHub manuel](docs/github-oauth.md)
- [Emails de développement avec Mailpit](docs/email-development.md)
