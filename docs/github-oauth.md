# OAuth GitHub manuel

Le projet implémente manuellement le flux OAuth GitHub avec `fetch`, `URLSearchParams` et les fonctions cryptographiques natives de Node.js. Aucune librairie ne réalise le flux OAuth à la place du projet.

## Configuration

1. Créer une OAuth App dans GitHub.
2. Déclarer cette callback URL : `http://localhost:8080/auth/github/callback`.
3. Copier les valeurs dans le fichier `.env` utilisé par Docker :

```env
GITHUB_CLIENT_ID=ton_client_id
GITHUB_CLIENT_SECRET=ton_client_secret
GITHUB_REDIRECT_URI=http://localhost:8080/auth/github/callback
OAUTH_ENCRYPTION_KEY=une_cle_hexa_de_64_caracteres
```

La clé de chiffrement peut être générée avec :

```bash
openssl rand -hex 32
```

## Flux implémenté

- `GET /auth/github/login` démarre une connexion GitHub ;
- `GET /auth/github` démarre une liaison depuis un compte local connecté ;
- le backend génère un `state` aléatoire à usage unique ;
- l’URL GitHub utilise `prompt=select_account` pour laisser l’utilisateur choisir son compte ;
- GitHub renvoie `code` et `state` vers le callback ;
- le backend vérifie le `state`, échange le code contre un token et demande le profil GitHub ;
- le compte GitHub est associé à l’utilisateur local ;
- le token est chiffré en AES-256-GCM avant son stockage en base.

Si le compte GitHub est déjà lié à un autre utilisateur, le backend redirige vers le dashboard avec une alerte frontend au lieu de retourner le JSON d’erreur.

Les scopes configurables sont définis par `GITHUB_OAUTH_SCOPES`. La valeur par défaut est `read:user user:email repo`, nécessaire pour les widgets liés aux dépôts privés accessibles par l’utilisateur. Le secret GitHub et le token OAuth restent uniquement côté backend.
