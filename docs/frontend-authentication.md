# Frontend : authentification

Le frontend Vue.js consomme les routes d’authentification NestJS avec `credentials: 'include'` afin que le cookie de session soit envoyé automatiquement.

## Pages disponibles

- `/signup` : création de compte et règles du mot de passe ;
- `/confirm` : confirmation du compte ;
- `/login` : connexion locale et bouton GitHub ;
- `/dashboard` : page protégée après connexion.

Le bouton Mailpit apparaît après l’inscription, directement dans le message demandant de vérifier la boîte email.

## Protection des routes

Le guard du router appelle `GET /auth/me` avant d’autoriser l’accès au dashboard. Si la session est absente ou expirée, l’utilisateur est redirigé vers `/login`.

Les formulaires utilisent des labels, des messages d’erreur accessibles, des états de chargement, des contrôles de contraste et une mise en page responsive. Bootstrap sert uniquement de base visuelle ; les widgets et la structure du dashboard sont implémentés dans le projet.
