/* =====================================================================
   第一關 · 關懷之夜 / Care at Dusk — 資料驅動內容 (data-driven content)
   ---------------------------------------------------------------------
   新增需求 / 線索 / 物資，只要改這個檔，不用動引擎。
   To add a need / clue / supply, edit ONLY this file — no engine changes.
   每筆字串三語 EN / ZH / ES。
   ===================================================================== */

window.LEVEL1 = {
  id: 'rv_park_dusk',
  stars: 4,

  /* 情境 / framing —— 讀家不畫人：畫面永遠不出現受助的人 */
  framing: {
    zh: '黃昏的 RV Park，車一台台開進來避海風，想在這裡安身歇息。你只有夕陽這段時間，趕在天黑前讓每一家拿到安身的民生物資。',
    en: 'Dusk at the RV Park. One by one, trailers roll in to shelter from the sea wind, hoping to settle and rest. You only have this sliver of sunset — reach every family with what they need before dark.',
    es: 'Atardecer en el RV Park. Uno a uno, los remolques llegan para resguardarse del viento del mar y buscar descanso. Solo tienes este rato de sol — llega a cada familia con lo que necesita antes de que anochezca.'
  },

  /* 需求池 / NEED POOL —— 每台車隨機抽 1–3 種。
     clues: 落在那台車上、會發亮的線索；讀懂線索才推得出需要。
     supply: 滿足這個需要要配進關懷包的物資 id。 */
  needs: {
    child: {
      icon: '🖍️',
      label: { zh: '家裡有小孩', en: 'A child lives here', es: 'Vive un niño aquí' },
      supply: 'kids_care',
      clues: [
        { icon: '🖍️', read: { zh: '車窗上貼著蠟筆畫', en: 'Crayon drawings on the window', es: 'Dibujos de crayón en la ventana' } },
        { icon: '👕', read: { zh: '晾著一件小小的衣服', en: 'A tiny shirt hung out to dry', es: 'Una camisita colgada a secar' } }
      ]
    },
    baby: {
      icon: '🍼',
      label: { zh: '家裡有嬰兒', en: 'A baby lives here', es: 'Vive un bebé aquí' },
      supply: 'baby_care',
      clues: [
        { icon: '🍼', read: { zh: '門邊放著奶瓶', en: 'A bottle by the door', es: 'Un biberón junto a la puerta' } },
        { icon: '👶', read: { zh: '車旁折著一台嬰兒車', en: 'A folded stroller beside the trailer', es: 'Un cochecito plegado junto al remolque' } }
      ]
    },
    elder: {
      icon: '🦽',
      label: { zh: '有行動不便的長輩', en: 'An elder with limited mobility', es: 'Un mayor con movilidad reducida' },
      supply: 'mobility_care',
      clues: [
        { icon: '🦽', read: { zh: '門口停著一台輪椅', en: 'A wheelchair parked at the step', es: 'Una silla de ruedas en el escalón' } },
        { icon: '🦯', read: { zh: '扶手邊靠著一支拐杖', en: 'A cane leaning by the rail', es: 'Un bastón apoyado en el pasamanos' } }
      ]
    },
    cold: {
      icon: '🧣',
      label: { zh: '夜裡很怕冷', en: 'The nights get cold here', es: 'Las noches son frías aquí' },
      supply: 'blanket',
      clues: [
        { icon: '🪟', read: { zh: '窗縫塞著舊毯子擋海風', en: 'Old cloth stuffed in the window gaps against the wind', es: 'Tela vieja en las rendijas contra el viento' } }
      ]
    },
    hygiene: {
      icon: '🧼',
      label: { zh: '盥洗用品見底了', en: 'Toiletries running low', es: 'Artículos de aseo casi agotados' },
      supply: 'toiletry',
      clues: [
        { icon: '🪥', read: { zh: '一個快空了的舊盥洗袋', en: 'An almost-empty wash bag', es: 'Una bolsa de aseo casi vacía' } }
      ]
    },
    pet: {
      icon: '🐕',
      label: { zh: '家裡養著寵物', en: 'A pet shares this home', es: 'Una mascota vive aquí' },
      supply: 'pet_care',
      clues: [
        { icon: '🦮', read: { zh: '車邊綁著一條牽繩', en: 'A leash tied beside the trailer', es: 'Una correa atada al remolque' } },
        { icon: '🥣', read: { zh: '地上擺著空的飼料碗', en: 'An empty food bowl on the ground', es: 'Un cuenco de comida vacío en el suelo' } }
      ]
    },
    student: {
      icon: '🎒',
      label: { zh: '有上學的孩子', en: 'A school-age child', es: 'Un niño en edad escolar' },
      supply: 'stationery',
      clues: [
        { icon: '🎒', read: { zh: '門邊掛著一個書包', en: 'A backpack hangs by the door', es: 'Una mochila cuelga junto a la puerta' } }
      ]
    },
    cooking: {
      icon: '🍚',
      label: { zh: '需要煮食與飲水', en: 'Needs to cook & store water', es: 'Necesita cocinar y agua' },
      supply: 'food_water',
      clues: [
        { icon: '🔥', read: { zh: '一個沒瓦斯的卡式爐', en: 'A camp stove with no fuel', es: 'Una hornilla sin gas' } },
        { icon: '🪣', read: { zh: '門外排著空水桶', en: 'Empty water buckets lined up outside', es: 'Cubos de agua vacíos afuera' } }
      ]
    },
    language: {
      icon: '🗂️',
      label: { zh: '習慣用其他語言', en: 'Speaks another language', es: 'Habla otro idioma' },
      supply: 'resource_card',
      clues: [
        { icon: '📰', read: { zh: '窗上貼著一張外語傳單', en: 'A flyer in another language on the window', es: 'Un folleto en otro idioma en la ventana' } }
      ]
    }
  },

  /* 物資架 / SUPPLY SHELF —— 玩家親手從這裡挑、拼出關懷包。
     satisfies = 對應需求 id；distractor:true = 用不上的干擾項（沒關係，溫柔）。 */
  supplies: [
    { id: 'kids_care',     icon: '🪥', satisfies: 'child',    name: { zh: '兒童牙刷組', en: "Children's toothbrush set", es: 'Set de cepillos infantiles' } },
    { id: 'baby_care',     icon: '🍼', satisfies: 'baby',     name: { zh: '尿布＋配方奶', en: 'Diapers & formula', es: 'Pañales y fórmula' } },
    { id: 'mobility_care', icon: '🦽', satisfies: 'elder',    name: { zh: '止滑墊＋扶手', en: 'Anti-slip mat & grab bar', es: 'Tapete antideslizante y barra' } },
    { id: 'blanket',       icon: '🧣', satisfies: 'cold',     name: { zh: '厚毛毯', en: 'Thick blanket', es: 'Manta gruesa' } },
    { id: 'toiletry',      icon: '🧼', satisfies: 'hygiene',  name: { zh: '牙膏＋肥皂', en: 'Toothpaste & soap', es: 'Pasta dental y jabón' } },
    { id: 'pet_care',      icon: '🐕', satisfies: 'pet',      name: { zh: '寵物飼料', en: 'Pet food', es: 'Comida para mascotas' } },
    { id: 'stationery',    icon: '🎒', satisfies: 'student',  name: { zh: '文具＋點心', en: 'Stationery & snacks', es: 'Útiles y meriendas' } },
    { id: 'food_water',    icon: '🍚', satisfies: 'cooking',  name: { zh: '米＋罐頭＋飲水', en: 'Rice, canned food & water', es: 'Arroz, conservas y agua' } },
    { id: 'resource_card', icon: '🗂️', satisfies: 'language', name: { zh: '三語資源卡', en: 'Trilingual resource card', es: 'Tarjeta de recursos trilingüe' } },
    /* 干擾項 / distractors —— 用不上，配到也沒關係 */
    { id: 'umbrella',  icon: '☂️', satisfies: null, distractor: true, name: { zh: '雨傘', en: 'Umbrella', es: 'Paraguas' } },
    { id: 'fan',       icon: '🌀', satisfies: null, distractor: true, name: { zh: '電風扇', en: 'Electric fan', es: 'Ventilador' } },
    { id: 'boardgame', icon: '🎲', satisfies: null, distractor: true, name: { zh: '桌遊', en: 'Board game', es: 'Juego de mesa' } }
  ],

  /* 真摯話輪播 —— 一家收到關懷包後的一句話（讀家不畫人，講的是「家」與感恩，不描述人）。
     輪播不重複。 / Sincere lines, rotate without repeat. About the home & gratitude. */
  warmLines: [
    { zh: '謝謝你們，今晚這扇窗裡終於有光了。', en: 'Thank you — tonight there is light in this window again.', es: 'Gracias — esta noche hay luz en esta ventana otra vez.' },
    { zh: '海風還在吹，但車裡暖了。', en: 'The sea wind still blows, but it is warm inside now.', es: 'El viento del mar sigue, pero adentro ya hay calor.' },
    { zh: '有人記得我們，就夠撐過今晚了。', en: 'Knowing someone remembered us is enough to get through tonight.', es: 'Saber que alguien nos recordó basta para esta noche.' },
    { zh: '這份心意，我們會接著傳下去。', en: 'We will pass this kindness on.', es: 'Pasaremos esta bondad a otros.' },
    { zh: '今晚可以安心睡了，謝謝。', en: 'We can sleep easy tonight. Thank you.', es: 'Esta noche dormiremos tranquilos. Gracias.' },
    { zh: '一把生米的故事，原來真的還在繼續。', en: 'The story that began with a handful of rice — it really does continue.', es: 'La historia que empezó con un puñado de arroz — de verdad continúa.' },
    { zh: '窗亮了，這裡就像個家了。', en: 'With the window lit, this feels like a home.', es: 'Con la ventana encendida, esto se siente como un hogar.' },
    { zh: '謝謝你願意先讀懂，再給。', en: 'Thank you for understanding first, then giving.', es: 'Gracias por entender primero y luego dar.' }
  ],

  /* 五台車的落點 / Five trailer focal spots on rv_park_dusk1.png
     座標為背景圖的比例 (0–1)。focus = 高亮那台車的中心；window = 窗亮位置。 */
  spots: [
    { focus: { x: 0.50, y: 0.42 }, window: { x: 0.53, y: 0.44 } },
    { focus: { x: 0.18, y: 0.40 }, window: { x: 0.15, y: 0.42 } },
    { focus: { x: 0.80, y: 0.38 }, window: { x: 0.83, y: 0.40 } },
    { focus: { x: 0.34, y: 0.30 }, window: { x: 0.34, y: 0.31 } },
    { focus: { x: 0.64, y: 0.29 }, window: { x: 0.66, y: 0.30 } }
  ]
};
