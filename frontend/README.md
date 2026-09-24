# Frontend Dashboard

Le frontend utilise Vue.js 3, Vite, Vue Router et Bootstrap CSS.

## Fonctionnalités actuelles

- inscription utilisateur ;
- confirmation de compte ;
- connexion avec session HTTP-only ;
- déconnexion ;
- route `/dashboard` protégée ;
- première vue vide prête à accueillir les widgets.

## Développement

```bash
npm install
npm run dev
```

Le frontend est disponible sur `http://localhost:5173` et appelle l’API NestJS sur `http://localhost:8080`.

## Architecture

```text
src/
├── api/          # appels HTTP vers le backend
├── components/   # composants réutilisables
├── views/        # pages liées aux routes
├── router.ts     # routes publiques et protégées
└── styles.css    # styles de l’application
```

Bootstrap est utilisé uniquement pour la grille, les formulaires et les styles de base. Le dashboard et les widgets seront développés par l’équipe.
