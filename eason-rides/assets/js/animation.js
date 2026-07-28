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
