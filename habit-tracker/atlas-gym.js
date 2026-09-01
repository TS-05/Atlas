// ============================================================
// Atlas — atlas-gym.js
// Gym: Saetze, Pausen, Auswertung, Hinzufuegen-Dialoge
//
// Teil von app.js, das auf 9 Dateien aufgeteilt wurde. Die Reihenfolge in index.html
// entspricht exakt der frueheren Reihenfolge in der einen Datei -- die Dateien teilen sich
// weiterhin einen Gueltigkeitsbereich, es sind bewusst KEINE Module. Dadurch aendert das
// Aufteilen am Verhalten nichts; nur Funktionen werden nicht mehr ueber Dateigrenzen hinweg
// vorgezogen, weshalb Code, der sofort laeuft, hinter seinen Funktionen stehen muss.
// ============================================================

// ---------- Gym ----------
// Trainingsplan 1:1 aus dem Vault (Tim/10_Persoenlich/Trainingsplan.md) -- inklusive der
// Superset-Bloecke und Pausenzeiten aus dem Abschnitt "Trainingsablauf", die vorher nur im
// Vault standen und in der App verlorengingen.
// ACHTUNG: die Uebungsnamen sind zugleich die Schluessel, unter denen protokolliert wird.
// Wer sie aendert, kappt die Historie dieser Uebung -- Reihenfolge und Gruppierung sind frei.
const GYM_PLAN = [
  { key: "oberA", label: "Oberkörper A", tag: "Mo", blocks: [
    { title: "Aufwärmen", note: "1–2 Sätze, leicht", exercises: [
      { n: "Überzüge (Aufwärmen)", r: "locker", s: 2 } ] },
    { title: "Superset 1", note: "3 Sätze je Übung", rest: 90, exercises: [
      { n: "Brustpresse", r: "8–12" }, { n: "Rudern breit/eng", r: "8–12" } ] },
    { title: "Superset 2", note: "3 Sätze je Übung", rest: 90, exercises: [
      { n: "Latziehen breit/eng", r: "8–12" }, { n: "Schulterdrücken", r: "8–12" } ] },
    { title: "Superset 3", note: "2–3 Sätze je Übung", rest: 90, exercises: [
      { n: "Butterfly", r: "10–15" }, { n: "Butterfly Reverse", r: "10–15" } ] },
    { title: "Solo", note: "3 Sätze", rest: 60, exercises: [
      { n: "Seitheben", r: "10–15" } ] },
    { title: "Superset 4", note: "3 Sätze je Übung", rest: 90, exercises: [
      { n: "Trizeps Pulldown", r: "10–15" }, { n: "Preacher/Hammercurls", r: "10–15" } ] }
  ] },
  { key: "unterA", label: "Unterkörper A", tag: "Di", blocks: [
    { title: "Solo", note: "3 Sätze · vorher aufwärmen", rest: 180, exercises: [
      { n: "Squat Maschine", r: "8–12" } ] },
    { title: "Superset 1", note: "3 Sätze je Übung", rest: 90, exercises: [
      { n: "Beinpresse", r: "8–12" }, { n: "Hamstrings", r: "10–15" } ] },
    { title: "Superset 2", note: "3 Sätze je Übung", rest: 90, exercises: [
      { n: "Beinstrecker", r: "10–15" }, { n: "Wadenheben", r: "10–15" } ] },
    { title: "Superset 3", note: "3 Sätze je Übung", rest: 90, exercises: [
      { n: "Abduktoren", r: "10–15" }, { n: "Adduktoren", r: "10–15" } ] },
    { title: "Solo", note: "2–3 Sätze", rest: 90, exercises: [
      { n: "Hyperextensions", r: "12–15" } ] },
    { title: "Solo", note: "2–3 Sätze je Seite", rest: 90, exercises: [
      { n: "Landmine/Cable Rotation", r: "12–15 je Seite" } ] }
  ] },
  { key: "oberB", label: "Oberkörper B", tag: "Do", blocks: [
    { title: "Superset 1", note: "3 Sätze je Übung", rest: 90, exercises: [
      { n: "Schrägbankdrücken", r: "8–12" }, { n: "Latzug eng/breit", r: "8–12" } ] },
    { title: "Superset 2", note: "3 Sätze je Übung", rest: 90, exercises: [
      { n: "Rudern eng/breit", r: "8–12" }, { n: "Schulterdrücken", r: "8–12" } ] },
    { title: "Superset 3", note: "2–3 Sätze je Übung", rest: 90, exercises: [
      { n: "Butterfly", r: "10–15" }, { n: "Butterfly Reverse", r: "10–15" } ] },
    { title: "Solo", note: "3 Sätze", rest: 60, exercises: [
      { n: "Seitheben", r: "10–15" } ] },
    { title: "Superset 4", note: "3 Sätze je Übung", rest: 90, exercises: [
      { n: "Trizeps Pulldown", r: "10–15" }, { n: "Preacher/Hammercurls", r: "10–15" } ] }
  ] },
  { key: "unterB", label: "Unterkörper B", tag: "Fr", blocks: [
    { title: "Solo", note: "3 Sätze · vorher aufwärmen", rest: 180, exercises: [
      { n: "Kreuzheben", r: "8–12" } ] },
    { title: "Superset 1", note: "3 Sätze je Übung", rest: 90, exercises: [
      { n: "Beinpresse", r: "8–12" }, { n: "Hamstrings", r: "10–15" } ] },
    { title: "Superset 2", note: "3 Sätze je Übung", rest: 90, exercises: [
      { n: "Beinstrecker", r: "10–15" }, { n: "Wadenheben", r: "10–15" } ] },
    { title: "Superset 3", note: "3 Sätze je Übung", rest: 90, exercises: [
      { n: "Abduktoren", r: "10–15" }, { n: "Adduktoren", r: "10–15" } ] },
    { title: "Solo", note: "2–3 Sätze je Seite", rest: 90, exercises: [
      { n: "Landmine/Cablerotations", r: "12–15 je Seite" } ] }
  ] }
];
// Flache Uebungsliste je Tag -- der Rest des Codes (Zaehlungen, Auswertung) arbeitet damit weiter.
GYM_PLAN.forEach(d => { d.exercises = d.blocks.flatMap(b => b.exercises); });

const GYM_DAY_BY_WEEKDAY = { 1: "oberA", 2: "unterA", 4: "oberB", 5: "unterB" };
const gymTodayKey = GYM_DAY_BY_WEEKDAY[new Date().getDay()] || null;
let gymSelectedDay = gymTodayKey || "oberA";

function gymNum(v) {
  return (Math.round(v * 10) / 10).toLocaleString("de-DE");
}
function gymDateLabel(key) {
  return dateFromKey(key).toLocaleDateString("de-DE", { weekday: "short" }) + ", " + formatDatum(key);
}
function gymSessions() {
  state.gymSessions = state.gymSessions || [];
  return state.gymSessions;
}
function gymSetHasData(x) {
  return !!(x && (x.weight != null || x.reps != null));
}
// Eine Einheit zaehlt erst, wenn wirklich etwas drinsteht -- sonst wuerde jedes versehentliche
// Antippen eines Feldes als Training in der Auswertung landen.
function gymSessionHasData(s) {
  return Object.values(s.entries || {}).some(sets => (sets || []).some(gymSetHasData));
}
// "Erledigt" heisst: mindestens ein Satz mit Gewicht steht drin.
function gymExerciseDone(session, name) {
  const sets = (session && session.entries && session.entries[name]) || [];
  return sets.some(x => x && x.weight != null);
}

// Die letzte Einheit VOR einem Stichtag, in der diese Uebung protokolliert wurde.
// beforeDate wird bewusst immer gesetzt (heute): sonst zeigt "zuletzt" die Werte, die man
// gerade selbst eintippt, statt der Referenz vom letzten Training.
function gymLastEntry(exerciseName, beforeDate) {
  const found = gymSessions()
    .filter(s => s.entries && (s.entries[exerciseName] || []).some(gymSetHasData))
    .filter(s => !beforeDate || s.date < beforeDate)
    .sort((a, b) => b.date.localeCompare(a.date));
  return found.length ? { date: found[0].date, sets: found[0].entries[exerciseName] } : null;
}

// Bestes Satzgewicht einer Einheit -- Basis fuer die Staerke-Kurve.
function gymSessionTopWeight(session) {
  let top = 0;
  Object.values(session.entries || {}).forEach(sets => (sets || []).forEach(x => {
    if (x && x.weight > top) top = x.weight;
  }));
  return top;
}
// Gesamtvolumen (Gewicht x Wiederholungen) -- das ueblichste Mass fuer Trainingsfortschritt,
// weil es Gewicht UND Wiederholungen beruecksichtigt statt nur den schwersten Satz.
function gymSessionVolume(session) {
  return Object.values(session.entries || {}).flat()
    .reduce((sum, x) => sum + ((x && x.weight && x.reps) ? x.weight * x.reps : 0), 0);
}

function gymTrendHtml(current, lastWeight) {
  if (current == null || lastWeight == null) return "";
  if (current > lastWeight) return ' <i class="gym-trend up">▲</i>';
  if (current < lastWeight) return ' <i class="gym-trend down">▼</i>';
  return ' <i class="gym-trend same">=</i>';
}

// ---------- Pausen-Uhr ----------
// Der Plan schreibt je Block eine Pause vor (60/90/180 Sek.). Die stand bisher nur im Vault.
// Zustand liegt in einer Variablen, nicht im DOM: renderGym() baut den Kopf neu auf, die
// laufende Uhr soll das ueberleben.
// Laufende Pausen stehen in state.gymRests (siehe gymRests()); es gibt keine Einzelpause mehr.
let gymRestInterval = null;

// ---------- Signal am Pausenende ----------
// Vorher war die Vibration das einzige Signal — und die Vibration-API kennt iOS Safari nicht.
// Auf dem iPhone lief die Pause damit vollkommen lautlos aus, also genau das, wofuer der Timer da
// ist, passierte nicht. Jetzt zusaetzlich ein kurzer Ton ueber die Web-Audio-API. Der
// AudioContext wird beim Antippen des Pause-Knopfes erzeugt bzw. fortgesetzt — iOS laesst Ton
// nur aus einer echten Nutzergeste heraus zu, und der Knopfdruck ist eine.
// Feste Satzpause, unabhaengig von der Blockpause des Supersatzes (die bleibt, wie sie war,
// und hat ihre eigene, kuerzere Dauer aus dem Trainingsplan).
const GYM_SATZ_PAUSE = 180;

let gymAudioCtx = null;
function gymAudioAufwecken() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!gymAudioCtx) gymAudioCtx = new Ctx();
    if (gymAudioCtx.state === "suspended") gymAudioCtx.resume();
  } catch (e) { /* ohne Ton weiterarbeiten, der Timer bleibt sichtbar */ }
}
function gymPiep() {
  if (!gymAudioCtx || gymAudioCtx.state !== "running") return;
  // Zwei kurze Toene statt eines langen — im Studio mit Musik im Ohr besser herauszuhoeren.
  [0, 0.28].forEach(versatz => {
    const t = gymAudioCtx.currentTime + versatz;
    const osz = gymAudioCtx.createOscillator();
    const lautstaerke = gymAudioCtx.createGain();
    osz.type = "sine";
    osz.frequency.setValueAtTime(880, t);
    lautstaerke.gain.setValueAtTime(0.0001, t);
    lautstaerke.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
    lautstaerke.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    osz.connect(lautstaerke).connect(gymAudioCtx.destination);
    osz.start(t);
    osz.stop(t + 0.24);
  });
}

// Mehrere Pausen laufen gleichzeitig, jede mit eigenem Schluessel: der Uebungsname bei der
// Satzpause, der Blocktitel bei der Supersatz-Pause. Ein zweiter Start mit demselben Schluessel
// ersetzt die laufende Pause, statt eine zweite danebenzustellen.
// Angezeigt wird jede Pause dort, wo sie hingehoert (in ihrer Karte); die Kopfzeile fasst
// zusaetzlich alle laufenden zusammen.
function gymRests() {
  state.gymRests = state.gymRests || [];
  return state.gymRests;
}
function gymRestFor(key) {
  return gymRests().find(r => r.key === key) || null;
}
function gymRestLeftOf(rest) {
  return rest ? Math.max(0, Math.ceil((rest.endsAt - Date.now()) / 1000)) : 0;
}

function gymStartRest(seconds, label, key) {
  gymAudioAufwecken();
  const schluessel = key || label;
  const liste = gymRests().filter(r => r.key !== schluessel);
  liste.push({ key: schluessel, label, total: seconds, endsAt: Date.now() + seconds * 1000 });
  state.gymRests = liste;
  saveData();
  gymTickerSicherstellen();
  gymRenderTimers();
}
function gymStopRest(key) {
  // Ohne Schluessel: alle stoppen (z. B. beim Wechsel des Trainingstags).
  state.gymRests = key ? gymRests().filter(r => r.key !== key) : [];
  saveData();
  gymTickerSicherstellen();
  gymRenderTimers();
}
function gymTickerSicherstellen() {
  const laufen = gymRests().length > 0;
  if (laufen && !gymRestInterval) gymRestInterval = setInterval(gymRestTick, 250);
  if (!laufen && gymRestInterval) { clearInterval(gymRestInterval); gymRestInterval = null; }
}
function gymRestTick() {
  const jetzt = Date.now();
  const abgelaufen = gymRests().filter(r => jetzt >= r.endsAt);
  if (abgelaufen.length) {
    gymPiep();
    if (navigator.vibrate) navigator.vibrate([180, 90, 180]);
    state.gymRests = gymRests().filter(r => jetzt < r.endsAt);
    saveData();
    gymTickerSicherstellen();
  }
  gymRenderTimers();
}

// Aktualisiert nur die Zifferblaetter, nicht die ganze Ansicht — sonst wuerde viermal pro
// Sekunde das Eingabefeld unter dem Daumen neu aufgebaut.
function gymRenderTimers() {
  document.querySelectorAll("[data-gym-timer-key]").forEach(el => {
    const rest = gymRestFor(el.dataset.gymTimerKey);
    const zeit = el.querySelector(".gym-timer-zeit");
    if (rest) {
      el.classList.add("laeuft");
      if (zeit) zeit.textContent = gymMMSS(gymRestLeftOf(rest));
      el.style.setProperty("--p", (rest.total ? gymRestLeftOf(rest) / rest.total * 100 : 0) + "%");
    } else {
      el.classList.remove("laeuft");
      if (zeit) zeit.textContent = el.dataset.gymTimerIdle || "";
      el.style.setProperty("--p", "0%");
    }
  });
  gymRenderHeader();
}

// Beim Start der App noch laufende Pausen fortsetzen; abgelaufene stillschweigend verwerfen,
// statt verspaetet zu piepen.
function gymPauseFortsetzen() {
  const jetzt = Date.now();
  state.gymRests = (state.gymRests || []).filter(r => r && r.endsAt > jetzt);
  // Altbestand aus der Einzel-Pausen-Zeit uebernehmen.
  if (state.gymRest && state.gymRest.endsAt > jetzt) {
    state.gymRests.push({ key: state.gymRest.label, label: state.gymRest.label,
                          total: state.gymRest.total, endsAt: state.gymRest.endsAt });
  }
  delete state.gymRest;
  saveData();
  gymTickerSicherstellen();
}
function gymMMSS(sec) {
  return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
}

// ---------- Rendering ----------
// Kopfzeile bleibt beim Scrollen stehen: waehrend man bei Uebung 8 tippt, sieht man weiterhin,
// wie weit die Einheit ist und wie lange die Pause noch laeuft.
function gymRenderHeader() {
  const el = document.getElementById("gymHeader");
  if (!el) return;
  const day = GYM_PLAN.find(d => d.key === gymSelectedDay) || GYM_PLAN[0];
  const session = gymSessions().find(s => s.date === todayStr() && s.dayKey === day.key);
  const total = day.exercises.length;
  const done = day.exercises.filter(ex => gymExerciseDone(session, ex.n)).length;
  const vol = session ? gymSessionVolume(session) : 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  // Die Kopfzeile fasst alle laufenden Pausen zusammen — zusaetzlich zu der Anzeige in der
  // jeweiligen Karte, damit man beim Scrollen nicht danach suchen muss.
  const laufende = gymRests().slice().sort((a, b) => a.endsAt - b.endsAt);
  const timerHtml = laufende.length
    ? `<div class="gym-timer-liste">${laufende.map(r => `
         <button class="gym-timer running" data-gym-rest-stop="${escapeHtml(r.key)}"
                 style="--p:${r.total ? (gymRestLeftOf(r) / r.total) * 100 : 0}%">
           <span class="gym-timer-ring"></span>
           <b>${gymMMSS(gymRestLeftOf(r))}</b><span>${escapeHtml(r.label)}</span>
         </button>`).join("")}</div>`
    : `<span class="gym-timer idle">Keine Pause l\u00e4uft</span>`;

  el.innerHTML = `
    <div class="gym-header-row">
      <div class="gym-header-title"><span class="gym-day-tag">${day.tag}</span>${escapeHtml(day.label)}</div>
      <div class="gym-header-count">${done}<span> / ${total}</span></div>
    </div>
    <div class="gym-header-bar"><i style="transform:scaleX(${(pct / 100).toFixed(4)})"></i></div>
    <div class="gym-header-foot">
      <span>${vol ? gymNum(vol) + " kg Volumen" : "noch nichts erfasst"}</span>
      ${timerHtml}
    </div>`;
}

// Kopfkarte: was war das letzte Training dieses Typs? Gibt beim Reinkommen sofort den Bezugspunkt.
function gymLastSessionCardHtml(day, todayKey) {
  const prev = gymSessions()
    .filter(s => s.dayKey === day.key && s.date < todayKey && gymSessionHasData(s))
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!prev) {
    return `<div class="gym-lastcard empty">Noch kein ${escapeHtml(day.label)}-Training protokolliert — die Werte von heute sind dann beim nächsten Mal die Referenz.</div>`;
  }
  const exCount = Object.values(prev.entries || {}).filter(sets => (sets || []).some(gymSetHasData)).length;
  const top = gymSessionTopWeight(prev), vol = gymSessionVolume(prev);
  return `<div class="gym-lastcard">
      <div class="gym-lastcard-head">Letztes ${escapeHtml(day.label)} · ${gymDateLabel(prev.date)}</div>
      <div class="gym-lastcard-stats">
        <span><b>${exCount}</b> Übungen</span>
        <span><b>${top ? gymNum(top) + " kg" : "–"}</b> schwerster Satz</span>
        <span><b>${vol ? gymNum(vol) + " kg" : "–"}</b> Volumen</span>
      </div>
    </div>`;
}

function gymExerciseHtml(ex, session, today) {
  const setCount = ex.s || 3;
  const sets = (session && session.entries && session.entries[ex.n]) || [];
  const last = gymLastEntry(ex.n, today);
  const lastSets = last ? last.sets : [];
  const done = gymExerciseDone(session, ex.n);

  const headCells = [], lastCells = [], inputCells = [];
  for (let i = 0; i < setCount; i++) {
    const v = sets[i] || {};
    const lv = lastSets[i] || {};
    const hasLast = lv.weight != null;
    headCells.push(`<div class="gym-col-head">Satz ${i + 1}</div>`);
    lastCells.push(`<div class="gym-last-cell${hasLast ? "" : " none"}">${
      hasLast ? `${gymNum(lv.weight)} kg × ${lv.reps != null ? lv.reps : "?"}${gymTrendHtml(v.weight, lv.weight)}` : "–"
    }</div>`);
    inputCells.push(`<div class="gym-set">
      <input type="number" inputmode="decimal" step="0.5" min="0" aria-label="${escapeHtml(ex.n)} Satz ${i + 1} Gewicht"
             placeholder="${hasLast ? gymNum(lv.weight) : "kg"}"
             data-gym-w="${escapeHtml(ex.n)}" data-gym-set="${i}" value="${v.weight != null ? v.weight : ""}">
      <span>×</span>
      <input type="number" inputmode="numeric" step="1" min="0" aria-label="${escapeHtml(ex.n)} Satz ${i + 1} Wiederholungen"
             placeholder="${hasLast && lv.reps != null ? lv.reps : "Wdh"}"
             data-gym-r="${escapeHtml(ex.n)}" data-gym-set="${i}" value="${v.reps != null ? v.reps : ""}">
    </div>`);
  }

  return `<div class="gym-ex${done ? " done" : ""}" data-gym-ex="${escapeHtml(ex.n)}">
    <div class="gym-ex-head">
      <span class="gym-ex-mark" aria-hidden="true"></span>
      <div class="item-title">${escapeHtml(ex.n)}</div>
      <span class="gym-target">${escapeHtml(ex.r)}</span>
    </div>
    <div class="gym-lastline">${last ? "Letztes Mal · " + gymDateLabel(last.date) : "Noch keine Werte"}</div>
    <div class="gym-grid" style="grid-template-columns:repeat(${setCount},1fr);">
      ${headCells.join("")}${lastCells.join("")}${inputCells.join("")}
    </div>
    <button class="gym-satz-pause" data-gym-satz-pause="${escapeHtml(ex.n)}"
            data-gym-timer-key="${escapeHtml(ex.n)}" data-gym-timer-idle="3 Min. Pause">
      <span class="gym-timer-zeit">3 Min. Pause</span>
    </button>
  </div>`;
}

function renderGym() {
  const picker = document.getElementById("gymDayPicker");
  if (!picker) return;
  const today = todayStr();
  const logged = new Set(gymSessions().filter(s => s.date === today && gymSessionHasData(s)).map(s => s.dayKey));
  picker.innerHTML = GYM_PLAN.map(d =>
    `<button class="gym-day${d.key === gymSelectedDay ? " active" : ""}${logged.has(d.key) ? " logged" : ""}${d.key === gymTodayKey ? " today" : ""}" data-gym-day="${d.key}">
       <span class="gym-day-tag">${d.tag}</span>${escapeHtml(d.label)}</button>`).join("");

  const day = GYM_PLAN.find(d => d.key === gymSelectedDay) || GYM_PLAN[0];
  const session = gymSessions().find(s => s.date === today && s.dayKey === day.key);

  const lastCard = document.getElementById("gymLastSession");
  if (lastCard) lastCard.innerHTML = gymLastSessionCardHtml(day, today);

  const wrap = document.getElementById("gymSession");
  if (wrap) {
    wrap.innerHTML = day.blocks.map(b => {
      const pair = b.exercises.length > 1;
      const restBtn = b.rest
        ? `<button class="gym-rest-btn" data-gym-rest="${b.rest}" data-gym-rest-label="${escapeHtml(b.title)}"
                   data-gym-timer-key="${escapeHtml(b.title)}" data-gym-timer-idle="${b.rest >= 60 ? gymMMSS(b.rest) : b.rest + "s"}">
             <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true"><circle cx="6" cy="6.6" r="4.6" stroke="currentColor" stroke-width="1.3"/><path d="M6 4.4V6.8L7.5 7.6M4.4 1.2h3.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
             <span class="gym-timer-zeit">${b.rest >= 60 ? gymMMSS(b.rest) : b.rest + "s"}</span>
           </button>`
        : "";
      return `<section class="gym-block${pair ? " superset" : ""}">
        <div class="gym-block-head">
          <div class="gym-block-title">${escapeHtml(b.title)}${pair ? '<i class="gym-block-link">⇄</i>' : ""}</div>
          ${restBtn}
        </div>
        <div class="gym-block-note">${escapeHtml(b.note)}</div>
        <div class="gym-block-body">${b.exercises.map(ex => gymExerciseHtml(ex, session, today)).join("")}</div>
      </section>`;
    }).join("");
  }
  gymRenderHeader();
}

document.addEventListener("click", e => {
  const dayBtn = e.target.closest("[data-gym-day]");
  if (dayBtn) { gymSelectedDay = dayBtn.dataset.gymDay; renderGym(); return; }
  const satzPauseBtn = e.target.closest("[data-gym-satz-pause]");
  if (satzPauseBtn) {
    const k = satzPauseBtn.dataset.gymSatzPause;
    // Laeuft die Pause dieser Uebung schon, beendet ein Tipp sie — sonst startet er sie.
    if (gymRestFor(k)) gymStopRest(k); else gymStartRest(GYM_SATZ_PAUSE, k, k);
    return;
  }
  const restBtn = e.target.closest("[data-gym-rest]");
  if (restBtn) {
    const k = restBtn.dataset.gymRestLabel || "Pause";
    if (gymRestFor(k)) gymStopRest(k); else gymStartRest(parseInt(restBtn.dataset.gymRest, 10), k, k);
    return;
  }
  const stopBtn = e.target.closest("[data-gym-rest-stop]");
  if (stopBtn) { gymStopRest(stopBtn.dataset.gymRestStop || null); return; }
});

// Werte direkt beim Tippen sichern -- kein separater Speichern-Knopf, nichts geht verloren.
document.addEventListener("input", e => {
  const wEl = e.target.closest("[data-gym-w]"), rEl = e.target.closest("[data-gym-r]");
  if (!wEl && !rEl) return;
  const el = wEl || rEl;
  const exercise = el.dataset.gymW || el.dataset.gymR;
  const idx = parseInt(el.dataset.gymSet, 10);
  const today = todayStr();
  let session = gymSessions().find(s => s.date === today && s.dayKey === gymSelectedDay);
  if (!session) { session = { id: uid(), date: today, dayKey: gymSelectedDay, entries: {} }; state.gymSessions.push(session); }
  session.entries[exercise] = session.entries[exercise] || [];
  session.entries[exercise][idx] = session.entries[exercise][idx] || {};
  const val = el.value === "" ? null : parseFloat(el.value);
  // Zustand VOR der Eingabe merken, um den Uebergang "unvollstaendig -> vollstaendig" zu erkennen.
  const satz = session.entries[exercise][idx];
  const warVollstaendig = satz.weight != null && satz.reps != null;
  if (wEl) satz.weight = (val != null && !isNaN(val)) ? val : null;
  else satz.reps = (val != null && !isNaN(val)) ? val : null;
  const istVollstaendig = satz.weight != null && satz.reps != null;
  // Entprellt statt bei jedem Zeichen: mit Foto-Anhaengen im Zustand bedeutete jeder Tastendruck
  // mehrere Megabyte Serialisierung, mitten im Training. Verstecken/Verlassen der Seite schreibt
  // ohnehin hart durch.
  saveDataDebounced();
  // Der Satz ist gerade fertig geworden: Pause laeuft von selbst an, damit man mitten im Training
  // nicht daran denken muss. Beim blossen Nachbessern eines schon vollstaendigen Satzes passiert
  // nichts. Laeuft bereits eine Pause, wird sie nicht ueberschrieben.
  // Je Uebung eine eigene Pause: dass anderswo schon eine laeuft, darf diese hier nicht verhindern.
  if (!warVollstaendig && istVollstaendig && !gymRestFor(exercise)) {
    gymStartRest(GYM_SATZ_PAUSE, `${exercise} \u00b7 Satz ${idx + 1}`, exercise);
  }
  // Bewusst kein volles renderGym(): das wuerde den Fokus aus dem Feld reissen, in das gerade
  // getippt wird. Nur Trendpfeil, Erledigt-Zustand und Kopfzeile auffrischen.
  gymRefreshLive(el, exercise, idx, session);
});

function gymRefreshLive(el, exercise, idx, session) {
  gymRenderHeader();
  const card = el.closest(".gym-ex");
  if (card) card.classList.toggle("done", gymExerciseDone(session, exercise));

  const grid = el.closest(".gym-grid");
  const cell = grid ? grid.querySelectorAll(".gym-last-cell")[idx] : null;
  if (!cell) return;
  const last = gymLastEntry(exercise, todayStr());
  const lv = (last && last.sets[idx]) || {};
  if (lv.weight == null) return;
  const cur = session.entries[exercise][idx];
  cell.innerHTML = `${gymNum(lv.weight)} kg × ${lv.reps != null ? lv.reps : "?"}${gymTrendHtml(cur.weight, lv.weight)}`;
}

// ---------- Gym-Auswertung: Gewichts-, Staerke- und Volumenverlauf ----------
// Linien-Diagramme als schlankes Inline-SVG (keine Chart-Bibliothek -- die App bleibt
// abhaengigkeitsfrei und offline-tauglich).
function gymLineChart(points, unit, opts = {}) {
  if (points.length < 2) {
    return '<div class="empty-hint">Noch zu wenig Daten — ab zwei Einträgen entsteht hier eine Kurve.</div>';
  }
  const W = 320, H = 128, L = 6, R = 6, T = 14, B = 20;
  const vals = points.map(p => p.v);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }            // flache Linie mittig statt am Rand
  const pad = (max - min) * 0.14;                     // Luft, damit Punkte die Kante nicht beruehren
  const lo = min - pad, hi = max + pad, span = hi - lo;
  const x = i => L + (i / (points.length - 1)) * (W - L - R);
  const y = v => T + (1 - (v - lo) / span) * (H - T - B);

  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${H - B} L${x(0).toFixed(1)},${H - B} Z`;
  const grid = [0, 0.5, 1].map(f => {
    const gy = (T + f * (H - T - B)).toFixed(1);
    return `<line x1="${L}" y1="${gy}" x2="${W - R}" y2="${gy}" stroke="var(--color-divider)" stroke-width="1"/>`;
  }).join("");
  const dots = points.map((p, i) => {
    const isLast = i === points.length - 1;
    return `<circle cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="${isLast ? 4 : 2.2}"
      fill="${isLast ? "var(--color-accent-200)" : "var(--color-accent-400)"}"${isLast ? ' stroke="var(--color-bg)" stroke-width="1.5"' : ""}
      ><title>${p.d} · ${gymNum(p.v)}${unit}</title></circle>`;
  }).join("");

  const first = points[0], last = points[points.length - 1];
  const delta = last.v - first.v;
  const good = opts.lowerIsBetter ? delta < 0 : delta > 0;
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "±";
  const gid = "gymGrad" + Math.random().toString(36).slice(2, 8);
  const dm = d => `${d.slice(8, 10)}.${d.slice(5, 7)}.`;

  return `<div class="gym-chart-top">
      <div class="gym-chart-value">${gymNum(last.v)}<span>${unit}</span></div>
      <div class="gym-chart-delta ${delta === 0 ? "flat" : good ? "up" : "down"}">${sign}${gymNum(Math.abs(delta))}${unit}
        <span>seit ${dm(first.d)}</span></div>
    </div>
    <svg viewBox="0 0 ${W} ${H}" class="gym-chart-svg" preserveAspectRatio="none">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--color-accent-500)" stop-opacity="0.32"/>
        <stop offset="1" stop-color="var(--color-accent-500)" stop-opacity="0"/>
      </linearGradient></defs>
      ${grid}
      <path d="${area}" fill="url(#${gid})"/>
      <path d="${line}" fill="none" stroke="var(--color-accent-300)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}
    </svg>
    <div class="gym-chart-axis"><span>${dm(first.d)}</span><span>${points.length} Einträge</span><span>${dm(last.d)}</span></div>`;
}

// Uebungen mit mindestens zwei protokollierten Einheiten -- nur die ergeben eine Kurve.
function gymExercisesWithHistory() {
  const map = new Map();
  gymSessions().forEach(s => Object.entries(s.entries || {}).forEach(([ex, sets]) => {
    const best = (sets || []).reduce((m, x) => (x && x.weight > m ? x.weight : m), 0);
    if (!best) return;
    if (!map.has(ex)) map.set(ex, []);
    map.get(ex).push({ d: s.date, v: best });
  }));
  map.forEach(arr => arr.sort((a, b) => a.d.localeCompare(b.d)));
  return map;
}

let gymStrengthExercise = null;

function renderGymAnalysis() {
  const statsEl = document.getElementById("gymStats");
  if (!statsEl) return;
  const sessions = gymSessions().filter(gymSessionHasData).sort((a, b) => a.date.localeCompare(b.date));
  const last30 = sessions.filter(s => s.date >= todayStr(-30)).length;

  const wHabit = state.habits.find(h => h.type === "weight");
  const weightPoints = wHabit
    ? Object.entries(wHabit.history || {})
        .filter(([, v]) => typeof v === "number" && v > 0)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-40)
        .map(([d, v]) => ({ d, v }))
    : [];

  const volPoints = sessions.filter(s => gymSessionVolume(s) > 0).slice(-30)
    .map(s => ({ d: s.date, v: Math.round(gymSessionVolume(s)) }));
  const lastVol = sessions.length ? gymSessionVolume(sessions[sessions.length - 1]) : 0;
  const bestTop = sessions.reduce((m, s) => Math.max(m, gymSessionTopWeight(s)), 0);

  statsEl.innerHTML = [
    { num: sessions.length, label: "Einheiten gesamt" },
    { num: last30, label: "Einheiten (30 Tage)" },
    { num: weightPoints.length ? gymNum(weightPoints[weightPoints.length - 1].v) + " kg" : "–", label: "Körpergewicht" },
    { num: bestTop ? gymNum(bestTop) + " kg" : "–", label: "Schwerster Satz" },
    { num: lastVol ? gymNum(Math.round(lastVol)) + " kg" : "–", label: "Volumen letzte Einheit" },
    { num: sessions.length ? gymDateLabel(sessions[sessions.length - 1].date) : "–", label: "Letztes Training" }
  ].map(b => `<div class="stat-box"><div class="stat-num">${b.num}</div><div class="stat-label">${b.label}</div></div>`).join("");

  const setChart = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  setChart("gymWeightChart", gymLineChart(weightPoints, " kg"));
  setChart("gymVolumeChart", gymLineChart(volPoints, " kg"));

  // Staerke je Uebung: aussagekraeftiger als "schwerster Satz der Einheit", weil der je nach
  // Trainingstag (Beinpresse vs. Seitheben) voellig unterschiedlich hoch ausfaellt.
  const hist = gymExercisesWithHistory();
  const usable = [...hist.entries()].filter(([, arr]) => arr.length >= 2)
    .sort((a, b) => a[0].localeCompare(b[0], "de"));
  const picker = document.getElementById("gymStrengthPicker");
  const chartEl = document.getElementById("gymStrengthChart");
  if (!picker || !chartEl) { /* nichts zu tun */ }
  else if (!usable.length) {
    picker.parentElement.style.display = "none";
    chartEl.innerHTML = '<div class="empty-hint">Sobald eine Übung an zwei Tagen protokolliert ist, entsteht hier ihre Kurve.</div>';
  } else {
    picker.parentElement.style.display = "";
    if (!usable.some(([ex]) => ex === gymStrengthExercise)) gymStrengthExercise = usable[0][0];
    picker.innerHTML = usable.map(([ex, arr]) =>
      `<option value="${escapeHtml(ex)}"${ex === gymStrengthExercise ? " selected" : ""}>${escapeHtml(ex)} (${arr.length})</option>`).join("");
    chartEl.innerHTML = gymLineChart(hist.get(gymStrengthExercise).slice(-30), " kg");
  }

  const best = {};
  gymSessions().forEach(s => Object.entries(s.entries || {}).forEach(([ex, sets]) => {
    (sets || []).forEach(x => { if (x && x.weight && (!best[ex] || x.weight > best[ex].w)) best[ex] = { w: x.weight, r: x.reps, d: s.date }; });
  }));
  const rows = Object.entries(best).sort((a, b) => b[1].w - a[1].w);
  document.getElementById("gymTopLifts").innerHTML = rows.length
    ? rows.map(([ex, b]) => `
        <div class="gym-best-row">
          <div class="gym-best-name">${escapeHtml(ex)}</div>
          <div class="gym-best-date">${b.d.slice(8, 10)}.${b.d.slice(5, 7)}.</div>
          <div class="gym-best-val">${gymNum(b.w)} kg × ${b.r || "?"}</div>
        </div>`).join("")
    : '<div class="empty-hint">Noch keine Werte protokolliert.</div>';
}

document.addEventListener("change", e => {
  if (e.target.id === "gymStrengthPicker") {
    gymStrengthExercise = e.target.value;
    renderGymAnalysis();
  }
});


// ---------- Add buttons ----------
document.getElementById("addTaskBtn").addEventListener("click", () => openTaskModal());
document.getElementById("addHabitBtn").addEventListener("click", () => openHabitModal());
document.getElementById("addExamBtn").addEventListener("click", () => openExamModal());
document.getElementById("addAccountBtn").addEventListener("click", () => openAccountModal());
// editProject gesetzt = umbenennen. Vorher liessen sich Projekte nur anlegen und loeschen —
// ein Tippfehler im Titel war nur ueber Loeschen und Neuanlegen zu beheben, wobei die Notizen
// verloren gingen.
function openProjectModal(editProject = null) {
  const isEdit = !!editProject;
  openModal(`
    <h3>${isEdit ? "Projekt umbenennen" : "Projekt hinzufügen"}</h3>
    <div class="field">
      <label>Titel</label>
      <input type="text" id="mProjectTitle" placeholder="z.B. Seminararbeit, Buch schreiben" value="${isEdit ? escapeHtml(editProject.title) : ""}">
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Speichern</button>
    </div>
  `, body => {
    body.querySelector("#mProjectTitle").focus();
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    body.querySelector("#mSave").addEventListener("click", () => {
      const feld = body.querySelector("#mProjectTitle");
      const title = feld.value.trim();
      if (!title) { markiereFehlendesFeld(feld, "Ohne Titel lässt sich das Projekt nicht speichern."); return; }
      if (isEdit) editProject.title = title;
      else state.projects.push({ id: uid(), title, notes: "" });
      saveData(); closeModal(); renderAll();
    });
  });
}
// Der dauerhaft sichtbare "+ Projekt hinzufügen"-Knopf ist weg: auf Projekte loest das Plus in
// der Kopfzeile dieselbe Aktion aus, und zwei verschieden gestaltete Einstiege 400 px auseinander
// fuer dieselbe Sache waren einer zu viel. Angelegt wird ueber die Kopfzeile oder, solange noch
// nichts da ist, ueber den Knopf im Leerzustand (Ereignis-Delegation, weil der neu gerendert wird).
document.addEventListener("click", e => {
  if (e.target.closest("[data-leer-projekt]")) openProjectModal();
});
document.getElementById("addExpenseBtn").addEventListener("click", () => openExpenseModal());
document.getElementById("addCategoryBtn").addEventListener("click", () => openCategoryModal());
document.getElementById("addSavingsGoalBtn").addEventListener("click", () => openSavingsGoalModal());
document.getElementById("addIncomeSourceBtn").addEventListener("click", () => openIncomeSourceModal());
function abweichungEintragen() {
  const input = document.getElementById("deviationInput");
  if (!input.value.trim()) {
    // Vorher wurde das Feld auch bei leerer Eingabe kommentarlos geleert und nichts gespeichert.
    markiereFehlendesFeld(input, "Schreib kurz auf, was anders lief.");
    return;
  }
  addDeviation(input.value);
  input.value = "";
}
document.getElementById("addDeviationBtn").addEventListener("click", abweichungEintragen);
document.getElementById("deviationInput").addEventListener("keydown", e => {
  if (e.key === "Enter") { e.preventDefault(); abweichungEintragen(); }
});
document.getElementById("enableNotifBtn").addEventListener("click", () => {
  if (!("Notification" in window)) return;
  Notification.requestPermission().then(() => {
    updateNotifPermissionUI();
    checkMissedRoutineStreaks();
  });
});

function openTaskModal(defaultNodeId, source = "todo") {
  const node = defaultNodeId ? nodeById(defaultNodeId) : null;
  const isLernfeld = source === "category";
  openModal(`
    <h3>${isLernfeld ? "Lernfeldaufgabe in " + escapeHtml(node ? node.title : "Bereich") : "Aufgabe hinzufügen"}</h3>
    ${isLernfeld ? `
    <div class="field">
      <label>Aufgabentyp</label>
      <select id="mTaskLernType">
        ${LERNTYPEN.map(l => `<option value="${l.id}">${escapeHtml(l.label)}</option>`).join("")}
      </select>
    </div>` : ""}
    <div class="field">
      <label>${isLernfeld ? "Konkret: was genau?" : "Titel"}</label>
      <input type="text" id="mTaskTitle" placeholder="${isLernfeld ? "z.B. 3Blue1Brown Neuronen-Video" : "z.B. Bericht abschicken"}">
    </div>
    ${isLernfeld ? "" : `
    <div class="field">
      <label>Beschreibung (optional)</label>
      <textarea id="mTaskNotes" rows="3" placeholder="Details, Kontext, nächste Schritte…"></textarea>
    </div>`}
    <div class="field">
      <label>Fälligkeitsdatum (optional)</label>
      <input type="date" id="mTaskDate" value="${isLernfeld ? "" : todayStr()}">
    </div>
    <div class="field">
      <label>Uhrzeit (optional)</label>
      <input type="time" id="mTaskTime">
    </div>
    ${isLernfeld ? "" : `
    <div class="field">
      <label>Geschätzter Aufwand</label>
      <input type="range" class="aufwand-regler" id="mTaskSize" min="1" max="${EFFORT_LEVELS.length}" step="1" value="2">
      <div class="aufwand-skala"><span>5 Min.</span><span>Wochen</span></div>
      <div class="aufwand-anzeige" id="mTaskSizeLabel"></div>
    </div>
    <div class="field">
      <label>Priorität (0 = keine, 5 = höchste)</label>
      <select id="mTaskPriority">
        <option value="0">keine</option>
        <option value="1">1 – sehr niedrig</option>
        <option value="2">2 – niedrig</option>
        <option value="3">3 – mittel</option>
        <option value="4">4 – hoch</option>
        <option value="5">5 – höchste</option>
      </select>
    </div>
    <div class="field">
      <label>Zielbereich (optional, ordnet die Aufgabe zusätzlich dort ein)</label>
      <select id="mTaskCategory">
        <option value="">– keiner –</option>
        ${rootNodeOptionsHtml()}
      </select>
    </div>`}
    <div class="modal-actions">
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Speichern</button>
    </div>
  `, body => {
    body.querySelector("#mTaskTitle").focus();
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    // Ohne mitlaufende Beschriftung waere der Regler eine Zahl ohne Bedeutung.
    const groesseRegler = body.querySelector("#mTaskSize");
    const groesseLabel = body.querySelector("#mTaskSizeLabel");
    if (groesseRegler && groesseLabel) {
      const zeigeStufe = () => {
        const info = effortLevelInfo(parseInt(groesseRegler.value, 10));
        groesseLabel.innerHTML = `<b>${escapeHtml(info.label)}</b> \u00b7 ${escapeHtml(info.time)}`;
      };
      groesseRegler.addEventListener("input", zeigeStufe);
      zeigeStufe();
    }
    body.querySelector("#mSave").addEventListener("click", () => {
      const titelFeld = body.querySelector("#mTaskTitle");
      const title = titelFeld.value.trim();
      // Vorher: stilles return — der Knopf tat scheinbar nichts. Jetzt sagt das Feld, was fehlt.
      if (!title) { markiereFehlendesFeld(titelFeld, "Ohne Titel lässt sich die Aufgabe nicht speichern."); return; }
      const dueDate = body.querySelector("#mTaskDate").value || null;
      const dueTime = body.querySelector("#mTaskTime").value || null;
      if (isLernfeld) {
        const learnType = body.querySelector("#mTaskLernType").value;
        state.tasks.push({ id: uid(), title, nodeId: defaultNodeId, dueDate, dueTime, done: false, completedAt: null, createdAt: new Date().toISOString(), size: 2, priority: 0, source, learnType });
        saveData();
        closeModal();
        renderAll();
        return;
      }
      const notes = body.querySelector("#mTaskNotes").value.trim();
      const size = parseInt(body.querySelector("#mTaskSize").value, 10) || 1;
      const priority = parseInt(body.querySelector("#mTaskPriority").value, 10) || 0;
      const categorySelect = body.querySelector("#mTaskCategory");
      const nodeId = categorySelect ? categorySelect.value || null : null;
      state.tasks.push({ id: uid(), title, notes, nodeId, dueDate, dueTime, done: false, completedAt: null, createdAt: new Date().toISOString(), size, priority, source });
      saveData();
      closeModal();
      renderAll();
    });
  });
}

function openHabitModal(forceRoutine = false, editHabit = null) {
  const isEdit = !!editHabit;
  openModal(`
    <h3>${isEdit ? "Gewohnheit bearbeiten" : (forceRoutine ? "Routine-Schritt hinzufügen" : "Gewohnheit hinzufügen")}</h3>
    <div class="field">
      <label>Titel</label>
      <input type="text" id="mHabitTitle" placeholder="z.B. 30 Min lesen" value="${isEdit ? escapeHtml(editHabit.title) : ""}">
    </div>
    <div class="field">
      <label>Minimalversion (optional)</label>
      <input type="text" id="mHabitMinimalTitle" placeholder="z.B. 10 Min lesen" value="${isEdit ? escapeHtml(editHabit.minimalTitle || "") : ""}">
      <p class="hint" style="margin-top:4px;">Optionale Beschriftung für die niedrigere Latte, z. B. „10 Min lesen“. Der Regler steht ohnehin in jeder Zeile — dieser Text ändert nur, wie die Zeile heißt, wenn er rechts steht.</p>
    </div>
    <div class="checkbox-row" style="margin-bottom:12px;">
      <input type="checkbox" id="mHabitNoMinimal" ${isEdit && editHabit.noMinimal ? "checked" : ""}>
      <label for="mHabitNoMinimal">Ganz oder gar nicht — keinen Regler anzeigen</label>
    </div>
    <div class="checkbox-row">
      <input type="checkbox" id="mHabitRoutine" ${(isEdit ? editHabit.routineOrder != null : forceRoutine) ? "checked" : ""}>
      <label for="mHabitRoutine">Teil der festen Tagesroutine (Reihenfolge im Heute-Tab)</label>
    </div>
    <div class="checkbox-row">
      <input type="checkbox" id="mHabitAutoDone" ${isEdit && editHabit.autoDone ? "checked" : ""}>
      <label for="mHabitAutoDone">Standardmäßig erledigt (jeden Tag vorab angehakt)</label>
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
      <input type="number" id="mHabitIntervalDays" min="2" value="${isEdit ? (editHabit.intervalDays || 3) : 3}">
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
      <input type="number" id="mHabitEveryNWeeks" min="1" value="${isEdit ? (editHabit.everyNWeeks || 2) : 2}">
    </div>
    <div class="field">
      <label>Zielbereich (optional)</label>
      <select id="mHabitCategory">
        <option value="">– keiner –</option>
        ${nodeOptionsHtml()}
      </select>
    </div>
    <div class="field">
      <label>Punkte</label>
      <input type="number" id="mHabitPoints" min="1" step="1" value="${isEdit ? (editHabit.points ?? 1) : 1}">
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
    if (isEdit) freqSelect.value = editHabit.frequency;
    const catSelect = body.querySelector("#mHabitCategory");
    if (isEdit && editHabit.nodeId) catSelect.value = editHabit.nodeId;
    intervalField.style.display = freqSelect.value === "interval" ? "" : "none";
    weeklyField.style.display = freqSelect.value === "weekly-on" ? "" : "none";
    if (isEdit) body.querySelector("#mHabitWeekday").value = String(editHabit.weekday ?? 0);
    freqSelect.addEventListener("change", () => {
      intervalField.style.display = freqSelect.value === "interval" ? "" : "none";
      weeklyField.style.display = freqSelect.value === "weekly-on" ? "" : "none";
    });
    body.querySelector("#mSave").addEventListener("click", () => {
      const titelFeld = body.querySelector("#mHabitTitle");
      const title = titelFeld.value.trim();
      if (!title) { markiereFehlendesFeld(titelFeld, "Ohne Titel lässt sich die Gewohnheit nicht speichern."); return; }
      const nodeId = catSelect.value || null;
      const frequency = freqSelect.value;
      const extra = {};
      if (frequency === "interval") extra.intervalDays = parseInt(body.querySelector("#mHabitIntervalDays").value, 10) || 1;
      if (frequency === "weekly-on") {
        extra.weekday = parseInt(body.querySelector("#mHabitWeekday").value, 10);
        extra.everyNWeeks = parseInt(body.querySelector("#mHabitEveryNWeeks").value, 10) || 1;
      }
      const isRoutine = body.querySelector("#mHabitRoutine").checked;
      const points = parseInt(body.querySelector("#mHabitPoints").value, 10) || 1;
      const minimalTitle = body.querySelector("#mHabitMinimalTitle").value.trim();
      const noMinimal = body.querySelector("#mHabitNoMinimal").checked;
      const autoDone = body.querySelector("#mHabitAutoDone").checked;
      if (isEdit) {
        editHabit.title = title;
        // Der Minimaltext ist nur die Beschriftung; der Regler steht ohnehin in jeder Zeile.
        // Deshalb bleiben gesetzte Reglerstellungen erhalten, wenn der Text entfernt wird.
        if (minimalTitle) editHabit.minimalTitle = minimalTitle;
        else delete editHabit.minimalTitle;
        // Ohne Regler auch die gesetzten Stufen aufraeumen, sonst blieben Tage auf "minimal"
        // stehen, die nicht mehr umschaltbar sind.
        if (noMinimal) { editHabit.noMinimal = true; editHabit.levelByDate = {}; }
        else delete editHabit.noMinimal;
        editHabit.nodeId = nodeId;
        editHabit.frequency = frequency;
        delete editHabit.intervalDays; delete editHabit.weekday; delete editHabit.everyNWeeks;
        Object.assign(editHabit, extra);
        editHabit.points = points;
        if (autoDone) editHabit.autoDone = true; else { delete editHabit.autoDone; delete editHabit.autoDoneDate; }
        if (isRoutine && editHabit.routineOrder == null) {
          editHabit.routineOrder = state.habits.reduce((max, h) => Math.max(max, h.routineOrder ?? -1), -1) + 1;
        } else if (!isRoutine) {
          editHabit.routineOrder = null;
        }
      } else {
        const routineOrder = isRoutine ? state.habits.reduce((max, h) => Math.max(max, h.routineOrder ?? -1), -1) + 1 : null;
        state.habits.push({ id: uid(), title, nodeId, history: {}, levelByDate: {}, createdAt: new Date().toISOString(), frequency, ...extra, routineOrder, type: "check", points, ...(minimalTitle ? { minimalTitle } : {}), ...(noMinimal ? { noMinimal: true } : {}), ...(autoDone ? { autoDone: true } : {}) });
      }
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
      const feld = body.querySelector("#mSubjectTitle");
      const title = feld.value.trim();
      if (!title) { markiereFehlendesFeld(feld, "Ohne Namen lässt sich das Fach nicht speichern."); return; }
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
      <input type="date" id="mExamDate" value="${todayStr()}" min="${todayStr()}">
      <p class="hint" style="margin-top:4px;">Nur kommende Termine — vergangene werden nicht aufbewahrt.</p>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Speichern</button>
    </div>
  `, body => {
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    body.querySelector("#mSave").addEventListener("click", () => {
      const subjectId = body.querySelector("#mExamSubject").value;
      const datumsFeld = body.querySelector("#mExamDate");
      const date = datumsFeld.value;
      if (!date) { markiereFehlendesFeld(datumsFeld, "Ohne Datum gibt es nichts herunterzuzählen."); return; }
      if (date < todayStr()) { markiereFehlendesFeld(datumsFeld, "Der Termin liegt in der Vergangenheit."); return; }
      if (!subjectId) return;
      state.exams.push({ id: uid(), subjectId, date });
      saveData();
      closeModal();
      renderAll();
    });
  });
}

function examCountdownLabel(dateKey) {
  const daysUntil = Math.round((dateFromKey(dateKey) - dateFromKey(todayStr())) / 86400000);
  if (daysUntil === 0) return "heute";
  if (daysUntil === 1) return "morgen";
  if (daysUntil === 7) return "in 1 Woche";
  if (daysUntil > 1) return `in ${daysUntil} Tagen`;
  return "vorbei";   // kann nur zwischen Mitternacht und dem naechsten App-Start auftreten
}

function renderPlanning() {
  const examsWrap = document.getElementById("examsList");
  if (examsWrap) {
    // Naechster Termin oben, je weiter weg desto weiter unten. Vergangene tauchen hier nicht mehr
    // auf — sie werden beim Start entfernt, dieser Filter faengt nur den Tageswechsel bei
    // geoeffneter App ab.
    const heuteKey = todayStr();
    const sorted = state.exams.filter(e => e.date >= heuteKey).sort((a, b) => a.date.localeCompare(b.date));
    examsWrap.innerHTML = sorted.length
      ? sorted.map(e => {
          const subject = state.subjects.find(s => s.id === e.subjectId);
          const daysUntil = Math.round((dateFromKey(e.date) - dateFromKey(todayStr())) / 86400000);
          const naechste = e === sorted[0];
          return `
            <div class="atlas-row">
              <div style="flex:1; min-width:0;">
                <div class="item-title">${subject ? escapeHtml(subject.title) : "Fach gelöscht"}</div>
                <div class="item-meta">${e.date}</div>
              </div>
              <span class="atlas-chip${naechste ? " chip-next-exam" : ""}"${naechste ? "" : ' style="background:var(--color-neutral-800); color:var(--color-neutral-300);"'}>${examCountdownLabel(e.date)}</span>
              <button class="btn btn-icon btn-ghost" data-del-exam="${e.id}" aria-label="Löschen"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 1.5L11.5 11.5M11.5 1.5L1.5 11.5" stroke="var(--color-neutral-500)" stroke-width="1.4" stroke-linecap="round"/></svg></button>
            </div>
          `;
        }).join("")
      : '<div class="empty-hint">Noch keine Klassenarbeiten eingetragen.</div>';
  }
}
