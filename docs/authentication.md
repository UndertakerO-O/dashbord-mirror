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

En développement, `signup` retourne le token de confirmation pour permettre les tests. En production, ce token devra être envoyé par email et ne devra pas être inclus dans la réponse HTTP.

## Session

Après connexion, le serveur crée un token aléatoire et ne conserve que son hash dans la table `Session`. Le token est envoyé dans un cookie `HttpOnly`, `SameSite=Lax`, valable sept jours.
