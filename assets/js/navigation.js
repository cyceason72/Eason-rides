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
    const nav = document.querySelector('.nav');
    if (nav) nav.classList.add('is-revealed'); // 保險：確保 nav（連帶選單面板）一定是完全不透明的
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

/**
 * initAnchorScroll
 * 職責：讓站內的錨點連結（導覽列／頁尾／Hero 按鈕...等 href="#xxx"）
 *       改用 JS 主動計算位置再捲動，而不是交給瀏覽器原生錨點跳轉。
 *
 * 為什麼要這樣做——修的是「點『影片紀錄』卻跳到『Ride Journal』」這個 bug：
 * 影片紀錄／相簿等內容都是 JS 非同步渲染出來的（要先讀完 CMS 資料才會把卡片畫出來），
 * 如果使用者在資料還沒渲染完、頁面還沒有「長到最終高度」的當下就點了導覽列，
 * 瀏覽器原生錨點行為是「點的當下馬上算目標位置」，這時候 #videos 的位置
 * 會比最終位置低很多，捲動就會定位不足、停在上一個區塊（Journal）附近。
 * 這裡改成點擊當下才用 getBoundingClientRect 重新量測，
 * 這支函式是在 initRender() 完成之後才呼叫（見 main.js），
 * 所以量到的一定是資料都渲染完、版面穩定之後的正確位置。
 *
 * 順便一起解決：原本沒有扣掉固定導覽列的高度，捲過去之後區塊最上面一截
 * 會被浮動導覽列擋住，這裡也一併扣掉。
 */
function initAnchorScroll() {
  const nav = document.querySelector('.nav');

  const measureTop = (target) => {
    const navHeight = nav ? nav.getBoundingClientRect().height : 0;
    return target.getBoundingClientRect().top + window.scrollY - navHeight - 12;
  };

  let correctionTimer = null;

  const scrollToTarget = (target) => {
    window.scrollTo({ top: Math.max(measureTop(target), 0), behavior: 'smooth' });

    // 保險機制：萬一捲動動畫進行的途中，畫面上方（前面的區塊）因為某些非同步內容
    // 還沒完全穩定而造成高度變動，動畫捲到的位置就會跟原本算的對不上，
    // 結果停在鄰近的另一個區塊。這裡在動畫大致結束後重新量一次，位置對不上
    // 就直接補正過去，不管是什麼原因造成的偏移都能修正回來。
    if (correctionTimer) window.clearTimeout(correctionTimer);
    const correct = () => {
      const top = measureTop(target);
      if (Math.abs(window.scrollY - top) > 6) {
        window.scrollTo({ top: Math.max(top, 0), behavior: 'auto' });
      }
    };
    correctionTimer = window.setTimeout(correct, 700);
  };

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const id = link.getAttribute('href').slice(1);
    if (!id) return; // 空的 "#"（例如純裝飾用連結）不處理

    link.addEventListener('click', (event) => {
      const target = document.getElementById(id);
      if (!target) return; // 找不到目標就交還給瀏覽器預設行為
      event.preventDefault();
      // 用兩層 requestAnimationFrame 確保點擊當下若有任何排隊中的版面異動
      // （例如手機選單正要收合）都先跑完，再量測正確位置。
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToTarget(target);
        });
      });
      history.pushState(null, '', `#${id}`);
    });
  });
}

function initNavigation() {
  initNavScrollState();
  initMobileNavToggle();
  initActiveSectionSpy();
  initAnchorScroll();
}
