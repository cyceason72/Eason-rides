/**
 * loader.js — Opening Sequence
 * 職責：黑畫面 → Logo（儀表通電感）淡入淡出 → 與 Hero/Navbar Crossfade，全程約 2.6 秒。
 * 每次進站（含重新整理）都會播放，不做「只播一次」的記憶。
 *
 * 重要：瀏覽器的自動播放政策規定「聲音一定要接在使用者手勢之後」才會被允許播放，
 * 這不是能被繞過的限制。所以整個時間序列改成「等使用者點擊 Enter 才開始」，
 * 而不是頁面一載入就自動跑——這樣才能確保聲音真的會響。
 * 如果使用者遲遲沒有互動，8 秒後會自動跳過、直接顯示網站（沒有聲音，但不會卡住使用者）。
 *
 * 時間軸（從使用者點擊 Enter 那一刻起算）：
 *   0.0s        全黑，播放電門聲「喀」
 *   0.5s→1.6s   Logo + Slogan 淡入並停留（含指針掃描線 + 背光暈開的儀表通電感）
 *   1.6s        播放發動聲「轟──」，Logo 開始淡出，
 *               Loader 背景開始透明化（＝與 Hero 的 Crossfade），
 *               Hero 內容／Navbar 同時開始淡入，Hero 照片有一個輕微悸動
 *   2.0s→3.2s   排氣聲用指數曲線平順淡出（不是硬切）
 *   2.2s        Loader 完全透明，可以安全移除
 *   4.0s        Hero 從照片切成影片（先讓使用者看幾秒照片，不是一開場就是動的），
 *               有點 Enter（withSound）的話影片會嘗試帶聲音播放；
 *               8 秒沒互動走安全逾時的情況（withSound=false）則是靜音播放。
 */

const OPENING_FALLBACK_DELAY = 8000; // 沒有互動時的安全逾時

const OPENING_TIMING = {
  logoIn: 500,
  logoHoldUntil: 1600,
  loaderDoneAt: 2200,
  audioFadeStart: 2000,
  audioFadeDuration: 1200,
  heroVideoAt: 4000,
};

/**
 * activateHeroVideo
 * 職責：把 Hero 從靜態照片切成影片播放。
 * withSound 為 true（使用者剛點過 Enter，等於剛給過一次使用者手勢）時，
 * 嘗試帶聲音播放；瀏覽器政策還是有可能擋下帶聲音的自動播放，
 * 擋下的話就靜默退回靜音播放，至少畫面還是會動，不會整個播放失敗卡住。
 */
function activateHeroVideo(withSound) {
  const visual = document.querySelector('.hero__visual');
  const video = document.querySelector('.hero__video');
  if (!visual || !video) return;

  let triggered = false;
  const startPlayback = () => {
    if (triggered) return;
    triggered = true;
    visual.classList.add('is-video-active');
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        if (!video.muted) {
          video.muted = true;
          video.play().catch(() => {});
        }
      });
    }
  };

  video.muted = !withSound;
  if (video.readyState >= 2) {
    startPlayback();
  } else {
    video.addEventListener('canplay', startPlayback, { once: true });
    window.setTimeout(startPlayback, 1500); // 保險：影片遲遲沒 ready（網路慢）也不要卡住
  }
}

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
 * 職責：讓排氣聲平順地「漸漸消失」，不是硬切。
 * 人耳對音量的感受是接近對數（指數）曲線，用線性淡出聽起來反而像「先快速變小聲、
 * 後面又拖著尾巴」，所以這裡用 (1-progress)^2 的曲線讓衰減更符合聽覺直覺。
 */
function fadeOutAudio(elementId, durationMs) {
  const el = document.getElementById(elementId);
  if (!el || el.paused) return;

  const startVolume = el.volume;
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min((now - startTime) / durationMs, 1);
    const eased = Math.pow(1 - progress, 2);
    el.volume = Math.max(0, startVolume * eased);
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

  // 使用者偏好減少動態效果：直接跳到最終畫面，不播開場（尊重無障礙設定，這個不受「每次都播」影響）。
  if (prefersReducedMotion) {
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

    if (enterBtn) enterBtn.classList.add('is-hidden');

    if (withSound) {
      setImmersiveMode(true); // 點 Enter 這個手勢，直接連同開啟全站互動音效，不用再多點一次
      syncImmersiveToggleUI();
      playOpeningSfx('sfx-click'); // t = 0s
    }

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
    }, OPENING_TIMING.loaderDoneAt);

    window.setTimeout(() => {
      if (withSound) fadeOutAudio('sfx-engine', OPENING_TIMING.audioFadeDuration);
    }, OPENING_TIMING.audioFadeStart);

    window.setTimeout(() => {
      activateHeroVideo(withSound);
    }, OPENING_TIMING.heroVideoAt);
  }

  if (enterBtn) {
    enterBtn.addEventListener('click', () => beginSequence(true), { once: true });
  }

  // 沒有互動也不能讓使用者卡住：安全逾時後自動開始（沒有聲音，因為沒有使用者手勢）
  window.setTimeout(() => beginSequence(false), OPENING_FALLBACK_DELAY);
}
