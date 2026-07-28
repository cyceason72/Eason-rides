# 部署教學（目前架構：Vercel + DecapBridge）

> 這份文件記錄「如果要從零重新部署一次」該怎麼做。
> 網站目前已經在線上運作，正常使用不需要重看這份文件，
> 只有在需要換帳號、重新部署、或想理解整體架構時才需要參考。

## 整體架構

```
GitHub（程式碼 + 資料存放）
   │
   ├──▶ Vercel（網站託管，自動部署，免費 Hobby 方案）
   │
   └──▶ DecapBridge（後台登入驗證，PKCE，Google/Microsoft 帳號登入）
              │
              └──▶ 後台頁面 /admin/index.html，編輯後直接 commit 回 GitHub
                   → 觸發 Vercel 重新部署 → 網站自動更新
```

## 如果要重新部署一次

### 1. GitHub

把整包專案上傳到一個 GitHub repository（網頁拖曳上傳即可，不用裝軟體）。

### 2. Vercel

1. [vercel.com](https://vercel.com) 用 GitHub 登入
2. Add New → Project → 選擇 repo → Import
3. Framework Preset 選 **Other**，Build Command / Output Directory 都留空
4. **方案務必選 Hobby（個人/免費），不要選 Pro**，Pro 會開始收費試用
5. Deploy

### 3. DecapBridge（後台登入）

1. [decapbridge.com](https://decapbridge.com) 用 Google 帳號登入
2. Add Site：
   - GitHub repository：`帳號/repo名稱`
   - GitHub access token：到 GitHub Settings → Developer settings → Fine-grained tokens 產生一組，
     權限開 **Contents**（Read and write）+ **Pull requests**（Read and write）
   - CMS 網址：`https://你的網站.vercel.app/admin/index.html`
   - Auth type 選 **PKCE**
3. 建立後會拿到一段 `config.yml` 片段，貼進 `admin/config.yml` 最上面的 `backend:` 區塊

### 4. 測試登入

打開 `https://你的網站.vercel.app/admin/index.html`，用 Google/Microsoft 帳號登入，
應該會看到後台管理介面（Static / Panning / Journal / Videos 四個分類）。

## 常見問題

**Q：Vercel 部署額度會用完嗎？**
Hobby 方案額度很大方（100GB 流量、100 萬次函式呼叫），一般個人網站幾乎不會碰到上限。

**Q：換成自己的網域名稱可以嗎？**
可以，Vercel 專案的 Settings → Domains 裡可以綁定自己買的網域。

**Q：忘記後台登入方式怎麼辦？**
到 `decapbridge.com` 用當初註冊的 Google 帳號登入查看，或直接到後台頁面重新走一次 Login 流程。
