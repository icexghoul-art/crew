# Déploiement sur Vercel + Render

## Option 1: Render (Backend + BD) + Vercel (Frontend)

### 1. Préparation du projet
1. Initialise un repository GitHub: `git init && git add . && git commit -m "initial commit"`
2. Push sur GitHub: `git remote add origin <ton-repo>` et `git push`

### 2. Déploiement sur Render (Backend + PostgreSQL)

**Étapes:**
1. Va sur [render.com](https://render.com) et crée un compte
2. Clique sur "New +" → "Web Service"
3. Connecte ton repo GitHub
4. Configure:
   - **Name**: `crew-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Ajoute les variables d'environnement:
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
   - `DATABASE_URL`: (voir étape 5)
   - `DISCORD_CLIENT_ID`: (ta clé Discord)
   - `DISCORD_CLIENT_SECRET`: (ta clé secrète Discord)

6. Crée une PostgreSQL database:
   - Render → "New +" → "PostgreSQL"
   - Plan: Free
   - Database name: `crew`
   - Copie l'URL fournie dans `DATABASE_URL`

7. Clique "Deploy"

**Note**: Sur le plan free, l'app s'endort après 15 min d'inactivité. Elle redémarre au 1er appel (peut prendre 30 sec).

### 3. Déploiement sur Vercel (Frontend)

**Étapes:**
1. Va sur [vercel.com](https://vercel.com) et crique "Deploy"
2. Sélectionne ton repo GitHub
3. Configure:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`
   - **Environment**: ajoute `NODE_ENV=production`
4. Ajoute les variables d'environnement (optionnel, si besoin de clés):
   - `VITE_API_URL`: `https://crew-api.onrender.com` (URL de ton Render)
5. Clique "Deploy"

**Pour les appels API du frontend:**
- Vérifiez que ton code appelle `https://crew-api.onrender.com` en production
- En dev, garder `http://localhost:3000`

### 4. Configurer les URLs

Dans `client/src/` ou `lib/`, crée une config:
```typescript
export const API_URL = process.env.VITE_API_URL || 'http://localhost:3000';
```

Puis utilise-la partout: `fetch(`${API_URL}/api/...`)`

### 5. OAuth Discord

- Ajoute l'URL Vercel dans les redirect URIs Discord:
  - Va sur Discord Developer Portal
  - Application → OAuth2 → Redirects
  - Ajoute: `https://ton-vercel-app.vercel.app/auth/discord/callback`

---

## Option 2: Render pour tout (Backend + Frontend)

Si tu veux tout sur Render:

1. Sur Render, crée un Web Service depuis ton repo
2. Build: `npm run build`
3. Start: `npm start`
4. Render servira automatiquement `dist/public` comme static files

---

## Commandes utiles

```bash
# Tester la build localement
npm run build
npm start

# Vérifier les erreurs TypeScript
npm run check

# Pusher les migrations de BD
npm run db:push
```

## Variables d'environnement requises

```
DATABASE_URL=postgresql://...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
PORT=3000 (Render le définit)
NODE_ENV=production
```

## Troubleshooting

**App démarre mais ne répond pas:**
- Vérifiez que `PORT` environment variable est utilisé
- Vérifiez que le serveur écoute sur `0.0.0.0` pas `localhost`

**Erreur BD:**
- Vérifiez que `DATABASE_URL` est correcte
- Exécutez `npm run db:push` après le premier déploiement

**Frontend pas trouvé:**
- Vérifiez que `npm run build` crée `dist/public`
- Vérifiez que `serveStatic()` dans `server/index.ts` sert depuis ce dossier
