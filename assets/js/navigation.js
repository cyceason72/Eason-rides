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

  // iOS Safari 有時候光靠 body overflow:hidden 鎖不住背景捲動，
  // 額外擋掉選單開啟時、選單本身以外的 touchmove，才能真的鎖住。
  document.addEventListener('touchmove', (event) => {
    if (toggle.getAttribute('aria-expanded') !== 'true') return;
    if (links.contains(event.target)) return; // 選單本身允許捲動（如果內容超過一屏）
    event.preventDefault();
  }, { passive: false });

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

/**
 * initActiveSectionSpy
 * 職責：捲動時偵測目前畫面中央帶落在哪個區塊，
 *       自動幫對應的 nav 連結加上 .is-active，讓使用者捲動時不會失去方向感。
 *       用 rootMargin 在視窗中央切一條窄帶當作判斷基準，
 *       不管每個區塊實際高度差多少都能穩定判斷「目前在看哪一段」。
 */
function initActiveSectionSpy() {
  const links = Array.from(document.querySelectorAll('.nav__link[href^="#"]'));
  if (!links.length || !('IntersectionObserver' in window)) return;

  const sectionToLink = new Map();
  links.forEach((link) => {
    const id = link.getAttribute('href').slice(1);
    const section = document.getElementById(id);
    if (section) sectionToLink.set(section, link);
  });
  if (!sectionToLink.size) return;

  const setActive = (activeLink) => {
    links.forEach((link) => link.classList.toggle('is-active', link === activeLink));
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting);
      if (!visible.length) return;
      const top = visible.reduce((a, b) => (a.intersectionRatio > b.intersectionRatio ? a : b));
      setActive(sectionToLink.get(top.target));
    },
    { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.01, 0.25, 0.5, 0.75, 1] }
  );

  sectionToLink.forEach((_, section) => observer.observe(section));
}

function initNavigation() {
  initNavScrollState();
  initMobileNavToggle();
  initActiveSectionSpy();
}
