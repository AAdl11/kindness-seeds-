# 善的種子 · 獵人角 — Seeds of Kindness · Semillas de Bondad

> 一座你走得進去、照顧得到的社區。獵人角，邁向第二十年的陪伴。
> A community you can step into and care for — Hunters Point, toward twenty years of companionship.
> Una comunidad en la que puedes entrar y cuidar — Hunters Point, hacia veinte años de compañía.

**▶ 立即遊玩 / Play / Jugar：** https://aadl11.github.io/kindness-seeds-/

---

## 故事 · Story · Historia

**ZH** — 2006 年，淑雲師姐在獵人角的一所小學，看見一個孩子連早餐的一把生米都沒有。那一把生米，是這一切的開始。從一把米，到食物發放、毛毯、課輔、義診、RV Park 的關懷——這份陪伴，正邁向第二十年。這款遊戲，是它的一封情書：你不是來拯救誰，你是被邀請進來，和一座本來就是英雄的社區，一起把每一扇窗點亮。

**EN** — In 2006, in a Hunters Point elementary school, Sister Roxanne Buchwitz saw a child who didn't even have a handful of rice for breakfast. That handful of rice was the beginning of everything. From a handful of rice grew food shares, blankets, tutoring, free clinics, and outreach to families living in the RV Park — a companionship now approaching its twentieth year. This game is a love letter to that work: you are not here to rescue anyone. You are invited in, to help a community that was always the hero light up one window at a time.

**ES** — En 2006, en una escuela primaria de Hunters Point, la hermana Roxanne Buchwitz vio a un niño que no tenía ni un puñado de arroz para el desayuno. Ese puñado de arroz fue el comienzo de todo. De un puñado de arroz nacieron los repartos de alimentos, las mantas, las tutorías, las clínicas gratuitas y el apoyo a las familias del RV Park — una compañía que se acerca ya a su vigésimo año. Este juego es una carta de amor a esa labor: no vienes a rescatar a nadie. Eres invitado a ayudar a una comunidad que siempre fue la heroína, a encender una ventana a la vez.

---

## 第一關 · 關懷之夜 / Care at Dusk / Cuidado al Atardecer ★★★★

**ZH** — 黃昏的 RV Park，露營車一台台開進來避海風，想在這裡安身歇息。你只有夕陽這段時間：在每一台車上點亮發光的線索，讀懂這一家需要什麼，親手從物資架配出專屬的關懷包，趕在天黑前送到。天會一點一點變暗、變冷，車窗一盞盞亮起。沒有分數、沒有排名、沒有輸贏——天黑時，只有一句溫柔的話：「你在入夜前，照顧到了 N／5 台車的家。」

**EN** — At dusk in the RV Park, trailers roll in one by one to shelter from the sea wind, hoping to settle and rest. You only have this sliver of sunset: tap the glowing clues on each trailer, read what that family needs, hand-build a care package from the supply shelf, and deliver it before dark. The sky slowly deepens and grows cold; windows light up one by one. No score, no ranking, no winning or losing — when night falls, only a gentle line: "Before dark, you reached N / 5 trailer homes."

**ES** — Al atardecer en el RV Park, los remolques llegan uno a uno para resguardarse del viento del mar, buscando descanso. Solo tienes este rato de sol: toca las pistas brillantes en cada remolque, comprende qué necesita esa familia, arma a mano un paquete de cuidado desde el estante y entrégalo antes de que anochezca. El cielo se oscurece y enfría poco a poco; las ventanas se encienden una a una. Sin puntaje, sin clasificación, sin ganar ni perder — al caer la noche, solo una frase amable: "Antes de anochecer, llegaste a N / 5 hogares sobre ruedas."

---

## 玩法亮點 · Highlights · Lo Destacado

- **先讀懂，再給 / Observe before you give.** 蒐證式的線索閱讀：沒讀到的線索，就是還不知道的需要。No multiple choice — you infer each family's needs by reading the home, never by picking A/B/C.
- **親手配關懷包 / Build the package by hand.** 從物資架一件件挑、拼出這一家專屬的關懷包。
- **不比較、不計較 / No ranking, no scores.** 全程沒有分數、排名、淘汰或懲罰倒數。軟失敗只是溫柔的提醒。
- **天色由亮到暗 / A real sunset.** 同一張黃昏插畫在程式裡逐步壓暗、變冷，車窗漸亮，配樂隨夜色收緊。
- **你的小芽 / Your sprout.** 每照顧一家，你親手命名的小芽就長一截；用 `localStorage` 跨次保存，回來還在、又長了。
- **三福骨架 / Three Blessings.** 幸福家園 · 幸福校園 · 幸福社區——共善竹筒與感恩牆，集體成長不排名。
- **三語 / Trilingual.** 全程 EN / ZH / ES 即時切換。

---

## 技術 · Tech

- 純靜態網站，離線可玩，無建置步驟、無框架。Pure static site, offline-friendly, no build step, no framework.
- 多檔架構：`index.html` + `src/css` + `src/js` + `data/`。
- **資料驅動**：關卡的需求、線索、物資全寫在 `data/level1.js`，新增內容只改資料、不動引擎。
- 配樂用 `<audio>` + WebAudio（音量隨暖意微升、濾波隨夜色收緊）；所有音效以 WebAudio 即時合成。
- 跨次保存用 `localStorage`（含記憶體 fallback）。
- 部署於 GitHub Pages。

```
index.html
data/level1.js          # 需求池 / 線索 / 物資 / 真摯話 / 落點（資料驅動）
src/js/i18n.js          # 三語字串 EN/ZH/ES
src/js/audio.js         # 配樂 + WebAudio 音效
src/js/game.js          # 主引擎：讀線索 → 配關懷包 → 送出 → 天黑收場
src/css/style.css
assets/images/          # rv_park_dusk1（關卡）/ rv_park_dusk（hub）/ rv_park_night（結尾）
assets/audio/           # a-curious-discovery.mp3
```

更多關卡（食物發放、課後輔導、全勤獎、素食烹飪、義診、環保小尖兵、遊民熱食）在 hub 上標示「即將開放」，會延續同一套資料驅動架構陸續加入。

---

## 致謝 · Acknowledgements · Agradecimientos

獻給獵人角的社區、孩子與家庭，以及二十年來不曾缺席的志工們。特別感念淑雲師姐（Roxanne Buchwitz）從一把生米開始的這條路。

For the Hunters Point community — its children, its families — and the volunteers who have not missed a single year. With deep gratitude to Sister Roxanne Buchwitz, who began this path with a single handful of rice.

Para la comunidad de Hunters Point — sus niños, sus familias — y los voluntarios que no han faltado ni un solo año. Con profunda gratitud a la hermana Roxanne Buchwitz, que comenzó este camino con un solo puñado de arroz.

> 遊戲尊重每一個家：畫面只呈現「家」與關懷，不描繪受助的人。
> This game honors every home: it shows the home and the care, never the people being helped.

---

## 授權 · License

程式碼 / Code：MIT License.
真實故事、社區素材與背景插畫僅供本公益專案使用，著作權歸各自所有者所有。
Real stories, community materials, and background artwork are used for this nonprofit project only; all rights remain with their respective owners.
