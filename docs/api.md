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

## OAuth GitHub

```text
GET /auth/github/login  # connexion avec GitHub
GET /auth/github        # liaison GitHub depuis un compte local connecté
GET /auth/github/callback
GET /auth/github/status
DELETE /auth/github
```

Le flux OAuth utilise un `state` à usage unique. Le callback redirige vers le frontend après une connexion, une annulation ou une tentative de liaison déjà utilisée par un autre compte.

## Widgets

```text
GET /widgets/:service/:widget
```

Cette route est protégée et utilise le token du compte connecté lorsque le service est GitHub.

Widgets GitHub :

- `recent_commits` avec `repository` et `number` ;
- `open_pull_requests` avec `repository` et `number` ;
- `contribution_activity` avec `username` et `number` ;
- `search_repositories` avec `query` et `number` pour l’autocomplétion.

Widgets météo Open-Meteo :

- `search_cities` avec `name` et `count` ;
- `current_weather` avec `latitude`, `longitude` et `unit` ;
- `rain_probability` avec `latitude` et `longitude`.

## Format des erreurs

Les erreurs de validation renvoient `400`. Une session absente ou expirée renvoie `401`. Une ressource ou un widget inexistant renvoie `404`. Une API externe indisponible renvoie `503` avec un message exploitable par le frontend.
