// ============================================================
// Ich — Selbstbild und Glaubenssätze
// ============================================================
// Die Seite zeigt die Atlas-Figur mit Fuehrungslinien an feste Punkte, so wie Tim es skizziert
// hat: eine waagrechte Strecke am Rand, dann schraeg zum Punkt. Jede Region traegt Saetze im
// Praesens ("Ich bin ...") -- Zielidentitaet, nicht Zielliste.
//
// Die Einteilung stammt von Tim (2026-09-01): Irdisches liegt auf der Welt, die er traegt;
// Koerperliches am Koerper; Geistliches und Charakterliches an Kopf und Herz. Die Regionen selbst
// stehen fest (Bedeutung und Ort), die Saetze sind vollstaendig aenderbar -- Anlage und Startwerte
// siehe IDENTITY_SEED in atlas-daten.js.
//
// Stimmzettel: "Jede taegliche Handlung ist ein Stimmzettel fuer dieses Bild" steht so in
// 10_Persoenlich/Ich-in-perfekt.md. Deshalb zeigt jede Region, welche Gewohnheiten auf sie
// einzahlen -- als 30-Tage-Quote (dieselbe Rechnung wie der Zielfortschritt in der Auswertung)
// plus laengste laufende Serie.

// Lage der Figur im Container, in Prozent der Containerbreite. Der Rest links und rechts ist die
// Spalte fuer die Beschriftungen; auf einem 375er-Bildschirm bleiben dort rund 75 px, was fuer die
// Kurznamen ("Charakter") reicht. Die vollen Titel stehen in den Karten darunter.
const ICH_FIG_LEFT = 24;
const ICH_FIG_W = 52;
// Wo eine Fuehrungslinie am Rand beginnt (Innenkante der Beschriftungsspalte).
const ICH_LINIE_START_LINKS = 22.5;
const ICH_LINIE_START_RECHTS = 77.5;
// Anteil der Strecke, der waagrecht laeuft, bevor es schraeg zum Punkt geht. 0,55 trifft die
// Aufteilung aus Tims Skizze (waagrecht laenger als schraeg).
const ICH_KNICK = 0.55;

const ICH_ZONE_LABEL = { welt: "Welt", kopf: "Kopf & Herz", koerper: "Körper" };

function ichData() {
  return state.identity || { claim: "", regions: [] };
}
function ichRegions() {
  return ichData().regions || [];
}
function ichRegionById(id) {
  return ichRegions().find(r => r.id === id) || null;
}

// Wurzel des Zielbaums ueber einer Gewohnheit. Der Baum ist beliebig tief, die Bereichszuordnung
// haengt aber an der Wurzel -- deshalb hier hochlaufen statt nur den direkten Elternknoten nehmen.
function ichRootTitle(nodeId) {
  let n = nodeById(nodeId);
  let guard = 0;
  while (n && n.parentId && guard++ < 60) n = nodeById(n.parentId);
  return n ? n.title : null;
}

// Auf welche Region zahlt eine Gewohnheit ein? Ausdrueckliche Zuordnung sticht die Bereichsregel;
// "-" heisst ausdruecklich "zaehlt nirgends mit" und ist damit unterscheidbar von "nie zugeordnet".
function ichRegionForHabit(habit) {
  if (habit.identityRegion === "-") return null;
  if (habit.identityRegion) return ichRegionById(habit.identityRegion) ? habit.identityRegion : null;
  const root = ichRootTitle(habit.nodeId);
  if (!root) return null;
  const treffer = ichRegions().find(r => (r.areas || []).includes(root));
  return treffer ? treffer.id : null;
}

function ichHabitsForRegion(region) {
  return state.habits.filter(h => ichRegionForHabit(h) === region.id);
}

// Quote und Serie einer Region. null = keine Gewohnheit zahlt ein; das ist ein echter Zustand und
// wird als solcher angezeigt, nicht als 0 %.
function ichBallot(region) {
  const habits = ichHabitsForRegion(region);
  if (!habits.length) return null;
  const quote = habits.reduce((s, h) => s + habitCompletionRate(h, 30), 0) / habits.length;
  const streak = habits.reduce((m, h) => Math.max(m, computeStreak(h)), 0);
  return { habits, quote, streak };
}

// ---------- Figur mit Fuehrungslinien ----------
function ichAnkerPos(r) {
  return { x: ICH_FIG_LEFT + (r.fx * ICH_FIG_W) / 100, y: r.fy };
}

function ichLiniePunkte(r) {
  const { x, y } = ichAnkerPos(r);
  const sx = r.side === "links" ? ICH_LINIE_START_LINKS : ICH_LINIE_START_RECHTS;
  const ex = sx + (x - sx) * ICH_KNICK;
  return `${sx},${r.labelY} ${ex},${r.labelY} ${x},${y}`;
}

function ichFigurHtml() {
  const regionen = ichRegions();
  const linien = regionen.map(r =>
    `<polyline points="${ichLiniePunkte(r)}" vector-effect="non-scaling-stroke"/>`
  ).join("");
  // Die Punkte sind Grafik, kein Bedienelement. Zwei Gruende: "Charakter" und "Reinheit" liegen
  // nur 28 px auseinander, ihre 44-px-Trefferflaechen wuerden sich also ueberlappen und einander
  // die Tipps wegnehmen -- und jede Region haette zwei Schaltflaechen mit demselben Namen im
  // Bedienbaum. Angetippt wird die Beschriftung; die hat Platz und traegt den Namen ohnehin.
  const anker = regionen.map(r => {
    const { x, y } = ichAnkerPos(r);
    return `<span class="ich-anker" style="left:${x}%; top:${y}%;" aria-hidden="true"></span>`;
  }).join("");
  const labels = regionen.map(r =>
    `<button class="ich-label ich-label-${r.side}" data-ich-anker="${r.id}" style="top:${r.labelY}%;"
       aria-label="${escapeHtml(r.title)} — zum Abschnitt springen">${escapeHtml(r.short)}</button>`
  ).join("");
  return `
    <div class="ich-figur">
      <div class="ich-figur-bild-box" style="left:${ICH_FIG_LEFT}%; width:${ICH_FIG_W}%;">
        <img class="ich-figur-bild" src="assets/atlas-figure-cutout.webp?v=1" alt="" aria-hidden="true">
      </div>
      <svg class="ich-linien" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${linien}</svg>
      ${anker}
      ${labels}
    </div>`;
}

// ---------- Karten unter der Figur ----------
function ichBallotHtml(region) {
  const b = ichBallot(region);
  if (!b) {
    return `<p class="ich-stimmen ich-stimmen-leer">Keine Gewohnheit zahlt hier ein.
      <button class="btn-inline" data-ich-habits="${region.id}">Zuordnen</button></p>`;
  }
  const quote = Math.round(b.quote * 100);
  const serie = b.streak > 0 ? `${b.streak} ${b.streak === 1 ? "Tag" : "Tage"} am Stück` : "keine laufende Serie";
  // Eine Null wird nicht in Messing gefeiert. Der Wert steht trotzdem da -- er soll nur nicht die
  // auffaelligste Zahl der Karte sein, wenn er nichts Erreichtes meldet.
  return `
    <div class="ich-stimmen">
      <span class="ich-stimmen-quote${quote === 0 ? " ich-stimmen-null" : ""}">${quote}<span class="ich-stimmen-prozent">%</span></span>
      <span class="ich-stimmen-text">
        in 30 Tagen dafür gestimmt · ${escapeHtml(serie)}<br>
        <span class="ich-stimmen-quellen">${b.habits.length === 1 ? "1 Gewohnheit" : b.habits.length + " Gewohnheiten"}:
        ${b.habits.map(h => escapeHtml(h.title)).join(", ")}</span>
      </span>
      <button class="btn-inline" data-ich-habits="${region.id}">Ändern</button>
    </div>`;
}

function ichRegionKarteHtml(region) {
  const saetze = (region.beliefs || []).length
    ? `<ul class="ich-saetze">${region.beliefs.map(b => `
        <li class="ich-satz">
          <button class="ich-satz-text" data-ich-edit="${region.id}|${b.id}">${escapeHtml(b.text)}</button>
          <button class="btn btn-icon btn-ghost" data-ich-del="${region.id}|${b.id}" aria-label="Satz löschen">${DEL_ICON}</button>
        </li>`).join("")}</ul>`
    : `<div class="leerzustand">
         <p class="leerzustand-text">Noch kein Satz für diesen Bereich.</p>
         <button class="btn btn-primary" data-ich-add="${region.id}">Ersten Satz schreiben</button>
       </div>`;
  return `
    <div class="card elev-sm ich-karte" id="ich-karte-${region.id}" data-ich-karte="${region.id}">
      <div class="ich-karte-kopf">
        <div>
          <div class="card-kicker">${escapeHtml(ICH_ZONE_LABEL[region.zone] || "")}</div>
          <div class="card-title">${escapeHtml(region.title)}</div>
        </div>
        <button class="btn btn-icon btn-secondary" data-ich-add="${region.id}" aria-label="Satz zu ${escapeHtml(region.title)} hinzufügen">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5V12.5M1.5 7H12.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        </button>
      </div>
      ${ichBallotHtml(region)}
      ${saetze}
    </div>`;
}

function renderIch() {
  const claimWrap = document.getElementById("ichClaim");
  const figurWrap = document.getElementById("ichFigure");
  const listWrap = document.getElementById("ichRegions");
  if (!claimWrap || !figurWrap || !listWrap) return;

  const claim = (ichData().claim || "").trim();
  claimWrap.innerHTML = claim
    ? `<button class="ich-claim" id="ichClaimBtn">${escapeHtml(claim)}</button>`
    : `<button class="ich-claim ich-claim-leer" id="ichClaimBtn">Der eine Satz, der über allem steht — hier eintragen.</button>`;

  figurWrap.innerHTML = ichFigurHtml();

  // Reihenfolge der Karten: von oben nach unten wie an der Figur, damit Bild und Liste dieselbe
  // Leserichtung haben. Nicht die Speicherreihenfolge -- die folgt den Zonen.
  const sortiert = ichRegions().slice().sort((a, b) => a.fy - b.fy);
  listWrap.innerHTML = sortiert.map(ichRegionKarteHtml).join("");
}

// ---------- Bearbeiten ----------
function openIchClaimModal() {
  const aktuell = ichData().claim || "";
  openModal(`
    <h3>Der eine Satz</h3>
    <p class="hint">Steht über der Figur. Nicht was du erreichen willst, sondern wer du bist.</p>
    <div class="field">
      <label for="mIchClaim">Satz</label>
      <textarea class="input" id="mIchClaim" rows="3" placeholder="Ich bin …">${escapeHtml(aktuell)}</textarea>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Speichern</button>
    </div>
  `, body => {
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    body.querySelector("#mSave").addEventListener("click", () => {
      state.identity.claim = body.querySelector("#mIchClaim").value.trim();
      saveData(); closeModal(); renderAll();
    });
  });
}

function openIchBeliefModal(regionId, beliefId) {
  const regionen = ichRegions();
  const region = ichRegionById(regionId) || regionen[0];
  if (!region) return;
  const belief = beliefId ? (region.beliefs || []).find(b => b.id === beliefId) : null;
  // Beim Anlegen darf der Bereich noch gewechselt werden (das Plus in der Kopfzeile weiss nicht,
  // wohin der Satz gehoert). Beim Bearbeiten steht er fest -- ein Verschieben waere eine andere
  // Handlung und gehoert nicht in denselben Dialog.
  const bereichsWahl = belief ? "" : `
    <div class="field">
      <label for="mIchRegion">Bereich</label>
      <select class="input" id="mIchRegion">
        ${regionen.map(r => `<option value="${r.id}"${r.id === region.id ? " selected" : ""}>${escapeHtml(r.title)}</option>`).join("")}
      </select>
    </div>`;
  openModal(`
    <h3>${belief ? "Satz bearbeiten" : "Satz hinzufügen"}</h3>
    ${bereichsWahl}
    <div class="field">
      <label for="mIchSatz">Satz</label>
      <textarea class="input" id="mIchSatz" rows="3" placeholder="Ich bin …">${belief ? escapeHtml(belief.text) : ""}</textarea>
      <p class="hint" style="margin-top:4px;">Gegenwart, nicht Zukunft — auch da, wo es noch nicht ganz stimmt.</p>
    </div>
    <div class="modal-actions">
      ${belief ? `<button class="btn btn-ghost" id="mDelete" style="color:var(--color-accent-300); margin-right:auto;">Löschen</button>` : ""}
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Speichern</button>
    </div>
  `, body => {
    const feld = body.querySelector("#mIchSatz");
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    const delBtn = body.querySelector("#mDelete");
    if (delBtn) delBtn.addEventListener("click", () => { closeModal(); ichDeleteBelief(region.id, belief.id); });
    body.querySelector("#mSave").addEventListener("click", () => {
      const text = feld.value.trim();
      if (!text) { markiereFehlendesFeld(feld, "Ohne Satz gibt es nichts zu speichern."); return; }
      if (belief) {
        belief.text = text;
      } else {
        const wahl = body.querySelector("#mIchRegion");
        const ziel = ichRegionById(wahl ? wahl.value : region.id) || region;
        ziel.beliefs = ziel.beliefs || [];
        ziel.beliefs.push({ id: uid(), text });
      }
      saveData(); closeModal(); renderAll();
    });
  });
}

// Loeschen mit Rueckgaengig — wie ueberall sonst in der App, aber die Saetze haengen in einer
// Region statt in einer State-Liste, deshalb hier eigens statt ueber deleteWithUndo().
function ichDeleteBelief(regionId, beliefId) {
  const region = ichRegionById(regionId);
  if (!region) return;
  const idx = (region.beliefs || []).findIndex(b => b.id === beliefId);
  if (idx === -1) return;
  const [entfernt] = region.beliefs.splice(idx, 1);
  saveData();
  renderAll();
  offerUndo("Satz gelöscht", () => {
    const r = ichRegionById(regionId);
    if (!r) return;
    r.beliefs = r.beliefs || [];
    r.beliefs.splice(Math.min(idx, r.beliefs.length), 0, entfernt);
  });
}

// Welche Gewohnheiten auf eine Region einzahlen. Vorbelegt aus der Bereichsregel; ein Haekchen
// setzt eine ausdrueckliche Zuordnung, ein entferntes Haekchen ein ausdrueckliches "zaehlt hier
// nicht" -- sonst wuerde die Bereichsregel es beim naechsten Rendern wieder hereinholen.
function openIchHabitsModal(regionId) {
  const region = ichRegionById(regionId);
  if (!region) return;
  const habits = state.habits.slice().sort((a, b) => a.title.localeCompare(b.title, "de"));
  openModal(`
    <h3>Was zahlt auf „${escapeHtml(region.title)}“ ein?</h3>
    <p class="hint">Angehakte Gewohnheiten zählen als Stimmzettel für diesen Bereich — 30-Tage-Quote und Serie kommen daraus.</p>
    <div class="ich-habit-wahl">
      ${habits.length ? habits.map(h => `
        <label class="checkbox-row">
          <input type="checkbox" data-ich-habit="${h.id}" ${ichRegionForHabit(h) === region.id ? "checked" : ""}>
          <span>${escapeHtml(h.title)}</span>
        </label>`).join("")
      : `<p class="leerzustand-text">Es gibt noch keine Gewohnheiten.</p>`}
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="mCancel">Abbrechen</button>
      <button class="btn btn-primary" id="mSave">Speichern</button>
    </div>
  `, body => {
    body.querySelector("#mCancel").addEventListener("click", closeModal);
    body.querySelector("#mSave").addEventListener("click", () => {
      body.querySelectorAll("[data-ich-habit]").forEach(box => {
        const habit = state.habits.find(h => h.id === box.dataset.ichHabit);
        if (!habit) return;
        if (box.checked) {
          habit.identityRegion = region.id;
          return;
        }
        // Nicht angehakt: nur dann etwas schreiben, wenn die Gewohnheit sonst hier landen wuerde.
        const ohneEigene = { ...habit };
        delete ohneEigene.identityRegion;
        if (habit.identityRegion === region.id) {
          if (ichRegionForHabit(ohneEigene) === region.id) habit.identityRegion = "-";
          else delete habit.identityRegion;
        } else if (habit.identityRegion === undefined && ichRegionForHabit(habit) === region.id) {
          habit.identityRegion = "-";
        }
      });
      saveData(); closeModal(); renderAll();
    });
  });
}

// ---------- Ereignisse ----------
// Eigener Delegationsblock statt Eintraege im grossen Block in atlas-ereignisse.js: alles, was die
// Ich-Seite betrifft, steht damit in einer Datei.
document.addEventListener("click", e => {
  const anker = e.target.closest("[data-ich-anker]");
  if (anker) {
    const karte = document.getElementById("ich-karte-" + anker.dataset.ichAnker);
    if (karte) {
      karte.scrollIntoView({ block: "center", behavior: "smooth" });
      // Kurz hervorheben, damit man nach dem Springen sieht, wo man gelandet ist. Ueber eine
      // Klasse und nicht ueber einen Inline-Stil, damit reduzierte Bewegung sie mit abschaltet.
      karte.classList.remove("ich-karte-treffer");
      void karte.offsetWidth;
      karte.classList.add("ich-karte-treffer");
    }
    return;
  }
  const claimBtn = e.target.closest("#ichClaimBtn");
  if (claimBtn) { openIchClaimModal(); return; }

  const add = e.target.closest("[data-ich-add]");
  if (add) { openIchBeliefModal(add.dataset.ichAdd, null); return; }

  const edit = e.target.closest("[data-ich-edit]");
  if (edit) {
    const [regionId, beliefId] = edit.dataset.ichEdit.split("|");
    openIchBeliefModal(regionId, beliefId);
    return;
  }

  const del = e.target.closest("[data-ich-del]");
  if (del) {
    const [regionId, beliefId] = del.dataset.ichDel.split("|");
    ichDeleteBelief(regionId, beliefId);
    return;
  }

  const habits = e.target.closest("[data-ich-habits]");
  if (habits) { openIchHabitsModal(habits.dataset.ichHabits); return; }
});
