/**
 * media.js
 * 職責：建立圖片或影片節點，並在來源不存在／載入失敗時，
 *       自動 fallback 成低調的灰底佔位樣式，而不是顯示破圖圖示。
 *       所有資料驅動區塊（Bike / Gallery / Journal / Videos）共用這支函式。
 */

/**
 * @param {Object} options
 * @param {string} options.src      圖片或影片路徑
 * @param {string} options.alt      alt 文字
 * @param {string} options.label    佔位狀態要顯示的說明文字
 * @param {string} [options.className] 額外要加在媒體元素上的 class
 * @param {'image'|'video'} [options.type] 媒體類型，預設 'image'
 * @param {boolean} [options.controls] 影片是否顯示控制列，預設 true（縮圖情境可傳 false）
 * @returns {HTMLElement} wrapper 節點（包含 img/video + 佔位層）
 */
function createMediaElement({ src, alt, label, className = '', type = 'image', controls = true }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'media';

  const placeholder = document.createElement('div');
  placeholder.className = 'media-placeholder';
  placeholder.setAttribute('role', 'img');
  placeholder.setAttribute('aria-label', label || alt || '尚未提供圖片');
  placeholder.innerHTML = `
    <svg class="media-placeholder__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.3" />
      <circle cx="12" cy="13" r="4" stroke="currentColor" stroke-width="1.3" />
      <path d="M8 6l1.5-2h5L16 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <span class="media-placeholder__label">${label || '待補圖片'}</span>
  `;

  wrapper.appendChild(placeholder);

  if (src) {
    // 重要：元素要先插入 DOM，再設定 src。
    // 如果用 detached 的元素（沒接上 DOM）又設定 loading="lazy"，
    // 瀏覽器沒辦法判斷它是否進入可視範圍，會導致永遠不觸發載入。
    let el;
    if (type === 'video') {
      el = document.createElement('video');
      el.className = `media__img ${className}`.trim();
      el.controls = controls;
      el.muted = !controls; // 縮圖模式（無控制列）靜音，避免自動出聲
      el.playsInline = true;
      el.preload = 'metadata';
      el.onloadeddata = () => wrapper.classList.add('media--loaded');
      el.onerror = () => wrapper.classList.add('media--error');
    } else {
      el = document.createElement('img');
      el.className = `media__img ${className}`.trim();
      el.alt = alt || '';
      el.decoding = 'async';
      el.loading = 'lazy';
      el.onload = () => wrapper.classList.add('media--loaded');
      el.onerror = () => wrapper.classList.add('media--error');
    }
    wrapper.appendChild(el);
    el.src = src;
  }

  return wrapper;
}

/* ============================================================
 * 按讚系統（Like）
 * ------------------------------------------------------------
 * 這是純前端功能：這個網站是靜態網站（沒有後端資料庫），
 * 所以「按過」這件事只會記在按讚那個人自己的瀏覽器裡（localStorage），
 * 不是真的跨裝置、跨訪客加總的全站數字。
 * 畫面上的基礎數字是用照片／影片網址算出來的固定值（同一張照片每次都一樣，
 * 落在 1 萬 ~ 9.9 萬之間），讓畫面看起來有人氣；自己按下去會 +1（一次性，
 * 按過就不能再取消或重複按），下次自己回來看還是會記得「我按過」。
 * ============================================================ */

const LIKES_STORAGE_KEY = 'eason-rides-likes-v1';

function getLikesStore() {
  try {
    return JSON.parse(localStorage.getItem(LIKES_STORAGE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function setLikesStore(store) {
  try {
    localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    /* 忽略，不影響其他功能 */
  }
}

function isLikedByMe(key) {
  return !!getLikesStore()[key];
}

/**
 * likeItem — 一次性按讚。已經按過的話回傳 false（不會重複 +1、也不能取消）。
 */
function likeItem(key) {
  const store = getLikesStore();
  if (store[key]) return false;
  store[key] = true;
  setLikesStore(store);
  return true;
}

function baseLikeCount(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return 10000 + (hash % 89000); // 每張固定落在 1 萬 ~ 9.9 萬之間，不會每次重整就跳來跳去
}

function likeCountFor(key) {
  return baseLikeCount(key) + (isLikedByMe(key) ? 1 : 0);
}

function formatLikeCount(n) {
  if (n >= 10000) {
    const wan = (n / 10000).toFixed(1).replace(/\.0$/, '');
    return `${wan}萬`;
  }
  return String(n);
}

/**
 * buildLikeButton
 * 產生一顆可以獨立掛在任何照片／影片卡片上的按讚按鈕（含數字）。
 * @param {string} key 要能唯一代表這張照片／這支影片，直接用它的 src 網址就好
 * @param {string} [extraClass] 額外 class，方便針對不同情境（卡片上 / 全螢幕舞台上）分別定位
 */
function buildLikeButton(key, extraClass = '') {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `like-btn ${extraClass}`.trim();
  btn.innerHTML = `
    <svg class="like-btn__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-9.8-9.2C.6 7.8 2.2 4.5 5.6 4c2-.3 3.9.7 5 2.3C11.7 4.7 13.6 3.7 15.6 4c3.4.5 5 3.8 3.4 7.3-2.3 4.6-9.8 9.2-9.8 9.2z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
    </svg>
    <span class="like-btn__count"></span>
  `;

  const syncUI = () => {
    const liked = isLikedByMe(key);
    btn.classList.toggle('is-liked', liked);
    btn.disabled = liked; // 按過就鎖住，不能再按第二次
    btn.setAttribute('aria-pressed', String(liked));
    btn.setAttribute('aria-label', liked ? '已經按過讚' : '按讚');
    btn.querySelector('.like-btn__count').textContent = formatLikeCount(likeCountFor(key));
  };
  syncUI();

  btn.addEventListener('click', (event) => {
    event.stopPropagation(); // 不要連帶觸發卡片本身「開啟」的行為
    event.preventDefault();
    const didLike = likeItem(key);
    if (!didLike) return; // 已經按過了，不做任何事
    syncUI();
    btn.classList.add('like-btn--pulse');
    window.setTimeout(() => btn.classList.remove('like-btn--pulse'), 260);
    if (typeof playAmbientSfx === 'function') playAmbientSfx('sfx-tap', { volume: 0.4 });
  });

  return btn;
}

/**
 * createNaturalMediaElement — 保留照片「原始比例」的版本。
 * 用於 Gallery / 追焦紀錄 這種攝影集式排版：每張照片維持攝影師原本的構圖比例
 * （橫的維持橫的、直的維持直的），不強制裁切成統一形狀。
 *
 * 跟 createMediaElement 的差異：
 *   - createMediaElement：img 用 position:absolute 撐滿容器（cover），容器比例要先固定好
 *   - createNaturalMediaElement：img 用一般文件流排版（width:100%; height:auto），
 *     容器的高度直接由圖片的原始比例決定，適合 CSS columns 做的 Masonry 排版
 *
 * @param {Object} options
 * @param {string} options.src
 * @param {string} options.alt
 * @param {string} options.label
 * @returns {HTMLElement}
 */
function createNaturalMediaElement({ src, alt, label }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'media-natural';

  const placeholder = document.createElement('div');
  placeholder.className = 'media-placeholder media-placeholder--natural';
  placeholder.setAttribute('role', 'img');
  placeholder.setAttribute('aria-label', label || alt || '尚未提供圖片');
  placeholder.innerHTML = `
    <svg class="media-placeholder__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.3" />
      <circle cx="12" cy="13" r="4" stroke="currentColor" stroke-width="1.3" />
      <path d="M8 6l1.5-2h5L16 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <span class="media-placeholder__label">${label || '待補圖片'}</span>
  `;
  wrapper.appendChild(placeholder);

  if (src) {
    const img = document.createElement('img');
    img.className = 'media-natural__img';
    img.alt = alt || '';
    img.decoding = 'async';
    img.loading = 'lazy';
    img.onload = () => wrapper.classList.add('media--loaded');
    img.onerror = () => wrapper.classList.add('media--error');
    wrapper.appendChild(img);
    img.src = src;
  }

  return wrapper;
}
