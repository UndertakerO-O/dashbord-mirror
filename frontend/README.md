# Frontend Dashboard

Le frontend utilise Vue.js 3, Vite, Vue Router et Bootstrap CSS.

## Fonctionnalités actuelles

- inscription, validation du mot de passe et confirmation de compte ;
- connexion locale et connexion GitHub ;
- route `/dashboard` protégée ;
- ajout guidé de widgets ;
- widgets GitHub avec recherche de dépôts ;
- widgets météo avec recherche de villes ;
- mode consultation et mode édition ;
- déplacement, suppression et rafraîchissement individuel des widgets ;
- sauvegarde locale de la configuration du dashboard.

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
└── styles.css    # styles applicatifs
```

Bootstrap est utilisé uniquement pour la grille, les formulaires et les styles de base. La structure du dashboard, les widgets et leur logique sont écrits dans le projet.
