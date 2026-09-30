# Authentification du Dashboard

L’authentification locale est implémentée dans NestJS sans librairie OAuth ou système d’authentification tout-en-un.

## Architecture

```text
AuthController
    ↓
AuthService
    ↓
UsersRepository + PrismaService
```

- `UsersRepository` accède aux utilisateurs.
- `AuthService` gère les mots de passe, confirmations et sessions.
- `AuthGuard` vérifie le cookie de session avant une route protégée.
- les mots de passe utilisent `crypto.scrypt` avec un sel aléatoire ;
- les tokens de confirmation et de session sont stockés sous forme de hash.

## Routes

| Méthode | Route | Description |
|---|---|---|
| POST | `/auth/signup` | Crée un compte non confirmé. |
| GET | `/auth/confirm?token=...` | Confirme le compte. |
| POST | `/auth/login` | Ouvre une session HTTP-only. |
| POST | `/auth/logout` | Supprime la session courante. |
| GET | `/auth/me` | Vérifie la session courante. |

Le backend envoie le lien de confirmation via SMTP. En développement, les emails sont interceptés par Mailpit et consultables sur `http://localhost:8025`. Le token n'est pas retourné dans la réponse HTTP.

## Session

Après connexion, le serveur crée un token aléatoire et ne conserve que son hash dans la table `Session`. Le token est envoyé dans un cookie `HttpOnly`, `SameSite=Lax`, valable sept jours.
