# Guide utilisateur

Ce guide explique comment utiliser le Dashboard Project en environnement local.

## 1. Lancer le projet

Depuis la racine du projet :

```bash
docker compose up -d --build
```

Les interfaces sont disponibles ici :

- application : http://localhost:5173
- backend : http://localhost:8080
- boîte email de développement Mailpit : http://localhost:8025

## 2. Créer un compte

1. Ouvrir http://localhost:5173/signup.
2. Saisir une adresse email.
3. Choisir un mot de passe respectant les règles affichées :
   - au moins 8 caractères ;
   - une majuscule ;
   - une minuscule ;
   - un chiffre.
4. Confirmer le mot de passe.
5. Cliquer sur `Create account`.

Le compte est créé mais reste bloqué tant qu'il n'est pas confirmé.

## 3. Confirmer le compte par email

En développement, les emails sont capturés par Mailpit et ne sont pas envoyés sur une vraie boîte email.

1. Ouvrir http://localhost:8025.
2. Ouvrir l'email `Confirm your Dashboard account`.
3. Cliquer sur `Confirm my account`.
4. La page de confirmation indique que le compte est activé.

Après cette étape, le compte peut être utilisé pour se connecter.

En production, Mailpit sera remplacé par un vrai serveur SMTP. Le parcours utilisateur restera identique : l'utilisateur recevra le lien dans sa boîte email réelle.

## 4. Se connecter

1. Ouvrir http://localhost:5173/login.
2. Saisir l'adresse email utilisée lors de l'inscription.
3. Saisir le mot de passe.
4. Cliquer sur `Sign in`.

Si le compte n'est pas confirmé, la connexion est refusée.

Après une connexion réussie, le backend crée une session et l'enregistre dans un cookie sécurisé `HttpOnly`. L'utilisateur est ensuite redirigé vers le dashboard.

## 5. Se déconnecter

Utiliser le bouton de déconnexion disponible dans l'interface du dashboard.

La session est supprimée côté serveur et le cookie de session est supprimé du navigateur.

## 6. Connecter GitHub avec OAuth

OAuth GitHub sert à autoriser les futurs widgets à accéder aux données GitHub. Il ne remplace pas la connexion locale au dashboard.

Il faut donc d'abord :

1. créer un compte local ;
2. confirmer le compte ;
3. se connecter au dashboard.

### Configuration GitHub nécessaire

Le backend doit posséder ces variables dans le fichier `.env` à la racine du projet :

```env
GITHUB_CLIENT_ID=ton_client_id
GITHUB_CLIENT_SECRET=ton_client_secret
GITHUB_REDIRECT_URI=http://localhost:8080/auth/github/callback
OAUTH_ENCRYPTION_KEY=une_cle_hexa_de_64_caracteres
```

L'application GitHub doit utiliser cette callback URL :

```txt
http://localhost:8080/auth/github/callback
```

### Démarrer OAuth

Pour le test backend actuel, après s'être connecté, ouvrir :

```txt
http://localhost:8080/auth/github
```

Le navigateur redirige vers GitHub.

1. Se connecter à GitHub si nécessaire.
2. Autoriser l'application.
3. GitHub renvoie vers le backend.
4. Le backend vérifie le `state` OAuth.
5. Le backend récupère le profil GitHub.
6. Le compte GitHub est lié à l'utilisateur local.
7. Le navigateur revient vers le dashboard.

Le résultat attendu est une URL similaire à :

```txt
http://localhost:5173/dashboard?github=connected
```

Si l'autorisation est refusée :

```txt
http://localhost:5173/dashboard?github=cancelled
```

Le secret GitHub reste uniquement côté backend. Le token GitHub est chiffré avant d'être enregistré en base et n'est jamais envoyé au frontend.

## 7. Widgets GitHub

Une fois GitHub connecté, le dashboard permet de consulter des informations réelles depuis un dépôt :

- commits récents ;
- pull requests ouvertes ;
- issues ouvertes.

Chaque widget GitHub est configurable avec :

- un dépôt au format `owner/repository` ;
- un nombre d'éléments à récupérer.

Le dashboard permet de gérer plusieurs widgets au même endroit :

1. cliquer sur `Add GitHub widget` pour ajouter une carte ;
2. saisir le dépôt au format `organisation/repository` ;
3. choisir le nombre de commits à afficher ;
4. cliquer sur `Load commits` ;
5. utiliser `↑` ou `↓` pour réorganiser les cartes ;
6. cliquer sur `Remove` pour retirer une carte.

La configuration des widgets est conservée dans le `localStorage` du navigateur. Les résultats GitHub sont rechargés avec le bouton `Load commits`.

Les appels sont effectués par le backend avec le token OAuth chiffré. Le token GitHub n'est jamais exposé au frontend.

Deux autres widgets sont disponibles :

- `Open pull requests` : saisir `organisation/repository` et le nombre de PR ;
- `Contribution activity` : saisir un nom d'utilisateur GitHub et le nombre d'événements publics récents.

L'activité de contribution utilise les événements publics GitHub récents. Elle ne représente donc pas l'intégralité du calendrier privé de contributions.

Le service `Weather` est disponible sans connexion OAuth. Le widget `Current weather` demande :

- une ville recherchée depuis Open-Meteo ;
- une unité `Metric` ou `Imperial`.

Rechercher une ville, sélectionner le résultat proposé, puis charger la météo. Les coordonnées sont récupérées automatiquement depuis l'API de géocodage Open-Meteo.

## 8. Sauvegarde et actualisation

Le dashboard conserve dans le navigateur :

- les widgets ajoutés ;
- leur ordre ;
- leur configuration ;
- les derniers résultats chargés ;
- la fréquence d'actualisation.

La fréquence peut être désactivée ou réglée sur 30 secondes, 1 minute ou 5 minutes. À chaque actualisation, les appels API des widgets disponibles sont relancés.

Le dashboard possède deux modes :

- `View results` : affiche uniquement les données des widgets ;
- `Edit dashboard` : affiche les paramètres, le déplacement et la suppression des widgets.

L'ajout d'un widget active automatiquement le mode édition pour permettre sa configuration.

## 9. Problèmes fréquents

### Email non reçu dans Mailpit

Vérifier que Mailpit est démarré :

```bash
docker compose ps mailpit
```

Puis ouvrir :

```txt
http://localhost:8025
```

### Connexion refusée

Vérifier que le compte a bien été confirmé en cliquant sur le lien reçu dans Mailpit.

### Erreur GitHub 404

Vérifier :

- le `GITHUB_CLIENT_ID` ;
- l'absence d'espace au début ou à la fin du client ID (IMPORTANT lol);
- le `GITHUB_CLIENT_SECRET` ;
- la callback URL exacte ;
- le redémarrage du backend après modification du `.env`.

### Session perdue

Vérifier que le frontend appelle l'API avec les cookies et que le backend autorise les credentials CORS.
