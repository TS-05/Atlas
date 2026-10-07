// ============================================================
// Feiern -- Erfolgs-Moment und Klang beim Abhaken
// ============================================================
// Tims Wunsch (2026-10-07), nach dem Vorbild von Not Boring: Abhaken soll sich nach etwas
// anfuehlen. Drei Stufen:
//   1. Gewohnheit oder Aufgabe erledigt  -> Zeile springt, Goldfunken spruehen aus dem Kaestchen,
//                                           kurzer, satter Ton
//   2. ALLE heutigen Gewohnheiten erledigt -> groesserer Goldregen ueber den ganzen Bildschirm,
//                                           aufsteigender Glockenakkord
//   3. Zuruecknehmen                      -> nichts. Gefeiert wird nur, was passiert ist.
//
// Diese Datei schreibt NICHTS in die App-Daten. Sie liest nur vor und nach dem Abhaken mit.
// Einzige eigene Ablage: die Klang-Einstellung als reine Bedienvorliebe in localStorage
// ("atlas-klang"), getrennt vom App-Speicher.
//
// Ablauf: Ein Klick-Lauscher in der Einfangphase (laeuft VOR den Handlern in
// atlas-ereignisse.js) merkt sich den Zustand vorher. Kurz danach -- dann hat renderAll
// neu gezeichnet -- wird verglichen und gegebenenfalls gefeiert.

(() => {
  const RUHIG = matchMedia("(prefers-reduced-motion: reduce)");

  // ---------- Klang ----------
  // Synthetisch ueber Web Audio statt Audiodateien: nichts zu laden, klingt sofort, auch offline.
  // Der AudioContext muss auf dem iPhone innerhalb einer Beruehrung entstehen bzw. fortgesetzt
  // werden -- deshalb wird er im Klick-Lauscher selbst geweckt, nicht erst beim Abspielen.
  const KLANG_KEY = "atlas-klang";
  function klangAn() {
    try { return localStorage.getItem(KLANG_KEY) !== "aus"; } catch (e) { return true; }
  }
  function klangSetzen(an) {
    try { localStorage.setItem(KLANG_KEY, an ? "an" : "aus"); } catch (e) {}
    klangKnopfZeichnen();
  }

  let ctx = null;
  function audioWecken() {
    if (!klangAn()) return null;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
    } catch (e) { ctx = null; }
    return ctx;
  }

  // Ein Glockenton: Grundton plus leiser Oberton, schneller Anschlag, weiches Ausklingen.
  function ton(freq, start, dauer, laut) {
    if (!ctx) return;
    const t0 = ctx.currentTime + start;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(laut, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dauer);
    gain.connect(ctx.destination);
    [[freq, 1], [freq * 2.01, 0.28], [freq * 3.0, 0.08]].forEach(([f, anteil]) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, t0);
      g.gain.value = anteil;
      osc.connect(g); g.connect(gain);
      osc.start(t0); osc.stop(t0 + dauer + 0.05);
    });
  }
  function klangHaken()  { if (!klangAn() || !ctx) return; ton(880, 0, 0.22, 0.16); ton(1320, 0.05, 0.28, 0.10); }
  function klangAufgabe(){ if (!klangAn() || !ctx) return; ton(660, 0, 0.22, 0.15); ton(990, 0.06, 0.32, 0.11); }
  function klangAlles()  {
    if (!klangAn() || !ctx) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => ton(f, i * 0.09, 0.9, 0.12));
    ton(1567.98, 0.42, 1.1, 0.06);
  }

  // ---------- Funken ----------
  // Feste Ebene ueber allem, nur transform/opacity animiert (Compositor), raeumt sich selbst auf.
  let ebene = null;
  function funkenEbene() {
    if (ebene && ebene.isConnected) return ebene;
    ebene = document.createElement("div");
    ebene.className = "feier-ebene";
    ebene.setAttribute("aria-hidden", "true");
    document.body.appendChild(ebene);
    return ebene;
  }

  function funken(x, y, anzahl, weite, dauer) {
    if (RUHIG.matches) return;
    const e = funkenEbene();
    for (let i = 0; i < anzahl; i++) {
      const f = document.createElement("span");
      f.className = "feier-funke" + (i % 3 === 0 ? " hell" : "");
      f.style.left = x + "px";
      f.style.top = y + "px";
      e.appendChild(f);
      const w = (Math.PI * 2 * i) / anzahl + (Math.random() - 0.5) * 0.6;
      const r = weite * (0.55 + Math.random() * 0.6);
      const dx = Math.cos(w) * r, dy = Math.sin(w) * r;
      const d = dauer * (0.75 + Math.random() * 0.5);
      f.animate([
        { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
        { transform: `translate(calc(-50% + ${dx * 0.8}px), calc(-50% + ${dy * 0.8}px)) scale(0.9)`, opacity: 1, offset: 0.55 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + weite * 0.25}px)) scale(0.2)`, opacity: 0 }
      ], { duration: d, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)", fill: "forwards" })
        .onfinish = () => f.remove();
    }
  }

  // Die Zeile springt einmal nach oben und federt zurueck.
  function zeileSpringen(el) {
    if (!el || RUHIG.matches) return;
    el.animate([
      { transform: "scale(1)" },
      { transform: "scale(1.035) translateY(-2px)", offset: 0.35 },
      { transform: "scale(0.995)", offset: 0.7 },
      { transform: "scale(1)" }
    ], { duration: 420, easing: "ease-out" });
  }

  // Grosser Moment: Goldschimmer ueber den Bildschirm und Funkenregen von oben.
  function grosserMoment() {
    if (RUHIG.matches) return;
    const e = funkenEbene();
    const schein = document.createElement("div");
    schein.className = "feier-schein";
    e.appendChild(schein);
    schein.animate([{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 0 }],
      { duration: 1400, easing: "ease-out", fill: "forwards" }).onfinish = () => schein.remove();
    const cx = innerWidth / 2;
    const cy = innerHeight * 0.32;
    funken(cx, cy, 36, Math.min(innerWidth, 420) * 0.55, 1300);
    setTimeout(() => funken(cx, cy, 24, Math.min(innerWidth, 420) * 0.35, 1100), 180);
  }

  // ---------- Vorher / nachher ----------
  function alleHeuteErledigt() {
    try {
      const heute = new Date();
      const key = localDateKey(heute);
      const liste = dayHabitsList(heute);
      return liste.length > 0 && liste.every(h => habitDoneOn(h, key));
    } catch (e) { return false; }
  }

  function selektor(box) {
    return box.dataset.habit
      ? `.atlas-check[data-habit="${CSS.escape(box.dataset.habit)}"]${box.dataset.date ? `[data-date="${CSS.escape(box.dataset.date)}"]` : ""}`
      : `.atlas-check[data-task="${CSS.escape(box.dataset.task)}"]`;
  }

  function vorherMerken(box) {
    if (box.dataset.habit) {
      const h = state.habits.find(x => x.id === box.dataset.habit);
      if (!h || h.type === "weight") return null;
      const key = box.dataset.date || todayStr();
      return { art: "gewohnheit", h, key, war: !!h.history[key], heuteKomplett: alleHeuteErledigt(), sel: selektor(box) };
    }
    if (box.dataset.task) {
      const t = state.tasks.find(x => x.id === box.dataset.task);
      if (!t) return null;
      return { art: "aufgabe", t, war: !!t.done, sel: selektor(box) };
    }
    return null;
  }

  function nachherPruefen(v) {
    // Zeitgeber statt requestAnimationFrame: die Klick-Handler zeichnen synchron neu, und ein
    // Zeitgeber laeuft auch dann, wenn gerade kein Bild gezeichnet wird.
    setTimeout(() => {
      const jetzt = v.art === "gewohnheit" ? !!v.h.history[v.key] : !!v.t.done;
      if (v.war || !jetzt) return;                      // nur feiern, was neu erledigt ist
      const box = Array.from(document.querySelectorAll(v.sel)).find(el => el.offsetParent !== null);
      if (box) {
        const r = box.getBoundingClientRect();
        funken(r.left + r.width / 2, r.top + r.height / 2, 12, 46, 620);
        zeileSpringen(box.closest(".atlas-row"));
      }
      if (v.art === "aufgabe") { klangAufgabe(); return; }
      if (v.key === todayStr() && !v.heuteKomplett && alleHeuteErledigt()) {
        klangAlles();
        setTimeout(grosserMoment, 120);
      } else {
        klangHaken();
      }
    }, 30);
  }

  function lauschen(e) {
    const box = e.target.closest && e.target.closest(".atlas-check[data-habit], .atlas-check[data-task]");
    // Doppeltipp auf die ganze Gewohnheitszeile hakt ebenfalls ab.
    const zeilenBox = !box && e.type === "dblclick" && e.target.closest
      ? (e.target.closest(".atlas-row") || {}).querySelector?.(".atlas-check[data-habit]") : null;
    const ziel = box || zeilenBox;
    if (!ziel) return;
    audioWecken();
    const v = vorherMerken(ziel);
    if (v) nachherPruefen(v);
  }
  document.addEventListener("click", lauschen, true);
  document.addEventListener("dblclick", lauschen, true);

  // ---------- Klang-Schalter in der Kopfzeile ----------
  const LAUT = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 6H5L8.5 3V13L5 10H2.5V6Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M11 5.5C11.8 6.2 12.2 7.1 12.2 8S11.8 9.8 11 10.5M12.8 3.8C14 4.9 14.6 6.4 14.6 8S14 11.1 12.8 12.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
  const STUMM = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 6H5L8.5 3V13L5 10H2.5V6Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M11 6L14.5 9.5M14.5 6L11 9.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
  let knopf = null;
  function klangKnopfZeichnen() {
    if (!knopf) return;
    const an = klangAn();
    knopf.innerHTML = an ? LAUT : STUMM;
    knopf.setAttribute("aria-label", an ? "Klang beim Abhaken ausschalten" : "Klang beim Abhaken einschalten");
    knopf.classList.toggle("klang-aus", !an);
  }
  const aktionen = document.querySelector(".header-actions");
  if (aktionen) {
    knopf = document.createElement("button");
    knopf.className = "btn btn-icon btn-secondary klang-knopf";
    knopf.type = "button";
    knopf.addEventListener("click", () => {
      const neu = !klangAn();
      klangSetzen(neu);
      if (neu) { audioWecken(); klangHaken(); }
    });
    aktionen.insertBefore(knopf, aktionen.firstChild);
    klangKnopfZeichnen();
  }
})();
