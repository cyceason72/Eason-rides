/**
 * loader.js — Opening Sequence
 * 職責：黑畫面 → Logo 淡入淡出 → 與 Hero/Navbar Crossfade，全程約 2.6 秒。
 * 只在「這次瀏覽期間」的第一次進站播放（sessionStorage），
 * 重新整理或切換內部頁面不會再播一次。
 *
 * 重要：瀏覽器的自動播放政策規定「聲音一定要接在使用者手勢之後」才會被允許播放，
 * 這不是能被繞過的限制。所以整個時間序列改成「等使用者點擊 Enter 才開始」，
 * 而不是頁面一載入就自動跑——這樣才能確保聲音真的會響。
 * 如果使用者遲遲沒有互動（例如用鍵盤瀏覽器焦點還沒移過來），
 * 8 秒後會自動跳過、直接顯示網站（沒有聲音，但不會卡住使用者）。
 *
 * 時間軸（從使用者點擊 Enter 那一刻起算）：
 *   0.0s        全黑，播放電門聲「喀」
 *   0.5s→1.6s   Logo + Slogan 淡入並停留
 *   1.6s        播放發動聲「轟──」，Logo 開始淡出，
 *               Loader 背景開始透明化（＝與 Hero 的 Crossfade），
 *               Hero 內容／Navbar 同時開始淡入
 *   2.2s        Loader 完全透明，可以安全移除
 */

const OPENING_SESSION_KEY = 'eason-rides-opening-played';
const OPENING_FALLBACK_DELAY = 8000; // 沒有互動時的安全逾時

const OPENING_TIMING = {
  logoIn: 500,
  logoHoldUntil: 1600,
  loaderDoneAt: 2200,
};

function playOpeningSfx(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.volume = 1;
  const playPromise = el.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {
      /* 極少數情況下仍可能被擋下，靜默略過，視覺節奏照常進行 */
    });
  }
}

/**
 * fadeOutAudio
 * 職責：讓聲音跟著開場動畫一起「收尾」，而不是動畫都結束了聲音還孤零零地繼續播。
 * 用 rAF 把音量從目前值線性降到 0，結束後暫停並重置播放位置。
 */
function fadeOutAudio(elementId, durationMs) {
  const el = document.getElementById(elementId);
  if (!el || el.paused) return;

  const startVolume = el.volume;
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min((now - startTime) / durationMs, 1);
    el.volume = Math.max(0, startVolume * (1 - progress));
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.pause();
      el.currentTime = 0;
      el.volume = 1; // 還原，下次播放才不會是無聲
    }
  }

  requestAnimationFrame(step);
}

function hasOpeningPlayedThisSession() {
  try {
    return sessionStorage.getItem(OPENING_SESSION_KEY) === '1';
  } catch (e) {
    return false; // 無痕模式等 sessionStorage 被封鎖時，視同「還沒播過」
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
  const enterBtn = document.querySelector('.loader__enter');
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

  if (!loader || !content) {
    revealSiteChrome();
    return;
  }

  let started = false;

  function beginSequence(withSound) {
    if (started) return;
    started = true;
    markOpeningPlayed();

    if (enterBtn) enterBtn.classList.add('is-hidden');

    if (withSound) playOpeningSfx('sfx-click'); // t = 0s

    window.setTimeout(() => {
      content.classList.add('is-visible');
    }, OPENING_TIMING.logoIn);

    window.setTimeout(() => {
      if (withSound) playOpeningSfx('sfx-engine'); // t = 1.6s
      content.classList.remove('is-visible');
      content.classList.add('is-hiding');
      loader.classList.add('is-fading'); // Loader 背景透明化＝與 Hero 的 Crossfade
      revealSiteChrome(); // Hero／Navbar 同時開始淡入

      const heroVisual = document.querySelector('.hero__visual');
      if (heroVisual) heroVisual.classList.add('is-igniting'); // 跟發動聲同步的輕微悸動感
    }, OPENING_TIMING.logoHoldUntil);

    window.setTimeout(() => {
      loader.classList.add('is-done');
      loader.addEventListener('transitionend', () => loader.remove(), { once: true });
      if (withSound) fadeOutAudio('sfx-engine', 450); // 動畫收尾，聲音也跟著淡出，不會孤零零地繼續播
    }, OPENING_TIMING.loaderDoneAt);
  }

  if (enterBtn) {
    enterBtn.addEventListener('click', () => beginSequence(true), { once: true });
  }

  // 沒有互動也不能讓使用者卡住：安全逾時後自動開始（沒有聲音，因為沒有使用者手勢）
  window.setTimeout(() => beginSequence(false), OPENING_FALLBACK_DELAY);
}
