# Frontend : authentification

Le frontend Vue.js consomme les routes d’authentification NestJS avec `credentials: 'include'` afin que le cookie de session soit envoyé automatiquement.

## Pages disponibles

- `/signup` : création de compte ;
- `/confirm` : confirmation du compte ;
- `/login` : connexion ;
- `/dashboard` : page protégée après connexion.

## Validation du mot de passe

Le formulaire d’inscription affiche quatre règles en temps réel :

- au moins 8 caractères ;
- au moins une lettre majuscule ;
- au moins une lettre minuscule ;
- au moins un chiffre.

Chaque règle devient verte dès qu’elle est respectée. Le formulaire vérifie également que la confirmation correspond au mot de passe et désactive le bouton tant que les conditions ne sont pas remplies.

Les champs de mot de passe disposent d’un bouton accessible pour afficher ou masquer leur contenu.

## Protection des routes

Le guard du router appelle `GET /auth/me` avant d’autoriser l’accès au dashboard. Si la session est absente ou expirée, l’utilisateur est redirigé vers `/login`.

Les formulaires utilisent des labels, des messages d’erreur accessibles, des états de chargement et une mise en page responsive. Bootstrap sert uniquement de base visuelle ; les widgets et la structure du dashboard seront implémentés dans le projet.
