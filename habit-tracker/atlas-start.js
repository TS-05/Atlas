// ============================================================
// Atlas — atlas-start.js
// Wochenexport, Start, ruhende Blase, Homemenue-Navigation
//
// Teil von app.js, das auf 9 Dateien aufgeteilt wurde. Die Reihenfolge in index.html
// entspricht exakt der frueheren Reihenfolge in der einen Datei -- die Dateien teilen sich
// weiterhin einen Gueltigkeitsbereich, es sind bewusst KEINE Module. Dadurch aendert das
// Aufteilen am Verhalten nichts; nur Funktionen werden nicht mehr ueber Dateigrenzen hinweg
// vorgezogen, weshalb Code, der sofort laeuft, hinter seinen Funktionen stehen muss.
// ============================================================

// ---------- Vollständiger Export (Obsidian-kompatibles Markdown, für Vault & Chat-Analyse) ----------
function exportWeekReview() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  const fmt = d => localDateKey(d);
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
    let doneCount = 0, scheduledCount = 0, minimalCount = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      if (!isScheduledToday(h, d)) continue;
      scheduledCount++;
      const wert = h.history[fmt(d)];
      if (wert) { doneCount++; if (wert === "minimal") minimalCount++; }
    }
    const streak = computeStreak(h);
    // Ohne diesen Zusatz sähe eine Woche auf Minimalstufe aus wie eine ideale.
    const minimalHinweis = minimalCount ? ` · davon ${minimalCount} auf Minimalstufe` : "";
    md += `- **${h.title}**: ${doneCount}/${scheduledCount} Tage · Serie: ${streak}${minimalHinweis}\n`;
  });

  md += `\n## ToDos\n`;
  const todoTasksAll = state.tasks.filter(t => (t.source || "todo") !== "category");
  // Vorher standen hier die Zahlen über alle Aufgaben seit Anlage der App — in einem
  // *Wochen*rückblick eine irreführende Bezugsgroesse.
  const inDerWoche = t => t.completedAt && localDateKey(new Date(t.completedAt)) >= fmt(start)
                                        && localDateKey(new Date(t.completedAt)) <= fmt(end);
  const wochenErledigt = todoTasksAll.filter(t => t.done && inDerWoche(t));
  const onTimeCount = wochenErledigt.filter(isOnTime).length;
  const nochOffen = todoTasksAll.filter(t => !t.done);
  const inArbeit = nochOffen.filter(t => t.inProgress).length;
  md += `- Diese Woche erledigt: ${wochenErledigt.length}\n`;
  md += `- Davon pünktlich: ${onTimeCount}/${wochenErledigt.length || 0}\n`;
  md += `- Noch offen: ${nochOffen.length}${inArbeit ? ` (davon ${inArbeit} in Arbeit)` : ""}\n`;
  todoTasksAll
    .slice()
    .sort((a, b) => (a.dueDate || "9999-99-99").localeCompare(b.dueDate || "9999-99-99"))
    .forEach(t => {
      md += `  - [${t.done ? "x" : (t.inProgress ? "~" : " ")}] ${t.title}${t.inProgress ? " (in Arbeit)" : ""}${t.dueDate ? " (fällig " + t.dueDate + ")" : ""}\n`;
    });

  md += `\n## Zielbereiche (Roadmap)\n`;
  // Vorher nur die oberste Ebene ' + MID + ' die eigentliche Struktur (Themen, Pfade, Schritte)
  // fehlte damit komplett. Jetzt der ganze Baum mit Einrueckung, inklusive der Aufgaben je Knoten.
  const zielBaum = (parentId, tiefe, gesehen) => {
    childNodes(parentId).forEach(node => {
      if (gesehen.has(node.id)) return;
      gesehen.add(node.id);
      const einzug = "  ".repeat(tiefe);
      const prio = node.priority ? " (Priorität)" : "";
      const nPct = nodeProgressPct(node);
      md += `${einzug}- **${node.title}**${prio}: ${nPct === null ? "noch nichts geplant" : nPct + "%"}\n`;
      categoryTasksForNode(node.id).forEach(t => {
        md += `${einzug}  - [${t.done ? "x" : (t.inProgress ? "~" : " ")}] ${t.title}\n`;
      });
      zielBaum(node.id, tiefe + 1, gesehen);
    });
  };
  zielBaum(null, 0, new Set());

  md += `\n## Langzeit-Auswertung (letzte ${longTermDays} Tage)\n`;
  const longTermHabitStats = state.habits
    .map(h => ({ habit: h, ...habitStatsWindow(h, longTermDays) }))
    .filter(s => s.total > 0)
    .sort((a, b) => b.rate - a.rate);
  longTermHabitStats.forEach(s => {
    md += `- **${s.habit.title}**: ${Math.round(s.rate * 100)}% (${s.done}/${s.total} fällige Tage)${s.minimal ? `, davon ${s.minimal} auf Minimalstufe` : ""}${s.punkteRate !== null && Math.round(s.punkteRate * 100) !== Math.round(s.rate * 100) ? ` · ${Math.round(s.punkteRate * 100)}% der Punkte` : ""}\n`;
  });
  const weekdayStats = weekdayDifficulty(longTermDays).filter(w => w.total > 0);
  if (weekdayStats.length) {
    const hardest = weekdayStats.reduce((a, b) => (b.rate < a.rate ? b : a));
    md += `- Schwierigster Wochentag: **${hardest.day}** (${Math.round(hardest.rate * 100)}% Erledigungsquote)\n`;
  }

  // ---------- Arbeitsschichten ----------
  const kommendeSchichten = (state.workShifts || []).filter(w => !w.date || w.date >= fmt(start));
  if (kommendeSchichten.length) {
    md += `\n## Arbeitsschichten\n`;
    kommendeSchichten.slice().sort((x, y) => (x.date || '').localeCompare(y.date || '')).forEach(w => {
      md += `- ${w.date || "ohne Datum"}${w.from ? " " + w.from : ""}${w.to ? "-" + w.to : ""}${w.title ? " · " + w.title : ""}\n`;
    });
  }

  // ---------- Analyse-Kennzahlen ----------
  // Stand bis hierher versehentlich INNERHALB des Klassenarbeiten-Blocks: ohne eingetragene
  // Klassenarbeit fehlten Kennzahlen UND Arbeitsschichten ersatzlos im Wochenrueckblick, ohne
  // jeden Hinweis. Beide gehoeren auf die oberste Ebene, die Klassenarbeiten in ihren eigenen Block.
  md += `\n## Kennzahlen\n`;
  const alleErledigt = state.tasks.filter(t => t.done && t.completedAt);
  const alleOnTime = alleErledigt.filter(isOnTime).length;
  if (alleErledigt.length) {
    md += `- Pünktlichkeit gesamt: ${alleOnTime}/${alleErledigt.length} (${Math.round(alleOnTime / alleErledigt.length * 100)}%)\n`;
  }
  const tagesProzent = dayCompletionPct(new Date());
  md += `- Tagesroutine heute: ${tagesProzent === null ? "nichts fällig" : tagesProzent + "%"}\n`;
  const woche7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const p = dayCompletionPct(d);
    woche7.push(`${localDateKey(d)}: ${p === null ? "-" : p + "%"}`);
  }
  md += `- Letzte 7 Tage: ${woche7.join(" · ")}\n`;
  md += `- Gebete: ${state.prayers.filter(x => x.status === "open").length} offen, ${state.prayers.filter(x => x.status === "fulfilled").length} erhört, ${state.prayers.filter(x => x.status === "thanked").length} gedankt\n`;

  // ---------- Klassenarbeiten ----------
  if (state.exams.length) {
    md += `\n## Klassenarbeiten\n`;
    state.exams.slice().sort((x, y) => x.date.localeCompare(y.date)).forEach(ex => {
      const fach = state.subjects.find(f => f.id === ex.subjectId);
      md += `- ${ex.date}: **${fach ? fach.title : "Fach gelöscht"}** (${examCountdownLabel(ex.date)})\n`;
    });
  }

  // ---------- Projekte ----------
  md += `\n## Projekte\n`;
  if (state.projects.length) {
    state.projects.forEach(pr => {
      md += `\n### ${pr.title}\n`;
      md += (pr.notes && pr.notes.trim()) ? `${pr.notes.trim()}\n` : `_Keine Notizen._\n`;
    });
  } else {
    md += `_Keine Projekte angelegt._\n`;
  }

  // ---------- Gebete ----------
  md += `\n## Gebete\n`;
  const gebetGruppen = [
    ["Offene Bitten", state.prayers.filter(x => x.status === "open" && (x.type || "bitte") === "bitte"), null, null],
    ["Offener Dank", state.prayers.filter(x => x.status === "open" && x.type === "dank"), null, null],
    ["Erhörungen", state.prayers.filter(x => x.status === "fulfilled"), "fulfilledAt", "fulfillmentText"],
    ["Gedankt", state.prayers.filter(x => x.status === "thanked"), "thankedAt", "thanksText"],
    ["Nicht mehr relevant", state.prayers.filter(x => x.status === "irrelevant"), "irrelevantAt", null]
  ];
  gebetGruppen.forEach(([gTitel, gListe, gDatum, gText]) => {
    if (!gListe.length) return;
    md += `\n### ${gTitel}\n`;
    gListe.forEach(x => {
      const datum = gDatum && x[gDatum] ? localDateKey(new Date(x[gDatum])) + ": " : "";
      const zusatz = gText && x[gText] ? ` · ${x[gText]}` : "";
      const anh = (x.attachments || []).length ? ` [${x.attachments.length} Anhang]` : "";
      md += `- ${datum}${x.title}${zusatz}${anh}\n`;
    });
  });
  if (!state.prayers.length) md += `_Keine Anliegen eingetragen._\n`;

  // ---------- Finanzen ----------
  md += `\n## Finanzen\n`;
  const fmKey = financeMonthKey();
  const fmAusgaben = state.financeExpenses.filter(x => x.date.slice(0, 7) === fmKey);
  const fmSumme = fmAusgaben.reduce((sum, x) => sum + x.amount, 0);
  const fmEinkommen = totalMonthlyIncome();
  const fmVermoegen = state.financeAccounts.reduce((sum, x) => sum + (x.balance || 0), 0);
  md += `- Monat: ${financeMonthLabel()}\n`;
  md += `- Einkommen: ${formatEuro(fmEinkommen)}\n`;
  md += `- Ausgaben diesen Monat: ${formatEuro(fmSumme)} in ${fmAusgaben.length} Buchungen\n`;
  // Ausdruecklich benannt: die Quote kennt nur die erfassten Ausgaben, nicht alle tatsaechlichen.
  if (fmEinkommen > 0) md += `- Sparquote (bezogen auf die erfassten Ausgaben): ${Math.round((fmEinkommen - fmSumme) / fmEinkommen * 100)}%\n`;
  md += `- Vermögen gesamt: ${formatEuro(fmVermoegen)}\n`;
  if (state.financeAccounts.length) {
    md += `\n### Konten\n`;
    state.financeAccounts.forEach(k => { md += `- ${k.title}${k.isEmergencyFund ? " (Notgroschen)" : ""}: ${formatEuro(k.balance || 0)}\n`; });
  }
  if (state.financeCategories.length) {
    md += `\n### Budget je Kategorie\n`;
    state.financeCategories.forEach(c => {
      const aus = fmAusgaben.filter(x => x.categoryId === c.id).reduce((sum, x) => sum + x.amount, 0);
      md += `- ${c.title}: ${formatEuro(aus)}${c.limit ? " von " + formatEuro(c.limit) : " (kein Limit)"}\n`;
    });
  }
  if (state.savingsGoals.length) {
    md += `\n### Sparziele\n`;
    state.savingsGoals.forEach(z => {
      const proz = z.target ? " (" + Math.round((z.current || 0) / z.target * 100) + "%)" : "";
      md += `- ${z.title}: ${formatEuro(z.current || 0)} von ${formatEuro(z.target || 0)}${proz}${z.dueDate ? " · bis " + z.dueDate : ""}\n`;
    });
  }
  if (fmAusgaben.length) {
    md += `\n### Buchungen diesen Monat\n`;
    fmAusgaben.slice().sort((x, y) => y.date.localeCompare(x.date)).forEach(x => {
      const c = state.financeCategories.find(k => k.id === x.categoryId);
      md += `- ${x.date} ${formatEuro(x.amount)} · ${c ? c.title : "ohne Kategorie"}${x.note ? " · " + x.note : ""}\n`;
    });
  }

  // ---------- Gym ----------
  md += `\n## Gym\n`;
  const einheiten = gymSessions().filter(gymSessionHasData);
  const letzte30 = einheiten.filter(x => x.date >= fmt(new Date(Date.now() - 30 * 86400000)));
  md += `- Einheiten gesamt: ${einheiten.length}\n`;
  md += `- Davon letzte 30 Tage: ${letzte30.length}\n`;
  if (einheiten.length) {
    const bestJeUebung = {};
    einheiten.forEach(sess => Object.entries(sess.entries || {}).forEach(([name, saetze]) => {
      (saetze || []).forEach(satz => {
        if (satz && satz.weight && (!bestJeUebung[name] || satz.weight > bestJeUebung[name].weight)) {
          bestJeUebung[name] = { weight: satz.weight, reps: satz.reps, date: sess.date };
        }
      });
    }));
    const besten = Object.entries(bestJeUebung).sort((x, y) => y[1].weight - x[1].weight);
    if (besten.length) {
      md += `\n### Bestleistungen\n`;
      besten.forEach(([name, b]) => { md += `- ${name}: ${gymNum(b.weight)} kg · ${b.reps != null ? b.reps : "?"} Wdh. (${b.date})\n`; });
    }
    md += `\n### Letzte Einheiten\n`;
    einheiten.slice().sort((x, y) => y.date.localeCompare(x.date)).slice(0, 8).forEach(sess => {
      md += `- ${sess.date} (${sess.dayKey}): Top ${gymNum(gymSessionTopWeight(sess))} kg · Volumen ${gymNum(gymSessionVolume(sess))} kg\n`;
    });
  }
  // Vollstaendiger Zustand inklusive Anhangsinhalte — auf ausdruecklichen Wunsch wird nichts
  // weggelassen. Fotos an erhoerten Gebeten stecken als Base64 im State und koennen die Datei
  // deutlich vergroessern; die Bestaetigung am Ende nennt deshalb die tatsaechliche Groesse.
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
  const kb = Math.round(md.length / 1024);
  showToast(`Wochenrückblick gespeichert — ${kb} KB`);
}

// ---------- Init ----------
gymPauseFortsetzen();
renderAll();
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // iOS kann die PWA im Hintergrund jederzeit beenden — hier ist der letzte sichere Moment.
    commitActiveFreeText(); flushPendingSave();
  } else {
    renderAll();
  }
});
window.addEventListener("pagehide", () => { commitActiveFreeText(); flushPendingSave(); });
window.addEventListener("blur", () => { commitActiveFreeText(); flushPendingSave(); });

// Der Globus laedt erst, wenn der Ladebildschirm weg ist. Vorher hing er mit loading="eager" und
// gesetztem src am Start und teilte sich die Leitung mit app.js, dem Stylesheet und den Masken --
// sichtbar ist er zu dem Zeitpunkt ohnehin nicht, er liegt hinter dem Ladebildschirm. Der Pfad
// steht als data-src in index.html.
let globusGeladen = false;
function globusLaden() {
  if (globusGeladen) return;
  globusGeladen = true;
  const mv = document.getElementById("globeModel");
  if (!mv) return;
  // Reduzierte Bewegung: die Dauerrotation ist der einzige Effekt der App, den CSS nicht
  // abschalten kann -- model-viewer dreht selbst. Also das Attribut wegnehmen und auf spaetere
  // Aenderungen der Systemeinstellung hoeren.
  const ruhig = matchMedia("(prefers-reduced-motion: reduce)");
  const rotationSetzen = () => {
    if (ruhig.matches) mv.removeAttribute("auto-rotate");
    else mv.setAttribute("auto-rotate", "");
  };
  rotationSetzen();
  ruhig.addEventListener("change", rotationSetzen);
  if (mv.dataset.src) mv.setAttribute("src", mv.dataset.src);
}

// Ladebildschirm: endet, sobald die Seite wirklich geladen ist -- vorher lief er als feste
// 3-Sekunden-Sequenz und zeigte einen Fortschritt an, den er nicht gemessen hat. Die Untergrenze
// verhindert, dass er nur aufblitzt; die Obergrenze ist das Sicherheitsnetz und entspricht der
// alten festen Dauer, laenger wird es also in keinem Fall.
// Der Globus faengt an zu laden, sobald die Oberflaeche steht -- nicht mehr erst, wenn der
// Ladebildschirm weg ist. Die urspruengliche Sorge war, er wuerde beim Kaltstart mit app.js und
// dem Stylesheet um die Leitung streiten; an dieser Stelle sind die aber laengst geladen, app.js
// laeuft am Ende des Body. Wartete der Ladebildschirm dagegen nicht auf ihn, sah man ihm beim
// Ankommen zu: erst fehlte der Globus, dann stand der Fortschrittsbalken von model-viewer als
// Streifen im Ring, dann war er da.
globusLaden();

const splashEl = document.getElementById("splashScreen");
if (splashEl) {
  const MIN_MS = 700;
  // Obergrenze grosszuegiger als vorher (3 s): sie greift nur, wenn der Globus beim allerersten
  // Start ueber eine langsame Verbindung kommt. Danach liegt er im Cache und ist sofort da.
  const MAX_MS = 6000;
  const start = performance.now();
  const balken = splashEl.querySelector(".splash-bar-fill");
  const globus = document.getElementById("globeModel");
  let ausgeblendet = false;

  // ---------- Der Ladebalken ----------
  // Er zeigt echten Fortschritt, keine abgespielte Sequenz. Zwei Anteile, gewichtet nach dem,
  // was sie tatsaechlich wiegen: alles ausser dem Globus (app.js, Stylesheet, model-viewer,
  // Ringmasken, Splash-Bild) sind zusammen rund 1,9 MB, der Globus allein 2,4 MB.
  const GEWICHT_SEITE = 0.4;
  const GEWICHT_GLOBUS = 0.6;
  let seiteWert = document.readyState === "complete" ? 1 : 0;
  let globusWert = (globus && globus.loaded) ? 1 : 0;

  function zeichne() {
    if (!balken) return;
    const echt = seiteWert * GEWICHT_SEITE + globusWert * GEWICHT_GLOBUS;
    // Der kleinere der beiden Werte. Dadurch zweierlei: der Balken laeuft IMMER sichtbar an,
    // auch wenn alles schon im Cache liegt und "echt" sofort 1 waere -- und er steht nie weiter,
    // als tatsaechlich geladen ist. Dauert es laenger, bleibt er eben stehen, wo er steht.
    const zeit = Math.min(1, (performance.now() - start) / MIN_MS);
    balken.style.setProperty("--fortschritt", (Math.min(echt, zeit) * 100).toFixed(1) + "%");
  }
  // Der Zeitanteil muss von selbst weiterlaufen, sonst stuende der Balken zwischen zwei
  // Ladeereignissen still.
  const takt = setInterval(zeichne, 60);
  zeichne();

  const ausblenden = () => {
    if (ausgeblendet) return;
    ausgeblendet = true;
    clearInterval(takt);
    // Zum Schluss ausdruecklich voll -- der Balken soll sein Ende zeigen, nicht bei 97 % abreissen.
    if (balken) balken.style.setProperty("--fortschritt", "100%");
    splashEl.classList.add("splash-hidden");
    // transitionend allein reicht nicht: laeuft der Uebergang nicht an (Tab im Hintergrund,
    // unterbrochene Animation), bliebe der Ladebildschirm fuer immer im DOM stehen.
    const wegRaeumen = () => splashEl.remove();
    splashEl.addEventListener("transitionend", wegRaeumen, { once: true });
    setTimeout(wegRaeumen, 1200);
  };

  const wennBereit = () => setTimeout(ausblenden, Math.max(0, MIN_MS - (performance.now() - start)));
  const seiteFertig = new Promise(fertig => {
    if (seiteWert === 1) return fertig();
    window.addEventListener("load", () => { seiteWert = 1; zeichne(); fertig(); }, { once: true });
  });
  // Auf den Globus warten heisst: der Ladebildschirm bleibt, bis wirklich alles steht. Ein Fehler
  // beim Laden zaehlt auch als fertig -- sonst haenge die App an einem Modell, das nie kommt.
  const globusFertig = new Promise(fertig => {
    if (!globus || globusWert === 1) return fertig();
    // model-viewer meldet seinen Ladefortschritt laufend -- das ist der genaue Teil des Balkens.
    globus.addEventListener("progress", e => {
      const p = e.detail && typeof e.detail.totalProgress === "number" ? e.detail.totalProgress : 0;
      globusWert = Math.max(globusWert, Math.min(1, p));
      zeichne();
    });
    const fertigMelden = () => { globusWert = 1; zeichne(); fertig(); };
    globus.addEventListener("load", fertigMelden, { once: true });
    globus.addEventListener("error", fertigMelden, { once: true });
  });
  Promise.all([seiteFertig, globusFertig]).then(wennBereit);
  setTimeout(ausblenden, MAX_MS);
}

// ---------- Navigations-Ring ----------
// Es ist immer DERSELBE Ring -- nur sein Mittelpunkt wandert. Ein Oeffnungsgrad p fuehrt alles:
//
//   p = 0.0  ANDEUTUNG   Mittelpunkt weit unter dem Bildschirm, nur ein Bogen mit kleinen
//                        Symbolen schaut ueber den unteren Rand.
//   p = 0.5  HALB        obere Ringhaelfte im Bild, fuenf Symbole in voller Groesse mit
//                        Beschriftung. Der Tab-Inhalt bleibt dahinter stehen -- man wechselt
//                        den Tab, ohne ins Hauptmenue zu muessen.
//   p = 1.0  HAUPTMENUE  Mittelpunkt auf dem Globus, voller Kreis, Globus-Menue sichtbar.
//
// "Einmal hochwischen" und "nochmal hochwischen" sind damit dieselbe Bewegung mit drei
// Rastpunkten: man kann in einem Zug durchziehen oder auf halbem Weg umkehren.
//
// Ausgewaehlt ist immer, was auf 12 Uhr unter der Kimme steht. Beim Loslassen rastet der Ring
// dorthin ein und oeffnet den Tab.
(() => {
  const homeMenu = document.getElementById("homeMenu");
  const ring     = document.getElementById("atlasRing");
  const grip     = document.getElementById("ringGrip");
  const kimme    = document.getElementById("ringKimme");
  const globeModel = document.getElementById("globeModel");
  const scrim    = document.getElementById("ringScrim");
  const stage    = homeMenu && homeMenu.querySelector(".globe-stage");
  if (!homeMenu || !ring || !grip || !stage) return;

  const slots = Array.from(ring.querySelectorAll(".ring-btn")).map(btn => ({
    btn,
    tab:   btn.dataset.tab,
    angle: parseFloat(btn.style.getPropertyValue("--angle")),
    lat:   parseFloat(btn.dataset.lat),
    lon:   parseFloat(btn.dataset.lon)
  }));
  if (!slots.length) return;

  const RUHIG = matchMedia("(prefers-reduced-motion: reduce)");

  let p = 1;        // Start: Hauptmenue, wie bisher
  let rot = 0;      // Drehung des Rings in Grad
  let R = 214;      // Ringradius, gemessen
  let cyAndeutung = 0, cyHalb = 0, cyHome = 0;

  // ---------- Messen ----------
  // Der Mittelpunkt im Hauptmenue wird an der Globus-Buehne abgenommen, nicht gerechnet: so
  // liegt der Ring immer genau um den Globus, egal wie die Buehne gerade skaliert.
  const messfuehler = document.createElement("div");
  messfuehler.style.cssText = "position:fixed;left:0;bottom:0;width:0;" +
    "height:env(safe-area-inset-bottom,0px);pointer-events:none;visibility:hidden;";
  document.body.appendChild(messfuehler);

  function messen() {
    const vh = window.innerHeight;
    R = Math.min(window.innerWidth * 0.35, 214);
    ring.style.setProperty("--R", R + "px");

    const sicher = messfuehler.getBoundingClientRect().height || 0;

    // ANDEUTUNG: die Oberkante des Symbolbands schaut PEEK px ueber den unteren Rand.
    const PEEK = 34;
    cyAndeutung = vh + sicher + R - PEEK;
    // HALB: Mittelpunkt knapp unter dem Rand -> genau die obere Haelfte im Bild, also fuenf
    // Symbole (das gewaehlte plus zwei je Seite). Tiefer waeren es nur drei, und dann sieht
    // man von den ANDEREN Tabs zu wenig -- worum es in diesem Zustand ja gerade geht.
    cyHalb = vh + R * 0.05;
    // HAUPTMENUE: Mitte des Globus.
    const r = stage.getBoundingClientRect();
    cyHome = r.height ? r.top + r.height / 2 : vh * 0.47;

    zeichnen();
  }

  // Stueckweise Interpolation ueber die drei Rastpunkte.
  function cyFuer(t) {
    if (t <= 0.5) return cyAndeutung + (cyHalb - cyAndeutung) * (t / 0.5);
    return cyHalb + (cyHome - cyHalb) * ((t - 0.5) / 0.5);
  }

  // ---------- Zeichnen ----------
  // Eine einzige Stelle, die den sichtbaren Zustand aus p und rot herstellt. Idempotent:
  // ein zweiter Aufruf repariert jeden Zwischenstand.
  function zeichnen() {
    const t = Math.max(0, Math.min(1, p));
    ring.style.setProperty("--cy", cyFuer(t).toFixed(1) + "px");
    ring.style.setProperty("--rot", rot.toFixed(2) + "deg");
    ring.style.setProperty("--p", t.toFixed(3));

    // Symbole wachsen von der Andeutung bis zum Halb-Zustand auf volle Groesse, danach bleiben
    // sie. Die Beschriftung kommt im selben Abschnitt dazu.
    const oeffnung = Math.min(1, t / 0.5);
    ring.style.setProperty("--sym-scale", (0.60 + 0.40 * oeffnung).toFixed(3));
    ring.style.setProperty("--label-op", (Math.max(0, oeffnung - 0.45) / 0.55).toFixed(3));
    ring.style.setProperty("--kimme-op", oeffnung.toFixed(3));

    grip.style.setProperty("--p", t.toFixed(3));
    // Der Greifer faengt nur in der Andeutung Zeiger ab -- sonst frisst er die Dreh-Geste.
    grip.classList.toggle("aus", t > 0.08);
    // ... und umgekehrt: solange nur die Andeutung steht, faengt der Ring selbst nichts ab.
    ring.classList.toggle("deko", t < 0.08);

    if (scrim) {
      scrim.style.setProperty("--p", t.toFixed(3));
      // Im fertigen Hauptmenue deckt das Homemenue ohnehin alles ab -- dann abschalten, statt
      // eine bildschirmfuellende Weichzeichnung dauerhaft mitlaufen zu lassen.
      scrim.style.setProperty("--scrim-on", t > 0.02 && t < 0.995 ? "1" : "0");
      scrim.classList.toggle("fangend", t > 0.06 && t < 0.94);
    }

    // Das Hauptmenue blendet in der zweiten Haelfte auf; bis dahin ist es ganz aus der
    // Treffererkennung genommen (visibility), sonst faengt der Globus dort Zeiger ab.
    const homeOp = Math.max(0, (t - 0.5) / 0.5);
    homeMenu.style.setProperty("--home-op", homeOp.toFixed(3));
    homeMenu.classList.toggle("aus", homeOp <= 0.001);
    // Der Globus liegt in der Ring-Ebene (ueber dem Glasband) und tritt mit dem Hauptmenue auf.
    ring.style.setProperty("--globe-op", homeOp.toFixed(3));
    ring.style.setProperty("--globe-pe", t > 0.92 ? "auto" : "none");

    markiereGewaehlten();
  }

  // ---------- Auswahl ----------
  function winkelAbstand(a, b) { return Math.abs(((a - b) % 360 + 540) % 360 - 180); }

  function nachstenSlotZu(rotWert) {
    let best = slots[0], bestD = 1e9;
    for (const s of slots) {
      const d = winkelAbstand(s.angle + rotWert, -90);
      if (d < bestD) { bestD = d; best = s; }
    }
    return best;
  }
  function gewaehlterSlot() { return nachstenSlotZu(rot); }

  // Die Rotation, bei der `slot` auf 12 Uhr steht -- und zwar die, die dem aktuellen Wert am
  // naechsten liegt, damit der Ring nicht den langen Weg ueber 360 Grad nimmt.
  function rotFuer(slot, nahBei) {
    const soll = -90 - slot.angle;
    const basis = nahBei == null ? rot : nahBei;
    return basis + (((soll - basis + 540) % 360) - 180);
  }

  let zuletztGewaehlt = null;
  function markiereGewaehlten() {
    const s = gewaehlterSlot();
    if (s === zuletztGewaehlt) return;
    zuletztGewaehlt = s;
    slots.forEach(x => x.btn.classList.toggle("gewaehlt", x === s));
    // Der Globus dreht live mit, sobald ein neues Symbol oben steht -- aber nur, wenn er
    // ueberhaupt sichtbar ist, sonst arbeitet er im Verborgenen gegen die Bildrate.
    if (globeModel && p > 0.55 && !isNaN(s.lat)) {
      globeModel.autoRotate = false;
      globeModel.cameraOrbit = `${s.lon}deg ${90 - s.lat}deg 105%`;
    }
  }

  // ---------- Federn ----------
  let zielP = p, zielRot = rot, laeuft = false;
  let vRot = 0;                                  // Winkelgeschwindigkeit, Grad je ms

  function federLauf() {
    laeuft = true;
    let letzte = performance.now();
    const schritt = jetzt => {
      const dt = Math.min(34, jetzt - letzte); letzte = jetzt;
      let fertig = true;

      if (Math.abs(zielP - p) > 0.0008) {
        p += (zielP - p) * (1 - Math.pow(0.0009, dt / 16)); fertig = false;
      } else p = zielP;

      const d = ((zielRot - rot + 540) % 360) - 180;
      if (Math.abs(d) > 0.06) {
        rot += d * (1 - Math.pow(0.0022, dt / 16)); fertig = false;
      } else rot = zielRot;

      zeichnen();
      if (fertig) { laeuft = false; return; }
      requestAnimationFrame(schritt);
    };
    requestAnimationFrame(schritt);
  }

  // SICHERHEITSNETZ. Die Feder haengt an requestAnimationFrame, und das steht still, solange die
  // Seite nicht gezeichnet wird (App weggewischt, Bildschirm aus, Seite im Hintergrund).
  // Gemessen: in einer verborgenen Ansicht kommt KEIN einziges Bild, waehrend Zeitgeber normal
  // weiterlaufen. Ohne Netz bliebe der Ring auf halbem Weg stehen -- halb offen, halb gedreht --
  // und die App waere bedienbar, aber falsch. Genau dieser Fehler hat die alte Wasserblase
  // zweimal erwischt. Zeitgeber laufen weiter, also setzt einer den Zielzustand hart.
  let netzTimer = null;
  function hartSetzen() {
    clearTimeout(netzTimer); netzTimer = null;
    p = zielP; rot = zielRot; laeuft = false;
    zeichnen();
  }
  function netzSpannen() {
    clearTimeout(netzTimer);
    netzTimer = setTimeout(() => {
      const offenP   = Math.abs(zielP - p) > 0.002;
      const offenRot = Math.abs(((zielRot - rot + 540) % 360) - 180) > 0.2;
      if (offenP || offenRot) hartSetzen();
    }, 700);
  }
  // Wird die Seite versteckt, ist ohnehin klar, dass keine Bilder mehr kommen.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") hartSetzen();
  });

  function setzeZiel(neuP, neuRot) {
    zielP = neuP;
    if (neuRot != null) zielRot = neuRot;
    if (RUHIG.matches) { hartSetzen(); return; }
    if (!laeuft) federLauf();
    netzSpannen();
  }

  // ---------- Einrasten und oeffnen ----------
  const WARTEN_BIS_TAB = 240;
  function einrastenUndWaehlen(projiziert) {
    const ziel = nachstenSlotZu(projiziert);
    setzeZiel(zielP, rotFuer(ziel, rot));
    ring.classList.add("rastet");
    setTimeout(() => ring.classList.remove("rastet"), 260);
    if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e) {} }
    return ziel;
  }
  // Einrasten, kurz stehen lassen, dann den Tab oeffnen und den Ring auf die Andeutung
  // zuruecknehmen. Die Wartezeit laesst das Einrasten sichtbar werden, bevor alles wechselt.
  function waehlenUndOeffnen(projiziert) {
    const ziel = einrastenUndWaehlen(projiziert);
    setTimeout(() => {
      if (typeof switchTab === "function" && ziel.tab !== document.body.dataset.tab) {
        switchTab(ziel.tab);
      }
      setzeZiel(0, null);
    }, WARTEN_BIS_TAB);
  }

  function naechsteStufe(wert) {
    const stufen = [0, 0.5, 1];
    let best = stufen[0], bestD = 1e9;
    for (const s of stufen) { const d = Math.abs(s - wert); if (d < bestD) { bestD = d; best = s; } }
    return best;
  }

  // ---------- Gesten ----------
  // Ein Zeiger, zwei moegliche Bedeutungen. Welche es ist, entscheidet sich nach den ersten
  // Pixeln und bleibt dann fest. Gemessen wird AN DER RINGGEOMETRIE, nicht an den
  // Bildschirmachsen: tangential (am Bogen entlang) = drehen, radial (auf den Mittelpunkt zu
  // oder von ihm weg) = schliessen bzw. oeffnen. Nach Bildschirmachsen ginge das schief --
  // links und rechts am Ring verlaeuft der Bogen fast senkrecht, ein Drehen dort waere als
  // Hochwischen missverstanden worden.
  let zeiger = null;

  function ringMitte() { return { x: window.innerWidth / 2, y: cyFuer(p) }; }
  function zeigerWinkel(e) {
    const c = ringMitte();
    return Math.atan2(e.clientY - c.y, e.clientX - c.x) * 180 / Math.PI;
  }

  function start(e) {
    if (zeiger) return;
    // Die beiden Richtungen beim Aufsetzen einfrieren: der Mittelpunkt wandert waehrend der
    // Geste, die Bedeutung der Fingerrichtung soll sich dabei nicht mitdrehen.
    const c = ringMitte();
    const rx = e.clientX - c.x, ry = e.clientY - c.y;
    const len = Math.hypot(rx, ry) || 1;
    zeiger = {
      id: e.pointerId,
      x0: e.clientX, y0: e.clientY,
      modus: null,
      p0: p,
      radial:     { x:  rx / len, y: ry / len },   // + = nach aussen
      tangential: { x: -ry / len, y: rx / len },   // am Bogen entlang
      letzterWinkel: zeigerWinkel(e),
      letzteZeit: performance.now(),
      bewegt: 0
    };
    vRot = 0;
    zielP = p; zielRot = rot;          // laufende Federn anhalten
    try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
  }

  function bewegen(e) {
    if (!zeiger || e.pointerId !== zeiger.id) return;
    const dx = e.clientX - zeiger.x0;
    const dy = e.clientY - zeiger.y0;
    zeiger.bewegt = Math.max(zeiger.bewegt, Math.hypot(dx, dy));

    const radial = dx * zeiger.radial.x + dy * zeiger.radial.y;
    const tang   = dx * zeiger.tangential.x + dy * zeiger.tangential.y;

    if (!zeiger.modus) {
      if (Math.hypot(dx, dy) < 7) return;
      // Aus der Andeutung heraus ist Drehen nicht sinnvoll -- die Symbole sind dort nur ein
      // Hinweis, kein lesbares Menue. Da ist jede Bewegung "oeffnen". Sonst gewinnt die
      // groessere Komponente; der Faktor gibt dem Drehen einen kleinen Vorsprung, weil der
      // Ring in erster Linie ein Rad ist.
      zeiger.modus = (p < 0.08 || Math.abs(radial) > Math.abs(tang) * 1.15) ? "oeffnen" : "drehen";
    }

    if (zeiger.modus === "oeffnen") {
      // 420 px Fingerweg nach aussen = der volle Weg von der Andeutung ins Hauptmenue.
      let neu = zeiger.p0 + radial / 420;
      if (neu > 1) neu = 1 + (neu - 1) * 0.22;      // ueber die Enden hinaus zaeh werden lassen
      if (neu < 0) neu = neu * 0.22;
      p = Math.max(-0.08, Math.min(1.08, neu));
      zeichnen();
    } else {
      const w = zeigerWinkel(e);
      const d = ((w - zeiger.letzterWinkel + 540) % 360) - 180;
      const jetzt = performance.now();
      const dt = Math.max(1, jetzt - zeiger.letzteZeit);
      vRot = vRot * 0.72 + (d / dt) * 0.28;         // geglaettete Winkelgeschwindigkeit
      rot += d;
      zeiger.letzterWinkel = w;
      zeiger.letzteZeit = jetzt;
      zeichnen();
    }
  }

  function ende(e) {
    if (!zeiger || e.pointerId !== zeiger.id) return;
    const z = zeiger; zeiger = null;

    if (!z.modus && z.bewegt < 7) return;          // reiner Tipp -- der Klick-Handler uebernimmt

    if (z.modus === "oeffnen") {
      const tempo = p - z.p0;                      // > 0 = nach oben gezogen
      const stufen = [0, 0.5, 1];
      let ziel;
      if (Math.abs(tempo) > 0.16) {
        // deutlicher Wisch -> eine Stufe in Wischrichtung, von der Ausgangsstufe aus
        const start = stufen.indexOf(naechsteStufe(z.p0));
        ziel = stufen[Math.max(0, Math.min(2, start + (tempo > 0 ? 1 : -1)))];
      } else {
        ziel = naechsteStufe(p);
      }
      setzeZiel(ziel, null);
      if (globeModel) globeModel.autoRotate = ziel >= 0.99;
      return;
    }

    // Drehen beendet: mit etwas Schwung weiterprojizieren, dann einrasten.
    // Der Wurf ist bewusst BEGRENZT. Ohne Grenze macht ein kurzer, schneller Wisch aus dem Ring
    // ein Gluecksrad -- und bei sehr dichten Ereignissen (dt gegen 0) wird die gemessene
    // Geschwindigkeit ohnehin unsinnig gross. Hoechstens eine Rastweite extra: ein
    // entschlossener Wisch springt genau ein Symbol weiter, nie drei.
    const MAX_WURF = 46;                           // Grad, knapp ueber einer Rastweite (40)
    const projiziert = rot + Math.max(-MAX_WURF, Math.min(MAX_WURF, vRot * 105));
    if (p > 0.15) waehlenUndOeffnen(projiziert);
    else setzeZiel(0, rotFuer(nachstenSlotZu(projiziert), rot));
  }

  ring.addEventListener("pointerdown", e => { start(e); e.preventDefault(); });
  grip.addEventListener("pointerdown", e => { start(e); e.preventDefault(); });
  addEventListener("pointermove", bewegen, { passive: true });
  addEventListener("pointerup", ende);
  addEventListener("pointercancel", ende);

  // Antippen eines Symbols: dreht es nach oben und waehlt es. Bleibt bewusst erhalten -- der
  // Ring ist ein Rad, aber ein sichtbares Ziel direkt zu treffen muss weiter moeglich sein.
  slots.forEach(s => s.btn.addEventListener("click", ev => {
    ev.stopPropagation();
    if (p < 0.15) return;                          // in der Andeutung sind die Symbole nur Deko
    waehlenUndOeffnen(rotFuer(s, rot));
  }));

  // Ein Tipp auf den abgedunkelten Inhalt nimmt den Ring wieder zurueck.
  if (scrim) scrim.addEventListener("click", () => {
    if (p > 0.06 && p < 0.94) setzeZiel(0, null);
  });

  // Tastatur: links/rechts dreht, Eingabe oeffnet, Escape nimmt eine Stufe zurueck.
  addEventListener("keydown", e => {
    if (document.body.classList.contains("dialog-offen")) return;
    if (e.key === "Escape" && p > 0.02) {
      setzeZiel(naechsteStufe(Math.max(0, p - 0.5)), null);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      if (p < 0.15) return;
      const i = slots.indexOf(nachstenSlotZu(zielRot));
      const n = slots[(i + (e.key === "ArrowRight" ? 1 : -1) + slots.length) % slots.length];
      setzeZiel(zielP, rotFuer(n, zielRot));
    } else if (e.key === "Enter" && p > 0.15) {
      // Nach dem ZIEL der Drehung, nicht nach der laufenden Zwischenstellung: waehrend die
      // Feder noch laeuft, stuende unter der Kimme sonst noch das vorige Symbol.
      waehlenUndOeffnen(zielRot);
    }
  });

  // ---------- Start ----------
  addEventListener("resize", messen);
  addEventListener("orientationchange", () => setTimeout(messen, 200));
  window.addEventListener("load", messen);
  messen();
  // Mehrfach anstossen, wie schon bei der alten Blase: so sitzt der Ring auch dann richtig,
  // wenn ein einzelner Zeitpunkt ausfaellt oder das Layout noch nicht steht.
  setTimeout(messen, 0);
  setTimeout(messen, 300);
  setTimeout(messen, 3200);

  // Erst zeigen, wenn der Startbildschirm weg ist -- sonst laege der Ring ueber dem Splash.
  function ringZeigen(erzwingen) {
    const splash = document.getElementById("splashScreen");
    if (splash && !erzwingen && !splash.classList.contains("splash-hidden")) {
      setTimeout(ringZeigen, 150);
      return;
    }
    messen();
    ring.classList.remove("is-boot");
  }
  ringZeigen();
  setTimeout(() => ringZeigen(true), 3600);   // hartes Netz, falls der Splash nie meldet
})();

// Swipe vom linken Bildschirmrand nach rechts = eine Roadmap-Ebene zurück (wie iOS Zurück-Geste).
let edgeSwipeStart = null;
document.addEventListener("touchstart", e => {
  if (document.body.dataset.tab !== "zielbereiche") { edgeSwipeStart = null; return; }
  const t = e.touches[0];
  edgeSwipeStart = t.clientX <= 24 ? { x: t.clientX, y: t.clientY } : null;
}, { passive: true });
document.addEventListener("touchend", e => {
  if (!edgeSwipeStart) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - edgeSwipeStart.x;
  const dy = Math.abs(t.clientY - edgeSwipeStart.y);
  edgeSwipeStart = null;
  if (dx > 60 && dy < 60) roadmapGoBack();
}, { passive: true });

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
