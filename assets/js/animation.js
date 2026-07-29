/**
 * animation.js
 * 職責：使用 IntersectionObserver 監看所有 [data-reveal] 元素，
 *       進入視窗時加上 .is-visible 觸發 CSS 過渡（見 base.css）。
 *       之後 About / Gallery / Journal 等區塊只需加上 data-reveal 屬性即可套用。
 */

function initScrollReveal() {
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (!revealEls.length) return;

  if (!('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }
  );

  revealEls.forEach((el) => observer.observe(el));
}

/**
 * initSubtleParallax
 * 職責：非常輕微的視差效果（Ride Statistics 卡片），只有在該區塊進入畫面時
 *       才掛上 scroll 監聽，離開畫面就拆掉，避免長駐一個全站 scroll listener 拖效能。
 *       用 requestAnimationFrame 節流，只搬動 transform（GPU 加速），不觸發 layout。
 */
function initSubtleParallax() {
  const track = document.querySelector('[data-parallax]');
  if (!track || !('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const MAX_OFFSET = 14; // px，非常輕微，不會讓人感覺頭暈或影響閱讀
  let ticking = false;

  function update() {
    ticking = false;
    const rect = track.getBoundingClientRect();
    const viewportCenter = window.innerHeight / 2;
    const elementCenter = rect.top + rect.height / 2;
    const distance = (elementCenter - viewportCenter) / viewportCenter; // -1 ~ 1 大約
    const offset = Math.max(-1, Math.min(1, distance)) * MAX_OFFSET;
    track.style.transform = `translateY(${offset.toFixed(1)}px)`;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        window.addEventListener('scroll', onScroll, { passive: true });
        update();
      } else {
        window.removeEventListener('scroll', onScroll);
      }
    });
  }, { threshold: 0 });

  observer.observe(track);
}
