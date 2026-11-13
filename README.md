# The BBG App

Application mobile (PWA) Big Budi Games : rapports de parties partagés et feuille de score tactile EDIT.

Jeux : EDIT, Orosi, TornaDice — `src/data/games.ts`.

## Développement

```bash
npm install
npm run dev
```

Sans configuration Firebase, les données restent dans le navigateur (mode dev uniquement).

## Données partagées (Firebase)

Toutes les parties sont stockées dans Firestore (collection `parties`) et synchronisées en temps réel entre tous les utilisateurs. Hors ligne, les saisies sont mises en file et synchronisées au retour du réseau.

1. Créer un projet sur https://console.firebase.google.com
2. **Authentication** → Méthode de connexion → activer **Anonyme**
3. **Firestore Database** → créer la base, puis coller le contenu de `firestore.rules` dans l'onglet Règles
4. Paramètres du projet → Vos applications → ajouter une app **Web** et récupérer la config
5. Copier `.env.example` en `.env` et remplir les valeurs (en local)

## Déploiement (GitHub Pages)

1. Settings → Pages → Source : **GitHub Actions**
2. Settings → Secrets and variables → Actions : ajouter les 6 variables `VITE_FIREBASE_*`
3. Chaque push sur `main` déploie l'app

Sur mobile : ouvrir l'URL, puis « Ajouter à l'écran d'accueil ».

## Feuille de score EDIT

`src/screens/EditSheet.tsx` — chaque case cochée vaut 1 point (`ROW_VALUES` pour changer la valeur par ligne). En portrait, la feuille pivote automatiquement à l'horizontale. Le bouton ✓ crée une partie avec les scores.
