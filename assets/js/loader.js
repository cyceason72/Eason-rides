/**
 * loader.js
 * 職責：
 *  1. 首次進站顯示約 1 秒的黑底 Logo Loader
 *  2. Loader 淡出後，為 .hero 加上 .hero--revealed，
 *     觸發 hero.css 中已定義好的 Logo → Title → Subtitle → Button → Motorcycle 序列
 */

const LOADER_MIN_DURATION = 1000;

function initLoader() {
  const loader = document.querySelector('.loader');
  const hero = document.querySelector('.hero');
  const prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const reveal = () => {
    if (loader) {
      loader.classList.add('is-hidden');
      loader.addEventListener(
        'transitionend',
        () => loader.remove(),
        { once: true }
      );
    }
    if (hero) hero.classList.add('hero--revealed');
  };

  if (prefersReducedMotion) {
    reveal();
    return;
  }

  window.setTimeout(reveal, LOADER_MIN_DURATION);
}
