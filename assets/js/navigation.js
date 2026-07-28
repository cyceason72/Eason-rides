/**
 * navigation.js
 * 職責：
 *  1. 捲動超過門檻時，為 .nav 加上 is-scrolled（透明 → 深色霧面）
 *  2. 手機版漢堡選單開關與 ESC / 連結點擊後自動收合
 */

const NAV_SCROLL_THRESHOLD = 24;

function initNavScrollState() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  const updateNavState = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > NAV_SCROLL_THRESHOLD);
  };

  updateNavState();
  window.addEventListener('scroll', updateNavState, { passive: true });
}

function initMobileNavToggle() {
  const toggle = document.querySelector('.nav__toggle');
  const links = document.querySelector('.nav__links');
  if (!toggle || !links) return;

  const closeMenu = () => {
    toggle.setAttribute('aria-expanded', 'false');
    links.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  const openMenu = () => {
    toggle.setAttribute('aria-expanded', 'true');
    links.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });

  links.querySelectorAll('.nav__link').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
}

function initNavigation() {
  initNavScrollState();
  initMobileNavToggle();
}
