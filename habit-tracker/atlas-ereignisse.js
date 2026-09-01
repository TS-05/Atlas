// ============================================================
// Atlas — atlas-ereignisse.js
// renderAll, Freitext-Autospeicherung, Rueckgaengig, Ereignis-Delegation
//
// Teil von app.js, das auf 9 Dateien aufgeteilt wurde. Die Reihenfolge in index.html
// entspricht exakt der frueheren Reihenfolge in der einen Datei -- die Dateien teilen sich
// weiterhin einen Gueltigkeitsbereich, es sind bewusst KEINE Module. Dadurch aendert das
// Aufteilen am Verhalten nichts; nur Funktionen werden nicht mehr ueber Dateigrenzen hinweg
// vorgezogen, weshalb Code, der sofort laeuft, hinter seinen Funktionen stehen muss.
// ============================================================

// ---------- Render all ----------
// Morgens einmal daran erinnern, was GESTERN liegen geblieben ist -- damit es nicht zweimal
// hintereinander passiert. Bewusst nicht erst nach dem zweiten Versaeumnis (zu spaet, der Rueckfall
// ist dann schon da) und hoechstens einmal pro Tag, egal wie oft die App geoeffnet wird.
//
// Gewuenschtes Verhalten: genau einmal pro Tag, beim ERSTEN Oeffnen der App an diesem Tag.
//
// Der Tag beginnt dabei um DAY_START_HOUR, nicht um Mitternacht. Grund: renderAll() laeuft bei jedem
// visibilitychange, und sobald das Kalenderdatum umspringt, ist der naechste App-Blick der erste des
// neuen Tages -- ohne diesen Riegel feuerte die Erinnerung mitten in der Nacht (real gemeldet: 00:04).
// Ein Blick auf die App um kurz nach Mitternacht zaehlt also noch zum Vortag.
// Andere Grenze gewuenscht? Nur diese eine Zahl aendern.
const DAY_START_HOUR = 6;   // vor 06:00 gilt der Tag noch nicht als begonnen

function checkMissedRoutineStreaks() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  // Nacht: kommentarlos aussteigen -- WICHTIG: ohne lastMissReminderDate zu setzen, sonst waere der
  // Tag durch einen naechtlichen App-Blick "verbraucht" und die Erinnerung kaeme gar nicht mehr.
  if (new Date().getHours() < DAY_START_HOUR) return;

  const today = todayStr();
  if (state.lastMissReminderDate === today) return;   // heute schon erinnert

  const y = new Date(); y.setDate(y.getDate() - 1);
  const yKey = localDateKey(y);

  // Nur Routine-Gewohnheiten, die gestern tatsaechlich faellig waren und offen blieben.
  const missed = state.habits.filter(h =>
    h.routineOrder != null && isScheduledToday(h, y) && !h.history[yKey] &&
    new Date(h.createdAt) <= y);
  if (!missed.length) { state.lastMissReminderDate = today; saveData(); return; }

  // Genau das, was Tim vorgegeben hat: Titel "Atlas", darunter nur die offenen Namen, durch
  // Kommas getrennt. Kein "vergessen", kein Ausrufezeichen, kein Zusatzsatz — die Meldung
  // erinnert, sie kommentiert nicht. Laenge regelt das Betriebssystem selbst durch Abschneiden.
  new Notification("Atlas", {
    body: missed.map(h => h.title).join(", "),
    tag: "atlas-miss-" + today   // ersetzt eine evtl. schon sichtbare Meldung statt zu stapeln
  });
  state.lastMissReminderDate = today;
  saveData();
}

function updateNotifPermissionUI() {
  const row = document.getElementById("notifPermissionRow");
  if (!row) return;
  row.style.display = ("Notification" in window && Notification.permission === "default") ? "flex" : "none";
}

// Gewohnheiten mit "autoDone" starten jeden Tag bereits abgehakt (z.B. Dinge, die nur im Ausnahmefall
// NICHT passieren). Bewusst nur EINMAL pro Tag gesetzt (autoDoneDate) -- sonst wuerde ein bewusstes
// Abwaehlen sofort wieder ueberschrieben.
function applyAutoDoneHabits() {
  const today = todayStr();
  let changed = false;
  state.habits.forEach(h => {
    if (!h.autoDone || h.autoDoneDate === today) return;
    if (!isScheduledToday(h, new Date())) return;
    if (h.history[today] === undefined) h.history[today] = true;
    h.autoDoneDate = today;
    changed = true;
  });
  if (changed) saveData();
}

// ---------- Freitext-Autospeicherung ----------
// Notizfelder (Projekte, ToDo-Details, Wochenreflexion) hingen frueher allein am "change"-Event.
// Bei einer <textarea> feuert das erst beim Verlassen des Feldes — kam vorher ein renderAll()
// dazwischen (z. B. beim Zurueckkehren in die App ueber visibilitychange) oder beendete iOS die
// PWA im Hintergrund, wurde das DOM-Element ersetzt, ohne dass "change" je gefeuert hatte: der
// getippte Text war weg. Jetzt landet jeder Tastendruck sofort im State; nur der localStorage-
// Schreibvorgang wird entprellt und beim Verstecken/Verlassen der Seite hart durchgeschrieben.
let pendingSaveTimer = null;
function saveDataDebounced(ms = 400) {
  if (pendingSaveTimer) clearTimeout(pendingSaveTimer);
  pendingSaveTimer = setTimeout(() => { pendingSaveTimer = null; saveData(); }, ms);
}
// Schreibt sofort und verwirft einen noch offenen Entprell-Timer — der letzte sichere Moment,
// bevor das DOM neu aufgebaut wird oder die Seite verschwindet.
function flushPendingSave() {
  if (pendingSaveTimer) { clearTimeout(pendingSaveTimer); pendingSaveTimer = null; }
  saveData();
}

// Uebernimmt den aktuellen Feldwert in den State. trimmed=true nur beim endgueltigen Commit
// (Fokusverlust) — waehrend des Tippens wuerde ein Trim das getippte Leerzeichen wegschlucken.
function commitFreeTextField(el, trimmed = false) {
  if (!el || !el.matches) return false;
  if (el.matches("[data-project-notes]")) {
    const project = state.projects.find(p => p.id === el.dataset.projectNotes);
    if (!project) return false;
    project.notes = trimmed ? el.value.trim() : el.value;
    return true;
  }
  if (el.matches("[data-task-notes]")) {
    const task = state.tasks.find(t => t.id === el.dataset.taskNotes);
    if (!task) return false;
    task.notes = trimmed ? el.value.trim() : el.value;
    return true;
  }
  if (el.matches("#reflectionText")) {
    state.weeklyReflection[el.dataset.weekKey || weekStartKey()] = el.value;
    return true;
  }
  return false;
}

// Rettet den Inhalt des gerade fokussierten Notizfeldes, bevor irgendetwas das DOM neu aufbaut
// oder die Seite verschwindet.
function commitActiveFreeText(trimmed = false) {
  return commitFreeTextField(document.activeElement, trimmed);
}

document.addEventListener("input", e => {
  if (commitFreeTextField(e.target)) saveDataDebounced();
});

function renderAll() {
  // Nie ueber ungespeicherten Tippstand hinweg neu rendern.
  commitActiveFreeText();
  applyAutoDoneHabits();
  renderWeekCircle();
  renderDeviationLog();
  renderRoutineChain();
  renderWorkShiftBanner();
  renderOtherHabits();
  renderTodo();
  renderGoalBrowser();
  renderPlanning();
  renderFinance();
  renderProjekte();
  renderGym();
  renderPrayers();
  renderWeekStats();
  updateNotifPermissionUI();
  // Muss NACH den Listen laufen: die Sichtbarkeit der Hinzufuegen-Knoepfe haengt davon ab, ob eine
  // Liste gerade leer ist — vorher wurde sie nur beim Tabwechsel und beim Plus-Knopf ausgewertet.
  updateHeaderPlusButton();
  checkMissedRoutineStreaks();
}

// ---------- Loeschen mit Rueckgaengig ----------
// Bis hierher war jedes Loeschen sofort und endgueltig — kein confirm(), kein Undo, und das X sass
// direkt in der Zeile. Ein Bestaetigungsdialog waere die schlechtere Antwort (man klickt ihn nach
// zwei Tagen blind weg); ein kurzes Zeitfenster zum Zuruecknehmen heilt den Fehltipp wirklich.
let undoTimer = null;
let undoAction = null;
const UNDO_MS = 7000;

function hideUndoBar() {
  const bar = document.getElementById("undoBar");
  if (bar) bar.hidden = true;
  if (undoTimer) { clearTimeout(undoTimer); undoTimer = null; }
  undoAction = null;
}
// text = was geloescht wurde, restore = stellt es an derselben Stelle wieder her
function offerUndo(text, restore) {
  const bar = document.getElementById("undoBar");
  if (!bar) { restore = null; return; }
  undoAction = restore;
  document.getElementById("undoBtn").hidden = false;
  document.getElementById("undoText").textContent = text;
  bar.hidden = false;
  bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = "";
  if (undoTimer) clearTimeout(undoTimer);
  undoTimer = setTimeout(hideUndoBar, UNDO_MS);
}
// Loescht einen Eintrag aus einer State-Liste und bietet ihn zum Zurueckholen an — inklusive
// seiner urspruenglichen Position, damit eine per Hand sortierte Liste nicht durcheinandergeraet.
function deleteWithUndo(listName, id, label) {
  const liste = state[listName];
  const idx = liste.findIndex(x => x.id === id);
  if (idx === -1) return;
  const [entfernt] = liste.splice(idx, 1);
  saveData();
  renderAll();
  offerUndo(`„${label}" gelöscht`, () => {
    state[listName].splice(Math.min(idx, state[listName].length), 0, entfernt);
    saveData();
    renderAll();
  });
}

// Reine Bestaetigung ohne Rueckgaengig — der Export löst still einen Download aus, auf dem
// iPhone sieht man davon je nach Einstellung gar nichts.
function showToast(text) {
  const bar = document.getElementById("undoBar");
  if (!bar) return;
  // Laeuft gerade ein Rueckgaengig-Angebot, darf eine blosse Bestaetigung es nicht verdraengen —
  // sonst ist die eben geloeschte Aufgabe endgueltig weg, weil zufaellig ein Export lief.
  if (undoAction) return;
  document.getElementById("undoText").textContent = text;
  document.getElementById("undoBtn").hidden = true;
  bar.hidden = false;
  bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = "";
  if (undoTimer) clearTimeout(undoTimer);
  undoTimer = setTimeout(hideUndoBar, 4000);
}

// Eine Kategorie zu loeschen nimmt jede jemals darauf gebuchte Ausgabe mit. Frueher geschah das
// stillschweigend, und der zweite Weg dorthin (Kategorie antippen → Dialog → Loeschen) umging
// selbst nach dem ersten Fix noch das Rueckgaengig — obwohl dort "Loeschen" und "Speichern"
// nebeneinander stehen und ein Fehlgriff besonders naheliegt.
function loescheKategorieMitUndo(id) {
  const katIdx = state.financeCategories.findIndex(c => c.id === id);
  if (katIdx === -1) return;
  const [kat] = state.financeCategories.splice(katIdx, 1);
  const buchungen = state.financeExpenses
    .map((ex, i) => ({ ex, i }))
    .filter(({ ex }) => ex.categoryId === id);
  state.financeExpenses = state.financeExpenses.filter(ex => ex.categoryId !== id);
  saveData(); renderAll();
  offerUndo(
    `\u201e${kat.title}\u201c gel\u00f6scht${buchungen.length ? ` \u2014 mit ${buchungen.length} Buchung${buchungen.length === 1 ? "" : "en"}` : ""}`,
    () => {
      state.financeCategories.splice(Math.min(katIdx, state.financeCategories.length), 0, kat);
      buchungen.forEach(({ ex, i }) => state.financeExpenses.splice(Math.min(i, state.financeExpenses.length), 0, ex));
      saveData(); renderAll();
    });
}

document.getElementById("undoBtn")?.addEventListener("click", () => {
  const fn = undoAction;
  hideUndoBar();
  if (fn) fn();
});

// ---------- Event delegation ----------
document.addEventListener("change", e => {
  if (e.target.matches("[data-weight-habit]")) {
    const id = e.target.dataset.weightHabit;
    const habit = state.habits.find(h => h.id === id);
    const key = e.target.dataset.date || todayStr();
    const val = e.target.value === "" ? null : parseFloat(e.target.value);
    if (val === null || isNaN(val) || val < 0) delete habit.history[key];
    else habit.history[key] = val;
    saveData();
    renderAll();
    if (currentDaySheetKey) openDaySheet(currentDaySheetKey);
  }
  // Endgueltiger Commit beim Verlassen des Feldes (waehrend des Tippens laeuft die
  // Autospeicherung ueber den "input"-Listener, siehe commitFreeTextField).
  if (commitFreeTextField(e.target, true)) flushPendingSave();
});

function toggleTaskDone(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  setTaskStatus(task, task.done ? "offen" : "erledigt");
  saveData();
  renderAll();
}

// Einzelklick auf die ToDo-Zeile klappt die Details auf; Doppelklick hakt ab. Da jeder Doppelklick
// mit zwei einzelnen "click"-Events beginnt, wird der Einzelklick kurz verzögert ausgeführt und
// verworfen, falls in der Zwischenzeit ein "dblclick" auf derselben Zeile eintrifft.
// Frueher wartete jeder Einzelklick 280 ms auf einen moeglichen Doppelklick — bei jedem Tippen auf
// eine Zeile, ohne jede Rueckmeldung in der Zwischenzeit. Das war der Hauptgrund, warum sich die
// Liste traege anfuehlte. Jetzt klappt die Zeile sofort auf; die beiden Klicks eines Doppelklicks
// heben sich dabei gegenseitig auf, sodass am Ende nur das Abhaken uebrig bleibt.

document.addEventListener("dblclick", e => {
  // Gewohnheits-Zeilen (Tagesroutine und weitere Gewohnheiten) lassen sich per Doppeltipp auf die
  // ganze Zeile abhaken — das kleine Kaestchen bleibt, ist aber nicht mehr der einzige Weg.
  // Ausgenommen: Regler, Loeschen, Ziehgriff, der Titel im Bearbeiten-Modus und Gewichts-Zeilen
  // (die tragen ihren Wert ueber das Zahlenfeld ein, nicht ueber ein Haekchen).
  const habitRow = e.target.closest("[data-habit-id], .atlas-row");
  const habitBtn = habitRow && habitRow.querySelector("[data-habit]");
  if (habitBtn && !e.target.closest("[data-habit-level]") && !e.target.closest("[data-del-habit]")
      && !e.target.closest("[data-edit-habit]") && !e.target.closest(".routine-drag-handle")
      && !e.target.closest("input")) {
    const habit = state.habits.find(h => h.id === habitBtn.dataset.habit);
    if (habit && habit.type !== "weight") {
      const key = habitBtn.dataset.date || todayStr();
      if (habit.history[key]) delete habit.history[key];
      else { habit.history[key] = habitLevelOn(habit, key); habit.missNotified = false; }
      saveData();
      renderAll();
      if (currentDaySheetKey) openDaySheet(currentDaySheetKey);
      return;
    }
  }
  const taskRow = e.target.closest("[data-task-row]");
  if (!taskRow || e.target.closest("[data-del-task]") || e.target.closest("[data-task]")) return;
  const id = taskRow.dataset.taskRow;
  // Bewusst KEINE Ruecknahme: ein Doppelklick liefert zwei click-Ereignisse, die den Aufklapp-
  // Zustand bereits zweimal umschalten und damit von selbst wiederherstellen. Die frueher hier
  // stehende "Ruecknahme" war ein dritter Umschaltvorgang und kehrte den Zustand jedes Mal um —
  // beim Abhaken klappte dadurch die Detailansicht auf.
  toggleTaskDone(id);
});

document.addEventListener("click", e => {
  const taskCheck = e.target.closest("[data-task]");
  if (taskCheck) {
    // Tipp aufs Kaestchen geht reihum: offen -> in Arbeit -> erledigt -> offen.
    // Der Doppeltipp auf die Zeile bleibt die Abkuerzung direkt zu "erledigt".
    const task = state.tasks.find(t => t.id === taskCheck.dataset.task);
    if (task) { cycleTaskStatus(task); saveData(); renderAll(); }
    return;
  }
  const taskRow = e.target.closest("[data-task-row]");
  if (taskRow && !e.target.closest("[data-del-task]")) {
    const id = taskRow.dataset.taskRow;
    if (expandedTaskIds.has(id)) expandedTaskIds.delete(id); else expandedTaskIds.add(id);
    renderTodo();   // nur die Liste, nicht die ganze App
    return;
  }
  // Regler zuerst: er liegt in derselben Zeile wie der Abhaken-Knopf, und closest() wuerde ihn
  // sonst als Klick auf die Gewohnheit werten.
  const levelBtn = e.target.closest("[data-habit-level]");
  if (levelBtn) {
    const habit = state.habits.find(h => h.id === levelBtn.dataset.habitLevel);
    const key = levelBtn.dataset.levelDate || todayStr();
    if (habit) {
      habit.levelByDate = habit.levelByDate || {};
      const neu = habitLevelOn(habit, key) === "minimal" ? "ideal" : "minimal";
      if (neu === "ideal") delete habit.levelByDate[key]; else habit.levelByDate[key] = "minimal";
      // Schon abgehakt? Dann den festgehaltenen Wert mitziehen, sonst stuenden Regler und
      // gespeicherte Stufe auseinander.
      if (habit.type !== "weight" && habit.history[key]) habit.history[key] = neu;
      saveData();
      renderAll();
      if (currentDaySheetKey) openDaySheet(currentDaySheetKey);
      // Der Regler steht in jeder Zeile, aber die Zeile heisst nur dann anders, wenn fuer die
      // Gewohnheit ueberhaupt eine kleine Version benannt ist. Ohne die passierte beim Umlegen
      // sichtbar nichts ausser halben Punkten -- der Regler versprach also etwas, das er nicht
      // halten konnte. Beim ERSTEN Umlegen auf Minimal wird der Name deshalb hier erfragt,
      // genau an der Stelle, an der die Frage aufkommt. Danach nie wieder.
      if (neu === "minimal" && !habitHasMinimal(habit) && !habit.noMinimal) {
        openMinimalTitelModal(habit);
      }
    }
    return;
  }
  const habitCheck = e.target.closest("[data-habit]");
  if (habitCheck) {
    const habit = state.habits.find(h => h.id === habitCheck.dataset.habit);
    if (!habit) return;   // veraltetes DOM (z. B. offenes Tagesblatt) darf nicht die App abschiessen
    const key = habitCheck.dataset.date || todayStr();
    if (habit.history[key]) delete habit.history[key];
    // Abgehakt wird immer auf der Stufe, auf der der Regler gerade steht.
    else { habit.history[key] = habitLevelOn(habit, key); habit.missNotified = false; }
    saveData();
    renderAll();
    if (currentDaySheetKey) openDaySheet(currentDaySheetKey);
    return;
  }
  const editHabitEl = e.target.closest("[data-edit-habit]");
  if (editHabitEl) {
    const habit = state.habits.find(h => h.id === editHabitEl.dataset.editHabit);
    if (habit) openHabitModal(false, habit);
    return;
  }
  const delTaskEl = e.target.closest("[data-del-task]");
  if (delTaskEl) {
    const t = state.tasks.find(x => x.id === delTaskEl.dataset.delTask);
    if (t) deleteWithUndo("tasks", t.id, t.title);
  }
  const delHabitEl = e.target.closest("[data-del-habit]");
  if (delHabitEl) {
    const h = state.habits.find(x => x.id === delHabitEl.dataset.delHabit);
    if (h) deleteWithUndo("habits", h.id, h.title);
  }
  // Bearbeiten und Hinzufuegen zuerst: die Stifte liegen in denselben Karten, die sonst
  // navigieren wuerden.
  const editNodeBtn = e.target.closest("[data-edit-node]");
  if (editNodeBtn) {
    e.stopPropagation();
    const n = nodeById(editNodeBtn.dataset.editNode);
    if (n) openNodeModal(n, null);
    return;
  }
  const addNodeBtn = e.target.closest("[data-add-node]");
  if (addNodeBtn) {
    e.stopPropagation();
    openNodeModal(null, addNodeBtn.dataset.addNode || null);
    return;
  }
  const openRootBtn = e.target.closest("[data-open-roadmap-root]");
  if (openRootBtn) {
    roadmapRootId = openRootBtn.dataset.openRoadmapRoot;
    roadmapView = "category";
    renderGoalBrowser();
  }
  const openPathBtn = e.target.closest("[data-open-roadmap-path]");
  if (openPathBtn) {
    roadmapPathId = openPathBtn.dataset.openRoadmapPath;
    roadmapView = "path";
    renderGoalBrowser();
  }
  const crumbHomeBtn = e.target.closest("[data-roadmap-crumb-home]");
  if (crumbHomeBtn) {
    roadmapView = "dashboard";
    roadmapRootId = null; roadmapPathId = null;
    renderGoalBrowser();
  }
  const crumbNodeBtn = e.target.closest("[data-roadmap-crumb-node]");
  if (crumbNodeBtn) {
    const id = crumbNodeBtn.dataset.roadmapCrumbNode;
    const n = nodeById(id);
    if (n && n.parentId === null) {
      roadmapView = "category";
      roadmapRootId = id;
    } else {
      roadmapView = "path";
      roadmapPathId = id;
    }
    renderGoalBrowser();
  }
  const delShiftEl = e.target.closest("[data-del-shift]");
  if (delShiftEl) {
    const w = state.workShifts.find(x => x.id === delShiftEl.dataset.delShift);
    if (w) deleteWithUndo("workShifts", w.id, w.title || "Schicht");
  }
  const delSubjectEl = e.target.closest("[data-del-subject]");
  if (delSubjectEl) {
    const f = state.subjects.find(x => x.id === delSubjectEl.dataset.delSubject);
    if (f) deleteWithUndo("subjects", f.id, f.title);
  }
  const delExamEl = e.target.closest("[data-del-exam]");
  if (delExamEl) {
    const ex = state.exams.find(x => x.id === delExamEl.dataset.delExam);
    const fach = ex && state.subjects.find(f => f.id === ex.subjectId);
    if (ex) deleteWithUndo("exams", ex.id, (fach ? fach.title + " " : "Klassenarbeit ") + ex.date);
  }
  const delIncomeBtn = e.target.closest("[data-del-income]");
  if (delIncomeBtn) {
    const i = state.financeIncomeSources.find(x => x.id === delIncomeBtn.dataset.delIncome);
    if (i) deleteWithUndo("financeIncomeSources", i.id, i.title);
    return;
  }
  const editIncomeEl = e.target.closest("[data-edit-income]");
  if (editIncomeEl) {
    const source = state.financeIncomeSources.find(i => i.id === editIncomeEl.dataset.editIncome);
    if (source) openIncomeSourceModal(source);
    return;
  }
  const delAccountBtn = e.target.closest("[data-del-account]");
  if (delAccountBtn) {
    const a = state.financeAccounts.find(x => x.id === delAccountBtn.dataset.delAccount);
    if (a) deleteWithUndo("financeAccounts", a.id, a.title);
    return;
  }
  const editProjectEl = e.target.closest("[data-edit-project]");
  if (editProjectEl) {
    const pr = state.projects.find(x => x.id === editProjectEl.dataset.editProject);
    if (pr) openProjectModal(pr);
    return;
  }
  const delProjectBtn = e.target.closest("[data-del-project]");
  if (delProjectBtn) {
    const pr = state.projects.find(x => x.id === delProjectBtn.dataset.delProject);
    if (pr) { deleteWithUndo("projects", pr.id, pr.title); return; }
    state.projects = state.projects.filter(p => p.id !== delProjectBtn.dataset.delProject);
    saveData(); renderAll();
    return;
  }
  const editAccountEl = e.target.closest("[data-edit-account]");
  if (editAccountEl) {
    const account = state.financeAccounts.find(a => a.id === editAccountEl.dataset.editAccount);
    if (account) openAccountModal(account);
    return;
  }
  const delCategoryBtn = e.target.closest("[data-del-category]");
  if (delCategoryBtn) { loescheKategorieMitUndo(delCategoryBtn.dataset.delCategory); return; }
  const editCategoryEl = e.target.closest("[data-edit-category]");
  if (editCategoryEl) {
    const category = state.financeCategories.find(c => c.id === editCategoryEl.dataset.editCategory);
    if (category) openCategoryModal(category);
    return;
  }
  const delGoalBtn = e.target.closest("[data-del-goal]");
  if (delGoalBtn) {
    const g = state.savingsGoals.find(x => x.id === delGoalBtn.dataset.delGoal);
    if (g) deleteWithUndo("savingsGoals", g.id, g.title);
    return;
  }
  const delExpenseBtn = e.target.closest("[data-del-expense]");
  if (delExpenseBtn) {
    const ex = state.financeExpenses.find(x => x.id === delExpenseBtn.dataset.delExpense);
    if (ex) {
      const kat = state.financeCategories.find(c => c.id === ex.categoryId);
      deleteWithUndo("financeExpenses", ex.id, `${formatEuro(ex.amount)}${kat ? " · " + kat.title : ""}`);
    }
    return;
  }
  const addGoalAmountBtn = e.target.closest("[data-add-goal-amount]");
  if (addGoalAmountBtn) {
    const goal = state.savingsGoals.find(g => g.id === addGoalAmountBtn.dataset.addGoalAmount);
    if (goal) openAddGoalAmountModal(goal);
    return;
  }
  const editGoalEl = e.target.closest("[data-edit-goal]");
  if (editGoalEl) {
    const goal = state.savingsGoals.find(g => g.id === editGoalEl.dataset.editGoal);
    if (goal) openSavingsGoalModal(goal);
    return;
  }
  const delDeviationEl = e.target.closest("[data-del-deviation]");
  if (delDeviationEl) {
    const d = state.deviations.find(x => x.id === delDeviationEl.dataset.delDeviation);
    if (d) deleteWithUndo("deviations", d.id, d.text);
  }
  const fulfilledBtn = e.target.closest("[data-prayer-close]");
  if (fulfilledBtn) {
    const p = state.prayers.find(x => x.id === fulfilledBtn.dataset.prayerClose);
    // Ein Dank ist mit dem Haken erledigt — da gibt es nichts zu beschreiben. Nur bei einer
    // erhoerten Bitte lohnt der Dialog, weil man festhalten will, was passiert ist.
    if (p && (p.type || "bitte") === "dank") {
      p.status = "thanked";
      p.thankedAt = new Date().toISOString();
      saveData(); renderAll();
      offerUndo(`\u201e${p.title}" abgelegt`, () => {
        p.status = "open"; delete p.thankedAt; saveData(); renderAll();
      });
      return;
    }
    openPrayerCloseModal(fulfilledBtn.dataset.prayerClose);
  }
  const irrelevantBtn = e.target.closest("[data-prayer-irrelevant]");
  if (irrelevantBtn) {
    const prayer = state.prayers.find(p => p.id === irrelevantBtn.dataset.prayerIrrelevant);
    // Der Knopf sitzt 26 px neben dem Haken; ein Fehlgriff war bisher endgueltig, weil die Liste
    // "Nicht mehr relevant" keinen Weg zurueck anbot.
    if (prayer) {
      prayer.status = "irrelevant";
      prayer.irrelevantAt = new Date().toISOString();
      saveData();
      renderAll();
      offerUndo(`\u201e${prayer.title}\u201c abgelegt`, () => {
        prayer.status = "open";
        delete prayer.irrelevantAt;
        saveData(); renderAll();
      });
    }
    return;
  }
  const heatmapCell = e.target.closest(".heatmap-cell");
  if (heatmapCell) {
    openDaySheet(heatmapCell.dataset.date);
  }
  if (e.target.matches("[data-change-subject]")) {
    openSubjectOverrideModal();
  }
});
initRoutineDragReorder();
initPrayerDragReorder();
