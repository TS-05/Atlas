// ---------- Storage ----------
const STORAGE_KEY = "habit-tracker-data-v2";

// ---------- Notfall-Absicherung: bei jedem unerwarteten Absturz sofort Rohdaten-Rettung anbieten ----------
// Steht bewusst ganz am Anfang der Datei und hängt von nichts anderem ab, damit sie auch dann noch
// funktioniert, wenn irgendein späterer Teil des Skripts abstürzt (z.B. durch eine kaputte/veraltete
// zwischengespeicherte Version auf dem Handy) und die App sonst nur einen leeren/schwarzen Bildschirm zeigt.
(function () {
  let rescueShown = false;
  function showRescue(errorInfo) {
    if (rescueShown) return;
    rescueShown = true;
    try {
      const overlay = document.createElement("div");
      overlay.style.cssText = "position:fixed;inset:0;z-index:99999;background:#12161d;color:#f1e4c8;" +
        "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;" +
        "padding:24px;box-sizing:border-box;font-family:system-ui,sans-serif;text-align:center;";
      overlay.innerHTML =
        '<div style="font-size:18px;font-weight:600;">Atlas konnte nicht vollständig laden</div>' +
        '<div style="font-size:13px;opacity:0.75;max-width:320px;">Deine Daten sind wahrscheinlich noch da. Sichere sie jetzt, bevor du etwas anderes versuchst.</div>' +
        '<button id="__rescueExportBtn" style="padding:14px 22px;border-radius:10px;border:1.5px solid #c9a94e;background:#2a2318;color:#f1e4c8;font-size:15px;font-weight:600;">Rohdaten jetzt sichern</button>' +
        '<button id="__rescueReloadBtn" style="padding:10px 18px;border-radius:10px;border:1px solid #666;background:transparent;color:#f1e4c8;font-size:13px;">Neu laden versuchen</button>';
      document.body.appendChild(overlay);
      document.getElementById("__rescueExportBtn").addEventListener("click", () => {
        try {
          const raw = localStorage.getItem(STORAGE_KEY) || "{}";
          const blob = new Blob([raw], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "atlas-notfall-sicherung-" + localDateKey(new Date()) + ".json";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (e) {
          alert("Sicherung fehlgeschlagen: " + (e && e.message));
        }
      });
      document.getElementById("__rescueReloadBtn").addEventListener("click", () => location.reload());
    } catch (e) { /* wenn selbst das fehlschlägt, ist nichts mehr zu machen */ }
  }
  window.addEventListener("error", e => showRescue(e && e.error));
  window.addEventListener("unhandledrejection", e => showRescue(e && e.reason));
})();

// ---------- Bereiche-Struktur (Phase 7.11: zielorientiert statt enzyklopädisch) ----------
// Nicht mehr "18 allgemeine Wissensgebiete + 1 Ziele-Anhang", sondern: Tims tatsächliche
// Lebensziele SIND die Oberkategorien. Allgemeines Wissen (Kommunikation, Haushaltstechnik, Recht ...)
// taucht nur noch dort auf, wo ein konkretes Ziel es braucht (z.B. "Guter Ehemann werden" -> Kommunikation).
// Format: { title, priority?, children: [ "Blatt" | {title, children:[...]} , ... ] } — beliebig tief verschachtelbar.

// Ordnerstruktur der Seminararbeit, aus der im Vault hinterlegten Seminararbeit_Roadmap.md übernommen.
// Eigene Konstante (statt inline in LEBENSWISSEN), damit migrateSeminararbeitRoadmap() dieselbe Struktur
// auch nachträglich unter einen bereits bestehenden Seminararbeit-Knoten hängen kann.
const SEMINARARBEIT_ROADMAP_CHILDREN = [
  "Themenfindung & Vorbereitung",
  { title: "Recherche", children: ["Stillsuit-Recherche", "Schild-Recherche", "Exzerpte & Belege"] },
  { title: "Kapitel 2 – Stillsuit schreiben", children: ["Energiegewinnung", "Wasseraufbereitung", "Thermoregulation", "Bewertung & Fazit Stillsuit"] },
  { title: "Kapitel 3 – Holtzman-Schild schreiben", children: ["Geschwindigkeitsabhängige Durchlässigkeit", "Absorption kinetischer Energie", "Sauerstoffaustausch", "Optisches Verhalten", "Bewertung & Fazit Schild"] },
  "Rahmen & Vollfassung",
  "Überarbeitung & Layout",
  "Präsentation bauen & üben",
  "Ruhephase Schuljahr",
  "Zwischenpräsentation & Teilausfertigung",
  "Feinschliff bei Bedarf",
  "Abgabe",
  "Verteidigung vorbereiten",
  "Verteidigung"
];

const LEBENSWISSEN = [
  { title: "Glaube", priority: true, children: [
    "Grundlagen des christlichen Glaubens",
    "Theologische Grundbegriffe",
    "Die einzelnen Bibelbücher",
    "Historischer/kultureller Hintergrund",
    "Gebet (Formen, Praxis)",
    "Gemeindeleben & geistliche Gemeinschaft",
    "Predigtreifes Bibelwissen (Homiletik)",
    "Mentor-Beziehung (ab September)",
    "Vorbild in der Gemeinde sein",
    "Selbst Mentor werden (später)",
    "Jährliche Bibellese (ab 2027)"
  ]},
  { title: "Karriere", children: [
    { title: "Schule", children: [
      { title: "Seminararbeit (wissenschaftliches Schreiben, Recherche, Zitieren)", children: SEMINARARBEIT_ROADMAP_CHILDREN },
      "Lerntechniken & Prüfungsvorbereitung",
      "Mündliche Beteiligung & Rhetorik"
    ]},
    { title: "Studium", children: [
      "Mechatronik-Grundlagen",
      "Wirtschaftsingenieurwesen-Grundlagen (Alternative)",
      "Englisch C1"
    ]},
    { title: "Job (Technischer Projektmanager)", children: [
      "Projektmanagement-Methoden",
      "Projektmanagement-Zertifizierungen",
      "Stakeholder-Kommunikation & Führung",
      "Bewerbungsgespräche"
    ]},
    { title: "Selbstständigkeit", children: [
      "Rechtliches (Firmengründung, Rechtsform)",
      "Steuerrecht für Unternehmer",
      "Businessplan-Erstellung"
    ]}
  ]},
  { title: "Vermögen", children: [
    { title: "Finanzielle Unabhängigkeit", children: [
      "Vermögensaufbau-Strategien (ETFs, Diversifikation)",
      "Budget & Sparen"
    ]},
    { title: "Immobilien im Ausland", children: [
      "Rechtliches in Deutschland zum Thema",
      "Rechtliches im entsprechenden Land zum Thema",
      "Finanzierung & Rendite-Berechnung"
    ]}
  ]},
  { title: "Ehe", children: [
    "Verlobung mit Ramona",
    "Ehevorbereitung (biblisches Eheverständnis, Konfliktlösung als Paar)",
    { title: "Guter Ehemann werden", children: [
      "Kommunikation",
      "Selbstständiges Klarkommen (Haushaltstechnik: Kochen, Putzen, Wäsche, Organisation)",
      "Finanzielle Verantwortung als Familienvorstand"
    ]}
  ]},
  { title: "Familie", children: [
    "Erziehungsstile & kindliche Entwicklung",
    "Vorbereitung auf 2 oder 4 Kinder"
  ]},
  { title: "Auswandern", children: [
    "Aufenthaltsrecht & Visum (Schweiz/Skandinavien)",
    "Landessprache",
    "Arbeitsmarkt vor Ort"
  ]},
  { title: "Gesundheit & Sport", children: [
    "Ernährungsplan für Körperzusammensetzung (75→83 kg, ~10% KFA)",
    "Marathon-Vorbereitung",
    "Thai-Boxen auf hohem Niveau",
    "Körperwissen (eigener & weiblicher Körper)"
  ]},
  { title: "Kreatives Schaffen", children: [
    "Fantasy-Buchreihe (Worldbuilding, Erzähltechnik/Plot)",
    "Christliche Bücher (theologisches Schreiben)",
    "Zeichnen/Malen"
  ]},
  { title: "Musik", children: [
    "Saxofon",
    "Klavier",
    "Singen"
  ]},
  { title: "Sprachen", children: [
    "Englisch (C1)",
    "Französisch",
    "Spanisch",
    "Russisch",
    "Japanisch oder Mandarin",
    "Hebräisch",
    "Griechisch"
  ]},
  { title: "Charakter & Persönlichkeit", children: [
    "Ehrlichkeit & Integrität",
    "Disziplin & Fleiß",
    "Weisheit & Besonnenheit",
    "Charisma & Ausstrahlung",
    "Positive Lebenseinstellung",
    "Intelligenz steigern",
    "Oldtimer-Porsche"
  ]}
];

// Checklisten-Aufgaben aus der im Vault hinterlegten Seminararbeit_Roadmap.md, an ihre jeweilige
// Unterordner-Stelle im Seminararbeit-Zweig gehängt. byTitle muss die Titel dieser Roadmap bereits
// als goalNodes enthalten (aus der LEBENSWISSEN-Struktur oben aufgebaut).
function attachSeminararbeitTasks(data, byTitle) {
  const mk = (title, nodeId, done, dueDate) => {
    if (!nodeId) return;
    data.tasks.push({
      id: uid(), title, nodeId, dueDate: dueDate || null, dueTime: null,
      done: !!done, completedAt: done ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(), size: "klein", priority: 0, source: "category"
    });
  };

  const themenfindung = byTitle["Themenfindung & Vorbereitung"];
  mk("Rahmenthema „Physik in Filmen“ eingegrenzt auf Dune", themenfindung, true);
  mk("Ausschlussverfahren: Tenet (zu breit) und Ornithopter (zu komplex) verworfen", themenfindung, true);
  mk("Finales Thema festgelegt: Stillsuit + Holtzman-Schild", themenfindung, true);
  mk("Gliederungsentwurf mit Seminarlehrer absegnen lassen", themenfindung, false);
  mk("Zitierstil, Seitenzahl-Vorgabe, Deckblatt verbindlich klären", themenfindung, false);
  mk("Die 18 ausgeliehenen Bücher den Unterkapiteln zuordnen (Exzerpt-Tabelle)", themenfindung, false);
  mk("Portfolio auf bycs.de anlegen, ersten Eintrag schreiben", themenfindung, false);

  const stillsuitRecherche = byTitle["Stillsuit-Recherche"];
  mk("Energiebilanz Biomechanik (Tipler, Demtröder)", stillsuitRecherche, false);
  mk("Umkehrosmose/Filtration (Melin/Rautenbach, Nguyen)", stillsuitRecherche, false);
  mk("Thermoregulation (Baehr/Cerbe, VDI-Wärmeatlas, Parsons, Physiologie Brandes/Lang/Schmidt)", stillsuitRecherche, false);

  const schildRecherche = byTitle["Schild-Recherche"];
  mk("Scherverdickung nicht-newtonscher Fluide (Mezger, Sigloch/Oertel)", schildRecherche, false);
  mk("Impulsübertrag/Kontaktmechanik (Popov/Hess/Willert)", schildRecherche, false);
  mk("Kinetische Gastheorie (Demtröder, Tipler)", schildRecherche, false);

  const exzerpte = byTitle["Exzerpte & Belege"];
  mk("Jede Quelle mit Seitenzahl und Kernaussage exzerpieren", exzerpte, false);
  mk("Bionik/Werkstofftechnik als Fundus für Alternativkonzepte markieren", exzerpte, false);

  const kapitel2 = byTitle["Kapitel 2 – Stillsuit schreiben"];
  mk("2.1 Filmisches Konzept beschreiben", kapitel2, false);

  const energiegewinnung = byTitle["Energiegewinnung"];
  mk("Fersenpumpe: reicht Biomechanik/Energieerhaltung rechnerisch aus?", energiegewinnung, false);
  mk("Lösungsansatz: piezoelektrische Nanodrähte im Gewebe (Bewegung → Strom)", energiegewinnung, false);
  mk("Lösungsansatz: thermoelektrische Generatoren (Seebeck-Effekt) am Temperaturgradienten Haut/Wüste", energiegewinnung, false);

  const wasseraufbereitung = byTitle["Wasseraufbereitung"];
  mk("Gegenargument: Umkehrosmose-Druckproblem — Van-'t-Hoff-Gesetz, ~60 bar nötig, Fersenpumpe unwahrscheinlich ausreichend", wasseraufbereitung, false);
  mk("Gegenargument: Verdunstungs-Kondensations-Falle — 1. Hauptsatz: Netto-Kühleffekt ≈ 0", wasseraufbereitung, false);
  mk("Lösungsansatz: Graphenoxid-Nanomembranen — atomare Poren lassen H₂O durch, blockieren Na⁺/Cl⁻", wasseraufbereitung, false);

  const thermoregulationKap = byTitle["Thermoregulation"];
  mk("Zielkonflikt herausarbeiten: gegen Außenhitze isolieren vs. Körperwärme abführen", thermoregulationKap, false);
  mk("Lösungsansatz: Phasenwechselmaterialien (PCM) — Schmelzenthalpie puffert Körperwärme", thermoregulationKap, false);
  mk("Lösungsansatz: thermische Dioden — asymmetrische Wärmeleitung (Phononen-Analogon)", thermoregulationKap, false);

  const bewertungStillsuit = byTitle["Bewertung & Fazit Stillsuit"];
  mk("Gesamtbewertung: mit Metamaterialien/Nanotech tendenziell plausibler als mit reiner heutiger Technik", bewertungStillsuit, false);
  mk("Fußnoten/Zitate konsolidieren", bewertungStillsuit, false);

  const kapitel3 = byTitle["Kapitel 3 – Holtzman-Schild schreiben"];
  mk("3.1 Filmisches Konzept/Regel beschreiben", kapitel3, false);

  const geschwindigkeit = byTitle["Geschwindigkeitsabhängige Durchlässigkeit"];
  mk("Vergleich mit Scherverdickung nicht-newtonscher Fluide", geschwindigkeit, false);
  mk("Lösungsansatz: Magnetohydrodynamik — Plasmafenster + Wirbelströme/Lorentz-Kraft", geschwindigkeit, false);
  mk("Optik-Bonus: Bremsstrahlung als Erklärung für den Farbwechsel (rot/blau)", geschwindigkeit, false);

  const absorption = byTitle["Absorption kinetischer Energie"];
  mk("Gegenargument: Impulserhaltungs-Paradoxon — Rückstoß müsste Träger wegschleudern", absorption, false);
  mk("Lösungsansatz (spekulativ): lokale Raumzeitkrümmung/Alcubierre-Metrik", absorption, false);

  const sauerstoff = byTitle["Sauerstoffaustausch"];
  mk("Kinetische Gastheorie: würde der Träger im Schild ersticken?", sauerstoff, false);

  const optisch = byTitle["Optisches Verhalten"];
  mk("Gegenargument: Brechungsindex-Problem — dichtes Medium müsste Licht nach Snellius verzerren", optisch, false);
  mk("Mit Seminarlehrer absprechen, ob offiziell in die Gliederung aufgenommen wird", optisch, false);

  const bewertungSchild = byTitle["Bewertung & Fazit Schild"];
  mk("Gesamtbewertung: bleibt unrealistischer als der Anzug (Impuls-/Optikproblem ungelöst) — noch offen", bewertungSchild, false);
  mk("Fußnoten/Zitate konsolidieren", bewertungSchild, false);

  const rahmen = byTitle["Rahmen & Vollfassung"];
  mk("Kapitel 1: Problemstellung, Forschungsfrage, Methodik", rahmen, false);
  mk("Kapitel 4: Schlussbetrachtung — Gegenüberstellung Anzug/Schild", rahmen, false);
  mk("Literaturverzeichnis vollständig anlegen", rahmen, false);
  mk("Alle Fußnoten querchecken", rahmen, false);

  const ueberarbeitung = byTitle["Überarbeitung & Layout"];
  mk("Themabezug jedes Absatzes prüfen (Themaverfehlung = 0 Punkte)", ueberarbeitung, false);
  mk("Formatierung final: Schrift, Blocksatz, Seitenzahl, Deckblatt", ueberarbeitung, false);
  mk("Optional: Zwischenstand an Seminarlehrer schicken", ueberarbeitung, false);

  const praesentation = byTitle["Präsentation bauen & üben"];
  mk("Folien konzipieren: Anzug (plausibel) vs. Schild (unplausibel) als roter Faden", praesentation, false, "2026-09-13");
  mk("Folien fertig bauen, Sprechzeit einhalten", praesentation, false, "2026-09-13");
  mk("Mehrfach frei üben, Fragen des Prüfungsausschusses antizipieren", praesentation, false, "2026-09-13");
  mk("Portfolio-Einträge vervollständigen", praesentation, false, "2026-09-13");

  const ruhephase = byTitle["Ruhephase Schuljahr"];
  mk("Kein neuer Inhalt — Vorrang für Klassenarbeiten", ruhephase, false);
  mk("Präsentation 1×/Woche kurz auffrischen (10–15 Min.)", ruhephase, false);
  mk("Eventuelles Feedback nur in kleinen, begrenzten Blöcken einarbeiten", ruhephase, false);

  const zwischenpraes = byTitle["Zwischenpräsentation & Teilausfertigung"];
  mk("Teilausfertigung spätestens 13.11. abgeben (nur noch Layoutcheck)", zwischenpraes, false, "2026-11-13");
  mk("In der Woche davor: 2–3 volle Probedurchläufe", zwischenpraes, false, "2026-11-20");
  mk("Präsentation halten, Prüfungsgespräch bestehen", zwischenpraes, false, "2026-11-20");
  mk("Reflexion direkt danach ins Portfolio", zwischenpraes, false, "2026-11-20");

  const feinschliff = byTitle["Feinschliff bei Bedarf"];
  mk("Rückmeldungen in einem konzentrierten Block einarbeiten", feinschliff, false);
  mk("Portfolio inhaltlich abschließen", feinschliff, false);
  mk("Weihnachtsferien (24.12.–08.01.) bewusst als Erholung einplanen", feinschliff, false);

  const abgabe = byTitle["Abgabe"];
  mk("Letzte Rechtschreib- und Layoutkontrolle, zweite Person gegenlesen lassen", abgabe, false, "2027-01-13");
  mk("Datei-/Druckformat prüfen, Sicherungskopie anlegen", abgabe, false, "2027-01-13");
  mk("Fristgerecht einreichen, Bestätigung aufbewahren", abgabe, false, "2027-01-13");

  const verteidigungVorbereiten = byTitle["Verteidigung vorbereiten"];
  mk("Gesamte Arbeit noch einmal komplett lesen", verteidigungVorbereiten, false);
  mk("Erwartbare Fragen durchspielen (z. B. Anzug plausibel vs. Schild unplausibel)", verteidigungVorbereiten, false);
  mk("Probegespräch mit einer anderen Person simulieren", verteidigungVorbereiten, false);

  const verteidigung = byTitle["Verteidigung"];
  mk("Prüfungsgespräch ablegen — Ziel erreicht", verteidigung, false, "2027-01-25");
}

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

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Kalendertag in Ortszeit (nicht UTC) als YYYY-MM-DD — toISOString() würde nachts je nach
// Zeitzonen-Offset auf den Vortag zurückfallen und Datumsschlüssel verschieben.
function localDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return localDateKey(d);
}

// ---------- Migration: alte Ziel-Strukturen -> verschachtelte goalNodes ----------
function migrateToGoalNodes(data) {
  if (data.goalNodes) return;

  // Phase-3-Zwischenstand (flache "categories") -> Wurzel-Knoten
  if (data.categories) {
    data.goalNodes = data.categories.map(c => ({ id: c.id, parentId: null, title: c.title, priority: !!c.priority }));
    delete data.categories;
    (data.tasks || []).forEach(t => {
      if (t.categoryId !== undefined) { t.nodeId = t.categoryId; delete t.categoryId; }
      if (typeof t.priority !== "number") t.priority = t.priority === "hoch" ? 5 : 0;
    });
    (data.habits || []).forEach(h => { if (h.categoryId !== undefined) { h.nodeId = h.categoryId; delete h.categoryId; } });
    return;
  }

  if (!data.goals) { data.goalNodes = []; return; }

  // Ursprüngliche verschachtelte Ziel-Hierarchie (lang/mittel/kurz) -> generische verschachtelte Knoten
  const GOAL_TITLE_MAP = {
    "Glaube": "Glaube",
    "Schule & Studium": "Schule",
    "Fitness & Gesundheit": "Gesundheit",
    "Struktur & Routine": "Allgemein",
    "Charakter & Integrität": "Allgemein",
    "Wissen & Weiterbildung": "Bildung"
  };

  const goals = data.goals;
  const idMap = {};
  goals.forEach(g => { idMap[g.id] = uid(); });

  data.goalNodes = goals.map(g => ({
    id: idMap[g.id],
    parentId: g.parentId ? (idMap[g.parentId] || null) : null,
    title: g.level === "long" ? (GOAL_TITLE_MAP[g.title] || g.title) : g.title,
    priority: !!g.priority
  }));

  (data.tasks || []).forEach(t => {
    if (t.nodeId !== undefined) return;
    t.nodeId = t.goalId ? (idMap[t.goalId] || null) : null;
    delete t.goalId;
    if (typeof t.priority !== "number") t.priority = t.priority === "hoch" ? 5 : 0;
    if (t.source === undefined) t.source = "category";
  });

  (data.habits || []).forEach(h => {
    if (h.nodeId !== undefined) return;
    h.nodeId = h.goalId ? (idMap[h.goalId] || null) : null;
    delete h.goalId;
  });

  delete data.goals;
}

// ---------- Migration: Lebenswissen-Bereiche auf Ein-Wort-Oberbegriffe umstellen (Phase 7.5) ----------
function migrateBereicheNaming(data) {
  if (data.bereicheRestructureApplied || !data.goalNodes) return;

  const roots = () => data.goalNodes.filter(n => n.parentId === null);
  const findRoot = title => roots().find(n => n.title === title);
  const childrenOf = id => data.goalNodes.filter(n => n.parentId === id);
  const reassign = (fromId, toId) => {
    data.goalNodes.forEach(n => { if (n.parentId === fromId) n.parentId = toId; });
    (data.tasks || []).forEach(t => { if (t.nodeId === fromId) t.nodeId = toId; });
    (data.habits || []).forEach(h => { if (h.nodeId === fromId) h.nodeId = toId; });
  };
  const ensureRoot = title => findRoot(title) || (() => {
    const node = { id: uid(), parentId: null, title, priority: false };
    data.goalNodes.push(node);
    return node;
  })();
  const moveChild = (parentTitle, childTitle, newParentTitle) => {
    const parent = findRoot(parentTitle);
    if (!parent) return;
    const child = childrenOf(parent.id).find(n => n.title === childTitle);
    if (!child) return;
    child.parentId = ensureRoot(newParentTitle).id;
  };

  // 1) Root-Umbenennungen (nur exakte alte Titel)
  const RENAME_MAP = {
    "Handwerkliches & Technik im Alltag": "Technik",
    "Bürokratie & Finanzen": "Wirtschaft",
    "Handwerk & Werkstatt": "Handwerk",
    "Zukunft & Karriere": "Karriere",
    "Kunst & Kreatives": "Kunst",
    "Überleben & Sicherheit": "Sicherheit",
    "Essen & Trinken": "Genuss",
    "Digitales Leben & Sicherheit": "Digital",
    "Recht im Alltag": "Recht",
    "Beziehungen & Kommunikation": "Beziehung"
  };
  roots().forEach(n => { if (RENAME_MAP[n.title]) n.title = RENAME_MAP[n.title]; });

  // 2) Biologie aus Gesundheit heraustrennen
  ["Anatomie des Menschen", "Organsysteme", "Hormone & ihre Wirkung", "Blut & Blutwerte"]
    .forEach(t => moveChild("Gesundheit", t, "Biologie"));

  // 3) "Umgang mit Behörden & Institutionen" in "Recht" aufgehen lassen
  const behoerden = findRoot("Umgang mit Behörden & Institutionen");
  if (behoerden) {
    reassign(behoerden.id, ensureRoot("Recht").id);
    data.goalNodes = data.goalNodes.filter(n => n.id !== behoerden.id);
  }

  // 4) Selbstschutz/Selbstverteidigung/Rasieren aus Technik heraus, in Sicherheit/Gesundheit
  moveChild("Technik", "Selbstschutz", "Sicherheit");
  moveChild("Technik", "Selbstverteidigung", "Sicherheit");
  moveChild("Technik", "Rasieren & Bartpflege", "Gesundheit");

  // 5) Immobilien/Vermögensaufbau aus Karriere in Wirtschaft
  moveChild("Karriere", "Hausbau/Immobilien", "Wirtschaft");
  moveChild("Karriere", "Finanzen & Vermögensaufbau", "Wirtschaft");

  // 6) Neue akademische Bereiche ergänzen (nur falls noch nicht vorhanden)
  const c = (title, parentId) => { const id = uid(); data.goalNodes.push({ id, parentId, title, priority: false }); return id; };
  if (!findRoot("Geschichte")) {
    const id = c("Geschichte", null);
    ["Weltgeschichte im Überblick", "Deutsche Geschichte", "Antike & Mittelalter", "Neuzeit", "Zeitgeschichte (20./21. Jahrhundert)"].forEach(t => c(t, id));
  }
  if (!findRoot("Gesellschaft")) {
    const id = c("Gesellschaft", null);
    ["Politisches System Deutschlands", "Wichtige Ideologien & Strömungen", "Aktuelle gesellschaftliche Debatten", "Wirtschaftssysteme im Überblick", "Medienkompetenz"].forEach(t => c(t, id));
  }
  if (!findRoot("Psychologie")) {
    const id = c("Psychologie", null);
    ["Grundlagen der Psychologie", "Persönlichkeitsmodelle", "Kognitive Verzerrungen", "Entwicklungspsychologie", "Motivation & Gewohnheiten", "Emotionsregulation"].forEach(t => c(t, id));
  }

  data.bereicheRestructureApplied = true;
}

// ---------- Reparatur: Ringbezüge (A ist Vorfahre von A) in goalNodes auflösen ----------
// Verhindert Endlosschleifen in allen Baum-Funktionen (nodePath, isPriority, renderTreeNode, ...).
// Ein betroffener Knoten wird zur Wurzel gemacht statt gelöscht — es geht nichts verloren.
function repairCyclicGoalNodes(data) {
  if (!data.goalNodes) return;
  const byId = new Map(data.goalNodes.map(n => [n.id, n]));
  data.goalNodes.forEach(node => {
    const seen = new Set([node.id]);
    let cur = node.parentId != null ? byId.get(node.parentId) : null;
    let guard = 0;
    while (cur && guard++ < 500) {
      if (seen.has(cur.id)) { node.parentId = null; return; }
      seen.add(cur.id);
      cur = cur.parentId != null ? byId.get(cur.parentId) : null;
    }
    if (guard >= 500) node.parentId = null;
  });
}

// ---------- Migration: "Reisen" zu "Planung" (Kernfähigkeit statt einzelner Anwendungsfall) ----------
function migrateReisenToPlanung(data) {
  if (data.planungMigrationApplied || !data.goalNodes) return;
  const roots = () => data.goalNodes.filter(n => n.parentId === null);
  const findRoot = title => roots().find(n => n.title === title);

  const reisen = findRoot("Reisen");
  if (reisen) {
    reisen.title = "Planung";
    const reiseplanungId = uid();
    data.goalNodes.push({ id: reiseplanungId, parentId: reisen.id, title: "Reiseplanung", priority: false });
    data.goalNodes.forEach(n => {
      if (n.parentId === reisen.id && n.id !== reiseplanungId) n.parentId = reiseplanungId;
    });
    const budgetNode = data.goalNodes.find(n => n.parentId === reiseplanungId && n.title === "Reiseplanung & Budget");
    if (budgetNode) budgetNode.title = "Reisebudget";
    ["Zielsetzung & Priorisierung", "Projekt-/Aufgabenplanung", "Entscheidungsfindung", "Zeitmanagement"].forEach(t => {
      data.goalNodes.push({ id: uid(), parentId: reisen.id, title: t, priority: false });
    });
  } else if (!findRoot("Planung")) {
    const planungId = uid();
    data.goalNodes.push({ id: planungId, parentId: null, title: "Planung", priority: false });
    ["Zielsetzung & Priorisierung", "Projekt-/Aufgabenplanung", "Entscheidungsfindung", "Zeitmanagement", "Reiseplanung"].forEach(t => {
      data.goalNodes.push({ id: uid(), parentId: planungId, title: t, priority: false });
    });
  }

  data.planungMigrationApplied = true;
}

// ---------- Migration: Bereiche in lernoptimaler Reihenfolge anordnen ----------
// Sortiert bestehende Bereiche/Unterordner nach LEBENSWISSEN um,
// ohne irgendwelche Eltern-Kind-Bezüge zu verändern (reine Anzeige-Reihenfolge).
function migrateLearningOrder(data) {
  if (data.learningOrderApplied || !data.goalNodes) return;
  const rootOrder = LEBENSWISSEN.map(n => n.title);
  const subOrder = {};
  function registerOrder(node) {
    if (!node.children) return;
    subOrder[node.title] = node.children.map(c => (typeof c === "string" ? c : c.title));
    node.children.forEach(c => { if (typeof c !== "string") registerOrder(c); });
  }
  LEBENSWISSEN.forEach(registerOrder);

  const byParent = new Map();
  data.goalNodes.forEach(n => {
    if (!byParent.has(n.parentId)) byParent.set(n.parentId, []);
    byParent.get(n.parentId).push(n);
  });

  function sortedChildren(parentId, orderList) {
    const kids = byParent.get(parentId) || [];
    if (!orderList) return kids;
    return kids.slice().sort((a, b) => {
      const ai = orderList.indexOf(a.title), bi = orderList.indexOf(b.title);
      return (ai === -1 ? 9999 : ai) - (bi === -1 ? 9999 : bi);
    });
  }

  const result = [];
  function walk(parentId, orderList) {
    sortedChildren(parentId, orderList).forEach(n => {
      result.push(n);
      walk(n.id, subOrder[n.title]);
    });
  }
  walk(null, rootOrder);
  data.goalNodes = result;
  data.learningOrderApplied = true;
}

// ---------- Migration: Seminararbeit-Roadmap aus dem Vault (Seminararbeit_Roadmap.md) nachrüsten ----------
// Läuft auch dann, wenn goalDrivenRestructureApplied schon gesetzt ist (der Seminararbeit-Knoten existierte
// dort bislang nur als leeres Blatt) — hängt die Unterordner + Checklisten-Aufgaben nachträglich an.
function migrateSeminararbeitRoadmap(data) {
  if (data.seminararbeitRoadmapApplied || !data.goalNodes) return;
  const seminarNode = data.goalNodes.find(n => n.title === "Seminararbeit (wissenschaftliches Schreiben, Recherche, Zitieren)");
  if (!seminarNode) { data.seminararbeitRoadmapApplied = true; return; }

  const alreadyHasChildren = data.goalNodes.some(n => n.parentId === seminarNode.id);
  if (!alreadyHasChildren) {
    const byTitle = {};
    function buildNode(node, parentId) {
      const id = uid();
      const title = typeof node === "string" ? node : node.title;
      data.goalNodes.push({ id, parentId, title, priority: false });
      byTitle[title] = id;
      const children = typeof node === "string" ? null : node.children;
      (children || []).forEach(child => buildNode(child, id));
      return id;
    }
    SEMINARARBEIT_ROADMAP_CHILDREN.forEach(child => buildNode(child, seminarNode.id));
    attachSeminararbeitTasks(data, byTitle);

    // Die alte, jetzt durch die Roadmap ersetzte Platzhalter-Aufgabe entfernen — aber nur, wenn sie nie
    // erledigt wurde (sonst würde eine echte Erledigung des Nutzers stillschweigend verschwinden).
    data.tasks = data.tasks.filter(t =>
      !(t.title === "Seminararbeit Physik in Filmen fertigstellen" && t.nodeId === seminarNode.id && !t.done)
    );
  }
  data.seminararbeitRoadmapApplied = true;
}

// ---------- Migration: von der enzyklopädischen 18er-Struktur zur zielorientierten Struktur (Phase 7.11) ----------
// "Glaube" bleibt (ID/Inhalt erhalten, nur neue Unterpunkte ergänzt). Alle anderen alten Wurzeln: wenn
// irgendwo im Teilbaum Aufgaben/Gewohnheiten hängen, werden sie unter "Archiv (alte Bereiche)" verschoben
// statt gelöscht — sonst (leere Kategorie) werden sie entfernt. Danach wird die neue Zielstruktur frisch
// aufgebaut und die bekannten Start-Aufgaben/-Gewohnheiten an ihren neuen Platz umgehängt.
function migrateToGoalDrivenStructure(data) {
  if (data.goalDrivenRestructureApplied || !data.goalNodes) return;

  function subtreeHasContent(nodeId) {
    const stack = [nodeId];
    while (stack.length) {
      const id = stack.pop();
      if ((data.tasks || []).some(t => t.nodeId === id)) return true;
      if ((data.habits || []).some(h => h.nodeId === id)) return true;
      data.goalNodes.filter(n => n.parentId === id).forEach(c => stack.push(c.id));
    }
    return false;
  }

  const oldRoots = data.goalNodes.filter(n => n.parentId === null);

  // 1) "Glaube" erhalten, nur neue Unterpunkte ergänzen
  const glaubeRoot = oldRoots.find(n => n.title === "Glaube");
  const glaubeDef = LEBENSWISSEN.find(n => n.title === "Glaube");
  if (glaubeRoot && glaubeDef) {
    const existingTitles = new Set(data.goalNodes.filter(n => n.parentId === glaubeRoot.id).map(n => n.title));
    glaubeDef.children.forEach(child => {
      const title = typeof child === "string" ? child : child.title;
      if (!existingTitles.has(title)) data.goalNodes.push({ id: uid(), parentId: glaubeRoot.id, title, priority: false });
    });
    glaubeRoot.priority = true;
  }

  // 2) Alle anderen alten Wurzeln archivieren (falls Inhalt) oder löschen (falls leer)
  let archivRootId = null;
  function ensureArchivRoot() {
    if (archivRootId) return archivRootId;
    archivRootId = uid();
    data.goalNodes.push({ id: archivRootId, parentId: null, title: "Archiv (alte Bereiche)", priority: false });
    return archivRootId;
  }
  const idsToDelete = new Set();
  oldRoots.forEach(root => {
    if (glaubeRoot && root.id === glaubeRoot.id) return;
    if (subtreeHasContent(root.id)) {
      root.parentId = ensureArchivRoot();
      root.title = root.title + " (alt)";
    } else {
      const stack = [root.id];
      idsToDelete.add(root.id);
      while (stack.length) {
        const id = stack.pop();
        data.goalNodes.filter(n => n.parentId === id).forEach(c => { idsToDelete.add(c.id); stack.push(c.id); });
      }
    }
  });
  data.goalNodes = data.goalNodes.filter(n => !idsToDelete.has(n.id));

  // 3) Neue Zielstruktur frisch aufbauen (Glaube ausgenommen, s.o.)
  const byTitle = {};
  if (glaubeRoot) {
    byTitle["Glaube"] = glaubeRoot.id;
    data.goalNodes.filter(n => n.parentId === glaubeRoot.id).forEach(n => { byTitle[n.title] = n.id; });
  }
  function buildNode(node, parentId) {
    const id = uid();
    data.goalNodes.push({ id, parentId, title: node.title, priority: !!node.priority });
    byTitle[node.title] = id;
    (node.children || []).forEach(child => {
      if (typeof child === "string") { byTitle[child] = uid(); data.goalNodes.push({ id: byTitle[child], parentId: id, title: child, priority: false }); }
      else buildNode(child, id);
    });
    return id;
  }
  LEBENSWISSEN.forEach(node => { if (node.title !== "Glaube" || !glaubeRoot) buildNode(node, null); });
  attachSeminararbeitTasks(data, byTitle);

  // 4) Bekannte Start-Aufgaben/-Gewohnheiten an ihren neuen Platz umhängen
  const reattach = {
    "Glaubenskurs \"Fest gegründet\" fertigstellen (~1,5 Std. Restaufwand)": byTitle["Glaube"],
    "Bibellese / stille Zeit": byTitle["Glaube"],
    "Abendlektüre 30 Min. vor dem Schlafen": byTitle["Glaube"],
    "Joggen 5,5 km": byTitle["Gesundheit & Sport"],
    "Ernährung im Rahmen (max. 2.000 kcal)": byTitle["Gesundheit & Sport"],
    "Lernen / Schularbeit 60–90 Min.": byTitle["Schule"],
    "Bewerbungen duales Studium abschicken": byTitle["Studium"],
    "Seminararbeit Physik in Filmen fertigstellen": byTitle["Seminararbeit (wissenschaftliches Schreiben, Recherche, Zitieren)"],
    "Lesen (ca. 1 Buch/Monat)": byTitle["Kreatives Schaffen"]
  };
  (data.tasks || []).forEach(t => { if (reattach[t.title] !== undefined) t.nodeId = reattach[t.title]; });
  (data.habits || []).forEach(h => { if (reattach[h.title] !== undefined) h.nodeId = reattach[h.title]; });

  data.goalDrivenRestructureApplied = true;
}

let state = loadData();
migrateToGoalNodes(state);
repairCyclicGoalNodes(state);
migrateBereicheNaming(state);
migrateReisenToPlanung(state);
migrateToGoalDrivenStructure(state);
migrateSeminararbeitRoadmap(state);
migrateLearningOrder(state);
repairCyclicGoalNodes(state);
state.subjects = state.subjects || [];
state.exams = state.exams || [];
state.workShifts = state.workShifts || [];
state.deviations = state.deviations || [];
state.weeklyReflection = state.weeklyReflection || {};
state.prayers = state.prayers || [];
state.subjectOverride = state.subjectOverride || {};
saveData();

const expandedNodes = new Set(); // Laufzeit-Status des Bereiche-Akkordeons (nicht persistiert)

// ---------- Seed data ----------
function seedData() {
  const data = {
    goalNodes: [], tasks: [], habits: [], subjects: [], exams: [], workShifts: [], deviations: [], weeklyReflection: {}, prayers: [],
    // Frische Seed-Daten entsprechen bereits der aktuellen Struktur — alle Migrationen sollen hier no-op sein
    bereicheRestructureApplied: true, planungMigrationApplied: true, goalDrivenRestructureApplied: true,
    seminararbeitRoadmapApplied: true, learningOrderApplied: true
  };
  const c = (title, parentId = null, priority = false) => {
    const id = uid();
    data.goalNodes.push({ id, parentId, title, priority });
    return id;
  };
  const h = (title, nodeId, frequency = "daily", extra = {}) => {
    data.habits.push({
      id: uid(), title, nodeId, history: {}, createdAt: new Date().toISOString(), frequency,
      routineOrder: extra.routineOrder ?? null,
      type: extra.type || "check"
    });
  };
  const t = (title, nodeId, dueDate, size = "klein", priority = 0) => {
    data.tasks.push({ id: uid(), title, nodeId, dueDate, dueTime: null, done: false, completedAt: null, createdAt: new Date().toISOString(), size, priority, source: "category" });
  };
  const td = (title, dueDate, size = "klein", priority = 0, done = false) => {
    data.tasks.push({
      id: uid(), title, nodeId: null, dueDate, dueTime: null, done,
      completedAt: done ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(), size, priority, source: "todo"
    });
  };
  const s = (title) => { data.subjects.push({ id: uid(), title }); };
  const pr = (title, opts = {}) => {
    data.prayers.push({
      id: uid(), title, createdAt: new Date().toISOString(),
      status: opts.fulfilledAt ? "fulfilled" : "open", deferredCount: 0,
      ...(opts.fulfilledAt ? { fulfilledAt: opts.fulfilledAt, fulfillmentText: opts.fulfillmentText || "" } : {})
    });
  };

  // Generischer Baum-Aufbau (beliebig tief, siehe LEBENSWISSEN-Format weiter oben)
  const rootId = {};
  const byTitle = {};
  function buildNode(node, parentId) {
    const id = c(node.title, parentId, !!node.priority);
    byTitle[node.title] = id;
    (node.children || []).forEach(child => {
      if (typeof child === "string") { byTitle[child] = c(child, id); }
      else buildNode(child, id);
    });
    return id;
  }
  LEBENSWISSEN.forEach(node => { rootId[node.title] = buildNode(node, null); });
  attachSeminararbeitTasks(data, byTitle);

  const glaube = rootId["Glaube"];
  h("Bibellese / stille Zeit", glaube, "daily", { routineOrder: 4 });
  h("Abendlektüre 30 Min. vor dem Schlafen", glaube, "daily", { routineOrder: 8 });
  t("Glaubenskurs \"Fest gegründet\" fertigstellen (~1,5 Std. Restaufwand)", glaube, null, "gross", 5);

  const gesundheitSport = rootId["Gesundheit & Sport"];
  h("Joggen 5,5 km", gesundheitSport, "daily", { routineOrder: 5 });
  h("Ernährung im Rahmen (max. 2.000 kcal)", gesundheitSport, "daily", { routineOrder: 10 });

  const schule = byTitle["Schule"];
  const studium = byTitle["Studium"];
  h("Lernen / Schularbeit 60–90 Min.", schule, "weekdays", { routineOrder: 6 });
  t("Bewerbungen duales Studium abschicken", studium, "2026-07-13", "gross", 5);
  s("Englisch");
  s("Deutsch");
  s("BWL");
  s("Mathe");

  // Reine Tagesroutine-Habits ohne Wissensbereich (persönlicher Alltag, kein Lernthema)
  h("Pünktlich aufstehen", null, "daily", { routineOrder: 1 });
  h("Bett gemacht & Gewicht", null, "daily", { routineOrder: 2, type: "weight" });
  h("Handy weglegen 21:30", null, "daily", { routineOrder: 7 });
  h("Skin Care & Anziehen", null, "daily", { routineOrder: 3 });
  h("Tag im Griff", null, "daily", { routineOrder: 9 });
  h("Lesen (ca. 1 Buch/Monat)", rootId["Kreatives Schaffen"], "daily");

  // Aktuelle ToDo's (Stand 21.07.2026)
  td("Montag 27.7.2026 Planen", "2026-07-21", "klein", 4);
  td("Bewerbung Porsche", "2026-07-21", "klein", 2);
  td("Bewerbung BMW", "2026-07-21", "klein", 2);
  td("Themenfrage und Gliederung abklären", "2026-07-24", "klein", 5);
  td("Portfolio ausfüllen", "2026-07-24", "gross", 4);
  td("App inhalt machen für Bereiche", "2026-07-26", "gross", 1);
  td("Fertige Gliederung", "2026-07-31", "gross", 5);
  td("Buch fertig", "2026-07-31", "gross", 5);
  td("Gefühle Kapitel 2", "2026-07-31", "klein", 2);
  td("Gefühle Kapitel 2", "2026-08-01", "klein", 2);
  td("Arbeitsheft Gefühle bis Kapitel 3", "2026-08-02", "klein", 2);
  td("Fertige Themenfrage", "2026-07-31", "gross", 5, true);
  td("Anja klären Montag 27.7.", "2026-07-21", "klein", 5, true);

  // Aktuelle Gebetsanliegen (Stand 21.07.2026)
  pr("Geld um Versicherung und Schilden zurück zu Zahlen");
  pr("Mama Papa wieder zusammen finden");
  pr("Familie gläubig");
  pr("Schlaf verbessern", { fulfilledAt: "2026-07-21T00:00:00.000Z", fulfillmentText: "Schlaf bei 100%" });

  return data;
}

// ---------- Splat-Häkchen-System (aus dem Claude-Design-Handoff, Atlas.dc.html) ----------
const SPLATS = [
  { path: 'M10,3 L11.5,6 L15,5 L13,8.5 L16.5,10 L13,11 L14.5,15 L11,13 L10,17 L8.5,13 L5,15 L7,11 L3,10 L7,8.5 L5,5 L8.5,6 Z',
    dots: [[17,3,0.8],[2,15,1],[15,17,0.6]] },
  { path: 'M9,2 L10,5 L13,3.5 L11.5,7 L16,6 L13,9.5 L18,11 L12.5,11.5 L15,15 L10,13 L11,18 L8,14 L4,17 L6.5,12.5 L1,13 L5,10 L2,7 L7,8.5 L6,4 Z',
    dots: [[18,4,0.7],[1,4,1.1],[9,19,0.8],[19,15,0.6]] },
  { path: 'M8,3 L11,4 L13,2 L13,6 L17,7 L14,9 L17,12 L13,12.5 L14,16.5 L10.5,14 L9,19 L8,15 L4,16 L6,12 L2,11.5 L5.5,9 L2.5,6.5 L7,7.5 Z',
    dots: [[18,9,1],[3,3,0.8],[16,17,0.7],[1,17,0.5]] },
  { path: 'M10,4 L12,5.5 L14,4.5 L13,7.5 L16,9 L12.5,10 L14,13.5 L11,12 L10,16 L8.5,12.5 L5,14 L7,10.5 L4,9 L7.5,7.5 L6,4.5 L9,5.5 Z',
    dots: [[16,4,0.7],[3,16,0.9]] }
];
const TAB_SPLATS = [
  SPLATS[0], SPLATS[1], SPLATS[2], SPLATS[3],
  { path: 'M9,3 L12,4.5 L14,2.5 L14,6.5 L18,7 L15,9.5 L18,13 L14,13 L15,17 L11,14.5 L9,19 L7.5,15 L3,16.5 L6,12.5 L2,10 L6.5,8.5 L4,4.5 L8,6 Z',
    dots: [[17,3,0.8],[2,17,1]] }
];
function splatFor(id) {
  // deterministischer Splat je nach (String-)ID, wie im Design-Prototyp
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) >>> 0;
  const v = SPLATS[n % SPLATS.length];
  const scale = 0.78 + ((n * 29) % 65) / 100;
  const rot = ((n * 53) % 60) - 30;
  return {
    path: v.path, dots: v.dots.map(([cx, cy, r]) => ({ cx, cy, r })),
    scale: scale.toFixed(2), rot
  };
}
function splatSvg(id) {
  const s = splatFor(id);
  return `<svg width="18" height="18" viewBox="0 0 20 20" style="overflow:visible;">
    <g transform="translate(10 10) scale(${s.scale}) rotate(${s.rot}) translate(-10 -10)">
      <path d="${s.path}" fill="url(#goldGradRing)" filter="url(#inkRough)"/>
      ${s.dots.map(d => `<circle cx="${d.cx}" cy="${d.cy}" r="${d.r}" fill="url(#goldGradRing)"/>`).join("")}
    </g>
  </svg>`;
}
const RING_MASKS = ["ring-mask-1.png", "ring-mask-2.png", "ring-mask-3.png", "ring-mask-4.png", "ring-mask-5.png", "ring-mask-6.png", "ring-mask-7.png"];
function pieSlicePath(pct) {
  const cx = 100, cy = 100, R = 105;
  if (pct >= 99.5) return "M0,0 H200 V200 H0 Z";
  if (pct <= 0.5) return `M${cx},${cy} L${cx},${cy - R} Z`;
  const endDeg = -90 + pct * 3.6;
  const endRad = endDeg * Math.PI / 180;
  const ex = (cx + R * Math.cos(endRad)).toFixed(2);
  const ey = (cy + R * Math.sin(endRad)).toFixed(2);
  const largeArc = pct > 50 ? 1 : 0;
  return `M${cx},${cy} L${cx},${cy - R} A${R},${R} 0 ${largeArc} 1 ${ex},${ey} Z`;
}

// Kleiner, wiederverwendbarer Fortschritts-Ring (z.B. pro Bereiche-Ordner) im selben Gold-Look wie der Wochenkreis
function miniProgressRing(pct, size = 30) {
  const inner = Math.round(size * 0.68);
  const fontSize = Math.max(8, Math.round(size * 0.28));
  return `
    <div style="position:relative; width:${size}px; height:${size}px; flex-shrink:0;">
      <div style="position:absolute; inset:0; border-radius:50%; background:conic-gradient(from -90deg,
        var(--color-accent-300) 0%, var(--color-accent-600) ${pct}%, var(--color-neutral-800) ${pct}% 100%);"></div>
      <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center;">
        <div style="width:${inner}px; height:${inner}px; border-radius:50%; background:var(--color-surface); display:flex; align-items:center; justify-content:center; font-size:${fontSize}px; font-family:var(--font-heading); color:var(--color-accent-200);">${pct}%</div>
      </div>
    </div>
  `;
}

// Anlassfarben von Stahl: 0-2 Budget-Einheiten = grau (füllt den Ring), danach Farbwechsel bei Überschuss
const STEEL_STAGES = [
  { min: 0, color: "#8a93a3", glow: false }, // stahlgrau
  { min: 2, color: "#e8d577", glow: false }, // strohgelb
  { min: 3, color: "#d4af37", glow: false }, // gold
  { min: 4, color: "#8b5a2b", glow: false }, // braun/kupfer
  { min: 5, color: "#7b3f61", glow: false }, // purpur
  { min: 6, color: "#3b5b92", glow: false }, // blau
  { min: 7, color: "#ff6a3d", glow: true }   // glühend
];
function steelStageFor(budget) {
  let stage = STEEL_STAGES[0];
  STEEL_STAGES.forEach(s => { if (budget >= s.min) stage = s; });
  return stage;
}
// Metallischer Ring-Farbverlauf im selben 7-Stop-Muster wie der Wochenkreis (dunkel-hell-mittel-hell-dunkel-hell-dunkel),
// aber für eine beliebige Anlassfarbe statt fix Gold — so bekommt jede Stahl-Stufe denselben glänzenden Metall-Look.
function metallicRingGradient(base) {
  const dark = `color-mix(in srgb, ${base} 65%, black)`;
  const light = `color-mix(in srgb, ${base} 55%, white)`;
  const lighter = `color-mix(in srgb, ${base} 80%, white)`;
  return `conic-gradient(from -90deg, ${dark} 0%, ${lighter} 16.6%, ${base} 33.3%, ${light} 50%, ${dark} 66.6%, ${lighter} 83.3%, ${dark} 100%)`;
}

// ToDo-Ring: exakt dieselbe Ring-Masken-Technik wie der Wochenkreis (renderWeekCircle), nur füllt er sich
// pro erledigter Aufgabe (klein = halb, groß = ganz) statt nach Tagesroutine-Quote, und startet metallisch
// stahlgrau glänzend, um sich bei Überschuss durch die Anlassfarben von heißem Stahl bis zum Glühen zu verändern.
function dayBudgetRing(dueCount, doneCount, budget, size = 200) {
  const pct = Math.min(100, Math.round((budget / 2) * 100));
  const stage = steelStageFor(budget);
  const today = new Date();
  const todayIdx = (today.getDay() + 6) % 7;
  const maskUrl = `assets/${RING_MASKS[todayIdx]}`;
  const percentMask = conicPercentMask(pct);
  const gradient = metallicRingGradient(stage.color);
  const glowBlur = stage.glow ? 14 : 5;
  const glowPct = stage.glow ? 90 : 50;

  return `
    <div style="display:flex; justify-content:center; margin-bottom:16px;">
      <div style="position:relative; width:${size}px; height:${size}px;">
        <div style="position:absolute; inset:0;
          background:rgba(255,255,255,0.16);
          -webkit-mask-image:url('${maskUrl}'); -webkit-mask-size:100% 100%; -webkit-mask-repeat:no-repeat; -webkit-mask-position:center;
          mask-image:url('${maskUrl}'); mask-size:100% 100%; mask-repeat:no-repeat; mask-position:center;"></div>
        <div style="position:absolute; inset:0;
          background:${gradient};
          -webkit-mask-image:url('${maskUrl}'), ${percentMask}; -webkit-mask-size:100% 100%, 100% 100%; -webkit-mask-repeat:no-repeat, no-repeat; -webkit-mask-position:center, center; -webkit-mask-composite:source-in;
          mask-image:url('${maskUrl}'), ${percentMask}; mask-size:100% 100%, 100% 100%; mask-repeat:no-repeat, no-repeat; mask-position:center, center; mask-composite:intersect;
          filter:drop-shadow(0 0 ${glowBlur}px color-mix(in srgb, ${stage.color} ${glowPct}%, transparent));
          transition:filter 0.4s;"></div>
        <div style="position:absolute; inset:0;
          background:radial-gradient(circle at 32% 24%, rgba(255,255,255,0.9), transparent 55%);
          mix-blend-mode:overlay; opacity:0.6;
          -webkit-mask-image:url('${maskUrl}'), ${percentMask}; -webkit-mask-size:100% 100%, 100% 100%; -webkit-mask-repeat:no-repeat, no-repeat; -webkit-mask-position:center, center; -webkit-mask-composite:source-in;
          mask-image:url('${maskUrl}'), ${percentMask}; mask-size:100% 100%, 100% 100%; mask-repeat:no-repeat, no-repeat; mask-position:center, center; mask-composite:intersect;"></div>
        <span style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:${Math.round(size * 0.17)}px; font-family:var(--font-heading); color:var(--color-neutral-100); text-shadow:0 1px 4px rgba(0,0,0,0.6);">${dueCount}/${doneCount}</span>
      </div>
    </div>
  `;
}

// ---------- Tabs ----------
const TAB_ORDER = ["heute", "todo", "zielbereiche", "gebete", "analyse"];
const TAB_ROT = [-6, 10, -12, 7, -4];
const TAB_SCALE = [1.05, 0.92, 1.1, 0.95, 1.02];
const tabBtns = Array.from(document.querySelectorAll(".tab-btn"));
const tabIndicator = document.getElementById("tabIndicator");
let dropTimer = null;

function renderTabIndicator(idx, dropPhase) {
  const leftPct = (idx + 0.5) / TAB_ORDER.length * 100;
  tabIndicator.style.left = `calc(${leftPct}% - 28px)`;
  if (dropPhase === "flying") {
    tabIndicator.innerHTML = `
      <svg width="52" height="46" viewBox="0 0 20 20" style="overflow:visible; width:100%; height:100%;">
        <circle cx="10" cy="10" r="1.2" fill="url(#liquidBallGrad)"/>
        <circle cx="9.55" cy="9.45" r="0.4" fill="#ffffff" opacity="0.95"/>
      </svg>`;
    return;
  }
  const s = TAB_SPLATS[idx % TAB_SPLATS.length];
  const scale = TAB_SCALE[idx] || 1;
  const rot = TAB_ROT[idx] || 0;
  tabIndicator.innerHTML = `
    <svg width="52" height="46" viewBox="0 0 20 20" style="overflow:visible; width:100%; height:100%;">
      <g transform="translate(10 10) scale(${scale}) rotate(${rot}) translate(-10 -10)">
        <path d="${s.path}" fill="url(#goldGradRing)" filter="url(#inkRough)"/>
        ${s.dots.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#goldGradRing)"/>`).join("")}
      </g>
    </svg>`;
}

function switchTab(tabName) {
  const idx = TAB_ORDER.indexOf(tabName);
  tabBtns.forEach(b => b.classList.toggle("active", b.dataset.tab === tabName));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  document.getElementById("tab-" + tabName).classList.add("active");
  document.body.dataset.tab = tabName;

  if (dropTimer) clearTimeout(dropTimer);
  renderTabIndicator(idx, "flying");
  dropTimer = setTimeout(() => renderTabIndicator(idx, "settled"), 190);

  quickAddVisible = false;
  bereicheSearchVisible = false;
  bereicheSearchQuery = "";
  updateHeaderPlusButton();
  renderAll();
}

tabBtns.forEach(btn => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});
document.body.dataset.tab = "heute";
renderTabIndicator(0, "settled");

// ---------- Kopfzeile: kontextabhängiger Plus-Button ----------
const QUICK_ADD_BTN_IDS = { heute: ["addRoutineBtn", "addHabitBtn"], todo: ["addTaskBtn"] };
let quickAddVisible = false;
let bereicheSearchVisible = false;
let bereicheSearchQuery = "";
Object.values(QUICK_ADD_BTN_IDS).flat().forEach(id => {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
});

const HEADER_ICON_PLUS = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5V12.5M1.5 7H12.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const HEADER_ICON_SEARCH = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.6"/><path d="M9.5 9.5L13 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const HEADER_ICON_DOWNLOAD = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5V9.5M4 6.5L7 9.5L10 6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 11.5V12.5H12V11.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

// ---------- Lernfeldaufgaben: Aufgabentypen mit Icon (statt Klein/Groß, für source="category") ----------
const LERNTYPEN = [
  { id: "video", label: "Video schauen", icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.3"/><path d="M6 4.8L9.2 7L6 9.2V4.8Z" fill="currentColor"/></svg>' },
  { id: "podcast", label: "Podcast/Hörbuch anhören", icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 6V8M5 4V10M7 2.5V11.5M9 4V10M11.5 6V8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>' },
  { id: "buch", label: "Buch lesen", icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 3.2C6 2.4 4.3 2 2.5 2V10.5C4.3 10.5 6 10.9 7 11.7C8 10.9 9.7 10.5 11.5 10.5V2C9.7 2 8 2.4 7 3.2Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M7 3.2V11.7" stroke="currentColor" stroke-width="1.2"/></svg>' },
  { id: "artikel", label: "Artikel/Wikipedia lesen", icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2.5" y="2" width="9" height="10" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M4.5 5H9.5M4.5 7H9.5M4.5 9H7.5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>' },
  { id: "zusammenfassung", label: "Zusammenfassung schreiben", icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 11.5L3 9.3L9.3 3L11 4.7L4.7 11L2.5 11.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>' },
  { id: "erklaeren", label: "Funktionsweise erklären", icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3.5H12V8.5H6.5L4 11V8.5H2V3.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M4.5 6H9.5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>' },
  { id: "mindmap", label: "Mindmap/Diagramm erstellen", icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="4" r="1.6" stroke="currentColor" stroke-width="1.1"/><circle cx="3" cy="10.5" r="1.6" stroke="currentColor" stroke-width="1.1"/><circle cx="11" cy="10.5" r="1.6" stroke="currentColor" stroke-width="1.1"/><path d="M6 5.3L4 9.1M8 5.3L10 9.1" stroke="currentColor" stroke-width="1.1"/></svg>' },
  { id: "karteikarten", label: "Karteikarten erstellen", icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3.5" y="3.5" width="8" height="6" rx="0.8" stroke="currentColor" stroke-width="1.1"/><rect x="2" y="5" width="8" height="6" rx="0.8" fill="var(--color-surface)" stroke="currentColor" stroke-width="1.1"/></svg>' },
  { id: "quiz", label: "Quiz/Selbsttest machen", icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2.5" y="2.5" width="9" height="9" rx="1.2" stroke="currentColor" stroke-width="1.2"/><path d="M4.7 7.2L6.2 8.7L9.3 5.3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
  { id: "praktisch", label: "Praktisch üben/anwenden", icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 8.5L2 11.5L5 10.5L10.5 5L8.5 3L3 8.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M7 4.5L9 6.5" stroke="currentColor" stroke-width="1.1"/></svg>' },
  { id: "gespraech", label: "Mit jemandem sprechen/Experten fragen", icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3H8V7.5H4.5L2 9.5V3Z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/><path d="M6.5 8.5C6.9 9.6 8 10.3 9.2 10.2L12 12V8.2H10" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg>' }
];
function lerntypById(id) { return LERNTYPEN.find(l => l.id === id) || LERNTYPEN[0]; }

function updateHeaderPlusButton() {
  const tab = document.body.dataset.tab;
  const ids = QUICK_ADD_BTN_IDS[tab];
  if (ids) ids.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = quickAddVisible ? "" : "none"; });
  const prayerCard = document.getElementById("prayerAddCard");
  if (prayerCard) prayerCard.style.display = (tab === "gebete" && quickAddVisible) ? "flex" : "none";
  const searchCard = document.getElementById("bereicheSearchCard");
  if (searchCard) searchCard.style.display = (tab === "zielbereiche" && bereicheSearchVisible) ? "flex" : "none";

  const icon = document.getElementById("headerPlusIcon");
  const btn = document.getElementById("headerPlusBtn");
  if (tab === "zielbereiche") {
    icon.innerHTML = HEADER_ICON_SEARCH;
    btn.setAttribute("aria-label", "Bereiche durchsuchen");
  } else if (tab === "analyse") {
    icon.innerHTML = HEADER_ICON_DOWNLOAD;
    btn.setAttribute("aria-label", "Wochendaten herunterladen");
  } else {
    icon.innerHTML = HEADER_ICON_PLUS;
    btn.setAttribute("aria-label", "Hinzufügen");
  }
}

document.getElementById("headerPlusBtn").addEventListener("click", () => {
  const tab = document.body.dataset.tab;
  if (tab === "heute" || tab === "todo") {
    quickAddVisible = !quickAddVisible;
    updateHeaderPlusButton();
    renderAll();
  } else if (tab === "zielbereiche") {
    bereicheSearchVisible = !bereicheSearchVisible;
    if (!bereicheSearchVisible) {
      bereicheSearchQuery = "";
      document.getElementById("bereicheSearchInput").value = "";
      renderGoalBrowser();
    }
    updateHeaderPlusButton();
    if (bereicheSearchVisible) document.getElementById("bereicheSearchInput").focus();
  } else if (tab === "gebete") {
    quickAddVisible = !quickAddVisible;
    updateHeaderPlusButton();
    if (quickAddVisible) document.getElementById("prayerInput").focus();
  } else if (tab === "analyse") {
    exportWeekReview();
  }
});
document.getElementById("bereicheSearchInput").addEventListener("input", e => {
  bereicheSearchQuery = e.target.value;
  renderGoalBrowser();
});
document.getElementById("addRoutineBtn").addEventListener("click", () => openHabitModal(true));
document.getElementById("savePrayerBtn").addEventListener("click", savePrayerFromInline);
document.getElementById("prayerInput").addEventListener("keydown", e => { if (e.key === "Enter") savePrayerFromInline(); });

document.getElementById("todayLabel").textContent = new Date().toLocaleDateString("de-DE", {
  weekday: "long", day: "2-digit", month: "long", year: "numeric"
});

// ---------- Modal helper ----------
const overlay = document.getElementById("modalOverlay");
const modalBody = document.getElementById("modalBody");

function openModal(html, onMount, mode = "dialog") {
  overlay.classList.toggle("dialog-mode", mode === "dialog");
  modalBody.innerHTML = mode === "sheet" ? '<div class="modal-grabber"></div>' + html : html;
  overlay.classList.remove("hidden");
  if (onMount) onMount(modalBody);
}
function closeModal() {
  overlay.classList.add("hidden");
  modalBody.innerHTML = "";
}
overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(); });

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
function nodeProgress(node, seen = new Set()) {
  if (seen.has(node.id)) return 0;
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
    const progresses = children.map(c => nodeProgress(c, seen));
    parts.push(progresses.reduce((a, b) => a + b, 0) / progresses.length);
  }
  if (parts.length === 0) return 0;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
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

function habitCompletionRate(habit, days = 30) {
  let total = 0, done = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (new Date(habit.createdAt) > d) continue;
    if (!isScheduledToday(habit, d)) continue;
    const key = localDateKey(d);
    total++;
    if (habit.history[key]) done++;
  }
  return total === 0 ? 0 : done / total;
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
function renderTaskItem(t) {
  const today = todayStr();
  const overdue = !t.done && t.dueDate && t.dueDate < today;
  const node = nodeById(t.nodeId);
  const isLernfeld = t.source === "category" && t.learnType;
  const lerntyp = isLernfeld ? lerntypById(t.learnType) : null;
  const metaParts = isLernfeld ? [] : [t.size === "gross" ? "Groß" : "Klein"];
  if (t.dueDate) metaParts.push("fällig " + t.dueDate + (t.dueTime ? " " + t.dueTime : ""));
  if (node && !isLernfeld) metaParts.push(node.title);
  const el = document.createElement("div");
  el.className = "atlas-row" + (t.done ? " done" : "");
  el.innerHTML = `
    <button class="atlas-check${t.done ? " checked" : ""}" data-task="${t.id}">${t.done ? splatSvg(t.id) : ""}</button>
    ${isLernfeld ? `<span style="color:var(--color-accent-400); flex-shrink:0;" title="${escapeHtml(lerntyp.label)}">${lerntyp.icon}</span>` : ""}
    <div style="flex:1; min-width:0;">
      <div class="item-title">${escapeHtml(t.title)}</div>
      <div class="item-meta">${escapeHtml((isLernfeld ? [lerntyp.label, ...metaParts] : metaParts).join(" · "))}</div>
    </div>
    ${!isLernfeld && t.priority > 0 ? `<span class="atlas-chip" style="background:var(--color-accent-900); color:var(--color-accent-300);">P${t.priority}</span>` : ""}
    ${overdue ? '<span class="atlas-chip" style="background:var(--color-accent-900); color:var(--color-accent-300);">ÜBERFÄLLIG</span>' : ""}
    <button class="btn btn-icon btn-ghost" data-del-task="${t.id}" aria-label="Löschen"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 1.5L11.5 11.5M11.5 1.5L1.5 11.5" stroke="var(--color-neutral-500)" stroke-width="1.4" stroke-linecap="round"/></svg></button>
  `;
  return el;
}

function renderTodo() {
  const wrap = document.getElementById("todoList");
  wrap.innerHTML = "";

  const todoTasks = state.tasks.filter(t => (t.source || "todo") !== "category");

  const today = todayStr();
  const openTodayTasks = todoTasks.filter(t => t.dueDate === today && !t.done);
  const doneTodayTasks = todoTasks.filter(t => t.done && t.completedAt && t.completedAt.slice(0, 10) === today);
  const doneTodayBudget = doneTodayTasks.reduce((sum, t) => sum + (t.size === "gross" ? 2 : 1), 0);
  const ruleEl = document.getElementById("dayRule");
  ruleEl.innerHTML = dayBudgetRing(openTodayTasks.length, doneTodayTasks.length, doneTodayBudget);

  const openTasks = todoTasks
    .filter(t => !t.done)
    .sort((a, b) => {
      const ad = a.dueDate || "9999-99-99", bd = b.dueDate || "9999-99-99";
      if (ad !== bd) return ad.localeCompare(bd);
      return (b.priority || 0) - (a.priority || 0);
    });
  const doneTasks = todoTasks.filter(t => t.done);

  if (openTasks.length === 0 && doneTasks.length === 0) {
    wrap.innerHTML = '<div class="empty-hint">Noch keine Aufgaben angelegt.</div>';
    return;
  }
  openTasks.forEach(t => wrap.appendChild(renderTaskItem(t)));
  doneTasks.forEach(t => wrap.appendChild(renderTaskItem(t)));
}

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

function renderWeekCircle() {
  const wrap = document.getElementById("weekCircle");
  const today = new Date();
  const todayKey = todayStr();
  const todayIdx = (today.getDay() + 6) % 7; // Mo=0 ... So=6

  // Nur die Tagesroutine zählt für den Wochenkreis, weitere Gewohnheiten nicht
  const scheduled = state.habits.filter(h => h.routineOrder != null && new Date(h.createdAt) <= today && isScheduledToday(h, today));
  const done = scheduled.filter(h => {
    const v = h.history[todayKey];
    return h.type === "weight" ? (v !== undefined && v !== null) : !!v;
  }).length;
  const pct = scheduled.length ? Math.round((done / scheduled.length) * 100) : 0;

  const maskUrl = `assets/${RING_MASKS[todayIdx]}`;
  const percentMask = conicPercentMask(pct);

  wrap.title = `${todayKey}: ${scheduled.length ? done + "/" + scheduled.length + " Routine-Schritte" : "keine Routine-Schritte fällig"}`;
  wrap.innerHTML = `
    <div style="display:flex; justify-content:center; margin-bottom:30px;">
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
        <div style="position:relative; width:200px; height:200px;">
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
          <span style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:34px; font-family:var(--font-heading); color:var(--color-neutral-100); text-shadow:0 1px 4px rgba(0,0,0,0.6);">${pct}%</span>
        </div>
        <span style="font-size:11px; font-family:var(--font-heading); color:var(--color-accent-300);">${WEEKDAY_LABELS[todayIdx]}</span>
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

function dateFromKey(key) {
  return new Date(key + "T00:00:00");
}

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
        noteHtml = `<div class="routine-step-note">Heutiges Hauptfach: <strong>${subj ? escapeHtml(subj.title) : "–"}</strong>${quickAddVisible ? ' <button class="btn btn-ghost" style="font-size:11px; padding:0 4px; height:auto;" data-change-subject="1">ändern</button>' : ""}</div>`;
      }
    }

    const checkHtml = h.type === "weight"
      ? `<button class="atlas-check${doneToday ? " checked" : ""}" style="pointer-events:none;" tabindex="-1">${doneToday ? splatSvg(h.id) : ""}</button>`
      : `<button class="atlas-check${doneToday ? " checked" : ""}" data-habit="${h.id}">${doneToday ? splatSvg(h.id) : ""}</button>`;
    const weightInputHtml = h.type === "weight"
      ? `<input type="number" step="0.1" min="0" inputmode="decimal" class="input" style="width:72px; height:34px; padding:6px 8px; text-align:right;" data-weight-habit="${h.id}" placeholder="kg" value="${rawValue !== undefined && rawValue !== null ? rawValue : ""}">`
      : "";

    const el = document.createElement("div");
    el.className = "atlas-row" + (doneToday ? " done" : "");
    el.dataset.type = h.type;
    el.dataset.habitId = h.id;
    el.innerHTML = `
      ${checkHtml}
      <div style="flex:1; min-width:0;">
        <div class="item-title">${escapeHtml(h.title)}</div>
        ${noteHtml}
      </div>
      ${weightInputHtml}
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
    wrap.innerHTML = `<button class="btn btn-ghost btn-block" id="addWorkShiftBtn">+ Arbeitsschicht für heute eintragen</button>`;
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
    const doneToday = !!h.history[today];
    const streak = computeStreak(h);
    const priority = isPriority(h.nodeId);
    const el = document.createElement("div");
    el.className = "atlas-row" + (doneToday ? " done" : "");
    el.innerHTML = `
      <button class="atlas-check${doneToday ? " checked" : ""}" data-habit="${h.id}">${doneToday ? splatSvg(h.id) : ""}</button>
      <div style="flex:1; min-width:0;">
        <div class="item-title">${escapeHtml(h.title)}</div>
        <div class="item-meta">${frequencyLabel(h)} · Serie: ${streak}</div>
      </div>
      ${priority ? '<span class="atlas-chip" style="background:var(--color-accent-900); color:var(--color-accent-300);">Priorität</span>' : ""}
      <button class="btn btn-icon btn-ghost" data-del-habit="${h.id}" aria-label="Löschen"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 1.5L11.5 11.5M11.5 1.5L1.5 11.5" stroke="var(--color-neutral-500)" stroke-width="1.4" stroke-linecap="round"/></svg></button>
    `;
    habitWrap.appendChild(el);
  });
}

// ---------- Rendering: Bereiche (Akkordeon-Baum) ----------
function subtreeMatchesQuery(node, q, seen = new Set()) {
  if (seen.has(node.id)) return false;
  seen.add(node.id);
  if (node.title.toLowerCase().includes(q)) return true;
  return childNodes(node.id).some(c => subtreeMatchesQuery(c, q, seen));
}

function renderGoalBrowser() {
  const wrap = document.getElementById("goalTree");
  wrap.innerHTML = "";
  const q = bereicheSearchQuery.trim().toLowerCase();
  const roots = q ? childNodes(null).filter(n => subtreeMatchesQuery(n, q)) : childNodes(null);
  if (roots.length === 0) {
    wrap.innerHTML = q ? '<div class="empty-hint">Keine Bereiche gefunden.</div>' : '<div class="empty-hint">Noch keine Bereiche angelegt.</div>';
    return;
  }
  roots.forEach(node => wrap.appendChild(renderTreeNode(node, 0, q)));
}

function renderTreeNode(node, depth, searchQuery = "") {
  const expanded = !!searchQuery || expandedNodes.has(node.id);
  const pct = Math.round(nodeProgress(node) * 100);
  const children = searchQuery ? childNodes(node.id).filter(c => subtreeMatchesQuery(c, searchQuery)) : childNodes(node.id);
  const tasks = categoryTasksForNode(node.id);
  const priority = isPriority(node.id);

  const wrap = document.createElement("div");
  wrap.className = "card elev-sm goal-node" + (priority ? " gold-frame" : "") + (expanded ? " expanded" : "");
  wrap.style.setProperty("--depth", depth);
  wrap.style.padding = "0";

  const header = document.createElement("button");
  header.className = "goal-node-header";
  header.style.width = "100%";
  header.style.background = "none";
  header.style.border = "none";
  header.style.color = "inherit";
  header.style.font = "inherit";
  header.style.textAlign = "left";
  header.style.cursor = "pointer";
  header.dataset.toggleNode = node.id;
  header.innerHTML = `
    <div class="goal-node-header-left">
      <svg class="goal-node-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="var(--color-neutral-400)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <div class="card-title" style="font-size:14px;">${escapeHtml(node.title)}</div>
    </div>
    ${miniProgressRing(pct, depth === 0 ? 34 : 26)}
  `;
  wrap.appendChild(header);
  const meta = document.createElement("div");
  meta.className = "goal-node-meta";
  meta.textContent = `${children.length} Unterordner, ${tasks.length} Aufgabe(n)`;
  wrap.appendChild(meta);

  if (expanded) {
    const resources = document.createElement("div");
    resources.innerHTML = resourceLinksRow(node);
    wrap.appendChild(resources.firstElementChild);
    hydrateResourceLinks(node, wrap);
    if (tasks.length || children.length) {
      const body = document.createElement("div");
      body.className = "goal-node-body";
      tasks.forEach(t => body.appendChild(renderTaskItem(t)));
      wrap.appendChild(body);
    }
    if (children.length) {
      const childrenWrap = document.createElement("div");
      childrenWrap.className = "goal-node-children";
      children.forEach(child => childrenWrap.appendChild(renderTreeNode(child, depth + 1, searchQuery)));
      wrap.appendChild(childrenWrap);
    }
  }

  return wrap;
}

// ---------- Rendering: Woche ----------
function renderWeekStats() {
  const grid = document.getElementById("statsGrid");
  const totalTasks = state.tasks.length;
  const doneTasks = state.tasks.filter(t => t.done).length;
  const longestStreak = state.habits.reduce((max, h) => Math.max(max, computeStreak(h)), 0);

  grid.innerHTML = `
    <div class="stat-box"><div class="stat-num">${childNodes(null).length}</div><div class="stat-label">Zielbereiche</div></div>
    <div class="stat-box"><div class="stat-num">${doneTasks}/${totalTasks}</div><div class="stat-label">Aufgaben erledigt</div></div>
    <div class="stat-box"><div class="stat-num">${state.habits.length}</div><div class="stat-label">Gewohnheiten</div></div>
    <div class="stat-box"><div class="stat-num">${longestStreak}</div><div class="stat-label">Längste Serie</div></div>
  `;

  const completed = state.tasks.filter(t => t.done && t.completedAt);
  let onTime = 0;
  completed.forEach(t => { if (isOnTime(t)) onTime++; });
  const pct = completed.length ? Math.round((onTime / completed.length) * 100) : 0;
  document.getElementById("punctualityFill").style.width = pct + "%";
  document.getElementById("punctualityText").textContent =
    completed.length ? `${onTime} von ${completed.length} erledigten Aufgaben pünktlich (${pct}%)` : "Noch keine erledigten Aufgaben mit Termin.";

  renderActivityHeatmap();
  renderAreaLoad();
  renderMoreStats();
  renderReflection();
}

function taskCompletionRateInWindow(days) {
  const cutoff = todayStr(-days);
  const relevant = state.tasks.filter(t => t.createdAt && t.createdAt.slice(0, 10) >= cutoff);
  if (relevant.length === 0) return null;
  return relevant.filter(t => t.done).length / relevant.length;
}

function weightTrend() {
  const weightHabit = state.habits.find(h => h.type === "weight");
  if (!weightHabit) return null;
  const entries = Object.entries(weightHabit.history)
    .filter(([, v]) => typeof v === "number")
    .sort((a, b) => a[0].localeCompare(b[0]));
  if (entries.length === 0) return null;
  const latest = entries[entries.length - 1][1];
  if (entries.length === 1) return { latest, arrow: "–" };
  const prev = entries[entries.length - 2][1];
  const arrow = latest > prev ? "↑" : latest < prev ? "↓" : "–";
  return { latest, arrow };
}

function renderMoreStats() {
  const wrap = document.getElementById("moreStats");
  if (!wrap) return;

  const rate7 = taskCompletionRateInWindow(7);
  const rate30 = taskCompletionRateInWindow(30);
  const rate60 = taskCompletionRateInWindow(60);
  const devCount7 = state.deviations.filter(d => d.date >= todayStr(-7)).length;
  const devCount30 = state.deviations.filter(d => d.date >= todayStr(-30)).length;
  const prayerFulfilled = state.prayers.filter(p => p.status === "fulfilled").length;
  const weight = weightTrend();

  const boxes = [
    { num: rate7 !== null ? Math.round(rate7 * 100) + "%" : "–", label: "Aufgaben erledigt (7 Tage)" },
    { num: rate30 !== null ? Math.round(rate30 * 100) + "%" : "–", label: "Aufgaben erledigt (30 Tage)" },
    { num: rate60 !== null ? Math.round(rate60 * 100) + "%" : "–", label: "Aufgaben erledigt (60 Tage)" },
    { num: devCount7, label: "Abweichungen (7 Tage)" },
    { num: devCount30, label: "Abweichungen (30 Tage)" },
    { num: prayerFulfilled, label: "Erhörungen gesamt" },
    { num: weight ? `${weight.latest} kg ${weight.arrow}` : "–", label: "Gewichtstrend" }
  ];

  wrap.innerHTML = boxes.map(b => `
    <div class="stat-box minor"><div class="stat-num">${b.num}</div><div class="stat-label">${b.label}</div></div>
  `).join("");
}

function habitStatsWindow(habit, days) {
  let total = 0, done = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (new Date(habit.createdAt) > d) continue;
    if (!isScheduledToday(habit, d)) continue;
    total++;
    const key = localDateKey(d);
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
    const key = localDateKey(d);
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
  const scheduled = state.habits.filter(h => new Date(h.createdAt) <= dateObj && isScheduledToday(h, dateObj));
  const done = scheduled.filter(h => h.history[key]).length;
  return scheduled.length ? Math.round((done / scheduled.length) * 100) : null;
}

function renderActivityHeatmap() {
  const wrap = document.getElementById("activityHeatmap");
  if (!wrap) return;
  wrap.innerHTML = "";
  const today = new Date();
  const days = [];
  for (let i = 48; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  days.forEach(d => {
    const pct = dayCompletionPct(d);
    const cell = document.createElement("div");
    cell.className = "heatmap-cell";
    const t = pct === null ? 0 : pct / 100;
    const base = lerpColor(HEATMAP_GREY, HEATMAP_GOLD, t);
    cell.style.background = `linear-gradient(135deg, color-mix(in srgb, ${base} 100%, white 22%) 0%, ${base} 45%, color-mix(in srgb, ${base} 100%, black 25%) 100%)`;
    cell.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 2px rgba(0,0,0,0.35)";
    cell.title = `${localDateKey(d)}${pct === null ? "" : ": " + pct + "%"}`;
    cell.dataset.date = localDateKey(d);
    wrap.appendChild(cell);
  });
}

function openDaySheet(dateKey) {
  const d = dateFromKey(dateKey);
  const pct = dayCompletionPct(d);
  const weekday = d.toLocaleDateString("de-DE", { weekday: "long" });
  const dateLabel = d.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
  const levelLabel = pct === null ? "Keine Gewohnheiten an diesem Tag fällig." : `${pct}% der Aufgaben erledigt`;
  openModal(`
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <h2 style="font-size:21px; margin:0;">${weekday}, ${dateLabel}</h2>
      <button class="btn btn-icon btn-secondary" id="mCloseSheet" aria-label="Schließen">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2L12 12M12 2L2 12" stroke="var(--color-text)" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="metal-gold" style="font-size:15px; font-family:var(--font-heading); margin-top:10px;">${levelLabel}</div>
    <p class="text-muted" style="font-size:13px; margin:10px 0 0;">Detailansicht pro Tag folgt, sobald Tagesverläufe gespeichert werden.</p>
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

function renderAreaLoad() {
  const wrap = document.getElementById("areaLoad");
  if (!wrap) return;
  const roots = childNodes(null).map(n => ({ node: n, count: countTasksInSubtree(n.id) }));
  const max = Math.max(1, ...roots.map(r => r.count));
  wrap.innerHTML = roots.length
    ? roots.map(r => `
        <div class="areaload-row">
          <div class="areaload-name">${escapeHtml(r.node.title)}</div>
          <div class="areaload-bar-outer"><div class="areaload-bar-inner" style="width:${Math.round((r.count / max) * 100)}%"></div></div>
          <div class="areaload-count">${r.count}</div>
        </div>
      `).join("")
    : '<div class="empty-hint">Noch keine Bereiche angelegt.</div>';
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

// ---------- Render all ----------
function renderAll() {
  renderWeekCircle();
  renderDeviationLog();
  renderRoutineChain();
  renderWorkShiftBanner();
  renderOtherHabits();
  renderTodo();
  renderGoalBrowser();
  renderPlanning();
  renderPrayers();
  renderWeekStats();
}

// ---------- Event delegation ----------
document.addEventListener("change", e => {
  if (e.target.matches("[data-weight-habit]")) {
    const id = e.target.dataset.weightHabit;
    const habit = state.habits.find(h => h.id === id);
    const key = todayStr();
    const val = e.target.value === "" ? null : parseFloat(e.target.value);
    if (val === null || isNaN(val) || val < 0) delete habit.history[key];
    else habit.history[key] = val;
    saveData();
    renderAll();
  }
  if (e.target.matches("#reflectionText")) {
    const key = e.target.dataset.weekKey || weekStartKey();
    state.weeklyReflection[key] = e.target.value;
    saveData();
  }
});

document.addEventListener("click", e => {
  const taskCheck = e.target.closest("[data-task]");
  if (taskCheck) {
    const task = state.tasks.find(t => t.id === taskCheck.dataset.task);
    task.done = !task.done;
    task.completedAt = task.done ? new Date().toISOString() : null;
    saveData();
    renderAll();
    return;
  }
  const habitCheck = e.target.closest("[data-habit]");
  if (habitCheck) {
    const habit = state.habits.find(h => h.id === habitCheck.dataset.habit);
    const key = todayStr();
    if (habit.history[key]) delete habit.history[key];
    else habit.history[key] = true;
    saveData();
    renderAll();
    return;
  }
  if (e.target.matches("[data-del-task]")) {
    state.tasks = state.tasks.filter(t => t.id !== e.target.dataset.delTask);
    saveData(); renderAll();
  }
  if (e.target.matches("[data-del-habit]")) {
    state.habits = state.habits.filter(h => h.id !== e.target.dataset.delHabit);
    saveData(); renderAll();
  }
  const geminiBtn = e.target.closest("[data-copy-gemini]");
  if (geminiBtn) copyGeminiPrompt(geminiBtn.dataset.copyGemini, geminiBtn);
  const monthBtn = e.target.closest("[data-copy-month-prompt]");
  if (monthBtn) copyMonthTestPrompt(monthBtn.dataset.copyMonthPrompt, monthBtn);
  const cardBtn = e.target.closest("[data-copy-card-prompt]");
  if (cardBtn) copyKnowledgeCardPrompt(cardBtn.dataset.copyCardPrompt, cardBtn);
  const toggleBtn = e.target.closest("[data-toggle-node]");
  if (toggleBtn) {
    const id = toggleBtn.dataset.toggleNode;
    if (expandedNodes.has(id)) expandedNodes.delete(id); else expandedNodes.add(id);
    renderGoalBrowser();
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
  if (e.target.matches("[data-del-deviation]")) {
    state.deviations = state.deviations.filter(d => d.id !== e.target.dataset.delDeviation);
    saveData(); renderAll();
  }
  const fulfilledBtn = e.target.closest("[data-prayer-fulfilled]");
  if (fulfilledBtn) {
    openPrayerFulfillModal(fulfilledBtn.dataset.prayerFulfilled);
  }
  const deferBtn = e.target.closest("[data-prayer-defer]");
  if (deferBtn) {
    const prayer = state.prayers.find(p => p.id === deferBtn.dataset.prayerDefer);
    if (prayer) prayer.deferredCount = (prayer.deferredCount || 0) + 1;
    saveData(); renderAll();
  }
  const irrelevantBtn = e.target.closest("[data-prayer-irrelevant]");
  if (irrelevantBtn) {
    state.prayers = state.prayers.filter(p => p.id !== irrelevantBtn.dataset.prayerIrrelevant);
    saveData(); renderAll();
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

// ---------- Wissens-Ressourcen pro Bereich: echter Wikipedia-Artikel, echtes YouTube-Video, KI-Prompts ----------
const RESOURCE_ICONS = {
  wikipedia: '<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M7.5 1.5V13.5M1.5 7.5H13.5M2.7 4.2C4.8 5.6 10.2 5.6 12.3 4.2M2.7 10.8C4.8 9.4 10.2 9.4 12.3 10.8" stroke="currentColor" stroke-width="1"/></svg>',
  youtube: '<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="3.5" width="12" height="8" rx="2.2" stroke="currentColor" stroke-width="1.2"/><path d="M6.3 5.8L9.5 7.5L6.3 9.2V5.8Z" fill="currentColor"/></svg>',
  gemini: '<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1.5C7.5 4.5 9.5 6.5 12.5 6.5C9.5 6.5 7.5 8.5 7.5 11.5C7.5 8.5 5.5 6.5 2.5 6.5C5.5 6.5 7.5 4.5 7.5 1.5Z" fill="currentColor"/></svg>',
  monat: '<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="2" y="3" width="11" height="10" rx="1.2" stroke="currentColor" stroke-width="1.2"/><path d="M2 6H13M5 1.5V4M10 1.5V4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
  karte: '<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="4" y="3.5" width="9" height="6.5" rx="0.9" stroke="currentColor" stroke-width="1.1"/><rect x="2" y="5.5" width="9" height="6.5" rx="0.9" fill="var(--color-surface)" stroke="currentColor" stroke-width="1.1"/></svg>'
};

// Wikipedia: direkter Artikel statt Suchseite. Erst ein sofort funktionierender Fallback-Link
// (Direktaufruf des Titels), danach im Hintergrund per Opensearch-API auf den echten Trefferartikel
// aktualisiert (kein API-Key nötig, CORS-offen).
const wikiArticleCache = new Map();
function wikipediaFallbackUrl(title) {
  return `https://de.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}
async function resolveWikipediaUrl(title) {
  if (wikiArticleCache.has(title)) return wikiArticleCache.get(title);
  try {
    const res = await fetch(`https://de.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(title)}&limit=1&namespace=0&format=json&origin=*`);
    const data = await res.json();
    const url = (data && data[3] && data[3][0]) ? data[3][0] : wikipediaFallbackUrl(title);
    wikiArticleCache.set(title, url);
    return url;
  } catch (e) {
    return wikipediaFallbackUrl(title);
  }
}

// YouTube: ohne eigenen Data-API-Key kann kein einzelnes Video zuverlässig aufgelöst werden (keine
// key-lose offizielle Such-API). Ist ein Key hinterlegt (lokal, optional), wird direkt das Top-Video
// verlinkt; sonst ein zielgerichteter Such-Link als Fallback.
const youtubeVideoCache = new Map();
function youtubeFallbackUrl(title) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(title + " einfach erklärt")}`;
}
function getYoutubeApiKey() { return localStorage.getItem("atlas-youtube-api-key") || ""; }
async function resolveYoutubeUrl(title) {
  const key = getYoutubeApiKey();
  if (!key) return youtubeFallbackUrl(title);
  if (youtubeVideoCache.has(title)) return youtubeVideoCache.get(title);
  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&type=video&q=${encodeURIComponent(title + " erklärt")}&key=${key}`);
    const data = await res.json();
    const id = data && data.items && data.items[0] && data.items[0].id && data.items[0].id.videoId;
    const url = id ? `https://www.youtube.com/watch?v=${id}` : youtubeFallbackUrl(title);
    youtubeVideoCache.set(title, url);
    return url;
  } catch (e) {
    return youtubeFallbackUrl(title);
  }
}

function hydrateResourceLinks(node, container) {
  resolveWikipediaUrl(node.title).then(url => {
    const a = container.querySelector(`[data-wiki-link="${node.id}"]`);
    if (a) a.href = url;
  });
  resolveYoutubeUrl(node.title).then(url => {
    const a = container.querySelector(`[data-yt-link="${node.id}"]`);
    if (a) a.href = url;
  });
}

function buildGeminiQuizPrompt(node) {
  const path = nodePath(node.id).map(n => n.title).join(" / ");
  return `Stelle mir ein kurzes Quiz (5-8 Fragen) zum Thema "${node.title}" (Einordnung: ${path}). Werte danach meine Antworten aus, zeig mir konkret, wo meine Wissenslücken liegen, und erkläre mir diese Lücken verständlich.`;
}
async function copyGeminiPrompt(nodeId, btn) {
  const node = nodeById(nodeId);
  if (!node) return;
  try { await navigator.clipboard.writeText(buildGeminiQuizPrompt(node)); flashButton(btn, "✓"); }
  catch (e) { downloadText(buildGeminiQuizPrompt(node), `Quiz_${node.title.replace(/[^a-z0-9]+/gi, "_")}.txt`); }
}

function buildMonthTestPrompt(node) {
  const path = nodePath(node.id).map(n => n.title).join(" / ");
  return `Schlage mir eine konkrete, klar abgegrenzte Aufgabe vor, mit der ich das Thema "${node.title}" (Einordnung: ${path}) einen Monat lang praktisch teste bzw. anwende. Nenne mir ein messbares Ziel für den Monat und 2-3 Zwischenschritte.`;
}
async function copyMonthTestPrompt(nodeId, btn) {
  const node = nodeById(nodeId);
  if (!node) return;
  try { await navigator.clipboard.writeText(buildMonthTestPrompt(node)); flashButton(btn, "✓"); }
  catch (e) { downloadText(buildMonthTestPrompt(node), `Monatstest_${node.title.replace(/[^a-z0-9]+/gi, "_")}.txt`); }
}

function buildKnowledgeCardPrompt(node) {
  const path = nodePath(node.id).map(n => n.title).join(" / ");
  return `Erstelle mir eine kurze, gebündelte Wissens-Zusammenfassung (wie eine Karteikarte, max. 1 Seite) zum Thema "${node.title}" (Einordnung: ${path}) mit den wichtigsten Fakten, Begriffen und Zusammenhängen, die ich mir merken sollte.`;
}
async function copyKnowledgeCardPrompt(nodeId, btn) {
  const node = nodeById(nodeId);
  if (!node) return;
  try { await navigator.clipboard.writeText(buildKnowledgeCardPrompt(node)); flashButton(btn, "✓"); }
  catch (e) { downloadText(buildKnowledgeCardPrompt(node), `Karteikarte_${node.title.replace(/[^a-z0-9]+/gi, "_")}.txt`); }
}

function resourceLinksRow(node) {
  return `
    <div class="goal-node-resources" style="display:flex; gap:6px; flex-wrap:wrap; padding:0 14px 10px;">
      <a class="btn btn-icon btn-ghost" href="${wikipediaFallbackUrl(node.title)}" target="_blank" rel="noopener" title="Wikipedia-Artikel" data-wiki-link="${node.id}">${RESOURCE_ICONS.wikipedia}</a>
      <a class="btn btn-icon btn-ghost" href="${youtubeFallbackUrl(node.title)}" target="_blank" rel="noopener" title="YouTube-Erklärvideo" data-yt-link="${node.id}">${RESOURCE_ICONS.youtube}</a>
      <button class="btn btn-icon btn-ghost" data-copy-gemini="${node.id}" title="KI-Quiz-Prompt kopieren">${RESOURCE_ICONS.gemini}</button>
      <button class="btn btn-icon btn-ghost" data-copy-month-prompt="${node.id}" title="KI-Prompt für 1-Monats-Testaufgabe kopieren">${RESOURCE_ICONS.monat}</button>
      <button class="btn btn-icon btn-ghost" data-copy-card-prompt="${node.id}" title="KI-Prompt für Wissens-Zusammenfassung kopieren">${RESOURCE_ICONS.karte}</button>
    </div>
  `;
}

// ---------- Add buttons ----------
document.getElementById("addTaskBtn").addEventListener("click", () => openTaskModal());
document.getElementById("addHabitBtn").addEventListener("click", () => openHabitModal());
document.getElementById("addExamBtn").addEventListener("click", () => openExamModal());
document.getElementById("addDeviationBtn").addEventListener("click", () => {
  const input = document.getElementById("deviationInput");
  addDeviation(input.value);
  input.value = "";
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
      <label>Größe (für die Tagesregel: 2 kleine oder 1 große Aufgabe/Tag)</label>
      <select id="mTaskSize">
        <option value="klein">klein</option>
        <option value="gross">groß</option>
      </select>
    </div>
    <div class="field">
      <label>Priorität (0 = keine, 5 = höchste)</label>
      <select id="mTaskPriority">
        <option value="0">0 – keine</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
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
    body.querySelector("#mSave").addEventListener("click", () => {
      const title = body.querySelector("#mTaskTitle").value.trim();
      if (!title) return;
      const dueDate = body.querySelector("#mTaskDate").value || null;
      const dueTime = body.querySelector("#mTaskTime").value || null;
      if (isLernfeld) {
        const learnType = body.querySelector("#mTaskLernType").value;
        state.tasks.push({ id: uid(), title, nodeId: defaultNodeId, dueDate, dueTime, done: false, completedAt: null, createdAt: new Date().toISOString(), size: "klein", priority: 0, source, learnType });
        saveData();
        closeModal();
        renderAll();
        return;
      }
      const size = body.querySelector("#mTaskSize").value;
      const priority = parseInt(body.querySelector("#mTaskPriority").value, 10) || 0;
      const categorySelect = body.querySelector("#mTaskCategory");
      const nodeId = categorySelect ? categorySelect.value || null : null;
      state.tasks.push({ id: uid(), title, nodeId, dueDate, dueTime, done: false, completedAt: null, createdAt: new Date().toISOString(), size, priority, source });
      saveData();
      closeModal();
      renderAll();
    });
  });
}

function openHabitModal(forceRoutine = false) {
  openModal(`
    <h3>${forceRoutine ? "Routine-Schritt hinzufügen" : "Gewohnheit hinzufügen"}</h3>
    <div class="field">
      <label>Titel</label>
      <input type="text" id="mHabitTitle" placeholder="z.B. 30 Min lesen">
    </div>
    <div class="checkbox-row">
      <input type="checkbox" id="mHabitRoutine" ${forceRoutine ? "checked" : ""}>
      <label for="mHabitRoutine">Teil der festen Tagesroutine (Reihenfolge im Heute-Tab)</label>
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
      <input type="number" id="mHabitIntervalDays" min="2" value="3">
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
      <input type="number" id="mHabitEveryNWeeks" min="1" value="2">
    </div>
    <div class="field">
      <label>Zielbereich (optional)</label>
      <select id="mHabitCategory">
        <option value="">– keiner –</option>
        ${nodeOptionsHtml()}
      </select>
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
    freqSelect.addEventListener("change", () => {
      intervalField.style.display = freqSelect.value === "interval" ? "" : "none";
      weeklyField.style.display = freqSelect.value === "weekly-on" ? "" : "none";
    });
    body.querySelector("#mSave").addEventListener("click", () => {
      const title = body.querySelector("#mHabitTitle").value.trim();
      if (!title) return;
      const nodeId = body.querySelector("#mHabitCategory").value || null;
      const frequency = freqSelect.value;
      const extra = {};
      if (frequency === "interval") extra.intervalDays = parseInt(body.querySelector("#mHabitIntervalDays").value, 10) || 1;
      if (frequency === "weekly-on") {
        extra.weekday = parseInt(body.querySelector("#mHabitWeekday").value, 10);
        extra.everyNWeeks = parseInt(body.querySelector("#mHabitEveryNWeeks").value, 10) || 1;
      }
      const isRoutine = body.querySelector("#mHabitRoutine").checked;
      const routineOrder = isRoutine ? state.habits.reduce((max, h) => Math.max(max, h.routineOrder ?? -1), -1) + 1 : null;
      state.habits.push({ id: uid(), title, nodeId, history: {}, createdAt: new Date().toISOString(), frequency, ...extra, routineOrder, type: "check" });
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
  const examsWrap = document.getElementById("examsList");
  if (examsWrap) {
    const sorted = state.exams.slice().sort((a, b) => a.date.localeCompare(b.date));
    examsWrap.innerHTML = sorted.length
      ? sorted.map(e => {
          const subject = state.subjects.find(s => s.id === e.subjectId);
          return `
            <div class="atlas-row">
              <div style="flex:1; min-width:0;">
                <div class="item-title">${subject ? escapeHtml(subject.title) : "Unbekanntes Fach"}</div>
                <div class="item-meta">${e.date}</div>
              </div>
              <button class="btn btn-icon btn-ghost" data-del-exam="${e.id}" aria-label="Löschen"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 1.5L11.5 11.5M11.5 1.5L1.5 11.5" stroke="var(--color-neutral-500)" stroke-width="1.4" stroke-linecap="round"/></svg></button>
            </div>
          `;
        }).join("")
      : '<div class="empty-hint">Noch keine Klassenarbeiten eingetragen.</div>';
  }
}

// ---------- Gebetsanliegen ----------
const CHECK_ICON = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-300)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';
const REFRESH_ICON = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-neutral-400)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 4v3h-3M6 20v-3h3"/></svg>';
const CROSS_ICON = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-neutral-500)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

function renderPrayers() {
  const listWrap = document.getElementById("prayerList");
  const openPrayers = state.prayers.filter(p => p.status === "open");
  listWrap.innerHTML = openPrayers.length
    ? openPrayers.map(p => `
        <div class="atlas-row">
          <div style="flex:1; min-width:0;">
            <div class="item-title">${escapeHtml(p.title)}</div>
            ${p.deferredCount ? `<div class="item-meta">${p.deferredCount}× auf nächste Woche verschoben</div>` : ""}
          </div>
          <button class="btn btn-icon btn-ghost" data-prayer-fulfilled="${p.id}" title="Erfüllt" style="width:26px; height:26px;">${CHECK_ICON}</button>
          <button class="btn btn-icon btn-ghost" data-prayer-defer="${p.id}" title="Nächste Woche" style="width:26px; height:26px;">${REFRESH_ICON}</button>
          <button class="btn btn-icon btn-ghost" data-prayer-irrelevant="${p.id}" title="Nicht mehr relevant" style="width:26px; height:26px;">${CROSS_ICON}</button>
        </div>
      `).join("")
    : '<div class="empty-hint">Keine offenen Anliegen.</div>';

  const archiveWrap = document.getElementById("prayerArchive");
  const fulfilled = state.prayers
    .filter(p => p.status === "fulfilled")
    .sort((a, b) => (b.fulfilledAt || "").localeCompare(a.fulfilledAt || ""));
  archiveWrap.innerHTML = fulfilled.length
    ? fulfilled.map(p => `
        <div class="prayer-archive-entry">
          <div class="item-meta">${(p.fulfilledAt || "").slice(0, 10)}</div>
          <div class="item-title">${escapeHtml(p.title)}</div>
          ${p.fulfillmentText ? `<div class="small-text">${escapeHtml(p.fulfillmentText)}</div>` : ""}
          ${(p.attachments || []).map(a => a.type.startsWith("image/")
            ? `<img class="prayer-attachment-img" src="${a.dataUrl}" alt="${escapeHtml(a.name)}">`
            : `<a class="prayer-attachment-file" href="${a.dataUrl}" download="${escapeHtml(a.name)}">${escapeHtml(a.name)}</a>`
          ).join("")}
        </div>
      `).join("")
    : '<div class="empty-hint">Noch keine Erhörungen festgehalten.</div>';
}

function savePrayerFromInline() {
  const input = document.getElementById("prayerInput");
  const title = input.value.trim();
  if (!title) return;
  state.prayers.push({ id: uid(), title, createdAt: new Date().toISOString(), status: "open", deferredCount: 0 });
  saveData();
  input.value = "";
  quickAddVisible = false;
  document.getElementById("prayerAddCard").style.display = "none";
  renderAll();
}

function openPrayerFulfillModal(prayerId) {
  const prayer = state.prayers.find(p => p.id === prayerId);
  if (!prayer) return;
  openModal(`
    <h3>Erfüllt: ${escapeHtml(prayer.title)}</h3>
    <div class="field">
      <label>Wie wurde es erfüllt?</label>
      <textarea id="mPrayerText" class="reflection-textarea" placeholder="Was ist passiert?"></textarea>
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
      prayer.status = "fulfilled";
      prayer.fulfilledAt = new Date().toISOString();
      prayer.fulfillmentText = text;
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
    let doneCount = 0, scheduledCount = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      if (!isScheduledToday(h, d)) continue;
      scheduledCount++;
      if (h.history[fmt(d)]) doneCount++;
    }
    const streak = computeStreak(h);
    md += `- **${h.title}**: ${doneCount}/${scheduledCount} Tage · Serie: ${streak}\n`;
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

  md += `\n## Zielbereiche\n`;
  childNodes(null).forEach(node => {
    md += `- **${node.title}**${node.priority ? " (Priorität)" : ""}: ${Math.round(nodeProgress(node) * 100)}%\n`;
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
