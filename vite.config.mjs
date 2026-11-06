import { defineConfig } from "vite";

export default defineConfig({
  // プロジェクト直下の index.html を入口にする
  root: ".",

  // 既存の www を上書きしないよう、別フォルダに出力する
  build: {
    outDir: "build-output",
    emptyOutDir: true,
    rollupOptions: {
      input: [
        "index.html",
        "player.html",
        "pages/premium.html",
        "pages/remix.html",
        "remixComplete.html",
        "components/movie.html",
        "components/remixName.html",
        "components/remixEdit.html"
      ]
    }
  },

  // npmの依存パッケージをWeb向けにバンドルする
  optimizeDeps: {
    include: [
      "@capacitor/core",
      "@capacitor-community/admob",
      "@capacitor/browser"
    ]
  }
});