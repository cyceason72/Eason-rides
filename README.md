# Eason Rides

個人騎乘品牌網站。Vanilla HTML5 / CSS3 / ES6，無框架、無 UI Library。

## 目前架構

- **網站託管**：Vercel（`eason-rides.vercel.app`）
- **資料與程式碼**：GitHub（`cyceason72/Eason-rides`）
- **後台登入**：DecapBridge（PKCE，Google/Microsoft 帳號登入）
- **後台網址**：`https://eason-rides.vercel.app/admin/index.html`

## 兩種內容管理方式

**① 常常更新的（靜態紀錄 / 追焦紀錄 / Journal / Videos）**
到後台網址登入，拖曳照片影片上傳、填文字，按 Publish 就自動更新，完全不用碰程式碼。
資料實際存放在 `content/*.json`。

**② 不常更新的（About / Featured Bike / Statistics / Future Goals / Contact / Hero）**
到 GitHub 網頁上直接編輯：
- `assets/js/content.js`（About/Bike/Goals/Contact/Stats）
- `index.html`（Hero 主視覺）

## ⚠️ 給之後維護程式碼的人（包含 Claude 自己）

網站實際載入的是**合併壓縮過的檔案**，不是逐一載入每個 CSS/JS：
```
assets/css/bundle.css   ← 由 15 個 CSS 檔案合併壓縮而成
assets/js/bundle.js     ← 由 9 個 JS 檔案合併壓縮而成（不含 content.js）
```

**如果要修改樣式或功能邏輯**：
1. 改對應的原始檔案（例如 `assets/css/gallery.css`、`assets/js/render.js`）
2. 重新合併壓縮所有原始檔案，產生新的 `bundle.css` / `bundle.js`
3. 兩個都要上傳更新，不要只改原始檔案卻忘記重新產生 bundle（不然改的東西不會生效，因為網頁讀的是 bundle）

原始檔案還是留著方便閱讀/編輯，只是**正式上線讀取的是 bundle 版本**。

`content.js` 例外：因為使用者會直接在 GitHub 網頁上編輯這個檔案，所以它**沒有**被打包進 bundle，維持獨立載入。

## 本機預覽（部署前先看效果）

直接雙擊 `index.html`。常更新的區塊會顯示 `content.js` 的預設值（離線預覽用），
部署後、開始用後台編輯之後，才會改讀 `content/*.json` 的正式資料。

## 設計 Token

| 用途 | 值 |
|---|---|
| 背景 | `#050505` |
| 次背景 | `#101010` |
| 卡片 | `#171717` |
| 邊框 | `rgba(255,255,255,.08)` |
| 主文字 | `#ffffff` |
| 次文字 | `#b5b5b5` |
| 強調色 | `#ff3b30` |

## 效能

照片上傳後台前都應該先壓縮（後台 DecapBridge 上傳的圖片目前沒有自動壓縮，
建議大檔案先手動壓縮過再上傳，避免網站變慢）。

網站程式碼本身的 CSS/JS 已合併壓縮成 `bundle.css` / `bundle.js`，
把 25 個檔案請求減少到 2 個，加快首次載入速度。

## 檔案結構

```
project/
├── index.html
├── README.md
├── DEPLOY.md              部署與後台設定完整教學
├── admin/
│   ├── index.html         後台管理頁面入口
│   └── config.yml         後台欄位設定（DecapBridge 登入 + Gallery/Panning/Journal/Videos）
├── content/                後台管理的正式資料（JSON）
│   ├── gallery.json
│   ├── panning.json
│   ├── journal.json
│   └── videos.json
└── assets/
    ├── css/
    │   ├── bundle.css      ⭐ 網站實際載入的檔案
    │   └── （其餘 15 個原始檔案，方便閱讀/編輯用）
    ├── js/
    │   ├── content.js      ⭐ 網站實際載入，也是唯一常手動編輯的檔案
    │   ├── bundle.js        ⭐ 網站實際載入的檔案（不含 content.js）
    │   └── （其餘 9 個原始檔案，方便閱讀/編輯用）
    ├── images/
    ├── videos/
    ├── icons/
    └── fonts/
```
