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

Settings → Pages → Source : **Deploy from a branch**, dossier **/docs**.

Le dossier `docs/` contient l'app compilée. Après une modification du code, lancer `npm run build` puis committer `docs/`.

Sur mobile : ouvrir l'URL, puis « Ajouter à l'écran d'accueil ».

## Feuille de score EDIT

`src/screens/EditSheet.tsx` — feuille en portrait, un bloc horizontal par joueur (3 lignes × 7 colonnes). On touche une case et on saisit sa valeur au pavé numérique. La ligne grise donne le total de chaque colonne, le cadre de droite le total de chaque ligne puis le total du joueur. Le bouton ✓ crée une partie avec les scores.

## Scan des plateaux Orosi (Camino)

Bouton appareil photo sur la feuille Orosi. La lecture et le décompte viennent du paquet
`@bbg/camino-scoring` (dépôt CAMINO, étiquette `camino-scoring-v1.0.0`) ; l'écran est dans
`src/camino/`. Pour une nouvelle version du paquet : changer l'étiquette dans `package.json`,
`npm install`, `npm run build`.
