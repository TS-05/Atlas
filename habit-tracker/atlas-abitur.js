// ============================================================
// Abitur — Langplan bis zu den Abiturpruefungen (BOS 13, 2026/27)
// ============================================================
// Der Plan selbst ist fest (Termine, Phasen, Themen) und stammt aus
// 30_Projekte/Abitur_Lernplan_2026-27.md im Vault. Veraenderlich ist nur der Fortschritt:
// abgehakte Seminarkapitel und Themen liegen in state.abitur und laufen damit durch dieselbe
// Speicherung und Sicherung wie der Rest der App.
//
// Themen: Lernbereiche aus LehrplanPLUS FOS/BOS 13 (Deutsch, Englisch, Mathematik nichttechnisch)
// und die vier Pruefungssaeulen BwR (Jahresabschluss, KLR, Investition/Finanzierung,
// Bilanzanalyse). Jedes Thema haengt an der Phase, in der es dran ist -- "bis" ist deren Ende.

const ABI_START = "2026-09-16";
const ABI_ENDE = "2027-06-03";
const ABI_ERSTES = "2027-05-12";

// art: abi | sa | ka | sem | frei | privat. `offen` = Datum steht noch nicht fest (Monat bekannt).
// `fach` verbindet den Termin mit dem Fach in state.subjects (fuer "in Klassenarbeiten uebernehmen").
const ABI_TERMINE = [
  { d: "2026-10-26", art: "sa", t: "Deutsch Schulaufgabe 1", fach: "Deutsch" },
  { d: "2026-10-31", bis: "2026-11-08", art: "frei", t: "Herbstferien" },
  { d: "2026-11-13", art: "sem", t: "Seminar: Teilausfertigung", s: "Zwischenpräsentation zwischen 19.10. und 20.11." },
  { d: "2026-11-18", art: "frei", t: "Buß- und Bettag" },
  { d: "2026-12-08", art: "sa", t: "Englisch Schulaufgabe 1", fach: "Englisch" },
  { d: "2026-12-24", bis: "2027-01-08", art: "frei", t: "Weihnachtsferien" },
  { d: "2027-01-15", offen: "Januar", art: "ka", t: "Deutsch Kurzarbeit 1", s: "Datum steht noch nicht fest" },
  { d: "2027-01-18", art: "sem", t: "Abgabe Seminararbeit", s: "Mo 18. / Di 19.01." },
  { d: "2027-01-25", offen: "ab ~25.01.", art: "sem", t: "Seminar-Verteidigung", s: "Termin noch offen" },
  { d: "2027-02-02", art: "sa", t: "Deutsch Schulaufgabe 2", fach: "Deutsch" },
  { d: "2027-02-08", bis: "2027-02-12", art: "frei", t: "Frühjahrsferien" },
  { d: "2027-03-03", art: "sa", t: "Englisch Schulaufgabe 2", fach: "Englisch" },
  { d: "2027-03-15", offen: "März", art: "ka", t: "Deutsch Kurzarbeit 2", s: "Datum steht noch nicht fest" },
  { d: "2027-03-22", bis: "2027-04-02", art: "frei", t: "Osterferien" },
  { d: "2027-04-07", offen: "Anfang April", art: "sa", t: "Englisch mündlich", s: "Group Discussion, 20 Min. Vorbereitung" },
  { d: "2027-05-08", art: "privat", t: "Hochzeit Emu & Vika" },
  { d: "2027-05-12", art: "abi", t: "Abitur Deutsch", fach: "Deutsch" },
  { d: "2027-05-14", art: "abi", t: "Abitur BWR", s: "Vortag ist Ochsen-Tag → freinehmen", fach: "BWR" },
  { d: "2027-05-18", bis: "2027-05-28", art: "frei", t: "Pfingstferien" },
  { d: "2027-06-01", art: "abi", t: "Abitur Englisch", fach: "Englisch" },
  { d: "2027-06-03", art: "abi", t: "Abitur Mathe", s: "abends Ochsen", fach: "Mathe" }
];
const ABI_ART_LABEL = { abi: "Abitur", sa: "Prüfung", ka: "Kurzarb.", sem: "Seminar", frei: "Frei", privat: "Privat" };

// [von, bis, Hauptslot 60 Min., Nebenslot 30 Min., Ziel, Typ]
const ABI_PHASEN = [
  ["2026-09-16", "2026-10-11", "Seminararbeit: 2.2.2, 2.2.3, 2.3", "Deutsch · Mathe", "Kapitel 2 fertig, Material sortiert"],
  ["2026-10-12", "2026-10-25", "Deutsch", "Seminar-Präsentation üben · Mathe", "Mo 26.10. Deutsch SA 1 · Zwischenpräsentation", "druck"],
  ["2026-10-26", "2026-11-13", "Seminararbeit: Kapitel 3.1–3.2.1", "Englisch · Mathe", "Fr 13.11. Teilausfertigung", "ferien"],
  ["2026-11-14", "2026-12-08", "Englisch", "Mathe · BWR", "Di 08.12. Englisch SA 1 · ab 23.11. Druckwoche"],
  ["2026-12-09", "2026-12-23", "Seminararbeit: 3.2.2–3.3 + Kapitel 4", "Deutsch · Mathe", "Vollfassung steht"],
  ["2026-12-24", "2027-01-08", "Seminar-Endkorrektur, 1,5 Std./Tag", "24.–27.12. und 31.12.–01.01. frei", "Gegenleser bis 08.01.", "ferien"],
  ["2027-01-09", "2027-01-19", "Seminar: Layout, Abgabe → danach Deutsch", "Deutsch-Kurzarbeit · Verteidigung", "Abgabe 18./19.01. · Deutsch KA 1"],
  ["2027-01-20", "2027-02-02", "Deutsch", "Verteidigung üben", "Di 02.02. Deutsch SA 2 · Verteidigung", "druck"],
  ["2027-02-03", "2027-03-03", "Englisch", "Mathe · BWR", "Ferien: 3 Tage à 2 Std. Mathe · Mi 03.03. Englisch SA 2", "ferien"],
  ["2027-03-04", "2027-03-21", "BWR", "Deutsch KA 2 · Englisch mündlich", "Deutsch KA 2 · BWR-Abistoff angefangen"],
  ["2027-03-22", "2027-04-04", "Osterferien: 8 Lerntage à 2,5 Std.", "Karfreitag bis Ostermontag frei", "4 Probe-Runden Group Discussion · Mathe-Altabitur · BWR", "ferien"],
  ["2027-04-05", "2027-04-11", "Englisch mündlich", "Mathe", "Group Discussion", "druck"],
  ["2027-04-12", "2027-05-06", "Deutsch: Abi-Aufsätze, Probe-Abi", "BWR", "Deutsch und BWR sitzen bis Do 06.05."],
  ["2027-05-07", "2027-05-14", "10.–11.05. Deutsch · 12. nachm. + 13.05. BWR", "07.–09.05. Hochzeit, nur Minimum", "Mi 12.05. Deutsch · Fr 14.05. BWR", "druck"],
  ["2027-05-15", "2027-05-31", "Englisch + Mathe, 3 Std./Tag", "15.–17.05. frei · Pfingstsonntag und Fronleichnam frei", "je 2 Altabiture Englisch und Mathe", "ferien"],
  ["2027-06-01", "2027-06-03", "Mathe wiederholen (01. nachm. + 02.06.)", "", "Di 01.06. Englisch · Do 03.06. Mathe", "druck"]
].map((p, i) => ({ nr: i + 1, von: p[0], bis: p[1], h: p[2], n: p[3], ziel: p[4], typ: p[5] || "" }));

// Wochenraster: 0 = Sonntag. stufe: voll (60 + 30), min (30), frei.
const ABI_WOCHE = [
  { wd: 1, stufe: "min", fix: "Freundin" },
  { wd: 2, stufe: "min", fix: "Freundin" },
  { wd: 3, stufe: "voll", fix: "" },
  { wd: 4, stufe: "min", fix: "Ochsen 16:45" },
  { wd: 5, stufe: "voll", fix: "Jungschar 17:00" },
  { wd: 6, stufe: "voll", fix: "vormittags" },
  { wd: 0, stufe: "frei", fix: "Gottes­dienst" }
];

// Seminarkapitel mit Seitenbudget (Summe 11 Seiten). Dieselben Schluessel wie im Artifact.
const ABI_KAPITEL = [
  ["k1", "1 · Fragestellung und Vorgehen", 1, ""],
  ["k21", "2.1 · Filmkonzept, physiologische Grundlagen", 0.75, ""],
  ["k221", "2.2.1 · Wärmeabgabe im Wüstenklima", 1.5, ""],
  ["k222", "2.2.2 · Wasserfiltration", 1, "2026-10-11"],
  ["k223", "2.2.3 · Energieversorgung", 0.75, "2026-10-11"],
  ["k23", "2.3 · Bewertung Stillsuit", 0.5, "2026-10-11"],
  ["k3a", "3.1–3.2.1 · Schild-Konzept, Geschwindigkeitsbarriere", 2, "2026-11-13"],
  ["k3b", "3.2.2–3.3 · Rückstoß, Optik/Gas, Bewertung", 2.5, "2026-12-23"],
  ["k4", "4 · Vergleichende Schlussbetrachtung", 1, "2026-12-23"],
  ["kend", "Endkorrektur, Layout, Gegenleser", 0, "2027-01-08"]
];

// Themen je Pruefungsfach. bis = Ende der Phase, in der das Thema dran ist; leer = laeuft das
// ganze Jahr mit.
const ABI_FAECHER = [
  { key: "deutsch", titel: "Deutsch", abi: "2027-05-12", hinweis: "Aufgabenarten: literarischen Text interpretieren, Sachtext analysieren/erörtern, materialgestützt schreiben. Welche Formate 2027 drankommen und wie lange die Prüfung dauert, beim Deutschlehrer bestätigen.", themen: [
    ["d-epik", "Prosa interpretieren", "Erzählperspektive, Figuren, Handlung, Raum und Zeit, Sprache", "2026-10-25"],
    ["d-lyrik", "Gedichte interpretieren", "Sprecher, Bilder, Klang und Metrum, Aufbau", "2026-10-25"],
    ["d-sach", "Sachtext analysieren", "Intention, Adressat, Argumentationsweise, sprachliche Mittel", "2026-10-25"],
    ["d-eroert", "Erörtern und kommentieren", "textgebunden und frei, Kommentar, Rede", "2027-01-19"],
    ["d-drama", "Drama interpretieren", "Dialog, Konflikt, Handlungsstruktur, Szene", "2027-02-02"],
    ["d-epo1", "Epochen I", "Barock, Aufklärung, Sturm und Drang", "2027-02-02"],
    ["d-epo2", "Epochen II", "Klassik und Romantik: Humanitätsideal, Bildungsidee, Subjekt", "2027-02-02"],
    ["d-epo3", "Epochen III", "19.–21. Jh.: Realismus, Moderne, Nachkriegs- und Gegenwartsliteratur", "2027-03-21"],
    ["d-material", "Materialgestützt schreiben", "informierend und argumentierend, adressatenbezogen", "2027-03-21"],
    ["d-ganz", "Ganzschriften wiederholen", "die im Unterricht gelesenen Werke: Figuren, Konflikt, Epochenbezug", "2027-05-06"],
    ["d-sprache", "Sprache reflektieren", "Kommunikation, Sprachwandel, Manipulation; Zitieren und Rechtschreibung", "2027-05-06"],
    ["d-probe", "Zwei Probe-Abis", "unter Echtbedingungen mit Zeitlimit, danach selbst korrigieren", "2027-05-06"]
  ] },
  { key: "bwr", titel: "BWR", abi: "2027-05-14", hinweis: "Vier Säulen der Prüfung: Jahresabschluss, Kosten- und Leistungsrechnung, Investition und Finanzierung, Bilanzanalyse. Für Prüfungen bis 2028 gilt noch der bisherige Lehrplan.", themen: [
    ["b-ja", "Jahresabschluss", "Bewertung von Anlage- und Umlaufvermögen, Rückstellungen, Rechnungsabgrenzung", "2026-12-08"],
    ["b-kenn", "Bilanzanalyse und Kennzahlen", "Eigenkapitalquote, Anlagendeckung, Liquidität, Rentabilität, Cashflow", "2027-03-03"],
    ["b-voll", "KLR: Vollkosten", "Betriebsabrechnungsbogen, Zuschlagskalkulation, Über- und Unterdeckung", "2027-03-21"],
    ["b-teil", "KLR: Teilkosten", "Deckungsbeitrag, Break-even, Zusatzauftrag, Engpass", "2027-03-21"],
    ["b-plan", "Plankostenrechnung", "flexible Plankosten, Abweichungsanalyse", "2027-04-04"],
    ["b-inv", "Investition und Finanzierung", "Investitionsrechnung, Finanzierungsarten, Leasing, Lohmann-Ruchti-Effekt", "2027-05-06"],
    ["b-probe", "Zwei Altabiture BWR", "unter Echtbedingungen, danach mit Lösungsschlüssel", "2027-05-06"]
  ] },
  { key: "englisch", titel: "Englisch", abi: "2027-06-01", hinweis: "Kompetenzen: Reading, Listening, Mediation, Writing. Mündlich vorher: Group Discussion mit 20 Min. Vorbereitung.", themen: [
    ["e-vocab", "Wortschatz und Grammatik", "10 Min. in jedem Englisch-Slot, das ganze Jahr", ""],
    ["e-news", "Current affairs", "USA, UK, Australien: ein Artikel pro Woche", ""],
    ["e-reading", "Reading", "Sachtexte und literarische Texte erschließen", "2026-11-13"],
    ["e-writing", "Writing", "Comment, argumentative essay, text analysis", "2026-12-08"],
    ["e-listening", "Listening und Viewing", "Reden, Radio, Dokus, Filme: Standpunkte heraushören", "2026-12-08"],
    ["e-soc", "Society", "Demographic change, gender issues, social inequality, freedom vs. security, science and ethics", "2026-12-08"],
    ["e-glob", "Globalisation", "International relations, conflicts, terrorism, causes of migration", "2027-03-03"],
    ["e-lang", "Language and communication", "Power and manipulation, language diversity, youth language", "2027-03-03"],
    ["e-mediation", "Mediation", "Deutsche Texte sinngemäß auf Englisch wiedergeben", "2027-03-03"],
    ["e-lit", "Literature", "die Ganzschrift aus dem Unterricht", "2027-03-03"],
    ["e-speak", "Group discussion", "Redemittel: agreeing, disagreeing, turn-taking, summarising", "2027-04-11"],
    ["e-probe", "Zwei Altabiture Englisch", "unter Echtbedingungen", "2027-05-31"]
  ] },
  { key: "mathe", titel: "Mathe", abi: "2027-06-03", hinweis: "Nichttechnisch. Analysis mit e- und ln-Funktionen, gebrochen-rationale Funktionen, analytische Geometrie. Ob Stochastik aus der 12 im Abi drankommt, beim Mathelehrer klären.", themen: [
    ["m-stoch", "Klären: Stochastik im Abi?", "einmal beim Mathelehrer nachfragen", "2026-10-11"],
    ["m-ganz", "Wiederholung 12", "ganzrationale Funktionen, Ableitung, Kurvendiskussion", "2026-10-25"],
    ["m-int", "Integralrechnung", "Stammfunktionen, Flächen, Anwendungen", "2026-11-13"],
    ["m-exp", "e-Funktion", "Eigenschaften, Wachstum, Kurvendiskussion", "2026-12-08"],
    ["m-gebr", "Gebrochen-rationale Funktionen", "Definitionslücken, Asymptoten, Kurvendiskussion", "2026-12-23"],
    ["m-ln", "Logarithmusfunktion", "Eigenschaften, Verknüpfungen mit e- und ln-Funktionen", "2027-02-02"],
    ["m-vek", "Vektoren", "lineare Unabhängigkeit, lineare Gleichungssysteme", "2027-03-03"],
    ["m-prod", "Skalar- und Vektorprodukt", "Winkel, Flächen, Volumen", "2027-03-03"],
    ["m-geo", "Geraden und Ebenen", "Lagebeziehungen, Schnitte, Abstände", "2027-04-04"],
    ["m-probe", "Altabiture 2022–2026", "unter Echtbedingungen, mindestens vier", "2027-05-31"]
  ] }
];

// Einmalig: Seminarstand vom 14.09. (V0) als Ausgangslage, danach gehoert alles dem Nutzer.
state.abitur = state.abitur || {};
if (!state.abitur.kapitel) state.abitur.kapitel = { k1: true, k21: true, k221: true };
state.abitur.themen = state.abitur.themen || {};

let abiFachWahl = "deutsch";
let abiTermineOffen = false;

function abiDate(key) { return dateFromKey(key); }
function abiHeute() { return dateFromKey(localDateKey(new Date())); }
function abiTage(key) { return Math.round((abiDate(key) - abiHeute()) / 86400000); }
const ABI_WT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
function abiKurz(key) {
  const d = abiDate(key);
  return `${ABI_WT[d.getDay()]} ${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.`;
}
function abiZahl(n) { return String(Math.round(n * 100) / 100).replace(".", ","); }

function abiPhaseAm(key) {
  if (key < ABI_START) return ABI_PHASEN[0];
  if (key > ABI_ENDE) return null;
  return ABI_PHASEN.find(p => key >= p.von && key <= p.bis) || null;
}
function abiDruckAm(key) {
  return ABI_TERMINE.some(t => ["abi", "sa"].includes(t.art) && !t.offen && t.d >= key &&
    Math.round((abiDate(t.d) - abiDate(key)) / 86400000) <= 14);
}
function abiFerienAm(key) {
  return ABI_TERMINE.find(t => t.art === "frei" && key >= t.d && key <= (t.bis || t.d)) || null;
}

// Fuer die Tagesroutine auf "Heute": was sagt der Plan fuer diesen Tag?
function abiPlanFuer(dateObj) {
  const key = localDateKey(dateObj);
  const phase = abiPhaseAm(key);
  if (!phase || key < ABI_START) return null;
  const wd = ABI_WOCHE.find(w => w.wd === dateObj.getDay());
  const ferien = abiFerienAm(key);
  let stufe = wd.stufe;
  if (abiDruckAm(key) && (wd.wd === 1 || wd.wd === 2)) stufe = "druck";
  const umfang = ferien ? "Ferien – Umfang laut Phase"
    : stufe === "voll" ? "60 + 30 Min." : stufe === "druck" ? "60 Min. (Druckwoche)"
    : stufe === "min" ? "Minimum 30 Min." : "heute frei";
  return { phase, stufe, umfang, ferien };
}

function abiKapitelStand() {
  const k = state.abitur.kapitel || {};
  const gesamt = ABI_KAPITEL.reduce((a, x) => a + x[2], 0);
  const seiten = ABI_KAPITEL.reduce((a, x) => a + (k[x[0]] ? x[2] : 0), 0);
  return { seiten, gesamt, proz: Math.round(seiten / gesamt * 100) };
}
function abiFachStand(fach) {
  const erledigt = fach.themen.filter(t => state.abitur.themen[t[0]]).length;
  return { erledigt, gesamt: fach.themen.length, proz: Math.round(erledigt / fach.themen.length * 100) };
}

// Checkbox im Atlas-Stil: dasselbe Kaestchen mit Tintenklecks wie bei den Gewohnheiten.
function abiCheck(attr, id, done, label) {
  return `<button class="atlas-check${done ? " checked" : ""}" ${attr}="${id}" role="checkbox" aria-checked="${done}" aria-label="${escapeHtml(label)}">${done ? splatSvg(id) : ""}</button>`;
}
function abiBisChip(bis, done) {
  if (done) return `<span class="abi-bis erledigt">erledigt</span>`;
  if (!bis) return `<span class="abi-bis">ganzjährig</span>`;
  const heute = localDateKey(new Date());
  const ueber = bis < heute;
  return `<span class="abi-bis${ueber ? " ueberfaellig" : ""}">${ueber ? "überfällig · " : "bis "}${abiKurz(bis).slice(3)}</span>`;
}

function renderAbitur() {
  const wrap = document.getElementById("abiUebersicht");
  if (!wrap) return;
  const heuteKey = localDateKey(new Date());
  const phase = abiPhaseAm(heuteKey) || ABI_PHASEN[ABI_PHASEN.length - 1];
  const plan = abiPlanFuer(new Date());

  // ---------- Uebersicht ----------
  const bisAbi = abiTage(ABI_ERSTES);
  const bisEnde = abiTage(ABI_ENDE);
  const anteil = Math.min(1, Math.max(0.012, (abiHeute() - abiDate(ABI_START)) / (abiDate(ABI_ERSTES) - abiDate(ABI_START))));
  const U = 2 * Math.PI * 62;
  const naechste = ABI_TERMINE.filter(t => ["abi", "sa", "ka", "sem"].includes(t.art) && !t.offen && t.d >= heuteKey)
    .sort((a, b) => a.d.localeCompare(b.d))[0];
  const ringZahl = bisAbi > 0 ? bisAbi : bisEnde >= 0 ? bisEnde : "✓";
  const ringText = bisAbi > 0 ? "Tage bis zum Deutsch-Abi" : bisEnde >= 0 ? "Tage bis zum Mathe-Abi" : "geschafft";
  const banner = plan && plan.ferien
    ? `<div class="abi-banner ferien">${escapeHtml(plan.ferien.t)} – Umfang steht in der Phase.</div>`
    : `<div class="abi-banner">Heute: ${plan ? plan.umfang : "–"}${naechste ? ` · nächste Prüfung in ${abiTage(naechste.d)} Tagen: ${escapeHtml(naechste.t)}` : ""}</div>`;

  const druck = abiDruckAm(heuteKey);
  let summe = 0;
  const woche = ABI_WOCHE.map(w => {
    let stufe = w.stufe, zahl = w.stufe === "voll" ? 1.5 : w.stufe === "min" ? 0.5 : 0;
    if (druck && (w.wd === 1 || w.wd === 2)) { stufe = "voll"; zahl = 1; }
    summe += zahl;
    return `<div class="abi-tag${w.wd === new Date().getDay() ? " heute" : ""}">
      <span class="abi-wd">${ABI_WT[w.wd]}</span>
      <span class="abi-dot ${stufe}">${zahl ? abiZahl(zahl) : "–"}</span>
      <span class="abi-fix">${escapeHtml(w.fix) || "&nbsp;"}</span></div>`;
  }).join("");

  // Zeitstrahl
  const s0 = abiDate(ABI_START), s1 = abiDate(ABI_ENDE);
  const pos = key => ((abiDate(key) - s0) / (s1 - s0) * 100);
  let strahl = `<div class="abi-achse"><div class="abi-gelaufen" style="width:${Math.max(0, Math.min(100, pos(heuteKey)))}%"></div></div>`;
  ABI_TERMINE.filter(t => t.art === "frei" && t.bis).forEach(t => {
    strahl += `<div class="abi-ferien" style="left:${pos(t.d)}%;width:${pos(t.bis) - pos(t.d)}%"></div>`;
  });
  ["Okt", "Nov", "Dez", "Jan", "Feb", "Mär", "Apr", "Mai", "Jun"].forEach((m, i) => {
    strahl += `<span class="abi-monat" style="left:${pos(localDateKey(new Date(2026, 9 + i, 1)))}%">${m}</span>`;
  });
  [["2026-10-26", "Deu SA", ""], ["2026-12-08", "Eng SA", ""], ["2027-01-18", "Seminar", "unten"],
   ["2027-02-02", "Deu SA", ""], ["2027-03-03", "Eng SA", ""], ["2027-04-07", "mündl.", "unten"],
   ["2027-05-08", "Hochzeit", "unten"], ["2027-05-12", "Deu", "abi"], ["2027-05-14", "BWR", "abi unten"],
   ["2027-06-01", "Eng", "abi"], ["2027-06-03", "Mat", "abi unten"]].forEach(([d, l, c]) => {
    strahl += `<div class="abi-mark ${c}" style="left:${Math.min(pos(d), 98.6)}%"><span>${l}</span><i></i></div>`;
  });
  if (heuteKey >= ABI_START && heuteKey <= ABI_ENDE) strahl += `<div class="abi-jetzt" style="left:${pos(heuteKey)}%"></div>`;

  // Termine
  const alle = ABI_TERMINE.slice().sort((a, b) => a.d.localeCompare(b.d));
  const kommend = alle.filter(t => (t.bis || t.d) >= heuteKey);
  const liste = abiTermineOffen ? alle : kommend.slice(0, 5);
  const terminZeile = t => {
    const tage = abiTage(t.d);
    const vorbei = (t.bis || t.d) < heuteKey;
    const laeuft = tage <= 0 && !vorbei;
    const rechts = t.offen
      ? `<div class="abi-tage offen">offen</div><div class="abi-datum">${t.offen}</div>`
      : `<div class="abi-tage">${vorbei ? "✓" : laeuft ? (t.bis ? "läuft" : "heute") : tage + " T"}</div><div class="abi-datum">${abiKurz(t.d)}${t.bis ? " – " + abiKurz(t.bis) : ""}</div>`;
    return `<div class="atlas-row${vorbei ? " abi-vorbei" : ""}">
      <span class="abi-chip ${t.art}">${ABI_ART_LABEL[t.art]}</span>
      <div style="flex:1; min-width:0;"><div class="item-title">${escapeHtml(t.t)}</div>${t.s ? `<div class="abi-sub">${escapeHtml(t.s)}</div>` : ""}</div>
      <div class="abi-rechts">${rechts}</div></div>`;
  };

  // Fortschritt je Fach als kleine Leisten
  const kap = abiKapitelStand();
  const leisten = [{ titel: "Seminar", proz: kap.proz, sub: "bis 18.01." }]
    .concat(ABI_FAECHER.map(f => ({ titel: f.titel, proz: abiFachStand(f).proz, sub: abiKurz(f.abi).slice(3) })))
    .map(x => `<div class="abi-leiste"><div class="abi-leiste-kopf"><span>${x.titel}</span><span class="abi-num">${x.proz} %</span></div>
      <div class="progress-outer"><div class="progress-inner" style="width:${x.proz}%"></div></div><div class="abi-sub">${x.sub}</div></div>`).join("");

  wrap.innerHTML = `
    <div class="gold-frame abi-hero">
      <div class="abi-ring">
        <svg viewBox="0 0 148 148" aria-hidden="true">
          <defs><linearGradient id="abiRingGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="var(--color-accent-200)"/><stop offset="0.45" stop-color="var(--color-accent-500)"/><stop offset="1" stop-color="var(--color-accent-700)"/>
          </linearGradient></defs>
          <circle cx="74" cy="74" r="62" fill="none" stroke="var(--color-neutral-800)" stroke-width="10"/>
          <circle cx="74" cy="74" r="62" fill="none" stroke="url(#abiRingGrad)" stroke-width="10" stroke-linecap="round"
            transform="rotate(-90 74 74)" stroke-dasharray="${U.toFixed(2)}" stroke-dashoffset="${(U * (1 - anteil)).toFixed(2)}"/>
        </svg>
        <div class="abi-ring-mitte"><span class="abi-ring-zahl metal-gold">${ringZahl}</span><span class="abi-ring-text">${ringText}</span></div>
      </div>
      <div class="abi-hero-info">
        <span class="card-kicker">Phase ${phase.nr} von 16 · ${abiKurz(phase.von)} – ${abiKurz(phase.bis)}</span>
        <div class="abi-hero-ziel">${escapeHtml(phase.ziel)}</div>
        <div class="abi-slots">
          <div class="abi-slot"><span>Hauptfach · 60 Min.</span><b>${escapeHtml(phase.h)}</b></div>
          <div class="abi-slot"><span>Nebenfach · 30 Min.</span><b>${escapeHtml(phase.n || "–")}</b></div>
        </div>
        ${banner}
      </div>
    </div>

    <h2 class="metal-gold abschnitt abi-abstand">Deine Woche</h2>
    <div class="abi-woche">${woche}</div>
    <p class="hint abi-legende">${druck ? "Druckwoche" : "Normalwoche"} · ${abiZahl(summe)} Std. · Sonntag 15 Min. Abgleich</p>

    <h2 class="metal-gold abschnitt abi-abstand">Fortschritt</h2>
    <div class="panel-card abi-leisten">${leisten}</div>

    <h2 class="metal-gold abschnitt abi-abstand">Bis zur letzten Prüfung</h2>
    <div class="panel-card abi-strahl-box"><div class="abi-strahl">${strahl}</div></div>

    <h2 class="metal-gold abschnitt abi-abstand">Termine</h2>
    <div class="list abi-liste">${liste.map(terminZeile).join("")}
      <button class="btn btn-ghost btn-block" data-abi-termine="1">${abiTermineOffen ? "Nur kommende zeigen" : `Alle ${alle.length} Termine zeigen`}</button>
    </div>
    <button class="btn btn-secondary btn-block" id="abiTermineUebernehmenBtn" style="display:none;">Prüfungen in „Klassenarbeiten“ übernehmen</button>
  `;

  // ---------- Themen ----------
  const fach = ABI_FAECHER.find(f => f.key === abiFachWahl) || ABI_FAECHER[0];
  const st = abiFachStand(fach);
  document.getElementById("abiThemen").innerHTML = `
    <div class="abi-fachwahl" role="tablist">
      ${ABI_FAECHER.map(f => `<button class="abi-fachbtn${f.key === fach.key ? " aktiv" : ""}" role="tab" aria-selected="${f.key === fach.key}" data-abi-fach="${f.key}">${f.titel}<span>${abiFachStand(f).proz} %</span></button>`).join("")}
    </div>
    <div class="panel-card abi-fachkopf">
      <div class="abi-leiste-kopf"><span>Abitur ${abiKurz(fach.abi)} · noch ${Math.max(0, abiTage(fach.abi))} Tage</span><span class="abi-num">${st.erledigt} / ${st.gesamt}</span></div>
      <div class="progress-outer"><div class="progress-inner" style="width:${st.proz}%"></div></div>
      <p class="abi-sub" style="margin:6px 0 0;">${escapeHtml(fach.hinweis)}</p>
    </div>
    <div class="list abi-liste">
      ${fach.themen.map(([id, titel, detail, bis]) => {
        const done = !!state.abitur.themen[id];
        return `<div class="atlas-row${done ? " abi-done" : ""}">
          ${abiCheck("data-abi-thema", id, done, titel)}
          <div style="flex:1; min-width:0;"><div class="item-title">${escapeHtml(titel)}</div><div class="abi-sub">${escapeHtml(detail)}</div></div>
          ${abiBisChip(bis, done)}</div>`;
      }).join("")}
    </div>
    <p class="hint">Abhaken, wenn du das Thema ohne Heft erklären und eine Aufgabe dazu lösen kannst.</p>
  `;

  // ---------- Seminar ----------
  const k = state.abitur.kapitel;
  document.getElementById("abiSeminar").innerHTML = `
    <div class="panel-card abi-fachkopf">
      <div class="abi-leiste-kopf"><span>${abiZahl(kap.seiten)} von ${abiZahl(kap.gesamt)} Seiten geschrieben</span><span class="abi-num metal-gold abi-gross">${kap.proz} %</span></div>
      <div class="progress-outer"><div class="progress-inner" style="width:${kap.proz}%"></div></div>
      <p class="abi-sub" style="margin:6px 0 0;">Dune: Stillsuit und Holtzman-Schild · Abgabe Mo 18. / Di 19.01.</p>
    </div>
    <div class="list abi-liste">
      ${ABI_KAPITEL.map(([id, titel, seiten, bis]) => {
        const done = !!k[id];
        return `<div class="atlas-row${done ? " abi-done" : ""}">
          ${abiCheck("data-abi-kapitel", id, done, titel)}
          <div style="flex:1; min-width:0;"><div class="item-title">${escapeHtml(titel)}</div><div class="abi-sub">${seiten ? abiZahl(seiten) + (seiten === 1 ? " Seite" : " Seiten") : "kein Text, nur Feinschliff"}</div></div>
          ${abiBisChip(bis, done)}</div>`;
      }).join("")}
    </div>
  `;

  // ---------- Plan ----------
  document.getElementById("abiPlan").innerHTML = `
    <div class="list abi-liste">
      ${ABI_PHASEN.map(p => {
        const cls = heuteKey > p.bis ? " abi-vorbei" : p === phase ? " abi-aktiv" : "";
        const typ = p.typ === "druck" ? `<span class="abi-typ druck">Druck</span>` : p.typ === "ferien" ? `<span class="abi-typ ferien">Ferien</span>` : "";
        return `<div class="atlas-row abi-phase${cls}">
          <span class="abi-nr">${p.nr}</span>
          <div style="flex:1; min-width:0;">
            <div class="abi-sub">${abiKurz(p.von)} – ${abiKurz(p.bis)}${typ}</div>
            <div class="item-title">${escapeHtml(p.h)}</div>
            ${p.n ? `<div class="abi-sub">+ ${escapeHtml(p.n)}</div>` : ""}
            <div class="routine-step-note">→ ${escapeHtml(p.ziel)}</div>
          </div></div>`;
      }).join("")}
    </div>

    <h2 class="metal-gold abschnitt abi-abstand">Achtung</h2>
    <div class="abi-hinweise">
      <div class="panel-card abi-hinweis warn"><b>Do 13.05. freinehmen</b><p>Der Tag vor dem BWR-Abi ist Ochsen-Tag. Früh fragen – ebenso Himmelfahrt Do 06.05. und Do 03.06.</p></div>
      <div class="panel-card abi-hinweis warn"><b>Verteidigung + Deutsch SA 2</b><p>Verteidigung ab ~25.01., Deutsch am Di 02.02. – die Verteidigung ab Mitte Januar üben.</p></div>
      <div class="panel-card abi-hinweis warn"><b>Hochzeit 4 Tage vor Deutsch</b><p>Deutsch muss bis Do 06.05. sitzen. Danach nur noch wiederholen.</p></div>
      <div class="panel-card abi-hinweis warn"><b>Treffen vor Prüfungen verschieben</b><p>So 25.10. · Mo 07.12. · Mo 01.02. · Di 11.05. · Mo 31.05.</p></div>
      <div class="panel-card abi-hinweis"><b>Noch nicht fix</b><p>Deutsch-Kurzarbeiten, Verteidigung, mündliches Englisch, übrige Fächer. Bis dahin gilt die Joker-Regel.</p></div>
      <div class="panel-card abi-hinweis"><b>Stundenplan fehlt</b><p>Sobald er da ist, rutschen die Slots an Mo, Di und Do auf die echten Schulschlusszeiten.</p></div>
    </div>

    <h2 class="metal-gold abschnitt abi-abstand">So lernst du in den Slots</h2>
    <div class="panel-card abi-regeln">
      <p><b>Material bis 11.10. sortieren.</b> Hefte, Bücher, alte Schulaufgaben pro Fach an einen Ort; Altabiture BOS Bayern beim Fachlehrer nachfragen.</p>
      <p><b>60 Min. = 2 × 25.</b> 25 Min. arbeiten, 5 Pause, 25 arbeiten. Handy in einen anderen Raum.</p>
      <p><b>Abfragen statt Lesen.</b> Heft zu, aufschreiben, was noch da ist, dann vergleichen. Ein Thema so erklären, als müsstest du es in der Jungschar erklären.</p>
      <p><b>Altabitur ab Ostern unter Echtbedingungen.</b> Zeit stoppen, keine Hilfen, danach mit dem Lösungsschlüssel korrigieren.</p>
      <p><b>Puffer.</b> Deutsch und BWR sitzen bis 06.05., Englisch und Mathe bis Ende der Pfingstferien.</p>
    </div>

    <h2 class="metal-gold abschnitt abi-abstand">Spielregeln</h2>
    <div class="panel-card abi-regeln">
      <p><b>Stille Zeit bleibt.</b> Sie ist nicht die Zeit, die als Erstes gestrichen wird.</p>
      <p><b>Druckwoche</b> (14 Tage vor einer Prüfung): Mo und Di vor dem Treffen je 60 Min. statt 30.</p>
      <p><b>Tiefwoche:</b> jeden Tag nur 30 Min., Sonntag frei. Zählt trotzdem als gehalten.</p>
      <p><b>Mathe</b> bekommt das ganze Jahr mindestens zwei Nebenslots pro Woche.</p>
      <p><b>Joker-Regel:</b> Kündigt ein anderes Fach eine Schulaufgabe an → 10 Tage vorher 4 × 30 Min., am Vortag 1 × 60 Min. Trag sie unter „Heute → Klassenarbeiten“ ein.</p>
      <p><b>Nach Jungschar und nach dem Ochsen</b> nichts mehr. Samstag doch Arbeit: Block auf Sonntagnachmittag oder Tiefwoche.</p>
    </div>
  `;
}

// Uebernimmt die fest terminierten Pruefungen in state.exams, damit "Heute" rechtzeitig auf
// ganztaegiges Lernen umschaltet. Nur Faecher, die es gibt, nur kuenftige, nichts doppelt.
function abiTermineUebernehmen() {
  const heute = localDateKey(new Date());
  const norm = t => (t || "").trim().toLowerCase();
  let neu = 0;
  ABI_TERMINE.filter(t => t.fach && !t.offen && t.d >= heute).forEach(t => {
    const fach = state.subjects.find(s => norm(s.title) === norm(t.fach));
    if (!fach) return;
    if (state.exams.some(e => e.subjectId === fach.id && e.date === t.d)) return;
    state.exams.push({ id: uid(), subjectId: fach.id, date: t.d });
    neu++;
  });
  saveData();
  showToast(neu ? `${neu} Prüfung${neu === 1 ? "" : "en"} übernommen` : "Alle Prüfungen stehen schon drin");
  renderAll();
}

document.addEventListener("click", e => {
  const thema = e.target.closest("[data-abi-thema]");
  if (thema) {
    const id = thema.dataset.abiThema;
    if (state.abitur.themen[id]) delete state.abitur.themen[id];
    else state.abitur.themen[id] = localDateKey(new Date());
    saveData();
    renderAbitur();
    const neu = document.querySelector(`[data-abi-thema="${id}"]`);
    if (neu) neu.focus();
    return;
  }
  const kapitel = e.target.closest("[data-abi-kapitel]");
  if (kapitel) {
    const id = kapitel.dataset.abiKapitel;
    state.abitur.kapitel[id] = !state.abitur.kapitel[id];
    if (!state.abitur.kapitel[id]) delete state.abitur.kapitel[id];
    saveData();
    renderAbitur();
    const neu = document.querySelector(`[data-abi-kapitel="${id}"]`);
    if (neu) neu.focus();
    return;
  }
  const fachBtn = e.target.closest("[data-abi-fach]");
  if (fachBtn) {
    abiFachWahl = fachBtn.dataset.abiFach;
    renderAbitur();
    return;
  }
  if (e.target.closest("[data-abi-termine]")) {
    abiTermineOffen = !abiTermineOffen;
    renderAbitur();
    return;
  }
  if (e.target.closest("#abiTermineUebernehmenBtn")) {
    abiTermineUebernehmen();
    return;
  }
  if (e.target.closest("[data-open-abitur]")) {
    switchTab("abitur");
  }
});
