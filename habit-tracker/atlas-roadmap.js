// ============================================================
// Atlas — atlas-roadmap.js
// Bereiche, Roadmap-Ebenen, Analyse-Auswertungen, Heatmap
//
// Teil von app.js, das auf 9 Dateien aufgeteilt wurde. Die Reihenfolge in index.html
// entspricht exakt der frueheren Reihenfolge in der einen Datei -- die Dateien teilen sich
// weiterhin einen Gueltigkeitsbereich, es sind bewusst KEINE Module. Dadurch aendert das
// Aufteilen am Verhalten nichts; nur Funktionen werden nicht mehr ueber Dateigrenzen hinweg
// vorgezogen, weshalb Code, der sofort laeuft, hinter seinen Funktionen stehen muss.
// ============================================================

// ---------- Rendering: Bereiche (Akkordeon-Baum) ----------
function subtreeMatchesQuery(node, q, seen = new Set()) {
  if (seen.has(node.id)) return false;
  seen.add(node.id);
  if (node.title.toLowerCase().includes(q)) return true;
  return childNodes(node.id).some(c => subtreeMatchesQuery(c, q, seen));
}

// ---------- Roadmap: Dashboard (Ebene 1) -> Kategorie (Ebene 2) -> Pfad (Ebene 3) ----------

// ---------- Zielknoten anlegen und bearbeiten ----------
// Ein Dialog fuer beides. parentId wird beim Anlegen vorgegeben (die Ebene, auf der man gerade
// steht); beim Bearbeiten laesst sich der uebergeordnete Bereich wechseln, wodurch ein Thema
// verschoben werden kann, ohne es neu anzulegen.
function nodeParentOptions(exclude) {
  // Ein Knoten darf nicht unter sich selbst oder einen eigenen Nachfahren haengen — das
  // erzeugte einen Zyklus, den die Fortschrittsrechnung zwar abfaengt, der aber den Teilbaum
  // aus der Ansicht verschwinden liesse.
  const gesperrt = new Set();
  const sperre = id => { gesperrt.add(id); childNodes(id).forEach(c => sperre(c.id)); };
  if (exclude) sperre(exclude);
  const zeilen = [];
  const lauf = (parentId, tiefe) => {
    childNodes(parentId).forEach(n => {
      if (gesperrt.has(n.id)) return;
      zeilen.push({ id: n.id, label: "\u00a0".repeat(tiefe * 3) + n.title });
      lauf(n.id, tiefe + 1);
    });
  };
  lauf(null, 0);
  return zeilen;
}

function openNodeModal(node, parentId) {
  const isEdit = !!node;
  const aktuellerParent = isEdit ? (node.parentId || "") : (parentId || "");
  const optionen = nodeParentOptions(isEdit ? node.id : null);
  openModal(`
    <h3>${isEdit ? "Punkt bearbeiten" : "Neuer Punkt in der Roadmap"}</h3>
    <div class="field">
      <label>Titel</label>
      <input type="text" id="mNodeTitle" placeholder="z.B. Gebet (Formen, Praxis)" value="${isEdit ? escapeHtml(node.title) : ""}">
    </div>
    <div class="field">
      <label>Übergeordnet</label>
      <select id="mNodeParent">
        <option value="">\u2013 eigener Zielbereich \u2013</option>
        ${optionen.map(o => `<option value="${o.id}"${o.id === aktuellerParent ? " selected" : ""}>${escapeHtml(o.label)}</option>`).join("")}
      </select>
    </div>
    <div class="checkbox-row" style="margin-bottom:12px;">
      <input type="checkbox" id="mNodePriority" ${isEdit && node.priority ? "checked" : ""}>
      <label for="mNodePriority">Priorität</label>
    </div>
    <div class="modal-actions">
      ${isEdit ? `<button class="btn btn-ghost" id="mDelete" style="color:var(--color-accent-300); margin-right:auto;">Löschen</button>` : ""}
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Speichern</button>
    </div>
  `, body => {
    body.querySelector("#mNodeTitle").focus();
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    if (isEdit) body.querySelector("#mDelete").addEventListener("click", () => { closeModal(); loescheNodeMitUndo(node); });
    body.querySelector("#mSave").addEventListener("click", () => {
      const feld = body.querySelector("#mNodeTitle");
      const titel = feld.value.trim();
      if (!titel) { markiereFehlendesFeld(feld, "Ohne Titel l\u00e4sst sich der Punkt nicht speichern."); return; }
      const neuerParent = body.querySelector("#mNodeParent").value || null;
      const prio = body.querySelector("#mNodePriority").checked;
      if (isEdit) {
        node.title = titel;
        node.parentId = neuerParent;
        node.priority = prio;
      } else {
        state.goalNodes.push({ id: uid(), parentId: neuerParent, title: titel, priority: prio });
      }
      saveData(); closeModal(); renderAll();
    });
  });
}

// Loescht einen Knoten samt aller Nachfahren. Aufgaben, die direkt im Baum angelegt wurden
// (source "category"), gehoeren zum Knoten und gehen mit; ToDo-Aufgaben und Gewohnheiten, die
// nur darauf verweisen, werden NICHT geloescht, sondern nur losgeloest — sie gehoeren dem
// Nutzer, nicht der Gliederung. Alles zusammen ist ueber die Leiste zurueckholbar.
function loescheNodeMitUndo(node) {
  const betroffen = [];
  const sammle = id => { betroffen.push(id); childNodes(id).forEach(c => sammle(c.id)); };
  sammle(node.id);
  const idSet = new Set(betroffen);

  const knotenVorher = state.goalNodes.map((n, i) => ({ n, i })).filter(({ n }) => idSet.has(n.id));
  const aufgabenVorher = state.tasks.map((t, i) => ({ t, i }))
    .filter(({ t }) => idSet.has(t.nodeId) && t.source === "category");
  // Die urspruengliche Zuordnung mitschreiben, sonst blieben diese Eintraege nach einem
  // Rueckgaengig fuer immer losgeloest.
  const losgeloesteAufgaben = state.tasks.filter(t => idSet.has(t.nodeId) && t.source !== "category")
    .map(t => ({ t, nodeId: t.nodeId }));
  const losgeloesteHabits = state.habits.filter(x => idSet.has(x.nodeId))
    .map(x => ({ x, nodeId: x.nodeId }));

  state.goalNodes = state.goalNodes.filter(n => !idSet.has(n.id));
  state.tasks = state.tasks.filter(t => !(idSet.has(t.nodeId) && t.source === "category"));
  losgeloesteAufgaben.forEach(({ t }) => { t.nodeId = null; });
  losgeloesteHabits.forEach(({ x }) => { x.nodeId = null; });

  // Nach dem Loeschen darf die Ansicht nicht auf einem verschwundenen Knoten stehen bleiben.
  if (idSet.has(roadmapPathId)) { roadmapPathId = null; roadmapView = roadmapRootId && !idSet.has(roadmapRootId) ? "category" : "dashboard"; }
  if (idSet.has(roadmapRootId)) { roadmapRootId = null; roadmapView = "dashboard"; }
  saveData(); renderAll();

  const teile = [];
  if (betroffen.length > 1) teile.push(`${betroffen.length} Punkten`);
  if (aufgabenVorher.length) teile.push(`${aufgabenVorher.length} Aufgabe${aufgabenVorher.length === 1 ? "" : "n"}`);
  const zusatz = teile.length ? ` \u2014 mit ${teile.join(" und ")}` : "";
  offerUndo(`\u201e${node.title}" gel\u00f6scht${zusatz}`, () => {
    knotenVorher.forEach(({ n, i }) => state.goalNodes.splice(Math.min(i, state.goalNodes.length), 0, n));
    aufgabenVorher.forEach(({ t, i }) => state.tasks.splice(Math.min(i, state.tasks.length), 0, t));
    losgeloesteAufgaben.forEach(({ t, nodeId }) => { t.nodeId = nodeId; });
    losgeloesteHabits.forEach(({ x, nodeId }) => { x.nodeId = nodeId; });
    saveData(); renderAll();
  });
}

// Kleiner Stift-Griff, der nur im Bearbeiten-Modus erscheint.
const NODE_EDIT_ICON = '<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.2l2.3 2.3-7 7-3 0.7 0.7-3 7-7z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>';
function nodeEditBtnHtml(nodeId) {
  if (!roadmapEditMode) return "";
  return `<button class="btn btn-icon btn-ghost roadmap-edit-btn" data-edit-node="${nodeId}" aria-label="Bearbeiten">${NODE_EDIT_ICON}</button>`;
}
function nodeAddBtnHtml(parentId, text) {
  if (!roadmapEditMode) return "";
  return `<button class="btn btn-ghost btn-block roadmap-add-btn" data-add-node="${parentId || ""}">+ ${text}</button>`;
}

function renderGoalBrowser() {
  const wrap = document.getElementById("goalTree");
  wrap.innerHTML = "";
  if (roadmapView === "path" && roadmapPathId && nodeById(roadmapPathId)) {
    wrap.appendChild(renderRoadmapPath(roadmapPathId));
  } else if (roadmapView === "category" && roadmapRootId && nodeById(roadmapRootId)) {
    wrap.appendChild(renderRoadmapCategory(roadmapRootId));
  } else {
    roadmapView = "dashboard";
    wrap.appendChild(renderRoadmapDashboard());
  }
}

// Eine Ebene in der Roadmap zurück (Pfad -> Kategorie -> Dashboard). Gibt true zurück, wenn es
// etwas zum Zurückgehen gab (für die Kanten-Wisch-Geste).
function roadmapGoBack() {
  if (roadmapView === "path" && roadmapPathId) {
    const ancestry = nodePath(roadmapPathId);
    const rootId = ancestry[0] ? ancestry[0].id : null;
    roadmapPathId = null;
    if (rootId) {
      roadmapView = "category";
      roadmapRootId = rootId;
    } else {
      roadmapView = "dashboard";
      roadmapRootId = null;
    }
    renderGoalBrowser();
    return true;
  }
  if (roadmapView === "category") {
    roadmapView = "dashboard";
    roadmapRootId = null;
    renderGoalBrowser();
    return true;
  }
  return false;
}

function renderRoadmapDashboard() {
  const q = bereicheSearchQuery.trim().toLowerCase();
  const roots = q ? childNodes(null).filter(n => subtreeMatchesQuery(n, q)) : childNodes(null);
  const wrap = document.createElement("div");
  if (roots.length === 0) {
    wrap.innerHTML = q ? '<div class="empty-hint">Keine Roadmap-Punkte gefunden.</div>' : '<div class="empty-hint">Noch keine Roadmap angelegt.</div>';
    return wrap;
  }
  wrap.className = "roadmap-folder-grid";
  roots.forEach((node, i) => {
    const pct = nodeProgressPct(node);
    const card = document.createElement("button");
    card.className = "roadmap-folder-card";
    card.dataset.openRoadmapRoot = node.id;
    // Ohne Inhalt zeigt der Ring einen Strich statt einer Null — sonst sieht unbeplantes
    // Geruest aus wie versaeumte Arbeit.
    const ringHtml = pct === null
      ? goldRingHtml(0, 88, i).replace(">0%<", ">\u2013<")
      : goldRingHtml(pct, 88, i);
    // "-" heisst "hier ist noch nichts geplant", "0 %" heisst "geplant, aber nichts davon erledigt".
    // Der Unterschied stand bisher nur im Code -- auf der Kachel sahen beide gleich aus.
    const kinder = childNodes(node.id);
    const aufgaben = categoryTasksForNode(node.id);
    const etappen = kinder.length || aufgaben.length;
    const fertig = kinder.length
      ? kinder.filter(nodeIstFertig).length
      : aufgaben.filter(t => t.done).length;
    const fussnote = pct === null ? "noch nichts geplant" : `${fertig} von ${etappen} Etappen`;
    card.innerHTML = `
      ${nodeEditBtnHtml(node.id)}
      <div class="roadmap-folder-name">${escapeHtml(node.title)}</div>
      <div style="display:flex; justify-content:center;">${ringHtml}</div>
      <div class="roadmap-folder-meta">${fussnote}</div>
    `;
    wrap.appendChild(card);
  });
  const huelle = document.createElement("div");
  huelle.appendChild(wrap);
  // Neue Zielbereiche haengen direkt unter der Wurzel (parentId null).
  huelle.insertAdjacentHTML("beforeend", nodeAddBtnHtml("", "Zielbereich hinzuf\u00fcgen"));
  return huelle;
}

// Deterministischer, aber individueller Maskenindex je Knoten (dieselbe Tinten-Maske-Technik wie
// Ebene 1), damit jeder Roadmap-Kreis auf Ebene 2 sein eigenes Muster hat statt eines schlichten Rings.
function maskIndexForId(id) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) >>> 0;
  return n % RING_MASKS.length;
}

function roadmapCardHtml(p) {
  const pct = nodeProgressPct(p);
  const children = childNodes(p.id);
  const tasks = categoryTasksForNode(p.id);
  const stepCount = children.length || tasks.length;
  const doneCount = children.length
    ? children.filter(nodeIstFertig).length
    : tasks.filter(t => t.done).length;
  return `
    <button class="roadmap-card" data-open-roadmap-path="${p.id}">
      ${pct === null ? goldRingHtml(0, 34, maskIndexForId(p.id)).replace(">0%<", ">\u2013<") : goldRingHtml(pct, 34, maskIndexForId(p.id))}
      <div class="roadmap-card-body">
        <div class="roadmap-card-title">${escapeHtml(p.title)}${nodeEditBtnHtml(p.id)}</div>
        <div class="roadmap-card-meta">${stepCount ? `${doneCount} / ${stepCount} Etappen` : "noch nichts geplant"}</div>
      </div>
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style="flex-shrink:0; color:var(--color-neutral-500);"><path d="M7.5 4.5L13 10L7.5 15.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  `;
}

// Ebene 2: alle Themen dieses Teilbereichs untereinander als Liste, kein Links-Rechts-Slide mehr.
function renderRoadmapCategory(rootId) {
  const root = nodeById(rootId);
  const themes = childNodes(rootId);
  const wrap = document.createElement("div");
  wrap.className = "roadmap-category";
  const sectionsHtml = themes.length
    ? themes.map(theme => {
        const projects = childNodes(theme.id);
        const targets = projects.length ? projects : [theme];
        return `
          <div class="roadmap-theme-head">
            <h2 class="metal-gold abschnitt" style="margin:22px 0 8px;">${escapeHtml(theme.title)}</h2>
            ${nodeEditBtnHtml(theme.id)}
          </div>
          <div class="roadmap-card-list">${targets.map(roadmapCardHtml).join("")}</div>
          ${nodeAddBtnHtml(theme.id, "Punkt in \u201e" + escapeHtml(theme.title) + "\u201c")}
        `;
      }).join("")
    : '<div class="empty-hint">Noch keine Unterkategorien.</div>';
  wrap.innerHTML = `
    <div class="roadmap-crumb">
      <button data-roadmap-crumb-home>Roadmap</button> <span>&rsaquo;</span> <b>${escapeHtml(root.title)}</b>
      ${nodeEditBtnHtml(root.id)}
    </div>
    ${sectionsHtml}
    ${nodeAddBtnHtml(rootId, "Thema hinzuf\u00fcgen")}
  `;
  return wrap;
}

function renderRoadmapPath(nodeId) {
  const node = nodeById(nodeId);
  const ancestry = nodePath(nodeId);
  const children = childNodes(nodeId);
  const tasks = categoryTasksForNode(nodeId);
  const steps = children.length
    ? children.map(c => ({ id: c.id, title: c.title, kind: "node", done: nodeIstFertig(c) }))
    : tasks.map(t => ({ id: t.id, title: t.title, kind: "task", done: t.done }));

  let currentIdx = steps.findIndex(s => !s.done);
  if (currentIdx === -1) currentIdx = steps.length;
  const doneCount = steps.filter(s => s.done).length;
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

  const wrap = document.createElement("div");
  wrap.className = "roadmap-path-screen";
  const crumbHtml = ancestry.map((n, i) =>
    i === ancestry.length - 1 ? `<b>${escapeHtml(n.title)}</b>` : `<button data-roadmap-crumb-node="${n.id}">${escapeHtml(n.title)}</button>`
  ).join(' <span>&rsaquo;</span> ');
  wrap.innerHTML = `
    <div class="roadmap-crumb"><button data-roadmap-crumb-home>Roadmap</button> <span>&rsaquo;</span> ${crumbHtml}</div>
    <div class="card-title" style="font-size:var(--text-xl); margin-bottom:8px;">${escapeHtml(node.title)}</div>
    <div class="roadmap-progress-row">
      <div class="roadmap-progress-outer"><div class="roadmap-progress-inner" style="width:${pct}%"></div></div>
      <div class="roadmap-progress-label">${doneCount} / ${steps.length} Schritte</div>
    </div>
    <div class="roadmap-path" id="roadmapPathSteps"></div>
    ${nodeAddBtnHtml(nodeId, "Schritt hinzuf\u00fcgen")}
  `;
  const stepsWrap = wrap.querySelector("#roadmapPathSteps");
  if (steps.length === 0) {
    stepsWrap.innerHTML = '<div class="empty-hint">Noch keine Schritte.</div>';
  } else {
    steps.forEach((s, i) => {
      const status = i < currentIdx ? "done" : i === currentIdx ? "current" : "future";
      const el = document.createElement("div");
      el.className = "roadmap-step " + status;
      const dotAttr = s.kind === "node" ? `data-open-roadmap-path="${s.id}"` : `data-task="${s.id}"`;
      const stepTitleInner = status === "done"
        ? `<span class="paint-done-stroke">${paintStrokeSvgHtml(s.id)}</span><span class="paint-done-text">${i + 1}. ${escapeHtml(s.title)}</span>`
        : `${i + 1}. ${escapeHtml(s.title)}`;
      const startBtnHtml = status === "current"
        ? `<button class="btn btn-primary roadmap-start-btn" ${dotAttr}>Start</button>`
        : "";
      el.innerHTML = `
        <div class="roadmap-step-rail">
          <button class="roadmap-dot" ${dotAttr} aria-label="${escapeHtml(s.title)}">${status === "done" ? "&#10003;" : (i + 1)}</button>
        </div>
        <div class="roadmap-step-body">
          <div class="roadmap-step-title${status === "done" ? " paint-done-title" : ""}" ${s.kind === "node" ? `data-open-roadmap-path="${s.id}"` : ""}>${stepTitleInner}</div>
          ${s.kind === "node" ? nodeEditBtnHtml(s.id) : ""}
          ${startBtnHtml}
        </div>
      `;
      stepsWrap.appendChild(el);
    });
  }
  return wrap;
}

// ---------- Rendering: Woche ----------
function renderWeekStats() {
  const grid = document.getElementById("statsGrid");
  const totalTasks = state.tasks.length;
  const doneTasks = state.tasks.filter(t => t.done).length;
  const longestStreak = state.habits.reduce((max, h) => Math.max(max, computeStreak(h)), 0);

  const todayPct = dayCompletionPct(new Date());
  const dueToday = state.habits.filter(h => isScheduledToday(h, new Date()) && new Date(h.createdAt) <= new Date());
  const doneToday = dueToday.filter(h => habitDoneOn(h, todayStr())).length;
  const taskPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  grid.innerHTML = [
    { num: `${doneToday}/${dueToday.length}`, label: "Heute erledigt", sub: todayPct === null ? "nichts fällig" : todayPct + "% der Punkte" },
    { num: `${doneTasks}/${totalTasks}`, label: "Aufgaben erledigt", sub: taskPct + "% aller Aufgaben" },
    { num: longestStreak, label: "Längste Serie", sub: longestStreak === 1 ? "Tag am Stück" : "Tage am Stück" },
    { num: childNodes(null).length, label: "Zielbereiche", sub: `${state.habits.length} Gewohnheiten` }
  ].map(b => `<div class="stat-box"><div class="stat-num">${b.num}</div><div class="stat-label">${b.label}</div><div class="stat-sub">${b.sub}</div></div>`).join("");

  const completed = state.tasks.filter(t => t.done && t.completedAt);
  let onTime = 0;
  completed.forEach(t => { if (isOnTime(t)) onTime++; });
  const pct = completed.length ? Math.round((onTime / completed.length) * 100) : 0;
  document.getElementById("punctualityFill").style.width = pct + "%";
  document.getElementById("punctualityText").textContent =
    completed.length ? `${onTime} von ${completed.length} erledigten Aufgaben pünktlich (${pct}%)` : "Noch keine erledigten Aufgaben mit Termin.";

  renderActivityHeatmap();
  renderTaskAnalysis();
  renderHabitStreaks();
  renderAreaLoad();
  renderMoreStats();
  renderFinanceAnalysis();
  renderGymAnalysis();
  renderReflection();
}

function taskCompletionRateInWindow(days) {
  const cutoff = todayStr(-days);
  const relevant = state.tasks.filter(t => t.createdAt && t.createdAt.slice(0, 10) >= cutoff);
  if (relevant.length === 0) return null;
  return relevant.filter(t => t.done).length / relevant.length;
}

// ---------- Analyse: erledigte Aufgaben ----------
// Zeigt getrennt nach Zeitraum, WAS erledigt wurde, WIE VIEL Zeit dahinter steckt (geschaetzt
// aus der Aufwandsstufe, nicht gemessen) und OB es puenktlich war. Gewohnheiten kommen hier
// bewusst nicht vor — die haben ihren eigenen Abschnitt mit der Serie.
function renderTaskAnalysis() {
  const wrap = document.getElementById("taskAnalysis");
  if (!wrap) return;
  const todos = state.tasks.filter(t => (t.source || "todo") !== "category");
  const erledigt = todos.filter(t => t.done && t.completedAt);

  const imFenster = (t, tage) => localDateKey(new Date(t.completedAt)) >= todayStr(-tage);
  const bloecke = [
    { titel: "Diese Woche", liste: erledigt.filter(t => localDateKey(new Date(t.completedAt)) >= localDateKey(mondayOfWeek(new Date()))) },
    { titel: "Letzte 30 Tage", liste: erledigt.filter(t => imFenster(t, 30)) },
    { titel: "Insgesamt", liste: erledigt }
  ];
  const kacheln = bloecke.map(b => {
    const minuten = b.liste.reduce((sum, t) => sum + taskMinutes(t), 0);
    const puenktlich = b.liste.filter(isOnTime).length;
    const quote = b.liste.length ? Math.round(puenktlich / b.liste.length * 100) : null;
    return `<div class="stat-box aufgaben-kachel">
        <div class="stat-label">${b.titel}</div>
        <div class="stat-num">${b.liste.length}</div>
        <div class="aufgaben-kachel-fuss">
          <span>${formatAufwand(minuten)}</span>
          ${quote === null ? "" : `<span class="aufgaben-quote">${quote}% p\u00fcnktlich</span>`}
        </div>
      </div>`;
  }).join("");

  // Wohin die Zeit geflossen ist — nach Aufwandsstufe, damit sichtbar wird, ob viele kleine
  // oder wenige grosse Aufgaben den Zeitraum gefuellt haben.
  const letzte30 = erledigt.filter(t => imFenster(t, 30));
  const jeStufe = EFFORT_LEVELS.map(e => {
    const passend = letzte30.filter(t => effortLevelInfo(t.size).level === e.level);
    return { e, anzahl: passend.length, minuten: passend.reduce((sum, t) => sum + taskMinutes(t), 0) };
  }).filter(x => x.anzahl > 0);
  const maxMin = Math.max(1, ...jeStufe.map(x => x.minuten));
  const verteilung = jeStufe.length
    ? `<div class="panel-card" style="margin-top:12px;">
         <div class="text-muted" style="font-size:var(--text-xs); margin-bottom:8px;">Aufwand der letzten 30 Tage nach Stufe \u00b7 gesch\u00e4tzt aus der gew\u00e4hlten Aufwandsstufe</div>
         ${jeStufe.map(x => `
           <div class="aufwand-zeile">
             <span class="aufwand-name">${escapeHtml(x.e.label)}</span>
             <span class="aufwand-balken"><i style="width:${Math.round(x.minuten / maxMin * 100)}%"></i></span>
             <span class="aufwand-wert">${x.anzahl}\u00d7 \u00b7 ${formatAufwand(x.minuten)}</span>
           </div>`).join("")}
       </div>`
    : "";

  const offen = todos.filter(t => !t.done);
  const offeneMinuten = offen.reduce((sum, t) => sum + taskMinutes(t), 0);
  const ausblick = offen.length
    ? `<p class="text-muted" style="font-size:var(--text-sm); margin:12px 0 0;">Noch offen: <b>${offen.length}</b> ${offen.length === 1 ? "Aufgabe" : "Aufgaben"}, gesch\u00e4tzt <b>${formatAufwand(offeneMinuten)}</b> Arbeit.</p>`
    : "";

  wrap.innerHTML = erledigt.length || offen.length
    ? `<div class="stats-grid">${kacheln}</div>${verteilung}${ausblick}`
    : `<div class="empty-hint">Noch keine Aufgaben erledigt.</div>`;
}

// ---------- Analyse: Gewohnheiten und ihre Serien ----------
// Die Serie stand vorher in der Heute-Ansicht zwischen den abzuhakenden Punkten. Dort ist sie
// Druck; hier ist sie Information — mit der Quote der letzten 30 Tage als Bezugsgroesse.
function renderHabitStreaks() {
  const wrap = document.getElementById("habitStreakList");
  if (!wrap) return;
  const zeilen = state.habits
    .map(h => ({ h, streak: computeStreak(h), quote: habitCompletionRate(h, 30), minimal: habitMinimalDays(h, 30) }))
    .sort((x, y) => y.streak - x.streak || y.quote - x.quote);
  wrap.innerHTML = zeilen.length
    ? zeilen.map(({ h, streak, quote, minimal }) => `
        <div class="streak-zeile">
          <span class="streak-name">${escapeHtml(h.title)}${h.routineOrder != null ? "" : ` <span class="streak-nebenrolle">weitere</span>`}${minimal ? ` <span class="streak-nebenrolle">${minimal}× minimal</span>` : ""}</span>
          <span class="streak-quote">${Math.round(quote * 100)}%</span>
          <span class="streak-wert${streak > 0 ? " aktiv" : ""}">${streak > 0 ? streak + (streak === 1 ? " Tag" : " Tage") : "\u2013"}</span>
        </div>`).join("")
    : `<div class="empty-hint">Noch keine Gewohnheiten angelegt.</div>`;
}

function renderMoreStats() {
  const wrap = document.getElementById("moreStats");
  if (!wrap) return;

  const rate7 = taskCompletionRateInWindow(7);
  const rate30 = taskCompletionRateInWindow(30);
  const rate60 = taskCompletionRateInWindow(60);
  const devCount7 = state.deviations.filter(d => d.date >= todayStr(-7)).length;
  const devCount30 = state.deviations.filter(d => d.date >= todayStr(-30)).length;
  // "fulfilled" tragen nur noch Bitten (ein abgeschlossener Dank bekommt "thanked"), und "offen"
  // heisst offen — die als nicht mehr relevant abgelegten Anliegen zaehlten hier frueher mit.
  const prayerFulfilled = state.prayers.filter(p => p.status === "fulfilled").length;
  const prayerOpen = state.prayers.filter(p => p.status === "open").length;

  // Vorher standen hier sechs gleich aussehende Kacheln, davon dreimal "Aufgaben erledigt" mit
  // nur unterschiedlichem Untertitel — man musste jede einzeln lesen, um sie zu unterscheiden.
  // Jetzt: eine Verlaufskachel fuer die Quote, eine fuer Abweichungen, eine fuer Gebete.
  const quote = v => v !== null ? Math.round(v * 100) + "%" : "\u2013";
  const verlauf = [
    { label: "7 Tage", wert: rate7 },
    { label: "30 Tage", wert: rate30 },
    { label: "60 Tage", wert: rate60 }
  ];

  wrap.innerHTML = `
    <div class="kennzahl-karte">
      <div class="kennzahl-kopf">Aufgabenquote</div>
      <div class="kennzahl-reihe">
        ${verlauf.map(v => `
          <div class="kennzahl-spalte">
            <div class="kennzahl-wert">${quote(v.wert)}</div>
            <div class="kennzahl-sub">${v.label}</div>
          </div>`).join("")}
      </div>
    </div>
    <div class="kennzahl-karte">
      <div class="kennzahl-kopf">Abweichungen vom Plan</div>
      <div class="kennzahl-reihe">
        <div class="kennzahl-spalte"><div class="kennzahl-wert">${devCount7}</div><div class="kennzahl-sub">7 Tage</div></div>
        <div class="kennzahl-spalte"><div class="kennzahl-wert">${devCount30}</div><div class="kennzahl-sub">30 Tage</div></div>
      </div>
    </div>
    <div class="kennzahl-karte">
      <div class="kennzahl-kopf">Gebete</div>
      <div class="kennzahl-reihe">
        <div class="kennzahl-spalte"><div class="kennzahl-wert">${prayerFulfilled}</div><div class="kennzahl-sub">Erh\u00f6rungen</div></div>
        <div class="kennzahl-spalte"><div class="kennzahl-wert">${prayerOpen}</div><div class="kennzahl-sub">offen</div></div>
      </div>
    </div>`;
}

// Liefert beides: die Tage (wie oft ueberhaupt gehalten) und die Punktquote (wie hoch die Latte
// dabei lag). Die Tageszahl allein verschweigt jede Minimalstufe.
function habitStatsWindow(habit, days) {
  let total = 0, done = 0, minimal = 0, soll = 0, ist = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (new Date(habit.createdAt) > d) continue;
    if (!isScheduledToday(habit, d)) continue;
    total++;
    soll += habit.points ?? 1;
    const key = localDateKey(d);
    if (habitDoneOn(habit, key)) {
      done++;
      ist += habitPointsOn(habit, key);
      if (habit.history[key] === "minimal") minimal++;
    }
  }
  return { total, done, minimal, rate: total ? done / total : null, punkteRate: soll ? ist / soll : null };
}

function weekdayDifficulty(days) {
  const totals = Array.from({ length: 7 }, () => ({ total: 0, done: 0 }));
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const wd = (d.getDay() + 6) % 7;
    const key = localDateKey(d);
    state.habits.forEach(h => {
      if (new Date(h.createdAt) > d) return;
      if (!isScheduledToday(h, d)) return;
      // Punkte statt Haken: ein Wochentag, an dem alles nur auf Minimalstufe lief, ist nicht
      // derselbe wie einer, an dem alles voll stand -- vorher sahen beide gleich aus.
      totals[wd].total += h.points ?? 1;
      totals[wd].done += habitPointsOn(h, key);
    });
  }
  return totals.map((t, i) => ({
    day: WEEKDAY_LABELS[i],
    total: t.total,
    rate: t.total ? t.done / t.total : null
  }));
}

// ---------- Aktivitäts-Heatmap (letzte 7 Wochen) ----------
function lerpColor(hexA, hexB, t) {
  const a = parseInt(hexA.slice(1), 16), b = parseInt(hexB.slice(1), 16);
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}
const HEATMAP_GREY = "#5b6072";
const HEATMAP_GOLD = "#d4af37";

function dayCompletionPct(dateObj) {
  const key = localDateKey(dateObj);
  // Dieselbe Grundmenge wie der Wochenkreis (renderWeekCircle): alle faelligen Gewohnheiten.
  // Die beiden muessen zusammenbleiben, sonst zeigt derselbe Tag auf "Heute" und in der Heatmap
  // zwei verschiedene Werte — genau das war vorher der Fall.
  const scheduled = state.habits.filter(h => localDateKey(new Date(h.createdAt)) <= key && isScheduledToday(h, dateObj));
  const totalPoints = scheduled.reduce((sum, h) => sum + (h.points ?? 1), 0);
  const earnedPoints = scheduled.reduce((sum, h) => sum + habitPointsOn(h, key), 0);
  return totalPoints ? Math.round((earnedPoints / totalPoints) * 100) : null;
}

// Unter 25% erreichten Punkten voll Blau/Grau, ab 80% bereits voll Gold.
function heatmapColorT(pct) {
  if (pct === null) return 0;
  if (pct <= 25) return 0;
  if (pct >= 80) return 1;
  return (pct - 25) / (80 - 25);
}

// Sieben Wochen, immer auf Mo-So ausgerichtet (endet am Sonntag der laufenden Woche). Vorher lief
// das Raster einfach 49 Tage rueckwaerts ab heute -- dann steht in jeder Spalte ein anderer
// Wochentag und die Spaltenbeschriftung waere gelogen.
function renderActivityHeatmap() {
  const wrap = document.getElementById("activityHeatmap");
  if (!wrap) return;
  const head = document.getElementById("heatmapWeekdays");
  if (head) head.innerHTML = WEEKDAY_LABELS.map(w => `<span>${w}</span>`).join("");

  wrap.innerHTML = "";
  const sunday = mondayOfWeek(new Date());
  sunday.setDate(sunday.getDate() + 6);
  const todayKey = todayStr();

  for (let i = 48; i >= 0; i--) {
    const d = new Date(sunday);
    d.setDate(d.getDate() - i);
    const key = localDateKey(d);
    const cell = document.createElement("div");
    cell.className = "heatmap-cell";
    if (key > todayKey) {                  // Rest der laufenden Woche: Platzhalter, nicht anklickbar
      cell.classList.add("future");
      wrap.appendChild(cell);
      continue;
    }
    const pct = dayCompletionPct(d);
    const base = lerpColor(HEATMAP_GREY, HEATMAP_GOLD, heatmapColorT(pct));
    // Eine Flaeche, ein Wert. Vorher lag auf jeder Zelle zusaetzlich ein Verlauf von 22 % heller
    // nach 25 % dunkler plus zwei Innenschatten -- eine einzelne Zelle schwankte damit in sich um
    // rund 47 Prozentpunkte. In einer Heatmap IST die Helligkeit die Aussage: dadurch konnte die
    // untere rechte Ecke einer guten Woche dunkler sein als die obere linke einer schlechten, und
    // beim Vergleich zweier Zellen wusste man nicht, ob der Unterschied aus den Daten kam.
    cell.style.background = base;
    // Der Tag laesst sich am Titel schon ablesen, dazu noch der Wert in Klartext -- vorher stand
    // dort das Maschinendatum.
    cell.title = pct === null
      ? formatDatum(key)
      : `${formatDatum(key)}: ${pct} % der Punkte`;
    if (key === todayKey) cell.classList.add("today");
    cell.dataset.date = key;
    wrap.appendChild(cell);
  }
}

let currentDaySheetKey = null;

function dayHabitsList(dateObj) {
  const key = localDateKey(dateObj);
  return state.habits
    .filter(h => localDateKey(new Date(h.createdAt)) <= key && isScheduledToday(h, dateObj))
    .sort((a, b) => (a.routineOrder ?? 999) - (b.routineOrder ?? 999) || a.title.localeCompare(b.title, "de"));
}

// Dieselbe Zeile wie auf "Heute", nur fuer einen anderen Tag: Regler fuer die Minimalstufe,
// Titel der eingestellten Stufe, Punktwert. Der Regler fehlte hier komplett -- die Stufe eines
// vergangenen Tages liess sich also ueberhaupt nicht nachtragen, obwohl der Klick-Handler
// (data-level-date) und das Neuzeichnen des Tagesblatts dafuer laengst vorhanden waren. Und der
// Titel stand immer auf der Idealstufe, auch wenn der Tag auf der kleinen Version lief.
function renderDaySheetHabits(dateObj) {
  const key = localDateKey(dateObj);
  const habits = dayHabitsList(dateObj);
  if (!habits.length) return '<div class="empty-hint">Keine Gewohnheiten an diesem Tag fällig.</div>';
  return habits.map(h => {
    const rawValue = h.history[key];
    const doneToday = habitDoneOn(h, key);
    const shownTitle = habitTitleOn(h, key);
    const checkHtml = h.type === "weight"
      ? `<button class="atlas-check${doneToday ? " checked" : ""}" style="pointer-events:none;" tabindex="-1" aria-hidden="true">${doneToday ? splatSvg(h.id) : ""}</button>`
      : `<button class="atlas-check${doneToday ? " checked" : ""}" data-habit="${h.id}" data-date="${key}" aria-label="${escapeHtml(shownTitle)}: ${doneToday ? "erledigt, zum Zurücknehmen antippen" : "offen, zum Abhaken antippen"}">${doneToday ? splatSvg(h.id) : ""}</button>`;
    const weightInputHtml = h.type === "weight"
      ? `<span class="wert-mit-einheit"><input type="number" step="0.1" min="0" inputmode="decimal" class="input" style="width:62px; height:34px; padding:6px 8px; text-align:right;" data-weight-habit="${h.id}" data-date="${key}" aria-label="${escapeHtml(h.title)}: Gewicht in Kilogramm" value="${rawValue !== undefined && rawValue !== null ? rawValue : ""}"><span class="wert-einheit">kg</span></span>`
      : "";
    // Punktzahl nur, wenn sie etwas sagt -- dieselbe Regel wie in der Heute-Liste.
    const fullPoints = h.points ?? 1;
    const levelPoints = habitLevelOn(h, key) === "minimal" ? fullPoints * HABIT_MINIMAL_FACTOR : fullPoints;
    const pointsHtml = (levelPoints === 1 && fullPoints === 1)
      ? ""
      : `<div class="item-meta">${formatPoints(levelPoints)} Punkt${levelPoints === 1 ? "" : "e"}${
        levelPoints !== fullPoints ? ` <span style="color:var(--color-text-muted);">statt ${formatPoints(fullPoints)}</span>` : ""}</div>`;
    return `
      <div class="atlas-row${doneToday ? " done" : ""}">
        ${checkHtml}
        <div style="flex:1; min-width:0;">
          <div class="item-title">${escapeHtml(shownTitle)}</div>
          ${pointsHtml}
        </div>
        ${weightInputHtml}
        ${levelSwitchHtml(h, key)}
      </div>
    `;
  }).join("");
}

function openDaySheet(dateKey) {
  currentDaySheetKey = dateKey;
  const d = dateFromKey(dateKey);
  const pct = dayCompletionPct(d);
  const weekday = d.toLocaleDateString("de-DE", { weekday: "long" });
  const dateLabel = formatDatum(dateKey);
  const levelLabel = pct === null ? "Keine Gewohnheiten an diesem Tag fällig." : `${pct}% der Punkte erreicht`;
  openModal(`
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <h2 style="font-size:var(--text-2xl); margin:0;">${weekday}, ${dateLabel}</h2>
      <button class="btn btn-icon btn-secondary" id="mCloseSheet" aria-label="Schließen">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2L12 12M12 2L2 12" stroke="var(--color-text)" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="metal-gold" style="font-size:var(--text-lg); font-family:var(--font-heading); margin-top:10px;">${levelLabel}</div>
    <p class="text-muted" style="font-size:var(--text-xs); margin:8px 0 12px;">Tippe eine Gewohnheit an, um sie für diesen Tag nachzutragen oder zu korrigieren.</p>
    <div style="display:flex; flex-direction:column; gap:8px;">${renderDaySheetHabits(d)}</div>
  `, body => { body.querySelector("#mCloseSheet").addEventListener("click", closeModal); }, "sheet");
}

// ---------- Aufgaben je Bereich ----------
function countTasksInSubtree(nodeId, seen = new Set()) {
  if (seen.has(nodeId)) return 0;
  seen.add(nodeId);
  let count = categoryTasksForNode(nodeId).length;
  childNodes(nodeId).forEach(c => { count += countTasksInSubtree(c.id, seen); });
  return count;
}

// Absteigend sortiert und Nullzeilen eingeklappt: bei elf Bereichen, von denen zehn auf 0 stehen,
// war die alte Liste zu 90% Rauschen. Namen duerfen jetzt umbrechen statt abgeschnitten zu werden.
let areaLoadShowAll = false;

function renderAreaLoad() {
  const wrap = document.getElementById("areaLoad");
  if (!wrap) return;
  // Zaehlt, was ERLEDIGT ist, nicht was eingetragen wurde — eine hohe Zahl soll Fortschritt
  // bedeuten, nicht blosse Menge an offener Arbeit.
  const erledigtImTeilbaum = id => {
    let n = 0;
    const lauf = (knotenId, gesehen) => {
      if (gesehen.has(knotenId)) return;
      gesehen.add(knotenId);
      n += categoryTasksForNode(knotenId).filter(t => t.done).length;
      childNodes(knotenId).forEach(c => lauf(c.id, gesehen));
    };
    lauf(id, new Set());
    return n;
  };
  const roots = childNodes(null)
    .map(n => ({ node: n, count: erledigtImTeilbaum(n.id), gesamt: countTasksInSubtree(n.id) }))
    .sort((a, b) => b.count - a.count || a.node.title.localeCompare(b.node.title, "de"));
  if (!roots.length) { wrap.innerHTML = '<div class="empty-hint">Noch keine Bereiche angelegt.</div>'; return; }

  const max = Math.max(1, ...roots.map(r => r.count));
  const total = roots.reduce((s, r) => s + r.count, 0);
  const empty = roots.filter(r => r.gesamt === 0);
  const shown = areaLoadShowAll ? roots : roots.filter(r => r.gesamt > 0);

  const rowHtml = r => `
    <div class="areaload-row">
      <div class="areaload-name">${escapeHtml(r.node.title)}</div>
      <div class="areaload-bar-outer"><div class="areaload-bar-inner" style="width:${r.count ? Math.max(3, Math.round((r.count / max) * 100)) : 0}%"></div></div>
      <div class="areaload-count">${r.count}<span class="areaload-von"> / ${r.gesamt}</span></div>
    </div>`;

  wrap.innerHTML = `
    <div class="areaload-total">${total} erledigt von ${roots.reduce((n, r) => n + r.gesamt, 0)} Aufgaben · ${roots.length} Bereiche</div>
    ${(shown.length ? shown : roots).map(rowHtml).join("")}
    ${empty.length ? `<button class="areaload-toggle" data-areaload-toggle>${areaLoadShowAll ? "Leere Bereiche ausblenden" : `Alle ${roots.length} Bereiche zeigen`}</button>` : ""}
  `;
}

function weekStartKey(dateObj = new Date()) {
  return localDateKey(mondayOfWeek(dateObj));
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

// ---------- Analyse: Untertabs ----------
// Die Analyse war eine einzige, sehr lange Scrollstrecke -- vier Bereiche, immer nur einer sichtbar.
document.addEventListener("click", e => {
  const st = e.target.closest("[data-subtab]");
  if (st) {
    const key = st.dataset.subtab;
    st.closest(".subtabs").querySelectorAll(".subtab").forEach(b => b.classList.toggle("active", b === st));
    st.closest(".tab-panel").querySelectorAll(":scope > .subpanel").forEach(pnl => pnl.classList.toggle("active", pnl.dataset.subpanel === key));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (e.target.closest("[data-areaload-toggle]")) {
    areaLoadShowAll = !areaLoadShowAll;
    renderAreaLoad();
  }
});
