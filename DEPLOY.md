# 部署教學：Vercel + DecapBridge

> 這份文件記錄**目前實際在用**的架構。專案最早是用 Netlify（Identity + Git Gateway），
> 後來因為 Netlify 免費額度用完、部署被卡住，改遷移到 **Vercel（部署）+ DecapBridge（後台登入）**。

完成這份教學後，你會有：
- 一個真正的網址（`eason-rides.vercel.app`，之後可以換成自己的網域）
- 一個只有你能登入的後台（`你的網址/admin/index.html`），可以用 Google／Microsoft 帳號登入，拖曳上傳照片影片、存檔後網站自動更新
- 別人打開網站只能看，沒有帳號無法編輯

---

## 第一步：把專案放上 GitHub

1. 到 [github.com](https://github.com) 註冊帳號
2. 建立新的 repository（例如 `Eason-rides`）
3. 用網頁的「uploading an existing file」把整個專案資料夾內容上傳
   （注意：要上傳資料夾**裡面的東西**，不要整個資料夾本身拖上去，避免多包一層路徑）

---

## 第二步：部署到 Vercel

1. 到 [vercel.com](https://vercel.com)，用 GitHub 帳號登入
2. **Add New → Project**，選擇你的 repository，點 **Import**
3. Choose a Plan 選 **「I'm working on personal projects」→ Hobby**（免費方案，不要選到 Pro）
4. Framework Preset 選 **Other**，Build Command / Output Directory 都留空
5. 按 **Deploy**

部署完成後會拿到一個網址，例如 `eason-rides.vercel.app`（可以在 Project → Settings → Domains 改成想要的名字）。

---

## 第三步：註冊 DecapBridge（後台登入用）

1. 到 [decapbridge.com](https://decapbridge.com)，用 Google 帳號登入
2. **Add Site**，填：
   - **Github repository**：`你的帳號/repo名稱`
   - **Github access token**：到 `github.com/settings/tokens` → Fine-grained tokens → Generate new token
     - Repository access 選你的 repo
     - Permissions 開 **Contents**（Read and write）+ **Pull requests**（Read and write）
   - **Your Decap CMS login URL**：`https://你的vercel網址/admin/index.html`
   - **Auth type**：選 **PKCE**（這樣才能用 Google/Microsoft 帳號登入，不用另外設密碼）
3. 建立完成後，畫面會顯示一段 `config.yml` 程式碼片段，**複製起來**

---

## 第四步：把設定接上專案

把 DecapBridge 給的 `config.yml` 片段，取代掉 `admin/config.yml` 最上面的 `backend:` 區塊
（保留下面 `collections:` 那些欄位設定不動），存檔、上傳回 GitHub。

同時確認 `admin/index.html` **不需要**再載入 Netlify Identity 的 script，只需要：
```html
<script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
```

存檔後，Vercel 會自動偵測到 GitHub 更新、重新部署，等 30 秒到 1 分鐘。

---

## 第五步：開始使用後台

打開：
```
https://你的vercel網址/admin/index.html
```
點 **Login**，選 Google 或 Microsoft 帳號登入，就會看到後台管理介面，可以直接拖曳上傳照片/影片、填文字，右上角 **Publish** 存檔，網站幾十秒後自動更新。

---

## 之後要修改「About / 車輛規格 / 目標 / 聯絡方式」怎麼辦？

這幾個區塊資料量小、不常變動，維持用 `assets/js/content.js`（或 `index.html` 的 Hero 區塊）手動編輯：
1. 到 GitHub 網頁上，找到對應檔案，點鉛筆圖示編輯
2. 改完直接在網頁上按 **Commit changes**
3. Vercel 偵測到更新會自動重新部署

---

## 常見問題

**Q：後台編輯後，網站多久會更新？**
通常 30 秒到 1 分鐘內。可以到 Vercel 的 **Deployments** 分頁看部署進度跟有沒有失敗訊息。

**Q：忘記後台密碼怎麼辦？**
PKCE 模式是用 Google/Microsoft 帳號登入，沒有另外設密碼這回事，忘記帳號的話用同一個 Google/Microsoft 帳號重新登入即可。

**Q：Vercel 免費額度會不會也用完？**
Vercel 的免費額度比 Netlify 大方很多（100GB 流量、100 萬次函式呼叫），正常個人網站使用量幾乎不會碰到上限。

**Q：可以換成自己的網域名稱嗎？**
可以，Vercel 的 Project → Settings → Domains 裡可以綁定自己買的網域。
