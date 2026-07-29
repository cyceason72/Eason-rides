/**
 * render.js
 * 職責：把資料轉成 DOM 插入對應容器。
 *       每個 render 函式只負責一個 Section，方便日後新增/修改。
 *
 * 資料來源優先順序（04 Gallery / 追焦紀錄 / 05 Journal / 06 Videos）：
 *   1. content/*.json —— 部署後台之後，由後台管理介面寫入，這是「正式資料」
 *   2. content.js 的 SITE_CONTENT —— 抓不到 JSON 時的離線預覽備用值
 *      （例如直接雙擊 index.html 開啟、沒有透過網頁伺服器時，fetch 本機檔案會失敗，
 *       這時就會自動改用這裡的預設值，不會讓頁面空白）
 */

let GALLERY_ITEMS = [];
let PANNING_ITEMS = [];
let JOURNAL_ENTRIES = [];
let VIDEOS_ITEMS = [];

async function loadJSON(path) {
  try {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${path} not ok`);
    return await res.json();
  } catch (err) {
    return null; // 抓不到就回傳 null，呼叫端會改用 content.js 的預設值
  }
}

/* ---------------- 02 About ---------------- */

function renderAbout() {
  const visual = document.querySelector('[data-render="about-visual"]');
  const body = document.querySelector('[data-render="about-body"]');
  if (!visual || !body) return;

  const about = SITE_CONTENT.about;
  visual.innerHTML = '';

  const media = createMediaElement({
    src: about.photo,
    alt: about.name,
    label: '待補：個人照片',
  });
  visual.appendChild(media);

  const instagramHTML = about.instagram && about.instagram.handle
    ? `
    <a class="about__instagram" href="${about.instagram.url}" target="_blank" rel="noopener noreferrer" aria-label="在 Instagram 上追蹤 ${about.instagram.handle}">
      <span class="about__instagram-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.3"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.3"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
      </span>
      <span class="about__instagram-handle">${about.instagram.handle}</span>
      <span class="about__instagram-follow">Follow</span>
    </a>`
    : '';

  body.innerHTML = `
    <p class="eyebrow">About</p>
    <h2 class="about__name">${about.name}</h2>
    <p class="about__meta">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s7-6.3 7-11.5A7 7 0 105 9.5C5 14.7 12 21 12 21z" stroke="currentColor" stroke-width="1.3"/><circle cx="12" cy="9.5" r="2.3" stroke="currentColor" stroke-width="1.3"/></svg>
      ${about.location}
    </p>
    <p class="about__intro">${about.intro}</p>
    <div class="about__facts">
      <div>
        <span class="about__fact-label">Riding Philosophy</span>
        <p class="about__fact-value">${about.philosophy}</p>
      </div>
      <div>
        <span class="about__fact-label">Personal Motto</span>
        <p class="about__fact-value">${about.motto}</p>
      </div>
    </div>
    ${instagramHTML}
  `;
}

/* ---------------- 03 Featured Bike ---------------- */

function renderBikes() {
  const container = document.querySelector('[data-render="bikes"]');
  if (!container) return;
  container.innerHTML = '';

  SITE_CONTENT.bikes.forEach((bike, index) => {
    const card = document.createElement('article');
    card.className = 'bike-card';
    card.setAttribute('data-reveal', '');

    const visual = createMediaElement({
      src: bike.image,
      alt: bike.alt || bike.name,
      label: `待補：${bike.name} 照片`,
      className: 'bike-card__image',
    });
    visual.classList.add('bike-card__visual');

    const specsHTML = bike.specs
      .map(
        (spec) => `
        <div class="bike-card__spec">
          <dt>${spec.label}</dt>
          <dd>${spec.value}</dd>
        </div>`
      )
      .join('');

    const info = document.createElement('div');
    info.className = 'bike-card__info';
    info.innerHTML = `
      <p class="eyebrow">Garage ${String(index + 1).padStart(2, '0')}</p>
      <h3 class="bike-card__name">${bike.name}</h3>
      <dl class="bike-card__specs">${specsHTML}</dl>
    `;

    card.appendChild(visual);
    card.appendChild(info);
    container.appendChild(card);
  });
}

/* ---------------- 04 靜態紀錄 Static + 追焦紀錄 Panning ----------------
   兩個區塊排版/邏輯完全共用，差別只在資料來源跟容器。
   為了避免照片一多，手機上要滑很久才滑得完，改成「先顯示一部分＋
   查看更多」的漸進式呈現，維持畫面簡約，同時不犧牲內容完整性。 */

const GRID_INITIAL_COUNT = 9; // 一開始先顯示幾張，其餘收在「查看更多」後面

function buildGridItem(items, item, index, emptyLabel) {
  const figure = document.createElement('button');
  figure.type = 'button';
  figure.className = 'gallery-item';
  figure.setAttribute('data-reveal', '');
  figure.setAttribute('data-index', String(index));
  figure.setAttribute('aria-label', item.caption || `開啟第 ${index + 1} 張照片`);

  const media = createNaturalMediaElement({
    src: item.image,
    alt: item.alt,
    label: emptyLabel,
  });
  figure.appendChild(media);

  if (item.caption) {
    const cap = document.createElement('span');
    cap.className = 'gallery-item__caption';
    cap.textContent = item.caption;
    figure.appendChild(cap);
  }

  figure.addEventListener('click', () => {
    const lightboxItems = items.map((g) => ({ type: 'image', src: g.image, alt: g.alt }));
    openLightbox(lightboxItems, index, item.caption);
  });

  return figure;
}

/**
 * @param {string} gridKey       data-render 容器的值，例如 'gallery'
 * @param {string} moreSlotKey   「查看更多」按鈕插入位置的 data-render 值
 * @param {Array} items          該區塊的資料陣列
 * @param {string} emptyLabel    佔位圖說明文字
 */
function renderMediaGrid(gridKey, moreSlotKey, items, emptyLabel) {
  const container = document.querySelector(`[data-render="${gridKey}"]`);
  const moreSlot = document.querySelector(`[data-render="${moreSlotKey}"]`);
  if (!container) return;
  container.innerHTML = '';
  if (moreSlot) moreSlot.innerHTML = '';

  const total = items.length;
  const initialCount = Math.min(GRID_INITIAL_COUNT, total);

  for (let i = 0; i < initialCount; i += 1) {
    container.appendChild(buildGridItem(items, items[i], i, emptyLabel));
  }

  if (total > initialCount && moreSlot) {
    const remaining = total - initialCount;
    let expanded = false;
    let extraEls = [];

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-ghost load-more-btn';
    btn.innerHTML = `查看更多 <span class="load-more-btn__count">還有 ${remaining} 張</span>`;

    btn.addEventListener('click', () => {
      if (!expanded) {
        // ---- 展開：把剩下的項目加進去 ----
        extraEls = [];
        for (let i = initialCount; i < total; i += 1) {
          const el = buildGridItem(items, items[i], i, emptyLabel);
          container.appendChild(el);
          extraEls.push(el);
        }
        // 新加入的項目直接顯現（不用等捲動觸發），但保留淡入轉場，避免畫面瞬間跳動
        requestAnimationFrame(() => {
          extraEls.forEach((el) => el.classList.add('is-visible'));
        });
        btn.innerHTML = `收起 <span class="load-more-btn__count">Collapse</span>`;
        expanded = true;
      } else {
        // ---- 收起：把剛剛加進去的項目移除 ----
        extraEls.forEach((el) => el.remove());
        extraEls = [];
        btn.innerHTML = `查看更多 <span class="load-more-btn__count">還有 ${remaining} 張</span>`;
        expanded = false;
        // 收起後把畫面捲回按鈕位置，避免停在原本展開內容的空白處
        moreSlot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    moreSlot.appendChild(btn);
  }
}

function renderGallery() {
  renderMediaGrid('gallery', 'gallery-more', GALLERY_ITEMS, '待補照片');
}

/* ---------------- 追焦紀錄 Panning ---------------- */

function renderPanning() {
  renderMediaGrid('panning', 'panning-more', PANNING_ITEMS, '待補追焦照片');
}

/* ---------------- 05 Ride Journal ---------------- */

const journalState = { year: 'all', query: '' };

function renderJournal() {
  const container = document.querySelector('[data-render="journal"]');
  if (!container) return;
  container.innerHTML = '';

  const { year, query } = journalState;
  const q = query.trim().toLowerCase();

  const entries = JOURNAL_ENTRIES.filter((entry) => {
    const matchesYear = year === 'all' || String(entry.year) === String(year);
    const matchesQuery =
      !q ||
      entry.location.toLowerCase().includes(q) ||
      entry.note.toLowerCase().includes(q) ||
      (entry.tags || []).some((tag) => tag.toLowerCase().includes(q));
    return matchesYear && matchesQuery;
  });

  if (!entries.length) {
    container.innerHTML = `<p class="journal-empty">這個年份還沒有旅程紀錄。</p>`;
    return;
  }

  entries.forEach((entry) => {
    const card = document.createElement('article');
    card.className = 'journal-card';
    card.setAttribute('data-reveal', '');

    const cover = entry.media && entry.media[0];
    const visualBtn = document.createElement('button');
    visualBtn.type = 'button';
    visualBtn.className = 'journal-card__visual';
    visualBtn.setAttribute('aria-label', `開啟 ${entry.location} 的相簿`);

    const media = createMediaElement({
      src: cover ? cover.src : '',
      alt: entry.location,
      label: '待補旅程照片',
      type: cover ? cover.type : 'image',
      controls: false,
    });
    visualBtn.appendChild(media);

    if (entry.media && entry.media.length > 1) {
      const badge = document.createElement('span');
      badge.className = 'journal-card__badge';
      badge.textContent = `共 ${entry.media.length} 個`;
      visualBtn.appendChild(badge);
    }

    visualBtn.addEventListener('click', () => {
      const items = (entry.media || []).map((m) => ({
        type: m.type,
        src: m.src,
        alt: entry.location,
      }));
      openLightbox(items, 0, entry.location);
    });

    const tagsHTML = (entry.tags || [])
      .map((tag) => `<span class="tag">${tag}</span>`)
      .join('');

    const body = document.createElement('div');
    body.className = 'journal-card__body';
    body.innerHTML = `
      <div class="journal-card__meta">
        <time datetime="${entry.date}">${entry.date}</time>
        <span class="journal-card__km">${entry.km} km</span>
      </div>
      <h3 class="journal-card__location">${entry.location}</h3>
      <p class="journal-card__note">${entry.note}</p>
      <div class="journal-card__tags">${tagsHTML}</div>
    `;

    card.appendChild(visualBtn);
    card.appendChild(body);
    container.appendChild(card);
  });
}

function initJournalFilters() {
  const filterBar = document.querySelector('[data-journal-filters]');
  if (!filterBar) return;

  const years = Array.from(new Set(JOURNAL_ENTRIES.map((e) => e.year))).sort(
    (a, b) => b - a
  );

  const allBtn = filterBar.querySelector('[data-year="all"]');
  years.forEach((year) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filter-chip';
    btn.setAttribute('data-year', String(year));
    btn.textContent = String(year);
    filterBar.appendChild(btn);
  });

  filterBar.addEventListener('click', (event) => {
    const btn = event.target.closest('.filter-chip');
    if (!btn) return;
    filterBar.querySelectorAll('.filter-chip').forEach((el) =>
      el.classList.remove('is-active')
    );
    btn.classList.add('is-active');
    journalState.year = btn.getAttribute('data-year');
    renderJournal();
  });

  if (allBtn) allBtn.classList.add('is-active');
}

function initJournalSearch() {
  const input = document.querySelector('[data-journal-search]');
  if (!input) return;

  let debounceTimer;
  input.addEventListener('input', (event) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      journalState.query = event.target.value;
      renderJournal();
    }, 150);
  });
}

/* ---------------- 06 Videos ---------------- */

/* ---------------- 06 Videos ----------------
   「影片也是作品」：改成電影海報式卡片，桌面 hover 有播放感的互動，
   手機因為沒有 hover，改成「先點一下顯示資訊，再點播放鍵才跳轉」，
   不是把桌面那套原封不動搬過去。 */

const IS_TOUCH_DEVICE =
  typeof window.matchMedia === 'function' && window.matchMedia('(hover: none)').matches;

function renderVideos() {
  const container = document.querySelector('[data-render="videos"]');
  if (!container) return;
  container.innerHTML = '';

  VIDEOS_ITEMS.forEach((video) => {
    const card = document.createElement('a');
    card.className = 'video-card';
    card.href = video.url || '#';
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.setAttribute('data-reveal', '');
    card.setAttribute('aria-label', `${video.title}（在新分頁開啟 ${video.platform}）`);

    const media = createMediaElement({
      src: video.thumbnail,
      alt: video.title,
      label: '待補影片縮圖',
      className: 'video-card__image',
    });
    media.classList.add('video-card__media');
    card.appendChild(media);

    const scrim = document.createElement('span');
    scrim.className = 'video-card__scrim';
    scrim.setAttribute('aria-hidden', 'true');
    card.appendChild(scrim);

    const playRing = document.createElement('span');
    playRing.className = 'video-card__play-ring';
    playRing.setAttribute('aria-hidden', 'true');
    playRing.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M10 8.5l6 3.5-6 3.5v-7z" fill="currentColor" />
      </svg>
    `;
    card.appendChild(playRing);

    const badge = document.createElement('span');
    badge.className = 'video-card__badge';
    badge.textContent = video.platform;
    card.appendChild(badge);

    const duration = document.createElement('span');
    duration.className = 'video-card__duration';
    duration.textContent = video.duration;
    card.appendChild(duration);

    const body = document.createElement('div');
    body.className = 'video-card__body';
    body.innerHTML = `
      <h3 class="video-card__title">${video.title}</h3>
      <time class="video-card__date" datetime="${video.date}">${video.date}</time>
    `;
    card.appendChild(body);

    // 手機（沒有 hover）：第一次點擊只顯示資訊/播放鍵，不直接跳轉；
    // 已經顯示過資訊後再點一次，才真的離開網站前往外部平台。
    if (IS_TOUCH_DEVICE) {
      card.addEventListener('click', (event) => {
        if (!card.classList.contains('is-revealed')) {
          event.preventDefault();
          document.querySelectorAll('.video-card.is-revealed').forEach((el) => {
            if (el !== card) el.classList.remove('is-revealed');
          });
          card.classList.add('is-revealed');
        }
      });
    }

    container.appendChild(card);
  });
}

/* ---------------- 08 Future Goals ---------------- */

function renderGoals() {
  const container = document.querySelector('[data-render="goals"]');
  if (!container) return;
  container.innerHTML = '';

  SITE_CONTENT.goals.forEach((goal) => {
    const card = document.createElement('article');
    card.className = 'goal-card';
    card.setAttribute('data-reveal', '');
    card.innerHTML = `
      <span class="goal-card__icon" aria-hidden="true">${goal.icon}</span>
      <h3 class="goal-card__title">${goal.title}</h3>
      <p class="goal-card__desc">${goal.description}</p>
      <div class="goal-card__progress" role="progressbar" aria-valuenow="${goal.progress}" aria-valuemin="0" aria-valuemax="100" aria-label="${goal.title} 完成度">
        <span class="goal-card__progress-fill" style="--progress: ${goal.progress}%"></span>
      </div>
      <span class="goal-card__percent">${goal.progress}%</span>
    `;
    container.appendChild(card);
  });
}

/* ---------------- 09 Contact ---------------- */

function renderContact() {
  const container = document.querySelector('[data-render="contact"]');
  if (!container) return;
  container.innerHTML = '';

  const links = [
    { key: 'instagram', label: 'Instagram', icon: 'instagram' },
    { key: 'youtube', label: 'YouTube', icon: 'youtube' },
    { key: 'facebook', label: 'Facebook', icon: 'facebook' },
    { key: 'email', label: 'Email', icon: 'email', href: (v) => `mailto:${v}` },
    { key: 'github', label: 'GitHub', icon: 'github' },
  ];

  links.forEach(({ key, label, icon, href }) => {
    const value = SITE_CONTENT.contact[key];
    if (!value) return;

    const link = document.createElement('a');
    link.className = 'contact-link';
    link.href = href ? href(value) : value;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.innerHTML = `${socialIcon(icon)}<span>${label}</span>`;
    container.appendChild(link);
  });
}

function socialIcon(name) {
  const icons = {
    instagram:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.3"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.3"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
    youtube:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="3" stroke="currentColor" stroke-width="1.3"/><path d="M10.5 9l5 3-5 3V9z" fill="currentColor"/></svg>',
    facebook:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9.5" stroke="currentColor" stroke-width="1.3"/><path d="M13.5 21v-6.5h2.2l.3-2.6h-2.5V10c0-.75.2-1.3 1.3-1.3h1.4V6.4c-.25-.03-1.1-.1-2.1-.1-2.1 0-3.5 1.28-3.5 3.63v2.02H8.5v2.6h2.1V21" stroke="currentColor" stroke-width="1.1"/></svg>',
    email:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke="currentColor" stroke-width="1.3"/><path d="M3.5 6.5L12 13l8.5-6.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    github:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2a10 10 0 00-3.16 19.5c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 015 0c1.9-1.3 2.74-1.02 2.74-1.02.56 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0012 2z" stroke="currentColor" stroke-width="1"/></svg>',
  };
  return icons[name] || '';
}

/* ---------------- 07 Statistics ---------------- */

function renderStats() {
  const container = document.querySelector('[data-render="stats"]');
  if (!container) return;
  container.innerHTML = '';

  SITE_CONTENT.stats.forEach((stat) => {
    const item = document.createElement('div');
    item.className = 'stat';
    item.innerHTML = `
      <span class="stat__number" data-target="${stat.value}">0${stat.suffix || ''}</span>
      <span class="stat__label">${stat.label}</span>
    `;
    container.appendChild(item);
  });
}

/* ---------------- 進入點：一次跑完所有渲染 ---------------- */

async function initRender() {
  // 這些區塊資料量少、不常變動，直接用 content.js 同步渲染
  renderAbout();
  renderBikes();
  renderStats();
  renderGoals();
  renderContact();

  // 這 4 個區塊改成非同步：優先讀 content/*.json（後台管理寫入的正式資料），
  // 抓不到（例如離線用 file:// 打開）才 fallback 回 content.js 的預設值。
  const [galleryData, panningData, journalData, videosData] = await Promise.all([
    loadJSON('content/gallery.json'),
    loadJSON('content/panning.json'),
    loadJSON('content/journal.json'),
    loadJSON('content/videos.json'),
  ]);

  GALLERY_ITEMS = (galleryData && galleryData.items) || SITE_CONTENT.gallery;
  PANNING_ITEMS = (panningData && panningData.items) || SITE_CONTENT.panning;
  JOURNAL_ENTRIES = (journalData && journalData.entries) || SITE_CONTENT.journal;
  VIDEOS_ITEMS = (videosData && videosData.items) || SITE_CONTENT.videos;

  renderGallery();
  renderPanning();
  initJournalFilters();
  renderJournal(); // 初始渲染（year: 'all'）
  renderVideos();
}
