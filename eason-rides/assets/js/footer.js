/**
 * footer.js
 * 職責：Footer 的 Back To Top 按鈕，平滑捲動回頂部。
 */

function initBackToTop() {
  const btn = document.querySelector('[data-back-to-top]');
  if (!btn) return;

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
