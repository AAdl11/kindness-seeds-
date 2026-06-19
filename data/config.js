/* =====================================================================
   設定檔（AIAO 母模）—— 雙軌・低門檻的所有門檻/里程碑/量表都寫在這。
   換內容、複用到別的社區，只要改這個檔。
   ===================================================================== */
window.CONFIG = {
  /* 每照顧好一家的回饋 */
  perHome: {
    minutes: 10,   // 善的時數 +10 分鐘
    coins: 3,      // 善的銅板 +3 枚（鏘地投進竹筒）
    growth: 1      // 米芽成長 +1（零門檻：照顧每一家就會長）
  },

  /* 米芽六階段（零門檻，純靠照顧家數累積；growth 門檻 → 階段 index） */
  sprout: {
    thresholds: [0, 1, 3, 6, 10, 16],   // 種子/發芽/小苗/開花/小樹/大樹
    stageKeys: ['seed', 'sprouting', 'seedling', 'flowering', 'youngTree', 'bigTree']
  },

  /* 竹筒：存滿可「倒進社區」（向外＝加速器，不是閘門） */
  bamboo: { capacity: 12 },

  /* 陽光・空氣・水（讓獵人角活起來的三條子量表，0..1） */
  meters: {
    sunPerMinuteFull: 150,   // 善的時數累積到 150 分 → 陽光滿（天色金光）
    waterPerPourFull: 3,     // 倒竹筒 3 次 → 水滿（天邊架彩虹）
    airBase: 0.45,           // 空氣底值（略帶霧）
    airFromEco: 0.55         // 完成「環保小尖兵」清掉霧霾 → 補滿空氣
  },

  /* 向外里程碑（真實善行；倒竹筒推進，進度條看得到）。bloom 落點 = 推進時那一區開花 */
  milestones: [
    { id: 'sudan', target: 5, region: 'community', bloom: { x: 0.70, y: 0.40 },
      name: { zh: '竹筒募愛 → 南蘇丹', en: 'Bamboo coins → South Sudan', es: 'Monedas de bambú → Sudán del Sur' } },
    { id: 'sisterSchool', target: 5, region: 'campus', bloom: { x: 0.50, y: 0.34 },
      name: { zh: '一人一信 → 花蓮姐妹校', en: 'One letter each → Hualien sister school', es: 'Una carta → escuela hermana de Hualien' } }
  ],

  /* 關2・環保小尖兵（分類整理；資料驅動，整關可換內容＝AIAO 母模） */
  level2: {
    id: 'eco',
    music: 'assets/audio/ending_warm.mp3',   // placeholder（祥和）；明暺日後換成 eco 專屬曲
    imgBefore: 'eco_street_before',           // 街景圖（基底檔名；.png/.jpg 皆自動偵測）
    imgAfter: 'eco_street_after',
    intro: {
      zh: '這是你的街角，灰濛濛的。點亮街上發光的點，把每樣東西送回它該去的家。',
      en: 'This corner is yours, and it is gray. Tap the glowing spots and send each thing home.',
      es: 'Esta esquina es tuya, y está gris. Toca los puntos brillantes y devuelve cada cosa a su lugar.'
    },
    revealLine: {
      zh: '這一角，因你亮起來了。',
      en: 'This corner — bright again, because of you.',
      es: 'Esta esquina — brilla otra vez, gracias a ti.'
    },
    retry: {
      zh: '這樣好像不太對，沒關係，再看看它是什麼，換一個桶試試。',
      en: "That doesn't seem right — no worries. Look again at what it is, and try another bin.",
      es: 'Eso no parece correcto — tranquilo. Mira otra vez qué es e intenta otro cubo.'
    },
    closing: {
      zh: '整條街都亮起來了——這是你一處一處，親手還給它的光。',
      en: 'The whole street is bright now — light you gave back to it, one corner at a time.',
      es: 'Toda la calle brilla ahora — luz que le devolviste, una esquina a la vez.'
    },
    bins: [
      { id: 'paper',   icon: '🗞️', img: 'bin_paper',   name: { zh: '紙類',   en: 'Paper',   es: 'Papel' } },
      { id: 'plastic', icon: '🧴', img: 'bin_plastic', name: { zh: '塑膠',   en: 'Plastic', es: 'Plástico' } },
      { id: 'glass',   icon: '🫙', img: 'bin_glass',   name: { zh: '玻璃',   en: 'Glass',   es: 'Vidrio' } },
      { id: 'metal',   icon: '🥫', img: 'bin_metal',   name: { zh: '鋁罐',   en: 'Metal',   es: 'Metal' } },
      { id: 'compost', icon: '🍂', img: 'bin_compost', name: { zh: '廚餘堆肥', en: 'Compost', es: 'Compost' } }
    ],
    items: [
      { id: 'newspaper', icon: '📰', bin: 'paper',   name: { zh: '報紙',   en: 'Newspaper',     es: 'Periódico' } },
      { id: 'bottle',    icon: '🥤', bin: 'plastic', name: { zh: '寶特瓶', en: 'Plastic bottle', es: 'Botella' } },
      { id: 'jar',       icon: '🍯', bin: 'glass',   name: { zh: '玻璃罐', en: 'Glass jar',      es: 'Frasco' } },
      { id: 'can',       icon: '🥫', bin: 'metal',   name: { zh: '鋁罐',   en: 'Can',           es: 'Lata' } },
      { id: 'peel',      icon: '🍌', bin: 'compost', name: { zh: '果皮',   en: 'Fruit peel',    es: 'Cáscara' } }
    ]
  }
};
