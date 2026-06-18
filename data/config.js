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
  ]
};
