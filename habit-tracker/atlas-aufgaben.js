// ============================================================
// Atlas — atlas-aufgaben.js
// Zielknoten-Helfer, Ideal-/Minimalstufe, Aufgabenzeile und ihre drei Zustaende
//
// Teil von app.js, das auf 9 Dateien aufgeteilt wurde. Die Reihenfolge in index.html
// entspricht exakt der frueheren Reihenfolge in der einen Datei -- die Dateien teilen sich
// weiterhin einen Gueltigkeitsbereich, es sind bewusst KEINE Module. Dadurch aendert das
// Aufteilen am Verhalten nichts; nur Funktionen werden nicht mehr ueber Dateigrenzen hinweg
// vorgezogen, weshalb Code, der sofort laeuft, hinter seinen Funktionen stehen muss.
// ============================================================

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
  const seen = new Set();
  while (n && !seen.has(n.id)) {
    if (n.priority) return true;
    seen.add(n.id);
    n = n.parentId ? nodeById(n.parentId) : null;
  }
  return false;
}
// Liefert null, wenn unter diesem Knoten nichts geplant ist — keine Aufgaben, keine Gewohnheiten,
// und kein Unterknoten, der selbst etwas enthält. Vorher kam in dem Fall 0 % heraus, was zwei Dinge
// verwechselte: "nichts vorgenommen" und "vorgenommen, nichts geschafft". Weil leere Kinder in den
// Elternschnitt einflossen, zog blosses Gerüst den Fortschritt nach unten — ein Bereich mit einem
// fertigen und drei leeren Unterbereichen stand auf 25 % statt 100 %. In Tims Daten betrifft das
// rund 59 % aller Knoten.
function nodeProgress(node, seen = new Set()) {
  if (seen.has(node.id)) return null;
  seen.add(node.id);
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
    const gefuellteKinder = children.map(c => nodeProgress(c, seen)).filter(v => v !== null);
    if (gefuellteKinder.length) {
      parts.push(gefuellteKinder.reduce((a, b) => a + b, 0) / gefuellteKinder.length);
    }
  }
  if (parts.length === 0) return null;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}
// Prozentwert fuer die Anzeige; null wird zu einem Strich statt zu einer Null.
function nodeProgressPct(node) {
  const v = nodeProgress(node);
  return v === null ? null : Math.round(v * 100);
}
// Ist ein Knoten fertig? Leere Knoten sind es ausdruecklich NICHT — sonst waere jedes ungefuellte
// Geruest automatisch "erledigt", der genau umgekehrte Fehler.
function nodeIstFertig(node) {
  const p = nodeProgressPct(node);
  return p !== null && p >= 100;
}
function nodePath(nodeId) {
  const path = [];
  let n = nodeById(nodeId);
  const seen = new Set();
  while (n && !seen.has(n.id)) {
    seen.add(n.id);
    path.unshift(n);
    n = n.parentId ? nodeById(n.parentId) : null;
  }
  return path;
}
function allNodesFlat() {
  const result = [];
  const seen = new Set();
  function walk(parentId, depth) {
    childNodes(parentId).forEach(n => {
      if (seen.has(n.id)) return;
      seen.add(n.id);
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
// Nur die Oberkategorien (für die ToDo-Zielbereich-Zuordnung, ohne die Lebenswissen-Unterordner)
function rootNodeOptionsHtml() {
  return childNodes(null).map(node => `<option value="${node.id}">${escapeHtml(node.title)}</option>`).join("");
}
function isScheduledToday(habit, dateObj = new Date()) {
  if (habit.frequency === "weekdays") {
    const day = dateObj.getDay(); // 0 So, 6 Sa
    return day >= 1 && day <= 5;
  }
  if (habit.frequency === "interval") {
    const n = habit.intervalDays || 1;
    const createdKey = localDateKey(new Date(habit.createdAt));
    const dateKey = localDateKey(dateObj);
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

// Punktgewichtet statt Tage gezaehlt: ein Tag auf Minimalstufe ist ein gehaltener, aber
// abgesenkter Tag. Vorher zaehlte er wie ein voller -- wer 30 Tage lang nur die kleine Version
// geschafft hat, stand in der Auswertung auf 100 %, und die Quote konnte gar nicht zeigen, wo
// die Latte unten war. Gerechnet wird mit denselben Punkten wie Ring und Heatmap
// (habitPointsOn), damit dieselbe Woche ueberall dieselbe Zahl ergibt.
function habitCompletionRate(habit, days = 30) {
  let soll = 0, ist = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (new Date(habit.createdAt) > d) continue;
    if (!isScheduledToday(habit, d)) continue;
    soll += habit.points ?? 1;
    ist += habitPointsOn(habit, localDateKey(d));
  }
  return soll === 0 ? 0 : ist / soll;
}

// Wie viele der faelligen Tage im Fenster auf der kleinen Version standen. Damit eine Quote von
// 80 % nicht offenlaesst, ob sie aus vollen Tagen oder aus lauter Minimalstufen kommt.
function habitMinimalDays(habit, days = 30) {
  let n = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (new Date(habit.createdAt) > d) continue;
    if (!isScheduledToday(habit, d)) continue;
    if (habit.history[localDateKey(d)] === "minimal") n++;
  }
  return n;
}

// ---------- Ideal- und Minimalstufe einer Gewohnheit ----------
// Jede Gewohnheit kann eine zweite, niedrigere Latte haben (h.minimalTitle), z. B. "6 Uhr aufstehen"
// als Ideal und "7 Uhr aufstehen" als Minimum. Der Regler in der Zeile waehlt die Stufe fuer den
// jeweiligen Tag; gespeichert wird sie in h.levelByDate[Datum]. Jeder Tag startet auf "ideal".
// Wichtig zur Abgrenzung vom 2026-07 wieder entfernten "Minimal-Tag": hier wird nichts ausgeblendet,
// nur die Anforderung gesenkt — die Gewohnheit bleibt sichtbar und zaehlt weiter mit.
// Minimal zaehlt ein Viertel weniger als Ideal, nicht die Haelfte: die kleine Version ist eine
// abgesenkte Latte, kein halber Tag -- wer sie schafft, hat den Tag gehalten.
// Die Stufe wird gespeichert, nicht die Punktzahl (h.levelByDate bzw. h.history). Der Faktor
// wirkt deshalb rueckwirkend auf alles schon Abgehakte -- gewollt, sonst haetten alte und
// neue Tage verschiedene Massstaebe in derselben Auswertung.
const HABIT_MINIMAL_FACTOR = 0.75;

function habitHasMinimal(habit) {
  return !!(habit.minimalTitle && habit.minimalTitle.trim());
}
// Reglerstellung fuer einen Tag. Gilt fuer JEDE Gewohnheit — auch ohne eigenen Minimaltext:
// "minimal" heisst dann schlicht "heute die kleine Version", zaehlt halbe Punkte und haelt die
// Serie. Ein hinterlegter Minimaltext aendert zusaetzlich die Beschriftung der Zeile.
function habitLevelOn(habit, dateKey) {
  if (habit.noMinimal) return "ideal";
  return (habit.levelByDate || {})[dateKey] === "minimal" ? "minimal" : "ideal";
}
// Angezeigter Text der aktuell eingestellten Stufe.
function habitTitleOn(habit, dateKey) {
  return (habitLevelOn(habit, dateKey) === "minimal" && habitHasMinimal(habit))
    ? habit.minimalTitle.trim()
    : habit.title;
}
// Erledigt? Deckt Alt-Daten (true), Gewichtswerte (Zahl) und die neuen Stufenwerte ab.
function habitDoneOn(habit, dateKey) {
  const v = habit.history[dateKey];
  if (habit.type === "weight") return v !== undefined && v !== null;
  return !!v;
}
// Punktwert des Tages: ideal volle Punkte, minimal die Haelfte, nicht erledigt null.
// Alt-Eintraege stehen auf true und zaehlen unveraendert voll — kein Datenumbau noetig.
function habitPointsOn(habit, dateKey) {
  if (!habitDoneOn(habit, dateKey)) return 0;
  const full = habit.points ?? 1;
  return habit.history[dateKey] === "minimal" ? full * HABIT_MINIMAL_FACTOR : full;
}
// Punkte fuer die Anzeige: 2 statt 2,0 — aber 0,5 bleibt 0,5.
function formatPoints(n) {
  // Zwei Nachkommastellen, wo sie noetig sind. Mit einer stand bei einem Punkt auf Minimalstufe
  // "0,8 Punkte statt 1" -- gerechnet wird aber mit 0,75, und die Summen im Ring und in der
  // Auswertung gingen dadurch sichtbar nicht mit den einzelnen Zeilen zusammen.
  return Number.isInteger(n) ? String(n) : n.toLocaleString("de-DE", { maximumFractionDigits: 2 });
}

// Der Regler selbst. Ein Knopf mit data-level, damit CSS die Knopfstellung uebernimmt und JS nur
// den Zustand umschaltet.
function levelSwitchHtml(habit, dateKey) {
  // Steht in jeder Zeile, ohne Bearbeiten-Modus und ohne Vorbedingung — vorher erschien er nur,
  // wenn vorher ueber das Plus-Menue ein Minimaltext hinterlegt worden war, wodurch die Funktion
  // von aussen schlicht nicht zu finden war.
  // Ausgenommen Gewichts-Gewohnheiten (dort wird ein Messwert eingetragen, keine Stufe erfuellt)
  // und Gewohnheiten, die im Dialog ausdruecklich als "ganz oder gar nicht" markiert wurden —
  // bei "Blumen giessen" gibt es keine halbe Version.
  if (habit.type === "weight" || habit.noMinimal) return "";
  const level = habitLevelOn(habit, dateKey);
  // Der ganze Block ist der Knopf — Spur, Ecken und Beschriftung schalten alle um. Waere nur die
  // Pille selbst antippbar, gingen ihre abgerundeten Ecken als Trefferflaeche verloren (gemessen
  // 9 % tote Flaeche), und das Ziel waere mit 50x28 unnoetig klein statt 50x46.
  return `
    <button class="level-switch-wrap" data-level="${level}" data-habit-level="${habit.id}" data-level-date="${dateKey}"
            role="switch" aria-checked="${level === "minimal"}"
            aria-label="${habit.title}: ${level === "minimal" ? "Minimalstufe aktiv, auf Ideal stellen" : "Idealstufe aktiv, auf Minimal stellen"}">
      <span class="level-switch" data-level="${level}"><span class="level-knob"></span></span>
      <span class="level-switch-label">${level === "minimal" ? "Minimal" : ""}</span>
    </button>`;
}

// Fragt den Namen der kleinen Version ab. Bewusst NACH dem Umlegen: der Regler reagiert sofort,
// die Frage kommt obendrauf und laesst sich uebergehen -- dann bleibt es bei halben Punkten ohne
// eigenen Namen, so wie bisher.
function openMinimalTitelModal(habit) {
  // closeModal() setzt currentDaySheetKey auf null. Wurde der Regler im Tagesblatt umgelegt,
  // waere der Rueckweg damit weg -- bei "Ohne Namen" landete man auf dem Tab statt wieder im
  // Tagesblatt, und nach dem Speichern lief das openDaySheet() am Ende ins Leere.
  const tagesblattKey = currentDaySheetKey;
  openModal(`
    <h3>Wie heißt die kleine Version?</h3>
    <p class="text-muted" style="font-size:var(--text-sm); margin:0 0 12px;">
      „${escapeHtml(habit.title)}“ steht jetzt auf der niedrigeren Latte. Gib ihr einen eigenen
      Namen, dann heißt die Zeile so, sobald der Regler rechts steht.
    </p>
    <div class="field">
      <label>Name auf Minimalstufe</label>
      <input type="text" id="mMinTitel" value="${escapeHtml(habit.title)}">
      <p class="hint" style="margin-top:4px;">Beispiel: „6 Uhr aufstehen“ wird zu „7 Uhr aufstehen“.</p>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="mMinSkip">Ohne Namen</button>
      <button class="btn btn-primary" id="mMinSave">Speichern</button>
    </div>
  `, body => {
    const feld = body.querySelector("#mMinTitel");
    feld.focus();
    feld.select();
    body.querySelector("#mMinSkip").addEventListener("click", () => {
      closeModal();
      if (tagesblattKey) openDaySheet(tagesblattKey);
    });
    body.querySelector("#mMinSave").addEventListener("click", () => {
      const wert = feld.value.trim();
      if (!wert) { markiereFehlendesFeld(feld, "Schreib den Namen der kleinen Version hin — oder geh ohne Namen weiter."); return; }
      if (wert === habit.title) { markiereFehlendesFeld(feld, "Das ist derselbe Name wie auf der Idealstufe. Dann ändert sich beim Umlegen nichts."); return; }
      habit.minimalTitle = wert;
      saveData();
      closeModal();
      renderAll();
      if (tagesblattKey) openDaySheet(tagesblattKey);
    });
    feld.addEventListener("keydown", ev => { if (ev.key === "Enter") body.querySelector("#mMinSave").click(); });
  });
}

function computeStreak(habit) {
  let streak = 0;
  let d = new Date();
  const createdDate = new Date(habit.createdAt);
  if (!habit.history[todayStr()] && isScheduledToday(habit, d)) {
    d.setDate(d.getDate() - 1);
  }
  let guard = 0;
  while (guard++ < 3660) {
    if (d < createdDate) break;
    if (!isScheduledToday(habit, d)) {
      d.setDate(d.getDate() - 1);
      continue;
    }
    const key = localDateKey(d);
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
// Klick auf die Zeile klappt die Detailansicht (Beschreibung + Metadaten) für genau dieses ToDo
// auf/zu; Doppelklick auf die Zeile hakt ab (wie der Check-Button). Rein per UI-State, nicht
// persistiert -- expandedTaskIds lebt nur im Tab-Modul, kein saveData() nötig.
const expandedTaskIds = new Set();

// ---------- Drei Aufgabenzustaende ----------
// Bewusst NICHT als ein Statusfeld umgebaut: t.done wird an gut zwei Dutzend Stellen gelesen
// (Roadmap-Fortschritt, Wochenstatistik, Export, Import). "In Arbeit" liegt deshalb als eigenes
// Merkmal daneben und gilt nur, solange die Aufgabe nicht erledigt ist. Altbestand bleibt gueltig,
// keine Migration noetig.
const TASK_STATES = ["offen", "inArbeit", "erledigt"];
function taskStatus(t) {
  if (t.done) return "erledigt";
  return t.inProgress ? "inArbeit" : "offen";
}
function setTaskStatus(t, status) {
  if (status === "erledigt") {
    t.done = true;
    t.completedAt = t.completedAt || new Date().toISOString();
    delete t.inProgress;
  } else {
    t.done = false;
    t.completedAt = null;
    if (status === "inArbeit") t.inProgress = true; else delete t.inProgress;
  }
}
// Reihum: offen -> in Arbeit -> erledigt -> offen.
function cycleTaskStatus(t) {
  const next = TASK_STATES[(TASK_STATES.indexOf(taskStatus(t)) + 1) % TASK_STATES.length];
  setTaskStatus(t, next);
  return next;
}
// Halb gefuellter Kreis im selben Messing-Verlauf wie die Erledigt-Kleckse — liest sich als
// "angefangen", nicht als "erledigt" und nicht als leer.
function inProgressSvg() {
  return `<svg width="13" height="13" viewBox="0 0 12 12" style="overflow:visible;">
    <circle cx="6" cy="6" r="5" fill="none" stroke="url(#goldGradRing)" stroke-width="1.6"/>
    <path d="M6 1 A5 5 0 0 0 6 11 Z" fill="url(#goldGradRing)"/>
  </svg>`;
}
// Merkt den letzten 100-%-Zustand des ToDo-Rings, um das einmalige Aufflammen vom blossen
// Neurendern zu unterscheiden. null = in dieser Sitzung noch nicht gesetzt.
let lastAllDueDone = null;

function renderTaskItem(t) {
  const today = todayStr();
  const overdue = !t.done && t.dueDate && t.dueDate < today;
  const node = nodeById(t.nodeId);
  const isLernfeld = t.source === "category" && t.learnType;
  const lerntyp = isLernfeld ? lerntypById(t.learnType) : null;
  const effort = effortLevelInfo(t.size);
  // Die Aufwandsstufe stand vorher als nackte Zahl vor ihrem eigenen Namen ("2 · Kurzaufgabe") —
  // die Zahl trägt nichts, was das Wort nicht schon sagt.
  const metaParts = isLernfeld ? [] : [escapeHtml(effort.label)];
  if (t.dueDate) {
    const faellig = "fällig " + formatDatum(t.dueDate) + (t.dueTime ? ", " + t.dueTime : "");
    // Überfällig färbt das Datum selbst, statt daneben einen zweiten roten Chip zu stellen: der
    // war das breiteste Element der Zeile und stand bei fast jeder Aufgabe — als Warnung damit
    // wertlos, und er wiederholte nur, was das Datum schon sagt.
    metaParts.push(overdue
      ? `<span class="meta-overdue">${escapeHtml(faellig)} · überfällig</span>`
      : escapeHtml(faellig));
  }
  if (!isLernfeld && t.priority >= 3) metaParts.push(`<span class="meta-prio">Priorität: ${PRIORITAETS_WORT[t.priority]}</span>`);
  if (node && !isLernfeld) metaParts.push(escapeHtml(node.title));
  const dueToday = t.dueDate === today;
  const status = taskStatus(t);
  const expanded = expandedTaskIds.has(t.id);
  const titleHtml = t.done
    ? `<div class="item-title paint-done-title">
        <span class="paint-done-stroke">${paintStrokeSvgHtml(t.id)}</span>
        <span class="paint-done-text">${escapeHtml(t.title)}</span>
      </div>`
    : `<div class="item-title">${escapeHtml(t.title)}</div>`;
  const el = document.createElement("div");
  el.className = "task-item" + (expanded ? " expanded" : "");
  el.innerHTML = `
    <div class="atlas-row${t.done ? " done" : ""}${dueToday ? " gold-frame" : ""}${status === "inArbeit" ? " in-arbeit" : ""}" data-task-row="${t.id}">
      <button class="atlas-check${t.done ? " checked" : ""}${status === "inArbeit" ? " in-progress" : ""}" data-task="${t.id}"
              aria-label="${status === "offen" ? "Als in Arbeit markieren" : status === "inArbeit" ? "Als erledigt markieren" : "Wieder auf offen setzen"}"
              >${t.done ? splatSvg(t.id) : (status === "inArbeit" ? inProgressSvg() : "")}</button>
      ${isLernfeld ? `<span style="color:var(--color-accent-400); flex-shrink:0;" title="${escapeHtml(lerntyp.label)}">${lerntyp.icon}</span>` : ""}
      <div style="flex:1; min-width:0;">
        ${titleHtml}
        <div class="item-meta">${status === "inArbeit" ? '<span class="meta-progress">In Arbeit</span> · ' : ""}${(isLernfeld ? [escapeHtml(lerntyp.label), ...metaParts] : metaParts).join(" · ")}</div>
      </div>
      <button class="btn btn-icon btn-ghost" data-del-task="${t.id}" aria-label="Löschen"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 1.5L11.5 11.5M11.5 1.5L1.5 11.5" stroke="var(--color-neutral-500)" stroke-width="1.4" stroke-linecap="round"/></svg></button>
    </div>
    ${!isLernfeld && expanded ? `
    <div class="task-expand">
      <label>Beschreibung</label>
      <textarea data-task-notes="${t.id}" rows="3" placeholder="Details, Kontext, nächste Schritte…">${escapeHtml(t.notes || "")}</textarea>
      <div class="task-expand-meta">
        <span>Aufwand: ${effort.level} · ${escapeHtml(effort.label)} (${escapeHtml(effort.time)})</span>
        ${t.dueDate ? `<span>Fällig: ${formatDatum(t.dueDate)}${t.dueTime ? " · " + t.dueTime : ""}</span>` : ""}
        ${t.priority > 0 ? `<span>Priorität: ${PRIORITAETS_WORT[t.priority] || t.priority}</span>` : ""}
        ${node ? `<span>Zielbereich: ${escapeHtml(node.title)}</span>` : ""}
      </div>
    </div>` : ""}
  `;
  return el;
}

function renderTodo() {
  // Gleicher Fokus-Schutz wie bei renderProjekte: ein offenes ToDo-Detailfeld, in dem gerade
  // getippt wird, ueberlebt zwischenzeitliche Renders.
  const activeNotes = document.activeElement;
  if (activeNotes && activeNotes.matches && activeNotes.matches("[data-task-notes]")) return;
  const wrap = document.getElementById("todoList");
  wrap.innerHTML = "";

  const todoTasks = state.tasks.filter(t => (t.source || "todo") !== "category");

  const today = todayStr();
  // Ring-Füllung + mittige Zahl + Glüh-Bedingung: heute fällige oder überfällige Aufgaben / davon abgehakte.
  // Jede erledigte Aufgabe füllt 1/Anzahl-fällig des Rings (bei 4 fälligen also 25% pro Erledigung).
  const dueOrOverdueAll = todoTasks.filter(t => t.dueDate && t.dueDate <= today);
  const dueOrOverdueDoneCount = dueOrOverdueAll.filter(t => t.done).length;
  const ruleEl = document.getElementById("dayRule");
  // Zaehlen nur Aufgaben mit Termin, stand hier "0/0", obwohl offene Arbeit da war. Ohne faellige
  // Aufgaben zeigt der Ring deshalb die Zahl der offenen Aufgaben ohne Termin statt einer Null.
  const ohneTermin = todoTasks.filter(t => !t.done && !t.dueDate).length;
  // Nur der echte Wechsel auf "alles erledigt" flammt auf. null = erster Render der Sitzung
  // (beim Oeffnen der App soll nichts aufblitzen, es hat sich ja nichts geaendert), und jedes
  // spaetere renderAll() im selben Zustand laesst den Ring in Ruhe.
  const allDueDoneNow = dueOrOverdueAll.length > 0 && dueOrOverdueDoneCount >= dueOrOverdueAll.length;
  const celebrate = lastAllDueDone === false && allDueDoneNow;
  lastAllDueDone = allDueDoneNow;
  ruleEl.innerHTML = dayBudgetRing(dueOrOverdueAll.length, dueOrOverdueDoneCount, 200, celebrate, ohneTermin);

  const openTasks = todoTasks
    .filter(t => !t.done)
    .sort((a, b) => {
      // Angefangenes zuerst — was schon laeuft, soll man nicht suchen muessen.
      const ai = a.inProgress ? 0 : 1, bi = b.inProgress ? 0 : 1;
      if (ai !== bi) return ai - bi;
      const ad = a.dueDate || "9999-99-99", bd = b.dueDate || "9999-99-99";
      if (ad !== bd) return ad.localeCompare(bd);
      return (b.priority || 0) - (a.priority || 0);
    });

  // Woche wechselt Sonntag 23:59 -> Montag 00:00. Erledigte ToDos dieser Woche bleiben direkt in der
  // Liste sichtbar; alles aus der Vorwoche wandert automatisch ins Archiv darunter (kein manueller
  // Export mehr nötig, die ToDos gehen dabei nicht mehr verloren).
  const thisMondayKey = localDateKey(mondayOfWeek(new Date()));
  const lastMonday = mondayOfWeek(new Date());
  lastMonday.setDate(lastMonday.getDate() - 7);
  const lastMondayKey = localDateKey(lastMonday);

  // completedAt ist ein UTC-Zeitstempel; .slice(0,10) daraus ergibt nachts zwischen 00:00 und
  // 02:00 Ortszeit den Vortag. Eine Montag frueh abgehakte Aufgabe rutschte dadurch sofort ins
  // Archiv "Letzte Woche". Deshalb ueber den lokalen Datumsschluessel vergleichen.
  const doneKey = t => localDateKey(new Date(t.completedAt));
  const doneTasks = todoTasks.filter(t => t.done && t.completedAt && doneKey(t) >= thisMondayKey);
  const lastWeekDoneTasks = todoTasks
    .filter(t => t.done && t.completedAt && doneKey(t) >= lastMondayKey && doneKey(t) < thisMondayKey)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  if (openTasks.length === 0 && doneTasks.length === 0) {
    wrap.innerHTML = '<div class="empty-hint">Noch keine Aufgaben angelegt.</div>';
  } else {
    openTasks.forEach(t => wrap.appendChild(renderTaskItem(t)));
    doneTasks.forEach(t => wrap.appendChild(renderTaskItem(t)));
  }

  const lastWeekWrap = document.getElementById("todoLastWeekWrap");
  const lastWeekList = document.getElementById("todoLastWeekList");
  lastWeekWrap.style.display = lastWeekDoneTasks.length ? "" : "none";
  lastWeekList.innerHTML = "";
  lastWeekDoneTasks.forEach(t => lastWeekList.appendChild(renderTaskItem(t)));
}
