# The BBG App

Application mobile (PWA) Big Budi Games : rapports de parties et feuille de score tactile EDIT.

Jeux : EDIT, Orosi, TornaDice — `src/data/games.ts`.

## Développement

```bash
npm install
npm run dev
```

## Données

Les parties sont enregistrées sur le téléphone (stockage du navigateur). Elles s'exportent et se partagent en CSV depuis la page de chaque jeu.

## Déploiement (GitHub Pages)

1. Settings → Pages → Source : **GitHub Actions**
2. Chaque push sur `main` déploie l'app

Sur mobile : ouvrir l'URL, puis « Ajouter à l'écran d'accueil ».

## Feuille de score EDIT

`src/screens/EditSheet.tsx` — feuille en portrait, un bloc horizontal par joueur (3 lignes × 7 colonnes). Chaque case cochée vaut 1 point (`CELL_VALUE`). La ligne grise donne le total de chaque colonne, le cadre de droite le total de chaque ligne puis le total du joueur. Le bouton ✓ crée une partie avec les scores.
