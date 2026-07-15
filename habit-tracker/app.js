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

let state = loadData();
state.subjects = state.subjects || [];
state.exams = state.exams || [];
state.workShifts = state.workShifts || [];
saveData();

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

// ---------- Seed data (aus Obsidian-Vault: Ziele.md, Präferenzen.md, Habit_und_Zielsystem.md) ----------
function seedData() {
  const data = { goals: [], tasks: [], habits: [], subjects: [], exams: [], workShifts: [] };
  const g = (title, priority = false) => {
    const id = uid();
    data.goals.push({ id, title, level: "long", parentId: null, dueDate: null, manualProgress: 0, priority });
    return id;
  };
  const h = (title, goalId, frequency = "daily", extra = {}) => {
    data.habits.push({
      id: uid(), title, goalId, history: {}, createdAt: new Date().toISOString(), frequency,
      routineOrder: extra.routineOrder ?? null,
      type: extra.type || "check"
    });
  };
  const t = (title, goalId, dueDate, size = "klein") => {
    data.tasks.push({ id: uid(), title, goalId, dueDate, dueTime: null, done: false, completedAt: null, createdAt: new Date().toISOString(), size });
  };
  const s = (title) => { data.subjects.push({ id: uid(), title }); };

  const glaube = g("Glaube", true);
  h("Bibellese / stille Zeit", glaube, "daily", { routineOrder: 4 });
  h("Abendlektüre 30 Min. vor dem Schlafen", glaube, "daily", { routineOrder: 7 });
  t("Glaubenskurs \"Fest gegründet\" fertigstellen (~1,5 Std. Restaufwand)", glaube, null, "gross");

  const schule = g("Schule & Studium");
  h("Lernen / Schularbeit 60–90 Min.", schule, "weekdays", { routineOrder: 6 });
  t("Bewerbungen duales Studium abschicken", schule, "2026-07-13", "gross");
  t("Seminararbeit Physik in Filmen fertigstellen", schule, null, "gross");
  s("Englisch");
  s("Deutsch");
  s("BWL");
  s("Mathe");

  const fitness = g("Fitness & Gesundheit");
  h("Joggen 5,5 km", fitness, "daily", { routineOrder: 5 });
  h("Ernährung im Rahmen (max. 2.000 kcal)", fitness, "daily", { routineOrder: 10 });

  const struktur = g("Struktur & Routine");
  h("Pünktlich aufstehen", struktur, "daily", { routineOrder: 1 });
  h("Bett gemacht & Gewicht", struktur, "daily", { routineOrder: 2, type: "weight" });
  h("Handy weglegen 21:30", struktur, "daily", { routineOrder: 8 });
  h("Skin Care & Anziehen", struktur, "daily", { routineOrder: 3 });

  const charakter = g("Charakter & Integrität");
  h("Tag im Griff", charakter, "daily", { routineOrder: 9 });

  const wissen = g("Wissen & Weiterbildung");
  h("Lesen (ca. 1 Buch/Monat)", wissen, "daily");

  return data;
}

// ---------- Tabs ----------
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    renderAll();
  });
});

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

// ---------- Goal helpers ----------
function goalsByLevel(level, parentId) {
  return state.goals.filter(g => g.level === level && (parentId === undefined || g.parentId === parentId));
}

function tasksForGoal(goalId) {
  return state.tasks.filter(t => t.goalId === goalId);
}
function habitsForGoal(goalId) {
  return state.habits.filter(h => h.goalId === goalId);
}

function goalById(id) {
  return state.goals.find(g => g.id === id);
}

// true if a linked goal (or any ancestor) is flagged priority
function isPriority(goalId) {
  let g = goalById(goalId);
  while (g) {
    if (g.priority) return true;
    g = g.parentId ? goalById(g.parentId) : null;
  }
  return false;
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

function goalProgress(goal) {
  const tasks = tasksForGoal(goal.id);
  const habits = habitsForGoal(goal.id);
  const parts = [];
  if (tasks.length) parts.push(tasks.filter(t => t.done).length / tasks.length);
  if (habits.length) {
    const rates = habits.map(h => habitCompletionRate(h));
    parts.push(rates.reduce((a, b) => a + b, 0) / rates.length);
  }
  const childLevel = goal.level === "long" ? "mid" : goal.level === "mid" ? "short" : null;
  if (childLevel) {
    const children = goalsByLevel(childLevel, goal.id);
    if (children.length) {
      const progresses = children.map(goalProgress);
      parts.push(progresses.reduce((a, b) => a + b, 0) / progresses.length);
    }
  }
  if (parts.length === 0) return goal.manualProgress || 0;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

function allGoalsFlat() {
  const result = [];
  function walk(level, parentId, depth) {
    goalsByLevel(level, parentId).forEach(g => {
      result.push({ goal: g, depth });
      if (g.level !== "short") walk(g.level === "long" ? "mid" : "short", g.id, depth + 1);
    });
  }
  walk("long", null, 0);
  return result;
}

// ---------- Rendering: Today ----------
function renderToday() {
  const today = todayStr();
  const now = new Date();

  const taskWrap = document.getElementById("todayTasks");
  const todaysTasks = state.tasks
    .filter(t => t.dueDate === today || (!t.done && t.dueDate && t.dueDate < today))
    .sort((a, b) => (a.dueTime || "99:99").localeCompare(b.dueTime || "99:99"));

  taskWrap.innerHTML = "";
  if (todaysTasks.length === 0) {
    taskWrap.innerHTML = '<div class="empty-hint">Keine Aufgaben für heute. 🎉</div>';
  }
  todaysTasks.forEach(t => {
    const overdue = !t.done && t.dueDate < today;
    const priority = isPriority(t.goalId);
    const el = document.createElement("div");
    el.className = "item" + (t.done ? " done" : "");
    el.innerHTML = `
      <input type="checkbox" ${t.done ? "checked" : ""} data-task="${t.id}">
      <div class="item-body">
        <div class="item-title">${escapeHtml(t.title)}</div>
        <div class="item-meta">${t.size === "gross" ? "🟦 groß" : "🟨 klein"} ${t.dueTime ? " · ⏰ " + t.dueTime : ""}${overdue ? " · überfällig seit " + t.dueDate : ""}</div>
      </div>
      ${priority ? '<span class="item-tag priority">★ Priorität</span>' : ""}
      ${overdue ? '<span class="item-tag late">überfällig</span>' : ""}
      <button class="icon-btn" data-del-task="${t.id}">✕</button>
    `;
    taskWrap.appendChild(el);
  });

  // Tagesregel: 2 kleine oder 1 große Aufgabe pro Tag (offene Aufgaben mit Fälligkeit heute)
  const openTodayTasks = state.tasks.filter(t => t.dueDate === today && !t.done);
  const budgetUsed = openTodayTasks.reduce((sum, t) => sum + (t.size === "gross" ? 2 : 1), 0);
  const ruleEl = document.getElementById("dayRule");
  ruleEl.textContent = `Regel: 2 kleine oder 1 große Aufgabe/Tag · heute offen: ${openTodayTasks.length} (Budget ${budgetUsed}/2)`;
  ruleEl.classList.toggle("over", budgetUsed > 2);

  const habitWrap = document.getElementById("todayHabits");
  habitWrap.innerHTML = "";
  const dueHabits = state.habits.filter(h => isScheduledToday(h, now) && h.routineOrder == null);
  if (dueHabits.length === 0) {
    habitWrap.innerHTML = '<div class="empty-hint">Keine weiteren Gewohnheiten heute fällig.</div>';
  }
  dueHabits.forEach(h => {
    const doneToday = !!h.history[today];
    const streak = computeStreak(h);
    const priority = isPriority(h.goalId);
    const el = document.createElement("div");
    el.className = "item" + (doneToday ? " done" : "");
    el.innerHTML = `
      <input type="checkbox" ${doneToday ? "checked" : ""} data-habit="${h.id}">
      <div class="item-body">
        <div class="item-title">${escapeHtml(h.title)}</div>
        <div class="item-meta">${h.frequency === "weekdays" ? "Mo–Fr" : "täglich"}</div>
      </div>
      ${priority ? '<span class="item-tag priority">★</span>' : ""}
      <span class="item-tag streak">🔥 ${streak}</span>
      <button class="icon-btn" data-del-habit="${h.id}">✕</button>
    `;
    habitWrap.appendChild(el);
  });
}

// ---------- Tagesroutine-Kette, Lern-Rotation, Klassenarbeits-Modus, Arbeitsschichten ----------
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

  chainHabits.forEach((h, idx) => {
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
    el.innerHTML = `
      <div class="routine-step-num">${idx + 1}</div>
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
        <span>💼 Arbeit heute: ${shift.start}–${shift.end}${shift.label ? " · " + escapeHtml(shift.label) : ""}</span>
        <button class="icon-btn" data-del-shift="${shift.id}">✕</button>
      </div>
    `;
  }
  const addBtn = document.getElementById("addWorkShiftBtn");
  if (addBtn) addBtn.addEventListener("click", () => openWorkShiftModal(todayStr()));
}

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

// ---------- Rendering: Goals ----------
function renderGoals() {
  const tree = document.getElementById("goalsTree");
  tree.innerHTML = "";
  const longGoals = goalsByLevel("long", null)
    .slice()
    .sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0));
  if (longGoals.length === 0) {
    tree.innerHTML = '<div class="empty-hint">Noch keine Ziele angelegt. Starte mit einem langfristigen Ziel.</div>';
    return;
  }
  longGoals.forEach(lg => tree.appendChild(renderGoalCard(lg)));
}

function renderGoalCard(goal) {
  const pct = Math.round(goalProgress(goal) * 100);
  const wrap = document.createElement("div");
  wrap.className = "goal-card " + goal.level;
  const titleClass = goal.level === "mid" ? "mid-title" : goal.level === "short" ? "short-title" : "";
  wrap.innerHTML = `
    <div class="goal-head">
      <div>
        <div class="goal-title ${titleClass}">${levelIcon(goal.level)} ${escapeHtml(goal.title)} ${goal.priority ? '<span class="item-tag priority">★ Priorität 1</span>' : ""}</div>
        ${goal.dueDate ? `<div class="goal-due">Zieltermin: ${goal.dueDate}</div>` : ""}
      </div>
      <div>
        <button class="icon-btn" data-decompose-goal="${goal.id}" title="Schritte vorschlagen (Prompt kopieren)">🧩</button>
        <button class="icon-btn" data-add-child="${goal.id}" title="Unterziel hinzufügen">${goal.level !== "short" ? "+" : ""}</button>
        <button class="icon-btn" data-del-goal="${goal.id}">✕</button>
      </div>
    </div>
    <div class="progress-outer"><div class="progress-inner" style="width:${pct}%"></div></div>
    <div class="progress-pct">${pct}% erledigt (30-Tage-Schnitt Habits, Aufgabenquote, Unterziele)</div>
    <div class="goal-children" data-children-of="${goal.id}"></div>
  `;
  const childrenWrap = wrap.querySelector(`[data-children-of="${goal.id}"]`);
  const childLevel = goal.level === "long" ? "mid" : goal.level === "mid" ? "short" : null;
  if (childLevel) {
    const children = goalsByLevel(childLevel, goal.id);
    children.forEach(c => childrenWrap.appendChild(renderGoalCard(c)));
  }
  const tasks = tasksForGoal(goal.id);
  const habits = habitsForGoal(goal.id);
  if (tasks.length || habits.length) {
    const info = document.createElement("div");
    info.className = "small-text";
    info.textContent = `${tasks.length} Aufgabe(n), ${habits.length} Gewohnheit(en) direkt verknüpft`;
    childrenWrap.appendChild(info);
  }
  return wrap;
}

function levelIcon(level) {
  return level === "long" ? "🏔️" : level === "mid" ? "🚩" : "✅";
}

// ---------- Rendering: Habits tab ----------
function renderHabitsTab() {
  const wrap = document.getElementById("habitsList");
  wrap.innerHTML = "";
  if (state.habits.length === 0) {
    wrap.innerHTML = '<div class="empty-hint">Noch keine Gewohnheiten angelegt.</div>';
    return;
  }
  state.habits.forEach(h => {
    const rate = Math.round(habitCompletionRate(h) * 100);
    const streak = computeStreak(h);
    const goal = goalById(h.goalId);
    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div class="item-body">
        <div class="item-title">${escapeHtml(h.title)}</div>
        <div class="item-meta">${h.frequency === "weekdays" ? "Mo–Fr" : "täglich"} · 30-Tage-Rate: ${rate}% ${goal ? " · Ziel: " + escapeHtml(goal.title) : ""}</div>
      </div>
      <span class="item-tag streak">🔥 ${streak}</span>
      <button class="icon-btn" data-del-habit="${h.id}">✕</button>
    `;
    wrap.appendChild(el);
  });
}

// ---------- Rendering: Overview ----------
function renderOverview() {
  const grid = document.getElementById("statsGrid");
  const totalTasks = state.tasks.length;
  const doneTasks = state.tasks.filter(t => t.done).length;
  const longestStreak = state.habits.reduce((max, h) => Math.max(max, computeStreak(h)), 0);
  const activeGoals = state.goals.length;

  grid.innerHTML = `
    <div class="stat-box"><div class="stat-num">${activeGoals}</div><div class="stat-label">Ziele gesamt</div></div>
    <div class="stat-box"><div class="stat-num">${doneTasks}/${totalTasks}</div><div class="stat-label">Aufgaben erledigt</div></div>
    <div class="stat-box"><div class="stat-num">${state.habits.length}</div><div class="stat-label">Gewohnheiten</div></div>
    <div class="stat-box"><div class="stat-num">${longestStreak}</div><div class="stat-label">Längster Streak</div></div>
  `;

  const completed = state.tasks.filter(t => t.done && t.completedAt);
  let onTime = 0;
  completed.forEach(t => { if (isOnTime(t)) onTime++; });
  const pct = completed.length ? Math.round((onTime / completed.length) * 100) : 0;
  document.getElementById("punctualityFill").style.width = pct + "%";
  document.getElementById("punctualityText").textContent =
    completed.length ? `${onTime} von ${completed.length} erledigten Aufgaben pünktlich (${pct}%)` : "Noch keine erledigten Aufgaben mit Termin.";

  renderLongTermStats();
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
  renderRoutineChain();
  renderWorkShiftBanner();
  renderToday();
  renderGoals();
  renderHabitsTab();
  renderPlanning();
  renderOverview();
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
  if (e.target.matches("[data-del-goal]")) {
    removeGoalCascade(e.target.dataset.delGoal);
    saveData(); renderAll();
  }
  if (e.target.matches("[data-add-child]")) {
    const parent = state.goals.find(g => g.id === e.target.dataset.addChild);
    const childLevel = parent.level === "long" ? "mid" : "short";
    openGoalModal(childLevel, parent.id);
  }
  if (e.target.matches("[data-decompose-goal]")) {
    copyDecomposePrompt(e.target.dataset.decomposeGoal, e.target);
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
});

// ---------- Projekt-Zerlegung: Copy-Prompt für Chat-Analyse ----------
function buildDecomposePrompt(goal) {
  const tasks = tasksForGoal(goal.id);
  const habits = habitsForGoal(goal.id);
  const pct = Math.round(goalProgress(goal) * 100);

  let prompt = `Ich möchte mein Ziel "${goal.title}" (${levelLabel(goal.level)}) in konkrete, umsetzbare Teilschritte zerlegen.\n\n`;
  prompt += `Aktueller Fortschritt: ${pct}%\n`;
  if (goal.dueDate) prompt += `Zieltermin: ${goal.dueDate}\n`;
  if (goal.priority) prompt += `Priorität: Nr. 1\n`;

  if (tasks.length) {
    prompt += `\nBereits verknüpfte Aufgaben:\n`;
    tasks.forEach(t => { prompt += `- [${t.done ? "x" : " "}] ${t.title}${t.dueDate ? " (fällig " + t.dueDate + ")" : ""}\n`; });
  }
  if (habits.length) {
    prompt += `\nBereits verknüpfte Gewohnheiten:\n`;
    habits.forEach(h => { prompt += `- ${h.title} (${h.frequency === "weekdays" ? "Mo–Fr" : "täglich"})\n`; });
  }

  prompt += `\nSchlag mir bitte 3-6 konkrete nächste Schritte (Aufgaben oder Gewohnheiten) vor, die ich in den Tracker eintragen kann, um dieses Ziel voranzubringen.`;
  return prompt;
}

async function copyDecomposePrompt(goalId, btn) {
  const goal = goalById(goalId);
  if (!goal) return;
  const prompt = buildDecomposePrompt(goal);
  try {
    await navigator.clipboard.writeText(prompt);
    flashButton(btn, "✅");
  } catch (e) {
    downloadText(prompt, `Zerlegen_${goal.title.replace(/[^a-z0-9]+/gi, "_")}.txt`);
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

function removeGoalCascade(goalId) {
  const children = state.goals.filter(g => g.parentId === goalId);
  children.forEach(c => removeGoalCascade(c.id));
  state.goals = state.goals.filter(g => g.id !== goalId);
  state.tasks.forEach(t => { if (t.goalId === goalId) t.goalId = null; });
  state.habits.forEach(h => { if (h.goalId === goalId) h.goalId = null; });
}

// ---------- Add buttons ----------
document.getElementById("addGoalBtn").addEventListener("click", () => openGoalModal("long", null));
document.getElementById("addTaskBtn").addEventListener("click", () => openTaskModal());
document.getElementById("addHabitBtn").addEventListener("click", () => openHabitModal());
document.getElementById("exportWeekBtn").addEventListener("click", exportWeekReview);
document.getElementById("addSubjectBtn").addEventListener("click", () => openSubjectModal());
document.getElementById("addExamBtn").addEventListener("click", () => openExamModal());

function levelLabel(level) {
  return level === "long" ? "Langfristiges Ziel" : level === "mid" ? "Mittelfristiger Meilenstein" : "Kurzfristiges Ziel";
}

function goalOptionsHtml() {
  return allGoalsFlat().map(({ goal, depth }) =>
    `<option value="${goal.id}">${"　".repeat(depth)}${levelIcon(goal.level)} ${escapeHtml(goal.title)}</option>`
  ).join("");
}

function openGoalModal(level, parentId) {
  openModal(`
    <h3>${levelLabel(level)} hinzufügen</h3>
    <div class="field">
      <label>Titel</label>
      <input type="text" id="mGoalTitle" placeholder="z.B. Marathon laufen">
    </div>
    <div class="field">
      <label>Zieltermin (optional)</label>
      <input type="date" id="mGoalDate">
    </div>
    ${level === "long" ? `
    <div class="checkbox-row">
      <input type="checkbox" id="mGoalPriority">
      <label for="mGoalPriority">Priorität Nr. 1 (steht in der Zielübersicht oben)</label>
    </div>` : ""}
    <div class="modal-actions">
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Speichern</button>
    </div>
  `, body => {
    body.querySelector("#mGoalTitle").focus();
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    body.querySelector("#mSave").addEventListener("click", () => {
      const title = body.querySelector("#mGoalTitle").value.trim();
      if (!title) return;
      const dueDate = body.querySelector("#mGoalDate").value || null;
      const priorityEl = body.querySelector("#mGoalPriority");
      const priority = priorityEl ? priorityEl.checked : false;
      state.goals.push({ id: uid(), title, level, parentId, dueDate, manualProgress: 0, priority });
      saveData();
      closeModal();
      renderAll();
    });
  });
}

function openTaskModal() {
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
      <label>Verknüpftes Ziel (optional)</label>
      <select id="mTaskGoal">
        <option value="">– keins –</option>
        ${goalOptionsHtml()}
      </select>
    </div>
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
      const goalId = body.querySelector("#mTaskGoal").value || null;
      state.tasks.push({ id: uid(), title, dueDate, dueTime, goalId, done: false, completedAt: null, createdAt: new Date().toISOString(), size });
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
      <label>Verknüpftes Ziel (optional)</label>
      <select id="mHabitGoal">
        <option value="">– keins –</option>
        ${goalOptionsHtml()}
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
      const goalId = body.querySelector("#mHabitGoal").value || null;
      const frequency = body.querySelector("#mHabitFrequency").value;
      state.habits.push({ id: uid(), title, goalId, history: {}, createdAt: new Date().toISOString(), frequency });
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
    md += `- **${h.title}**: ${doneCount}/${scheduledCount} Tage · Streak: ${streak} 🔥\n`;
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

  md += `\n## Zielfortschritt\n`;
  goalsByLevel("long", null).forEach(g => {
    md += `- **${g.title}**${g.priority ? " ★" : ""}: ${Math.round(goalProgress(g) * 100)}%\n`;
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
