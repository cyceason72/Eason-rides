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
let GOALS_ITEMS = [];

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
  figure.setAttribute('data-sfx-hover', '');
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
    btn.setAttribute('data-sfx-tap', '');
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
    const cover = entry.media && entry.media[0];

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'journal-card';
    card.setAttribute('data-reveal', '');
    card.setAttribute('aria-label', `開啟 ${entry.location} 的相簿`);

    const media = createMediaElement({
      src: cover ? cover.src : '',
      alt: entry.location,
      label: '待補旅程照片',
      type: cover ? cover.type : 'image',
      controls: false,
    });
    media.classList.add('journal-card__media');
    card.appendChild(media);

    const scrim = document.createElement('span');
    scrim.className = 'journal-card__scrim';
    scrim.setAttribute('aria-hidden', 'true');
    card.appendChild(scrim);

    if (entry.media && entry.media.length > 1) {
      const badge = document.createElement('span');
      badge.className = 'journal-card__badge';
      badge.textContent = `共 ${entry.media.length} 個`;
      card.appendChild(badge);
    }

    const tagsHTML = (entry.tags || [])
      .map((tag) => `<span class="tag">${tag}</span>`)
      .join('');

    const overlay = document.createElement('div');
    overlay.className = 'journal-card__overlay';
    overlay.innerHTML = `
      <div class="journal-card__meta">
        <time datetime="${entry.date}">${entry.date}</time>
        ${entry.km ? `<span class="journal-card__km">${entry.km} km</span>` : ''}
      </div>
      <h3 class="journal-card__location">${entry.location}</h3>
      ${entry.note ? `<p class="journal-card__note">${entry.note}</p>` : ''}
      <div class="journal-card__tags">${tagsHTML}</div>
    `;
    card.appendChild(overlay);

    card.addEventListener('click', () => {
      const items = (entry.media || []).map((m) => ({
        type: m.type,
        src: m.src,
        alt: entry.location,
      }));
      openLightbox(items, 0, entry.location);
    });

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

/* ---------------- 06 Videos ----------------
   單純影片，不是連結卡。每一支都是真正在頁面上播放的 Reel：
   捲到畫面內自動靜音播放、點一下暫停/繼續、長按暫停放開繼續。
   長度不用手動填，讀取影片本身的長度自動顯示。 */

function formatDuration(totalSeconds) {
  if (!isFinite(totalSeconds) || totalSeconds < 0) return '';
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function renderVideos() {
  const container = document.querySelector('[data-render="videos"]');
  if (!container) return;
  container.innerHTML = '';

  VIDEOS_ITEMS.forEach((video) => {
    if (video.videoSrc) container.appendChild(buildReelCard(video));
  });
}

/**
 * buildReelCard
 * 職責：捲動到畫面內自動靜音播放、循環；點一下暫停/繼續；長按按著暫停、放開繼續播放。
 */
function buildReelCard(video) {
  const card = document.createElement('div');
  card.className = 'video-card video-card--reel';
  card.setAttribute('data-reveal', '');

  const player = document.createElement('video');
  player.className = 'video-card__media video-card__player';
  player.src = video.videoSrc;
  if (video.thumbnail) player.poster = video.thumbnail; // 避免影片還沒開始播放前顯示一片黑
  player.muted = true;
  player.loop = true;
  player.playsInline = true;
  player.preload = 'auto';
  card.appendChild(player);

  // 沒有手動上傳縮圖時，自動抓影片播放到 25% 的畫面當封面（通常比開頭第一幀更有內容，
  // 不會是還沒騎出去、鏡頭還沒對好的那種畫面）。抓到那一幀之後就定格在那，直到真正開始播放。
  if (!video.thumbnail) {
    player.addEventListener('loadedmetadata', () => {
      if (isFinite(player.duration) && player.duration > 0) {
        player.currentTime = player.duration * 0.25;
      }
    }, { once: true });
  }

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

  const duration = document.createElement('span');
  duration.className = 'video-card__duration';
  card.appendChild(duration);
  player.addEventListener('loadedmetadata', () => {
    duration.textContent = formatDuration(player.duration);
  });

  const expandBtn = document.createElement('button');
  expandBtn.type = 'button';
  expandBtn.className = 'video-card__expand';
  expandBtn.setAttribute('aria-label', `全螢幕觀賞：${video.title}`);
  expandBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 4H5a1 1 0 00-1 1v4M15 4h4a1 1 0 011 1v4M9 20H5a1 1 0 01-1-1v-4M15 20h4a1 1 0 001-1v-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
  expandBtn.addEventListener('click', (event) => {
    event.stopPropagation(); // 不要連帶觸發卡片本身的暫停/繼續
    player.pause();
    card.classList.remove('is-playing');
    playAmbientSfx('sfx-shutter', { volume: 0.6 });
    openLightbox([{ type: 'video', src: video.videoSrc, alt: video.title }], 0, video.title);
  });
  card.appendChild(expandBtn);

  const body = document.createElement('div');
  body.className = 'video-card__body';
  body.innerHTML = `
    <h3 class="video-card__title">${video.title}</h3>
    <time class="video-card__date" datetime="${video.date}">${video.date}</time>
  `;
  card.appendChild(body);

  // 捲動到畫面內才自動播放（靜音、循環），離開畫面就暫停，避免同時十幾支影片一起播放拖效能
  let userPaused = false;
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !userPaused) {
            player.play().catch(() => {});
            card.classList.add('is-playing');
          } else {
            player.pause();
            card.classList.remove('is-playing');
          }
        });
      },
      { threshold: 0.6 }
    );
    observer.observe(card);
  }

  // 點一下：暫停／繼續（長按放開後也會觸發 click，用 flag 擋掉，避免放開瞬間又被切一次）
  let suppressNextClick = false;
  card.addEventListener('click', () => {
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }
    if (player.paused) {
      player.play().catch(() => {});
      userPaused = false;
      card.classList.add('is-playing');
    } else {
      player.pause();
      userPaused = true;
      card.classList.remove('is-playing');
    }
  });

  // 長按：按著的時候暫停，放開繼續播放（跟 Reels 一樣的手勢）
  let pressTimer = null;
  let wasPlayingBeforePress = false;
  let didLongPress = false;

  const startPress = () => {
    didLongPress = false;
    pressTimer = window.setTimeout(() => {
      didLongPress = true;
      wasPlayingBeforePress = !player.paused;
      if (wasPlayingBeforePress) {
        player.pause();
        card.classList.add('is-long-pressed');
      }
    }, 180); // 180ms 後才視為長按，避免跟一般點擊搞混
  };

  const endPress = () => {
    window.clearTimeout(pressTimer);
    if (card.classList.contains('is-long-pressed')) {
      card.classList.remove('is-long-pressed');
      if (wasPlayingBeforePress) {
        player.play().catch(() => {});
      }
    }
    if (didLongPress) {
      suppressNextClick = true; // 這次放開接下來會觸發的 click，要擋掉
    }
  };

  card.addEventListener('pointerdown', startPress);
  card.addEventListener('pointerup', endPress);
  card.addEventListener('pointerleave', endPress);
  card.addEventListener('pointercancel', endPress);

  return card;
}

/* ---------------- 08 Future Goals ---------------- */

/* ---------------- 08 The Road Ahead ----------------
   不是 Checklist：沒有打勾圖示，沒有「已完成」徽章。
   只有一條細細的 Progress Line，完成時卡片底部低調顯示「Achieved · 年份」。 */

function renderGoals() {
  const container = document.querySelector('[data-render="goals"]');
  if (!container) return;
  container.innerHTML = '';

  const TICK_COUNT = 24;

  GOALS_ITEMS.forEach((goal) => {
    const card = document.createElement('article');
    card.className = 'goal-card';
    card.setAttribute('data-reveal', '');

    const achievedHTML = goal.achievedLabel
      ? `<p class="goal-card__achieved">Achieved · ${goal.achievedLabel}</p>`
      : '';

    const filledTicks = Math.round((goal.progress / 100) * TICK_COUNT);
    const ticksHTML = Array.from({ length: TICK_COUNT })
      .map((_, i) => `<span class="goal-card__tick${i < filledTicks ? ' is-filled' : ''}" style="--tick-index: ${i}"></span>`)
      .join('');

    card.innerHTML = `
      <span class="goal-card__icon" aria-hidden="true">${goal.icon}</span>
      <div class="goal-card__body">
        <div class="goal-card__heading">
          <p class="goal-card__title-en">${goal.titleEn}</p>
          <h3 class="goal-card__title-zh">${goal.titleZh}</h3>
        </div>
        <p class="goal-card__desc">${goal.desc}</p>
        <div class="goal-card__progress-row">
          <div class="goal-card__progress" role="progressbar" aria-valuenow="${goal.progress}" aria-valuemin="0" aria-valuemax="100" aria-label="${goal.titleZh} 進度">
            ${ticksHTML}
          </div>
          <span class="goal-card__progress-value">${goal.progress}%</span>
        </div>
        ${achievedHTML}
      </div>
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

function daysSince(startDateStr) {
  const start = new Date(`${startDateStr}T00:00:00`);
  const now = new Date();
  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((nowMidnight - startMidnight) / 86400000);
  return diffDays + 1; // 起始日當天算第 1 天，之後每天自動 +1，不用手動改
}

function renderStats() {
  const container = document.querySelector('[data-render="stats"]');
  if (!container) return;
  container.innerHTML = '';

  SITE_CONTENT.stats.forEach((stat, index) => {
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.setAttribute('data-reveal', '');
    card.style.setProperty('--stagger', index);

    let valueHTML;
    if (stat.type === 'text') {
      valueHTML = `<span class="stat-card__value stat-card__value--text">${stat.value}</span>`;
    } else if (stat.type === 'days') {
      const value = daysSince(stat.startDate);
      valueHTML = `<span class="stat-card__value stat__number" data-target="${value}">0</span>`;
    } else {
      valueHTML = `<span class="stat-card__value stat__number" data-target="${stat.value}">0</span>`;
    }

    card.innerHTML = `
      <div class="stat-card__top">
        ${valueHTML}
        ${stat.unit ? `<span class="stat-card__unit">${stat.unit}</span>` : ''}
      </div>
      <span class="stat-card__rule" aria-hidden="true"></span>
      <p class="stat-card__title-en">${stat.titleEn}</p>
      <p class="stat-card__title-zh">
        ${stat.titleZh}${stat.location ? `<span class="stat-card__location"> · ${stat.location}</span>` : ''}
      </p>
      <p class="stat-card__desc">${stat.desc}</p>
    `;

    container.appendChild(card);
  });
}

/* ---------------- 進入點：一次跑完所有渲染 ---------------- */

async function initRender() {
  // 這些區塊資料量少、不常變動，直接用 content.js 同步渲染
  renderAbout();
  renderBikes();
  renderStats();
  renderContact();

  // 這 5 個區塊改成非同步：優先讀 content/*.json（後台管理寫入的正式資料），
  // 抓不到（例如離線用 file:// 打開）才 fallback 回 content.js 的預設值。
  const [galleryData, panningData, journalData, videosData, goalsData] = await Promise.all([
    loadJSON('content/gallery.json'),
    loadJSON('content/panning.json'),
    loadJSON('content/journal.json'),
    loadJSON('content/videos.json'),
    loadJSON('content/goals.json'),
  ]);

  GALLERY_ITEMS = (galleryData && galleryData.items) || SITE_CONTENT.gallery;
  PANNING_ITEMS = (panningData && panningData.items) || SITE_CONTENT.panning;
  JOURNAL_ENTRIES = (journalData && journalData.entries) || SITE_CONTENT.journal;
  VIDEOS_ITEMS = (videosData && videosData.items) || SITE_CONTENT.videos;
  GOALS_ITEMS = (goalsData && goalsData.items) || SITE_CONTENT.goals;

  renderGallery();
  renderPanning();
  initJournalFilters();
  renderJournal(); // 初始渲染（year: 'all'）
  renderVideos();
  renderGoals();
}
