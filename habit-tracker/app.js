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
// v2 (Stand 2026-07-25 im Vault): 5-Kapitel-Gliederung mit Seitenbudget statt der ursprünglichen
// 4-Kapitel-Fassung — Kapitel-Nummern verschoben (2->3, 3->4), "Sauerstoffaustausch" und
// "Optisches Verhalten" zu einem gemeinsamen "Optik und Atmung"-Unterpunkt verschmolzen.
const SEMINARARBEIT_ROADMAP_CHILDREN = [
  "Themenfindung & Vorbereitung",
  { title: "Recherche", children: ["Stillsuit-Recherche", "Schild-Recherche", "Exzerpte & Belege"] },
  { title: "Kapitel 3 – Stillsuit schreiben (ca. 6 Seiten)", children: [
    "Thermodynamik der Körperkühlung vs. Phasenwechselmaterialien (ca. 2 Seiten)",
    "Osmotischer Druck der Filtration vs. Graphenoxid-Membranen (ca. 1,5 Seiten)",
    "Biomechanische Energiegewinnung vs. smarte Textilien (ca. 1 Seite)",
    "Bewertung der realen Umsetzbarkeit – Stillsuit (ca. 0,5 Seiten)"
  ]},
  { title: "Kapitel 4 – Holtzman-Schild schreiben (ca. 6 Seiten)", children: [
    "Die Geschwindigkeitsbarriere: Newtonsche Mechanik vs. Magnetohydrodynamik (ca. 2 Seiten)",
    "Kinetische Absorption: Impulserhaltung vs. Raumzeitkrümmung (ca. 1,5 Seiten)",
    "Optik und Atmung: Bremsstrahlung und kinetische Gastheorie (ca. 1,5 Seiten)",
    "Bewertung der realen Umsetzbarkeit – Schild (ca. 0,5 Seiten)"
  ]},
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
      createdAt: new Date().toISOString(), size: 2, priority: 0, source: "category"
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

  const kapitel3 = byTitle["Kapitel 3 – Stillsuit schreiben (ca. 6 Seiten)"];
  mk("3.1 Filmkonzept und physiologische Grundlagen (ca. 1 Seite) — Anzugkonzept + menschlicher Wasser-/Wärmehaushalt als Vergleichsbasis", kapitel3, false);

  const thermodynamik = byTitle["Thermodynamik der Körperkühlung vs. Phasenwechselmaterialien (ca. 2 Seiten)"];
  mk("Problem: Verdunstungs-Kondensations-Falle — 1. Hauptsatz: im geschlossenen System wird beim Kondensieren dieselbe Wärme wieder frei, Netto-Kühleffekt ≈ 0", thermodynamik, false);
  mk("Problem: Stefan-Boltzmann-Gesetz — Strahlungshaushalt im Wüstenklima", thermodynamik, false);
  mk("Lösungsansatz: Phasenwechselmaterialien (PCM) — Schmelzenthalpie puffert Körperwärme ohne Temperaturanstieg", thermodynamik, false);
  mk("Lösungsansatz: Strahlungskühlung als ergänzender Mechanismus", thermodynamik, false);

  const osmotisch = byTitle["Osmotischer Druck der Filtration vs. Graphenoxid-Membranen (ca. 1,5 Seiten)"];
  mk("Problem: Umkehrosmose-Druckproblem — Van-'t-Hoff-Gesetz, ~60 bar nötig", osmotisch, false);
  mk("Problem: Abrasivität von Wüstensand für Membrantechnik", osmotisch, false);
  mk("Lösungsansatz: Graphenoxid-Nanomembranen — atomare Poren lassen H₂O durch, blockieren Na⁺/Cl⁻, senken nötigen Druck drastisch", osmotisch, false);

  const biomechanisch = byTitle["Biomechanische Energiegewinnung vs. smarte Textilien (ca. 1 Seite)"];
  mk("Problem: Fersenpumpe — reicht Biomechanik/Energieerhaltung rechnerisch aus?", biomechanisch, false);
  mk("Lösungsansatz: piezoelektrische Nanodrähte im Gewebe (Bewegung → Strom)", biomechanisch, false);
  mk("Lösungsansatz: thermoelektrische Generatoren (Seebeck-Effekt) am Temperaturgradienten Haut/Wüste", biomechanisch, false);

  const bewertungStillsuit = byTitle["Bewertung der realen Umsetzbarkeit – Stillsuit (ca. 0,5 Seiten)"];
  mk("Gesamtbewertung: mit Metamaterialien/Nanotech tendenziell plausibler als mit reiner heutiger Technik", bewertungStillsuit, false);
  mk("Fußnoten/Zitate konsolidieren", bewertungStillsuit, false);

  const kapitel4 = byTitle["Kapitel 4 – Holtzman-Schild schreiben (ca. 6 Seiten)"];
  mk("4.1 Das filmische Konzept der selektiven Barriere (ca. 0,5 Seiten) — schnelle Kinetik geblockt, langsame Bewegungen dringen durch", kapitel4, false);

  const geschwindigkeitsbarriere = byTitle["Die Geschwindigkeitsbarriere: Newtonsche Mechanik vs. Magnetohydrodynamik (ca. 2 Seiten)"];
  mk("Problem: einfaches „verdichtetes Luftfeld“ erklärt die Geschwindigkeitsschwelle nicht (Vergleich mit Scherverdickung nicht-newtonscher Fluide als Ausgangspunkt)", geschwindigkeitsbarriere, false);
  mk("Lösungsansatz: Magnetohydrodynamik — Plasmafenster + Wirbelströme/Lorentz-Kraft erklären Geschwindigkeitsschwelle", geschwindigkeitsbarriere, false);

  const kinetischeAbsorption = byTitle["Kinetische Absorption: Impulserhaltung vs. Raumzeitkrümmung (ca. 1,5 Seiten)"];
  mk("Problem: Impulserhaltungs-/Rückstoß-Paradoxon — Rückstoß müsste Träger nach Actio=Reactio wegschleudern", kinetischeAbsorption, false);
  mk("Lösungsansatz (spekulativ): lokale Raumzeitkrümmung/Alcubierre-Metrik — Projektil wird umgeleitet statt klassisch gestoppt, kein Impulsübertrag", kinetischeAbsorption, false);

  const optikAtmung = byTitle["Optik und Atmung: Bremsstrahlung und kinetische Gastheorie (ca. 1,5 Seiten)"];
  mk("Problem: Brechungsindex — dichtes Feld müsste Licht nach Snellius sichtbar brechen, widerspricht filmischer Transparenz", optikAtmung, false);
  mk("Problem: kinetische Gastheorie — würde der Träger im Schild ersticken, wenn schnelle O₂-Moleküle geblockt werden?", optikAtmung, false);
  mk("Gemeinsame Klammer: was passiert mit schnellen, kleinen Teilchen (Photonen/O₂-Moleküle) am Feld?", optikAtmung, false);
  mk("Möglicher Erklärungsansatz: Bremsstrahlung als Ursache des im Film gezeigten Farbwechsels", optikAtmung, false);

  const bewertungSchild = byTitle["Bewertung der realen Umsetzbarkeit – Schild (ca. 0,5 Seiten)"];
  mk("Gesamtbewertung: bleibt trotz kreativer Lösungsansätze grundlegend unrealistischer als der Anzug (Impuls- und Optikproblem bleiben ungelöst) — noch offen, nicht vorwegnehmen", bewertungSchild, false);
  mk("Fußnoten/Zitate konsolidieren", bewertungSchild, false);

  const rahmen = byTitle["Rahmen & Vollfassung"];
  mk("Kapitel 1: Einleitung (ca. 1 Seite) — Hinführung/Motivation, keine Forschungsfrage vorwegnehmen", rahmen, false);
  mk("Kapitel 2: Problemstellung und methodisches Vorgehen (ca. 0,5 Seiten) — Forschungsfrage + deduktiver Ansatz + Methodik-Hinweis (Film statt Roman als Primärquelle)", rahmen, false);
  mk("Kapitel 5: Schlussbetrachtung und Ausblick (ca. 1,5 Seiten) — Gegenüberstellung Anzug/Schild anhand der tatsächlichen Ergebnisse (Ausgang offen)", rahmen, false);
  mk("Literaturverzeichnis vollständig anlegen", rahmen, false);
  mk("Alle Fußnoten querchecken", rahmen, false);
  mk("Seitenbudget gegenchecken: 1 + 0,5 + 6 + 6 + 1,5 = 15 Seiten Zielumfang", rahmen, false);

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

// ---------- Migration: Seminararbeit-Roadmap v2 (5-Kapitel-Gliederung mit Seitenbudget, Stand 2026-07-25) ----------
// Ersetzt die v1-Unterordner (Kapitel 2/3, alte Unterpunkt-Titel) durch die neue Gliederung. Unterordner
// mit bereits erledigten Aufgaben werden archiviert statt gelöscht, damit keine echte Arbeit verschwindet.
function migrateSeminararbeitRoadmapV2(data) {
  if (data.seminararbeitRoadmapV2Applied || !data.goalNodes) return;
  if (!data.seminararbeitRoadmapApplied) { data.seminararbeitRoadmapV2Applied = true; return; }

  const seminarNode = data.goalNodes.find(n => n.title === "Seminararbeit (wissenschaftliches Schreiben, Recherche, Zitieren)");
  if (!seminarNode) { data.seminararbeitRoadmapV2Applied = true; return; }

  function subtreeHasDoneTask(nodeId, seen = new Set()) {
    if (seen.has(nodeId)) return false;
    seen.add(nodeId);
    if (data.tasks.some(t => t.nodeId === nodeId && t.done)) return true;
    return data.goalNodes.filter(n => n.parentId === nodeId).some(c => subtreeHasDoneTask(c.id, seen));
  }

  let archiveRootId = null;
  function ensureArchiveRoot() {
    if (archiveRootId) return archiveRootId;
    archiveRootId = uid();
    data.goalNodes.push({ id: archiveRootId, parentId: null, title: "Archiv (alte Seminararbeit-Gliederung)", priority: false });
    return archiveRootId;
  }

  const oldChildren = data.goalNodes.filter(n => n.parentId === seminarNode.id);
  const idsToDelete = new Set();
  oldChildren.forEach(child => {
    if (subtreeHasDoneTask(child.id)) {
      child.parentId = ensureArchiveRoot();
      child.title = child.title + " (alt)";
    } else {
      const stack = [child.id];
      idsToDelete.add(child.id);
      while (stack.length) {
        const id = stack.pop();
        data.goalNodes.filter(n => n.parentId === id).forEach(c => { idsToDelete.add(c.id); stack.push(c.id); });
      }
    }
  });
  if (idsToDelete.size) {
    data.tasks = data.tasks.filter(t => !idsToDelete.has(t.nodeId));
    data.goalNodes = data.goalNodes.filter(n => !idsToDelete.has(n.id));
  }

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

  data.seminararbeitRoadmapV2Applied = true;
}

// ---------- Migration: Aufgaben-Größe "klein"/"groß" -> 5-stufige Aufwandsskala ----------
function migrateTaskEffortLevels(data) {
  if (data.taskEffortLevelsApplied || !data.tasks) return;
  data.tasks.forEach(t => {
    if (typeof t.size === "string") t.size = t.size === "gross" ? 4 : 2;
  });
  data.taskEffortLevelsApplied = true;
}

// ---------- Migration: 5-stufige -> 6-stufige Aufwandsskala (neue Stufe "2-6 Std." eingefügt) ----------
// Verschiebt alte Stufe 4 ("Größere Aufgabe", halber-1 Tag) auf neu 5, alte Stufe 5 ("Große Aufgabe") auf neu 6,
// damit bereits vergebene Aufwandsstufen ihre Bedeutung behalten.
function migrateTaskEffortLevelsV2(data) {
  if (data.taskEffortLevelsV2Applied || !data.tasks) return;
  data.tasks.forEach(t => {
    if (t.size === 5) t.size = 6;
    else if (t.size === 4) t.size = 5;
  });
  data.taskEffortLevelsV2Applied = true;
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
migrateSeminararbeitRoadmapV2(state);
migrateTaskEffortLevels(state);
migrateTaskEffortLevelsV2(state);
// Einmalig: die bestehende Routine "X Lust" auf "standardmaessig erledigt" umstellen.
if (!state.xLustAutoDoneApplied) {
  const h = state.habits.find(x => x.title && x.title.trim().toLowerCase() === "x lust");
  if (h) h.autoDone = true;
  state.xLustAutoDoneApplied = true;
}
migrateLearningOrder(state);
repairCyclicGoalNodes(state);
state.subjects = state.subjects || [];
state.exams = state.exams || [];
state.workShifts = state.workShifts || [];
state.deviations = state.deviations || [];
state.weeklyReflection = state.weeklyReflection || {};
state.prayers = state.prayers || [];
state.subjectOverride = state.subjectOverride || {};
delete state.badDayMode;
delete state.minimalDayMode;
if (state.habits) state.habits.forEach(h => delete h.minVersion);
state.financeAccounts = state.financeAccounts || [];
state.financeCategories = state.financeCategories || [];
state.financeExpenses = state.financeExpenses || [];
state.savingsGoals = state.savingsGoals || [];
state.financeIncomeSources = state.financeIncomeSources || [];
state.projects = state.projects || [];
// Migration: einzelnes financeIncome (Vorgänger-Feld) in eine erste Einkommensquelle überführen.
if (state.financeIncome) {
  state.financeIncomeSources.push({ id: uid(), title: "Einkommen", amount: state.financeIncome });
  delete state.financeIncome;
}
saveData();


// ---------- Seed data ----------
function seedData() {
  const data = {
    goalNodes: [], tasks: [], habits: [], subjects: [], exams: [], workShifts: [], deviations: [], weeklyReflection: {}, prayers: [],
    financeAccounts: [], financeCategories: [], financeExpenses: [], savingsGoals: [], financeIncomeSources: [], projects: [],
    // Frische Seed-Daten entsprechen bereits der aktuellen Struktur — alle Migrationen sollen hier no-op sein
    bereicheRestructureApplied: true, planungMigrationApplied: true, goalDrivenRestructureApplied: true,
    seminararbeitRoadmapApplied: true, seminararbeitRoadmapV2Applied: true, taskEffortLevelsApplied: true, learningOrderApplied: true
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
  const t = (title, nodeId, dueDate, size = 1, priority = 0) => {
    data.tasks.push({ id: uid(), title, nodeId, dueDate, dueTime: null, done: false, completedAt: null, createdAt: new Date().toISOString(), size, priority, source: "category" });
  };
  const td = (title, dueDate, size = 1, priority = 0, done = false) => {
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
  t("Glaubenskurs \"Fest gegründet\" fertigstellen (~1,5 Std. Restaufwand)", glaube, null, 3, 5);

  const gesundheitSport = rootId["Gesundheit & Sport"];
  h("Joggen 5,5 km", gesundheitSport, "daily", { routineOrder: 5 });
  h("Ernährung im Rahmen (max. 2.000 kcal)", gesundheitSport, "daily", { routineOrder: 10 });

  const schule = byTitle["Schule"];
  const studium = byTitle["Studium"];
  h("Lernen / Schularbeit 60–90 Min.", schule, "weekdays", { routineOrder: 6 });
  t("Bewerbungen duales Studium abschicken", studium, "2026-07-13", 3, 5);
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
  td("Montag 27.7.2026 Planen", "2026-07-21", 1, 4);
  td("Bewerbung Porsche", "2026-07-21", 2, 2);
  td("Bewerbung BMW", "2026-07-21", 2, 2);
  td("Themenfrage und Gliederung abklären", "2026-07-24", 2, 5);
  td("Portfolio ausfüllen", "2026-07-24", 3, 4);
  td("App inhalt machen für Bereiche", "2026-07-26", 4, 1);
  td("Fertige Gliederung", "2026-07-31", 3, 5);
  td("Buch fertig", "2026-07-31", 5, 5);
  td("Gefühle Kapitel 2", "2026-07-31", 2, 2);
  td("Gefühle Kapitel 2", "2026-08-01", 2, 2);
  td("Arbeitsheft Gefühle bis Kapitel 3", "2026-08-02", 2, 2);
  td("Fertige Themenfrage", "2026-07-31", 3, 5, true);
  td("Anja klären Montag 27.7.", "2026-07-21", 1, 5, true);

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
    dots: [[17,3,0.8],[2,17,1]] },
  { path: 'M10,2.5 L11.5,5.5 L15,4.5 L13.5,8 L17.5,9 L14,11.5 L17,15 L12.5,14.5 L13.5,18.5 L9.5,16 L7,19.5 L6.5,15.5 L2.5,16.5 L5,12.5 L1.5,10 L5.5,9 L3.5,5 L7.5,6.5 Z',
    dots: [[18,2,0.7],[2,4,0.9],[19,17,0.6],[1,19,0.8]] }
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
// Breiter Farbklecks hinter einem erledigten Titel (ToDo-Zeilen + Roadmap-Ebene-3-Schritte) — ein
// flacher, gewischter Streifen statt eines runden Splats, mit eigenem Gradient/Filter (goldGradWide /
// inkRoughWide, siehe index.html-Defs): goldGradRing ist mit userSpaceOnUse auf 0–40 fest verankert,
// bei einem 220 Einheiten breiten Pfad lief der Großteil davon nur noch im letzten, dunklen Farbstopp
// (matschig statt golden). preserveAspectRatio="none" lässt eine einzige handgezeichnete Form auf
// jede Titellänge dehnen.
function paintStrokeSvgHtml(id) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) >>> 0;
  const flip = n % 2 === 0;
  const path = flip
    ? "M2,20 C6,10 14,7 26,8 C40,9 55,13 72,11 C95,8 110,15 128,12 C148,9 165,14 182,11 C196,9 208,13 218,19 C210,29 198,32 182,30 C165,33 148,28 128,31 C110,33 95,29 72,32 C55,34 40,30 26,32 C14,33 6,30 2,20 Z"
    : "M2,18 C8,8 17,12 31,9 C47,6 59,14 77,10 C98,15 113,8 132,13 C150,17 168,10 184,14 C198,17 210,10 218,18 C212,30 200,34 184,30 C168,34 150,27 132,31 C113,26 98,33 77,28 C59,32 47,24 31,27 C17,31 8,26 2,18 Z";
  const dots = [
    { cx: 4 + (n % 8), cy: 3 + (n % 5), r: 2.2 },
    { cx: 212 - (n % 10), cy: 34 - (n % 6), r: 1.7 },
    { cx: 202 + (n % 6), cy: 4, r: 1.3 }
  ];
  return `<svg viewBox="0 0 220 40" preserveAspectRatio="none">
    <g filter="url(#inkRoughWide)">
      <path d="${path}" fill="url(#goldGradWide)"/>
    </g>
    ${dots.map(d => `<circle cx="${d.cx}" cy="${d.cy}" r="${d.r}" fill="url(#goldGradWide)"/>`).join("")}
  </svg>`;
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

// Anlassfarben von Stahl (ohne das letzte, für "geglüht" reservierte Stadium, s.u.). Jede erledigte
// Aufgabe rückt den Ring diesen Verlauf ein Stück weiter, stufenlos ineinander übergehend statt hart
// springend — bis bei 100% (alle fällig/überfälligen erledigt) der Sonderzustand "glüht" übernimmt.
const STEEL_STAGES = [
  "#8a93a3", // stahlgrau
  "#e8d577", // strohgelb
  "#d4af37", // gold
  "#8b5a2b", // braun/kupfer
  "#7b3f61", // purpur
  "#3b5b92"  // blau
];
// t = Fortschritt 0..1 (erledigt/fällig), noch NICHT ganz fertig — die eigentliche Glut kommt separat.
function steelColorForProgress(t) {
  const clamped = Math.max(0, Math.min(0.999, t));
  const scaled = clamped * (STEEL_STAGES.length - 1);
  const i = Math.floor(scaled);
  const frac = scaled - i;
  return lerpColor(STEEL_STAGES[i], STEEL_STAGES[Math.min(i + 1, STEEL_STAGES.length - 1)], frac);
}
// Metallischer Ring-Farbverlauf im selben 7-Stop-Muster wie der Wochenkreis (dunkel-hell-mittel-hell-dunkel-hell-dunkel),
// aber für eine beliebige Anlassfarbe statt fix Gold — so bekommt jede Stahl-Stufe denselben glänzenden Metall-Look.
function metallicRingGradient(base) {
  const dark = `color-mix(in srgb, ${base} 65%, black)`;
  const light = `color-mix(in srgb, ${base} 55%, white)`;
  const lighter = `color-mix(in srgb, ${base} 80%, white)`;
  return `conic-gradient(from -90deg, ${dark} 0%, ${lighter} 16.6%, ${base} 33.3%, ${light} 50%, ${dark} 66.6%, ${lighter} 83.3%, ${dark} 100%)`;
}

// ToDo-Ring: exakt dieselbe Ring-Masken-Technik wie der Wochenkreis (renderWeekCircle). Füllstand =
// erledigte / fällige-oder-überfällige Aufgaben (bei 4 fälligen füllt jede erledigte den Ring um 25%,
// bei 5 fälligen um 20% usw. — unabhängig von Klein/Groß). Startet stahlgrau glänzend und wandert mit
// jeder erledigten Aufgabe einen Schritt weiter durch die Anlassfarben; bei 100% (alles erledigt) geht
// der Ring in einen "geglühten" Sonderzustand über: weißgelb-flüssiger Kern + orangener Halo, der über
// den Rand hinaus ausblutet, plus sanftes Pulsieren.
const MOLTEN_COLOR = "#ff2020";
const MOLTEN_HALO = "#a80000";

function dayBudgetRing(dueCount, doneCount, size = 200) {
  const t = dueCount > 0 ? doneCount / dueCount : 0;
  const pct = Math.min(100, Math.round(t * 100));
  const allDueDone = dueCount > 0 && doneCount >= dueCount;
  const baseColor = allDueDone ? MOLTEN_COLOR : steelColorForProgress(t);
  const today = new Date();
  const todayIdx = (today.getDay() + 6) % 7;
  const maskUrl = `assets/${RING_MASKS[todayIdx]}`;
  const percentMask = conicPercentMask(pct);
  // Bei 100% (glühend) denselben nahtlosen Metall-Verlauf wie sonst nutzen (erster/letzter Stop
  // identisch, kein harter Rand bei 0°) statt eines eigenen Musters mit Orange-Bändern im Ring
  // selbst — der Ring glüht einfach direkt orange-rot, kein weicher Mehrfach-Halo.
  const gradient = metallicRingGradient(baseColor);
  const glowFilter = allDueDone
    ? `drop-shadow(0 0 6px ${MOLTEN_COLOR}) drop-shadow(0 0 14px ${MOLTEN_HALO})`
    : `drop-shadow(0 0 4px color-mix(in srgb, ${baseColor} 70%, transparent)) drop-shadow(0 0 11px color-mix(in srgb, ${baseColor} 32%, transparent))`;

  return `
    <div style="display:flex; justify-content:center; margin-bottom:16px;">
      <div class="${allDueDone ? "ring-glow-pulse" : ""}" style="position:relative; width:${size}px; height:${size}px;">
        <div style="position:absolute; inset:0;
          background:rgba(255,255,255,0.16);
          -webkit-mask-image:url('${maskUrl}'); -webkit-mask-size:100% 100%; -webkit-mask-repeat:no-repeat; -webkit-mask-position:center;
          mask-image:url('${maskUrl}'); mask-size:100% 100%; mask-repeat:no-repeat; mask-position:center;"></div>
        <div style="position:absolute; inset:0;
          background:${gradient};
          -webkit-mask-image:url('${maskUrl}'), ${percentMask}; -webkit-mask-size:100% 100%, 100% 100%; -webkit-mask-repeat:no-repeat, no-repeat; -webkit-mask-position:center, center; -webkit-mask-composite:source-in;
          mask-image:url('${maskUrl}'), ${percentMask}; mask-size:100% 100%, 100% 100%; mask-repeat:no-repeat, no-repeat; mask-position:center, center; mask-composite:intersect;
          filter:${glowFilter};
          transition:filter 0.4s, background 0.4s;"></div>
        <div style="position:absolute; inset:0;
          background:radial-gradient(circle at 32% 24%, rgba(255,255,255,0.9), transparent 55%);
          mix-blend-mode:overlay; opacity:${allDueDone ? 0.85 : 0.6};
          -webkit-mask-image:url('${maskUrl}'), ${percentMask}; -webkit-mask-size:100% 100%, 100% 100%; -webkit-mask-repeat:no-repeat, no-repeat; -webkit-mask-position:center, center; -webkit-mask-composite:source-in;
          mask-image:url('${maskUrl}'), ${percentMask}; mask-size:100% 100%, 100% 100%; mask-repeat:no-repeat, no-repeat; mask-position:center, center; mask-composite:intersect;"></div>
        <span style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:${Math.round(size * 0.17)}px; font-family:var(--font-heading); color:var(--color-neutral-100); text-shadow:0 1px 4px rgba(0,0,0,0.6);">${dueCount}/${doneCount}</span>
      </div>
    </div>
  `;
}

// Budget-Ring im selben Stahl-/Glüh-Stil wie dayBudgetRing: normal ein Stahlton-Ring nach
// Ausgaben-Anteil, bei Überschreitung des Limits geht er in den weißgelb-glühenden Zustand mit
// orangenem Halo über (statt bei "alles erledigt" hier bei "Limit überschritten").
function budgetRingHtml(spent, limit, size = 40, maskIdx = 0) {
  const t = limit > 0 ? spent / limit : 0;
  const pct = Math.round(t * 100);
  const overLimit = limit > 0 && spent > limit;
  const baseColor = overLimit ? MOLTEN_COLOR : steelColorForProgress(Math.min(0.999, t));
  const maskUrl = `assets/${RING_MASKS[maskIdx % RING_MASKS.length]}`;
  const percentMask = conicPercentMask(Math.min(100, pct));
  const gradient = metallicRingGradient(baseColor);
  const glowFilter = overLimit
    ? `drop-shadow(0 0 6px ${MOLTEN_COLOR}) drop-shadow(0 0 14px ${MOLTEN_HALO})`
    : `drop-shadow(0 0 4px color-mix(in srgb, ${baseColor} 70%, transparent)) drop-shadow(0 0 11px color-mix(in srgb, ${baseColor} 32%, transparent))`;
  return `
    <div class="${overLimit ? "ring-glow-pulse" : ""}" style="position:relative; width:${size}px; height:${size}px; flex-shrink:0;">
      <div style="position:absolute; inset:0;
        background:rgba(255,255,255,0.16);
        -webkit-mask-image:url('${maskUrl}'); -webkit-mask-size:100% 100%; -webkit-mask-repeat:no-repeat; -webkit-mask-position:center;
        mask-image:url('${maskUrl}'); mask-size:100% 100%; mask-repeat:no-repeat; mask-position:center;"></div>
      <div style="position:absolute; inset:0;
        background:${gradient};
        -webkit-mask-image:url('${maskUrl}'), ${percentMask}; -webkit-mask-size:100% 100%, 100% 100%; -webkit-mask-repeat:no-repeat, no-repeat; -webkit-mask-position:center, center; -webkit-mask-composite:source-in;
        mask-image:url('${maskUrl}'), ${percentMask}; mask-size:100% 100%, 100% 100%; mask-repeat:no-repeat, no-repeat; mask-position:center, center; mask-composite:intersect;
        filter:${glowFilter};
        transition:filter 0.4s, background 0.4s;"></div>
      <div style="position:absolute; inset:0;
        background:radial-gradient(circle at 32% 24%, rgba(255,255,255,0.9), transparent 55%);
        mix-blend-mode:overlay; opacity:${overLimit ? 0.85 : 0.6};
        -webkit-mask-image:url('${maskUrl}'), ${percentMask}; -webkit-mask-size:100% 100%, 100% 100%; -webkit-mask-repeat:no-repeat, no-repeat; -webkit-mask-position:center, center; -webkit-mask-composite:source-in;
        mask-image:url('${maskUrl}'), ${percentMask}; mask-size:100% 100%, 100% 100%; mask-repeat:no-repeat, no-repeat; mask-position:center, center; mask-composite:intersect;"></div>
      <span style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:${Math.round(size * 0.24)}px; font-family:var(--font-heading); color:var(--color-neutral-100); text-shadow:0 1px 4px rgba(0,0,0,0.6);">${pct}%</span>
    </div>
  `;
}

// ---------- Tabs ----------
const TAB_ORDER = ["heute", "todo", "finanzen", "zielbereiche", "gebete", "projekte", "gym", "analyse"];
const TAB_ROT = [-6, 10, 5, -12, 7, 9, -4];
const TAB_SCALE = [1.05, 0.92, 1, 1.1, 0.95, 1.03, 1.02];
const tabBtns = Array.from(document.querySelectorAll(".tab-btn"));
const tabIndicator = document.getElementById("tabIndicator");
let dropTimer = null;

function renderTabIndicator(idx, dropPhase) {
  if (!tabIndicator) return; // Tab-Leiste ersetzt durch einen einzelnen Home-Knopf
  // Pixelwert statt CSS-%/calc, damit die Position über transform (Compositor-Thread,
  // unabhängig vom Haupt-Thread) statt über left (braucht Layout) animiert werden kann.
  const containerWidth = tabIndicator.parentElement.clientWidth;
  const leftPx = ((idx + 0.5) / TAB_ORDER.length) * containerWidth - 28;
  tabIndicator.style.transform = `translateX(${leftPx}px)`;
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
  // Auf den nächsten Frame verschoben: der Browser soll erst den Tab-Wechsel (Panel-Umschaltung +
  // Tintenklecks-Flug-Animation) zeichnen können, bevor die potenziell aufwändige Neu-Rendering-Arbeit
  // (u.a. Finanzen-Listen, Analyse-Charts) den Haupt-Thread blockiert und die Animation ruckeln lässt.
  requestAnimationFrame(() => renderAll());
}

tabBtns.forEach(btn => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});
document.body.dataset.tab = "heute";
renderTabIndicator(0, "settled");

// ---------- Kopfzeile: kontextabhängiger Plus-Button ----------
const QUICK_ADD_BTN_IDS = {
  heute: ["addRoutineBtn", "addHabitBtn", "deviationAddWrap", "addExamBtn"],
  todo: ["addTaskBtn"],
  finanzen: ["addIncomeSourceBtn", "addAccountBtn", "addSavingsGoalBtn"]
};
let quickAddVisible = false;
let bereicheSearchVisible = false;
let bereicheSearchQuery = "";

// ---------- Roadmap-Navigation (Dashboard -> Kategorie -> Pfad), rein Laufzeit-Status ----------
// Greift ausschließlich auf die bestehenden goalNodes/tasks-Datenfunktionen zu (nodeProgress,
// childNodes, categoryTasksForNode, das bestehende data-task-Toggle) — es wird keine neue
// Datenstruktur eingeführt und ToDo/Tagesroutine/Gebete bleiben davon komplett unberührt.
let roadmapView = "dashboard"; // "dashboard" | "category" | "path"
let roadmapRootId = null;
let roadmapPathId = null;
Object.values(QUICK_ADD_BTN_IDS).flat().forEach(id => {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
});

const HEADER_ICON_PLUS = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5V12.5M1.5 7H12.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const HEADER_ICON_SEARCH = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.6"/><path d="M9.5 9.5L13 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const HEADER_ICON_DOWNLOAD = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5V9.5M4 6.5L7 9.5L10 6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 11.5V12.5H12V11.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

// ---------- Lernfeldaufgaben: Aufgabentypen mit Icon (statt Klein/Groß, für source="category") ----------
// Aufwandsstufen für Aufgaben (task.size): sechs Stufen mit grobem Zeitrahmen statt nur klein/groß.
const EFFORT_LEVELS = [
  { level: 1, label: "Erster Gedanke", time: "1–5 Min." },
  { level: 2, label: "Kurzaufgabe", time: "5–30 Min." },
  { level: 3, label: "Mittlere Aufgabe", time: "30 Min. – 2 Std." },
  { level: 4, label: "Halbtagsaufgabe", time: "2–6 Std." },
  { level: 5, label: "Größere Aufgabe", time: "halber – 1 Tag" },
  { level: 6, label: "Große Aufgabe", time: "1 – 1,5 Wochen" }
];
function effortLevelInfo(size) {
  const n = typeof size === "number" ? size : (size === "gross" ? 4 : 1);
  return EFFORT_LEVELS.find(e => e.level === n) || EFFORT_LEVELS[0];
}

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
    btn.setAttribute("aria-label", "Roadmap durchsuchen");
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
  if (tab === "heute" || tab === "todo" || tab === "finanzen") {
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
  } else if (tab === "projekte") {
    openProjectModal();
  }
});
document.getElementById("bereicheSearchInput").addEventListener("input", e => {
  bereicheSearchQuery = e.target.value;
  renderGoalBrowser();
});
document.getElementById("addRoutineBtn").addEventListener("click", () => openHabitModal(true));
document.getElementById("savePrayerBtn").addEventListener("click", savePrayerFromInline);
document.getElementById("prayerInput").addEventListener("keydown", e => { if (e.key === "Enter") savePrayerFromInline(); });

let prayerAddType = "bitte";
function updatePrayerTypeButtons() {
  document.getElementById("prayerTypeBitte").classList.toggle("toggle-minimal-active", prayerAddType === "bitte");
  document.getElementById("prayerTypeDank").classList.toggle("toggle-minimal-active", prayerAddType === "dank");
}
document.getElementById("prayerTypeBitte").addEventListener("click", () => { prayerAddType = "bitte"; updatePrayerTypeButtons(); });
document.getElementById("prayerTypeDank").addEventListener("click", () => { prayerAddType = "dank"; updatePrayerTypeButtons(); });
updatePrayerTypeButtons();

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
  currentDaySheetKey = null;
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
// Klick auf die Zeile klappt die Detailansicht (Beschreibung + Metadaten) für genau dieses ToDo
// auf/zu; Doppelklick auf die Zeile hakt ab (wie der Check-Button). Rein per UI-State, nicht
// persistiert -- expandedTaskIds lebt nur im Tab-Modul, kein saveData() nötig.
const expandedTaskIds = new Set();

function renderTaskItem(t) {
  const today = todayStr();
  const overdue = !t.done && t.dueDate && t.dueDate < today;
  const node = nodeById(t.nodeId);
  const isLernfeld = t.source === "category" && t.learnType;
  const lerntyp = isLernfeld ? lerntypById(t.learnType) : null;
  const effort = effortLevelInfo(t.size);
  const metaParts = isLernfeld ? [] : [`${effort.level} · ${effort.label}`];
  if (t.dueDate) metaParts.push("fällig " + t.dueDate + (t.dueTime ? " " + t.dueTime : ""));
  if (node && !isLernfeld) metaParts.push(node.title);
  const dueToday = t.dueDate === today;
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
    <div class="atlas-row${t.done ? " done" : ""}${dueToday ? " gold-frame" : ""}" data-task-row="${t.id}">
      <button class="atlas-check${t.done ? " checked" : ""}" data-task="${t.id}">${t.done ? splatSvg(t.id) : ""}</button>
      ${isLernfeld ? `<span style="color:var(--color-accent-400); flex-shrink:0;" title="${escapeHtml(lerntyp.label)}">${lerntyp.icon}</span>` : ""}
      <div style="flex:1; min-width:0;">
        ${titleHtml}
        <div class="item-meta">${escapeHtml((isLernfeld ? [lerntyp.label, ...metaParts] : metaParts).join(" · "))}</div>
      </div>
      ${!isLernfeld && t.priority > 0 ? `<span class="atlas-chip" style="background:var(--color-accent-900); color:var(--color-accent-300);">P${t.priority}</span>` : ""}
      ${overdue ? '<span class="atlas-chip" style="background:var(--color-accent-900); color:var(--color-accent-300);">ÜBERFÄLLIG</span>' : ""}
      <button class="btn btn-icon btn-ghost" data-del-task="${t.id}" aria-label="Löschen"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 1.5L11.5 11.5M11.5 1.5L1.5 11.5" stroke="var(--color-neutral-500)" stroke-width="1.4" stroke-linecap="round"/></svg></button>
    </div>
    ${!isLernfeld && expanded ? `
    <div class="task-expand">
      <label>Beschreibung</label>
      <textarea data-task-notes="${t.id}" rows="3" placeholder="Details, Kontext, nächste Schritte…">${escapeHtml(t.notes || "")}</textarea>
      <div class="task-expand-meta">
        <span>Aufwand: ${effort.level} · ${escapeHtml(effort.label)} (${escapeHtml(effort.time)})</span>
        ${t.dueDate ? `<span>Fällig: ${t.dueDate}${t.dueTime ? " · " + t.dueTime : ""}</span>` : ""}
        ${t.priority > 0 ? `<span>Priorität: ${t.priority}</span>` : ""}
        ${node ? `<span>Zielbereich: ${escapeHtml(node.title)}</span>` : ""}
      </div>
    </div>` : ""}
  `;
  return el;
}

function renderTodo() {
  const wrap = document.getElementById("todoList");
  wrap.innerHTML = "";

  const todoTasks = state.tasks.filter(t => (t.source || "todo") !== "category");

  const today = todayStr();
  // Ring-Füllung + mittige Zahl + Glüh-Bedingung: heute fällige oder überfällige Aufgaben / davon abgehakte.
  // Jede erledigte Aufgabe füllt 1/Anzahl-fällig des Rings (bei 4 fälligen also 25% pro Erledigung).
  const dueOrOverdueAll = todoTasks.filter(t => t.dueDate && t.dueDate <= today);
  const dueOrOverdueDoneCount = dueOrOverdueAll.filter(t => t.done).length;
  const ruleEl = document.getElementById("dayRule");
  ruleEl.innerHTML = dayBudgetRing(dueOrOverdueAll.length, dueOrOverdueDoneCount);

  const openTasks = todoTasks
    .filter(t => !t.done)
    .sort((a, b) => {
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

  const doneTasks = todoTasks.filter(t => t.done && t.completedAt && t.completedAt.slice(0, 10) >= thisMondayKey);
  const lastWeekDoneTasks = todoTasks
    .filter(t => t.done && t.completedAt && t.completedAt.slice(0, 10) >= lastMondayKey && t.completedAt.slice(0, 10) < thisMondayKey)
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

  // Nur die Tagesroutine zählt für den Wochenkreis, weitere Gewohnheiten nicht.
  const scheduled = state.habits.filter(h => h.routineOrder != null && new Date(h.createdAt) <= today && isScheduledToday(h, today));
  const doneHabits = scheduled.filter(h => {
    const v = h.history[todayKey];
    return h.type === "weight" ? (v !== undefined && v !== null) : !!v;
  });
  const done = doneHabits.length;
  const totalPoints = scheduled.reduce((sum, h) => sum + (h.points ?? 1), 0);
  const earnedPoints = doneHabits.reduce((sum, h) => sum + (h.points ?? 1), 0);
  const pct = totalPoints ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  wrap.title = `${todayKey}: ${scheduled.length ? done + "/" + scheduled.length + " Routine-Schritte (" + earnedPoints + "/" + totalPoints + " Punkte)" : "keine Routine-Schritte fällig"}`;
  wrap.innerHTML = `
    <div style="display:flex; justify-content:center; margin-bottom:30px;">
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
        ${goldRingHtml(pct, 200, todayIdx, 34)}
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
        noteHtml = `<div class="routine-step-note">Heutiges Hauptfach: <strong>${subj ? escapeHtml(subj.title) : "–"}</strong>${quickAddVisible ? ' <button class="btn btn-ghost" style="font-size:11px; padding:0 4px; height:auto;" data-change-subject="1">ändern</button>' : ""}</div>`;
      }
    }

    const checkHtml = h.type === "weight"
      ? `<button class="atlas-check${doneToday ? " checked" : ""}" style="pointer-events:none;" tabindex="-1">${doneToday ? splatSvg(h.id) : ""}</button>`
      : `<button class="atlas-check${doneToday ? " checked" : ""}" data-habit="${h.id}">${doneToday ? splatSvg(h.id) : ""}</button>`;
    const weightInputHtml = h.type === "weight"
      ? `<input type="number" step="0.1" min="0" inputmode="decimal" class="input" style="width:72px; height:34px; padding:6px 8px; text-align:right;" data-weight-habit="${h.id}" placeholder="kg" value="${rawValue !== undefined && rawValue !== null ? rawValue : ""}">`
      : "";
    const titleHtml = quickAddVisible
      ? `<div class="item-title" data-edit-habit="${h.id}" style="cursor:pointer; text-decoration:underline dotted;">${escapeHtml(h.title)}</div>`
      : `<div class="item-title">${escapeHtml(h.title)}</div>`;
    const pointsHtml = `<div class="item-meta">${h.points ?? 1} Punkt${(h.points ?? 1) === 1 ? "" : "e"}</div>`;

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
    const doneToday = !!h.history[today];
    const streak = computeStreak(h);
    const priority = isPriority(h.nodeId);
    const titleHtml = quickAddVisible
      ? `<div class="item-title" data-edit-habit="${h.id}" style="cursor:pointer; text-decoration:underline dotted;">${escapeHtml(h.title)}</div>`
      : `<div class="item-title">${escapeHtml(h.title)}</div>`;
    const el = document.createElement("div");
    el.className = "atlas-row" + (doneToday ? " done" : "");
    el.innerHTML = `
      <button class="atlas-check${doneToday ? " checked" : ""}" data-habit="${h.id}">${doneToday ? splatSvg(h.id) : ""}</button>
      <div style="flex:1; min-width:0;">
        ${titleHtml}
        <div class="item-meta">${frequencyLabel(h)} · Serie: ${streak} · ${h.points ?? 1} Punkt${(h.points ?? 1) === 1 ? "" : "e"}</div>
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

// ---------- Roadmap: Dashboard (Ebene 1) -> Kategorie (Ebene 2) -> Pfad (Ebene 3) ----------

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
    const pct = Math.round(nodeProgress(node) * 100);
    const card = document.createElement("button");
    card.className = "roadmap-folder-card";
    card.dataset.openRoadmapRoot = node.id;
    card.innerHTML = `
      <div class="roadmap-folder-name">${escapeHtml(node.title)}</div>
      <div style="display:flex; justify-content:center;">${goldRingHtml(pct, 88, i)}</div>
    `;
    wrap.appendChild(card);
  });
  return wrap;
}

// Deterministischer, aber individueller Maskenindex je Knoten (dieselbe Tinten-Maske-Technik wie
// Ebene 1), damit jeder Roadmap-Kreis auf Ebene 2 sein eigenes Muster hat statt eines schlichten Rings.
function maskIndexForId(id) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) >>> 0;
  return n % RING_MASKS.length;
}

function roadmapCardHtml(p) {
  const pct = Math.round(nodeProgress(p) * 100);
  const children = childNodes(p.id);
  const tasks = categoryTasksForNode(p.id);
  const stepCount = children.length || tasks.length;
  const doneCount = children.length
    ? children.filter(c => Math.round(nodeProgress(c) * 100) >= 100).length
    : tasks.filter(t => t.done).length;
  return `
    <button class="roadmap-card" data-open-roadmap-path="${p.id}">
      ${goldRingHtml(pct, 34, maskIndexForId(p.id))}
      <div class="roadmap-card-body">
        <div class="roadmap-card-title">${escapeHtml(p.title)}</div>
        <div class="roadmap-card-meta">${doneCount} / ${stepCount} Etappen</div>
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
          <h6 class="metal-gold" style="margin:22px 0 8px;">${escapeHtml(theme.title)}</h6>
          <div class="roadmap-card-list">${targets.map(roadmapCardHtml).join("")}</div>
        `;
      }).join("")
    : '<div class="empty-hint">Noch keine Unterkategorien.</div>';
  wrap.innerHTML = `
    <div class="roadmap-crumb"><button data-roadmap-crumb-home>Roadmap</button> <span>&rsaquo;</span> <b>${escapeHtml(root.title)}</b></div>
    ${sectionsHtml}
  `;
  return wrap;
}

function renderRoadmapPath(nodeId) {
  const node = nodeById(nodeId);
  const ancestry = nodePath(nodeId);
  const children = childNodes(nodeId);
  const tasks = categoryTasksForNode(nodeId);
  const steps = children.length
    ? children.map(c => ({ id: c.id, title: c.title, kind: "node", done: Math.round(nodeProgress(c) * 100) >= 100 }))
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
    <div class="card-title" style="font-size:19px; margin-bottom:8px;">${escapeHtml(node.title)}</div>
    <div class="roadmap-progress-row">
      <div class="roadmap-progress-outer"><div class="roadmap-progress-inner" style="width:${pct}%"></div></div>
      <div class="roadmap-progress-label">${doneCount} / ${steps.length} Schritte</div>
    </div>
    <div class="roadmap-path" id="roadmapPathSteps"></div>
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
  const doneToday = dueToday.filter(h => h.history[todayStr()]).length;
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

function renderMoreStats() {
  const wrap = document.getElementById("moreStats");
  if (!wrap) return;

  const rate7 = taskCompletionRateInWindow(7);
  const rate30 = taskCompletionRateInWindow(30);
  const rate60 = taskCompletionRateInWindow(60);
  const devCount7 = state.deviations.filter(d => d.date >= todayStr(-7)).length;
  const devCount30 = state.deviations.filter(d => d.date >= todayStr(-30)).length;
  const prayerFulfilled = state.prayers.filter(p => p.status === "fulfilled").length;
  const prayerOpen = state.prayers.filter(p => p.status !== "fulfilled").length;

  const boxes = [
    { num: rate7 !== null ? Math.round(rate7 * 100) + "%" : "–", label: "Aufgaben erledigt", sub: "letzte 7 Tage" },
    { num: rate30 !== null ? Math.round(rate30 * 100) + "%" : "–", label: "Aufgaben erledigt", sub: "letzte 30 Tage" },
    { num: rate60 !== null ? Math.round(rate60 * 100) + "%" : "–", label: "Aufgaben erledigt", sub: "letzte 60 Tage" },
    { num: devCount7, label: "Abweichungen", sub: "letzte 7 Tage" },
    { num: devCount30, label: "Abweichungen", sub: "letzte 30 Tage" },
    { num: prayerFulfilled, label: "Erhörungen", sub: `${prayerOpen} offen` }
  ];

  wrap.innerHTML = boxes.map(b => `
    <div class="stat-box minor"><div class="stat-num">${b.num}</div><div class="stat-label">${b.label}</div><div class="stat-sub">${b.sub}</div></div>
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
  const scheduled = state.habits.filter(h => localDateKey(new Date(h.createdAt)) <= key && isScheduledToday(h, dateObj));
  const totalPoints = scheduled.reduce((sum, h) => sum + (h.points ?? 1), 0);
  const earnedPoints = scheduled.filter(h => h.history[key]).reduce((sum, h) => sum + (h.points ?? 1), 0);
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
    cell.style.background = `linear-gradient(135deg, color-mix(in srgb, ${base} 100%, white 22%) 0%, ${base} 45%, color-mix(in srgb, ${base} 100%, black 25%) 100%)`;
    cell.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 2px rgba(0,0,0,0.35)";
    if (key === todayKey) cell.classList.add("today");
    cell.title = `${key}${pct === null ? "" : ": " + pct + "%"}`;
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

function renderDaySheetHabits(dateObj) {
  const key = localDateKey(dateObj);
  const habits = dayHabitsList(dateObj);
  if (!habits.length) return '<div class="empty-hint">Keine Gewohnheiten an diesem Tag fällig.</div>';
  return habits.map(h => {
    const rawValue = h.history[key];
    const doneToday = h.type === "weight" ? (rawValue !== undefined && rawValue !== null) : !!rawValue;
    const checkHtml = h.type === "weight"
      ? `<button class="atlas-check${doneToday ? " checked" : ""}" style="pointer-events:none;" tabindex="-1">${doneToday ? splatSvg(h.id) : ""}</button>`
      : `<button class="atlas-check${doneToday ? " checked" : ""}" data-habit="${h.id}" data-date="${key}">${doneToday ? splatSvg(h.id) : ""}</button>`;
    const weightInputHtml = h.type === "weight"
      ? `<input type="number" step="0.1" min="0" inputmode="decimal" class="input" style="width:72px; height:34px; padding:6px 8px; text-align:right;" data-weight-habit="${h.id}" data-date="${key}" placeholder="kg" value="${rawValue !== undefined && rawValue !== null ? rawValue : ""}">`
      : "";
    return `
      <div class="atlas-row${doneToday ? " done" : ""}">
        ${checkHtml}
        <div style="flex:1; min-width:0;">
          <div class="item-title">${escapeHtml(h.title)}</div>
        </div>
        ${weightInputHtml}
      </div>
    `;
  }).join("");
}

function openDaySheet(dateKey) {
  currentDaySheetKey = dateKey;
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
    <p class="text-muted" style="font-size:12px; margin:8px 0 12px;">Tippe eine Gewohnheit an, um sie für diesen Tag nachzutragen oder zu korrigieren.</p>
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
  const roots = childNodes(null)
    .map(n => ({ node: n, count: countTasksInSubtree(n.id) }))
    .sort((a, b) => b.count - a.count || a.node.title.localeCompare(b.node.title, "de"));
  if (!roots.length) { wrap.innerHTML = '<div class="empty-hint">Noch keine Bereiche angelegt.</div>'; return; }

  const max = Math.max(1, ...roots.map(r => r.count));
  const total = roots.reduce((s, r) => s + r.count, 0);
  const empty = roots.filter(r => r.count === 0);
  const shown = areaLoadShowAll ? roots : roots.filter(r => r.count > 0);

  const rowHtml = r => `
    <div class="areaload-row">
      <div class="areaload-name">${escapeHtml(r.node.title)}</div>
      <div class="areaload-bar-outer"><div class="areaload-bar-inner" style="width:${r.count ? Math.max(3, Math.round((r.count / max) * 100)) : 0}%"></div></div>
      <div class="areaload-count">${r.count}</div>
    </div>`;

  wrap.innerHTML = `
    <div class="areaload-total">${total} Aufgaben auf ${roots.length} Bereiche${empty.length ? ` · ${empty.length} ohne Aufgaben` : ""}</div>
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

// ---------- Render all ----------
// Morgens einmal daran erinnern, was GESTERN liegen geblieben ist -- damit es nicht zweimal
// hintereinander passiert. Bewusst nicht erst nach dem zweiten Versaeumnis (zu spaet, der Rueckfall
// ist dann schon da) und hoechstens einmal pro Tag, egal wie oft die App geoeffnet wird.
function checkMissedRoutineStreaks() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const today = todayStr();
  if (state.lastMissReminderDate === today) return;   // heute schon erinnert

  const y = new Date(); y.setDate(y.getDate() - 1);
  const yKey = localDateKey(y);

  // Nur Routine-Gewohnheiten, die gestern tatsaechlich faellig waren und offen blieben.
  const missed = state.habits.filter(h =>
    h.routineOrder != null && isScheduledToday(h, y) && !h.history[yKey] &&
    new Date(h.createdAt) <= y);
  if (!missed.length) { state.lastMissReminderDate = today; saveData(); return; }

  const names = missed.map(h => h.title);
  const list = names.length <= 3
    ? names.join(", ")
    : `${names.slice(0, 3).join(", ")} und ${names.length - 3} weitere`;
  new Notification("Atlas – gestern liegen geblieben", {
    body: `Gestern hast du ${list} vergessen. Heute wieder dran denken!`,
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

function renderAll() {
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
  checkMissedRoutineStreaks();
}

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
  if (e.target.matches("#reflectionText")) {
    const key = e.target.dataset.weekKey || weekStartKey();
    state.weeklyReflection[key] = e.target.value;
    saveData();
  }
  if (e.target.matches("[data-task-notes]")) {
    const task = state.tasks.find(t => t.id === e.target.dataset.taskNotes);
    if (task) { task.notes = e.target.value.trim(); saveData(); }
  }
  if (e.target.matches("[data-project-notes]")) {
    const project = state.projects.find(p => p.id === e.target.dataset.projectNotes);
    if (project) { project.notes = e.target.value; saveData(); }
  }
});

function toggleTaskDone(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  task.completedAt = task.done ? new Date().toISOString() : null;
  saveData();
  renderAll();
}

// Einzelklick auf die ToDo-Zeile klappt die Details auf; Doppelklick hakt ab. Da jeder Doppelklick
// mit zwei einzelnen "click"-Events beginnt, wird der Einzelklick kurz verzögert ausgeführt und
// verworfen, falls in der Zwischenzeit ein "dblclick" auf derselben Zeile eintrifft.
let pendingTaskRowClicks = {};
const TASK_ROW_CLICK_DELAY = 280;

document.addEventListener("dblclick", e => {
  const taskRow = e.target.closest("[data-task-row]");
  if (!taskRow || e.target.closest("[data-del-task]") || e.target.closest("[data-task]")) return;
  const id = taskRow.dataset.taskRow;
  if (pendingTaskRowClicks[id]) { clearTimeout(pendingTaskRowClicks[id]); delete pendingTaskRowClicks[id]; }
  toggleTaskDone(id);
});

document.addEventListener("click", e => {
  const taskCheck = e.target.closest("[data-task]");
  if (taskCheck) {
    toggleTaskDone(taskCheck.dataset.task);
    return;
  }
  const taskRow = e.target.closest("[data-task-row]");
  if (taskRow && !e.target.closest("[data-del-task]")) {
    const id = taskRow.dataset.taskRow;
    if (pendingTaskRowClicks[id]) clearTimeout(pendingTaskRowClicks[id]);
    pendingTaskRowClicks[id] = setTimeout(() => {
      delete pendingTaskRowClicks[id];
      if (expandedTaskIds.has(id)) expandedTaskIds.delete(id);
      else expandedTaskIds.add(id);
      renderAll();
    }, TASK_ROW_CLICK_DELAY);
    return;
  }
  const habitCheck = e.target.closest("[data-habit]");
  if (habitCheck) {
    const habit = state.habits.find(h => h.id === habitCheck.dataset.habit);
    const key = habitCheck.dataset.date || todayStr();
    if (habit.history[key]) delete habit.history[key];
    else { habit.history[key] = true; habit.missNotified = false; }
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
  if (e.target.matches("[data-del-task]")) {
    state.tasks = state.tasks.filter(t => t.id !== e.target.dataset.delTask);
    saveData(); renderAll();
  }
  if (e.target.matches("[data-del-habit]")) {
    state.habits = state.habits.filter(h => h.id !== e.target.dataset.delHabit);
    saveData(); renderAll();
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
  const delIncomeBtn = e.target.closest("[data-del-income]");
  if (delIncomeBtn) {
    state.financeIncomeSources = state.financeIncomeSources.filter(i => i.id !== delIncomeBtn.dataset.delIncome);
    saveData(); renderAll();
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
    state.financeAccounts = state.financeAccounts.filter(a => a.id !== delAccountBtn.dataset.delAccount);
    saveData(); renderAll();
    return;
  }
  const delProjectBtn = e.target.closest("[data-del-project]");
  if (delProjectBtn) {
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
  if (delCategoryBtn) {
    state.financeCategories = state.financeCategories.filter(c => c.id !== delCategoryBtn.dataset.delCategory);
    state.financeExpenses = state.financeExpenses.filter(ex => ex.categoryId !== delCategoryBtn.dataset.delCategory);
    saveData(); renderAll();
    return;
  }
  const editCategoryEl = e.target.closest("[data-edit-category]");
  if (editCategoryEl) {
    const category = state.financeCategories.find(c => c.id === editCategoryEl.dataset.editCategory);
    if (category) openCategoryModal(category);
    return;
  }
  const delGoalBtn = e.target.closest("[data-del-goal]");
  if (delGoalBtn) {
    state.savingsGoals = state.savingsGoals.filter(g => g.id !== delGoalBtn.dataset.delGoal);
    saveData(); renderAll();
    return;
  }
  const delExpenseBtn = e.target.closest("[data-del-expense]");
  if (delExpenseBtn) {
    state.financeExpenses = state.financeExpenses.filter(ex => ex.id !== delExpenseBtn.dataset.delExpense);
    saveData(); renderAll();
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
  if (e.target.matches("[data-del-deviation]")) {
    state.deviations = state.deviations.filter(d => d.id !== e.target.dataset.delDeviation);
    saveData(); renderAll();
  }
  const fulfilledBtn = e.target.closest("[data-prayer-fulfilled]");
  if (fulfilledBtn) {
    openPrayerFulfillModal(fulfilledBtn.dataset.prayerFulfilled);
  }
  const irrelevantBtn = e.target.closest("[data-prayer-irrelevant]");
  if (irrelevantBtn) {
    const prayer = state.prayers.find(p => p.id === irrelevantBtn.dataset.prayerIrrelevant);
    if (prayer) { prayer.status = "irrelevant"; prayer.irrelevantAt = new Date().toISOString(); }
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
initPrayerDragReorder();


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
  return dateFromKey(key).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
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
let gymRest = null;          // { endsAt, total, label }
let gymRestInterval = null;

function gymStartRest(seconds, label) {
  gymRest = { endsAt: Date.now() + seconds * 1000, total: seconds, label };
  if (gymRestInterval) clearInterval(gymRestInterval);
  gymRestInterval = setInterval(gymRestTick, 250);
  gymRenderHeader();
}
function gymStopRest() {
  gymRest = null;
  if (gymRestInterval) { clearInterval(gymRestInterval); gymRestInterval = null; }
  gymRenderHeader();
}
function gymRestTick() {
  if (!gymRest) { gymStopRest(); return; }
  if (Date.now() >= gymRest.endsAt) {
    if (navigator.vibrate) navigator.vibrate([180, 90, 180]);
    gymStopRest();
    return;
  }
  gymRenderHeader();
}
function gymRestLeft() {
  if (!gymRest) return 0;
  return Math.max(0, Math.ceil((gymRest.endsAt - Date.now()) / 1000));
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

  const left = gymRestLeft();
  const timerHtml = gymRest
    ? `<button class="gym-timer running" data-gym-rest-stop>
         <span class="gym-timer-ring" style="--p:${gymRest.total ? (left / gymRest.total) * 100 : 0}%"></span>
         <b>${gymMMSS(left)}</b><span>${escapeHtml(gymRest.label)}</span></button>`
    : `<span class="gym-timer idle">Pause per Block starten</span>`;

  el.innerHTML = `
    <div class="gym-header-row">
      <div class="gym-header-title"><span class="gym-day-tag">${day.tag}</span>${escapeHtml(day.label)}</div>
      <div class="gym-header-count">${done}<span> / ${total}</span></div>
    </div>
    <div class="gym-header-bar"><i style="width:${pct}%"></i></div>
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
        ? `<button class="gym-rest-btn" data-gym-rest="${b.rest}" data-gym-rest-label="${escapeHtml(b.title)}">
             <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true"><circle cx="6" cy="6.6" r="4.6" stroke="currentColor" stroke-width="1.3"/><path d="M6 4.4V6.8L7.5 7.6M4.4 1.2h3.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
             ${b.rest >= 60 ? gymMMSS(b.rest) : b.rest + "s"}
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
  if (dayBtn) { gymSelectedDay = dayBtn.dataset.gymDay; gymStopRest(); renderGym(); return; }
  const restBtn = e.target.closest("[data-gym-rest]");
  if (restBtn) { gymStartRest(parseInt(restBtn.dataset.gymRest, 10), restBtn.dataset.gymRestLabel || "Pause"); return; }
  if (e.target.closest("[data-gym-rest-stop]")) gymStopRest();
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
  if (wEl) session.entries[exercise][idx].weight = (val != null && !isNaN(val)) ? val : null;
  else session.entries[exercise][idx].reps = (val != null && !isNaN(val)) ? val : null;
  saveData();
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
function openProjectModal() {
  openModal(`
    <h3>Projekt hinzufügen</h3>
    <div class="field">
      <label>Titel</label>
      <input type="text" id="mProjectTitle" placeholder="z.B. Seminararbeit, Buch schreiben">
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Speichern</button>
    </div>
  `, body => {
    body.querySelector("#mProjectTitle").focus();
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    body.querySelector("#mSave").addEventListener("click", () => {
      const title = body.querySelector("#mProjectTitle").value.trim();
      if (!title) return;
      state.projects.push({ id: uid(), title, notes: "" });
      saveData(); closeModal(); renderAll();
    });
  });
}
document.getElementById("addProjectBtn").addEventListener("click", openProjectModal);
document.getElementById("addExpenseBtn").addEventListener("click", () => openExpenseModal());
document.getElementById("addCategoryBtn").addEventListener("click", () => openCategoryModal());
document.getElementById("addSavingsGoalBtn").addEventListener("click", () => openSavingsGoalModal());
document.getElementById("addIncomeSourceBtn").addEventListener("click", () => openIncomeSourceModal());
document.getElementById("addDeviationBtn").addEventListener("click", () => {
  const input = document.getElementById("deviationInput");
  addDeviation(input.value);
  input.value = "";
});
document.getElementById("enableNotifBtn").addEventListener("click", () => {
  if (!("Notification" in window)) return;
  Notification.requestPermission().then(() => {
    updateNotifPermissionUI();
    checkMissedRoutineStreaks();
  });
});
document.getElementById("importReviewBtn").addEventListener("click", () => openImportReviewModal());

// Fehlende Aufgaben aus einem zuvor heruntergeladenen Wochenrückblick (.md) wiederherstellen.
// Fügt nur Aufgaben hinzu, deren id noch nicht existiert — bestehende Daten werden nie überschrieben.
function openImportReviewModal() {
  openModal(`
    <h3>Wochenrückblick importieren</h3>
    <p class="text-muted" style="font-size:12.5px; margin-bottom:10px;">Kompletten Inhalt einer heruntergeladenen Wochenrückblick-Datei (.md) hier einfügen. Fehlende Aufgaben werden ergänzt — nichts Bestehendes wird verändert oder dupliziert.</p>
    <div class="field">
      <textarea id="mImportText" class="input" style="min-height:180px;" placeholder="Inhalt der .md-Datei hier einfügen …"></textarea>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mImport">Wiederherstellen</button>
    </div>
  `, body => {
    body.querySelector("#mImportText").focus();
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    body.querySelector("#mImport").addEventListener("click", () => {
      const raw = body.querySelector("#mImportText").value;
      const match = raw.match(/```json\s*([\s\S]*?)```/);
      if (!match) {
        alert("Kein Rohdaten-JSON-Block gefunden. Bitte den kompletten Datei-Inhalt einfügen.");
        return;
      }
      let data;
      try { data = JSON.parse(match[1]); } catch (e) {
        alert("Die Datei konnte nicht gelesen werden (ungültiges JSON).");
        return;
      }
      if (!Array.isArray(data.tasks)) {
        alert("Keine Aufgaben in dieser Datei gefunden.");
        return;
      }
      const existingIds = new Set(state.tasks.map(t => t.id));
      const restored = data.tasks.filter(t => !existingIds.has(t.id));
      restored.forEach(t => state.tasks.push(t));
      saveData();
      closeModal();
      renderAll();
      alert(restored.length ? `${restored.length} Aufgabe(n) wiederhergestellt.` : "Keine fehlenden Aufgaben gefunden — alles war schon vorhanden.");
    });
  });
}
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
      <label>Aufwandsstufe</label>
      <select id="mTaskSize">
        ${EFFORT_LEVELS.map(e => `<option value="${e.level}">${e.level} · ${escapeHtml(e.label)} (${escapeHtml(e.time)})</option>`).join("")}
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
      const title = body.querySelector("#mHabitTitle").value.trim();
      if (!title) return;
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
      const autoDone = body.querySelector("#mHabitAutoDone").checked;
      if (isEdit) {
        editHabit.title = title;
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
        state.habits.push({ id: uid(), title, nodeId, history: {}, createdAt: new Date().toISOString(), frequency, ...extra, routineOrder, type: "check", points, ...(autoDone ? { autoDone: true } : {}) });
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

function examCountdownLabel(dateKey) {
  const daysUntil = Math.round((dateFromKey(dateKey) - dateFromKey(todayStr())) / 86400000);
  if (daysUntil === 0) return "heute";
  if (daysUntil === 1) return "morgen";
  if (daysUntil > 1) return `in ${daysUntil} Tagen`;
  return `vor ${Math.abs(daysUntil)} Tag${Math.abs(daysUntil) === 1 ? "" : "en"}`;
}

function renderPlanning() {
  const examsWrap = document.getElementById("examsList");
  if (examsWrap) {
    const sorted = state.exams.slice().sort((a, b) => a.date.localeCompare(b.date));
    examsWrap.innerHTML = sorted.length
      ? sorted.map(e => {
          const subject = state.subjects.find(s => s.id === e.subjectId);
          const daysUntil = Math.round((dateFromKey(e.date) - dateFromKey(todayStr())) / 86400000);
          return `
            <div class="atlas-row">
              <div style="flex:1; min-width:0;">
                <div class="item-title">${subject ? escapeHtml(subject.title) : "Unbekanntes Fach"}</div>
                <div class="item-meta">${e.date}</div>
              </div>
              <span class="atlas-chip" style="background:${daysUntil <= 0 ? "var(--color-accent-900)" : "var(--color-neutral-800)"}; color:${daysUntil <= 0 ? "var(--color-accent-300)" : "var(--color-neutral-300)"};">${examCountdownLabel(e.date)}</span>
              <button class="btn btn-icon btn-ghost" data-del-exam="${e.id}" aria-label="Löschen"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 1.5L11.5 11.5M11.5 1.5L1.5 11.5" stroke="var(--color-neutral-500)" stroke-width="1.4" stroke-linecap="round"/></svg></button>
            </div>
          `;
        }).join("")
      : '<div class="empty-hint">Noch keine Klassenarbeiten eingetragen.</div>';
  }
}

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
      <i style="width:${Math.min(100, pct)}%"></i>
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
  return dateFromKey(dateKey).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
}

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
  const recent = [...state.financeExpenses]
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
    : '<div class="empty-hint">Noch keine Ausgaben erfasst.</div>';

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
            ${budgetRingHtml(cur, target, 40)}
            <div class="fin-goal-body">
              <div class="item-title">${escapeHtml(g.title)}</div>
              <div class="item-meta">${formatEuro(cur)} von ${formatEuro(target)}${g.dueDate ? " · bis " + dateFromKey(g.dueDate).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : ""}</div>
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
    <p class="text-muted" style="font-size:12.5px; margin-bottom:10px;">Aktuell gespart: ${formatEuro(goal.current || 0)} von ${formatEuro(goal.target || 0)}</p>
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
    ? state.savingsGoals.map(g => `<div class="finance-ring-item">${budgetRingHtml(g.current || 0, g.target || 0, 56)}<div class="r-title">${escapeHtml(g.title)}</div></div>`).join("")
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
      state.financeIncomeSources = state.financeIncomeSources.filter(i => i.id !== editSource.id);
      saveData(); closeModal(); renderAll();
    });
    body.querySelector("#mSave").addEventListener("click", () => {
      const title = body.querySelector("#mIncomeTitle").value.trim();
      if (!title) return;
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
  wrap.innerHTML = state.projects.length
    ? state.projects.map(p => `
        <div class="card elev-sm project-card">
          <div class="project-card-head">
            <div class="item-title">${escapeHtml(p.title)}</div>
            <button class="btn btn-icon btn-ghost" data-del-project="${p.id}" aria-label="Löschen">${DEL_ICON}</button>
          </div>
          <textarea class="input project-notes" data-project-notes="${p.id}" placeholder="Notizen, Gedanken, Zwischenstand …">${escapeHtml(p.notes || "")}</textarea>
        </div>
      `).join("")
    : '<div class="empty-hint">Noch keine Projekte angelegt.</div>';
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
      state.financeAccounts = state.financeAccounts.filter(a => a.id !== editAccount.id);
      saveData(); closeModal(); renderAll();
    });
    body.querySelector("#mSave").addEventListener("click", () => {
      const title = body.querySelector("#mAccountTitle").value.trim();
      if (!title) return;
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
      state.financeCategories = state.financeCategories.filter(c => c.id !== editCategory.id);
      state.financeExpenses = state.financeExpenses.filter(e => e.categoryId !== editCategory.id);
      saveData(); closeModal(); renderAll();
    });
    body.querySelector("#mSave").addEventListener("click", () => {
      const title = body.querySelector("#mCategoryTitle").value.trim();
      if (!title) return;
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
      if (!categoryId || !amount || amount <= 0 || !date) return;
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
      <input type="number" step="0.01" min="0" id="mGoalTarget" value="${isEdit ? (editGoal.target || 0) : ""}">
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
      state.savingsGoals = state.savingsGoals.filter(g => g.id !== editGoal.id);
      saveData(); closeModal(); renderAll();
    });
    body.querySelector("#mSave").addEventListener("click", () => {
      const title = body.querySelector("#mGoalTitle").value.trim();
      if (!title) return;
      const target = parseFloat(body.querySelector("#mGoalTarget").value) || 0;
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
      <button class="btn btn-icon btn-ghost" data-prayer-fulfilled="${p.id}" title="Erfüllt" style="width:26px; height:26px;">${CHECK_ICON}</button>
      <button class="btn btn-icon btn-ghost" data-prayer-irrelevant="${p.id}" title="Nicht mehr relevant" style="width:26px; height:26px;">${CROSS_ICON}</button>
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

  const irrelevantWrap = document.getElementById("prayerIrrelevantList");
  const irrelevant = state.prayers
    .filter(p => p.status === "irrelevant")
    .sort((a, b) => (b.irrelevantAt || "").localeCompare(a.irrelevantAt || ""));
  irrelevantWrap.innerHTML = irrelevant.length
    ? irrelevant.map(p => `
        <div class="prayer-archive-entry">
          <div class="item-meta">${(p.irrelevantAt || "").slice(0, 10)}</div>
          <div class="item-title">${escapeHtml(p.title)}</div>
        </div>
      `).join("")
    : '<div class="empty-hint">Nichts als nicht mehr relevant markiert.</div>';
}

function savePrayerFromInline() {
  const input = document.getElementById("prayerInput");
  const title = input.value.trim();
  if (!title) return;
  state.prayers.push({ id: uid(), title, type: prayerAddType, createdAt: new Date().toISOString(), status: "open", deferredCount: 0 });
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

  md += `\n## ToDos\n`;
  const todoTasksAll = state.tasks.filter(t => (t.source || "todo") !== "category");
  const doneTodos = todoTasksAll.filter(t => t.done);
  const onTimeCount = doneTodos.filter(isOnTime).length;
  md += `- Erledigt: ${doneTodos.length}/${todoTasksAll.length}\n`;
  md += `- Davon pünktlich: ${onTimeCount}/${doneTodos.length || 0}\n`;
  todoTasksAll
    .slice()
    .sort((a, b) => (a.dueDate || "9999-99-99").localeCompare(b.dueDate || "9999-99-99"))
    .forEach(t => {
      md += `  - [${t.done ? "x" : " "}] ${t.title}${t.dueDate ? " (fällig " + t.dueDate + ")" : ""}\n`;
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
document.addEventListener("visibilitychange", () => { if (!document.hidden) renderAll(); });

// Ladebildschirm: läuft bei jedem App-Start als feste 3-Sekunden-Sequenz durch (unabhängig davon,
// wie schnell der eigentliche Render aus localStorage steht) und blendet danach aus.
const splashEl = document.getElementById("splashScreen");
if (splashEl) {
  setTimeout(() => {
    splashEl.classList.add("splash-hidden");
    splashEl.addEventListener("transitionend", () => splashEl.remove(), { once: true });
  }, 3000);
}

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
  }
  function placeAtSlot(slot) {
    const c = centerOf(slot.btn);
    // Dehnung soll entlang der Ringbahn wirken -> Tangente steht senkrecht auf dem Radius.
    setHandlePos(c.x, c.y, slot.angle + 90);
  }
  function placeAtHome() {
    if (!homeAnchor) return;
    const c = centerOf(homeAnchor);
    setHandlePos(c.x, c.y, 90);   // Bewegung nach unten -> Dehnung vertikal
  }

  // Kuerzester Winkelabstand auf dem Kreis (beruecksichtigt den Sprung bei 360/0 Grad).
  function angleDistance(a, b) {
    return Math.abs(((a - b) % 360 + 540) % 360 - 180);
  }

  function moveHandleTo(slot) {
    if (!ringHandle) return;
    ringHandle.classList.remove("no-anim", "is-invisible");
    // Antippen = Finger in Fluessigkeit: kurz gleichmaessig aufquellen, dann zurueckfallen.
    ringHandle.classList.add("is-liquid", "is-tap");
    ringHandle.style.setProperty("--angle", `${slot.angle}deg`);
    handleMode = "ring";
    placeAtSlot(slot);
    clearTimeout(tapTimer); clearTimeout(liquidTimer);
    tapTimer = setTimeout(() => ringHandle.classList.remove("is-tap"), 230);
    liquidTimer = setTimeout(() => ringHandle.classList.remove("is-liquid"), 460);
  }

  // Beim Oeffnen eines Tabs wandert die Blase nach unten und wird dort zum Zurueck-Knopf.
  const GLOBE_ICON = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none">' +
    '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/>' +
    '<ellipse cx="12" cy="12" rx="4" ry="9" stroke="currentColor" stroke-width="1.3"/>' +
    '<path d="M3.2 9.2H20.8M3.2 14.8H20.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';

  function sendHandleHome() {
    if (!ringHandle) return;
    ringHandle.classList.remove("no-anim", "is-invisible");
    ringHandle.innerHTML = GLOBE_ICON;   // unten zeigt die Blase das Globus-Symbol
    ringHandle.classList.add("has-icon");
    handleMode = "home";
    ringHandle.classList.add("is-liquid", "is-tap");
    placeAtHome();
    clearTimeout(tapTimer); clearTimeout(liquidTimer);
    tapTimer = setTimeout(() => ringHandle.classList.remove("is-tap"), 260);
    liquidTimer = setTimeout(() => ringHandle.classList.remove("is-liquid"), 560);
  }

  function activateSlot(slot) {
    moveHandleTo(slot);
    if (globeModel && !isNaN(slot.lat) && !isNaN(slot.lon)) {
      globeModel.autoRotate = false;
      globeModel.cameraOrbit = `${slot.lon}deg ${90 - slot.lat}deg 105%`;
      setTimeout(() => { goToTab(slot.tab); sendHandleHome(); }, 850);
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
      handleMode = "ring";
      const cur = ringSlots.find(sl => sl.tab === document.body.dataset.tab) || ringSlots[0];
      clearTimeout(tapTimer); clearTimeout(liquidTimer);
      // 1) unten zerplatzen lassen
      ringHandle.classList.remove("is-liquid", "is-tap");
      ringHandle.style.opacity = "";      // Inline-Wert loesen, sonst kann is-pop nicht ausblenden
      ringHandle.classList.add("is-pop");
      setTimeout(() => {
        // 2) unsichtbar und ohne Animation ans Ringsymbol versetzen
        ringHandle.classList.add("no-anim", "is-invisible");
        ringHandle.classList.remove("is-pop", "has-icon");
        ringHandle.innerHTML = "";        // am Ring leer -- das Symbol liegt dort schon darunter
        placeAtSlot(cur);
        // 3) dort wieder normal auftauchen
        // Sichtbarkeit NOCH mit no-anim zuruecknehmen: so ist die Blase sofort da, auch wenn ein
        // Uebergang aus irgendeinem Grund nicht durchlaeuft (sonst bliebe sie unsichtbar haengen).
        setTimeout(() => {
          ringHandle.classList.remove("is-invisible");
          ringHandle.style.opacity = "1";   // hart sichtbar -- unabhaengig von laufenden Uebergaengen
          setTimeout(() => ringHandle.classList.remove("no-anim"), 30);
        }, 40);
      }, 300);
    });
  }

  // Startposition setzen, sobald das Layout steht, und bei Groessenaenderung nachziehen.
  function repositionHandle() {
    if (!ringHandle) return;
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
      const next = cur + lag * 0.22;                     // traeges Nachziehen
      const pull = Math.min(1, Math.abs(lag) / 14);      // 0..1 Rueckstand
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
