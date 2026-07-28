# Eason Rides

個人騎乘品牌網站。Vanilla HTML5 / CSS3 / ES6，無框架、無 UI Library。

## 全部完成 ✅

01 Hero · 02 About · 03 Featured Bike · 04 Gallery · 追焦紀錄 Panning ·
05 Ride Journal（相簿模式，支援照片＋影片） · 06 Videos · 07 Statistics ·
08 Future Goals · 09 Contact · 10 Footer

## 兩種內容管理方式

**① 常常更新的（Gallery / 追焦紀錄 / Journal / Videos）**
部署後台之後（見 `DEPLOY.md`），直接在網頁後台拖曳照片影片上傳、填文字，
存檔就自動更新，完全不用碰程式碼。資料實際存放在：
```
content/gallery.json
content/panning.json
content/journal.json
content/videos.json
```

**② 不常更新的（About / Featured Bike / Statistics / Future Goals / Contact / Hero）**
維持用 `assets/js/content.js`（About/Bike/Goals/Contact/Stats）或
`index.html`（Hero 主視覺）手動編輯，跟之前一樣。

> 在還沒部署後台之前，直接雙擊 `index.html` 打開，
> Gallery / Panning / Journal / Videos 會自動顯示 `content.js` 裡的預設值（離線預覽用），
> 部署後台、開始用後台編輯之後，才會改讀 `content/*.json` 的正式資料。

## 怎麼部署後台（讓你可以直接上傳照片影片，不用碰程式碼）

完整步驟在 **`DEPLOY.md`**，大致流程：
1. 把這個資料夾整包上傳到 GitHub
2. 串接 Netlify，一鍵部署成真正的網址
3. 開通 Netlify Identity + Git Gateway（後台登入功能）
4. 邀請自己的 email 成為使用者，設定密碼
5. 打開 `你的網址/admin` 登入，開始拖曳上傳照片影片

## 本機預覽（部署前先看效果）

直接雙擊 `index.html`，或用單檔版 `eason-rides-single-file.html`。
Gallery / Panning / Journal / Videos 會顯示 `content.js` 的預設值，
About / Bike / Hero 會顯示目前設定的內容。

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

## 檔案結構

```
project/
├── index.html
├── netlify.toml          Netlify 部署設定
├── README.md
├── DEPLOY.md              部署與後台設定完整教學
├── admin/
│   ├── index.html         後台管理頁面入口
│   └── config.yml         後台欄位設定（Gallery/Panning/Journal/Videos）
├── content/                後台管理的正式資料（JSON）
│   ├── gallery.json
│   ├── panning.json
│   ├── journal.json
│   └── videos.json
└── assets/
    ├── css/    reset / variables / base / navigation / loader /
    │           hero / about / bike / gallery（含 panning、lightbox）/
    │           journal / videos / stats / goals / contact / footer
    ├── js/
    │   ├── content.js      About/Bike/Goals/Contact/Stats 的資料
    │   │                   ＋ Gallery/Panning/Journal/Videos 的離線預覽預設值
    │   ├── media.js        圖片／影片載入 + 佔位 fallback
    │   ├── render.js       把資料變成畫面（含 fetch content/*.json 的邏輯）
    │   ├── gallery.js      通用 Lightbox（Gallery/Panning/Journal 共用）
    │   ├── counter.js      Statistics 數字動畫
    │   ├── footer.js       Back to top
    │   ├── navigation.js   導覽列
    │   ├── animation.js    捲動進場動畫
    │   ├── loader.js       進站 Loader
    │   └── main.js         進入點
    ├── images/
    ├── videos/
    ├── icons/
    └── fonts/
```
