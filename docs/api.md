# API actuelle

## Découverte du serveur

```text
GET /about.json
```

Cette route publique décrit les services et widgets déclarés par l’application.

## Authentification

```text
POST /auth/signup
GET  /auth/confirm?token=...
POST /auth/login
POST /auth/logout
GET  /auth/me
```

Les routes protégées utilisent un cookie de session `HttpOnly` nommé `dashboard_session`.

## Format des erreurs

Les erreurs de validation renvoient un statut `400`. Une session absente ou expirée renvoie `401`. Les ressources inexistantes renvoient `404`.

Les routes de services et de widgets seront documentées lorsqu’elles seront implémentées.
