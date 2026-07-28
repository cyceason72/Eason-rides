/**
 * content.js
 * ============================================================
 * 這是全站唯一需要手動編輯的檔案。
 * 你只要換照片、影片、文字、數字，通通在這裡改，
 * 改完存檔、重新整理頁面就會生效，不需要碰 HTML / CSS。
 *
 * 圖片／影片放法：
 *   1. 把檔案丟進 assets/images/ 或 assets/videos/
 *   2. 把下面對應欄位的路徑改成你的檔名
 *   3. 如果路徑寫錯或檔案還沒放，畫面會自動顯示灰底佔位圖，
 *      不會壞掉、不會出現破圖圖示，可以放心慢慢補素材。
 * ============================================================
 */

const SITE_CONTENT = {

  /* ---------------- 02 About ----------------
     photo 留空字串 '' 或路徑錯誤時，會自動顯示灰底佔位樣式。 */
  about: {
    photo: 'assets/images/about.JPG',
    name: 'Eason',
    location: 'Taiwan',
    intro:
      '騎車對我來說不是交通方式，是一種重新校準自己的方式。這個網站記錄我和 Aprilia RS660 一起經歷的每一段路——短的通勤、長的環島、還有那些臨時起意的深夜山道。',
    philosophy: '安全是底線，但享受過程比抵達更重要。',
    motto: 'Ride slow, feel more.',
  },

  /* ---------------- 03 Featured Bike ----------------
     要新增第二台車，直接在陣列裡再加一個物件即可，
     頁面會自動生成多張車輛卡片。 */
  bikes: [
    {
      name: 'Aprilia RS660',
      image: 'assets/images/bike.JPG',
      alt: 'Aprilia RS660 側面照',
      specs: [
        { label: 'Model', value: 'Aprilia RS660' },
        { label: 'Engine', value: '659cc 並列雙缸' },
        { label: 'Power', value: '100 hp @ 10,500 rpm' },
        { label: 'Weight', value: '183 kg（乾重）' },
        { label: 'Riding Style', value: 'Sport Touring' },
      ],
    },
  ],

  /* ---------------- 04 Gallery ----------------
     caption 可留空字串 ''，不會顯示文字。
     想加多少張照片就加多少筆，Masonry 版面會自動排列。
     ⚠️ 部署後台之後，這裡的內容只是「離線預覽用的預設值」，
     實際顯示內容會優先讀取 content/gallery.json（由後台管理）。 */
  gallery: [
    { image: 'assets/images/gallery-01.jpg', alt: '', caption: '' },
    { image: 'assets/images/gallery-02.jpg', alt: '', caption: '' },
    { image: 'assets/images/gallery-03.jpg', alt: '', caption: '' },
    { image: 'assets/images/gallery-04.jpg', alt: '', caption: '' },
    { image: 'assets/images/gallery-05.jpg', alt: '', caption: '' },
    { image: 'assets/images/gallery-06.jpg', alt: '', caption: '' },
  ],

  /* ---------------- 追焦紀錄 Panning ----------------
     山路騎乘追焦照專區，用法跟 gallery 完全一樣。
     ⚠️ 同樣以 content/panning.json 為主，這裡只是離線預覽的預設值。 */
  panning: [
    { image: 'assets/images/panning-01.jpg', alt: '', caption: '' },
  ],

  /* ---------------- 05 Ride Journal ----------------
     每一篇旅程現在可以放「多張照片 + 影片」，做成相簿模式：
       media: [
         { type: 'image', src: 'assets/images/xxx.jpg' },
         { type: 'video', src: 'assets/videos/xxx.mp4' },
       ]
     - type 只能是 'image' 或 'video'
     - 想放幾個都可以，卡片會顯示第一筆當封面，
       右上角自動出現「共 N 個」的小標籤
     - 點卡片會打開相簿檢視器，可以左右切換、影片可直接播放
     - year 用來給年份篩選按鈕分類，記得跟 date 的年份對齊
     ⚠️ 部署後台之後，這裡只是離線預覽用的預設值，實際內容以 content/journal.json 為主。 */
  journal: [
    {
      media: [
        { type: 'image', src: 'assets/images/journal-01.jpg' },
      ],
      date: '2026-03-14',
      year: 2026,
      location: '陽金公路',
      km: 128,
      note: '第一次騎上陽金，天氣很好，山上風有點大，但視野極好。',
      tags: ['山道', '一日遊'],
    },
    {
      media: [
        { type: 'image', src: 'assets/images/journal-02.jpg' },
      ],
      date: '2026-01-05',
      year: 2026,
      location: '台三線',
      km: 210,
      note: '沿著台三線一路往南，中途在一間老街咖啡廳休息。',
      tags: ['公路', '長途'],
    },
  ],

  /* ---------------- 06 Videos ----------------
     platform 目前支援 'YouTube' 與 'Reels' 兩種標籤顯示，
     url 直接放完整連結，點卡片會開新分頁。
     ⚠️ 部署後台之後，這裡只是離線預覽用的預設值，實際內容以 content/videos.json 為主。 */
  videos: [
    {
      thumbnail: 'assets/images/video-01.jpg',
      title: '陽金公路一日騎',
      date: '2026-03-14',
      duration: '08:24',
      platform: 'YouTube',
      url: '#',
    },
    {
      thumbnail: 'assets/images/video-02.jpg',
      title: '台三線長途紀錄',
      date: '2026-01-05',
      duration: '00:42',
      platform: 'Reels',
      url: '#',
    },
  ],

  /* ---------------- 07 Statistics ----------------
     數字進入畫面時會從 0 動畫跑到這裡設定的值。 */
  stats: [
    { label: 'Total KM', value: 4820, suffix: '' },
    { label: 'Trips', value: 32, suffix: '' },
    { label: 'Countries', value: 2, suffix: '' },
    { label: 'Photos', value: 186, suffix: '' },
    { label: 'Videos', value: 14, suffix: '' },
  ],

  /* ---------------- 08 Future Goals ----------------
     icon 可放 emoji，也可以直接留一個字母當佔位。
     progress 是 0~100 的完成度。 */
  goals: [
    { icon: '🗾', title: 'Japan Riding', description: '騎上日本的山道與海岸公路。', progress: 15 },
    { icon: '🏁', title: 'Track Day', description: '第一次下賽道，練基本 Line。', progress: 30 },
    { icon: '🏍️', title: 'New Bike', description: '物色下一台長途旅行取向的車。', progress: 5 },
    { icon: '🧭', title: 'Touring', description: '完成一趟三天以上的環島或長途旅行。', progress: 45 },
  ],

  /* ---------------- 09 Contact ----------------
     沒有的欄位可以把值留空字串 ''，該按鈕會自動隱藏。 */
  contact: {
    instagram: '',
    youtube: '',
    facebook: '',
    email: '',
    github: '',
  },
};
