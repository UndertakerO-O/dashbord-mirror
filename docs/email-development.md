# Emails de développement avec Mailpit

Mailpit intercepte les emails envoyés par le backend sans les transmettre à de vrais destinataires.

## Configuration

Docker Compose fournit automatiquement :

- un serveur SMTP sur `localhost:1025` ;
- une interface web sur `http://localhost:8025`.

Le backend utilise le nom de service Docker `mailpit` comme hôte SMTP.

## Tester une confirmation

1. lancer `docker compose up -d` ;
2. ouvrir le frontend sur `http://localhost:5173` ;
3. créer un compte ;
4. ouvrir `http://localhost:8025` ;
5. ouvrir l'email reçu ;
6. cliquer sur le lien de confirmation ;
7. se connecter avec le compte confirmé.

Le token de confirmation est hashé en base et n'est plus retourné par l'API d'inscription.

## Variables utilisées

```env
SMTP_HOST=mailpit
SMTP_PORT=1025
MAIL_FROM=no-reply@dashboard.local
```

Ces valeurs sont destinées au développement. En production, elles devront être remplacées par un serveur SMTP réel et ses paramètres sécurisés.
