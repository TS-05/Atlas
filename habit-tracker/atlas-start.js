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
    md += `- **${s.habit.title}**: ${Math.round(s.rate * 100)}% (${s.done}/${s.total} fällige Tage)\n`;
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

// ---------- Die ruhende Blase tritt beim Scrollen zurueck ----------
// Sie haengt an der Bildschirmposition, nicht am Inhalt -- was gerade unter ihr steht, liegt
// darunter. Waehrend des Scrollens blendet sie deshalb ab und kommt zurueck, sobald es steht.
// Bewusst ueber eine Klasse, die AUSSCHLIESSLICH die Deckkraft aendert: Position und
// Transformation bleiben unangetastet, damit die Blase nicht wieder in einem Zwischenzustand
// stehen bleiben kann (siehe die Timer-Kette, die dafuer schon einmal ausgebaut wurde). Der
// Zeitgeber nimmt die Klasse in jedem Fall wieder weg -- dauerhaft blass werden kann sie nicht.
(() => {
  const handle = document.getElementById("ringHandle");
  if (!handle) return;
  let zurueck;
  addEventListener("scroll", () => {
    handle.classList.add("is-scrolling");
    clearTimeout(zurueck);
    zurueck = setTimeout(() => handle.classList.remove("is-scrolling"), 320);
  }, { passive: true });
})();

// ---------- Homemenü: 3D-Globus-Navigation ----------
// Drehung (Auto-Rotation + Wisch-Ziehen) übernimmt <model-viewer> selbst (siehe camera-controls/
// auto-rotate-Attribute in index.html). Der Globus dient nur noch zum Drehen -- die Tab-Auswahl
// läuft ausschließlich über den Ring. Die früheren unsichtbaren Kontinent-Tippflächen lagen mit
// pointer-events:auto über der Kugel und haben die Wischgeste je nach Ansatzpunkt abgefangen,
// wodurch das Drehen sporadisch hängen blieb.
(() => {
  const homeMenu = document.getElementById("homeMenu");
  const globeModel = document.getElementById("globeModel");
  if (!homeMenu) return;

  function goToTab(tabName) {
    homeMenu.classList.add("home-hidden");
    switchTab(tabName);
  }

  // Ring-Knöpfe + Wassertropfen-Griff. Der Tropfen markiert immer den gewählten Tab und lässt sich
  // am Ring entlangziehen; beim Loslassen rastet er auf das nächstgelegene Symbol. Antippen eines
  // Symbols bewegt den Tropfen ebenfalls dorthin. In beiden Fällen dreht sich der Globus zuerst
  // sichtbar auf den zugehörigen Kontinent (camera-orbit, model-viewer interpoliert weich), danach
  // öffnet der Tab -- Auto-Rotation wird dabei abgeschaltet, sonst dreht sie sofort wieder weg.
  const ringButtons = Array.from(homeMenu.querySelectorAll(".ring-btn"));
  const ringHandle = document.getElementById("ringHandle");
  let liquidTimer = null;
  let tapTimer = null;
  const ringSlots = ringButtons.map(btn => ({
    btn,
    tab: btn.dataset.tab,
    angle: parseFloat(btn.style.getPropertyValue("--angle")),
    lat: parseFloat(btn.dataset.lat),
    lon: parseFloat(btn.dataset.lon)
  }));

  // Die Blase liegt ausserhalb des Menues und wird deshalb in Bildschirmkoordinaten gesetzt.
  // Ringposition = Mittelpunkt des jeweiligen Symbols (robuster als den Radius nachzurechnen).
  const homeAnchor = document.getElementById("homeAnchor");
  let handleMode = "ring";   // "ring" = am Symbolring, "home" = unten als Zurueck-Knopf

  function centerOf(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  function setHandlePos(x, y, rotDeg) {
    if (!ringHandle) return;
    ringHandle.style.setProperty("--hx", `${x}px`);
    ringHandle.style.setProperty("--hy", `${y}px`);
    if (rotDeg != null) ringHandle.style.setProperty("--rot", `${rotDeg}deg`);
    alignLens(x, y);
  }

  // ---------- Linsenwirkung ----------
  // Eine nicht anklickbare Kopie aller Ringsymbole liegt in der Blase und wird per left/top exakt
  // ueber den echten Symbolen gehalten. Weil sie am RING klebt und nicht an der Blase, wandert sie
  // beim Ziehen durch die Blase hindurch, statt mitgeschleift zu werden -- das war der Fehler der
  // frueheren Version ("sie saugt das Symbol ein"). overflow:hidden der Blase schneidet sie auf
  // die Blasenform zu, die Vergroesserung passiert um den Blasenmittelpunkt.
  let lensLayer = null;
  // Ein echter Tropfen vergroessert nicht ueberall gleich: in der Mitte am staerksten, zum Rand
  // hin faellt es stetig ab, ganz aussen staucht sich das Bild sogar. Der Versuch, das mit drei
  // gestaffelten Zoomstufen nachzubauen, hatte an jeder Stufengrenze eine sichtbare Kante -- das
  // ist der Bauart geschuldet und nicht wegzustellen.
  // Jetzt macht es ein Verzerrungsfilter (siehe #tropfenBrechung in index.html): eine Karte, die
  // fuer jeden Punkt angibt, um wie viel er verschoben wird. Der Verlauf ist stetig, also gibt es
  // nichts mehr, woran eine Kante entstehen koennte.
  // Aufbau: .ring-lens fuellt genau die Blase (dort sitzt der Filter, damit die Karte immer
  // mittig und blasengross liegt), darin liegt die Ringkopie an ihrer Ringposition.
  function buildLens() {
    if (!ringHandle || lensLayer) return;
    const ring = homeMenu.querySelector(".globe-ring");
    if (!ring) return;
    lensLayer = document.createElement("div");
    lensLayer.className = "ring-lens";
    lensLayer.setAttribute("aria-hidden", "true");
    const zoom = document.createElement("div");
    zoom.className = "lens-zoom";
    const inhalt = document.createElement("div");
    inhalt.className = "lens-inhalt";
    ringButtons.forEach(btn => {
      const copy = btn.cloneNode(true);
      copy.removeAttribute("data-tab");
      copy.removeAttribute("aria-label");
      copy.setAttribute("tabindex", "-1");
      inhalt.appendChild(copy);
    });
    zoom.appendChild(inhalt);
    lensLayer.appendChild(zoom);
    ringHandle.appendChild(lensLayer);
  }
  // Die Kopie deckungsgleich ueber den echten Ring legen -- in Blasen-Koordinaten, weil sie ein
  // Kind der Blase ist. Bezugspunkt der Vergroesserung ist die Blasenmitte, damit sie sich wie
  // eine Lupe verhaelt und nicht wie ein skaliertes Bild.
  let lensRect = null;
  function refreshLensRect() {
    const ring = homeMenu.querySelector(".globe-ring");
    const r = ring && ring.getBoundingClientRect();
    lensRect = (r && r.width) ? r : null;
  }
  function alignLens(hx, hy) {
    if (!lensLayer) return;
    if (!lensRect) refreshLensRect();
    const rr = lensRect;
    if (!rr) return;
    // --ring-r/--ring-w stehen auf .globe-stage. Die Blase haengt am <body> und erbt sie nicht --
    // ohne sie wird translate(var(--ring-r)) ungueltig, das komplette transform faellt weg und
    // alle Kopien landen uebereinander in der Ringmitte. Also ausdruecklich uebernehmen.
    const stageEl = homeMenu.querySelector(".globe-stage");
    if (stageEl) {
      const st = getComputedStyle(stageEl);
      lensLayer.style.setProperty("--ring-r", st.getPropertyValue("--ring-r"));
      lensLayer.style.setProperty("--ring-w", st.getPropertyValue("--ring-w"));
    }

    const hw = ringHandle.offsetWidth / 2, hh = ringHandle.offsetHeight / 2;
    const left = hw + (rr.left - hx);
    const top = hh + (rr.top - hy);
    const inhalt = lensLayer.querySelector(".lens-inhalt");
    if (inhalt) {
      inhalt.style.left = `${left}px`;
      inhalt.style.top = `${top}px`;
      inhalt.style.width = `${rr.width}px`;
      inhalt.style.height = `${rr.height}px`;
      // Das Herausrechnen von --grow muss um die BLASENMITTE geschehen, nicht um die Mitte der
      // Ringkopie -- sonst wandert die Kopie beim Aufquellen unter der Blase weg.
      // Die doppelte Zeichenaufloesung spielt hier bewusst keine Rolle: .lens-zoom hebt die
      // Halbierung von .ring-lens auf, der Inhalt rechnet dadurch in normalen Koordinaten.
      inhalt.style.transformOrigin = `${hw - left}px ${hh - top}px`;
    }
    // Die Verschiebung der Karte ist als Anteil des Radius kodiert; der Filter rechnet in Pixeln.
    // Also muss die Staerke mit der Blase mitwachsen, sonst wird die Brechung schwaecher, je
    // groesser der Tropfen beim Ziehen wird. 0.3 = 2 x DMAX aus dem Erzeugerskript der Karte.
    const versatz = document.getElementById("tropfenVersatz");
    const karte = document.querySelector("#tropfenBrechung feImage");
    if (versatz) {
      const sichtbarerRadius = ringHandle.getBoundingClientRect().width / 2;
      // 1.3 = 2 x DMAX aus dem Erzeugerskript der Karte. Die Auslenkung ist dort als Anteil des
      // Radius kodiert, der Filter rechnet in Pixeln -- also muss die Staerke mit der Blase
      // mitwachsen, sonst wird die Brechung schwaecher, je groesser der Tropfen beim Ziehen wird.
      // x2, weil die Linse in doppelter Aufloesung gezeichnet wird: im Kasten des Filters ist
      // alles doppelt so gross, also muss die Auslenkung es auch sein.
      versatz.setAttribute("scale", (sichtbarerRadius * 1.3 * 2).toFixed(2));
    }
    // Der Filterbereich reicht bewusst ueber die Blase hinaus: bei 0,62 am Rand holt sich die
    // Randzone Bildpunkte von bis zu 1,61 Radien aus der Mitte, also von weit ausserhalb der
    // Blase -- ohne Rand waere dort nichts zu holen und der Saum liefe leer.
    // Die Karte selbst muss dabei aber weiterhin genau auf der Blase liegen, nicht auf dem
    // groesseren Filterbereich. Ihre Masse stehen deshalb ausdruecklich hier, in Pixeln.
    if (karte) {
      const b = ringHandle.offsetWidth * 2, hgh = ringHandle.offsetHeight * 2;
      karte.setAttribute("x", "0");
      karte.setAttribute("y", "0");
      karte.setAttribute("width", String(b));
      karte.setAttribute("height", String(hgh));
    }

    // Nur stanzen, solange das Glas wirklich da ist. Sonst bliebe nach dem Ausblenden ein
    // Symbol unsichtbar, weil die Maske einfach stehen bliebe.
    if (ringHandle.classList.contains("is-lensing")) punchRingHole(hx, hy, rr);
    else clearRingHole();
  }

  // Ohne Loch stuende jede Beschriftung doppelt da: klein im Original, gross in der Lupe darueber.
  // Echtes Glas ersetzt, was darunter liegt -- also wird der echte Ring genau unter der Blase
  // ausgeblendet. Nur die drei Zahlen wechseln pro Bild, die Maske selbst bleibt stehen.
  function punchRingHole(hx, hy, rr) {
    const ring = homeMenu.querySelector(".globe-ring");
    if (!ring) return;
    const d = ringHandle.getBoundingClientRect().width;   // sichtbarer Durchmesser inkl. --grow
    if (!d) return;
    ring.classList.add("has-hole");
    ring.style.setProperty("--hole-d", `${d}px`);
    ring.style.setProperty("--hole-x", `${hx - rr.left - d / 2}px`);
    ring.style.setProperty("--hole-y", `${hy - rr.top - d / 2}px`);
  }
  // Ohne Glas kein Loch -- sonst fehlte ein Symbol, sobald die Lupe aus ist.
  function clearRingHole() {
    const ring = homeMenu.querySelector(".globe-ring");
    if (ring) ring.classList.remove("has-hole");
  }
  function placeAtSlot(slot) {
    // WICHTIG: die Ruheverankerung aufheben. Die Klasse "at-home" ueberschreibt left/top/bottom
    // und transform per CSS; bleibt sie stehen, ignoriert die Blase jede --hx/--hy-Angabe und
    // klebt unten fest, waehrend der Code sie laengst am Ring waehnt.
    if (ringHandle) ringHandle.classList.remove("at-home");
    const c = centerOf(slot.btn);
    // Dehnung soll entlang der Ringbahn wirken -> Tangente steht senkrecht auf dem Radius.
    setHandlePos(c.x, c.y, slot.angle + 90);
  }
  function placeAtHome() {
    // Die Position kommt im Ruhezustand aus dem CSS (.ring-handle.at-home); hier nur noch die
    // Verankerung sicherstellen, damit Scrollen und die iOS-Adressleiste sie nicht verschieben.
    if (ringHandle) ringHandle.classList.add("at-home");
    if (!homeAnchor) return;
    const c = centerOf(homeAnchor);
    setHandlePos(c.x, c.y, 90);   // Rueckfall, falls das CSS nicht greift
  }

  // Kuerzester Winkelabstand auf dem Kreis (beruecksichtigt den Sprung bei 360/0 Grad).
  function angleDistance(a, b) {
    return Math.abs(((a - b) % 360 + 540) % 360 - 180);
  }

  function moveHandleTo(slot) {
    if (!ringHandle) return;
    ringHandle.classList.remove("no-anim", "is-invisible", "at-home");
    // Antippen = Finger in Fluessigkeit: kurz gleichmaessig aufquellen, dann zurueckfallen.
    ringHandle.classList.add("is-liquid", "is-tap", "is-lensing");
    ringHandle.style.setProperty("--angle", `${slot.angle}deg`);
    handleMode = "ring";
    placeAtSlot(slot);
    clearTimeout(tapTimer); clearTimeout(liquidTimer);
    tapTimer = setTimeout(() => ringHandle.classList.remove("is-tap"), 230);
    liquidTimer = setTimeout(() => { ringHandle.classList.remove("is-liquid", "is-lensing"); clearRingHole(); }, 460);
  }

  // Beim Oeffnen eines Tabs wandert die Blase nach unten und wird dort zum Zurueck-Knopf.
  const GLOBE_ICON = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none">' +
    '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/>' +
    '<ellipse cx="12" cy="12" rx="4" ry="9" stroke="currentColor" stroke-width="1.3"/>' +
    '<path d="M3.2 9.2H20.8M3.2 14.8H20.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';

  // ---------- Zustandsfuehrung der Blase ----------
  // EIN Ort, der die Blase vollstaendig in einen bekannten Zustand versetzt. Synchron, ohne
  // Zeitschalter, idempotent: ein zweiter Aufruf repariert jeden Zwischenstand. Alles Zierende
  // (Aufquellen, Zerplatzen) wird danach nur noch obendrauf gelegt und ist nie tragend.
  const BLASE_ZIER = ["is-liquid", "is-tap", "is-pop", "is-lensing", "is-invisible"];

  function setzeBlase(modus) {
    if (!ringHandle) return;
    clearTimeout(tapTimer); clearTimeout(liquidTimer);
    // Uebergaenge fuer den Sprung abschalten — ein unterbrochener Uebergang war die Ursache
    // dafuer, dass die Blase auf halbem Weg stehenblieb.
    ringHandle.classList.add("no-anim");
    ringHandle.classList.remove(...BLASE_ZIER);
    ringHandle.style.opacity = "1";
    clearRingHole();

    if (modus === "home") {
      handleMode = "home";
      ringHandle.classList.add("has-icon", "at-home");
      ringHandle.innerHTML = GLOBE_ICON;   // unten zeigt die Blase das Globus-Symbol
      lensLayer = null;
      placeAtHome();
    } else {
      handleMode = "ring";
      ringHandle.classList.remove("has-icon");
      ringHandle.classList.remove("at-home");
      ringHandle.innerHTML = "";           // am Ring leer — das Symbol liegt dort schon darunter
      lensLayer = null;
      buildLens();
      refreshLensRect();
      const cur = ringSlots.find(sl => sl.tab === document.body.dataset.tab) || ringSlots[0];
      if (cur) placeAtSlot(cur);
    }

    // Uebergaenge im naechsten Bild wieder zulassen, mit Zeitlimit als Netz, falls kein Bild
    // gezeichnet wird (Tab im Hintergrund).
    const wiederAnimieren = () => ringHandle.classList.remove("no-anim");
    requestAnimationFrame(() => requestAnimationFrame(wiederAnimieren));
    setTimeout(wiederAnimieren, 150);
  }

  // ---------- Der Weg zwischen zwei Zustaenden ----------
  // setzeBlase() setzt den Zielzustand synchron und ohne Uebergang -- das ist die Lehre aus den
  // beiden Malen, an denen die Blase zwischen zwei Positionen haengen geblieben ist. Sichtbar
  // gesprungen ist sie dadurch aber auch.
  // Diese Funktion holt die Bewegung zurueck, ohne das Risiko: der Endzustand steht bereits im
  // DOM, animiert wird nur die Differenz von der alten Position dorthin. Bricht die Animation ab,
  // laeuft sie nicht an oder wird sie unterbrochen, steht die Blase trotzdem richtig.
  // Bewusst ueber "translate" und nicht ueber "transform": transform traegt hier Position,
  // Drehung und Dehnung aus CSS-Variablen -- eine Animation darauf wuerde das alles ersetzen.
  // "translate" ist eine eigene Eigenschaft und legt sich obendrauf.
  const RUHIGE_BEWEGUNG = matchMedia("(prefers-reduced-motion: reduce)");
  function blaseGleitenLassen(vorher) {
    if (!ringHandle || !vorher || RUHIGE_BEWEGUNG.matches) return;
    if (typeof ringHandle.animate !== "function") return;
    const jetzt = ringHandle.getBoundingClientRect();
    const dx = vorher.left - jetzt.left;
    const dy = vorher.top - jetzt.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    const lauf = ringHandle.animate(
      [{ translate: `${dx}px ${dy}px` }, { translate: "0px 0px" }],
      { duration: 420, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" }
    );
    // SICHERHEITSNETZ, und zwar ein notwendiges: die Dokumentzeit steht still, solange die Seite
    // nicht gezeichnet wird (Tab im Hintergrund, App weggewischt). Die Animation bleibt dann bei
    // Zeit 0 stehen -- also auf dem ERSTEN Bild, und das ist die alte Position. Ohne dieses Netz
    // haengt die Blase genau so fest, wie sie hier schon zweimal festhing; gemessen 482 px neben
    // ihrem Platz, waehrend der Code sie laengst am Ring waehnte.
    // Zeitgeber laufen auch ohne Zeichnen weiter. cancel() nimmt die Animation heraus, danach
    // gilt wieder der DOM-Zustand -- und der ist die ganze Zeit ueber der richtige.
    const abbrechen = () => { try { lauf.cancel(); } catch (e) { /* schon beendet */ } };
    setTimeout(abbrechen, 700);
    // Der Zeitgeber allein reicht nicht: in einer versteckten Seite werden auch Zeitgeber
    // gedrosselt (auf eine Sekunde und mehr). Deshalb zusaetzlich genau auf das Ereignis hoeren,
    // das die Dokumentzeit anhaelt -- wird die Seite versteckt, wird die Animation sofort
    // weggenommen und der richtige DOM-Zustand gilt wieder.
    document.addEventListener("visibilitychange", function weg() {
      if (document.visibilityState !== "hidden") return;
      abbrechen();
      document.removeEventListener("visibilitychange", weg);
    });
  }

  // Die Zierde: kurz aufquellen, danach von selbst zurueckfallen. Setzt keinen Zustand.
  function blaseAntippen() {
    if (!ringHandle) return;
    ringHandle.classList.add("is-liquid", "is-tap");
    clearTimeout(tapTimer); clearTimeout(liquidTimer);
    tapTimer = setTimeout(() => ringHandle.classList.remove("is-tap"), 260);
    liquidTimer = setTimeout(() => ringHandle.classList.remove("is-liquid"), 560);
  }

  function sendHandleHome() {
    const vorher = ringHandle && ringHandle.getBoundingClientRect();
    setzeBlase("home");
    blaseGleitenLassen(vorher);
    blaseAntippen();
  }

  // Vorher lag zwischen Antippen und Tab eine feste Wartezeit von 850 ms, in der nichts passierte
  // ausser dass sich der Globus drehte -- danach wechselte alles auf einen Schlag. Zusammen mit dem
  // 400-ms-Ausblenden des Menues waren das 1,25 s vom Tippen bis zum benutzbaren Tab, mit einer
  // toten Dreiviertelsekunde am Anfang. Jetzt startet der Wechsel nach 260 ms; die Globusdrehung
  // laeuft hinter dem ausblendenden Menue weiter, statt ihn aufzuhalten.
  const WARTEN_BIS_TAB = 260;
  function activateSlot(slot) {
    moveHandleTo(slot);
    if (globeModel && !isNaN(slot.lat) && !isNaN(slot.lon)) {
      globeModel.autoRotate = false;
      globeModel.cameraOrbit = `${slot.lon}deg ${90 - slot.lat}deg 105%`;
      setTimeout(() => { goToTab(slot.tab); sendHandleHome(); }, WARTEN_BIS_TAB);
    } else {
      goToTab(slot.tab); sendHandleHome();
    }
  }

  ringSlots.forEach(slot => slot.btn.addEventListener("click", () => activateSlot(slot)));

  // Im Home-Modus ist die Blase der Zurueck-Knopf; im Ring-Modus faengt der Drag-Handler den Klick ab.
  if (ringHandle) {
    ringHandle.addEventListener("click", () => {
      if (handleMode !== "home") return;
      homeMenu.classList.remove("home-hidden");
      if (globeModel) globeModel.autoRotate = true;
      // Ein einziger, vollstaendiger Zustandswechsel statt dreier verschachtelter Zeitschalter.
      const vorher = ringHandle.getBoundingClientRect();
      setzeBlase("ring");
      blaseGleitenLassen(vorher);
      blaseAntippen();
    });
  }

  // Startposition setzen, sobald das Layout steht, und bei Groessenaenderung nachziehen.
  // Zusaetzlich Sicherheitsnetz: welcher Zustand richtig ist, ergibt sich daraus, ob das
  // Globus-Menue sichtbar ist — nicht aus einer Variablen, die aus dem Tritt geraten kann.
  function repositionHandle() {
    if (!ringHandle) return;
    lensRect = null;                      // Layout hat sich geaendert -> neu vermessen
    // Sollzustand ergibt sich allein daraus, ob das Globus-Menue sichtbar ist. Weicht irgendetwas
    // davon ab — der Modus, die Verankerung oder das Symbol in der Blase —, wird der ganze
    // Zustand neu gesetzt statt nur die Position nachgezogen.
    const menueOffen = !homeMenu.classList.contains("home-hidden");
    const soll = menueOffen ? "ring" : "home";
    const stimmt = handleMode === soll
      && ringHandle.classList.contains("at-home") === (soll === "home")
      && ringHandle.classList.contains("has-icon") === (soll === "home");
    if (!stimmt) { setzeBlase(soll); return; }
    if (handleMode === "home") { placeAtHome(); return; }
    const cur = ringSlots.find(sl => sl.tab === document.body.dataset.tab) || ringSlots[0];
    if (cur) placeAtSlot(cur);
  }
  // Mehrfach anstossen: direkt, nach dem Layout und nach dem Splash -- so sitzt die Blase auch dann
  // richtig, wenn ein einzelner Zeitpunkt (z.B. rAF) ausfaellt oder das Layout noch nicht steht.
  // Erst einblenden, wenn der Startbildschirm verschwunden ist -- danach sitzt sie am Ring.
  function revealHandle(force) {
    if (!ringHandle) return;
    const splash = document.getElementById("splashScreen");
    // Sobald der Splash ausblendet reicht -- NICHT darauf warten, dass er aus dem DOM faellt: das
    // haengt an einem transitionend-Ereignis, und laeuft das nicht durch, bliebe die Blase fuer
    // immer unsichtbar. Zusaetzlich unten ein hartes Sicherheitsnetz.
    if (splash && !force && !splash.classList.contains("splash-hidden")) {
      setTimeout(revealHandle, 150);
      return;
    }
    // Ohne Uebergang einblenden: haengt das Einblenden an einer Transition und die laeuft nicht,
    // bliebe die Blase unsichtbar (genau dieser Fehler ist hier schon zweimal aufgetreten).
    ringHandle.classList.add("no-anim");
    repositionHandle();
    ringHandle.classList.remove("is-boot");
    ringHandle.style.opacity = "1";
    setTimeout(() => ringHandle.classList.remove("no-anim"), 50);
  }
  revealHandle();
  setTimeout(() => revealHandle(true), 3600);

  // Die Linse wurde bisher nur in setzeBlase("ring") gebaut -- und das laeuft beim ersten Start
  // nie. Die allererste Auswahl setzte also is-lensing, ohne dass eine Linse existierte: keine
  // Vergroesserung, bis man einmal in einen Tab und wieder zurueck war.
  buildLens();
  refreshLensRect();

  repositionHandle();
  setTimeout(repositionHandle, 0);
  setTimeout(repositionHandle, 300);
  setTimeout(repositionHandle, 3200);
  window.addEventListener("load", repositionHandle);
  window.addEventListener("resize", repositionHandle);
  window.addEventListener("orientationchange", () => setTimeout(repositionHandle, 200));

  if (ringHandle) {
    const stage = homeMenu.querySelector(".globe-stage");
    let handleDragging = false;
    let targetAngle = 0;

    // Mittelpunkt und Radius aus der echten Lage eines Symbols ableiten -- so bleibt es korrekt,
    // egal wie die Buehne gerade skaliert.
    function ringGeom() {
      if (!ringSlots.length) return null;
      const r = stage.getBoundingClientRect();
      if (!r.width) return null;
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const c0 = centerOf(ringSlots[0].btn);
      return { cx, cy, r: Math.hypot(c0.x - cx, c0.y - cy) };
    }

    function pointerAngle(e) {
      const r = stage.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      return Math.atan2(dy, dx) * 180 / Math.PI;
    }

    // Der Tropfen folgt dem Finger nicht starr, sondern zieht traege nach (Lerp). Der Rueckstand
    // zum Finger bestimmt die Dehnung -- schnell gezogen = laenger und schmaler, genau wie ein
    // echter Tropfen, der an der Oberflaeche haengt und hinterherlaeuft.
    function dragFrame() {
      if (!handleDragging) return;
      const cur = parseFloat(ringHandle.style.getPropertyValue("--angle")) || targetAngle;
      let lag = ((targetAngle - cur + 540) % 360) - 180;
      const next = cur + lag * 0.34;                     // Nachziehen (groesser = folgt schneller)
      // Der Rueckstand faellt durch das schnellere Folgen kleiner aus. Damit die Dehnung gleich
      // stark bleibt, wird der Bezugswert im selben Verhaeltnis mitgezogen (14 * 0.22/0.34 ~ 9).
      const pull = Math.min(1, Math.abs(lag) / 9);       // 0..1 Rueckstand
      ringHandle.style.setProperty("--angle", `${next}deg`);
      ringHandle.style.setProperty("--sy", (1 + pull * 0.45).toFixed(3));
      ringHandle.style.setProperty("--sx", (1 - pull * 0.18).toFixed(3));
      const g = ringGeom();
      if (g) setHandlePos(g.cx + Math.cos(next * Math.PI / 180) * g.r,
                          g.cy + Math.sin(next * Math.PI / 180) * g.r, next + 90);
      requestAnimationFrame(dragFrame);
    }

    ringHandle.addEventListener("pointerdown", e => {
      if (handleMode !== "ring") return;   // unten ist sie Zurueck-Knopf, kein Schieberegler
      handleDragging = true;
      targetAngle = pointerAngle(e);
      buildLens();
      refreshLensRect();
      ringHandle.classList.add("is-lensing");
      requestAnimationFrame(dragFrame);
      clearTimeout(liquidTimer);
      ringHandle.classList.add("is-dragging", "is-liquid");
      try { ringHandle.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    });
    ringHandle.addEventListener("pointermove", e => {
      if (!handleDragging) return;
      targetAngle = pointerAngle(e);
    });
    function endHandleDrag(e) {
      if (!handleDragging) return;
      handleDragging = false;
      ringHandle.classList.remove("is-dragging");
      ringHandle.style.removeProperty("--sy");
      ringHandle.style.removeProperty("--sx");
      try { ringHandle.releasePointerCapture(e.pointerId); } catch (err) {}
      // Nach der FINGER-Position einrasten, nicht nach der (absichtlich nachhinkenden) Tropfen-
      // position -- sonst landet man bei schnellem Ziehen auf dem Symbol, das man gerade verlassen hat.
      const current = targetAngle;
      let nearest = ringSlots[0];
      ringSlots.forEach(slot => {
        if (angleDistance(slot.angle, current) < angleDistance(nearest.angle, current)) nearest = slot;
      });
      activateSlot(nearest);
    }
    ringHandle.addEventListener("pointerup", endHandleDrag);
    ringHandle.addEventListener("pointercancel", endHandleDrag);
  }

  // orientation als statisches HTML-Attribut wird von model-viewer nur reaktiv angewendet, wenn sich
  // der Property-Wert NACH dem Laden echt ändert (interner Guard "wenn noch nicht geladen,
  // überspringen" + Lits eigene Änderungserkennung reagiert nicht, wenn der neue Wert exakt dem
  // schon gesetzten String entspricht). Deshalb hier nach dem "load"-Event erst auf einen anderen
  // Wert und im nächsten Frame erst auf den Zielwert gesetzt -- garantiert eine echte, erkannte
  // Änderung nach dem Laden statt eines wirkungslosen "gleicher Wert nochmal"-Assignments.
  const TARGET_ORIENTATION = "23.5deg 0deg 0deg";
  if (globeModel) {
    const applyOrientation = () => {
      globeModel.orientation = "0deg 0deg 0deg";
      requestAnimationFrame(() => { globeModel.orientation = TARGET_ORIENTATION; });
    };
    if (globeModel.loaded) applyOrientation();
    else globeModel.addEventListener("load", applyOrientation, { once: true });
  }
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
