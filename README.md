# Mail Intelligence

Système personnel d'analyse d'emails par IA : connecte votre boîte **Titan Email** par IMAP, analyse chaque nouveau message avec un LLM (OpenAI ou Claude), calcule un score de priorité, catégorise, résume et propose une action — le tout dans un dashboard Next.js moderne, mis à jour automatiquement toutes les 5 minutes.

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Stack technique](#stack-technique)
- [Démarrage rapide (local)](#démarrage-rapide-local)
- [Démarrage avec Docker](#démarrage-avec-docker)
- [Variables d'environnement](#variables-denvironnement)
- [Fonctionnement du cron](#fonctionnement-du-cron)
- [Ajouter un fournisseur mail (Gmail, Outlook, ...)](#ajouter-un-fournisseur-mail)
- [Changer de fournisseur IA](#changer-de-fournisseur-ia)
- [Tests](#tests)
- [Scripts disponibles](#scripts-disponibles)

## Fonctionnalités

- **Synchronisation automatique** toutes les 5 minutes (cron configurable) : récupère uniquement les nouveaux emails (déduplication par `Message-ID` + UID IMAP).
- **Analyse IA** de chaque email : catégorie, score de priorité (1-100), sentiment, résumé en 3 lignes, mots-clés, action recommandée, détection de deadline/montants/candidatures.
- **Boosts de score déterministes** pour les emails LinkedIn, Indeed, Welcome to the Jungle, recruteurs, clients, factures, contrats et rendez-vous — garantis même si le LLM sous-évalue un email.
- **7 catégories** : 🔴 Urgent, 🟠 Important, 🟡 À traiter aujourd'hui, 🔵 À traiter cette semaine, 🟢 Information, ⚪ Newsletter, ⚫ Spam.
- **Dashboard** : stats en temps réel, graphiques (répartition par catégorie, volume sur 14 jours), recherche plein texte, filtres (catégorie, score, expéditeur, statut), dark mode.
- **Actions** : marquer comme traité, archiver, supprimer, ajouter des tags.
- **Notifications** desktop (Web Notifications API) et email (SMTP) pour les emails prioritaires.
- **Export** CSV et PDF.
- **Architecture modulaire** : ajouter Gmail/Outlook/Office365/Yahoo/Proton ne nécessite qu'un nouveau fichier dans `services/email/`, sans toucher au reste de l'application.

## Architecture

```
app/
  (auth)/login/            Page de connexion (NextAuth credentials)
  (dashboard)/             Dashboard protégé (layout + pages)
  api/                     API Routes (emails, stats, comptes, notifications, auth)
components/
  ui/                      Primitives shadcn-style (Button, Card, Dialog, ...)
  dashboard/               Composants du dashboard (stats, charts, filtres, ...)
  providers/               Theme / Session / React Query providers
lib/                       DB client, auth, constants, validations (Zod), crypto, logger
services/
  email/                   Abstraction mailbox (types.ts, imap-provider.ts, titan-provider.ts,
                            provider-factory.ts) - point d'extension pour Gmail/Outlook/...
  ai/                       Abstraction IA (openai-provider.ts, claude-provider.ts,
                            ai-factory.ts, prompts.ts, scoring.ts)
  email-sync.service.ts     Orchestration : fetch -> dedupe -> analyse -> score -> sauvegarde
  notification.service.ts   Notifications desktop + email
  export.service.ts         Export CSV / PDF
cron/                      Processus cron autonome (node-cron, tourne hors du runtime Next.js)
prisma/                    Schéma Prisma + seed
types/                     Types partagés (email, IA, next-auth)
tests/                     Tests unitaires (Vitest)
```

### Flux de synchronisation (toutes les 5 minutes)

1. `cron/scheduler.ts` déclenche `cron/sync-job.ts`.
2. Pour chaque compte email actif, `services/email/provider-factory.ts` instancie le bon client (Titan par défaut).
3. Le client IMAP (`imap-provider.ts`, basé sur `imapflow`/`mailparser`) récupère les messages dont l'UID est supérieur au dernier curseur connu.
4. `email-sync.service.ts` déduplique (vérification applicative + contrainte unique `(emailAccountId, messageId)` en base).
5. Chaque nouveau message est envoyé au fournisseur IA configuré (`services/ai/ai-factory.ts`).
6. Le score brut de l'IA est ajusté par des règles déterministes (`services/ai/scoring.ts`) pour les expéditeurs à forte valeur (recruteurs, clients, LinkedIn, etc.).
7. Le résultat est validé par un schéma Zod (`lib/validations.ts`) puis persisté (Prisma).
8. Les emails dépassant le seuil de notification configuré déclenchent une notification desktop et/ou email.
9. Le dashboard se met à jour via React Query (polling + invalidation après une synchronisation manuelle).

## Stack technique

| Domaine | Techno |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, composants shadcn-style, Recharts |
| Backend | Next.js API Routes |
| Base de données | PostgreSQL + Prisma ORM |
| Authentification | NextAuth (Credentials) |
| IA | OpenAI GPT (par défaut) ou Anthropic Claude — interchangeable via `AI_PROVIDER` |
| Email | IMAP (Titan Email via `imapflow` + `mailparser`) |
| Cron | node-cron (processus Node autonome) |
| Validation | Zod |
| Tests | Vitest |

## Démarrage rapide (local)

### Prérequis

- Node.js 22+
- PostgreSQL 16+ (local ou via Docker)
- Une clé API OpenAI (ou Anthropic) et les identifiants IMAP de votre compte Titan Email

### Étapes

```bash
# 1. Installer les dépendances
npm install

# 2. Copier le fichier d'environnement et le compléter
cp .env.example .env
# -> renseignez DATABASE_URL, NEXTAUTH_SECRET, ENCRYPTION_KEY, OPENAI_API_KEY, etc.
# Générer un secret : openssl rand -base64 32
# Générer la clé de chiffrement : openssl rand -hex 32

# 3. Démarrer PostgreSQL si besoin (exemple rapide avec Docker)
docker run -d --name mailintel-db -e POSTGRES_USER=mailintel \
  -e POSTGRES_PASSWORD=change-me -e POSTGRES_DB=mailintel -p 5432:5432 postgres:16-alpine

# 4. Appliquer le schéma et créer votre utilisateur
npm run db:migrate
npm run db:seed

# 5. Lancer le serveur Next.js
npm run dev
```

Le dashboard est disponible sur http://localhost:3000. Connectez-vous avec `SEED_USER_EMAIL` / `SEED_USER_PASSWORD` (par défaut `you@example.com` / `changeme123` si vous ne les avez pas surchargés dans `.env`).

Une fois connecté, allez dans **Paramètres** pour connecter votre boîte Titan Email (adresse + mot de passe IMAP).

### Lancer le cron en local

Le cron tourne dans un processus séparé (il ne peut pas vivre dans le runtime serverless de Next.js) :

```bash
# Dans un second terminal
npm run cron          # boucle toutes les 5 minutes (SYNC_CRON_SCHEDULE)
# ou, pour un test ponctuel :
npm run cron:once
```

## Démarrage avec Docker

```bash
cp .env.example .env
# Complétez .env (les valeurs POSTGRES_* doivent correspondre à DATABASE_URL)

docker compose up --build
```

Cela démarre 4 services :
- `postgres` — base de données
- `migrate` — applique les migrations Prisma puis s'arrête
- `web` — application Next.js (port 3000)
- `cron` — processus de synchronisation toutes les 5 minutes

Créez votre utilisateur avec :

```bash
docker compose run --rm cron npx tsx prisma/seed.ts
```

## Variables d'environnement

Voir [`.env.example`](.env.example) pour la liste complète et commentée. Points clés :

- `ENCRYPTION_KEY` : les mots de passe IMAP sont chiffrés (AES-256-GCM) avant stockage en base — ne les stockez jamais en clair.
- `AI_PROVIDER` : `openai` (défaut) ou `claude`. Aucune autre variable de code à changer.
- `SYNC_CRON_SCHEDULE` : expression cron standard, `*/5 * * * *` par défaut (toutes les 5 minutes).

## Ajouter un fournisseur mail

Toute la logique provider-spécifique est isolée dans `services/email/`. Pour ajouter Gmail (ou Outlook/Office365/Yahoo/Proton) :

1. Créez `services/email/gmail-provider.ts` implémentant l'interface `MailProviderClient` (`services/email/types.ts`) — typiquement via OAuth2 + l'API Gmail plutôt qu'IMAP brut.
2. Ajoutez un `case "GMAIL":` dans `services/email/provider-factory.ts` qui instancie votre nouvelle classe.
3. C'est tout — `email-sync.service.ts`, les API routes et le dashboard n'ont besoin d'aucune modification.

## Changer de fournisseur IA

`services/ai/openai-provider.ts` et `services/ai/claude-provider.ts` implémentent tous les deux `AIProvider` (`types/ai.ts`) et partagent le même prompt (`services/ai/prompts.ts`). Basculez simplement :

```bash
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
```

## Tests

```bash
npm run test        # exécution unique
npm run test:watch  # mode watch
```

Couvre notamment : les règles de boost de score (`services/ai/scoring.ts`), le chiffrement des secrets, les schémas de validation Zod, et les utilitaires de formatage.

## Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur Next.js en développement |
| `npm run build` / `npm run start` | Build et démarrage en production |
| `npm run cron` | Démarre le processus de synchronisation récurrent |
| `npm run cron:once` | Exécute une synchronisation unique et quitte |
| `npm run db:migrate` | Applique les migrations Prisma (dev) |
| `npm run db:migrate:deploy` | Applique les migrations Prisma (prod) |
| `npm run db:seed` | Crée l'utilisateur et les tags par défaut |
| `npm run db:studio` | Ouvre Prisma Studio |
| `npm run test` | Lance les tests Vitest |
| `npm run lint` / `npm run typecheck` | Lint et vérification des types |
