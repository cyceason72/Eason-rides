# 部署教學：把網站放上網路 + 開通後台管理

完成這份教學後，你會有：
- 一個真正的網址（例如 `eason-rides.netlify.app`，之後也能換成你自己的網域）
- 一個只有你能登入的後台網址（`你的網址/admin`），可以直接拖曳照片影片上傳、打字填資料，**存檔後網站自動更新**，完全不用碰程式碼
- 別人打開網站只能看，沒有帳號密碼無法編輯

全程約 30–60 分鐘，前面申請帳號的部分只需要做一次。

---

## 第一步：把專案放上 GitHub（10 分鐘）

1. 到 [github.com](https://github.com) 註冊一個帳號（如果還沒有）
2. 右上角「+」→「New repository」
3. Repository name 填 `eason-rides`，其餘保持預設，選 **Public** 或 **Private** 都可以，按「Create repository」
4. 建立完成後，畫面上會看到「uploading an existing file」的連結，點下去
5. 把你電腦上**整個 `eason-rides` 資料夾裡的所有檔案和子資料夾**（`index.html`、`assets/`、`content/`、`admin/`、`netlify.toml`...）整包拖進上傳區塊
   （GitHub 網頁上傳支援連同子資料夾一起拖，不用一個一個檔案挑）
6. 下面填一句 commit message（例如「first upload」），按「Commit changes」

完成後，你的網站程式碼就在 GitHub 上了。

---

## 第二步：串接 Netlify（10 分鐘）

1. 到 [netlify.com](https://netlify.com) 用剛剛的 GitHub 帳號登入（會有「Sign up with GitHub」的選項，直接用這個最快）
2. 登入後點「Add new site」→「Import an existing project」
3. 選 **GitHub**，授權 Netlify 存取你的帳號
4. 選擇你剛剛建立的 `eason-rides` 這個 repository
5. Build command 留空、Publish directory 填 `.`（一個點，代表根目錄）
6. 按「Deploy site」

等一兩分鐘，Netlify 會給你一個網址，例如 `random-name-12345.netlify.app`，點開應該就能看到你的網站了（這時候後台還不能用，先繼續下一步）。

**建議**：在 Netlify 的 Site settings 裡可以把網址改成好記一點的名字，例如 `eason-rides.netlify.app`（Site settings → Change site name）。

---

## 第三步：開通登入功能（Identity）（5 分鐘）

1. 在 Netlify 網站後台，左側選單找 **Identity**
2. 按「Enable Identity」
3. 往下找到「Registration preferences」，選 **Invite only**（這樣才不會讓任何人自己註冊帳號進你的後台）
4. 往下找到「Services」→「Git Gateway」，按「Enable Git Gateway」
   （這一步是讓後台編輯的內容，能自動幫你存回 GitHub、觸發網站更新）

---

## 第四步：邀請自己成為使用者（5 分鐘）

1. 還在 Identity 頁面，點右上角「Invite users」
2. 填你自己的 email，送出邀請
3. 去收信，信裡會有一個「Accept the invite」連結，點下去
4. 會導到你的網站，跳出一個設定密碼的視窗，設好密碼

---

## 第五步：開始使用後台

打開瀏覽器，網址列輸入：
```
你的網址/admin
```
例如：`https://eason-rides.netlify.app/admin`

用剛剛設定的 email + 密碼登入，就會看到後台管理介面，左側可以選：
- **視角記錄 Gallery**
- **追焦紀錄 Panning**
- **Ride Journal 旅程紀錄**
- **Videos 影片紀錄**

點進去之後，可以直接拖曳照片/影片上傳、填文字，右上角「Publish」存檔，網站大約幾十秒後就會自動更新，**不用碰任何程式碼、不用搬檔案**。

---

## 之後要修改「About / 車輛規格 / 目標 / 聯絡方式」怎麼辦？

這幾個區塊因為資料量小、不常變動，還是維持用 `assets/js/content.js` 手動編輯（跟之前一樣）。改完之後：
1. 到 GitHub 網頁上，找到 `assets/js/content.js`，點鉛筆圖示編輯
2. 改完直接在網頁上按「Commit changes」存檔
3. Netlify 偵測到 GitHub 有更新，會自動重新部署，網站跟著更新

不需要在自己電腦上操作，直接在 GitHub 網頁上改就行。

---

## 常見問題

**Q：後台編輯後，網站多久會更新？**
通常 30 秒內。如果超過幾分鐘還沒更新，去 Netlify 後台的「Deploys」分頁看有沒有部署失敗的紅字訊息。

**Q：忘記後台密碼怎麼辦？**
在 `你的網址/admin` 的登入畫面應該有「Forgot password」的選項，或回到 Netlify Identity 頁面重新發一次邀請信。

**Q：可以換成自己的網域名稱（例如 easonrides.com）嗎？**
可以，Netlify 的 Site settings → Domain management 裡可以綁定自己買的網域，這是額外步驟，需要的話再跟我說，我可以另外教你。
