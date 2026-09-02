// ============================================================
// Atlas — atlas-grundlagen.js
// Splat-Haekchen, Tabs, Kopfzeile, Roadmap-Status, Lernfeldtypen, Dialog-Helfer
//
// Teil von app.js, das auf 9 Dateien aufgeteilt wurde. Die Reihenfolge in index.html
// entspricht exakt der frueheren Reihenfolge in der einen Datei -- die Dateien teilen sich
// weiterhin einen Gueltigkeitsbereich, es sind bewusst KEINE Module. Dadurch aendert das
// Aufteilen am Verhalten nichts; nur Funktionen werden nicht mehr ueber Dateigrenzen hinweg
// vorgezogen, weshalb Code, der sofort laeuft, hinter seinen Funktionen stehen muss.
// ============================================================

// ---------- Splat-Häkchen-System (aus dem Claude-Design-Handoff, Atlas.dc.html) ----------
const SPLATS = [
  { path: 'M10,3 L11.5,6 L15,5 L13,8.5 L16.5,10 L13,11 L14.5,15 L11,13 L10,17 L8.5,13 L5,15 L7,11 L3,10 L7,8.5 L5,5 L8.5,6 Z',
    dots: [[17,3,0.8],[2,15,1],[15,17,0.6]] },
  { path: 'M9,2 L10,5 L13,3.5 L11.5,7 L16,6 L13,9.5 L18,11 L12.5,11.5 L15,15 L10,13 L11,18 L8,14 L4,17 L6.5,12.5 L1,13 L5,10 L2,7 L7,8.5 L6,4 Z',
    dots: [[18,4,0.7],[1,4,1.1],[9,19,0.8],[19,15,0.6]] },
  { path: 'M8,3 L11,4 L13,2 L13,6 L17,7 L14,9 L17,12 L13,12.5 L14,16.5 L10.5,14 L9,19 L8,15 L4,16 L6,12 L2,11.5 L5.5,9 L2.5,6.5 L7,7.5 Z',
    dots: [[18,9,1],[3,3,0.8],[16,17,0.7],[1,17,0.5]] },
  { path: 'M10,4 L12,5.5 L14,4.5 L13,7.5 L16,9 L12.5,10 L14,13.5 L11,12 L10,16 L8.5,12.5 L5,14 L7,10.5 L4,9 L7.5,7.5 L6,4.5 L9,5.5 Z',
    dots: [[16,4,0.7],[3,16,0.9]] }
];
const TAB_SPLATS = [
  SPLATS[0], SPLATS[1], SPLATS[2], SPLATS[3],
  { path: 'M9,3 L12,4.5 L14,2.5 L14,6.5 L18,7 L15,9.5 L18,13 L14,13 L15,17 L11,14.5 L9,19 L7.5,15 L3,16.5 L6,12.5 L2,10 L6.5,8.5 L4,4.5 L8,6 Z',
    dots: [[17,3,0.8],[2,17,1]] },
  { path: 'M10,2.5 L11.5,5.5 L15,4.5 L13.5,8 L17.5,9 L14,11.5 L17,15 L12.5,14.5 L13.5,18.5 L9.5,16 L7,19.5 L6.5,15.5 L2.5,16.5 L5,12.5 L1.5,10 L5.5,9 L3.5,5 L7.5,6.5 Z',
    dots: [[18,2,0.7],[2,4,0.9],[19,17,0.6],[1,19,0.8]] }
];
function splatFor(id) {
  // deterministischer Splat je nach (String-)ID, wie im Design-Prototyp
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) >>> 0;
  const v = SPLATS[n % SPLATS.length];
  const scale = 0.78 + ((n * 29) % 65) / 100;
  const rot = ((n * 53) % 60) - 30;
  return {
    path: v.path, dots: v.dots.map(([cx, cy, r]) => ({ cx, cy, r })),
    scale: scale.toFixed(2), rot
  };
}
// Breiter Farbklecks hinter einem erledigten Titel (ToDo-Zeilen + Roadmap-Ebene-3-Schritte) — ein
// flacher, gewischter Streifen statt eines runden Splats, mit eigenem Gradient/Filter (goldGradWide /
// inkRoughWide, siehe index.html-Defs): goldGradRing ist mit userSpaceOnUse auf 0–40 fest verankert,
// bei einem 220 Einheiten breiten Pfad lief der Großteil davon nur noch im letzten, dunklen Farbstopp
// (matschig statt golden). preserveAspectRatio="none" lässt eine einzige handgezeichnete Form auf
// jede Titellänge dehnen.
function paintStrokeSvgHtml(id) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) >>> 0;
  const flip = n % 2 === 0;
  const path = flip
    ? "M2,20 C6,10 14,7 26,8 C40,9 55,13 72,11 C95,8 110,15 128,12 C148,9 165,14 182,11 C196,9 208,13 218,19 C210,29 198,32 182,30 C165,33 148,28 128,31 C110,33 95,29 72,32 C55,34 40,30 26,32 C14,33 6,30 2,20 Z"
    : "M2,18 C8,8 17,12 31,9 C47,6 59,14 77,10 C98,15 113,8 132,13 C150,17 168,10 184,14 C198,17 210,10 218,18 C212,30 200,34 184,30 C168,34 150,27 132,31 C113,26 98,33 77,28 C59,32 47,24 31,27 C17,31 8,26 2,18 Z";
  const dots = [
    { cx: 4 + (n % 8), cy: 3 + (n % 5), r: 2.2 },
    { cx: 212 - (n % 10), cy: 34 - (n % 6), r: 1.7 },
    { cx: 202 + (n % 6), cy: 4, r: 1.3 }
  ];
  return `<svg viewBox="0 0 220 40" preserveAspectRatio="none">
    <g filter="url(#inkRoughWide)">
      <path d="${path}" fill="url(#goldGradWide)"/>
    </g>
    ${dots.map(d => `<circle cx="${d.cx}" cy="${d.cy}" r="${d.r}" fill="url(#goldGradWide)"/>`).join("")}
  </svg>`;
}

function splatSvg(id) {
  const s = splatFor(id);
  return `<svg width="18" height="18" viewBox="0 0 20 20" style="overflow:visible;">
    <g transform="translate(10 10) scale(${s.scale}) rotate(${s.rot}) translate(-10 -10)">
      <path d="${s.path}" fill="url(#goldGradRing)" filter="url(#inkRough)"/>
      ${s.dots.map(d => `<circle cx="${d.cx}" cy="${d.cy}" r="${d.r}" fill="url(#goldGradRing)"/>`).join("")}
    </g>
  </svg>`;
}
// ?v=2: die Masken hatten einen Alpha-Boden von 2/255 ueber die gesamte Bildflaeche (kein Pixel war
// wirklich transparent), wodurch das komplette Quadrat schwach mitgemalt und vom drop-shadow-Filter
// als quadratischer Schein verstaerkt wurde; bei Mi/Fr lief der Pinselstrich zusaetzlich hart in den
// Bildrand. Beides ist in den PNGs behoben — der Query-Parameter erzwingt, dass der Service-Worker-
// Cache (cache-first) die neuen Dateien holt statt der alten.
// ?v=3: die sieben Masken hatten unterschiedlich grosse und unterschiedlich platzierte
// Pinselstriche (Tinte 505-553 px breit, teils bis an den unteren Bildrand). Weil sie ueber die
// Karten durchgewechselt werden, hatte dadurch "Karriere" bei 1 % einen sichtbar groesseren Ring
// als "Glaube" bei 0 % -- Geometrie, die in einer Fortschrittsanzeige nichts kodiert, aber am
// staerksten von allem variiert. Jetzt ist die Tinte in jeder Maske gleichmaessig auf denselben
// Aussendurchmesser skaliert und zentriert; die handgezeichnete Kontur bleibt.
// Originale vor der Normalisierung: assets/_backup-ring-masks-vor-normalisierung/
const RING_MASKS = ["ring-mask-1.png?v=4", "ring-mask-2.png?v=4", "ring-mask-3.png?v=4", "ring-mask-4.png?v=4", "ring-mask-5.png?v=4", "ring-mask-6.png?v=4", "ring-mask-7.png?v=4"];
function pieSlicePath(pct) {
  const cx = 100, cy = 100, R = 105;
  if (pct >= 99.5) return "M0,0 H200 V200 H0 Z";
  if (pct <= 0.5) return `M${cx},${cy} L${cx},${cy - R} Z`;
  const endDeg = -90 + pct * 3.6;
  const endRad = endDeg * Math.PI / 180;
  const ex = (cx + R * Math.cos(endRad)).toFixed(2);
  const ey = (cy + R * Math.sin(endRad)).toFixed(2);
  const largeArc = pct > 50 ? 1 : 0;
  return `M${cx},${cy} L${cx},${cy - R} A${R},${R} 0 ${largeArc} 1 ${ex},${ey} Z`;
}

// Anlassfarben von Stahl (ohne das letzte, für "geglüht" reservierte Stadium, s.u.). Jede erledigte
// Aufgabe rückt den Ring diesen Verlauf ein Stück weiter, stufenlos ineinander übergehend statt hart
// springend — bis bei 100% (alle fällig/überfälligen erledigt) der Sonderzustand "glüht" übernimmt.
const STEEL_STAGES = [
  "#8a93a3", // stahlgrau
  "#e8d577", // strohgelb
  "#d4af37", // gold
  "#8b5a2b", // braun/kupfer
  "#7b3f61", // purpur
  "#3b5b92"  // blau
];
// t = Fortschritt 0..1 (erledigt/fällig), noch NICHT ganz fertig — die eigentliche Glut kommt separat.
function steelColorForProgress(t) {
  const clamped = Math.max(0, Math.min(0.999, t));
  const scaled = clamped * (STEEL_STAGES.length - 1);
  const i = Math.floor(scaled);
  const frac = scaled - i;
  return lerpColor(STEEL_STAGES[i], STEEL_STAGES[Math.min(i + 1, STEEL_STAGES.length - 1)], frac);
}
// Metallischer Ring-Farbverlauf im selben 7-Stop-Muster wie der Wochenkreis (dunkel-hell-mittel-hell-dunkel-hell-dunkel),
// aber für eine beliebige Anlassfarbe statt fix Gold — so bekommt jede Stahl-Stufe denselben glänzenden Metall-Look.
function metallicRingGradient(base) {
  const dark = `color-mix(in srgb, ${base} 65%, black)`;
  const light = `color-mix(in srgb, ${base} 55%, white)`;
  const lighter = `color-mix(in srgb, ${base} 80%, white)`;
  return `conic-gradient(from -90deg, ${dark} 0%, ${lighter} 16.6%, ${base} 33.3%, ${light} 50%, ${dark} 66.6%, ${lighter} 83.3%, ${dark} 100%)`;
}

// ToDo-Ring: exakt dieselbe Ring-Masken-Technik wie der Wochenkreis (renderWeekCircle). Füllstand =
// erledigte / fällige-oder-überfällige Aufgaben (bei 4 fälligen füllt jede erledigte den Ring um 25%,
// bei 5 fälligen um 20% usw. — unabhängig von Klein/Groß). Startet stahlgrau glänzend und wandert mit
// jeder erledigten Aufgabe einen Schritt weiter durch die Anlassfarben; bei 100% (alles erledigt) geht
// der Ring in einen weißglühenden Sonderzustand über: weißgoldener Kern + warmer goldoranger Halo,
// der über den Rand hinaus ausblutet, plus sanftes Pulsieren.
// Weissglut = Belohnungszustand des ToDo-Rings bei 100 %. Frueher war das ein reines Rot; das las
// sich wie eine Warnung statt wie ein Abschluss und war der unbefriedigendste Punkt des ganzen
// Verlaufs. Jetzt endet der Ring auf der hellsten Stufe der Gluehfarben-Skala (weissgold, warmer
// goldoranger Halo) -- passend zum Messing-Akzent der App und eindeutig als "geschafft" lesbar.
const FORGE_COLOR = "#ffe9b0";
const FORGE_HALO = "#ff9f2e";
// Rot bleibt dort, wo es semantisch stimmt: Budget-Limit ueberschritten (siehe budgetRingHtml).
const MOLTEN_COLOR = "#ff2020";
const MOLTEN_HALO = "#a80000";

// celebrate = true nur im Moment des Uebergangs auf 100 % (siehe renderTodo) — dann flammt der
// Ring einmal auf. Ohne das Flag leuchtet er ruhig und konstant weiter.
function dayBudgetRing(dueCount, doneCount, size = 200, celebrate = false, ohneTermin = 0) {
  const t = dueCount > 0 ? doneCount / dueCount : 0;
  const pct = Math.min(100, Math.round(t * 100));
  const allDueDone = dueCount > 0 && doneCount >= dueCount;
  const baseColor = allDueDone ? FORGE_COLOR : steelColorForProgress(t);
  const today = new Date();
  const todayIdx = (today.getDay() + 6) % 7;
  const maskUrl = `assets/${RING_MASKS[todayIdx]}`;
  const percentMask = conicPercentMask(pct);
  // Bei 100% (Weißglut) denselben nahtlosen Metall-Verlauf wie sonst nutzen (erster/letzter Stop
  // identisch, kein harter Rand bei 0°) statt eines eigenen Musters mit Farbbändern im Ring selbst
  // — der Ring leuchtet einfach direkt weißgolden, kein weicher Mehrfach-Halo.
  const gradient = metallicRingGradient(baseColor);
  const glowFilter = allDueDone
    ? `drop-shadow(0 0 7px ${FORGE_COLOR}) drop-shadow(0 0 16px ${FORGE_HALO})`
    : `drop-shadow(0 0 4px color-mix(in srgb, ${baseColor} 70%, transparent)) drop-shadow(0 0 11px color-mix(in srgb, ${baseColor} 32%, transparent))`;

  return `
    <div style="display:flex; justify-content:center; margin-bottom:16px;">
      <div class="${allDueDone && celebrate ? "ring-flare" : ""}" style="position:relative; width:${size}px; height:${size}px;">
        <div style="position:absolute; inset:0;
          background:rgba(255,255,255,0.16);
          -webkit-mask-image:url('${maskUrl}'); -webkit-mask-size:100% 100%; -webkit-mask-repeat:no-repeat; -webkit-mask-position:center;
          mask-image:url('${maskUrl}'); mask-size:100% 100%; mask-repeat:no-repeat; mask-position:center;"></div>
        <div style="position:absolute; inset:0;
          background:${gradient};
          -webkit-mask-image:url('${maskUrl}'), ${percentMask}; -webkit-mask-size:100% 100%, 100% 100%; -webkit-mask-repeat:no-repeat, no-repeat; -webkit-mask-position:center, center; -webkit-mask-composite:source-in;
          mask-image:url('${maskUrl}'), ${percentMask}; mask-size:100% 100%, 100% 100%; mask-repeat:no-repeat, no-repeat; mask-position:center, center; mask-composite:intersect;
          filter:${glowFilter};
          transition:filter 0.4s, background 0.4s;"></div>
        <div style="position:absolute; inset:0;
          background:radial-gradient(circle at 32% 24%, rgba(255,255,255,0.9), transparent 55%);
          mix-blend-mode:overlay; opacity:${allDueDone ? 0.85 : 0.6};
          -webkit-mask-image:url('${maskUrl}'), ${percentMask}; -webkit-mask-size:100% 100%, 100% 100%; -webkit-mask-repeat:no-repeat, no-repeat; -webkit-mask-position:center, center; -webkit-mask-composite:source-in;
          mask-image:url('${maskUrl}'), ${percentMask}; mask-size:100% 100%, 100% 100%; mask-repeat:no-repeat, no-repeat; mask-position:center, center; mask-composite:intersect;"></div>
        <span style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:${Math.round(size * 0.17)}px; font-family:var(--font-heading); color:var(--color-neutral-100); text-shadow:0 1px 4px rgba(0,0,0,0.6);">${dueCount === 0 && ohneTermin > 0 ? ohneTermin + " offen" : (dueCount === 0 ? "–" : doneCount + "/" + dueCount)}</span>
      </div>
    </div>
  `;
}

// Budget-Ring im selben Stahl-/Glüh-Stil wie dayBudgetRing: normal ein Stahlton-Ring nach
// Ausgaben-Anteil, bei Überschreitung des Limits geht er in den weißgelb-glühenden Zustand mit
// orangenem Halo über (statt bei "alles erledigt" hier bei "Limit überschritten").
// erreichenIstGut = true bei Sparzielen: dort ist das Ueberschreiten das Ziel, nicht der Alarm.
// Vorher lief hier fuer beide Faelle derselbe rote Gluehzustand samt Dauerpuls — ein uebererfuelltes
// Sparziel sah damit aus wie ein gerissenes Budget.
// feiern = true nur im Moment des Uebergangs auf "Ziel erreicht" (siehe renderFinanceGoals):
// dann leuchtet der Ring einmal auf und ein Lichtsaum laeuft nach aussen. Danach steht er ruhig.
function budgetRingHtml(spent, limit, size = 40, maskIdx = 0, erreichenIstGut = false, feiern = false) {
  const t = limit > 0 ? spent / limit : 0;
  const pct = Math.round(t * 100);
  const erreicht = limit > 0 && spent >= limit;
  const overLimit = !erreichenIstGut && limit > 0 && spent > limit;
  const zielErreicht = erreichenIstGut && erreicht;
  const baseColor = overLimit ? MOLTEN_COLOR : zielErreicht ? FORGE_COLOR : steelColorForProgress(Math.min(0.999, t));
  const maskUrl = `assets/${RING_MASKS[maskIdx % RING_MASKS.length]}`;
  const percentMask = conicPercentMask(Math.min(100, pct));   // ueber 100 % bleibt der Ring voll
  const gradient = metallicRingGradient(baseColor);
  const glowFilter = overLimit
    ? `drop-shadow(0 0 6px ${MOLTEN_COLOR}) drop-shadow(0 0 14px ${MOLTEN_HALO})`
    : zielErreicht
    ? `drop-shadow(0 0 6px ${FORGE_COLOR}) drop-shadow(0 0 14px ${FORGE_HALO})`
    : `drop-shadow(0 0 4px color-mix(in srgb, ${baseColor} 70%, transparent)) drop-shadow(0 0 11px color-mix(in srgb, ${baseColor} 32%, transparent))`;
  const ringKlasse = overLimit ? "ring-glow-pulse" : (zielErreicht && feiern ? "goal-reached-flare" : "");
  return `
    <div class="${ringKlasse}" style="position:relative; width:${size}px; height:${size}px; flex-shrink:0;">
      <div style="position:absolute; inset:0;
        background:rgba(255,255,255,0.16);
        -webkit-mask-image:url('${maskUrl}'); -webkit-mask-size:100% 100%; -webkit-mask-repeat:no-repeat; -webkit-mask-position:center;
        mask-image:url('${maskUrl}'); mask-size:100% 100%; mask-repeat:no-repeat; mask-position:center;"></div>
      <div style="position:absolute; inset:0;
        background:${gradient};
        -webkit-mask-image:url('${maskUrl}'), ${percentMask}; -webkit-mask-size:100% 100%, 100% 100%; -webkit-mask-repeat:no-repeat, no-repeat; -webkit-mask-position:center, center; -webkit-mask-composite:source-in;
        mask-image:url('${maskUrl}'), ${percentMask}; mask-size:100% 100%, 100% 100%; mask-repeat:no-repeat, no-repeat; mask-position:center, center; mask-composite:intersect;
        filter:${glowFilter};
        transition:filter 0.4s, background 0.4s;"></div>
      <div style="position:absolute; inset:0;
        background:radial-gradient(circle at 32% 24%, rgba(255,255,255,0.9), transparent 55%);
        mix-blend-mode:overlay; opacity:${overLimit ? 0.85 : 0.6};
        -webkit-mask-image:url('${maskUrl}'), ${percentMask}; -webkit-mask-size:100% 100%, 100% 100%; -webkit-mask-repeat:no-repeat, no-repeat; -webkit-mask-position:center, center; -webkit-mask-composite:source-in;
        mask-image:url('${maskUrl}'), ${percentMask}; mask-size:100% 100%, 100% 100%; mask-repeat:no-repeat, no-repeat; mask-position:center, center; mask-composite:intersect;"></div>
      <span style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:${Math.round(size * 0.24)}px; font-family:var(--font-heading); color:var(--color-neutral-100); text-shadow:0 1px 4px rgba(0,0,0,0.6);">${pct}%</span>
    </div>
  `;
}

// ---------- Tabs ----------
const TAB_ORDER = ["heute", "todo", "finanzen", "zielbereiche", "gebete", "projekte", "gym", "ich", "analyse"];
const TAB_ROT = [-6, 10, 5, -12, 7, 9, -4];
const TAB_SCALE = [1.05, 0.92, 1, 1.1, 0.95, 1.03, 1.02];
const tabBtns = Array.from(document.querySelectorAll(".tab-btn"));
const tabIndicator = document.getElementById("tabIndicator");
let dropTimer = null;

function renderTabIndicator(idx, dropPhase) {
  if (!tabIndicator) return; // Tab-Leiste ersetzt durch einen einzelnen Home-Knopf
  // Pixelwert statt CSS-%/calc, damit die Position über transform (Compositor-Thread,
  // unabhängig vom Haupt-Thread) statt über left (braucht Layout) animiert werden kann.
  const containerWidth = tabIndicator.parentElement.clientWidth;
  const leftPx = ((idx + 0.5) / TAB_ORDER.length) * containerWidth - 28;
  tabIndicator.style.transform = `translateX(${leftPx}px)`;
  if (dropPhase === "flying") {
    tabIndicator.innerHTML = `
      <svg width="52" height="46" viewBox="0 0 20 20" style="overflow:visible; width:100%; height:100%;">
        <circle cx="10" cy="10" r="1.2" fill="url(#liquidBallGrad)"/>
        <circle cx="9.55" cy="9.45" r="0.4" fill="#ffffff" opacity="0.95"/>
      </svg>`;
    return;
  }
  const s = TAB_SPLATS[idx % TAB_SPLATS.length];
  const scale = TAB_SCALE[idx] || 1;
  const rot = TAB_ROT[idx] || 0;
  tabIndicator.innerHTML = `
    <svg width="52" height="46" viewBox="0 0 20 20" style="overflow:visible; width:100%; height:100%;">
      <g transform="translate(10 10) scale(${scale}) rotate(${rot}) translate(-10 -10)">
        <path d="${s.path}" fill="url(#goldGradRing)" filter="url(#inkRough)"/>
        ${s.dots.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#goldGradRing)"/>`).join("")}
      </g>
    </svg>`;
}

function switchTab(tabName) {
  hideUndoBar();   // sonst schwebt sie ueber einem Tab, in dem das Geloeschte gar nicht sichtbar war
  const idx = TAB_ORDER.indexOf(tabName);
  tabBtns.forEach(b => b.classList.toggle("active", b.dataset.tab === tabName));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  document.getElementById("tab-" + tabName).classList.add("active");
  document.body.dataset.tab = tabName;

  if (dropTimer) clearTimeout(dropTimer);
  renderTabIndicator(idx, "flying");
  dropTimer = setTimeout(() => renderTabIndicator(idx, "settled"), 190);

  quickAddVisible = false;
  bereicheSearchVisible = false;
  bereicheSearchQuery = "";
  updateHeaderPlusButton();
  // Auf den nächsten Frame verschoben: der Browser soll erst den Tab-Wechsel (Panel-Umschaltung +
  // Tintenklecks-Flug-Animation) zeichnen können, bevor die potenziell aufwändige Neu-Rendering-Arbeit
  // (u.a. Finanzen-Listen, Analyse-Charts) den Haupt-Thread blockiert und die Animation ruckeln lässt.
  requestAnimationFrame(() => renderAll());
}

tabBtns.forEach(btn => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});
document.body.dataset.tab = "heute";
renderTabIndicator(0, "settled");

// ---------- Kopfzeile: kontextabhängiger Plus-Button ----------
const QUICK_ADD_BTN_IDS = {
  heute: ["addRoutineBtn", "addHabitBtn", "deviationAddWrap", "addExamBtn"],
  todo: ["addTaskBtn"],
  finanzen: ["addIncomeSourceBtn", "addAccountBtn", "addSavingsGoalBtn"]
};
let quickAddVisible = false;
let bereicheSearchVisible = false;
let bereicheSearchQuery = "";

// ---------- Roadmap-Navigation (Dashboard -> Kategorie -> Pfad), rein Laufzeit-Status ----------
// Greift ausschließlich auf die bestehenden goalNodes/tasks-Datenfunktionen zu (nodeProgress,
// childNodes, categoryTasksForNode, das bestehende data-task-Toggle) — es wird keine neue
// Datenstruktur eingeführt und ToDo/Tagesroutine/Gebete bleiben davon komplett unberührt.
let roadmapView = "dashboard"; // "dashboard" | "category" | "path"
let roadmapEditMode = false;   // blendet Anlegen/Bearbeiten/Loeschen im Zielbaum ein
let roadmapRootId = null;
let roadmapPathId = null;
Object.values(QUICK_ADD_BTN_IDS).flat().forEach(id => {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
});

const HEADER_ICON_PLUS = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5V12.5M1.5 7H12.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const HEADER_ICON_SEARCH = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.6"/><path d="M9.5 9.5L13 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const HEADER_ICON_DOWNLOAD = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5V9.5M4 6.5L7 9.5L10 6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 11.5V12.5H12V11.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

// ---------- Lernfeldaufgaben: Aufgabentypen mit Icon (statt Klein/Groß, für source="category") ----------
// Aufwandsstufen für Aufgaben (task.size): sechs Stufen mit grobem Zeitrahmen statt nur klein/groß.
// minutes = Mittelwert der jeweiligen Zeitspanne. Damit laesst sich der Aufwand erledigter
// Aufgaben aufsummieren ("wie viel Zeit ist da hineingeflossen"). Das bleibt eine Schaetzung aus
// der gewaehlten Stufe, keine gemessene Zeit — die Analyse benennt das auch so.
// Stufe 5/6 rechnen mit Arbeitstagen zu 8 Stunden, nicht mit Kalendertagen.
const EFFORT_LEVELS = [
  { level: 1, label: "Erster Gedanke", time: "1–5 Min.", minutes: 3 },
  { level: 2, label: "Kurzaufgabe", time: "5–30 Min.", minutes: 18 },
  { level: 3, label: "Mittlere Aufgabe", time: "30 Min. – 2 Std.", minutes: 75 },
  { level: 4, label: "Halbtagsaufgabe", time: "2–6 Std.", minutes: 240 },
  { level: 5, label: "Größere Aufgabe", time: "halber – 1 Tag", minutes: 360 },
  { level: 6, label: "Große Aufgabe", time: "1 – 1,5 Wochen", minutes: 3000 }
];
// Stunden lesbar machen: 45 Min., 3,5 Std., 2 Tage (zu 8 Std.).
function formatAufwand(minuten) {
  if (!minuten) return "0 Min.";
  if (minuten < 60) return Math.round(minuten) + " Min.";
  const std = minuten / 60;
  if (std < 16) return (Math.round(std * 10) / 10).toLocaleString("de-DE") + " Std.";
  const tage = std / 8;
  return (Math.round(tage * 10) / 10).toLocaleString("de-DE") + " Arbeitstage";
}
function taskMinutes(t) {
  return effortLevelInfo(t.size).minutes;
}
function effortLevelInfo(size) {
  const n = typeof size === "number" ? size : (size === "gross" ? 4 : 1);
  return EFFORT_LEVELS.find(e => e.level === n) || EFFORT_LEVELS[0];
}

const LERNTYPEN = [
  { id: "video", label: "Video schauen", icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.3"/><path d="M6 4.8L9.2 7L6 9.2V4.8Z" fill="currentColor"/></svg>' },
  { id: "podcast", label: "Podcast/Hörbuch anhören", icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 6V8M5 4V10M7 2.5V11.5M9 4V10M11.5 6V8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>' },
  { id: "buch", label: "Buch lesen", icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 3.2C6 2.4 4.3 2 2.5 2V10.5C4.3 10.5 6 10.9 7 11.7C8 10.9 9.7 10.5 11.5 10.5V2C9.7 2 8 2.4 7 3.2Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M7 3.2V11.7" stroke="currentColor" stroke-width="1.2"/></svg>' },
  { id: "artikel", label: "Artikel/Wikipedia lesen", icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2.5" y="2" width="9" height="10" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M4.5 5H9.5M4.5 7H9.5M4.5 9H7.5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>' },
  { id: "zusammenfassung", label: "Zusammenfassung schreiben", icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 11.5L3 9.3L9.3 3L11 4.7L4.7 11L2.5 11.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>' },
  { id: "erklaeren", label: "Funktionsweise erklären", icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3.5H12V8.5H6.5L4 11V8.5H2V3.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M4.5 6H9.5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>' },
  { id: "mindmap", label: "Mindmap/Diagramm erstellen", icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="4" r="1.6" stroke="currentColor" stroke-width="1.1"/><circle cx="3" cy="10.5" r="1.6" stroke="currentColor" stroke-width="1.1"/><circle cx="11" cy="10.5" r="1.6" stroke="currentColor" stroke-width="1.1"/><path d="M6 5.3L4 9.1M8 5.3L10 9.1" stroke="currentColor" stroke-width="1.1"/></svg>' },
  { id: "karteikarten", label: "Karteikarten erstellen", icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3.5" y="3.5" width="8" height="6" rx="0.8" stroke="currentColor" stroke-width="1.1"/><rect x="2" y="5" width="8" height="6" rx="0.8" fill="var(--color-surface)" stroke="currentColor" stroke-width="1.1"/></svg>' },
  { id: "quiz", label: "Quiz/Selbsttest machen", icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2.5" y="2.5" width="9" height="9" rx="1.2" stroke="currentColor" stroke-width="1.2"/><path d="M4.7 7.2L6.2 8.7L9.3 5.3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
  { id: "praktisch", label: "Praktisch üben/anwenden", icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 8.5L2 11.5L5 10.5L10.5 5L8.5 3L3 8.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M7 4.5L9 6.5" stroke="currentColor" stroke-width="1.1"/></svg>' },
  { id: "gespraech", label: "Mit jemandem sprechen/Experten fragen", icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3H8V7.5H4.5L2 9.5V3Z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/><path d="M6.5 8.5C6.9 9.6 8 10.3 9.2 10.2L12 12V8.2H10" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg>' }
];
function lerntypById(id) { return LERNTYPEN.find(l => l.id === id) || LERNTYPEN[0]; }

function updateHeaderPlusButton() {
  const tab = document.body.dataset.tab;
  const ids = QUICK_ADD_BTN_IDS[tab];
  // Nur ueber das Plus. Ein dauerhaft sichtbarer Hinzufuegen-Knopf in einem leeren Abschnitt
  // machte den Bildschirm unruhig, ohne etwas zu erklaeren.
  if (ids) ids.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = quickAddVisible ? "" : "none"; });
  const prayerCard = document.getElementById("prayerAddCard");
  if (prayerCard) prayerCard.style.display = (tab === "gebete" && quickAddVisible) ? "flex" : "none";
  const searchCard = document.getElementById("bereicheSearchCard");
  if (searchCard) searchCard.style.display = (tab === "zielbereiche" && bereicheSearchVisible) ? "flex" : "none";

  const icon = document.getElementById("headerPlusIcon");
  const btn = document.getElementById("headerPlusBtn");
  if (tab === "zielbereiche") {
    icon.innerHTML = HEADER_ICON_SEARCH;
    btn.setAttribute("aria-label", "Roadmap durchsuchen");
  } else if (tab === "analyse") {
    icon.innerHTML = HEADER_ICON_DOWNLOAD;
    btn.setAttribute("aria-label", "Wochendaten herunterladen");
  } else {
    icon.innerHTML = HEADER_ICON_PLUS;
    btn.setAttribute("aria-label", "Hinzufügen");
  }
}

document.getElementById("headerPlusBtn").addEventListener("click", () => {
  const tab = document.body.dataset.tab;
  if (tab === "todo") {
    // Auf ToDo gibt es genau ein Ziel — hier war das Plus vorher ein Moduswechsel, der erst einen
    // zweiten Knopf einblendete. Zwei Tipps fuer die haeufigste Aktion der App.
    openTaskModal();
  } else if (tab === "heute" || tab === "finanzen") {
    // Dort gibt es mehrere Ziele (Routine, Gewohnheit, Abweichung, Klassenarbeit), deshalb bleibt
    // das Einblenden der jeweiligen Knoepfe der richtige Weg.
    quickAddVisible = !quickAddVisible;
    updateHeaderPlusButton();
    renderAll();
  } else if (tab === "zielbereiche") {
    bereicheSearchVisible = !bereicheSearchVisible;
    if (!bereicheSearchVisible) {
      bereicheSearchQuery = "";
      document.getElementById("bereicheSearchInput").value = "";
      renderGoalBrowser();
    }
    updateHeaderPlusButton();
    if (bereicheSearchVisible) document.getElementById("bereicheSearchInput").focus();
  } else if (tab === "gebete") {
    quickAddVisible = !quickAddVisible;
    updateHeaderPlusButton();
    // Ohne Neurendern blieben die Ziehgriffe der Gebetszeilen unsichtbar — sie haengen an
    // quickAddVisible und entstehen nur beim Rendern. Das Umsortieren war dadurch praktisch tot.
    renderAll();
    if (quickAddVisible) document.getElementById("prayerInput").focus();
  } else if (tab === "analyse") {
    exportWeekReview();
  } else if (tab === "projekte") {
    openProjectModal();
  } else if (tab === "ich") {
    // Ein Satz gehoert immer in genau einen Bereich; welchen, fragt der Dialog selbst ab.
    openIchBeliefModal(null, null);
  }
});
document.getElementById("roadmapEditToggle").addEventListener("click", () => {
  roadmapEditMode = !roadmapEditMode;
  document.getElementById("roadmapEditToggle").classList.toggle("aktiv", roadmapEditMode);
  document.getElementById("roadmapEditToggle").textContent = roadmapEditMode ? "Fertig" : "Bearbeiten";
  renderGoalBrowser();
});

document.getElementById("bereicheSearchInput").addEventListener("input", e => {
  bereicheSearchQuery = e.target.value;
  renderGoalBrowser();
});
document.getElementById("addRoutineBtn").addEventListener("click", () => openHabitModal(true));
// Als Aufruf und nicht als Referenz: die Funktion liegt in einer spaeteren Datei, eine
// Referenz wuerde schon beim Registrieren aufgeloest und waere dann noch nicht da.
document.getElementById("savePrayerBtn").addEventListener("click", () => savePrayerFromInline());
document.getElementById("prayerInput").addEventListener("keydown", e => { if (e.key === "Enter") savePrayerFromInline(); });

let prayerAddType = "bitte";
function updatePrayerTypeButtons() {
  document.getElementById("prayerTypeBitte").classList.toggle("toggle-minimal-active", prayerAddType === "bitte");
  document.getElementById("prayerTypeDank").classList.toggle("toggle-minimal-active", prayerAddType === "dank");
}
document.getElementById("prayerTypeBitte").addEventListener("click", () => { prayerAddType = "bitte"; updatePrayerTypeButtons(); });
document.getElementById("prayerTypeDank").addEventListener("click", () => { prayerAddType = "dank"; updatePrayerTypeButtons(); });
updatePrayerTypeButtons();

document.getElementById("todayLabel").textContent =
  new Date().toLocaleDateString("de-DE", { weekday: "long" }) + ", " + formatDatum(todayStr());

// ---------- Modal helper ----------
const overlay = document.getElementById("modalOverlay");
const modalBody = document.getElementById("modalBody");

// Markiert ein Pflichtfeld sichtbar und nennt den Grund, statt den Speichern-Klick verpuffen zu
// lassen. Die Markierung verschwindet, sobald wieder getippt wird.
function markiereFehlendesFeld(feld, text) {
  feld.classList.add("feld-fehlt");
  feld.focus();
  const feldBlock = feld.closest(".field") || feld.parentElement;
  let hinweis = feldBlock.querySelector(".feld-fehler");
  if (!hinweis) {
    hinweis = document.createElement("p");
    hinweis.className = "feld-fehler";
    feldBlock.appendChild(hinweis);
  }
  hinweis.textContent = text;
  feld.addEventListener("input", () => {
    feld.classList.remove("feld-fehlt");
    hinweis.remove();
  }, { once: true });
}

// Merkt sich, was vor dem Dialog den Fokus hatte, damit er danach dorthin zurueckkehrt.
let fokusVorDialog = null;
// Scrollstand der Seite, solange ein Dialog sie festhaelt.
let gemerkterScroll = 0;

// Alles, was in einem Dialog anspringbar ist -- in Dokumentreihenfolge.
function dialogZiele() {
  return [...modalBody.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter(el => el.offsetParent !== null || el === document.activeElement);
}

function openModal(html, onMount, mode = "dialog") {
  fokusVorDialog = document.activeElement;
  overlay.classList.toggle("dialog-mode", mode === "dialog");
  modalBody.innerHTML = mode === "sheet" ? '<div class="modal-grabber"></div>' + html : html;
  overlay.classList.remove("hidden");
  // Ein Dialog muss sich auch als solcher zu erkennen geben: sonst liest eine Vorlesestimme
  // einfach durch die Seite dahinter weiter, weil das hier fuer sie nur ein sichtbar gewordenes
  // div ist.
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  const ueberschrift = modalBody.querySelector("h2, h3");
  if (ueberschrift) {
    if (!ueberschrift.id) ueberschrift.id = "dialogTitel";
    overlay.setAttribute("aria-labelledby", ueberschrift.id);
  } else {
    overlay.removeAttribute("aria-labelledby");
  }
  // Seite dahinter festhalten. Ohne das scrollt die Liste unter dem Dialog mit, und nach dem
  // Schliessen steht man woanders als vorher. scrollTop wird gemerkt und zurueckgesetzt, weil
  // position:fixed den Stand sonst verliert.
  gemerkterScroll = window.scrollY;
  document.body.classList.add("dialog-offen");
  document.body.style.top = `-${gemerkterScroll}px`;

  if (onMount) onMount(modalBody);

  // In den Dialog hinein fokussieren, sonst landet die erste Tabulatortaste in der Kopfzeile
  // dahinter. Ein Eingabefeld zuerst -- da will man ohnehin hin.
  const ziele = dialogZiele();
  const feld = modalBody.querySelector('input:not([type="hidden"]), textarea, select');
  (feld || ziele[0] || modalBody).focus({ preventScroll: true });
}


function closeModal() {
  overlay.classList.add("hidden");
  overlay.removeAttribute("role");
  overlay.removeAttribute("aria-modal");
  overlay.removeAttribute("aria-labelledby");
  modalBody.innerHTML = "";
  currentDaySheetKey = null;
  document.body.classList.remove("dialog-offen");
  document.body.style.top = "";
  window.scrollTo(0, gemerkterScroll);
  // Zurueck zu dem Element, von dem aus geoeffnet wurde -- sonst faengt man nach dem Schliessen
  // wieder ganz oben an.
  if (fokusVorDialog && document.contains(fokusVorDialog)) {
    fokusVorDialog.focus({ preventScroll: true });
  }
  fokusVorDialog = null;
}
overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(); });
// Escape schliesst, Enter in einem einzeiligen Feld speichert — vorher ging beides nur mit der Maus
// bzw. gar nicht, waehrend das Gebets-Eingabefeld Enter laengst konnte (dieselbe App, zwei Regeln).
document.addEventListener("keydown", e => {
  if (overlay.classList.contains("hidden")) return;
  if (e.key === "Escape") { e.preventDefault(); closeModal(); return; }
  // Fokusfang: der Tabulator laeuft im Kreis durch den Dialog, statt hinter ihn zu wandern.
  if (e.key === "Tab") {
    const ziele = dialogZiele();
    if (!ziele.length) { e.preventDefault(); return; }
    const erstes = ziele[0], letztes = ziele[ziele.length - 1];
    if (!modalBody.contains(document.activeElement)) {
      e.preventDefault(); (e.shiftKey ? letztes : erstes).focus();
    } else if (e.shiftKey && document.activeElement === erstes) {
      e.preventDefault(); letztes.focus();
    } else if (!e.shiftKey && document.activeElement === letztes) {
      e.preventDefault(); erstes.focus();
    }
    return;
  }
  if (e.key === "Enter" && !e.shiftKey && e.target.tagName === "INPUT" && e.target.type !== "date" && e.target.type !== "time") {
    const speichern = modalBody.querySelector("#mSave");
    if (speichern) { e.preventDefault(); speichern.click(); }
  }
});
