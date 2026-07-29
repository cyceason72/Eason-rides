/**
 * sound.js — 全站 Sound Design 系統
 * 職責：管理 Immersive Mode 開關狀態，並提供統一的音效播放介面。
 *
 * 設計原則：
 *   - 音效寧可少，也不要多。
 *   - 點擊開場動畫的 Enter 按鈕後，自動開啟全站互動音效（不用再額外開關一次），
 *     右下角的 Immersive Mode 按鈕保留給想要靜音的人自己關掉。
 *   - 音效不要求一定是真實錄音，但要有質感：偏機械／空氣的質地，
 *     避免常見的電子系統音效（beep / 科技感提示音）。
 */

const IMMERSIVE_MODE_KEY = 'eason-rides-immersive-mode';

function isImmersiveModeOn() {
  try {
    return localStorage.getItem(IMMERSIVE_MODE_KEY) === '1';
  } catch (e) {
    return false;
  }
}

function setImmersiveMode(on) {
  try {
    localStorage.setItem(IMMERSIVE_MODE_KEY, on ? '1' : '0');
  } catch (e) {
    /* 忽略；不影響網站其他功能 */
  }
}

/**
 * playAmbientSfx
 * 職責：播放「互動氛圍音效」（Scroll Whoosh / Camera Shutter / UI Tap 這類）。
 * 只有 Immersive Mode 開啟時才會真的出聲；找不到對應的 <audio> 元素
 * （代表還沒補檔案）也會安靜地什麼都不做，不會噴錯。
 */
function playAmbientSfx(elementId, { volume = 1 } = {}) {
  if (!isImmersiveModeOn()) return;
  const el = document.getElementById(elementId);
  if (!el) return; // 素材還沒補上，安靜略過

  try {
    el.currentTime = 0;
  } catch (e) {
    /* 部分瀏覽器在音檔還沒 ready 時設定 currentTime 會丟錯，略過即可 */
  }
  el.volume = volume;
  const playPromise = el.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {});
  }
}

function syncImmersiveToggleUI() {
  const toggle = document.querySelector('[data-immersive-toggle]');
  if (!toggle) return;
  const on = isImmersiveModeOn();
  toggle.setAttribute('aria-pressed', String(on));
  toggle.classList.toggle('is-on', on);
}

function initImmersiveToggle() {
  const toggle = document.querySelector('[data-immersive-toggle]');
  if (!toggle) return;

  syncImmersiveToggleUI();

  toggle.addEventListener('click', () => {
    setImmersiveMode(!isImmersiveModeOn());
    syncImmersiveToggleUI();
  });
}

/**
 * initTapSfxDelegation
 * 職責：任何元素只要加上 data-sfx-tap 屬性，點擊時就會自動播放柔和 UI Tap 音效
 *       （目前是 View Gallery / Explore / Back to Top 這幾個按鈕）。
 *       用事件委派掛在 document 上，之後要新增更多按鈕，加屬性就好，不用改這裡的程式碼。
 */
function initTapSfxDelegation() {
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-sfx-tap]');
    if (trigger) playAmbientSfx('sfx-tap', { volume: 0.5 });
  });
}

/**
 * 註：原本這裡有一個 initHoverSfxDelegation()（滑過照片播放輕微音效），
 * 使用者反映滑鼠掃過去很吵，已經移除呼叫也移除定義。
 * 如果之後想重新啟用，方向要維持極輕、極低頻、有節流，不要吵。
 */
