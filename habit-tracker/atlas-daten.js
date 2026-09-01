// ============================================================
// Atlas — atlas-daten.js
// Speicher, Notfall-Rettung, alle Migrationen, Beispieldaten
//
// Teil von app.js, das auf 9 Dateien aufgeteilt wurde. Die Reihenfolge in index.html
// entspricht exakt der frueheren Reihenfolge in der einen Datei -- die Dateien teilen sich
// weiterhin einen Gueltigkeitsbereich, es sind bewusst KEINE Module. Dadurch aendert das
// Aufteilen am Verhalten nichts; nur Funktionen werden nicht mehr ueber Dateigrenzen hinweg
// vorgezogen, weshalb Code, der sofort laeuft, hinter seinen Funktionen stehen muss.
// ============================================================

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
        '<div style="font-size:var(--text-xl);font-weight:600;">Atlas konnte nicht vollständig laden</div>' +
        '<div style="font-size:var(--text-sm);opacity:0.75;max-width:320px;">Deine Daten sind wahrscheinlich noch da. Sichere sie jetzt, bevor du etwas anderes versuchst.</div>' +
        '<button id="__rescueExportBtn" style="padding:14px 22px;border-radius:10px;border:1.5px solid #c9a94e;background:#2a2318;color:#f1e4c8;font-size:var(--text-lg);font-weight:600;">Rohdaten jetzt sichern</button>' +
        '<button id="__rescueReloadBtn" style="padding:10px 18px;border-radius:10px;border:1px solid #666;background:transparent;color:#f1e4c8;font-size:var(--text-sm);">Neu laden versuchen</button>';
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

// Laesst sich der gespeicherte Stand nicht lesen, wurde frueher kommentarlos auf Beispieldaten
// zurueckgefallen — und der Start schrieb diese sofort ueber den beschaedigten Originaltext.
// Damit war der einzige Rest, aus dem sich von Hand noch etwas haette retten lassen, endgueltig
// weg. Jetzt wird der Rohtext unter einem eigenen Schluessel gesichert, der Fehler sichtbar
// gemeldet, und automatisches Speichern bleibt in dieser Sitzung gesperrt, damit nichts
// nachtraeglich ueberschrieben wird.
let ladeFehlerRohtext = null;
function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch (e) {
      ladeFehlerRohtext = raw;
      const sicherung = STORAGE_KEY + "-defekt-" + Date.now();
      try { localStorage.setItem(sicherung, raw); } catch (e2) { /* Platz reicht nicht — dann bleibt nur der Original-Schluessel */ }
      speichernGesperrt = true;
      // Erst nach dem Laden der Oberflaeche melden, sonst gibt es noch kein Ziel dafuer.
      setTimeout(() => {
        alert("Der gespeicherte Stand konnte nicht gelesen werden.\n\n"
          + "Er wurde unter \"" + sicherung + "\" gesichert und NICHT ueberschrieben. "
          + "Atlas zeigt bis zum Neustart nur Beispieldaten und speichert nichts.\n\n"
          + "Zum Wiederherstellen den letzten Wochenrueckblick importieren oder den gesicherten "
          + "Eintrag pruefen lassen.");
      }, 400);
      return seedData();
    }
  }
  return seedData();
}

// Schlaegt das Schreiben fehl (auf iOS bekommt eine PWA rund 5 MB, und Foto-Anhaenge an Gebeten
// liegen als Base64 im selben Eintrag), lief das frueher als stille Ausnahme ins Leere: die
// Oberflaeche sah weiter richtig aus, geschrieben wurde ab da nichts mehr, und beim naechsten
// Start war alles seit dem Fehler verloren. Jetzt wird es sichtbar gemeldet — einmal, damit die
// Meldung bei jedem Tastendruck nicht zur Dauerbeschallung wird.
let speicherFehlerGemeldet = false;
// Wird gesetzt, wenn der Start einen unlesbaren Stand vorgefunden hat: dann darf nichts mehr
// geschrieben werden, sonst ueberschreiben die Beispieldaten die Sicherung.
let speichernGesperrt = false;
function saveData() {
  if (speichernGesperrt) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    speicherFehlerGemeldet = false;
    return true;
  } catch (e) {
    if (!speicherFehlerGemeldet) {
      speicherFehlerGemeldet = true;
      const voll = e && (e.name === "QuotaExceededError" || e.code === 22 || e.code === 1014);
      // showToast existiert erst weiter unten; beim allerersten Laden faellt es auf alert zurueck.
      const text = voll
        ? "Speicher voll \u2014 nichts wurde gesichert. Exportiere den Wochenr\u00fcckblick und entferne gro\u00dfe Anh\u00e4nge."
        : "Speichern fehlgeschlagen \u2014 nichts wurde gesichert.";
      if (typeof showToast === "function") showToast(text); else alert(text);
    }
    return false;
  }
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

// ---------- Datums-Helfer ----------
// Stehen hier vorn und nicht bei der Tagesansicht, weil sie ueberall gebraucht werden --
// unter anderem von der Kopfzeile, die beim Start sofort laeuft. Beim Aufteilen der
// frueheren einen Datei war das der einzige Fall, in dem die reine Reihenfolge nicht
// gereicht hat: Funktionen werden nicht mehr ueber Dateigrenzen hinweg vorgezogen.
function dateFromKey(key) {
  return new Date(key + "T00:00:00");
}

// Ein Datum, eine Schreibweise: TT.MM.JJJJ, ueberall gleich, Jahr immer dabei.
// Vorher gab es sieben verschiedene Konfigurationen im Code -- unter anderem "1. September" bei
// Aufgaben neben "01.09.2026" bei den Sparzielen, also dieselbe Sache in zwei Schreibweisen.
// Ausdruecklich NICHT hierueber laufen Monats- und Wochentagsbeschriftungen ("September 2026" als
// Abschnittsueberschrift, "Sep" an einer Diagrammachse, "Montag" im Tagesblatt): das sind keine
// Daten, sondern Zeitraum- bzw. Tagesnamen.
function formatDatum(key) {
  return dateFromKey(key).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
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
// Frueher wurde auch ein Dank ueber "Erfuellt" abgeschlossen und landete damit unter den
// Erhoerungen — inhaltlich verkehrt: die Erhoerung ist das, wofuer gedankt wird, nicht der Dank.
// Bestehende Eintraege werden einmalig auf den eigenen Status "thanked" umgezogen (idempotent,
// die Bedingung greift nach dem ersten Lauf nicht mehr).
state.prayers.forEach(p => {
  if (p.status === "fulfilled" && (p.type || "bitte") === "dank") {
    p.status = "thanked";
    p.thankedAt = p.fulfilledAt || p.thankedAt || null;
    p.thanksText = p.fulfillmentText || p.thanksText || "";
    delete p.fulfilledAt;
    delete p.fulfillmentText;
  }
});
state.subjectOverride = state.subjectOverride || {};
// Klassenarbeiten sind reine Vorschau: Ist der Termin vorbei, wird der Eintrag beim naechsten Start
// entfernt statt die Liste zuzumuellen. Streng "aelter als heute" — der Termin des laufenden Tages
// bleibt den ganzen Tag stehen. (Bewusst eng gehalten: automatisches Loeschen hat in diesem Projekt
// schon einmal echte Daten gekostet, hier betrifft es ausschliesslich abgelaufene Termine.)
if (Array.isArray(state.exams)) {
  const heuteKey = localDateKey(new Date());
  state.exams = state.exams.filter(e => !e.date || e.date >= heuteKey);
}
// Reste des 2026-07 wieder ausgebauten "Minimal-Tag"-Features (blendete Gewohnheiten aus, statt
// die Latte zu senken). Die Aufraeumzeile fuer h.minVersion ist entfallen: die neue Ideal/Minimal-
// Funktion legt ihre Daten in h.minimalTitle und h.levelByDate ab, die alte Feldbezeichnung wird
// nicht mehr beschrieben — und eine pauschale Loeschzeile waere eine Falle fuer jedes kuenftige
// Feld mit aehnlichem Namen.
delete state.badDayMode;
delete state.minimalDayMode;
if (state.habits) state.habits.forEach(h => { h.levelByDate = h.levelByDate || {}; });
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
