/**
 * sound.js — 全站 Sound Design 系統
 * 職責：管理 Immersive Mode 開關狀態，並提供統一的音效播放介面。
 *
 * 設計原則（跟設計稿一致）：
 *   - 音效寧可少，也不要多。預設整站完全安靜。
 *   - 只有使用者主動打開右下角「Immersive Mode」，才會啟用所有互動音效。
 *   - 開場動畫的電門聲／發動聲例外：那是使用者點擊 Enter 當下的一次性儀式感，
 *     用「點擊 Enter」本身當作那一刻的聲音同意，邏輯獨立寫在 loader.js。
 *   - 所有音效必須是真實錄音（引擎、快門、風聲、實體按鍵那種），
 *     絕不用合成的科技音效（beep / 電子音效）湊數。
 *     目前只有開場那兩段是真實素材；Scroll Whoosh／Camera Shutter／UI Tap
 *     這三個都還沒有素材，先把掛勾點做好，之後補檔案就會自動生效，不用改邏輯。
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

function initImmersiveToggle() {
  const toggle = document.querySelector('[data-immersive-toggle]');
  if (!toggle) return;

  const sync = () => {
    const on = isImmersiveModeOn();
    toggle.setAttribute('aria-pressed', String(on));
    toggle.classList.toggle('is-on', on);
  };

  sync();

  toggle.addEventListener('click', () => {
    setImmersiveMode(!isImmersiveModeOn());
    sync();
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
