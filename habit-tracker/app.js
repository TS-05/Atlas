// ---------- Storage ----------
const STORAGE_KEY = "habit-tracker-data-v2";

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

// ---------- Migration: alte Ziel-Hierarchie (goals) -> flache Zielbereiche (categories) ----------
function migrateGoalsToCategories(data) {
  if (data.categories || !data.goals) return;

  const GOAL_TITLE_TO_CATEGORY = {
    "Glaube": "Glaube",
    "Schule & Studium": "Schule",
    "Fitness & Gesundheit": "Gesundheit",
    "Struktur & Routine": "Allgemein",
    "Charakter & Integrität": "Allgemein",
    "Wissen & Weiterbildung": "Bildung"
  };

  data.categories = [];
  const categoryByTitle = {};
  const ensureCategory = (title, priority = false) => {
    if (!categoryByTitle[title]) {
      const cat = { id: uid(), title, priority };
      data.categories.push(cat);
      categoryByTitle[title] = cat;
    } else if (priority) {
      categoryByTitle[title].priority = true;
    }
    return categoryByTitle[title];
  };

  const goals = data.goals || [];
  const findGoal = id => goals.find(g => g.id === id);
  const goalIdToCategoryId = {};

  goals.filter(g => g.level === "long").forEach(g => {
    const catTitle = GOAL_TITLE_TO_CATEGORY[g.title] || g.title;
    const cat = ensureCategory(catTitle, g.priority);
    goalIdToCategoryId[g.id] = cat.id;
  });

  function categoryIdForGoal(g) {
    let cur = g;
    while (cur && cur.level !== "long") cur = findGoal(cur.parentId);
    return cur ? goalIdToCategoryId[cur.id] : null;
  }

  // Mid/short goals become plain tasks under the resolved category
  goals.filter(g => g.level !== "long").forEach(g => {
    const categoryId = categoryIdForGoal(g);
    if (!categoryId) return;
    data.tasks.push({
      id: uid(), title: g.title, categoryId, dueDate: g.dueDate || null, dueTime: null,
      done: false, completedAt: null, createdAt: new Date().toISOString(), size: "klein", priority: "normal"
    });
  });

  (data.tasks || []).forEach(t => {
    if (t.categoryId !== undefined) return;
    const g = findGoal(t.goalId);
    t.categoryId = g ? categoryIdForGoal(g) : null;
    delete t.goalId;
    if (t.priority === undefined) t.priority = "normal";
  });

  (data.habits || []).forEach(h => {
    if (h.categoryId !== undefined) return;
    const g = findGoal(h.goalId);
    h.categoryId = g ? categoryIdForGoal(g) : null;
    delete h.goalId;
  });

  delete data.goals;
}

let state = loadData();
migrateGoalsToCategories(state);
state.subjects = state.subjects || [];
state.exams = state.exams || [];
state.workShifts = state.workShifts || [];
state.deviations = state.deviations || [];
state.weeklyReflection = state.weeklyReflection || {};
saveData();

// ---------- Seed data (aus Obsidian-Vault: Ziele.md, Präferenzen.md, Habit_und_Zielsystem.md) ----------
function seedData() {
  const data = { categories: [], tasks: [], habits: [], subjects: [], exams: [], workShifts: [], deviations: [], weeklyReflection: {} };
  const c = (title, priority = false) => {
    const id = uid();
    data.categories.push({ id, title, priority });
    return id;
  };
  const h = (title, categoryId, frequency = "daily", extra = {}) => {
    data.habits.push({
      id: uid(), title, categoryId, history: {}, createdAt: new Date().toISOString(), frequency,
      routineOrder: extra.routineOrder ?? null,
      type: extra.type || "check"
    });
  };
  const t = (title, categoryId, dueDate, size = "klein", priority = "normal") => {
    data.tasks.push({ id: uid(), title, categoryId, dueDate, dueTime: null, done: false, completedAt: null, createdAt: new Date().toISOString(), size, priority });
  };
  const s = (title) => { data.subjects.push({ id: uid(), title }); };

  const glaube = c("Glaube", true);
  h("Bibellese / stille Zeit", glaube, "daily", { routineOrder: 4 });
  h("Abendlektüre 30 Min. vor dem Schlafen", glaube, "daily", { routineOrder: 7 });
  t("Glaubenskurs \"Fest gegründet\" fertigstellen (~1,5 Std. Restaufwand)", glaube, null, "gross", "hoch");

  const schule = c("Schule");
  h("Lernen / Schularbeit 60–90 Min.", schule, "weekdays", { routineOrder: 6 });
  t("Bewerbungen duales Studium abschicken", schule, "2026-07-13", "gross", "hoch");
  t("Seminararbeit Physik in Filmen fertigstellen", schule, null, "gross");
  s("Englisch");
  s("Deutsch");
  s("BWL");
  s("Mathe");

  const gesundheit = c("Gesundheit");
  h("Joggen 5,5 km", gesundheit, "daily", { routineOrder: 5 });
  h("Ernährung im Rahmen (max. 2.000 kcal)", gesundheit, "daily", { routineOrder: 10 });

  const allgemein = c("Allgemein");
  h("Pünktlich aufstehen", allgemein, "daily", { routineOrder: 1 });
  h("Bett gemacht & Gewicht", allgemein, "daily", { routineOrder: 2, type: "weight" });
  h("Handy weglegen 21:30", allgemein, "daily", { routineOrder: 8 });
  h("Skin Care & Anziehen", allgemein, "daily", { routineOrder: 3 });
  h("Tag im Griff", allgemein, "daily", { routineOrder: 9 });

  const bildung = c("Bildung");
  h("Lesen (ca. 1 Buch/Monat)", bildung, "daily");
  t("Die Anatomie des menschlichen Körpers lesen", bildung, null, "gross");

  c("Zukunft");
  c("Beziehung");

  return data;
}

// ---------- Tabs ----------
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    document.body.dataset.tab = btn.dataset.tab;
    renderAll();
  });
});
document.body.dataset.tab = "heute";

document.getElementById("todayLabel").textContent = new Date().toLocaleDateString("de-DE", {
  weekday: "long", day: "2-digit", month: "long", year: "numeric"
});

// ---------- Modal helper ----------
const overlay = document.getElementById("modalOverlay");
const modalBody = document.getElementById("modalBody");

function openModal(html, onMount) {
  modalBody.innerHTML = html;
  overlay.classList.remove("hidden");
  if (onMount) onMount(modalBody);
}
function closeModal() {
  overlay.classList.add("hidden");
  modalBody.innerHTML = "";
}
overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(); });

// ---------- Category helpers ----------
function categoryById(id) {
  return state.categories.find(c => c.id === id);
}
function tasksForCategory(categoryId) {
  return state.tasks.filter(t => t.categoryId === categoryId);
}
function habitsForCategory(categoryId) {
  return state.habits.filter(h => h.categoryId === categoryId);
}
function isPriority(categoryId) {
  const cat = categoryById(categoryId);
  return !!(cat && cat.priority);
}
function categoryProgress(category) {
  const tasks = tasksForCategory(category.id);
  const habits = habitsForCategory(category.id);
  const parts = [];
  if (tasks.length) parts.push(tasks.filter(t => t.done).length / tasks.length);
  if (habits.length) {
    const rates = habits.map(h => habitCompletionRate(h));
    parts.push(rates.reduce((a, b) => a + b, 0) / rates.length);
  }
  if (parts.length === 0) return 0;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

function isScheduledToday(habit, dateObj = new Date()) {
  if (habit.frequency === "weekdays") {
    const day = dateObj.getDay(); // 0 So, 6 Sa
    return day >= 1 && day <= 5;
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

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

const CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';
const PENCIL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l4-1 10-10-3-3L5 16l-1 4z"/></svg>';

// ---------- Rendering: ToDo ----------
function renderTaskItem(t) {
  const today = todayStr();
  const overdue = !t.done && t.dueDate && t.dueDate < today;
  const category = categoryById(t.categoryId);
  const el = document.createElement("div");
  el.className = "item" + (t.done ? " done" : "");
  el.innerHTML = `
    <input type="checkbox" ${t.done ? "checked" : ""} data-task="${t.id}">
    <div class="item-body">
      <div class="item-title">${escapeHtml(t.title)}</div>
      <div class="item-meta">${t.size === "gross" ? "Groß" : "Klein"}${t.dueDate ? " · fällig " + t.dueDate : ""}${t.dueTime ? " " + t.dueTime : ""}${category ? " · " + escapeHtml(category.title) : ""}</div>
    </div>
    ${t.priority === "hoch" ? '<span class="item-tag priority">Priorität</span>' : ""}
    ${overdue ? '<span class="item-tag late">Überfällig</span>' : ""}
    <button class="icon-btn" data-del-task="${t.id}">✕</button>
  `;
  return el;
}

function renderTodo() {
  const wrap = document.getElementById("todoList");
  wrap.innerHTML = "";

  const today = todayStr();
  const openTodayTasks = state.tasks.filter(t => t.dueDate === today && !t.done);
  const budgetUsed = openTodayTasks.reduce((sum, t) => sum + (t.size === "gross" ? 2 : 1), 0);
  const ruleEl = document.getElementById("dayRule");
  ruleEl.textContent = `Regel: 2 kleine oder 1 große Aufgabe/Tag · heute fällig: ${openTodayTasks.length} (Budget ${budgetUsed}/2)`;
  ruleEl.classList.toggle("over", budgetUsed > 2);

  const openTasks = state.tasks
    .filter(t => !t.done)
    .sort((a, b) => {
      const ad = a.dueDate || "9999-99-99", bd = b.dueDate || "9999-99-99";
      if (ad !== bd) return ad.localeCompare(bd);
      const ap = a.priority === "hoch" ? 0 : 1;
      const bp = b.priority === "hoch" ? 0 : 1;
      return ap - bp;
    });
  const doneTasks = state.tasks.filter(t => t.done);

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

    const el = document.createElement("div");
    el.className = "week-circle-day" + (isToday ? " is-today" : "") + (isFuture ? " is-future" : "");
    el.title = `${key}: ${scheduled.length ? done + "/" + scheduled.length + " Habits" : "keine Habits fällig"}`;
    el.innerHTML = `
      <div class="week-circle-ring" style="--pct:${pct === null ? 0 : pct}%">
        <div class="week-circle-ring-inner">${pct === null ? "–" : pct + "%"}</div>
      </div>
      <div class="week-circle-label">${WEEKDAY_LABELS[i]}</div>
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
          <button class="icon-btn" data-del-deviation="${d.id}">✕</button>
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
      ? `<input type="number" step="0.1" inputmode="decimal" class="routine-weight-input" data-weight-habit="${h.id}" placeholder="kg" value="${rawValue !== undefined && rawValue !== null ? rawValue : ""}">`
      : `<input type="checkbox" ${doneToday ? "checked" : ""} data-habit="${h.id}">`;

    const el = document.createElement("div");
    el.className = "routine-step" + (doneToday ? " done" : "");
    el.dataset.type = h.type;
    el.innerHTML = `
      <div class="routine-step-num">${h.type === "weight" ? PENCIL_ICON : CHECK_ICON}</div>
      <div class="routine-step-body">
        <div class="item-title">${escapeHtml(h.title)}</div>
        ${noteHtml}
      </div>
      ${controlHtml}
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
    wrap.innerHTML = `<button class="add-btn" id="addWorkShiftBtn">+ Arbeitsschicht für heute eintragen</button>`;
  } else {
    wrap.innerHTML = `
      <div class="day-rule shift-banner">
        <span>Arbeit heute: ${shift.start}–${shift.end}${shift.label ? " · " + escapeHtml(shift.label) : ""}</span>
        <button class="icon-btn" data-del-shift="${shift.id}">✕</button>
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
    const priority = isPriority(h.categoryId);
    const el = document.createElement("div");
    el.className = "item" + (doneToday ? " done" : "");
    el.innerHTML = `
      <input type="checkbox" ${doneToday ? "checked" : ""} data-habit="${h.id}">
      <div class="item-body">
        <div class="item-title">${escapeHtml(h.title)}</div>
        <div class="item-meta">${h.frequency === "weekdays" ? "Mo–Fr" : "täglich"} · Serie: ${streak}</div>
      </div>
      ${priority ? '<span class="item-tag priority">Priorität</span>' : ""}
      <button class="icon-btn" data-del-habit="${h.id}">✕</button>
    `;
    habitWrap.appendChild(el);
  });
}

// ---------- Rendering: Zielbereiche ----------
function renderCategories() {
  const tree = document.getElementById("categoriesList");
  tree.innerHTML = "";
  const sorted = state.categories.slice().sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0));
  if (sorted.length === 0) {
    tree.innerHTML = '<div class="empty-hint">Noch keine Zielbereiche angelegt.</div>';
    return;
  }
  sorted.forEach(cat => tree.appendChild(renderCategoryCard(cat)));
}

function renderCategoryCard(category) {
  const pct = Math.round(categoryProgress(category) * 100);
  const tasks = tasksForCategory(category.id);
  const habits = habitsForCategory(category.id);
  const wrap = document.createElement("div");
  wrap.className = "card category-card";
  wrap.innerHTML = `
    <div class="goal-head">
      <div class="goal-title">${escapeHtml(category.title)} ${category.priority ? '<span class="item-tag priority">Priorität</span>' : ""}</div>
      <div>
        <button class="icon-btn" data-decompose-category="${category.id}" title="Aufgaben vorschlagen (Prompt kopieren)">···</button>
        <button class="icon-btn" data-edit-category="${category.id}" title="Umbenennen">✎</button>
        <button class="icon-btn" data-del-category="${category.id}">✕</button>
      </div>
    </div>
    <div class="progress-outer"><div class="progress-inner" style="width:${pct}%"></div></div>
    <div class="progress-pct">${pct}% · ${tasks.length} Aufgabe(n), ${habits.length} Gewohnheit(en)</div>
    <div class="list category-tasks" data-tasks-of="${category.id}"></div>
    <button class="add-btn" data-add-task-category="${category.id}">+ Aufgabe in diesem Bereich</button>
  `;
  const tasksWrap = wrap.querySelector(`[data-tasks-of="${category.id}"]`);
  if (tasks.length === 0) {
    tasksWrap.innerHTML = '<div class="empty-hint">Noch keine Aufgaben in diesem Bereich.</div>';
  } else {
    tasks.forEach(t => tasksWrap.appendChild(renderTaskItem(t)));
  }
  return wrap;
}

function categoryOptionsHtml() {
  return state.categories.map(cat => `<option value="${cat.id}">${escapeHtml(cat.title)}</option>`).join("");
}

// ---------- Rendering: Woche ----------
function renderWeekStats() {
  const grid = document.getElementById("statsGrid");
  const totalTasks = state.tasks.length;
  const doneTasks = state.tasks.filter(t => t.done).length;
  const longestStreak = state.habits.reduce((max, h) => Math.max(max, computeStreak(h)), 0);

  grid.innerHTML = `
    <div class="stat-box"><div class="stat-num">${state.categories.length}</div><div class="stat-label">Zielbereiche</div></div>
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

  renderLongTermStats();
  renderReflection();
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

function renderLongTermStats(days = 60) {
  const container = document.getElementById("longTermStats");
  const habitStats = state.habits
    .map(h => ({ habit: h, ...habitStatsWindow(h, days) }))
    .filter(s => s.total > 0);
  const weekdayStats = weekdayDifficulty(days).filter(w => w.total > 0);

  if (habitStats.length === 0) {
    container.innerHTML = `<div class="empty-hint">Noch nicht genug Daten (mind. 1 fälliger Habit-Tag in den letzten ${days} Tagen nötig).</div>`;
    return;
  }

  const best = habitStats.reduce((a, b) => (b.rate > a.rate ? b : a));
  const worst = habitStats.reduce((a, b) => (b.rate < a.rate ? b : a));

  let hardestDayBox = "";
  if (weekdayStats.length) {
    const hardest = weekdayStats.reduce((a, b) => (b.rate < a.rate ? b : a));
    hardestDayBox = `<div class="stat-box"><div class="stat-num">${hardest.day}</div><div class="stat-label">Schwierigster Wochentag (${Math.round(hardest.rate * 100)}%)</div></div>`;
  }

  container.innerHTML = `
    <div class="stat-box"><div class="stat-num">${Math.round(best.rate * 100)}%</div><div class="stat-label">Bester Habit: ${escapeHtml(best.habit.title)}</div></div>
    <div class="stat-box"><div class="stat-num">${Math.round(worst.rate * 100)}%</div><div class="stat-label">Schwierigster Habit: ${escapeHtml(worst.habit.title)}</div></div>
    ${hardestDayBox}
  `;
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
  renderCategories();
  renderPlanning();
  renderWeekStats();
}

// ---------- Event delegation ----------
document.addEventListener("change", e => {
  if (e.target.matches("[data-task]")) {
    const id = e.target.dataset.task;
    const task = state.tasks.find(t => t.id === id);
    task.done = e.target.checked;
    task.completedAt = task.done ? new Date().toISOString() : null;
    saveData();
    renderAll();
  }
  if (e.target.matches("[data-habit]")) {
    const id = e.target.dataset.habit;
    const habit = state.habits.find(h => h.id === id);
    const key = todayStr();
    if (e.target.checked) habit.history[key] = true;
    else delete habit.history[key];
    saveData();
    renderAll();
  }
  if (e.target.matches("[data-weight-habit]")) {
    const id = e.target.dataset.weightHabit;
    const habit = state.habits.find(h => h.id === id);
    const key = todayStr();
    const val = e.target.value === "" ? null : parseFloat(e.target.value);
    if (val === null || isNaN(val)) delete habit.history[key];
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
  if (e.target.matches("[data-del-task]")) {
    state.tasks = state.tasks.filter(t => t.id !== e.target.dataset.delTask);
    saveData(); renderAll();
  }
  if (e.target.matches("[data-del-habit]")) {
    state.habits = state.habits.filter(h => h.id !== e.target.dataset.delHabit);
    saveData(); renderAll();
  }
  if (e.target.matches("[data-del-category]")) {
    removeCategory(e.target.dataset.delCategory);
    saveData(); renderAll();
  }
  if (e.target.matches("[data-edit-category]")) {
    openCategoryModal(categoryById(e.target.dataset.editCategory));
  }
  if (e.target.matches("[data-add-task-category]")) {
    openTaskModal(e.target.dataset.addTaskCategory);
  }
  if (e.target.matches("[data-decompose-category]")) {
    copyDecomposePrompt(e.target.dataset.decomposeCategory, e.target);
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
});

// ---------- Zielbereich-Zerlegung: Copy-Prompt für Chat-Analyse ----------
function buildDecomposePrompt(category) {
  const tasks = tasksForCategory(category.id);
  const habits = habitsForCategory(category.id);
  const pct = Math.round(categoryProgress(category) * 100);

  let prompt = `Ich möchte im Zielbereich "${category.title}" konkrete, umsetzbare Aufgaben finden, die mich meinem Idealbild in diesem Bereich näherbringen.\n\n`;
  prompt += `Aktueller Fortschritt: ${pct}%\n`;
  if (category.priority) prompt += `Priorität: ja\n`;

  if (tasks.length) {
    prompt += `\nBereits vorhandene Aufgaben:\n`;
    tasks.forEach(t => { prompt += `- [${t.done ? "x" : " "}] ${t.title}${t.dueDate ? " (fällig " + t.dueDate + ")" : ""}\n`; });
  }
  if (habits.length) {
    prompt += `\nBereits verknüpfte Gewohnheiten:\n`;
    habits.forEach(h => { prompt += `- ${h.title} (${h.frequency === "weekdays" ? "Mo–Fr" : "täglich"})\n`; });
  }

  prompt += `\nSchlag mir bitte 3-6 konkrete neue Aufgaben oder Gewohnheiten für diesen Bereich vor.`;
  return prompt;
}

async function copyDecomposePrompt(categoryId, btn) {
  const category = categoryById(categoryId);
  if (!category) return;
  const prompt = buildDecomposePrompt(category);
  try {
    await navigator.clipboard.writeText(prompt);
    flashButton(btn, "✓");
  } catch (e) {
    downloadText(prompt, `Zielbereich_${category.title.replace(/[^a-z0-9]+/gi, "_")}.txt`);
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

function removeCategory(categoryId) {
  state.categories = state.categories.filter(c => c.id !== categoryId);
  state.tasks.forEach(t => { if (t.categoryId === categoryId) t.categoryId = null; });
  state.habits.forEach(h => { if (h.categoryId === categoryId) h.categoryId = null; });
}

// ---------- Add buttons ----------
document.getElementById("addCategoryBtn").addEventListener("click", () => openCategoryModal());
document.getElementById("addTaskBtn").addEventListener("click", () => openTaskModal());
document.getElementById("addHabitBtn").addEventListener("click", () => openHabitModal());
document.getElementById("exportWeekBtn").addEventListener("click", exportWeekReview);
document.getElementById("addSubjectBtn").addEventListener("click", () => openSubjectModal());
document.getElementById("addExamBtn").addEventListener("click", () => openExamModal());
document.getElementById("addDeviationBtn").addEventListener("click", () => {
  const input = document.getElementById("deviationInput");
  addDeviation(input.value);
  input.value = "";
});

function openCategoryModal(category) {
  const isEdit = !!category;
  openModal(`
    <h3>${isEdit ? "Bereich bearbeiten" : "Zielbereich hinzufügen"}</h3>
    <div class="field">
      <label>Titel</label>
      <input type="text" id="mCategoryTitle" value="${isEdit ? escapeHtml(category.title) : ""}" placeholder="z.B. Kreativität">
    </div>
    <div class="checkbox-row">
      <input type="checkbox" id="mCategoryPriority" ${isEdit && category.priority ? "checked" : ""}>
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
        category.title = title;
        category.priority = priority;
      } else {
        state.categories.push({ id: uid(), title, priority });
      }
      saveData();
      closeModal();
      renderAll();
    });
  });
}

function openTaskModal(defaultCategoryId) {
  openModal(`
    <h3>Aufgabe hinzufügen</h3>
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
      <label>Priorität</label>
      <select id="mTaskPriority">
        <option value="normal">normal</option>
        <option value="hoch">hoch</option>
      </select>
    </div>
    <div class="field">
      <label>Zielbereich (optional)</label>
      <select id="mTaskCategory">
        <option value="">– keiner –</option>
        ${categoryOptionsHtml()}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Speichern</button>
    </div>
  `, body => {
    body.querySelector("#mTaskTitle").focus();
    if (defaultCategoryId) body.querySelector("#mTaskCategory").value = defaultCategoryId;
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    body.querySelector("#mSave").addEventListener("click", () => {
      const title = body.querySelector("#mTaskTitle").value.trim();
      if (!title) return;
      const dueDate = body.querySelector("#mTaskDate").value || null;
      const dueTime = body.querySelector("#mTaskTime").value || null;
      const size = body.querySelector("#mTaskSize").value;
      const priority = body.querySelector("#mTaskPriority").value;
      const categoryId = body.querySelector("#mTaskCategory").value || null;
      state.tasks.push({ id: uid(), title, dueDate, dueTime, categoryId, done: false, completedAt: null, createdAt: new Date().toISOString(), size, priority });
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
      </select>
    </div>
    <div class="field">
      <label>Zielbereich (optional)</label>
      <select id="mHabitCategory">
        <option value="">– keiner –</option>
        ${categoryOptionsHtml()}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Speichern</button>
    </div>
  `, body => {
    body.querySelector("#mHabitTitle").focus();
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    body.querySelector("#mSave").addEventListener("click", () => {
      const title = body.querySelector("#mHabitTitle").value.trim();
      if (!title) return;
      const categoryId = body.querySelector("#mHabitCategory").value || null;
      const frequency = body.querySelector("#mHabitFrequency").value;
      state.habits.push({ id: uid(), title, categoryId, history: {}, createdAt: new Date().toISOString(), frequency, routineOrder: null, type: "check" });
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
  const subjectsWrap = document.getElementById("subjectsList");
  if (subjectsWrap) {
    subjectsWrap.innerHTML = state.subjects.length
      ? state.subjects.map(s => `
          <div class="item">
            <div class="item-body"><div class="item-title">${escapeHtml(s.title)}</div></div>
            <button class="icon-btn" data-del-subject="${s.id}">✕</button>
          </div>
        `).join("")
      : '<div class="empty-hint">Noch keine Fächer angelegt.</div>';
  }

  const examsWrap = document.getElementById("examsList");
  if (examsWrap) {
    const sorted = state.exams.slice().sort((a, b) => a.date.localeCompare(b.date));
    examsWrap.innerHTML = sorted.length
      ? sorted.map(e => {
          const subject = state.subjects.find(s => s.id === e.subjectId);
          return `
            <div class="item">
              <div class="item-body">
                <div class="item-title">${subject ? escapeHtml(subject.title) : "Unbekanntes Fach"}</div>
                <div class="item-meta">${e.date}</div>
              </div>
              <button class="icon-btn" data-del-exam="${e.id}">✕</button>
            </div>
          `;
        }).join("")
      : '<div class="empty-hint">Noch keine Klassenarbeiten eingetragen.</div>';
  }

  const shiftsWrap = document.getElementById("shiftsList");
  if (shiftsWrap) {
    const sorted = state.workShifts.slice().sort((a, b) => b.date.localeCompare(a.date));
    shiftsWrap.innerHTML = sorted.length
      ? sorted.map(s => `
          <div class="item">
            <div class="item-body">
              <div class="item-title">${s.date}${s.label ? " · " + escapeHtml(s.label) : ""}</div>
              <div class="item-meta">${s.start}–${s.end}</div>
            </div>
            <button class="icon-btn" data-del-shift="${s.id}">✕</button>
          </div>
        `).join("")
      : '<div class="empty-hint">Noch keine Arbeitsschichten eingetragen.</div>';
  }
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
  state.categories.forEach(cat => {
    md += `- **${cat.title}**${cat.priority ? " (Priorität)" : ""}: ${Math.round(categoryProgress(cat) * 100)}%\n`;
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
