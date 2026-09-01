// ============================================================
// Atlas — atlas-finanzen.js
// Finanzplanung und Gebetsanliegen
//
// Teil von app.js, das auf 9 Dateien aufgeteilt wurde. Die Reihenfolge in index.html
// entspricht exakt der frueheren Reihenfolge in der einen Datei -- die Dateien teilen sich
// weiterhin einen Gueltigkeitsbereich, es sind bewusst KEINE Module. Dadurch aendert das
// Aufteilen am Verhalten nichts; nur Funktionen werden nicht mehr ueber Dateigrenzen hinweg
// vorgezogen, weshalb Code, der sofort laeuft, hinter seinen Funktionen stehen muss.
// ============================================================

// ---------- Finanzplanung ----------
function formatEuro(n) {
  return (n || 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}
function financeMonthKey(d = new Date()) { return localDateKey(d).slice(0, 7); }
// Monatsanfang N Monate zurück — setDate(1) zuerst, sonst überläuft setMonth() bei Tagen,
// die es im Zielmonat nicht gibt (z.B. der 30. in Verbindung mit Februar).
function monthsAgo(n) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - n);
  return d;
}

const DEL_ICON = '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 1.5L11.5 11.5M11.5 1.5L1.5 11.5" stroke="var(--color-neutral-500)" stroke-width="1.4" stroke-linecap="round"/></svg>';

function totalMonthlyIncome() {
  return state.financeIncomeSources.reduce((s, i) => s + (i.amount || 0), 0);
}

// Große Beträge ohne Cent: in der Kopfzahl sind "2.450 €" lesbarer als "2.450,00 €".
function formatEuro0(n) {
  return Math.round(n || 0).toLocaleString("de-DE") + " €";
}
// Wie weit ist der Monat herum? Bezugsgröße dafür, ob das Budget im Plan liegt --
// "78% verbraucht" heißt an Tag 3 etwas völlig anderes als an Tag 28.
function financeMonthProgress() {
  const now = new Date();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return { day: now.getDate(), days, pct: (now.getDate() / days) * 100 };
}
function financeMonthLabel() {
  return new Date().toLocaleDateString("de-DE", { month: "long", year: "numeric" });
}
// Fortschrittsbalken mit Markierung, wie weit der Monat ist. Liegt der Balken deutlich vor der
// Markierung, wird zu schnell ausgegeben -- das ist die eigentliche Aussage, nicht die Prozentzahl.
function financePaceBar(spent, limit, small) {
  if (!limit) return "";
  const pct = (spent / limit) * 100;
  const mp = financeMonthProgress();
  const over = pct > 100;
  const ahead = !over && pct > mp.pct + 8;
  return `<div class="fin-pace-bar${small ? " small" : ""}${over ? " over" : ahead ? " ahead" : ""}">
      <i style="transform:scaleX(${(Math.min(100, pct) / 100).toFixed(4)})"></i>
      <u style="left:${Math.min(100, mp.pct)}%" title="Tag ${mp.day} von ${mp.days}"></u>
    </div>`;
}

function financeMonthHeroHtml(totalIncome, totalSpent, totalLimit) {
  const mp = financeMonthProgress();
  const left = totalIncome - totalSpent;
  const rate = totalIncome > 0 ? Math.round((left / totalIncome) * 100) : null;

  const bigHtml = totalIncome > 0
    ? `<div class="fin-hero-big${left < 0 ? " neg" : ""}">${formatEuro0(left)}</div>
       <div class="fin-hero-sub">übrig von ${formatEuro0(totalIncome)} Einkommen</div>`
    : `<div class="fin-hero-big">${formatEuro0(totalSpent)}</div>
       <div class="fin-hero-sub">ausgegeben — Einkommen unter „Vermögen“ eintragen, dann rechnet Atlas die Sparquote</div>`;

  const budgetHtml = totalLimit > 0
    ? `${financePaceBar(totalSpent, totalLimit)}
       <div class="fin-pace-legend">
         <span>${Math.round((totalSpent / totalLimit) * 100)}% von ${formatEuro0(totalLimit)} Budget</span>
         <span>Tag ${mp.day} von ${mp.days}</span>
       </div>`
    : `<div class="fin-hero-hint">Noch kein Budget gesetzt — leg unten Kategorien mit Limit an.</div>`;

  return `<div class="fin-hero">
      <div class="fin-hero-month">${escapeHtml(financeMonthLabel())}</div>
      ${bigHtml}
      <div class="fin-hero-split">
        <div><b>${formatEuro0(totalSpent)}</b><span>Ausgaben</span></div>
        <div><b>${rate === null ? "–" : rate + "%"}</b><span>Sparquote</span></div>
        <div><b>${state.financeExpenses.filter(e => e.date.slice(0, 7) === financeMonthKey()).length}</b><span>Buchungen</span></div>
      </div>
      ${budgetHtml}
    </div>`;
}

function financeWealthHeroHtml() {
  const total = state.financeAccounts.reduce((s, a) => s + (a.balance || 0), 0);
  const emergency = state.financeAccounts.filter(a => a.isEmergencyFund).reduce((s, a) => s + (a.balance || 0), 0);
  const income = totalMonthlyIncome();
  return `<div class="fin-hero">
      <div class="fin-hero-month">Gesamtvermögen</div>
      <div class="fin-hero-big">${formatEuro0(total)}</div>
      <div class="fin-hero-sub">${state.financeAccounts.length
        ? `verteilt auf ${state.financeAccounts.length} ${state.financeAccounts.length === 1 ? "Position" : "Positionen"}`
        : "Noch keine Konten angelegt."}</div>
      <div class="fin-hero-split">
        <div><b>${formatEuro0(emergency)}</b><span>Notgroschen</span></div>
        <div><b>${formatEuro0(income)}</b><span>Einkommen / Monat</span></div>
        <div><b>${income > 0 ? (Math.round(total / income * 10) / 10).toLocaleString("de-DE") + "×" : "–"}</b><span>Monatseinkommen</span></div>
      </div>
    </div>`;
}

// Ausgaben nach Tag gruppiert mit Tagessumme -- eine flache Liste macht nicht sichtbar,
// an welchen Tagen viel zusammenkommt.
function financeExpenseDayLabel(dateKey) {
  if (dateKey === todayStr()) return "Heute";
  if (dateKey === todayStr(-1)) return "Gestern";
  return dateFromKey(dateKey).toLocaleDateString("de-DE", { weekday: "short" }) + ", " + formatDatum(dateKey);
}

// Merkt je Sparziel, ob es beim letzten Rendern schon erreicht war — sonst wuerde die
// Erreicht-Animation bei jedem renderAll() erneut abspielen.
const zielErreichtZuvor = {};

function renderFinance() {
  const heroEl = document.getElementById("financeMonthHero");
  if (!heroEl) return;

  const monthKey = financeMonthKey();
  const monthExpenses = state.financeExpenses.filter(e => e.date.slice(0, 7) === monthKey);
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalLimit = state.financeCategories.reduce((s, c) => s + (c.limit || 0), 0);
  const totalIncome = totalMonthlyIncome();

  heroEl.innerHTML = financeMonthHeroHtml(totalIncome, totalSpent, totalLimit);
  document.getElementById("financeWealthHero").innerHTML = financeWealthHeroHtml();

  // ----- Budget je Kategorie -----
  const categoriesWrap = document.getElementById("financeCategoriesList");
  const cats = state.financeCategories
    .map(c => ({ c, spent: monthExpenses.filter(e => e.categoryId === c.id).reduce((s, e) => s + e.amount, 0) }))
    .sort((a, b) => {
      const ra = a.c.limit ? a.spent / a.c.limit : -1, rb = b.c.limit ? b.spent / b.c.limit : -1;
      return rb - ra;                                   // knappste Kategorie zuerst
    });
  categoriesWrap.innerHTML = cats.length
    ? cats.map(({ c, spent }) => {
        const limit = c.limit || 0;
        const rest = limit - spent;
        return `<div class="fin-cat${limit && spent > limit ? " over" : ""}">
          <div class="fin-cat-top">
            <div class="fin-cat-name" data-edit-category="${c.id}">${escapeHtml(c.title)}</div>
            <div class="fin-cat-amt"><b>${formatEuro0(spent)}</b>${limit ? " / " + formatEuro0(limit) : ""}</div>
            <button class="btn btn-icon btn-ghost" data-del-category="${c.id}" aria-label="Löschen">${DEL_ICON}</button>
          </div>
          ${limit ? financePaceBar(spent, limit, true) : ""}
          <div class="fin-cat-foot">${limit
            ? (rest >= 0 ? `noch ${formatEuro0(rest)}` : `<span class="over-txt">${formatEuro0(-rest)} über Limit</span>`)
            : "kein Limit gesetzt"}</div>
        </div>`;
      }).join("")
    : '<div class="empty-hint">Noch keine Budget-Kategorien angelegt.</div>';

  // ----- Letzte Ausgaben, nach Tag gruppiert -----
  const expensesWrap = document.getElementById("financeExpensesList");
  const order = new Map(state.financeExpenses.map((e, i) => [e.id, i]));
  const recent = monthExpenses
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || order.get(b.id) - order.get(a.id))
    .slice(0, 20);
  const byDay = [];
  recent.forEach(ex => {
    let grp = byDay.find(g => g.date === ex.date);
    if (!grp) { grp = { date: ex.date, items: [] }; byDay.push(grp); }
    grp.items.push(ex);
  });
  expensesWrap.innerHTML = byDay.length
    ? byDay.map(g => `
        <div class="fin-day">
          <div class="fin-day-head">
            <span>${escapeHtml(financeExpenseDayLabel(g.date))}</span>
            <span>${formatEuro(g.items.reduce((s, e) => s + e.amount, 0))}</span>
          </div>
          ${g.items.map(ex => {
            const cat = state.financeCategories.find(c => c.id === ex.categoryId);
            return `<div class="fin-exp">
              <div class="fin-exp-body">
                <div class="fin-exp-cat">${escapeHtml(cat ? cat.title : "Ohne Kategorie")}</div>
                ${ex.note ? `<div class="fin-exp-note">${escapeHtml(ex.note)}</div>` : ""}
              </div>
              <div class="fin-exp-amt">${formatEuro(ex.amount)}</div>
              <button class="btn btn-icon btn-ghost" data-del-expense="${ex.id}" aria-label="Löschen">${DEL_ICON}</button>
            </div>`;
          }).join("")}
        </div>`).join("")
    : `<div class="empty-hint">Noch keine Ausgaben in ${escapeHtml(financeMonthLabel())}.</div>`;

  // ----- Konten -----
  document.getElementById("financeAccountsList").innerHTML = state.financeAccounts.length
    ? state.financeAccounts.map(a => `
        <div class="atlas-row">
          <div style="flex:1; min-width:0; cursor:pointer;" data-edit-account="${a.id}">
            <div class="item-title">${escapeHtml(a.title)}${a.isEmergencyFund ? ' <span class="tag tag-accent" style="margin-left:6px;">Notgroschen</span>' : ""}</div>
          </div>
          <div class="fin-amount">${formatEuro(a.balance || 0)}</div>
          <button class="btn btn-icon btn-ghost" data-del-account="${a.id}" aria-label="Löschen">${DEL_ICON}</button>
        </div>`).join("")
    : '<div class="empty-hint">Noch keine Konten/Vermögenswerte angelegt.</div>';

  // ----- Einkommensquellen -----
  document.getElementById("financeIncomeList").innerHTML = state.financeIncomeSources.length
    ? state.financeIncomeSources.map(i => `
        <div class="atlas-row">
          <div style="flex:1; min-width:0; cursor:pointer;" data-edit-income="${i.id}">
            <div class="item-title">${escapeHtml(i.title)}</div>
          </div>
          <div class="fin-amount">${formatEuro(i.amount || 0)}</div>
          <button class="btn btn-icon btn-ghost" data-del-income="${i.id}" aria-label="Löschen">${DEL_ICON}</button>
        </div>`).join("") +
      `<div class="fin-sumrow"><span>Summe pro Monat</span><b>${formatEuro(totalIncome)}</b></div>`
    : '<div class="empty-hint">Noch keine Einkommensquelle eingetragen.</div>';

  // ----- Sparziele -----
  document.getElementById("savingsGoalsList").innerHTML = state.savingsGoals.length
    ? state.savingsGoals.map(g => {
        const target = g.target || 0, cur = g.current || 0;
        const pct = target ? Math.min(100, Math.round((cur / target) * 100)) : 0;
        return `<div class="fin-goal">
          <div class="fin-goal-top" data-edit-goal="${g.id}">
            ${budgetRingHtml(cur, target, 40, 0, true)}
            <div class="fin-goal-body">
              <div class="item-title">${escapeHtml(g.title)}</div>
              <div class="item-meta">${formatEuro(cur)} von ${formatEuro(target)}${g.dueDate ? " · bis " + formatDatum(g.dueDate) : ""}</div>
            </div>
            <div class="fin-goal-pct">${pct}%</div>
          </div>
          <div class="fin-goal-actions">
            <button class="btn btn-secondary" data-add-goal-amount="${g.id}">+ Betrag</button>
            ${target > cur ? `<span class="fin-goal-rest">noch ${formatEuro0(target - cur)}</span>` : '<span class="fin-goal-rest done">Ziel erreicht</span>'}
            <button class="btn btn-icon btn-ghost" data-del-goal="${g.id}" aria-label="Löschen">${DEL_ICON}</button>
          </div>
        </div>`;
      }).join("")
    : '<div class="empty-hint">Noch keine Sparziele angelegt.</div>';
}

function openAddGoalAmountModal(goal) {
  openModal(`
    <h3>Betrag zu "${escapeHtml(goal.title)}" hinzufügen</h3>
    <p class="text-muted" style="font-size:var(--text-sm); margin-bottom:10px;">Aktuell gespart: ${formatEuro(goal.current || 0)} von ${formatEuro(goal.target || 0)}</p>
    <div class="field">
      <label>Betrag (€)</label>
      <input type="number" step="0.01" id="mGoalAddAmount" placeholder="z.B. 50" autofocus>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Hinzufügen</button>
    </div>
  `, body => {
    body.querySelector("#mGoalAddAmount").focus();
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    body.querySelector("#mSave").addEventListener("click", () => {
      const amount = parseFloat(body.querySelector("#mGoalAddAmount").value);
      if (!amount) return;
      goal.current = (goal.current || 0) + amount;
      saveData();
      closeModal();
      renderAll();
    });
  });
}

function renderFinanceAnalysis() {
  const statsEl = document.getElementById("financeAnalysisStats");
  if (!statsEl) return;

  const totalNetWorth = state.financeAccounts.reduce((s, a) => s + (a.balance || 0), 0);
  const monthKey = financeMonthKey();
  const monthExpenses = state.financeExpenses.filter(e => e.date.slice(0, 7) === monthKey);
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalLimit = state.financeCategories.reduce((s, c) => s + (c.limit || 0), 0);

  const totalIncome = totalMonthlyIncome();
  const savingsRate = totalIncome > 0
    ? Math.round(((totalIncome - totalSpent) / totalIncome) * 100) + "%"
    : "–";

  // Notgroschen-Monate: Saldo aller markierten Konten ÷ Ø-Ausgaben der letzten 3 Monate
  const emergencyBalance = state.financeAccounts.filter(a => a.isEmergencyFund).reduce((s, a) => s + (a.balance || 0), 0);
  const last3 = [0, 1, 2].map(i => {
    const key = financeMonthKey(monthsAgo(i));
    return state.financeExpenses.filter(e => e.date.slice(0, 7) === key).reduce((s, e) => s + e.amount, 0);
  });
  const avgMonthly = last3.reduce((a, b) => a + b, 0) / 3;
  const emergencyMonths = avgMonthly > 0 ? (emergencyBalance / avgMonthly).toFixed(1) : "–";

  statsEl.innerHTML = `
    <div class="stat-box"><div class="stat-num">${formatEuro(totalNetWorth)}</div><div class="stat-label">Nettovermögen</div></div>
    <div class="stat-box"><div class="stat-num">${formatEuro(totalSpent)}</div><div class="stat-label">Ausgaben (Monat)</div></div>
    <div class="stat-box"><div class="stat-num">${savingsRate}</div><div class="stat-label">Sparquote</div></div>
    <div class="stat-box"><div class="stat-num">${emergencyMonths}</div><div class="stat-label">Notgroschen-Monate</div></div>
  `;

  document.getElementById("financeBudgetRing").innerHTML = budgetRingHtml(totalSpent, totalLimit, 72);
  document.getElementById("financeBudgetBarLabel").textContent = `${formatEuro(totalSpent)} / ${formatEuro(totalLimit)}`;

  const breakdownWrap = document.getElementById("financeCategoryBreakdown");
  const rows = state.financeCategories.map(c => ({
    title: c.title,
    spent: monthExpenses.filter(e => e.categoryId === c.id).reduce((s, e) => s + e.amount, 0)
  })).sort((a, b) => b.spent - a.spent);
  const maxSpent = Math.max(1, ...rows.map(r => r.spent));
  breakdownWrap.innerHTML = rows.length
    ? rows.map(r => `
        <div class="areaload-row">
          <div class="areaload-name">${escapeHtml(r.title)}</div>
          <div class="areaload-bar-outer"><div class="areaload-bar-inner" style="width:${Math.round((r.spent / maxSpent) * 100)}%"></div></div>
          <div class="areaload-count">${formatEuro(r.spent)}</div>
        </div>
      `).join("")
    : '<div class="empty-hint">Noch keine Kategorien angelegt.</div>';

  const trendWrap = document.getElementById("financeTrend");
  const labelsWrap = document.getElementById("financeTrendLabels");
  const months = [5, 4, 3, 2, 1, 0].map(i => {
    const d = monthsAgo(i);
    const key = financeMonthKey(d);
    const total = state.financeExpenses.filter(e => e.date.slice(0, 7) === key).reduce((s, e) => s + e.amount, 0);
    return { label: d.toLocaleDateString("de-DE", { month: "short" }), total, isCurrent: i === 0 };
  });
  const maxMonth = Math.max(1, ...months.map(m => m.total));
  trendWrap.innerHTML = months.map(m => `
    <div class="finance-trend-bar"><div class="finance-trend-fill${m.isCurrent ? " current" : ""}" style="height:${m.total > 0 ? Math.max(4, Math.round((m.total / maxMonth) * 100)) : 2}%"></div></div>
  `).join("");
  labelsWrap.innerHTML = months.map(m => `<span>${m.label}</span>`).join("");

  const ringsWrap = document.getElementById("financeGoalsRings");
  ringsWrap.innerHTML = state.savingsGoals.length
    ? state.savingsGoals.map((g, i) => {
        // Nur der echte Wechsel auf "erreicht" loest die Animation aus. null = erster Render
        // der Sitzung, damit beim Oeffnen der App nichts grundlos aufblitzt.
        const erreicht = (g.target || 0) > 0 && (g.current || 0) >= g.target;
        const vorher = zielErreichtZuvor[g.id];
        const feiern = vorher === false && erreicht;
        zielErreichtZuvor[g.id] = erreicht;
        return `<div class="finance-ring-item">${budgetRingHtml(g.current || 0, g.target || 0, 56, i, true, feiern)}<div class="r-title">${escapeHtml(g.title)}</div></div>`;
      }).join("")
    : '<div class="empty-hint">Noch keine Sparziele.</div>';
}

function openIncomeSourceModal(editSource = null) {
  const isEdit = !!editSource;
  openModal(`
    <h3>${isEdit ? "Einkommensquelle bearbeiten" : "Einkommensquelle hinzufügen"}</h3>
    <div class="field">
      <label>Titel</label>
      <input type="text" id="mIncomeTitle" placeholder="z.B. Gehalt, Nebenjob" value="${isEdit ? escapeHtml(editSource.title) : ""}">
    </div>
    <div class="field">
      <label>Betrag / Monat (€)</label>
      <input type="number" step="0.01" min="0" id="mIncomeAmount" value="${isEdit ? (editSource.amount || 0) : ""}">
    </div>
    <div class="modal-actions">
      ${isEdit ? `<button class="btn btn-ghost" id="mDelete" style="color:var(--color-accent-300); margin-right:auto;">Löschen</button>` : ""}
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Speichern</button>
    </div>
  `, body => {
    body.querySelector("#mIncomeTitle").focus();
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    if (isEdit) body.querySelector("#mDelete").addEventListener("click", () => {
      closeModal();
      deleteWithUndo("financeIncomeSources", editSource.id, editSource.title);
    });
    body.querySelector("#mSave").addEventListener("click", () => {
      const feld = body.querySelector("#mIncomeTitle");
      const title = feld.value.trim();
      if (!title) { markiereFehlendesFeld(feld, "Ohne Bezeichnung lässt sich die Einkommensquelle nicht speichern."); return; }
      const amount = parseFloat(body.querySelector("#mIncomeAmount").value) || 0;
      if (isEdit) { editSource.title = title; editSource.amount = amount; }
      else state.financeIncomeSources.push({ id: uid(), title, amount });
      saveData(); closeModal(); renderAll();
    });
  });
}

function renderProjekte() {
  const wrap = document.getElementById("projectsList");
  if (!wrap) return;
  // Nicht neu aufbauen, waehrend in einem Notizfeld getippt wird — das wuerde Fokus, Cursor-
  // Position und (auf iOS) die eingeblendete Tastatur wegreissen. Der Text selbst ist ueber die
  // Freitext-Autospeicherung ohnehin schon im State.
  if (wrap.contains(document.activeElement) && document.activeElement.matches("[data-project-notes]")) return;
  wrap.innerHTML = state.projects.length
    ? state.projects.map(p => `
        <div class="card elev-sm project-card">
          <div class="project-card-head">
            <div class="item-title" data-edit-project="${p.id}" style="cursor:pointer;">${escapeHtml(p.title)}</div>
            <button class="btn btn-icon btn-ghost" data-del-project="${p.id}" aria-label="Löschen">${DEL_ICON}</button>
          </div>
          <textarea class="input project-notes" data-project-notes="${p.id}" placeholder="Notizen, Gedanken, Zwischenstand …">${escapeHtml(p.notes || "")}</textarea>
        </div>
      `).join("")
    : `<div class="leerzustand">
        <p class="leerzustand-text">Noch kein Projekt angelegt. Ein Projekt ist ein Feld für ein Vorhaben — Notizen, Gedanken, Zwischenstand.</p>
        <button class="btn btn-primary" data-leer-projekt="1">Erstes Projekt anlegen</button>
      </div>`;
}

function openAccountModal(editAccount = null) {
  const isEdit = !!editAccount;
  openModal(`
    <h3>${isEdit ? "Konto bearbeiten" : "Konto/Vermögenswert hinzufügen"}</h3>
    <div class="field">
      <label>Titel</label>
      <input type="text" id="mAccountTitle" placeholder="z.B. Girokonto, Depot, Bargeld" value="${isEdit ? escapeHtml(editAccount.title) : ""}">
    </div>
    <div class="field">
      <label>Aktueller Kontostand (€)</label>
      <input type="number" step="0.01" id="mAccountBalance" value="${isEdit ? (editAccount.balance || 0) : ""}">
    </div>
    <div class="checkbox-row" style="margin-bottom: 12px;">
      <input type="checkbox" id="mAccountEmergency" ${isEdit && editAccount.isEmergencyFund ? "checked" : ""}>
      <label for="mAccountEmergency">Das ist mein Notgroschen</label>
    </div>
    <div class="modal-actions">
      ${isEdit ? `<button class="btn btn-ghost" id="mDelete" style="color:var(--color-accent-300); margin-right:auto;">Löschen</button>` : ""}
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Speichern</button>
    </div>
  `, body => {
    body.querySelector("#mAccountTitle").focus();
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    if (isEdit) body.querySelector("#mDelete").addEventListener("click", () => {
      closeModal();
      deleteWithUndo("financeAccounts", editAccount.id, editAccount.title);
    });
    body.querySelector("#mSave").addEventListener("click", () => {
      const feld = body.querySelector("#mAccountTitle");
      const title = feld.value.trim();
      if (!title) { markiereFehlendesFeld(feld, "Ohne Bezeichnung lässt sich das Konto nicht speichern."); return; }
      const balance = parseFloat(body.querySelector("#mAccountBalance").value) || 0;
      const isEmergencyFund = body.querySelector("#mAccountEmergency").checked;
      if (isEdit) { editAccount.title = title; editAccount.balance = balance; editAccount.isEmergencyFund = isEmergencyFund; }
      else state.financeAccounts.push({ id: uid(), title, balance, isEmergencyFund });
      saveData(); closeModal(); renderAll();
    });
  });
}

function openCategoryModal(editCategory = null) {
  const isEdit = !!editCategory;
  openModal(`
    <h3>${isEdit ? "Kategorie bearbeiten" : "Budget-Kategorie hinzufügen"}</h3>
    <div class="field">
      <label>Titel</label>
      <input type="text" id="mCategoryTitle" placeholder="z.B. Lebensmittel" value="${isEdit ? escapeHtml(editCategory.title) : ""}">
    </div>
    <div class="field">
      <label>Monatliches Limit (€)</label>
      <input type="number" step="0.01" min="0" id="mCategoryLimit" value="${isEdit ? (editCategory.limit || 0) : ""}">
    </div>
    <div class="modal-actions">
      ${isEdit ? `<button class="btn btn-ghost" id="mDelete" style="color:var(--color-accent-300); margin-right:auto;">Löschen</button>` : ""}
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Speichern</button>
    </div>
  `, body => {
    body.querySelector("#mCategoryTitle").focus();
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    if (isEdit) body.querySelector("#mDelete").addEventListener("click", () => {
      closeModal();
      loescheKategorieMitUndo(editCategory.id);
    });
    body.querySelector("#mSave").addEventListener("click", () => {
      const feld = body.querySelector("#mCategoryTitle");
      const title = feld.value.trim();
      if (!title) { markiereFehlendesFeld(feld, "Ohne Bezeichnung lässt sich die Kategorie nicht speichern."); return; }
      const limit = parseFloat(body.querySelector("#mCategoryLimit").value) || 0;
      if (isEdit) { editCategory.title = title; editCategory.limit = limit; }
      else state.financeCategories.push({ id: uid(), title, limit });
      saveData(); closeModal(); renderAll();
    });
  });
}

function openExpenseModal() {
  if (state.financeCategories.length === 0) {
    openCategoryModal();
    return;
  }
  openModal(`
    <h3>Ausgabe erfassen</h3>
    <div class="field">
      <label>Kategorie</label>
      <select id="mExpenseCategory">
        ${state.financeCategories.map(c => `<option value="${c.id}">${escapeHtml(c.title)}</option>`).join("")}
      </select>
    </div>
    <div class="field">
      <label>Betrag (€)</label>
      <input type="number" step="0.01" min="0" id="mExpenseAmount" placeholder="0.00">
    </div>
    <div class="field">
      <label>Datum</label>
      <input type="date" id="mExpenseDate" value="${todayStr()}">
    </div>
    <div class="field">
      <label>Notiz (optional)</label>
      <input type="text" id="mExpenseNote" placeholder="z.B. Wocheneinkauf">
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Speichern</button>
    </div>
  `, body => {
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    body.querySelector("#mSave").addEventListener("click", () => {
      const categoryId = body.querySelector("#mExpenseCategory").value;
      const amount = parseFloat(body.querySelector("#mExpenseAmount").value);
      const date = body.querySelector("#mExpenseDate").value;
      const note = body.querySelector("#mExpenseNote").value.trim() || null;
      // Betrag ist das Feld, das man am ehesten leer lässt — deshalb wird genau das benannt.
      const betragFeld = body.querySelector("#mExpenseAmount");
      if (!amount || amount <= 0) { markiereFehlendesFeld(betragFeld, "Trag einen Betrag größer als null ein."); return; }
      if (!date) { markiereFehlendesFeld(body.querySelector("#mExpenseDate"), "Ohne Datum lässt sich die Ausgabe nicht einordnen."); return; }
      if (!categoryId) return;
      state.financeExpenses.push({ id: uid(), categoryId, amount, date, note });
      saveData(); closeModal(); renderAll();
    });
  });
}

function openSavingsGoalModal(editGoal = null) {
  const isEdit = !!editGoal;
  openModal(`
    <h3>${isEdit ? "Sparziel bearbeiten" : "Sparziel hinzufügen"}</h3>
    <div class="field">
      <label>Titel</label>
      <input type="text" id="mGoalTitle" placeholder="z.B. Notgroschen" value="${isEdit ? escapeHtml(editGoal.title) : ""}">
    </div>
    <div class="field">
      <label>Zielbetrag (€)</label>
      <input type="number" step="0.01" min="0.01" id="mGoalTarget" value="${isEdit ? (editGoal.target || 0) : ""}">
    </div>
    <div class="field">
      <label>Aktuell gespart (€)</label>
      <input type="number" step="0.01" min="0" id="mGoalCurrent" value="${isEdit ? (editGoal.current || 0) : 0}">
    </div>
    <div class="field">
      <label>Ziel-Datum (optional)</label>
      <input type="date" id="mGoalDate" value="${isEdit && editGoal.dueDate ? editGoal.dueDate : ""}">
    </div>
    <div class="modal-actions">
      ${isEdit ? `<button class="btn btn-ghost" id="mDelete" style="color:var(--color-accent-300); margin-right:auto;">Löschen</button>` : ""}
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Speichern</button>
    </div>
  `, body => {
    body.querySelector("#mGoalTitle").focus();
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    if (isEdit) body.querySelector("#mDelete").addEventListener("click", () => {
      closeModal();
      deleteWithUndo("savingsGoals", editGoal.id, editGoal.title);
    });
    body.querySelector("#mSave").addEventListener("click", () => {
      const titelFeld = body.querySelector("#mGoalTitle");
      const title = titelFeld.value.trim();
      if (!title) { markiereFehlendesFeld(titelFeld, "Ohne Titel lässt sich das Sparziel nicht speichern."); return; }
      const zielFeld = body.querySelector("#mGoalTarget");
      const target = parseFloat(zielFeld.value) || 0;
      // Ohne Zielbetrag gaebe es nichts zu erreichen — der Ring stuende dauerhaft auf 0 %.
      if (target <= 0) { markiereFehlendesFeld(zielFeld, "Ohne Zielbetrag gibt es nichts zu erreichen."); return; }
      const current = parseFloat(body.querySelector("#mGoalCurrent").value) || 0;
      const dueDate = body.querySelector("#mGoalDate").value || null;
      if (isEdit) { editGoal.title = title; editGoal.target = target; editGoal.current = current; editGoal.dueDate = dueDate; }
      else state.savingsGoals.push({ id: uid(), title, target, current, dueDate });
      saveData(); closeModal(); renderAll();
    });
  });
}

// ---------- Gebetsanliegen ----------
const CHECK_ICON = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-300)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';
const CROSS_ICON = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-neutral-500)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

function prayerDragHandleHtml(prayerId) {
  if (!quickAddVisible) return "";
  return `
    <button class="btn btn-icon btn-ghost routine-drag-handle" data-drag-handle-prayer="${prayerId}" aria-label="Ziehen zum Verschieben" style="touch-action:none; flex-shrink:0;">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="4" cy="3" r="1" fill="var(--color-neutral-400)"/><circle cx="8" cy="3" r="1" fill="var(--color-neutral-400)"/><circle cx="4" cy="6" r="1" fill="var(--color-neutral-400)"/><circle cx="8" cy="6" r="1" fill="var(--color-neutral-400)"/><circle cx="4" cy="9" r="1" fill="var(--color-neutral-400)"/><circle cx="8" cy="9" r="1" fill="var(--color-neutral-400)"/></svg>
    </button>
  `;
}

function prayerRowHtml(p) {
  return `
    <div class="atlas-row" data-prayer-id="${p.id}">
      ${prayerDragHandleHtml(p.id)}
      <div style="flex:1; min-width:0;">
        <div class="item-title">${escapeHtml(p.title)}</div>
      </div>
      ${(() => {
        // Haken und Kreuz lagen 26 px gross direkt nebeneinander — zwei folgenreiche, nur als
        // Symbol beschriftete Aktionen in Daumenbreite. Beide haben jetzt 44 px Trefferflaeche
        // (sichtbar bleiben sie klein) und dazwischen liegt Abstand. Rueckgaengig gibt es fuer
        // beide schon.
        const abschluss = (p.type || "bitte") === "dank" ? "Gedankt" : "Erfüllt";
        return `
      <button class="btn btn-icon btn-ghost gebet-aktion" data-prayer-close="${p.id}"
              title="${abschluss}" aria-label="${escapeHtml(p.title)}: als ${abschluss} abschließen">${CHECK_ICON}</button>
      <button class="btn btn-icon btn-ghost gebet-aktion gebet-aktion-ablegen" data-prayer-irrelevant="${p.id}"
              title="Nicht mehr relevant" aria-label="${escapeHtml(p.title)}: als nicht mehr relevant ablegen">${CROSS_ICON}</button>`;
      })()}
    </div>
  `;
}

function renderPrayers() {
  const openPrayers = state.prayers.filter(p => p.status === "open");
  const bitte = openPrayers.filter(p => (p.type || "bitte") === "bitte");
  const dank = openPrayers.filter(p => (p.type || "bitte") === "dank");

  const bitteWrap = document.getElementById("prayerListBitte");
  bitteWrap.innerHTML = bitte.length ? bitte.map(prayerRowHtml).join("") : '<div class="empty-hint">Keine offenen Bitten.</div>';

  const dankWrap = document.getElementById("prayerListDank");
  dankWrap.innerHTML = dank.length ? dank.map(prayerRowHtml).join("") : '<div class="empty-hint">Kein Dank eingetragen.</div>';

  // Erhoerungen (abgeschlossene Bitten) und ausgesprochener Dank teilen sich die Bauform, aber
  // nicht die Liste — inhaltlich sind das zwei verschiedene Dinge.
  const archiveEntryHtml = (p, dateKey, textKey) => `
        <div class="prayer-archive-entry">
          <div class="item-meta">${p[dateKey] ? formatDatum(p[dateKey].slice(0, 10)) : ""}</div>
          <div class="item-title">${escapeHtml(p.title)}</div>
          ${p[textKey] ? `<div class="small-text">${escapeHtml(p[textKey])}</div>` : ""}
          ${(p.attachments || []).map(a => a.type.startsWith("image/")
            ? `<img class="prayer-attachment-img" src="${a.dataUrl}" alt="${escapeHtml(a.name)}">`
            : `<a class="prayer-attachment-file" href="${a.dataUrl}" download="${escapeHtml(a.name)}">${escapeHtml(a.name)}</a>`
          ).join("")}
        </div>`;
  const renderPrayerArchive = (elId, status, dateKey, textKey, leerText) => {
    const wrap = document.getElementById(elId);
    if (!wrap) return;
    const items = state.prayers
      .filter(p => p.status === status)
      .sort((a, b) => (b[dateKey] || "").localeCompare(a[dateKey] || ""));
    wrap.innerHTML = items.length
      ? items.map(p => archiveEntryHtml(p, dateKey, textKey)).join("")
      : `<div class="empty-hint">${leerText}</div>`;
  };
  renderPrayerArchive("prayerArchive", "fulfilled", "fulfilledAt", "fulfillmentText",
    "Noch keine Erhörungen festgehalten.");
  renderPrayerArchive("prayerThanksArchive", "thanked", "thankedAt", "thanksText",
    "Noch keinen Dank abgelegt.");

  const irrelevantWrap = document.getElementById("prayerIrrelevantList");
  const irrelevant = state.prayers
    .filter(p => p.status === "irrelevant")
    .sort((a, b) => (b.irrelevantAt || "").localeCompare(a.irrelevantAt || ""));
  irrelevantWrap.innerHTML = irrelevant.length
    ? irrelevant.map(p => `
        <div class="prayer-archive-entry">
          <div class="item-meta">${p.irrelevantAt ? formatDatum(p.irrelevantAt.slice(0, 10)) : ""}</div>
          <div class="item-title">${escapeHtml(p.title)}</div>
        </div>
      `).join("")
    : '<div class="empty-hint">Nichts als nicht mehr relevant markiert.</div>';
}

function savePrayerFromInline() {
  const input = document.getElementById("prayerInput");
  const title = input.value.trim();
  if (!title) { markiereFehlendesFeld(input, "Schreib kurz auf, worum es geht."); return; }
  state.prayers.push({ id: uid(), title, type: prayerAddType, createdAt: new Date().toISOString(), status: "open", deferredCount: 0 });
  saveData();
  input.value = "";
  quickAddVisible = false;
  document.getElementById("prayerAddCard").style.display = "none";
  renderAll();
}

// Schliesst ein Anliegen ab — bei einer Bitte als Erhoerung, bei einem Dank als ausgesprochener
// Dank. Beide halten Text und Anhang fest, aber in getrennten Feldern und getrennten Archiven.
function openPrayerCloseModal(prayerId) {
  const prayer = state.prayers.find(p => p.id === prayerId);
  if (!prayer) return;
  // Wird nur noch fuer Bitten geoeffnet (siehe Handler); die Verzweigung bleibt als Absicherung.
  const istDank = (prayer.type || "bitte") === "dank";
  openModal(`
    <h3>${istDank ? "Gedankt" : "Erfüllt"}: ${escapeHtml(prayer.title)}</h3>
    <div class="field">
      <label>${istDank ? "Wofür bist du dankbar?" : "Wie wurde es erfüllt?"}</label>
      <textarea id="mPrayerText" class="reflection-textarea" placeholder="${istDank ? "Was hat Gott getan?" : "Was ist passiert?"}"></textarea>
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
      if (istDank) {
        prayer.status = "thanked";
        prayer.thankedAt = new Date().toISOString();
        prayer.thanksText = text;
      } else {
        prayer.status = "fulfilled";
        prayer.fulfilledAt = new Date().toISOString();
        prayer.fulfillmentText = text;
      }
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
