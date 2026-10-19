# DuckDuckGo Extension - Archived

DuckDuckGo 套件已於 2026-10-19 封存, 原因為使用者確認官方已支援所需功能, 保留原始碼供回查

此封存取代本輪重新啟用 DuckDuckGo 維護的決定, 主專案目前僅維護 Threads, 預設建置、測試與交付均不包含 DuckDuckGo, 工具列 Popup 的剩餘驗收也隨封存停止

## 保留內容

- `src/`、`public/`: 封存前的 0.1.0 原始碼與 manifest, 搬移時已逐檔核對 SHA-256 相同
- `package.json`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`、`tsconfig.json`: 獨立回查所需的相依套件與設定
- `tools/build.mjs`、`tests/`: 路徑調整為封存目錄內的來源與建置產物

封存保留 React 19.3.1、TypeScript 7.0.2、esbuild 0.28.2 與 Sass 1.105.2, 不再列入主專案相依套件

## 回查

需要重現時, 於此資料夾安裝鎖定相依套件並執行建置:

```powershell
pnpm install --frozen-lockfile
pnpm build
pnpm test
```

瀏覽器測試保留為 `pnpm test:browser`, 需提供支援擴充套件除錯載入的 Chromium, 以上指令只作用於此封存資料夾, 重新啟用維護或發布需另有明確決定
