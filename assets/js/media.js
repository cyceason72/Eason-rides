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
      el.onload = () => wrapper.classList.add('media--loaded');
      el.onerror = () => wrapper.classList.add('media--error');
    }
    wrapper.appendChild(el);
    el.src = src;
  }

  return wrapper;
}
