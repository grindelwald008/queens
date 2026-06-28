import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// Relative base so the built app works both locally and when served from a
// GitHub Pages subpath (https://user.github.io/<repo>/). For a custom repo you
// may instead set base: "/<repo-name>/".
export default defineConfig({
  plugins: [vue()],
  base: "./",
});
