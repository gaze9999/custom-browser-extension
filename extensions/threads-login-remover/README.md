# Threads 登入提示移除

個人使用的 Manifest V3 擴充套件, 適用於 Chrome 與 Edge, 可直接載入此資料夾, 不需建置或安裝相依套件

## 功能

- 在 `https://www.threads.com/*` 與 `https://threads.com/*` 隱藏登入彈窗及其遮罩
- 以對話框語意、提示標題與 Instagram 登入按鈕辨識, 不使用網站的混淆 class
- 持續處理重複或延遲出現的彈窗, 包含第一次可捲動、第二次鎖住頁面的情況
- 處理 `html` / `body` 捲動鎖定, 以及 Threads 將主要內容固定並設為 `aria-hidden` / `inert` 的情況
- 保留其他對話框, 其他對話框開啟時交還捲動控制, `/login`、`/signup`、`/accounts` 路徑保留登入介面

目前辨識標題為「透過 Threads 暢所欲言」與「Say more with Threads」, 網站變更提示內容或結構時需更新 `content.js`

只調整已載入的頁面顯示, 需要帳號才能取得的內容仍須登入, 頁面原有的登入連結與內嵌登入區塊保留

## 安裝

1. Chrome 開啟 `chrome://extensions`, Edge 開啟 `edge://extensions`
2. 開啟「開發人員模式」, 選擇「載入未封裝項目」
3. 選取包含本檔與 `manifest.json` 的 `extensions/threads-login-remover` 資料夾
4. 重新整理已開啟的 Threads 頁面

更新程式後, 先在擴充功能管理頁重新載入套件, 再重新整理 Threads 頁面, 要暫停可在管理頁關閉此擴充功能

## 權限與資料

Content script 僅匹配上述兩個 Threads 網域, 使用預設的 isolated world, 不宣告其他權限, 不傳送網路請求、不讀取 Cookie、不儲存或回傳瀏覽資料

## 驗證

`tests/verify.cjs` 使用 Playwright 與隔離的 Chromium profile, 檢查實際擴充套件載入、重複彈窗、捲動恢復、class 變動、延遲組裝、其他對話框與網域限制

開發環境需提供 Playwright 與支援 `Extensions.loadUnpacked` 的 Chromium, 測試透過除錯介面載入套件, 使用獨立暫存 profile 並於結束時清除, 執行方式:

```powershell
node tests/verify.cjs
```

可透過 `PLAYWRIGHT_MODULE` 指定既有 Playwright 模組路徑, 透過 `CHROMIUM_EXECUTABLE` 指定瀏覽器執行檔, 預設測試使用合成頁面, 加上 `--live` 會另外開啟範例 Threads 貼文, 驗證真實彈窗隱藏與滑鼠滾輪捲動

Content scripts 與載入方式依 [Chrome 官方文件](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts) 與 [未封裝擴充套件教學](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world)
