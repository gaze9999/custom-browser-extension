# Custom Browser Extensions

個人使用的 Chrome / Edge 擴充套件集合, 目前維護 Threads 登入提示移除

| 套件 | 狀態 | 位置 |
| --- | --- | --- |
| [Threads 登入提示移除 0.1.0](extensions/threads-login-remover/README.md) | 維護中 | `extensions/threads-login-remover` |
| [DuckDuckGo Extension 0.1.0](archive/duckduckgo/README.md) | Archived | `archive/duckduckgo` |

## 安裝 Threads 套件

1. Chrome 開啟 `chrome://extensions`, Edge 開啟 `edge://extensions`
2. 啟用「開發人員模式」, 選擇「載入未封裝項目」
3. 選取 `extensions/threads-login-remover` 資料夾
4. 重新整理 Threads 頁面

這個資料夾可直接載入, 不需 Node.js 或建置, 可隱藏繁中與英文登入彈窗及遮罩, 並處理重複提示造成的捲動鎖定, 其他對話框與獨立登入頁保留

## 開發與驗證

開發環境使用 Node.js 24 以上與 pnpm 12.11.2, 瀏覽器執行程式為原生 JavaScript, 相依套件僅用於開發驗證

```powershell
pnpm install --frozen-lockfile
pnpm build
```

建置產物位於 `build/threads-login-remover`, 可依上述步驟載入, 產物只包含 manifest 與 content script

| 指令 | 用途 |
| --- | --- |
| `pnpm start` | 監看 Threads 來源並更新建置目錄, Ctrl+C 結束 |
| `pnpm check:public` | 檢查所有 Git 歷史與暫存區的公開內容 |
| `pnpm check:syntax` | 檢查執行程式與建置腳本的 JavaScript 語法 |
| `pnpm build` | 語法檢查並產生 Threads 套件 |
| `pnpm test` | 檢查已建置資源與來源一致性, 需先建置 |
| `pnpm test:browser` | 在隔離的瀏覽器 profile 驗證 Threads 合成頁面 |
| `pnpm test:threads:live` | 另外驗證範例 Threads 真實貼文頁面的彈窗與捲動 |
| `pnpm check` | 依序執行建置、產物檢查與瀏覽器測試 |

瀏覽器測試需提供支援 `Extensions.loadUnpacked` 的 Chromium, 可透過 `CHROMIUM_EXECUTABLE` 指定既有 Chrome / Edge 執行檔, 測試不使用日常瀏覽器 profile, 結束時清除自行建立的暫存 profile

修改來源後需在擴充功能管理頁重新載入套件, 再重新整理 Threads 頁面, 提示文案或結構改變時需重新核對辨識條件

## DuckDuckGo 封存

依使用者於 2026-10-19 的確認, 官方已支援所需功能, DuckDuckGo 套件改為封存, 主專案的預設建置、測試與交付均不包含它

原始碼與 React / TypeScript / esbuild / Sass 工具鏈保留於封存資料夾, 回查方式見 [封存說明](archive/duckduckgo/README.md)

## 原始碼位置

- `extensions/threads-login-remover/`: 可直接載入的 Threads 套件與瀏覽器測試
- `tools/build.mjs`: 以明確檔案清單產生 Threads 套件, 支援來源監看
- `tests/`: 主專案的建置產物與來源一致性檢查
- `archive/duckduckgo/`: 停止維護的 DuckDuckGo 原始碼與獨立回查工具鏈

公開內容檢查需 Python 3.10 以上, 新 clone 的 hooks 啟用方式與交付條件見 [公開內容保護](docs/public-content.md)
