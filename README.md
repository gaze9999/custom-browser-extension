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

第一方內容採 [MIT 授權](LICENSE)
