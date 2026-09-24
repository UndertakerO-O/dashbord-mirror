# Frontend : authentification

Le frontend Vue.js consomme les routes d’authentification NestJS avec `credentials: 'include'` afin que le cookie de session soit envoyé automatiquement.

## Pages disponibles

- `/signup` : création de compte ;
- `/confirm` : confirmation du compte ;
- `/login` : connexion ;
- `/dashboard` : page protégée après connexion.

Le guard du router appelle `GET /auth/me` avant d’autoriser l’accès au dashboard. Si la session est absente ou expirée, l’utilisateur est redirigé vers `/login`.

Les formulaires utilisent des labels, des messages d’erreur accessibles et une mise en page responsive. Bootstrap sert uniquement de base visuelle ; les widgets et la structure du dashboard seront implémentés dans le projet.
