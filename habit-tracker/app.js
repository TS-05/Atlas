// ---------- Storage ----------
const STORAGE_KEY = "habit-tracker-data-v2";

// ---------- Lebenswissen-Ordnerstruktur (siehe 20_Wissen/Themen/Lebenswissen_Ordnerstruktur.md) ----------
const LEBENSWISSEN = [
  ["Glaube", true, ["Grundlagen des christlichen Glaubens", "Die einzelnen Bibelbücher", "Historischer/kultureller Hintergrund", "Gebet (Formen, Praxis)", "Gemeindeleben & geistliche Gemeinschaft", "Theologische Grundbegriffe"]],
  ["Gesundheit", false, ["Anatomie des Menschen", "Organsysteme", "Ernährung", "Hormone & ihre Wirkung", "Blut & Blutwerte", "Bewegung/Training", "Schlaf", "Erste Hilfe", "Mentale Gesundheit", "Zahnpflege", "Vorsorgeuntersuchungen"]],
  ["Haushalt", false, ["Wäsche", "Kochen", "Putzen", "Ordnung & Organisation", "Reparaturen im Haushalt", "Pflanzen & Garten", "Mülltrennung & Entsorgung"]],
  ["Handwerkliches & Technik im Alltag", false, ["Auto", "Heimnetzwerk/WLAN", "Unterhaltungselektronik", "Kabelmanagement", "Rasieren & Bartpflege", "Selbstschutz", "Selbstverteidigung", "Werkzeugkoffer"]],
  ["Bürokratie & Finanzen", false, ["Ordnersystem für Unterlagen", "Dokumente aufbewahren", "Gehalt/Lohn verstehen", "Steuern", "Versicherungen", "Konten, Sparen, Budget", "Verträge lesen & verstehen", "Behördengänge"]],
  ["Handwerk & Werkstatt", false, ["Elektro", "Holzbearbeitung", "Metallbearbeitung", "Werkstatt-Grundausstattung", "Schweißen", "Kleben", "Nägel & Schrauben", "Technische Zeichnungen", "Anlagen/Installationen", "Gas, Wasser, Sanitär"]],
  ["Zukunft & Karriere", false, ["Karriereplanung", "Softskills", "Hardskills", "Hausbau/Immobilien", "Finanzen & Vermögensaufbau", "Selbstständigkeit", "Lebens-/Zielplanung"]],
  ["Kunst & Kreatives", false, ["Schreiben", "Zeichnen/Malen", "Kunstgeschichte", "Bekannte Künstler", "Kunstrichtungen", "Worldbuilding"]],
  ["Überleben & Sicherheit", false, ["Notfallarten", "Verletzungen erkennen & versorgen", "Outdoor-Grundlagen", "Ausrüstung", "Gefahren – nicht selbst eingreifen", "Notfallkontakte & -plan"]],
  ["Essen & Trinken", false, ["Whisky", "Kaffee", "Wein", "Bier", "Food-Pairing"]],
  ["Digitales Leben & Sicherheit", false, ["Passwort-Sicherheit", "Datenschutz-Grundlagen", "Backups", "Betrugsmaschen erkennen", "Digitale Nachlassplanung"]],
  ["Recht im Alltag", false, ["Mietrecht-Basics", "Kaufrecht/Gewährleistung", "Verkehrsrecht-Basics", "Wichtige Fristen"]],
  ["Beziehungen & Kommunikation", false, ["Kommunikationsgrundlagen", "Konfliktlösung", "Partnerschaft/Ehe-Vorbereitung", "Erziehung/Elternschaft"]],
  ["Reisen", false, ["Reiseplanung & Budget", "Dokumente", "Packen & Ausrüstung", "Sprachliche Basics", "Sicherheit auf Reisen"]],
  ["Umgang mit Behörden & Institutionen", false, ["Wichtige Ämter im Überblick", "Anträge & Fristen", "Widerspruch/Einspruch"]]
];

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch (e) { /* fall through */ }
  }
  return seedData();
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

// ---------- Migration: alte Ziel-Strukturen -> verschachtelte goalNodes ----------
function migrateToGoalNodes(data) {
  if (data.goalNodes) return;

  // Phase-3-Zwischenstand (flache "categories") -> Wurzel-Knoten
  if (data.categories) {
    data.goalNodes = data.categories.map(c => ({ id: c.id, parentId: null, title: c.title, priority: !!c.priority }));
    delete data.categories;
    (data.tasks || []).forEach(t => {
      if (t.categoryId !== undefined) { t.nodeId = t.categoryId; delete t.categoryId; }
      if (typeof t.priority !== "number") t.priority = t.priority === "hoch" ? 5 : 0;
    });
    (data.habits || []).forEach(h => { if (h.categoryId !== undefined) { h.nodeId = h.categoryId; delete h.categoryId; } });
    return;
  }

  if (!data.goals) { data.goalNodes = []; return; }

  // Ursprüngliche verschachtelte Ziel-Hierarchie (lang/mittel/kurz) -> generische verschachtelte Knoten
  const GOAL_TITLE_MAP = {
    "Glaube": "Glaube",
    "Schule & Studium": "Schule",
    "Fitness & Gesundheit": "Gesundheit",
    "Struktur & Routine": "Allgemein",
    "Charakter & Integrität": "Allgemein",
    "Wissen & Weiterbildung": "Bildung"
  };

  const goals = data.goals;
  const idMap = {};
  goals.forEach(g => { idMap[g.id] = uid(); });

  data.goalNodes = goals.map(g => ({
    id: idMap[g.id],
    parentId: g.parentId ? (idMap[g.parentId] || null) : null,
    title: g.level === "long" ? (GOAL_TITLE_MAP[g.title] || g.title) : g.title,
    priority: !!g.priority
  }));

  (data.tasks || []).forEach(t => {
    if (t.nodeId !== undefined) return;
    t.nodeId = t.goalId ? (idMap[t.goalId] || null) : null;
    delete t.goalId;
    if (typeof t.priority !== "number") t.priority = t.priority === "hoch" ? 5 : 0;
    if (t.source === undefined) t.source = "category";
  });

  (data.habits || []).forEach(h => {
    if (h.nodeId !== undefined) return;
    h.nodeId = h.goalId ? (idMap[h.goalId] || null) : null;
    delete h.goalId;
  });

  delete data.goals;
}

let state = loadData();
migrateToGoalNodes(state);
state.subjects = state.subjects || [];
state.exams = state.exams || [];
state.workShifts = state.workShifts || [];
state.deviations = state.deviations || [];
state.weeklyReflection = state.weeklyReflection || {};
state.prayers = state.prayers || [];
saveData();

const expandedNodes = new Set(); // Laufzeit-Status des Bereiche-Akkordeons (nicht persistiert)

// ---------- Seed data ----------
function seedData() {
  const data = { goalNodes: [], tasks: [], habits: [], subjects: [], exams: [], workShifts: [], deviations: [], weeklyReflection: {}, prayers: [] };
  const c = (title, parentId = null, priority = false) => {
    const id = uid();
    data.goalNodes.push({ id, parentId, title, priority });
    return id;
  };
  const h = (title, nodeId, frequency = "daily", extra = {}) => {
    data.habits.push({
      id: uid(), title, nodeId, history: {}, createdAt: new Date().toISOString(), frequency,
      routineOrder: extra.routineOrder ?? null,
      type: extra.type || "check"
    });
  };
  const t = (title, nodeId, dueDate, size = "klein", priority = 0) => {
    data.tasks.push({ id: uid(), title, nodeId, dueDate, dueTime: null, done: false, completedAt: null, createdAt: new Date().toISOString(), size, priority, source: "category" });
  };
  const s = (title) => { data.subjects.push({ id: uid(), title }); };

  const rootId = {};
  LEBENSWISSEN.forEach(([title, priority, subs]) => {
    const id = c(title, null, priority);
    rootId[title] = id;
    subs.forEach(sub => c(sub, id));
  });

  const glaube = rootId["Glaube"];
  h("Bibellese / stille Zeit", glaube, "daily", { routineOrder: 4 });
  h("Abendlektüre 30 Min. vor dem Schlafen", glaube, "daily", { routineOrder: 8 });
  t("Glaubenskurs \"Fest gegründet\" fertigstellen (~1,5 Std. Restaufwand)", glaube, null, "gross", 5);

  const gesundheit = rootId["Gesundheit"];
  h("Joggen 5,5 km", gesundheit, "daily", { routineOrder: 5 });
  h("Ernährung im Rahmen (max. 2.000 kcal)", gesundheit, "daily", { routineOrder: 10 });

  const zukunft = rootId["Zukunft & Karriere"];
  h("Lernen / Schularbeit 60–90 Min.", zukunft, "weekdays", { routineOrder: 6 });
  t("Bewerbungen duales Studium abschicken", zukunft, "2026-07-13", "gross", 5);
  t("Seminararbeit Physik in Filmen fertigstellen", zukunft, null, "gross");
  s("Englisch");
  s("Deutsch");
  s("BWL");
  s("Mathe");

  // Reine Tagesroutine-Habits ohne Wissensbereich (persönlicher Alltag, kein Lernthema)
  h("Pünktlich aufstehen", null, "daily", { routineOrder: 1 });
  h("Bett gemacht & Gewicht", null, "daily", { routineOrder: 2, type: "weight" });
  h("Handy weglegen 21:30", null, "daily", { routineOrder: 7 });
  h("Skin Care & Anziehen", null, "daily", { routineOrder: 3 });
  h("Tag im Griff", null, "daily", { routineOrder: 9 });
  h("Lesen (ca. 1 Buch/Monat)", rootId["Kunst & Kreatives"], "daily");

  return data;
}

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
    dots: [[17,3,0.8],[2,17,1]] }
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
function splatSvg(id) {
  const s = splatFor(id);
  return `<svg width="18" height="18" viewBox="0 0 20 20" style="overflow:visible;">
    <g transform="translate(10 10) scale(${s.scale}) rotate(${s.rot}) translate(-10 -10)">
      <path d="${s.path}" fill="url(#goldGradRing)" filter="url(#inkRough)"/>
      ${s.dots.map(d => `<circle cx="${d.cx}" cy="${d.cy}" r="${d.r}" fill="url(#goldGradRing)"/>`).join("")}
    </g>
  </svg>`;
}
function pieSlicePath(pct) {
  const cx = 20, cy = 20, R = 30;
  if (pct >= 99.5) return "M0,0 H40 V40 H0 Z";
  if (pct <= 0.5) return `M${cx},${cy} L${cx},${cy - R} Z`;
  const endDeg = -90 + pct * 3.6;
  const endRad = endDeg * Math.PI / 180;
  const ex = (cx + R * Math.cos(endRad)).toFixed(2);
  const ey = (cy + R * Math.sin(endRad)).toFixed(2);
  const largeArc = pct > 50 ? 1 : 0;
  return `M${cx},${cy} L${cx},${cy - R} A${R},${R} 0 ${largeArc} 1 ${ex},${ey} Z`;
}

// ---------- Tabs ----------
const TAB_ORDER = ["heute", "todo", "zielbereiche", "gebete", "analyse"];
const TAB_ROT = [-6, 10, -12, 7, -4];
const TAB_SCALE = [1.05, 0.92, 1.1, 0.95, 1.02];
const tabBtns = Array.from(document.querySelectorAll(".tab-btn"));
const tabIndicator = document.getElementById("tabIndicator");
const tabIndicatorPath = document.getElementById("tabIndicatorPath");

function positionTabIndicator(idx, animateDrop) {
  const leftPct = (idx + 0.5) / TAB_ORDER.length * 100;
  tabIndicator.style.left = `calc(${leftPct}% - 28px)`;
  const s = TAB_SPLATS[idx % TAB_SPLATS.length];
  const scale = TAB_SCALE[idx] || 1;
  const rot = TAB_ROT[idx] || 0;
  const apply = () => {
    tabIndicatorPath.setAttribute("d", s.path);
    tabIndicatorPath.setAttribute("transform", `translate(10 10) scale(${scale}) rotate(${rot}) translate(-10 -10)`);
  };
  if (animateDrop) {
    tabIndicator.style.transform = "scale(0.4)";
    tabIndicator.style.opacity = "0.85";
    setTimeout(() => {
      apply();
      tabIndicator.style.transform = "scale(1)";
      tabIndicator.style.opacity = "1";
    }, 180);
  } else {
    apply();
  }
}

function switchTab(tabName) {
  const idx = TAB_ORDER.indexOf(tabName);
  tabBtns.forEach(b => b.classList.toggle("active", b.dataset.tab === tabName));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  document.getElementById("tab-" + tabName).classList.add("active");
  document.body.dataset.tab = tabName;
  positionTabIndicator(idx, true);
  quickAddVisible = false;
  updateHeaderPlusButton();
  renderAll();
}

tabBtns.forEach(btn => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});
document.body.dataset.tab = "heute";
positionTabIndicator(0, false);

// ---------- Kopfzeile: kontextabhängiger Plus-Button ----------
const QUICK_ADD_BTN_IDS = { heute: ["addRoutineBtn", "addHabitBtn"], todo: ["addTaskBtn"] };
let quickAddVisible = false;
Object.values(QUICK_ADD_BTN_IDS).flat().forEach(id => {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
});

function updateHeaderPlusButton() {
  const tab = document.body.dataset.tab;
  const ids = QUICK_ADD_BTN_IDS[tab];
  if (ids) ids.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = quickAddVisible ? "" : "none"; });
  const prayerCard = document.getElementById("prayerAddCard");
  if (prayerCard) prayerCard.style.display = (tab === "gebete" && quickAddVisible) ? "flex" : "none";
}

document.getElementById("headerPlusBtn").addEventListener("click", () => {
  const tab = document.body.dataset.tab;
  if (tab === "heute" || tab === "todo") {
    quickAddVisible = !quickAddVisible;
    updateHeaderPlusButton();
  } else if (tab === "zielbereiche") {
    openCategoryModal(null, null);
  } else if (tab === "gebete") {
    quickAddVisible = !quickAddVisible;
    updateHeaderPlusButton();
    if (quickAddVisible) document.getElementById("prayerInput").focus();
  } else if (tab === "analyse") {
    exportWeekReview();
  }
});
document.getElementById("addRoutineBtn").addEventListener("click", () => openHabitModal());
document.getElementById("savePrayerBtn").addEventListener("click", savePrayerFromInline);
document.getElementById("prayerInput").addEventListener("keydown", e => { if (e.key === "Enter") savePrayerFromInline(); });

document.getElementById("todayLabel").textContent = new Date().toLocaleDateString("de-DE", {
  weekday: "long", day: "2-digit", month: "long", year: "numeric"
});

// ---------- Modal helper ----------
const overlay = document.getElementById("modalOverlay");
const modalBody = document.getElementById("modalBody");

function openModal(html, onMount, mode = "dialog") {
  overlay.classList.toggle("dialog-mode", mode === "dialog");
  modalBody.innerHTML = mode === "sheet" ? '<div class="modal-grabber"></div>' + html : html;
  overlay.classList.remove("hidden");
  if (onMount) onMount(modalBody);
}
function closeModal() {
  overlay.classList.add("hidden");
  modalBody.innerHTML = "";
}
overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(); });

// ---------- Zielbereiche: verschachtelte Knoten-Helfer ----------
function nodeById(id) {
  return state.goalNodes.find(n => n.id === id);
}
function childNodes(parentId) {
  return state.goalNodes.filter(n => n.parentId === parentId);
}
function tasksForNode(nodeId) {
  return state.tasks.filter(t => t.nodeId === nodeId);
}
// Nur Aufgaben, die direkt im Bereiche-Baum angelegt wurden (nicht ToDo-Aufgaben, die nur informativ zugeordnet sind)
function categoryTasksForNode(nodeId) {
  return state.tasks.filter(t => t.nodeId === nodeId && t.source === "category");
}
function habitsForNode(nodeId) {
  return state.habits.filter(h => h.nodeId === nodeId);
}
function isPriority(nodeId) {
  let n = nodeById(nodeId);
  while (n) {
    if (n.priority) return true;
    n = n.parentId ? nodeById(n.parentId) : null;
  }
  return false;
}
function nodeProgress(node) {
  const tasks = categoryTasksForNode(node.id);
  const habits = habitsForNode(node.id);
  const children = childNodes(node.id);
  const parts = [];
  if (tasks.length) parts.push(tasks.filter(t => t.done).length / tasks.length);
  if (habits.length) {
    const rates = habits.map(h => habitCompletionRate(h));
    parts.push(rates.reduce((a, b) => a + b, 0) / rates.length);
  }
  if (children.length) {
    const progresses = children.map(nodeProgress);
    parts.push(progresses.reduce((a, b) => a + b, 0) / progresses.length);
  }
  if (parts.length === 0) return 0;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}
function nodePath(nodeId) {
  const path = [];
  let n = nodeById(nodeId);
  while (n) {
    path.unshift(n);
    n = n.parentId ? nodeById(n.parentId) : null;
  }
  return path;
}
function allNodesFlat() {
  const result = [];
  function walk(parentId, depth) {
    childNodes(parentId).forEach(n => {
      result.push({ node: n, depth });
      walk(n.id, depth + 1);
    });
  }
  walk(null, 0);
  return result;
}
function nodeOptionsHtml() {
  return allNodesFlat().map(({ node, depth }) =>
    `<option value="${node.id}">${"　".repeat(depth)}${escapeHtml(node.title)}</option>`
  ).join("");
}
function removeNode(nodeId) {
  childNodes(nodeId).forEach(c => removeNode(c.id));
  state.goalNodes = state.goalNodes.filter(n => n.id !== nodeId);
  state.tasks.forEach(t => { if (t.nodeId === nodeId) t.nodeId = null; });
  state.habits.forEach(h => { if (h.nodeId === nodeId) h.nodeId = null; });
  expandedNodes.delete(nodeId);
}

function isScheduledToday(habit, dateObj = new Date()) {
  if (habit.frequency === "weekdays") {
    const day = dateObj.getDay(); // 0 So, 6 Sa
    return day >= 1 && day <= 5;
  }
  if (habit.frequency === "interval") {
    const n = habit.intervalDays || 1;
    const createdKey = new Date(habit.createdAt).toISOString().slice(0, 10);
    const dateKey = dateObj.toISOString().slice(0, 10);
    const diffDays = Math.round((dateFromKey(dateKey) - dateFromKey(createdKey)) / 86400000);
    return diffDays >= 0 && diffDays % n === 0;
  }
  if (habit.frequency === "weekly-on") {
    const weekday = habit.weekday ?? 0;
    if (dateObj.getDay() !== weekday) return false;
    const n = habit.everyNWeeks || 1;
    const weeksSince = Math.floor((mondayOfWeek(dateObj) - mondayOfWeek(new Date(habit.createdAt))) / (7 * 86400000));
    return weeksSince >= 0 && weeksSince % n === 0;
  }
  return true;
}

function habitCompletionRate(habit, days = 30) {
  let total = 0, done = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (new Date(habit.createdAt) > d) continue;
    if (!isScheduledToday(habit, d)) continue;
    const key = d.toISOString().slice(0, 10);
    total++;
    if (habit.history[key]) done++;
  }
  return total === 0 ? 0 : done / total;
}

function computeStreak(habit) {
  let streak = 0;
  let d = new Date();
  if (!habit.history[todayStr()] && isScheduledToday(habit, d)) {
    d.setDate(d.getDate() - 1);
  }
  while (true) {
    if (!isScheduledToday(habit, d)) {
      d.setDate(d.getDate() - 1);
      continue;
    }
    const key = d.toISOString().slice(0, 10);
    if (habit.history[key]) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

function frequencyLabel(habit) {
  if (habit.frequency === "weekdays") return "Mo–Fr";
  if (habit.frequency === "interval") return `alle ${habit.intervalDays || 1} Tage`;
  if (habit.frequency === "weekly-on") return `alle ${habit.everyNWeeks || 1} Wo. ${WEEKDAY_LABELS[((habit.weekday ?? 0) + 6) % 7] || ""}`.trim();
  return "täglich";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Rendering: ToDo / Bereiche-Aufgaben (gemeinsame Zeile) ----------
function renderTaskItem(t) {
  const today = todayStr();
  const overdue = !t.done && t.dueDate && t.dueDate < today;
  const node = nodeById(t.nodeId);
  const metaParts = [t.size === "gross" ? "Groß" : "Klein"];
  if (t.dueDate) metaParts.push("fällig " + t.dueDate + (t.dueTime ? " " + t.dueTime : ""));
  if (node) metaParts.push(node.title);
  const el = document.createElement("div");
  el.className = "atlas-row" + (t.done ? " done" : "");
  el.innerHTML = `
    <button class="atlas-check${t.done ? " checked" : ""}" data-task="${t.id}">${t.done ? splatSvg(t.id) : ""}</button>
    <div style="flex:1; min-width:0;">
      <div class="item-title">${escapeHtml(t.title)}</div>
      <div class="item-meta">${escapeHtml(metaParts.join(" · "))}</div>
    </div>
    ${t.priority > 0 ? `<span class="atlas-chip" style="background:var(--color-accent-900); color:var(--color-accent-300);">P${t.priority}</span>` : ""}
    ${overdue ? '<span class="atlas-chip" style="background:var(--color-accent-900); color:var(--color-accent-300);">ÜBERFÄLLIG</span>' : ""}
    <button class="btn btn-icon btn-ghost" data-del-task="${t.id}" aria-label="Löschen"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 1.5L11.5 11.5M11.5 1.5L1.5 11.5" stroke="var(--color-neutral-500)" stroke-width="1.4" stroke-linecap="round"/></svg></button>
  `;
  return el;
}

function renderTodo() {
  const wrap = document.getElementById("todoList");
  wrap.innerHTML = "";

  const todoTasks = state.tasks.filter(t => (t.source || "todo") !== "category");

  const today = todayStr();
  const openTodayTasks = todoTasks.filter(t => t.dueDate === today && !t.done);
  const budgetUsed = openTodayTasks.reduce((sum, t) => sum + (t.size === "gross" ? 2 : 1), 0);
  const ruleEl = document.getElementById("dayRule");
  ruleEl.textContent = `Regel: 2 kleine oder 1 große Aufgabe/Tag · heute fällig: ${openTodayTasks.length} (Budget ${budgetUsed}/2)`;
  ruleEl.classList.toggle("over", budgetUsed > 2);

  const openTasks = todoTasks
    .filter(t => !t.done)
    .sort((a, b) => {
      const ad = a.dueDate || "9999-99-99", bd = b.dueDate || "9999-99-99";
      if (ad !== bd) return ad.localeCompare(bd);
      return (b.priority || 0) - (a.priority || 0);
    });
  const doneTasks = todoTasks.filter(t => t.done);

  if (openTasks.length === 0 && doneTasks.length === 0) {
    wrap.innerHTML = '<div class="empty-hint">Noch keine Aufgaben angelegt.</div>';
    return;
  }
  openTasks.forEach(t => wrap.appendChild(renderTaskItem(t)));
  doneTasks.forEach(t => wrap.appendChild(renderTaskItem(t)));
}

// ---------- Rendering: Heute (Wochenkreis, Abweichung, Routine, weitere Habits) ----------
const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function mondayOfWeek(dateObj) {
  const d = new Date(dateObj);
  const offset = (d.getDay() + 6) % 7; // Mo=0 ... So=6
  d.setDate(d.getDate() - offset);
  return d;
}

function renderWeekCircle() {
  const wrap = document.getElementById("weekCircle");
  wrap.innerHTML = "";
  const today = new Date();
  const monday = mondayOfWeek(today);
  const todayKey = todayStr();

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const isFuture = key > todayKey;
    const isToday = key === todayKey;

    const scheduled = state.habits.filter(h => new Date(h.createdAt) <= d && isScheduledToday(h, d));
    const done = scheduled.filter(h => h.history[key]).length;
    const pct = scheduled.length ? Math.round((done / scheduled.length) * 100) : null;

    const maskUrl = `assets/ring-mask-${i + 1}.png`;
    const clip = pieSlicePath(pct === null ? 0 : pct);

    const el = document.createElement("div");
    el.className = "week-circle-day" + (isToday ? " is-today" : "") + (isFuture ? " is-future" : "");
    el.title = `${key}: ${scheduled.length ? done + "/" + scheduled.length + " Habits" : "keine Habits fällig"}`;
    el.innerHTML = `
      <div class="week-ring">
        <div class="week-ring-dim" style="background-image:url('${maskUrl}')"></div>
        <div class="week-ring-lit-wrap" style="clip-path: path('${clip}');">
          <div class="week-ring-lit" style="background-image:url('${maskUrl}')"></div>
        </div>
        <div class="week-ring-shine"></div>
        <div class="week-ring-label">${pct === null ? "–" : pct + "%"}</div>
      </div>
      <div class="week-circle-day-label">${WEEKDAY_LABELS[i]}</div>
    `;
    wrap.appendChild(el);
  }
}

function renderDeviationLog() {
  const listWrap = document.getElementById("deviationList");
  const today = todayStr();
  const todays = state.deviations.filter(d => d.date === today).sort((a, b) => a.time.localeCompare(b.time));
  listWrap.innerHTML = todays.length
    ? todays.map(d => `
        <div class="deviation-entry">
          <span class="deviation-time">${d.time}</span>
          <span class="deviation-text">${escapeHtml(d.text)}</span>
          <button class="btn btn-icon btn-ghost" data-del-deviation="${d.id}" aria-label="Löschen"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 1.5L10.5 10.5M10.5 1.5L1.5 10.5" stroke="var(--color-neutral-500)" stroke-width="1.4" stroke-linecap="round"/></svg></button>
        </div>
      `).join("")
    : '<div class="empty-hint">Heute noch keine Abweichung eingetragen.</div>';
}

function addDeviation(text) {
  if (!text.trim()) return;
  const now = new Date();
  state.deviations.push({
    id: uid(),
    date: todayStr(),
    time: now.toTimeString().slice(0, 5),
    text: text.trim()
  });
  saveData();
  renderAll();
}

const LEARNING_ROUTINE_ORDER = 6;
const SUBJECT_ROTATION_EPOCH = new Date(2026, 0, 1);

function dateFromKey(key) {
  return new Date(key + "T00:00:00");
}

function subjectOfDay(dateObj) {
  if (!state.subjects.length) return null;
  const diffDays = Math.floor((dateObj - SUBJECT_ROTATION_EPOCH) / 86400000);
  const idx = ((diffDays % state.subjects.length) + state.subjects.length) % state.subjects.length;
  return state.subjects[idx];
}

function examOverride(dateObj) {
  const todayMidnight = dateFromKey(dateObj.toISOString().slice(0, 10));
  const upcoming = state.exams
    .map(e => ({ ...e, subject: state.subjects.find(s => s.id === e.subjectId) }))
    .filter(e => e.subject)
    .map(e => ({ ...e, daysUntil: Math.round((dateFromKey(e.date) - todayMidnight) / 86400000) }))
    .filter(e => e.daysUntil >= 0 && e.daysUntil <= 4)
    .sort((a, b) => a.daysUntil - b.daysUntil);
  return upcoming[0] || null;
}

function renderRoutineChain() {
  const wrap = document.getElementById("routineChain");
  wrap.innerHTML = "";
  const today = todayStr();
  const now = new Date();

  const chainHabits = state.habits
    .filter(h => h.routineOrder != null && isScheduledToday(h, now))
    .sort((a, b) => a.routineOrder - b.routineOrder);

  if (chainHabits.length === 0) {
    wrap.innerHTML = '<div class="empty-hint">Keine Routine-Schritte für heute konfiguriert.</div>';
    return;
  }

  chainHabits.forEach(h => {
    const rawValue = h.history[today];
    const doneToday = h.type === "weight" ? (rawValue !== undefined && rawValue !== null) : !!rawValue;

    let noteHtml = "";
    if (h.routineOrder === LEARNING_ROUTINE_ORDER) {
      const override = examOverride(now);
      if (override) {
        noteHtml = `<div class="routine-step-note">Ganztägig lernen für <strong>${escapeHtml(override.subject.title)}</strong> — Klassenarbeit am ${override.date}</div>`;
      } else {
        const subj = subjectOfDay(now);
        if (subj) {
          noteHtml = `<div class="routine-step-note">Heutiges Hauptfach: <strong>${escapeHtml(subj.title)}</strong></div>`;
        }
      }
    }

    const controlHtml = h.type === "weight"
      ? `<input type="number" step="0.1" min="0" inputmode="decimal" class="input" style="width:72px; height:34px; padding:6px 8px; text-align:right;" data-weight-habit="${h.id}" placeholder="kg" value="${rawValue !== undefined && rawValue !== null ? rawValue : ""}">`
      : `<button class="atlas-check${doneToday ? " checked" : ""}" data-habit="${h.id}">${doneToday ? splatSvg(h.id) : ""}</button>`;

    const el = document.createElement("div");
    el.className = "atlas-row" + (doneToday ? " done" : "");
    el.dataset.type = h.type;
    el.innerHTML = `
      ${h.type === "weight" ? "" : controlHtml}
      <div style="flex:1; min-width:0;">
        <div class="item-title">${escapeHtml(h.title)}</div>
        ${noteHtml}
      </div>
      ${h.type === "weight" ? controlHtml : ""}
    `;
    wrap.appendChild(el);
  });
}

function shiftForDate(dateKey) {
  return state.workShifts.find(s => s.date === dateKey) || null;
}

function renderWorkShiftBanner() {
  const wrap = document.getElementById("workShiftBanner");
  const shift = shiftForDate(todayStr());
  if (!shift) {
    wrap.innerHTML = `<button class="btn btn-ghost btn-block" id="addWorkShiftBtn">+ Arbeitsschicht für heute eintragen</button>`;
  } else {
    wrap.innerHTML = `
      <div class="gold-frame rule-banner shift-banner" style="justify-content:space-between;">
        <span>Arbeit heute: ${shift.start}–${shift.end}${shift.label ? " · " + escapeHtml(shift.label) : ""}</span>
        <button class="btn btn-icon btn-ghost" data-del-shift="${shift.id}" aria-label="Löschen"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 1.5L10.5 10.5M10.5 1.5L1.5 10.5" stroke="var(--color-neutral-500)" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
    `;
  }
  const addBtn = document.getElementById("addWorkShiftBtn");
  if (addBtn) addBtn.addEventListener("click", () => openWorkShiftModal(todayStr()));
}

function renderOtherHabits() {
  const habitWrap = document.getElementById("todayHabits");
  habitWrap.innerHTML = "";
  const now = new Date();
  const dueHabits = state.habits.filter(h => isScheduledToday(h, now) && h.routineOrder == null);
  const today = todayStr();
  if (dueHabits.length === 0) {
    habitWrap.innerHTML = '<div class="empty-hint">Keine weiteren Gewohnheiten heute fällig.</div>';
  }
  dueHabits.forEach(h => {
    const doneToday = !!h.history[today];
    const streak = computeStreak(h);
    const priority = isPriority(h.nodeId);
    const el = document.createElement("div");
    el.className = "atlas-row" + (doneToday ? " done" : "");
    el.innerHTML = `
      <button class="atlas-check${doneToday ? " checked" : ""}" data-habit="${h.id}">${doneToday ? splatSvg(h.id) : ""}</button>
      <div style="flex:1; min-width:0;">
        <div class="item-title">${escapeHtml(h.title)}</div>
        <div class="item-meta">${frequencyLabel(h)} · Serie: ${streak}</div>
      </div>
      ${priority ? '<span class="atlas-chip" style="background:var(--color-accent-900); color:var(--color-accent-300);">Priorität</span>' : ""}
      <button class="btn btn-icon btn-ghost" data-del-habit="${h.id}" aria-label="Löschen"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 1.5L11.5 11.5M11.5 1.5L1.5 11.5" stroke="var(--color-neutral-500)" stroke-width="1.4" stroke-linecap="round"/></svg></button>
    `;
    habitWrap.appendChild(el);
  });
}

// ---------- Rendering: Bereiche (Akkordeon-Baum) ----------
function renderGoalBrowser() {
  const wrap = document.getElementById("goalTree");
  wrap.innerHTML = "";
  const roots = childNodes(null);
  if (roots.length === 0) {
    wrap.innerHTML = '<div class="empty-hint">Noch keine Bereiche angelegt.</div>';
    return;
  }
  roots.forEach(node => wrap.appendChild(renderTreeNode(node, 0)));
}

function renderTreeNode(node, depth) {
  const expanded = expandedNodes.has(node.id);
  const pct = Math.round(nodeProgress(node) * 100);
  const children = childNodes(node.id);
  const tasks = categoryTasksForNode(node.id);
  const priority = isPriority(node.id);

  const wrap = document.createElement("div");
  wrap.className = "card elev-sm goal-node" + (priority ? " gold-frame" : "") + (expanded ? " expanded" : "");
  wrap.style.setProperty("--depth", depth);
  wrap.style.padding = "0";

  const header = document.createElement("button");
  header.className = "goal-node-header";
  header.style.width = "100%";
  header.style.background = "none";
  header.style.border = "none";
  header.style.color = "inherit";
  header.style.font = "inherit";
  header.style.textAlign = "left";
  header.style.cursor = "pointer";
  header.dataset.toggleNode = node.id;
  header.innerHTML = `
    <div class="goal-node-header-left">
      <svg class="goal-node-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="var(--color-neutral-400)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <div class="card-title" style="font-size:14px;">${escapeHtml(node.title)}</div>
    </div>
    <div class="atlas-chip" style="background:var(--color-accent-900); color:var(--color-accent-300);">${pct}%</div>
  `;
  wrap.appendChild(header);
  const meta = document.createElement("div");
  meta.className = "goal-node-meta";
  meta.textContent = `${children.length} Unterordner, ${tasks.length} Aufgabe(n)`;
  wrap.appendChild(meta);

  if (expanded) {
    if (tasks.length || children.length) {
      const body = document.createElement("div");
      body.className = "goal-node-body";
      tasks.forEach(t => body.appendChild(renderTaskItem(t)));
      wrap.appendChild(body);
    }
    if (children.length) {
      const childrenWrap = document.createElement("div");
      childrenWrap.className = "goal-node-children";
      children.forEach(child => childrenWrap.appendChild(renderTreeNode(child, depth + 1)));
      wrap.appendChild(childrenWrap);
    }

    const actionsRow = document.createElement("div");
    actionsRow.className = "goal-node-add-row";
    actionsRow.innerHTML = `
      <button class="btn btn-ghost" data-add-subfolder="${node.id}">+ Unterordner</button>
      <button class="btn btn-ghost" data-add-task-category="${node.id}">+ Aufgabe hier</button>
      <button class="btn btn-icon btn-ghost" data-edit-category="${node.id}" title="Umbenennen"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 11.5l1-3.5 6-6 2.5 2.5-6 6-3.5 1z" stroke="var(--color-neutral-400)" stroke-width="1.2" stroke-linejoin="round"/></svg></button>
      <button class="btn btn-icon btn-ghost" data-decompose-category="${node.id}" title="Aufgaben vorschlagen">···</button>
      <button class="btn btn-icon btn-ghost" data-del-category="${node.id}" aria-label="Löschen"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 1.5L11.5 11.5M11.5 1.5L1.5 11.5" stroke="var(--color-neutral-500)" stroke-width="1.4" stroke-linecap="round"/></svg></button>
    `;
    wrap.appendChild(actionsRow);
  }

  return wrap;
}

// ---------- Rendering: Woche ----------
function renderWeekStats() {
  const grid = document.getElementById("statsGrid");
  const totalTasks = state.tasks.length;
  const doneTasks = state.tasks.filter(t => t.done).length;
  const longestStreak = state.habits.reduce((max, h) => Math.max(max, computeStreak(h)), 0);

  grid.innerHTML = `
    <div class="stat-box"><div class="stat-num">${childNodes(null).length}</div><div class="stat-label">Zielbereiche</div></div>
    <div class="stat-box"><div class="stat-num">${doneTasks}/${totalTasks}</div><div class="stat-label">Aufgaben erledigt</div></div>
    <div class="stat-box"><div class="stat-num">${state.habits.length}</div><div class="stat-label">Gewohnheiten</div></div>
    <div class="stat-box"><div class="stat-num">${longestStreak}</div><div class="stat-label">Längste Serie</div></div>
  `;

  const completed = state.tasks.filter(t => t.done && t.completedAt);
  let onTime = 0;
  completed.forEach(t => { if (isOnTime(t)) onTime++; });
  const pct = completed.length ? Math.round((onTime / completed.length) * 100) : 0;
  document.getElementById("punctualityFill").style.width = pct + "%";
  document.getElementById("punctualityText").textContent =
    completed.length ? `${onTime} von ${completed.length} erledigten Aufgaben pünktlich (${pct}%)` : "Noch keine erledigten Aufgaben mit Termin.";

  renderActivityHeatmap();
  renderAreaLoad();
  renderMoreStats();
  renderReflection();
}

function taskCompletionRateInWindow(days) {
  const cutoff = todayStr(-days);
  const relevant = state.tasks.filter(t => t.createdAt && t.createdAt.slice(0, 10) >= cutoff);
  if (relevant.length === 0) return null;
  return relevant.filter(t => t.done).length / relevant.length;
}

function weightTrend() {
  const weightHabit = state.habits.find(h => h.type === "weight");
  if (!weightHabit) return null;
  const entries = Object.entries(weightHabit.history)
    .filter(([, v]) => typeof v === "number")
    .sort((a, b) => a[0].localeCompare(b[0]));
  if (entries.length === 0) return null;
  const latest = entries[entries.length - 1][1];
  if (entries.length === 1) return { latest, arrow: "–" };
  const prev = entries[entries.length - 2][1];
  const arrow = latest > prev ? "↑" : latest < prev ? "↓" : "–";
  return { latest, arrow };
}

function renderMoreStats() {
  const wrap = document.getElementById("moreStats");
  if (!wrap) return;

  const rate7 = taskCompletionRateInWindow(7);
  const rate30 = taskCompletionRateInWindow(30);
  const rate60 = taskCompletionRateInWindow(60);
  const devCount7 = state.deviations.filter(d => d.date >= todayStr(-7)).length;
  const devCount30 = state.deviations.filter(d => d.date >= todayStr(-30)).length;
  const prayerFulfilled = state.prayers.filter(p => p.status === "fulfilled").length;
  const weight = weightTrend();

  const boxes = [
    { num: rate7 !== null ? Math.round(rate7 * 100) + "%" : "–", label: "Aufgaben erledigt (7 Tage)" },
    { num: rate30 !== null ? Math.round(rate30 * 100) + "%" : "–", label: "Aufgaben erledigt (30 Tage)" },
    { num: rate60 !== null ? Math.round(rate60 * 100) + "%" : "–", label: "Aufgaben erledigt (60 Tage)" },
    { num: devCount7, label: "Abweichungen (7 Tage)" },
    { num: devCount30, label: "Abweichungen (30 Tage)" },
    { num: prayerFulfilled, label: "Erhörungen gesamt" },
    { num: weight ? `${weight.latest} kg ${weight.arrow}` : "–", label: "Gewichtstrend" }
  ];

  wrap.innerHTML = boxes.map(b => `
    <div class="stat-box minor"><div class="stat-num">${b.num}</div><div class="stat-label">${b.label}</div></div>
  `).join("");
}

function habitStatsWindow(habit, days) {
  let total = 0, done = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (new Date(habit.createdAt) > d) continue;
    if (!isScheduledToday(habit, d)) continue;
    total++;
    const key = d.toISOString().slice(0, 10);
    if (habit.history[key]) done++;
  }
  return { total, done, rate: total ? done / total : null };
}

function weekdayDifficulty(days) {
  const totals = Array.from({ length: 7 }, () => ({ total: 0, done: 0 }));
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const wd = (d.getDay() + 6) % 7;
    const key = d.toISOString().slice(0, 10);
    state.habits.forEach(h => {
      if (new Date(h.createdAt) > d) return;
      if (!isScheduledToday(h, d)) return;
      totals[wd].total++;
      if (h.history[key]) totals[wd].done++;
    });
  }
  return totals.map((t, i) => ({
    day: WEEKDAY_LABELS[i],
    total: t.total,
    rate: t.total ? t.done / t.total : null
  }));
}

// ---------- Aktivitäts-Heatmap (letzte 7 Wochen) ----------
function dayCompletionPct(dateObj) {
  const key = dateObj.toISOString().slice(0, 10);
  const scheduled = state.habits.filter(h => new Date(h.createdAt) <= dateObj && isScheduledToday(h, dateObj));
  const done = scheduled.filter(h => h.history[key]).length;
  return scheduled.length ? Math.round((done / scheduled.length) * 100) : null;
}

function renderActivityHeatmap() {
  const wrap = document.getElementById("activityHeatmap");
  if (!wrap) return;
  wrap.innerHTML = "";
  const today = new Date();
  const days = [];
  for (let i = 48; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  days.forEach(d => {
    const pct = dayCompletionPct(d);
    const cell = document.createElement("div");
    cell.className = "heatmap-cell";
    cell.style.background = pct === null
      ? "var(--color-neutral-800)"
      : `color-mix(in oklch, var(--color-accent) ${pct}%, var(--color-neutral-800))`;
    cell.title = `${d.toISOString().slice(0, 10)}${pct === null ? "" : ": " + pct + "%"}`;
    cell.dataset.date = d.toISOString().slice(0, 10);
    wrap.appendChild(cell);
  });
}

function openDaySheet(dateKey) {
  const d = dateFromKey(dateKey);
  const pct = dayCompletionPct(d);
  const weekday = d.toLocaleDateString("de-DE", { weekday: "long" });
  const dateLabel = d.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
  openModal(`
    <h3>${weekday}, ${dateLabel}</h3>
    <p class="card-body">${pct === null ? "Keine Gewohnheiten an diesem Tag fällig." : `Erledigungsquote: ${pct}%`}</p>
  `, null, "sheet");
}

// ---------- Aufgaben je Bereich ----------
function countTasksInSubtree(nodeId) {
  let count = categoryTasksForNode(nodeId).length;
  childNodes(nodeId).forEach(c => { count += countTasksInSubtree(c.id); });
  return count;
}

function renderAreaLoad() {
  const wrap = document.getElementById("areaLoad");
  if (!wrap) return;
  const roots = childNodes(null).map(n => ({ node: n, count: countTasksInSubtree(n.id) }));
  const max = Math.max(1, ...roots.map(r => r.count));
  wrap.innerHTML = roots.length
    ? roots.map(r => `
        <div class="areaload-row">
          <div class="areaload-name">${escapeHtml(r.node.title)}</div>
          <div class="areaload-bar-outer"><div class="areaload-bar-inner" style="width:${Math.round((r.count / max) * 100)}%"></div></div>
          <div class="areaload-count">${r.count}</div>
        </div>
      `).join("")
    : '<div class="empty-hint">Noch keine Bereiche angelegt.</div>';
}

function weekStartKey(dateObj = new Date()) {
  return mondayOfWeek(dateObj).toISOString().slice(0, 10);
}

function renderReflection() {
  const textarea = document.getElementById("reflectionText");
  const key = weekStartKey();
  textarea.dataset.weekKey = key;
  if (document.activeElement !== textarea) {
    textarea.value = state.weeklyReflection[key] || "";
  }
}

function isOnTime(task) {
  if (!task.completedAt) return true;
  if (!task.dueDate) return true;
  const due = new Date(task.dueDate + "T" + (task.dueTime || "23:59"));
  const completed = new Date(task.completedAt);
  return completed <= due;
}

// ---------- Render all ----------
function renderAll() {
  renderWeekCircle();
  renderDeviationLog();
  renderRoutineChain();
  renderWorkShiftBanner();
  renderOtherHabits();
  renderTodo();
  renderGoalBrowser();
  renderPlanning();
  renderPrayers();
  renderWeekStats();
}

// ---------- Event delegation ----------
document.addEventListener("change", e => {
  if (e.target.matches("[data-weight-habit]")) {
    const id = e.target.dataset.weightHabit;
    const habit = state.habits.find(h => h.id === id);
    const key = todayStr();
    const val = e.target.value === "" ? null : parseFloat(e.target.value);
    if (val === null || isNaN(val) || val < 0) delete habit.history[key];
    else habit.history[key] = val;
    saveData();
    renderAll();
  }
  if (e.target.matches("#reflectionText")) {
    const key = e.target.dataset.weekKey || weekStartKey();
    state.weeklyReflection[key] = e.target.value;
    saveData();
  }
});

document.addEventListener("click", e => {
  const taskCheck = e.target.closest("[data-task]");
  if (taskCheck) {
    const task = state.tasks.find(t => t.id === taskCheck.dataset.task);
    task.done = !task.done;
    task.completedAt = task.done ? new Date().toISOString() : null;
    saveData();
    renderAll();
    return;
  }
  const habitCheck = e.target.closest("[data-habit]");
  if (habitCheck) {
    const habit = state.habits.find(h => h.id === habitCheck.dataset.habit);
    const key = todayStr();
    if (habit.history[key]) delete habit.history[key];
    else habit.history[key] = true;
    saveData();
    renderAll();
    return;
  }
  if (e.target.matches("[data-del-task]")) {
    state.tasks = state.tasks.filter(t => t.id !== e.target.dataset.delTask);
    saveData(); renderAll();
  }
  if (e.target.matches("[data-del-habit]")) {
    state.habits = state.habits.filter(h => h.id !== e.target.dataset.delHabit);
    saveData(); renderAll();
  }
  if (e.target.matches("[data-del-category]")) {
    removeNode(e.target.dataset.delCategory);
    saveData(); renderAll();
  }
  if (e.target.matches("[data-edit-category]")) {
    openCategoryModal(nodeById(e.target.dataset.editCategory));
  }
  if (e.target.matches("[data-add-task-category]")) {
    openTaskModal(e.target.dataset.addTaskCategory, "category");
  }
  if (e.target.matches("[data-decompose-category]")) {
    copyDecomposePrompt(e.target.dataset.decomposeCategory, e.target);
  }
  const toggleBtn = e.target.closest("[data-toggle-node]");
  if (toggleBtn) {
    const id = toggleBtn.dataset.toggleNode;
    if (expandedNodes.has(id)) expandedNodes.delete(id); else expandedNodes.add(id);
    renderGoalBrowser();
  }
  if (e.target.matches("[data-add-subfolder]")) {
    openCategoryModal(null, e.target.dataset.addSubfolder);
  }
  if (e.target.matches("[data-del-shift]")) {
    state.workShifts = state.workShifts.filter(s => s.id !== e.target.dataset.delShift);
    saveData(); renderAll();
  }
  if (e.target.matches("[data-del-subject]")) {
    state.subjects = state.subjects.filter(s => s.id !== e.target.dataset.delSubject);
    saveData(); renderAll();
  }
  if (e.target.matches("[data-del-exam]")) {
    state.exams = state.exams.filter(x => x.id !== e.target.dataset.delExam);
    saveData(); renderAll();
  }
  if (e.target.matches("[data-del-deviation]")) {
    state.deviations = state.deviations.filter(d => d.id !== e.target.dataset.delDeviation);
    saveData(); renderAll();
  }
  const fulfilledBtn = e.target.closest("[data-prayer-fulfilled]");
  if (fulfilledBtn) {
    openPrayerFulfillModal(fulfilledBtn.dataset.prayerFulfilled);
  }
  const deferBtn = e.target.closest("[data-prayer-defer]");
  if (deferBtn) {
    const prayer = state.prayers.find(p => p.id === deferBtn.dataset.prayerDefer);
    if (prayer) prayer.deferredCount = (prayer.deferredCount || 0) + 1;
    saveData(); renderAll();
  }
  const irrelevantBtn = e.target.closest("[data-prayer-irrelevant]");
  if (irrelevantBtn) {
    state.prayers = state.prayers.filter(p => p.id !== irrelevantBtn.dataset.prayerIrrelevant);
    saveData(); renderAll();
  }
  const heatmapCell = e.target.closest(".heatmap-cell");
  if (heatmapCell) {
    openDaySheet(heatmapCell.dataset.date);
  }
});

// ---------- Zielbereich-Zerlegung: Copy-Prompt für Chat-Analyse ----------
function buildDecomposePrompt(node) {
  const tasks = categoryTasksForNode(node.id);
  const habits = habitsForNode(node.id);
  const pct = Math.round(nodeProgress(node) * 100);
  const path = nodePath(node.id).map(n => n.title).join(" / ");

  let prompt = `Ich möchte im Zielordner "${path}" konkrete, umsetzbare Aufgaben finden, die mich meinem übergeordneten Ziel näherbringen.\n\n`;
  prompt += `Aktueller Fortschritt: ${pct}%\n`;
  if (node.priority) prompt += `Priorität: ja\n`;

  if (tasks.length) {
    prompt += `\nBereits vorhandene Aufgaben:\n`;
    tasks.forEach(t => { prompt += `- [${t.done ? "x" : " "}] ${t.title}${t.dueDate ? " (fällig " + t.dueDate + ")" : ""}\n`; });
  }
  if (habits.length) {
    prompt += `\nBereits verknüpfte Gewohnheiten:\n`;
    habits.forEach(h => { prompt += `- ${h.title} (${frequencyLabel(h)})\n`; });
  }

  prompt += `\nSchlag mir bitte 3-6 konkrete neue Aufgaben oder Unterordner für diesen Zweig vor.`;
  return prompt;
}

async function copyDecomposePrompt(nodeId, btn) {
  const node = nodeById(nodeId);
  if (!node) return;
  const prompt = buildDecomposePrompt(node);
  try {
    await navigator.clipboard.writeText(prompt);
    flashButton(btn, "✓");
  } catch (e) {
    downloadText(prompt, `Zielbereich_${node.title.replace(/[^a-z0-9]+/gi, "_")}.txt`);
  }
}

function flashButton(btn, tempContent) {
  const original = btn.textContent;
  btn.textContent = tempContent;
  setTimeout(() => { btn.textContent = original; }, 1200);
}

function downloadText(text, filename) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------- Add buttons ----------
document.getElementById("addTaskBtn").addEventListener("click", () => openTaskModal());
document.getElementById("addHabitBtn").addEventListener("click", () => openHabitModal());
document.getElementById("addExamBtn").addEventListener("click", () => openExamModal());
document.getElementById("addDeviationBtn").addEventListener("click", () => {
  const input = document.getElementById("deviationInput");
  addDeviation(input.value);
  input.value = "";
});

function openCategoryModal(node, parentId = null) {
  const isEdit = !!node;
  openModal(`
    <h3>${isEdit ? "Ordner bearbeiten" : "Unterordner hinzufügen"}</h3>
    <div class="field">
      <label>Titel</label>
      <input type="text" id="mCategoryTitle" value="${isEdit ? escapeHtml(node.title) : ""}" placeholder="z.B. Kreativität">
    </div>
    <div class="checkbox-row">
      <input type="checkbox" id="mCategoryPriority" ${isEdit && node.priority ? "checked" : ""}>
      <label for="mCategoryPriority">Priorität (wird hervorgehoben)</label>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Speichern</button>
    </div>
  `, body => {
    body.querySelector("#mCategoryTitle").focus();
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    body.querySelector("#mSave").addEventListener("click", () => {
      const title = body.querySelector("#mCategoryTitle").value.trim();
      if (!title) return;
      const priority = body.querySelector("#mCategoryPriority").checked;
      if (isEdit) {
        node.title = title;
        node.priority = priority;
      } else {
        state.goalNodes.push({ id: uid(), parentId, title, priority });
      }
      saveData();
      closeModal();
      renderAll();
    });
  });
}

function openTaskModal(defaultNodeId, source = "todo") {
  const node = defaultNodeId ? nodeById(defaultNodeId) : null;
  openModal(`
    <h3>${source === "category" ? "Aufgabe in " + escapeHtml(node ? node.title : "Bereich") : "Aufgabe hinzufügen"}</h3>
    <div class="field">
      <label>Titel</label>
      <input type="text" id="mTaskTitle" placeholder="z.B. Bericht abschicken">
    </div>
    <div class="field">
      <label>Fälligkeitsdatum (optional)</label>
      <input type="date" id="mTaskDate" value="${todayStr()}">
    </div>
    <div class="field">
      <label>Uhrzeit (optional)</label>
      <input type="time" id="mTaskTime">
    </div>
    <div class="field">
      <label>Größe (für die Tagesregel: 2 kleine oder 1 große Aufgabe/Tag)</label>
      <select id="mTaskSize">
        <option value="klein">klein</option>
        <option value="gross">groß</option>
      </select>
    </div>
    <div class="field">
      <label>Priorität (0 = keine, 5 = höchste)</label>
      <select id="mTaskPriority">
        <option value="0">0 – keine</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5 – höchste</option>
      </select>
    </div>
    ${source === "category" ? "" : `
    <div class="field">
      <label>Zielbereich (optional, ordnet die Aufgabe zusätzlich dort ein)</label>
      <select id="mTaskCategory">
        <option value="">– keiner –</option>
        ${nodeOptionsHtml()}
      </select>
    </div>`}
    <div class="modal-actions">
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Speichern</button>
    </div>
  `, body => {
    body.querySelector("#mTaskTitle").focus();
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    body.querySelector("#mSave").addEventListener("click", () => {
      const title = body.querySelector("#mTaskTitle").value.trim();
      if (!title) return;
      const dueDate = body.querySelector("#mTaskDate").value || null;
      const dueTime = body.querySelector("#mTaskTime").value || null;
      const size = body.querySelector("#mTaskSize").value;
      const priority = parseInt(body.querySelector("#mTaskPriority").value, 10) || 0;
      const categorySelect = body.querySelector("#mTaskCategory");
      const nodeId = source === "category" ? defaultNodeId : (categorySelect ? categorySelect.value || null : null);
      state.tasks.push({ id: uid(), title, nodeId, dueDate, dueTime, done: false, completedAt: null, createdAt: new Date().toISOString(), size, priority, source });
      saveData();
      closeModal();
      renderAll();
    });
  });
}

function openHabitModal() {
  openModal(`
    <h3>Gewohnheit hinzufügen</h3>
    <div class="field">
      <label>Titel</label>
      <input type="text" id="mHabitTitle" placeholder="z.B. 30 Min lesen">
    </div>
    <div class="field">
      <label>Frequenz</label>
      <select id="mHabitFrequency">
        <option value="daily">täglich</option>
        <option value="weekdays">Werktage (Mo–Fr)</option>
        <option value="interval">alle X Tage</option>
        <option value="weekly-on">alle X Wochen an einem Wochentag</option>
      </select>
    </div>
    <div class="field" id="mHabitIntervalField" style="display:none">
      <label>Alle wie viele Tage?</label>
      <input type="number" id="mHabitIntervalDays" min="2" value="3">
    </div>
    <div class="field" id="mHabitWeeklyField" style="display:none">
      <label>Wochentag</label>
      <select id="mHabitWeekday">
        <option value="1">Montag</option>
        <option value="2">Dienstag</option>
        <option value="3">Mittwoch</option>
        <option value="4">Donnerstag</option>
        <option value="5">Freitag</option>
        <option value="6">Samstag</option>
        <option value="0">Sonntag</option>
      </select>
      <label>Alle wie viele Wochen?</label>
      <input type="number" id="mHabitEveryNWeeks" min="1" value="2">
    </div>
    <div class="field">
      <label>Zielbereich (optional)</label>
      <select id="mHabitCategory">
        <option value="">– keiner –</option>
        ${nodeOptionsHtml()}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Speichern</button>
    </div>
  `, body => {
    body.querySelector("#mHabitTitle").focus();
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    const freqSelect = body.querySelector("#mHabitFrequency");
    const intervalField = body.querySelector("#mHabitIntervalField");
    const weeklyField = body.querySelector("#mHabitWeeklyField");
    freqSelect.addEventListener("change", () => {
      intervalField.style.display = freqSelect.value === "interval" ? "" : "none";
      weeklyField.style.display = freqSelect.value === "weekly-on" ? "" : "none";
    });
    body.querySelector("#mSave").addEventListener("click", () => {
      const title = body.querySelector("#mHabitTitle").value.trim();
      if (!title) return;
      const nodeId = body.querySelector("#mHabitCategory").value || null;
      const frequency = freqSelect.value;
      const extra = {};
      if (frequency === "interval") extra.intervalDays = parseInt(body.querySelector("#mHabitIntervalDays").value, 10) || 1;
      if (frequency === "weekly-on") {
        extra.weekday = parseInt(body.querySelector("#mHabitWeekday").value, 10);
        extra.everyNWeeks = parseInt(body.querySelector("#mHabitEveryNWeeks").value, 10) || 1;
      }
      state.habits.push({ id: uid(), title, nodeId, history: {}, createdAt: new Date().toISOString(), frequency, ...extra, routineOrder: null, type: "check" });
      saveData();
      closeModal();
      renderAll();
    });
  });
}

function openWorkShiftModal(defaultDate) {
  openModal(`
    <h3>Arbeitsschicht eintragen</h3>
    <div class="field">
      <label>Datum</label>
      <input type="date" id="mShiftDate" value="${defaultDate || todayStr()}">
    </div>
    <div class="field">
      <label>Beginn</label>
      <input type="time" id="mShiftStart" value="16:45">
    </div>
    <div class="field">
      <label>Ende (Richtwert, kann abweichen)</label>
      <input type="time" id="mShiftEnd" value="23:00">
    </div>
    <div class="field">
      <label>Label (optional)</label>
      <input type="text" id="mShiftLabel" placeholder="z.B. Ochsen Arbeiten">
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Speichern</button>
    </div>
  `, body => {
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    body.querySelector("#mSave").addEventListener("click", () => {
      const date = body.querySelector("#mShiftDate").value;
      const start = body.querySelector("#mShiftStart").value;
      const end = body.querySelector("#mShiftEnd").value;
      const label = body.querySelector("#mShiftLabel").value.trim() || null;
      if (!date || !start || !end) return;
      state.workShifts = state.workShifts.filter(s => s.date !== date);
      state.workShifts.push({ id: uid(), date, start, end, label });
      saveData();
      closeModal();
      renderAll();
    });
  });
}

function openSubjectModal() {
  openModal(`
    <h3>Fach hinzufügen</h3>
    <div class="field">
      <label>Titel</label>
      <input type="text" id="mSubjectTitle" placeholder="z.B. Physik">
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Speichern</button>
    </div>
  `, body => {
    body.querySelector("#mSubjectTitle").focus();
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    body.querySelector("#mSave").addEventListener("click", () => {
      const title = body.querySelector("#mSubjectTitle").value.trim();
      if (!title) return;
      state.subjects.push({ id: uid(), title });
      saveData();
      closeModal();
      renderAll();
    });
  });
}

function openExamModal() {
  if (state.subjects.length === 0) {
    openSubjectModal();
    return;
  }
  openModal(`
    <h3>Klassenarbeit eintragen</h3>
    <div class="field">
      <label>Fach</label>
      <select id="mExamSubject">
        ${state.subjects.map(s => `<option value="${s.id}">${escapeHtml(s.title)}</option>`).join("")}
      </select>
    </div>
    <div class="field">
      <label>Datum</label>
      <input type="date" id="mExamDate" value="${todayStr()}">
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Speichern</button>
    </div>
  `, body => {
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    body.querySelector("#mSave").addEventListener("click", () => {
      const subjectId = body.querySelector("#mExamSubject").value;
      const date = body.querySelector("#mExamDate").value;
      if (!subjectId || !date) return;
      state.exams.push({ id: uid(), subjectId, date });
      saveData();
      closeModal();
      renderAll();
    });
  });
}

function renderPlanning() {
  const examsWrap = document.getElementById("examsList");
  if (examsWrap) {
    const sorted = state.exams.slice().sort((a, b) => a.date.localeCompare(b.date));
    examsWrap.innerHTML = sorted.length
      ? sorted.map(e => {
          const subject = state.subjects.find(s => s.id === e.subjectId);
          return `
            <div class="atlas-row">
              <div style="flex:1; min-width:0;">
                <div class="item-title">${subject ? escapeHtml(subject.title) : "Unbekanntes Fach"}</div>
                <div class="item-meta">${e.date}</div>
              </div>
              <button class="btn btn-icon btn-ghost" data-del-exam="${e.id}" aria-label="Löschen"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 1.5L11.5 11.5M11.5 1.5L1.5 11.5" stroke="var(--color-neutral-500)" stroke-width="1.4" stroke-linecap="round"/></svg></button>
            </div>
          `;
        }).join("")
      : '<div class="empty-hint">Noch keine Klassenarbeiten eingetragen.</div>';
  }
}

// ---------- Gebetsanliegen ----------
const CHECK_ICON = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-300)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';
const REFRESH_ICON = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-neutral-400)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 4v3h-3M6 20v-3h3"/></svg>';
const CROSS_ICON = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-neutral-500)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

function renderPrayers() {
  const listWrap = document.getElementById("prayerList");
  const openPrayers = state.prayers.filter(p => p.status === "open");
  listWrap.innerHTML = openPrayers.length
    ? openPrayers.map(p => `
        <div class="atlas-row">
          <div style="flex:1; min-width:0;">
            <div class="item-title">${escapeHtml(p.title)}</div>
            ${p.deferredCount ? `<div class="item-meta">${p.deferredCount}× auf nächste Woche verschoben</div>` : ""}
          </div>
          <button class="btn btn-icon btn-ghost" data-prayer-fulfilled="${p.id}" title="Erfüllt" style="width:26px; height:26px;">${CHECK_ICON}</button>
          <button class="btn btn-icon btn-ghost" data-prayer-defer="${p.id}" title="Nächste Woche" style="width:26px; height:26px;">${REFRESH_ICON}</button>
          <button class="btn btn-icon btn-ghost" data-prayer-irrelevant="${p.id}" title="Nicht mehr relevant" style="width:26px; height:26px;">${CROSS_ICON}</button>
        </div>
      `).join("")
    : '<div class="empty-hint">Keine offenen Anliegen.</div>';

  const archiveWrap = document.getElementById("prayerArchive");
  const fulfilled = state.prayers
    .filter(p => p.status === "fulfilled")
    .sort((a, b) => (b.fulfilledAt || "").localeCompare(a.fulfilledAt || ""));
  archiveWrap.innerHTML = fulfilled.length
    ? fulfilled.map(p => `
        <div class="prayer-archive-entry">
          <div class="item-meta">${(p.fulfilledAt || "").slice(0, 10)}</div>
          <div class="item-title">${escapeHtml(p.title)}</div>
          ${p.fulfillmentText ? `<div class="small-text">${escapeHtml(p.fulfillmentText)}</div>` : ""}
          ${(p.attachments || []).map(a => a.type.startsWith("image/")
            ? `<img class="prayer-attachment-img" src="${a.dataUrl}" alt="${escapeHtml(a.name)}">`
            : `<a class="prayer-attachment-file" href="${a.dataUrl}" download="${escapeHtml(a.name)}">${escapeHtml(a.name)}</a>`
          ).join("")}
        </div>
      `).join("")
    : '<div class="empty-hint">Noch keine Erhörungen festgehalten.</div>';
}

function savePrayerFromInline() {
  const input = document.getElementById("prayerInput");
  const title = input.value.trim();
  if (!title) return;
  state.prayers.push({ id: uid(), title, createdAt: new Date().toISOString(), status: "open", deferredCount: 0 });
  saveData();
  input.value = "";
  quickAddVisible = false;
  document.getElementById("prayerAddCard").style.display = "none";
  renderAll();
}

function openPrayerFulfillModal(prayerId) {
  const prayer = state.prayers.find(p => p.id === prayerId);
  if (!prayer) return;
  openModal(`
    <h3>Erfüllt: ${escapeHtml(prayer.title)}</h3>
    <div class="field">
      <label>Wie wurde es erfüllt?</label>
      <textarea id="mPrayerText" class="reflection-textarea" placeholder="Was ist passiert?"></textarea>
    </div>
    <div class="field">
      <label>Anhang (Bild/Datei, optional)</label>
      <input type="file" id="mPrayerFiles" multiple>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Speichern</button>
    </div>
  `, body => {
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    body.querySelector("#mSave").addEventListener("click", async () => {
      const text = body.querySelector("#mPrayerText").value.trim();
      const files = Array.from(body.querySelector("#mPrayerFiles").files || []);
      const attachments = await Promise.all(files.map(readFileAsAttachment));
      prayer.status = "fulfilled";
      prayer.fulfilledAt = new Date().toISOString();
      prayer.fulfillmentText = text;
      prayer.attachments = attachments;
      saveData();
      closeModal();
      renderAll();
    });
  });
}

function readFileAsAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, dataUrl: reader.result });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------- Vollständiger Export (Obsidian-kompatibles Markdown, für Vault & Chat-Analyse) ----------
function exportWeekReview() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  const fmt = d => d.toISOString().slice(0, 10);
  const longTermDays = 60;

  let md = `---\n`;
  md += `title: "Wochenrückblick ${fmt(start)} bis ${fmt(end)}"\n`;
  md += `type: "Wochenrückblick"\n`;
  md += `created: ${new Date().toISOString()}\n`;
  md += `tags:\n  - "wochenrueckblick"\n  - "habits"\n---\n\n`;
  md += `# Wochenrückblick ${fmt(start)} bis ${fmt(end)}\n\n`;
  md += `> Vollständiger Export inkl. Rohdaten — zum Ablegen im Vault oder zum Einfügen in den Chat mit Claude für eine individuelle Analyse.\n\n`;

  const weekKey = weekStartKey(end);
  if (state.weeklyReflection[weekKey]) {
    md += `## Reflexion\n${state.weeklyReflection[weekKey]}\n\n`;
  }

  const weekDeviations = state.deviations.filter(d => d.date >= fmt(start) && d.date <= fmt(end));
  if (weekDeviations.length) {
    md += `## Abweichungen vom Plan\n`;
    weekDeviations.forEach(d => { md += `- ${d.date} ${d.time}: ${d.text}\n`; });
    md += `\n`;
  }

  md += `## Gewohnheiten (letzte 7 Tage)\n`;
  state.habits.forEach(h => {
    let doneCount = 0, scheduledCount = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      if (!isScheduledToday(h, d)) continue;
      scheduledCount++;
      if (h.history[fmt(d)]) doneCount++;
    }
    const streak = computeStreak(h);
    md += `- **${h.title}**: ${doneCount}/${scheduledCount} Tage · Serie: ${streak}\n`;
  });

  md += `\n## Aufgaben (letzte 7 Tage)\n`;
  const weekTasks = state.tasks.filter(t => t.dueDate && t.dueDate >= fmt(start) && t.dueDate <= fmt(end));
  const doneWeekTasks = weekTasks.filter(t => t.done);
  const onTimeCount = doneWeekTasks.filter(isOnTime).length;
  md += `- Erledigt: ${doneWeekTasks.length}/${weekTasks.length}\n`;
  md += `- Davon pünktlich: ${onTimeCount}/${doneWeekTasks.length || 0}\n`;
  weekTasks.forEach(t => {
    md += `  - [${t.done ? "x" : " "}] ${t.title} (fällig ${t.dueDate})\n`;
  });

  md += `\n## Zielbereiche\n`;
  childNodes(null).forEach(node => {
    md += `- **${node.title}**${node.priority ? " (Priorität)" : ""}: ${Math.round(nodeProgress(node) * 100)}%\n`;
  });

  md += `\n## Langzeit-Auswertung (letzte ${longTermDays} Tage)\n`;
  const longTermHabitStats = state.habits
    .map(h => ({ habit: h, ...habitStatsWindow(h, longTermDays) }))
    .filter(s => s.total > 0)
    .sort((a, b) => b.rate - a.rate);
  longTermHabitStats.forEach(s => {
    md += `- **${s.habit.title}**: ${Math.round(s.rate * 100)}% (${s.done}/${s.total} fällige Tage)\n`;
  });
  const weekdayStats = weekdayDifficulty(longTermDays).filter(w => w.total > 0);
  if (weekdayStats.length) {
    const hardest = weekdayStats.reduce((a, b) => (b.rate < a.rate ? b : a));
    md += `- Schwierigster Wochentag: **${hardest.day}** (${Math.round(hardest.rate * 100)}% Erledigungsquote)\n`;
  }

  md += `\n## Rohdaten (vollständig, als JSON)\n`;
  md += "```json\n" + JSON.stringify(state, null, 2) + "\n```\n";

  md += `\n---\nErstellt automatisch vom Ziel & Habit Tracker.\n`;

  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Wochenrueckblick_${fmt(end)}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------- Init ----------
renderAll();
