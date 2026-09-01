// ============================================================
// Atlas — atlas-heute.js
// Heute: Wochenkreis, Abweichung, Tagesroutine, Ziehen zum Umsortieren
//
// Teil von app.js, das auf 9 Dateien aufgeteilt wurde. Die Reihenfolge in index.html
// entspricht exakt der frueheren Reihenfolge in der einen Datei -- die Dateien teilen sich
// weiterhin einen Gueltigkeitsbereich, es sind bewusst KEINE Module. Dadurch aendert das
// Aufteilen am Verhalten nichts; nur Funktionen werden nicht mehr ueber Dateigrenzen hinweg
// vorgezogen, weshalb Code, der sofort laeuft, hinter seinen Funktionen stehen muss.
// ============================================================

// ---------- Rendering: Heute (Wochenkreis, Abweichung, Routine, weitere Habits) ----------
const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function mondayOfWeek(dateObj) {
  const d = new Date(dateObj);
  const offset = (d.getDay() + 6) % 7; // Mo=0 ... So=6
  d.setDate(d.getDate() - offset);
  return d;
}

// Weiches, "auslaufendes" Conic-Gradient-Prozent-Overlay (Pinsel-Bleed statt harter Kante)
function conicPercentMask(pct, feather = 10) {
  if (pct <= 0.5) return `conic-gradient(from -90deg, transparent 0deg, transparent 360deg)`;
  if (pct >= 99.5) return `conic-gradient(from -90deg, white 0deg, white 360deg)`;
  const pctDeg = pct * 3.6;
  const startFeather = Math.min(feather, pctDeg / 2);
  const endFeather = Math.min(feather, (360 - pctDeg) / 2, pctDeg / 2);
  return `conic-gradient(from -90deg,` +
    ` transparent 0deg, white ${startFeather.toFixed(1)}deg,` +
    ` white ${(pctDeg - endFeather).toFixed(1)}deg, transparent ${(pctDeg + endFeather).toFixed(1)}deg,` +
    ` transparent 360deg)`;
}

// Der "Tageskreis"-Look: Wochentag-Tinten-Maske + goldenes Conic-Gradient + weicher Glanz-Overlay.
// Wird für den Wochenkreis (Heute) UND für die Roadmap-Ebene-1-Kreise verwendet — exakt dasselbe Design.
function goldRingHtml(pct, size = 200, maskIdx = 0, fontSize = null) {
  const maskUrl = `assets/${RING_MASKS[maskIdx % RING_MASKS.length]}`;
  const percentMask = conicPercentMask(pct);
  const fs = fontSize || Math.round(size * 0.17);
  return `
    <div style="position:relative; width:${size}px; height:${size}px;">
      <div style="position:absolute; inset:0;
        background:rgba(255,255,255,0.16);
        -webkit-mask-image:url('${maskUrl}'); -webkit-mask-size:100% 100%; -webkit-mask-repeat:no-repeat; -webkit-mask-position:center;
        mask-image:url('${maskUrl}'); mask-size:100% 100%; mask-repeat:no-repeat; mask-position:center;"></div>
      <div style="position:absolute; inset:0;
        background:conic-gradient(from -90deg, var(--color-accent-700) 0%, var(--color-accent-100) 16.6%, var(--color-accent-600) 33.3%, var(--color-accent-200) 50%, var(--color-accent-700) 66.6%, var(--color-accent-300) 83.3%, var(--color-accent-700) 100%);
        -webkit-mask-image:url('${maskUrl}'), ${percentMask}; -webkit-mask-size:100% 100%, 100% 100%; -webkit-mask-repeat:no-repeat, no-repeat; -webkit-mask-position:center, center; -webkit-mask-composite:source-in;
        mask-image:url('${maskUrl}'), ${percentMask}; mask-size:100% 100%, 100% 100%; mask-repeat:no-repeat, no-repeat; mask-position:center, center; mask-composite:intersect;
        filter:drop-shadow(0 0 5px color-mix(in srgb, var(--color-accent) 50%, transparent));"></div>
      <div style="position:absolute; inset:0;
        background:radial-gradient(circle at 32% 24%, rgba(255,255,255,0.9), transparent 55%);
        mix-blend-mode:overlay; opacity:0.6;
        -webkit-mask-image:url('${maskUrl}'), ${percentMask}; -webkit-mask-size:100% 100%, 100% 100%; -webkit-mask-repeat:no-repeat, no-repeat; -webkit-mask-position:center, center; -webkit-mask-composite:source-in;
        mask-image:url('${maskUrl}'), ${percentMask}; mask-size:100% 100%, 100% 100%; mask-repeat:no-repeat, no-repeat; mask-position:center, center; mask-composite:intersect;"></div>
      <span style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:${fs}px; font-family:var(--font-heading); color:var(--color-neutral-100); text-shadow:0 1px 4px rgba(0,0,0,0.6);">${Math.round(pct)}%</span>
    </div>
  `;
}

function renderWeekCircle() {
  const wrap = document.getElementById("weekCircle");
  const today = new Date();
  const todayKey = todayStr();
  const todayIdx = (today.getDay() + 6) % 7; // Mo=0 ... So=6

  // Alle heute faelligen Gewohnheiten zaehlen — auch die unter "Weitere Gewohnheiten". Vorher
  // war der Ring auf die Tagesroutine beschraenkt, wodurch eine erledigte weitere Gewohnheit
  // (z. B. Blumen giessen) sichtbar nichts bewirkte, obwohl sie Punkte trug.
  const scheduled = state.habits.filter(h => new Date(h.createdAt) <= today && isScheduledToday(h, today));
  const doneHabits = scheduled.filter(h => habitDoneOn(h, todayKey));
  const done = doneHabits.length;
  const totalPoints = scheduled.reduce((sum, h) => sum + (h.points ?? 1), 0);
  // Minimal erledigte Schritte zaehlen halb — der Ring bleibt damit ehrlich, ohne den Tag
  // als Totalausfall zu werten.
  const earnedPoints = doneHabits.reduce((sum, h) => sum + habitPointsOn(h, todayKey), 0);
  // Ohne faellige Routine-Schritte gibt es nichts zu erfuellen — dann ist "0 %" keine Aussage,
  // sondern ein falscher Vorwurf. In dem Fall bleibt der Ring leer und zeigt einen Strich.
  const nichtsGeplant = totalPoints === 0;
  const pct = nichtsGeplant ? 0 : Math.round((earnedPoints / totalPoints) * 100);

  wrap.title = `${todayKey}: ${scheduled.length ? done + "/" + scheduled.length + " Gewohnheiten (" + formatPoints(earnedPoints) + "/" + formatPoints(totalPoints) + " Punkte)" : "heute nichts fällig"}`;
  wrap.innerHTML = `
    <div style="display:flex; justify-content:center; margin-bottom:30px;">
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
        ${nichtsGeplant ? goldRingHtml(0, 200, todayIdx, 34).replace(">0%<", ">–<") : goldRingHtml(pct, 200, todayIdx, 34)}
        <span style="font-size:var(--text-2xs); font-family:var(--font-heading); color:var(--color-accent-300);">${WEEKDAY_LABELS[todayIdx]}</span>
      </div>
    </div>
  `;
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

const SUBJECT_ROTATION_EPOCH = new Date(2026, 0, 1);

// Findet den Lern-Routine-Schritt über seine Verknüpfung zum "Schule"-Zielbereich statt über
// eine fixe routineOrder-Position (die sich durchs Ziehen/Umsortieren jederzeit ändern kann).
function learningRoutineHabit(habits) {
  return habits.find(h => {
    const node = nodeById(h.nodeId);
    return node && node.title === "Schule";
  }) || null;
}


// "P4" sagt nicht, ob 4 viel oder wenig ist — je nach System ist mal 1 und mal 5 das Dringendste.
// In der Zeile steht deshalb ein Wort, und nur dort, wo es etwas heißt: niedrige Prioritäten
// sind der Normalfall und stehen weiterhin in der aufgeklappten Ansicht.
const PRIORITAETS_WORT = { 3: "Mittel", 4: "Hoch", 5: "Höchste" };


function subjectOfDay(dateObj) {
  const key = localDateKey(dateObj);
  const overrideId = state.subjectOverride[key];
  if (overrideId) {
    const overridden = state.subjects.find(s => s.id === overrideId);
    if (overridden) return overridden;
  }
  if (!state.subjects.length) return null;
  const diffDays = Math.floor((dateObj - SUBJECT_ROTATION_EPOCH) / 86400000);
  const idx = ((diffDays % state.subjects.length) + state.subjects.length) % state.subjects.length;
  return state.subjects[idx];
}

function openSubjectOverrideModal() {
  const key = todayStr();
  openModal(`
    <h3>Heutiges Hauptfach ändern</h3>
    <div class="field">
      <label>Fach für heute</label>
      <select id="mSubjectOverride">
        <option value="">– automatische Rotation –</option>
        ${state.subjects.map(s => `<option value="${s.id}" ${state.subjectOverride[key] === s.id ? "selected" : ""}>${escapeHtml(s.title)}</option>`).join("")}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Speichern</button>
    </div>
  `, body => {
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    body.querySelector("#mSave").addEventListener("click", () => {
      const val = body.querySelector("#mSubjectOverride").value;
      if (val) state.subjectOverride[key] = val;
      else delete state.subjectOverride[key];
      saveData();
      closeModal();
      renderAll();
    });
  });
}

function examOverride(dateObj) {
  const todayMidnight = dateFromKey(localDateKey(dateObj));
  const upcoming = state.exams
    .map(e => ({ ...e, subject: state.subjects.find(s => s.id === e.subjectId) }))
    .filter(e => e.subject)
    .map(e => ({ ...e, daysUntil: Math.round((dateFromKey(e.date) - todayMidnight) / 86400000) }))
    .filter(e => e.daysUntil >= 0 && e.daysUntil <= 4)
    .sort((a, b) => a.daysUntil - b.daysUntil);
  return upcoming[0] || null;
}

function dragHandleHtml(habitId) {
  if (!quickAddVisible) return "";
  return `
    <button class="btn btn-icon btn-ghost routine-drag-handle" data-drag-handle="${habitId}" aria-label="Ziehen zum Verschieben" style="touch-action:none; cursor:grab;">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="4" cy="3" r="1" fill="var(--color-neutral-400)"/><circle cx="8" cy="3" r="1" fill="var(--color-neutral-400)"/><circle cx="4" cy="6" r="1" fill="var(--color-neutral-400)"/><circle cx="8" cy="6" r="1" fill="var(--color-neutral-400)"/><circle cx="4" cy="9" r="1" fill="var(--color-neutral-400)"/><circle cx="8" cy="9" r="1" fill="var(--color-neutral-400)"/></svg>
    </button>
  `;
}

// ---------- Tagesroutine per Touch/Maus an ihren Platz ziehen (statt Auf/Ab-Klicks) ----------
function commitRoutineReorder(draggedId, newVisibleIndex, visibleIdsBeforeDrag) {
  const fullChain = state.habits.filter(h => h.routineOrder != null).sort((a, b) => a.routineOrder - b.routineOrder);
  const draggedHabit = fullChain.find(h => h.id === draggedId);
  if (!draggedHabit) return;
  const withoutDragged = fullChain.filter(h => h.id !== draggedId);

  const newVisibleOrder = visibleIdsBeforeDrag.filter(id => id !== draggedId);
  newVisibleOrder.splice(newVisibleIndex, 0, draggedId);
  const beforeId = newVisibleIndex > 0 ? newVisibleOrder[newVisibleIndex - 1] : null;

  const insertAt = beforeId === null ? 0 : withoutDragged.findIndex(h => h.id === beforeId) + 1;
  withoutDragged.splice(insertAt, 0, draggedHabit);
  withoutDragged.forEach((h, i) => { h.routineOrder = i; });
  saveData();
  renderAll();
}

function initRoutineDragReorder() {
  const wrap = document.getElementById("routineChain");
  let dragEl = null, dragHabitId = null, startY = 0, originalTops = [], heights = [], visibleIds = [], dragOriginalIndex = 0, currentDropIndex = 0;

  function clearDropIndicators() {
    wrap.querySelectorAll(".atlas-row").forEach(r => r.classList.remove("drag-over-top"));
  }

  wrap.addEventListener("pointerdown", e => {
    const handle = e.target.closest("[data-drag-handle]");
    if (!handle) return;
    e.preventDefault();
    dragEl = handle.closest(".atlas-row");
    dragHabitId = handle.dataset.dragHandle;
    const rows = [...wrap.querySelectorAll(".atlas-row")];
    visibleIds = rows.map(r => r.dataset.habitId);
    originalTops = rows.map(r => r.getBoundingClientRect().top);
    heights = rows.map(r => r.getBoundingClientRect().height);
    dragOriginalIndex = visibleIds.indexOf(dragHabitId);
    currentDropIndex = dragOriginalIndex;
    startY = e.clientY;
    dragEl.classList.add("dragging");
    dragEl.style.zIndex = "50";
    dragEl.setPointerCapture(e.pointerId);
  });

  wrap.addEventListener("pointermove", e => {
    if (!dragEl) return;
    const dy = e.clientY - startY;
    dragEl.style.transform = `translateY(${dy}px)`;
    const dragCenterNow = originalTops[dragOriginalIndex] + heights[dragOriginalIndex] / 2 + dy;

    let newIndex = 0;
    visibleIds.forEach((id, i) => {
      if (i === dragOriginalIndex) return;
      const center = originalTops[i] + heights[i] / 2;
      if (center < dragCenterNow) newIndex++;
    });
    currentDropIndex = newIndex;

    clearDropIndicators();
    if (newIndex !== dragOriginalIndex) {
      const rows = [...wrap.querySelectorAll(".atlas-row")];
      const targetRow = rows.find(r => r.dataset.habitId === visibleIds[newIndex] || (newIndex >= rows.length && r === rows[rows.length - 1]));
      if (targetRow && targetRow !== dragEl) targetRow.classList.add("drag-over-top");
    }
  });

  function endDrag(commit) {
    if (!dragEl) return;
    dragEl.classList.remove("dragging");
    dragEl.style.transform = "";
    dragEl.style.zIndex = "";
    clearDropIndicators();
    const finalIndex = currentDropIndex;
    const id = dragHabitId;
    const ids = visibleIds;
    const changed = finalIndex !== dragOriginalIndex;
    dragEl = null;
    if (commit && changed) commitRoutineReorder(id, finalIndex, ids);
  }

  wrap.addEventListener("pointerup", () => endDrag(true));
  wrap.addEventListener("pointercancel", () => endDrag(false));
}

// ---------- Generischer Drag-Reorder für einfache, flache Listen (z.B. Gebete) — gleiche
// Pointer-Technik wie initRoutineDragReorder, nur parametrisiert über Container/Attribute. ----------
function initDragReorder(containerId, handleAttr, rowIdAttr, onCommit) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  let dragEl = null, dragId = null, startY = 0, originalTops = [], heights = [], visibleIds = [], dragOriginalIndex = 0, currentDropIndex = 0;

  function clearDropIndicators() {
    wrap.querySelectorAll(".atlas-row").forEach(r => r.classList.remove("drag-over-top"));
  }

  wrap.addEventListener("pointerdown", e => {
    const handle = e.target.closest(`[${handleAttr}]`);
    if (!handle) return;
    e.preventDefault();
    dragEl = handle.closest(".atlas-row");
    dragId = handle.getAttribute(handleAttr);
    const rows = [...wrap.querySelectorAll(".atlas-row")];
    visibleIds = rows.map(r => r.getAttribute(rowIdAttr));
    originalTops = rows.map(r => r.getBoundingClientRect().top);
    heights = rows.map(r => r.getBoundingClientRect().height);
    dragOriginalIndex = visibleIds.indexOf(dragId);
    currentDropIndex = dragOriginalIndex;
    startY = e.clientY;
    dragEl.classList.add("dragging");
    dragEl.style.zIndex = "50";
    dragEl.setPointerCapture(e.pointerId);
  });

  wrap.addEventListener("pointermove", e => {
    if (!dragEl) return;
    const dy = e.clientY - startY;
    dragEl.style.transform = `translateY(${dy}px)`;
    const dragCenterNow = originalTops[dragOriginalIndex] + heights[dragOriginalIndex] / 2 + dy;

    let newIndex = 0;
    visibleIds.forEach((id, i) => {
      if (i === dragOriginalIndex) return;
      const center = originalTops[i] + heights[i] / 2;
      if (center < dragCenterNow) newIndex++;
    });
    currentDropIndex = newIndex;

    clearDropIndicators();
    if (newIndex !== dragOriginalIndex) {
      const rows = [...wrap.querySelectorAll(".atlas-row")];
      const targetRow = rows.find(r => r.getAttribute(rowIdAttr) === visibleIds[newIndex] || (newIndex >= rows.length && r === rows[rows.length - 1]));
      if (targetRow && targetRow !== dragEl) targetRow.classList.add("drag-over-top");
    }
  });

  function endDrag(commit) {
    if (!dragEl) return;
    dragEl.classList.remove("dragging");
    dragEl.style.transform = "";
    dragEl.style.zIndex = "";
    clearDropIndicators();
    const finalIndex = currentDropIndex;
    const id = dragId;
    const ids = visibleIds;
    const changed = finalIndex !== dragOriginalIndex;
    dragEl = null;
    if (commit && changed) onCommit(id, finalIndex, ids);
  }

  wrap.addEventListener("pointerup", () => endDrag(true));
  wrap.addEventListener("pointercancel", () => endDrag(false));
}

// Verschiebt ein Gebet innerhalb seiner Bitte/Dank-Gruppe an eine neue Position (Reihenfolge steckt
// einfach in der Position innerhalb von state.prayers, wie bei den goalNodes).
function commitPrayerReorder(type, draggedId, newVisibleIndex, visibleIdsBeforeDrag) {
  const dragged = state.prayers.find(p => p.id === draggedId);
  if (!dragged) return;

  const newVisibleOrder = visibleIdsBeforeDrag.filter(id => id !== draggedId);
  newVisibleOrder.splice(newVisibleIndex, 0, draggedId);
  const beforeId = newVisibleIndex > 0 ? newVisibleOrder[newVisibleIndex - 1] : null;

  state.prayers = state.prayers.filter(p => p.id !== draggedId);
  if (beforeId === null) {
    const firstSiblingIdx = state.prayers.findIndex(p => p.status === "open" && (p.type || "bitte") === type);
    if (firstSiblingIdx === -1) state.prayers.push(dragged);
    else state.prayers.splice(firstSiblingIdx, 0, dragged);
  } else {
    const beforeIdx = state.prayers.findIndex(p => p.id === beforeId);
    state.prayers.splice(beforeIdx + 1, 0, dragged);
  }
  saveData();
  renderAll();
}

function initPrayerDragReorder() {
  initDragReorder("prayerListBitte", "data-drag-handle-prayer", "data-prayer-id", (id, idx, ids) => commitPrayerReorder("bitte", id, idx, ids));
  initDragReorder("prayerListDank", "data-drag-handle-prayer", "data-prayer-id", (id, idx, ids) => commitPrayerReorder("dank", id, idx, ids));
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

  const learningHabit = learningRoutineHabit(chainHabits);

  chainHabits.forEach((h, idx) => {
    const rawValue = h.history[today];
    const doneToday = h.type === "weight" ? (rawValue !== undefined && rawValue !== null) : !!rawValue;

    let noteHtml = "";
    if (h === learningHabit) {
      const override = examOverride(now);
      if (override) {
        noteHtml = `<div class="routine-step-note">Ganztägig lernen für <strong>${escapeHtml(override.subject.title)}</strong> — Klassenarbeit am ${override.date}</div>`;
      } else {
        const subj = subjectOfDay(now);
        noteHtml = `<div class="routine-step-note">Heutiges Hauptfach: <strong>${subj ? escapeHtml(subj.title) : "–"}</strong>${quickAddVisible ? ' <button class="btn btn-ghost" style="font-size:var(--text-2xs); padding:0 4px; height:auto;" data-change-subject="1">ändern</button>' : ""}</div>`;
      }
    }

    const checkHtml = h.type === "weight"
      ? `<button class="atlas-check${doneToday ? " checked" : ""}" style="pointer-events:none;" tabindex="-1" aria-hidden="true">${doneToday ? splatSvg(h.id) : ""}</button>`
      : `<button class="atlas-check${doneToday ? " checked" : ""}" data-habit="${h.id}" aria-label="${escapeHtml(habitTitleOn(h, today))}: ${doneToday ? "erledigt, zum Zurücknehmen antippen" : "offen, zum Abhaken antippen"}">${doneToday ? splatSvg(h.id) : ""}</button>`;
    const weightInputHtml = h.type === "weight"
      ? `<span class="wert-mit-einheit"><input type="number" step="0.1" min="0" inputmode="decimal" class="input" style="width:62px; height:34px; padding:6px 8px; text-align:right;" data-weight-habit="${h.id}" aria-label="${escapeHtml(h.title)}: Gewicht in Kilogramm" value="${rawValue !== undefined && rawValue !== null ? rawValue : ""}"><span class="wert-einheit">kg</span></span>`
      : "";
    // Der Titel zeigt die Stufe, auf der der Regler gerade steht ("6 Uhr aufstehen" vs. "7 Uhr
    // aufstehen") — so ist ohne zweite Zeile klar, was heute gilt.
    const shownTitle = habitTitleOn(h, today);
    const titleHtml = quickAddVisible
      ? `<div class="item-title" data-edit-habit="${h.id}" style="cursor:pointer; text-decoration:underline dotted;">${escapeHtml(shownTitle)}</div>`
      : `<div class="item-title">${escapeHtml(shownTitle)}</div>`;
    const fullPoints = h.points ?? 1;
    const levelPoints = habitLevelOn(h, today) === "minimal" ? fullPoints * HABIT_MINIMAL_FACTOR : fullPoints;
    // Bewusst ohne Serie: die gehoert in die Auswertung, nicht zwischen die Punkte, die man
    // gerade abhakt — dort ist sie Druck statt Information.
    // Die Punktzahl steht nur da, wenn sie etwas sagt: bei genau einem Punkt auf voller Stufe ist
    // sie in jeder Zeile dieselbe Angabe und damit reine Wiederholung — elfmal "1 Punkt"
    // untereinander trägt nichts und kostet je eine Zeile Höhe. Abweichungen (mehr Punkte oder
    // abgesenkte Stufe) stehen weiterhin.
    const pointsHtml = (levelPoints === 1 && fullPoints === 1)
      ? ""
      : `<div class="item-meta">${formatPoints(levelPoints)} Punkt${levelPoints === 1 ? "" : "e"}${
        levelPoints !== fullPoints ? ` <span style="color:var(--color-text-muted);">statt ${formatPoints(fullPoints)}</span>` : ""}</div>`;

    const el = document.createElement("div");
    el.className = "atlas-row" + (doneToday ? " done" : "");
    el.dataset.type = h.type;
    el.dataset.habitId = h.id;
    el.innerHTML = `
      ${checkHtml}
      <div style="flex:1; min-width:0;">
        ${titleHtml}
        ${pointsHtml}
        ${noteHtml}
      </div>
      ${weightInputHtml}
      ${levelSwitchHtml(h, today)}
      ${quickAddVisible ? `<button class="btn btn-icon btn-ghost" data-del-habit="${h.id}" aria-label="Löschen"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 1.5L11.5 11.5M11.5 1.5L1.5 11.5" stroke="var(--color-neutral-500)" stroke-width="1.4" stroke-linecap="round"/></svg></button>` : ""}
      ${dragHandleHtml(h.id)}
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
    wrap.innerHTML = quickAddVisible
      ? `<button class="btn btn-secondary btn-block metal-gold" id="addWorkShiftBtn">+ Arbeitsschicht für heute eintragen</button>`
      : "";
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
    const doneToday = habitDoneOn(h, today);
    const priority = isPriority(h.nodeId);
    const shownTitle = habitTitleOn(h, today);
    const titleHtml = quickAddVisible
      ? `<div class="item-title" data-edit-habit="${h.id}" style="cursor:pointer; text-decoration:underline dotted;">${escapeHtml(shownTitle)}</div>`
      : `<div class="item-title">${escapeHtml(shownTitle)}</div>`;
    const el = document.createElement("div");
    el.className = "atlas-row" + (doneToday ? " done" : "");
    el.innerHTML = `
      <button class="atlas-check${doneToday ? " checked" : ""}" data-habit="${h.id}" aria-label="${escapeHtml(shownTitle)}: ${doneToday ? "erledigt, zum Zurücknehmen antippen" : "offen, zum Abhaken antippen"}">${doneToday ? splatSvg(h.id) : ""}</button>
      <div style="flex:1; min-width:0;">
        ${titleHtml}
        <div class="item-meta">${frequencyLabel(h)}${(() => {
          // Punktzahl nur bei Abweichung — siehe Tagesroutine: "· 1 Punkt" hinter jeder Zeile ist
          // dieselbe Angabe elfmal untereinander.
          const voll = h.points ?? 1;
          const stufe = habitLevelOn(h, today) === "minimal" ? voll * HABIT_MINIMAL_FACTOR : voll;
          if (stufe === 1 && voll === 1) return "";
          return ` · ${formatPoints(stufe)} Punkt${stufe === 1 ? "" : "e"}`;
        })()}</div>
      </div>
      ${priority ? '<span class="atlas-chip" style="background:var(--color-accent-900); color:var(--color-accent-300);">Priorität</span>' : ""}
      ${levelSwitchHtml(h, today)}
      ${quickAddVisible ? `<button class="btn btn-icon btn-ghost" data-del-habit="${h.id}" aria-label="Löschen"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 1.5L11.5 11.5M11.5 1.5L1.5 11.5" stroke="var(--color-neutral-500)" stroke-width="1.4" stroke-linecap="round"/></svg></button>` : ""}
    `;
    habitWrap.appendChild(el);
  });
}
