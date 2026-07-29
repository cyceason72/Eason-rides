/**
 * main.js — 進入點
 * 只負責初始化各模組，不寫任何實際功能邏輯（邏輯拆分於個別檔案）。
 * 注意：此專案改用一般 <script> 依序載入（非 type="module"），
 * 是為了在直接雙擊開啟 index.html（file:// 協定）時也能正常運作。
 */

document.addEventListener('DOMContentLoaded', async () => {
  await initRender();     // render.js：讀取 CMS 資料（或 content.js 預設值）並畫出畫面
  initNavigation();       // navigation.js
  initJournalSearch();    // journal 搜尋
  initLightboxKeyboard(); // gallery.js
  initCounters();         // counter.js
  initScrollReveal();     // animation.js（要在 render 完成、DOM 都存在之後才監看）
  initSubtleParallax();   // animation.js：Ride Statistics 的輕微視差
  initBackToTop();        // footer.js
  initImmersiveToggle();  // sound.js：右下角 Immersive Mode 開關
  initTapSfxDelegation(); // sound.js：按鈕的柔和 UI Tap 音效
  initHoverSfxDelegation(); // sound.js：照片／影片卡片的輕微 Hover 音效（含節流）
  initLoader();           // loader.js（放最後，確保上面內容都已就緒再開始進場動畫）
});
