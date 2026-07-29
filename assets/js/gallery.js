/**
 * gallery.js
 * 職責：通用的全螢幕媒體檢視器（Lightbox）—— 左右切換、ESC 關閉、
 *       鍵盤方向鍵、手機滑動切換。
 *       同時供 04 Gallery（純照片）與 05 Ride Journal（相簿：照片＋影片混合）使用。
 */

let lightboxItems = [];      // [{ type: 'image'|'video', src, alt }]
let lightboxIndex = 0;
let lightboxCaption = '';
let lightboxEl = null;

function ensureLightbox() {
  if (lightboxEl) return lightboxEl;

  lightboxEl = document.createElement('div');
  lightboxEl.className = 'lightbox';
  lightboxEl.setAttribute('role', 'dialog');
  lightboxEl.setAttribute('aria-modal', 'true');
  lightboxEl.setAttribute('aria-label', '媒體檢視器');
  lightboxEl.innerHTML = `
    <button class="lightbox__close" type="button" aria-label="關閉">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    </button>
    <button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="上一項">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <div class="lightbox__stage"></div>
    <button class="lightbox__nav lightbox__nav--next" type="button" aria-label="下一項">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <p class="lightbox__caption"></p>
    <p class="lightbox__counter"></p>
    <div class="lightbox__thumbs"></div>
  `;
  document.body.appendChild(lightboxEl);

  lightboxEl.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
  lightboxEl.querySelector('.lightbox__nav--prev').addEventListener('click', () => stepLightbox(-1));
  lightboxEl.querySelector('.lightbox__nav--next').addEventListener('click', () => stepLightbox(1));

  lightboxEl.addEventListener('click', (event) => {
    if (event.target === lightboxEl) closeLightbox();
  });

  let touchStartX = 0;
  lightboxEl.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  lightboxEl.addEventListener('touchend', (e) => {
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 40) stepLightbox(delta > 0 ? -1 : 1);
  }, { passive: true });

  return lightboxEl;
}

function renderLightboxStage() {
  const item = lightboxItems[lightboxIndex];
  const stage = lightboxEl.querySelector('.lightbox__stage');
  const caption = lightboxEl.querySelector('.lightbox__caption');
  const counter = lightboxEl.querySelector('.lightbox__counter');
  const prevBtn = lightboxEl.querySelector('.lightbox__nav--prev');
  const nextBtn = lightboxEl.querySelector('.lightbox__nav--next');

  stage.innerHTML = '';
  stage.classList.add('is-loading');
  const media = createMediaElement({
    src: item.src,
    alt: item.alt,
    label: item.type === 'video' ? '待補影片' : '待補照片',
    className: 'lightbox__image',
    type: item.type || 'image',
    controls: true,
  });
  stage.appendChild(media);
  stage.appendChild(buildLikeButton(item.src, 'like-btn--stage'));
  const mediaEl = media.querySelector('.lightbox__image');
  const stopLoading = () => stage.classList.remove('is-loading');
  if (mediaEl) {
    const readyEvent = item.type === 'video' ? 'loadeddata' : 'load';
    mediaEl.addEventListener(readyEvent, stopLoading, { once: true });
    mediaEl.addEventListener('error', stopLoading, { once: true });
  } else {
    stopLoading();
  }
  caption.textContent = lightboxCaption || '';

  const multiple = lightboxItems.length > 1;
  prevBtn.style.display = multiple ? '' : 'none';
  nextBtn.style.display = multiple ? '' : 'none';
  counter.textContent = multiple ? `${lightboxIndex + 1} / ${lightboxItems.length}` : '';

  renderLightboxThumbs();
}

/**
 * 縮圖列——多張照片／影片的相簿（目前是 Ride Journal 在用），
 * 想看哪一張就直接點，不用一張一張滑過去。
 */
function renderLightboxThumbs() {
  const thumbs = lightboxEl.querySelector('.lightbox__thumbs');
  if (!thumbs) return;
  thumbs.innerHTML = '';

  if (lightboxItems.length <= 1) {
    thumbs.classList.remove('is-visible');
    return;
  }
  thumbs.classList.add('is-visible');

  lightboxItems.forEach((item, index) => {
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'lightbox__thumb';
    thumb.classList.toggle('is-active', index === lightboxIndex);
    thumb.setAttribute('aria-label', `第 ${index + 1} 項`);
    if (item.type === 'video') thumb.classList.add('lightbox__thumb--video');

    const img = document.createElement('img');
    img.src = item.type === 'video' ? (item.thumbnail || '') : item.src;
    img.alt = '';
    img.loading = 'lazy';
    if (img.src) thumb.appendChild(img);

    thumb.addEventListener('click', () => {
      lightboxIndex = index;
      renderLightboxStage();
    });
    thumbs.appendChild(thumb);
  });

  const activeThumb = thumbs.querySelector('.lightbox__thumb.is-active');
  if (activeThumb && typeof activeThumb.scrollIntoView === 'function') {
    activeThumb.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
}

/**
 * @param {Array<{type:'image'|'video', src:string, alt?:string}>} items
 * @param {number} index 開啟時要顯示的項目索引
 * @param {string} [caption] 顯示在下方的說明文字
 */
function openLightbox(items, index, caption) {
  playAmbientSfx('sfx-shutter', { volume: 0.6 }); // 點擊照片：非常細微的相機快門聲（尚待補真實素材）
  lightboxItems = items;
  lightboxIndex = index || 0;
  lightboxCaption = caption || '';
  ensureLightbox();
  renderLightboxStage();
  lightboxEl.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  lightboxEl.querySelector('.lightbox__close').focus();
}

function closeLightbox() {
  if (!lightboxEl) return;
  lightboxEl.classList.remove('is-open');
  document.body.style.overflow = '';
  // 關閉時清空舞台，避免影片在背景繼續播放出聲音
  const stage = lightboxEl.querySelector('.lightbox__stage');
  if (stage) stage.innerHTML = '';
}

function stepLightbox(direction) {
  const total = lightboxItems.length;
  if (total <= 1) return;
  lightboxIndex = (lightboxIndex + direction + total) % total;
  renderLightboxStage();
}

function initLightboxKeyboard() {
  document.addEventListener('keydown', (event) => {
    if (!lightboxEl || !lightboxEl.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') stepLightbox(-1);
    if (event.key === 'ArrowRight') stepLightbox(1);
  });
}
