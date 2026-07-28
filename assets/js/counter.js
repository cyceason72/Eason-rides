/**
 * counter.js
 * 職責：Statistics 區塊的數字，在進入視窗時才從 0 動畫跑到目標值。
 */

function animateCounter(el) {
  const target = Number(el.getAttribute('data-target')) || 0;
  const duration = 1400;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.round(target * eased);
    el.textContent = current.toLocaleString('en-US');
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function initCounters() {
  const numbers = document.querySelectorAll('.stat__number');
  if (!numbers.length) return;

  if (!('IntersectionObserver' in window)) {
    numbers.forEach(animateCounter);
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );

  numbers.forEach((el) => observer.observe(el));
}
