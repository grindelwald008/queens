# ♛ Queens — Vue + TypeScript

The LinkedIn-style "Queens" puzzle, built with **Vue 3 (Composition API) + TypeScript + Vite**.
This is a standalone port of the vanilla-JS version; the game logic is identical, but the UI is
component-based and the engine is fully typed.

## The rules

- The board is an **N×N** grid split into **N colored regions**.
- Place exactly **one queen per row**, **per column**, and **per color region**.
- **No two queens may touch — not even diagonally.**
- Every generated puzzle has a **single unique solution**.

## Features

- **Play mode** — tap a cell to cycle empty → ✕ (note) → ♛ (queen) → empty, with live conflict
  highlighting, a timer, and Undo / Hint / Clear / New.
- **Build mode** — auto-generate a guaranteed-unique puzzle, or paint regions by hand (tap & drag),
  then Validate / Play / Save / Share.
- **Shareable links** — a level is encoded in the URL (`#lvl=...`); opening the link loads it directly.

---

## Prerequisites

- **Node.js 18+** and **npm**. Check with:

```bash
node -v
npm -v
```

> Note: this project pins **Vite 5** and **@vitejs/plugin-vue 5** so it runs on Node 18.
> If you upgrade to the latest Vite (which needs Node 20.19+), bump Node accordingly.

## Install

From this folder:

```bash
npm install
```

## Run in development (hot reload)

```bash
npm run dev
```

Vite prints a local URL (default http://localhost:5173). Edits reload instantly.

## Type-check

```bash
npm run type-check
```

Runs `vue-tsc` to check all `.ts` and `.vue` files without emitting output.

## Production build

```bash
npm run build
```

This runs `vue-tsc -b` (type-check) and then `vite build`, producing static files in **`dist/`**.

## Preview the production build locally

```bash
npm run preview
```

Serves the contents of `dist/` so you can verify the build before deploying.

---

## Deploy to GitHub Pages

1. Push this `queens-vue/` folder to a GitHub repo.
2. `vite.config.ts` uses `base: "./"` (relative paths), so the build works from any subpath —
   no extra config needed for a project page like `https://<user>.github.io/<repo>/`.
   (If you prefer absolute paths, set `base: "/<repo-name>/"` instead.)
3. Build and publish the `dist/` folder. Easiest options:
   - **Manual:** run `npm run build`, then push the `dist/` contents to a `gh-pages` branch (e.g. with the `gh-pages` npm package), and set Pages to serve that branch.
   - **GitHub Actions:** add a workflow that runs `npm ci && npm run build` and deploys `dist/` via `actions/deploy-pages`.
4. Build a puzzle, click **Share link**, and post that URL (it contains `#lvl=...`).

Any static host (Netlify, Vercel, Cloudflare Pages) works too — set the build command to
`npm run build` and the output directory to `dist`.

---

## Project structure

```
queens-vue/
  index.html              # mount point (#app) + module script
  vite.config.ts          # Vite + Vue plugin, base: "./"
  tsconfig*.json          # TypeScript project config
  src/
    main.ts               # createApp(App).mount('#app')
    App.vue               # screen routing (ref) + load level from URL hash
    styles.css            # dark theme, grid, responsive (ported)
    colors.ts             # region color palette
    core/                 # pure, framework-agnostic engine (typed)
      types.ts            # Mark, Regions, Solution, Level, Marks
      board.ts            # helpers
      rules.ts            # findViolations, isSolved
      solver.ts           # findSolutions, countSolutions, hasUniqueSolution
      generator.ts        # generateLevel (unique-puzzle generation)
      storage.ts          # URL-hash share + localStorage saves
    composables/
      useGame.ts          # play-mode reactive state + actions
    components/
      BoardGrid.vue       # the N×N grid (declarative cells, region borders)
      Palette.vue         # color swatches for build mode
      MenuScreen.vue      # menu + saved puzzles
      PlayScreen.vue      # play mode
      BuildScreen.vue     # build mode (generate / paint / validate / share)
      Overlay.vue         # reusable dialog (win, how-to)
      Toast.vue           # transient message
```

## How it differs from the vanilla version

- **Declarative rendering:** `BoardGrid.vue` renders cells with `v-for` and binds styles/classes,
  replacing manual `document.createElement` and the hand-written `render()` loop.
- **Reactive state:** `useGame.ts` holds play state in `ref`/`computed`; the UI updates automatically
  instead of via explicit re-render calls.
- **Type safety:** the engine signatures use `Regions`, `Solution`, `Level`, etc., catching mistakes
  at compile time.

The `core/` engine is intentionally framework-agnostic — it has no Vue imports and could be reused
in any environment.
