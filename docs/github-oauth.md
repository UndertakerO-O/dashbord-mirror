# OAuth GitHub manuel

Le projet utilise le flux OAuth GitHub

## Configuration

1. Créer une OAuth App dans GitHub.
2. Déclarer cette callback URL : `http://localhost:8080/auth/github/callback`.
3. Copier les valeurs dans le fichier `.env` à la racine du projet, à partir de `backend/.env.example` :
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `GITHUB_REDIRECT_URI`
   - `OAUTH_ENCRYPTION_KEY` : 32 octets aléatoires encodés en hexadécimal, soit 64 caractères. (peut etre generer avec : `openssl rand -hex 32`)

## Flux implémenté

- `GET /auth/github` est protégé par la session locale et crée un `state` aléatoire à usage unique.
- GitHub renvoie `code` et `state` vers `GET /auth/github/callback`.
- Le backend vérifie le `state`, échange le code contre un token et demande le profil GitHub.
- Le compte GitHub est associé à l'utilisateur local authentifié.
- Le token est chiffré en AES-256-GCM avant son stockage en base.

Les scopes utilisés sont `read:user user:email`. Le secret GitHub reste uniquement côté backend.

Références : [GitHub OAuth web application flow](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps) et [GitHub OAuth scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps).
