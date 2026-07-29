/**
 * loader.js — Opening Sequence
 * 職責：黑畫面 → Logo 淡入淡出 → 與 Hero/Navbar Crossfade，全程約 2.6 秒。
 * 只在「這次瀏覽期間」的第一次進站播放（sessionStorage），
 * 重新整理或切換內部頁面不會再播一次。
 *
 * 時間軸（對照設計稿）：
 *   0.0s        全黑，播放電門聲「喀」
 *   0.5s→1.6s   Logo + Slogan 淡入並停留
 *   1.6s        播放發動聲「轟──」，Logo 開始淡出，
 *               Loader 背景開始透明化（＝與 Hero 的 Crossfade），
 *               Hero 內容／Navbar 同時開始淡入
 *   2.2s        Loader 完全透明，可以安全移除
 *   ~2.6-2.8s   Hero 內部序列（Title/Tagline/CTA）與 Navbar 都完成淡入
 *
 * 音效說明：瀏覽器的自動播放政策會擋掉「使用者還沒互動過就出聲音」的音訊，
 * 這不是能被繞過的限制。這裡用 best-effort 播放：擋掉就靜默失敗，
 * 視覺流程完全不受影響，不會因為聲音被擋而卡住或報錯。
 */

const OPENING_SESSION_KEY = 'eason-rides-opening-played';

const OPENING_TIMING = {
  logoIn: 500,
  logoHoldUntil: 1600,
  loaderDoneAt: 2200,
};

function playOpeningSfx(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const playPromise = el.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {
      /* 瀏覽器自動播放政策擋下，靜默略過，開場動畫的視覺節奏照常進行 */
    });
  }
}

function hasOpeningPlayedThisSession() {
  try {
    return sessionStorage.getItem(OPENING_SESSION_KEY) === '1';
  } catch (e) {
    return false; // 無痕模式等 sessionStorage 被封鎖時，視同「還沒播過」，寧可多播一次也不要出錯
  }
}

function markOpeningPlayed() {
  try {
    sessionStorage.setItem(OPENING_SESSION_KEY, '1');
  } catch (e) {
    /* 忽略；不影響動畫本身 */
  }
}

function initLoader() {
  const loader = document.querySelector('.loader');
  const content = document.querySelector('.loader__content');
  const hero = document.querySelector('.hero');
  const nav = document.querySelector('.nav');

  const prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const revealSiteChrome = () => {
    if (hero) hero.classList.add('hero--revealed');
    if (nav) nav.classList.add('is-revealed');
  };

  // 已經在這次瀏覽播過，或使用者偏好減少動態效果：直接跳到最終畫面，不重播開場。
  if (prefersReducedMotion || hasOpeningPlayedThisSession()) {
    if (loader) loader.remove();
    revealSiteChrome();
    return;
  }

  markOpeningPlayed();

  if (!loader || !content) {
    revealSiteChrome();
    return;
  }

  playOpeningSfx('sfx-click'); // t = 0s

  window.setTimeout(() => {
    content.classList.add('is-visible');
  }, OPENING_TIMING.logoIn);

  window.setTimeout(() => {
    playOpeningSfx('sfx-engine'); // t = 1.6s
    content.classList.remove('is-visible');
    content.classList.add('is-hiding');
    loader.classList.add('is-fading'); // Loader 背景透明化＝與 Hero 的 Crossfade
    revealSiteChrome(); // Hero／Navbar 同時開始淡入
  }, OPENING_TIMING.logoHoldUntil);

  window.setTimeout(() => {
    loader.classList.add('is-done');
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  }, OPENING_TIMING.loaderDoneAt);
}
