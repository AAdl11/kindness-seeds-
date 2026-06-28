/* =====================================================================
   設定檔（AIAO 母模）—— 雙軌・低門檻的所有門檻/里程碑/量表都寫在這。
   換內容、複用到別的社區，只要改這個檔。
   ===================================================================== */
window.CONFIG = {
  /* 各關開頭「怎麼玩＋會得到什麼」小字（三語，簡短，不說教） */
  level1: {
    how: {
      zh: '讀懂每一家的線索，配出他們需要的關懷包。每照顧一家 → 米芽長大、善的時數＋、銅板進竹筒。',
      en: 'Read each family’s clues and build the care package they need. Each home → your sprout grows, kindness time +, a coin into the bamboo.',
      es: 'Lee las pistas de cada familia y arma el paquete que necesitan. Cada hogar → tu brote crece, tiempo de bondad +, una moneda al bambú.'
    }
  },

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

  /* 向外里程碑（真實善行；進度條看得到）。source 決定怎麼推進，兩條分開：
     sudan ← 只由「倒竹筒」推進；sisterSchool ← 只由「關3 送感恩信」推進。 */
  milestones: [
    { id: 'sudan', target: 5, source: 'pour', region: 'community', bloom: { x: 0.70, y: 0.40 },
      name: { zh: '竹筒募愛 → 南蘇丹', en: 'Bamboo coins → South Sudan', es: 'Monedas de bambú → Sudán del Sur' },
      desc: { zh: '竹筒存滿倒進社區，化作送往南蘇丹的愛心。', en: 'Pour a full bamboo tube into the community to send love to South Sudan.', es: 'Vierte el bambú lleno para enviar amor a Sudán del Sur.' } },
    { id: 'sisterSchool', target: 6, source: 'letters', region: 'campus', bloom: { x: 0.50, y: 0.34 },
      name: { zh: '一人一信 → 花蓮姐妹校', en: 'One letter each → Hualien sister school', es: 'Una carta → escuela hermana de Hualien' },
      desc: { zh: '在「畢業感恩」每送出一封感恩，就為花蓮姐妹校的孩子送上一份心意。', en: 'Each gratitude letter in "Graduation" sends kindness to the Hualien sister school.', es: 'Cada carta de gratitud en "Graduación" envía cariño a la escuela hermana de Hualien.' } }
  ],

  /* 關3・幸福校園 畢業感恩（感恩傳遞；資料驅動）。
     學校＝幸福校園 @ Bret Harte，與花蓮慈小締結姊妹校（非「人文學校」）。 */
  level3: {
    id: 'graduation',
    music: 'assets/audio/level3_grad.mp3',   // placeholder（祥和）；明暺日後換成畢業專屬曲
    img: 'school_grad',                       // 3D 校園背景（基底檔名；.png/.jpg/.webp 自動偵測）
    milestone: 'sisterSchool',
    how: {
      zh: '送「謝謝」給家庭／老師／社區，再把信跨海送給花蓮姐妹校。每送一封信 → 一人一信里程碑 ＋1。',
      en: 'Send "thank you" to family / teachers / community, then fling letters across the sea to the Hualien sister school. Each letter → "one letter each" +1.',
      es: 'Envía "gracias" a familia / maestros / comunidad, y lanza cartas sobre el mar a la escuela hermana de Hualien. Cada carta → "una carta" +1.'
    },
    act1: { title: { zh: '第一幕 · 感恩三福', en: 'Act 1 · Gratitude', es: 'Acto 1 · Gratitud' } },
    act2: {
      title: { zh: '第二幕 · 一人一信 → 花蓮', en: 'Act 2 · A letter to Hualien', es: 'Acto 2 · Una carta a Hualien' },
      count: 4, hualien: { x: 0.5, y: 0.36 },
      prompt: {
        zh: '把每封信甩（或慢慢拖）向海平線那端的花蓮，給姊妹校的筆友。',
        en: 'Fling (or gently drag) each letter across the sea to your pen pal in Hualien.',
        es: 'Lanza (o arrastra suave) cada carta sobre el mar hasta tu amigo en Hualien.'
      },
      arriveLine: { zh: '花蓮的筆友收到了！', en: 'Your pen pal in Hualien got it!', es: '¡Tu amigo en Hualien la recibió!' },
      hualienName: { zh: '花蓮', en: 'Hualien', es: 'Hualien' }
    },
    act3: {
      title: { zh: '第三幕 · 畢業慶典', en: 'Act 3 · Graduation', es: 'Acto 3 · Graduación' },
      capsLine: { zh: '學士帽，拋向天空！', en: 'Caps, into the sky!', es: '¡Birretes, al cielo!' }
    },
    intro: {
      zh: 'Bret Harte 幸福校園的孩子要畢業了。幫他們把「謝謝」送到對的人——家庭、老師、社區。',
      en: 'The kids of Bret Harte are graduating. Help them send each "thank you" to the right people — family, teachers, community.',
      es: 'Los niños de Bret Harte se gradúan. Ayúdalos a enviar cada "gracias" a quien corresponde — familia, maestros, comunidad.'
    },
    note: {
      zh: '每送出一封感恩，也為花蓮姐妹校的孩子送上一份心意。',
      en: 'Each gratitude you send also reaches a child at the Hualien sister school.',
      es: 'Cada gratitud que envías también llega a un niño de la escuela hermana de Hualien.'
    },
    revealLine: { zh: '這份謝謝，收到了。', en: 'This thank-you found its way.', es: 'Este gracias llegó a su destino.' },
    retry: {
      zh: '這份謝謝好像不是給這裡的，再讀一次，送給對的人。',
      en: "This thank-you seems meant for someone else — read it again and send it to the right one.",
      es: 'Este gracias parece ser para otra persona — léelo otra vez y envíalo a quien corresponde.'
    },
    closing: {
      zh: '孩子們戴上方帽，每一句謝謝都送到了——這一屆，帶著整座社區的祝福長大。',
      en: 'Caps in the air, every thank-you delivered — this class grows up carrying a whole community’s blessing.',
      es: 'Birretes al aire, cada gracias entregado — esta generación crece con la bendición de toda la comunidad.'
    },
    targets: [
      { id: 'family',    icon: '🏠', img: 'icon_family',    name: { zh: '家庭', en: 'Family',    es: 'Familia' } },
      { id: 'teacher',   icon: '🏫', img: 'icon_teacher',   name: { zh: '老師', en: 'Teachers',  es: 'Maestros' } },
      { id: 'community', icon: '🏘️', img: 'icon_community', name: { zh: '社區', en: 'Community', es: 'Comunidad' } }
    ],
    cards: [
      { target: 'family',    text: { zh: '謝謝您每天為我準備晚餐', en: 'Thank you for dinner every night', es: 'Gracias por la cena cada noche' } },
      { target: 'family',    text: { zh: '謝謝您一直在我身邊', en: 'Thank you for always being there', es: 'Gracias por estar siempre conmigo' } },
      { target: 'teacher',   text: { zh: '謝謝您教我讀書寫字', en: 'Thank you for teaching me to read and write', es: 'Gracias por enseñarme a leer y escribir' } },
      { target: 'teacher',   text: { zh: '謝謝您相信我做得到', en: 'Thank you for believing in me', es: 'Gracias por creer en mí' } },
      { target: 'community', text: { zh: '謝謝這條街一直照顧我們', en: 'Thank you, neighborhood, for looking after us', es: 'Gracias, vecindario, por cuidarnos' } },
      { target: 'community', text: { zh: '謝謝鄰居們溫暖的笑容', en: 'Thank you, neighbors, for your warm smiles', es: 'Gracias, vecinos, por sus cálidas sonrisas' } }
    ]
  },

  /* 關4・道德兩難「最後兩份」（呈現 meta；豐富分支內容讀自 data/the_last_two.json）。
     只放圖片基底檔名／音樂／開場小字——pipeline 不會覆寫這裡；narrative 由人審 gate 寫進 JSON。 */
  level4: {
    id: 'the_last_two',
    type: 'moral_dilemma',
    data: 'data/the_last_two.json',           // runtime 讀這份（pipeline 人審後的產出）；fetch 失敗時用內建 fallback
    music: 'assets/audio/ending_warm.mp3',    // placeholder（祥和）；日後可換
    img: 'last2_scene',                        // 互助站室內背景（基底檔名；副檔名自動偵測）
    street: 'last2_street',                    // 街角背景（備用）
    // 角色立繪基底檔名（離線：assets/images/ 自動找副檔名）。pipeline 的 JSON 不帶圖，圖一律住在這。
    cast: {
      volunteer: 'last2_volunteer',
      mother:    'last2_mother',
      elder:     'last2_elder',
      packages:  'last2_packages',
      neighbor:  'last2_neighbor'
    },
    how: {
      zh: '互助站只剩最後兩份。沒有標準答案——讀懂每個人的處境，做出你的選擇，再看看會發生什麼。',
      en: 'Only the last two packs are left at the station. There is no right answer — read each person’s situation, make your choice, and see what unfolds.',
      es: 'Solo quedan los últimos dos paquetes. No hay respuesta correcta — entiende la situación de cada quien, decide y observa lo que pasa.'
    }
  },

  /* 關2・環保小尖兵（分類整理；資料驅動，整關可換內容＝AIAO 母模） */
  level2: {
    id: 'eco',
    music: 'assets/audio/level2_eco.mp3',   // placeholder（祥和）；明暺日後換成 eco 專屬曲
    how: {
      zh: '把回收物送回對的桶，灰街一處處亮起來。每分對 → 米芽長大、銅板進竹筒；竹筒滿了可倒進社區（→ 南蘇丹）。',
      en: 'Sort each item into the right bin; the gray street lights up piece by piece. Each match → your sprout grows, a coin into the bamboo; a full bamboo can be poured into the community (→ South Sudan).',
      es: 'Clasifica cada objeto en el cubo correcto; la calle gris se ilumina poco a poco. Cada acierto → tu brote crece, una moneda al bambú; un bambú lleno se vierte en la comunidad (→ Sudán del Sur).'
    },
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
      { id: 'jar',       icon: '🫙', bin: 'glass',   name: { zh: '玻璃罐', en: 'Glass jar',      es: 'Frasco' } },
      { id: 'can',       icon: '🥫', bin: 'metal',   name: { zh: '鋁罐',   en: 'Can',           es: 'Lata' } },
      { id: 'peel',      icon: '🍌', bin: 'compost', name: { zh: '果皮',   en: 'Fruit peel',    es: 'Cáscara' } }
    ],
    // 街越乾淨、社區越多人走出來幫忙（純氛圍，不是分數、不排名）。
    // 綁在現有療癒進度上：每療癒一區 → 對應 band 的小尖兵走出來；5/5 全亮 → 8 隻都在。
    dolls: {
      rangers: ['ranger_pickup', 'ranger_stand', 'ranger_wave', 'ranger_thumbsup_girl',
                'ranger_thumbsup_deep', 'ranger_bagopen_deep', 'ranger_bagopen_brown', 'ranger_plant_asia'],
      supervisors: ['supervisor_vest', 'supervisor_bun'],   // 只站著帶，不撿、不拿袋
      // 沿街兩側 + 下緣，避開中央配對舞台（x 約 33–67% 留空）；y 在桶子上方
      slots: [
        { x: 6,  y: 76, band: 0 }, { x: 94, y: 76, band: 0 },
        { x: 13, y: 70, band: 1 },
        { x: 87, y: 70, band: 2 }, { x: 20, y: 82, band: 2 },
        { x: 80, y: 82, band: 3 },
        { x: 27, y: 66, band: 4 }, { x: 73, y: 66, band: 4 }
      ],
      supSlots: [ { x: 26, y: 82 }, { x: 74, y: 80 } ]
    }
  }
};
