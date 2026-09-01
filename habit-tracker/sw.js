// ---------- Offline-Cache ----------
// Cached jede same-origin GET-Anfrage beim ersten Laden (App-Shell, Skripte, Styles, Bilder) und
// liefert sie danach auch offline aus. Bei Netzverbindung wird der Cache im Hintergrund aktualisiert.
// Nichts fest verdrahtet — neue/versionierte Dateinamen (z.B. app.js?v=15) landen automatisch im Cache,
// sobald sie einmal geladen wurden.
const CACHE_NAME = "atlas-cache-v4";
const APP_SHELL = ["./", "./index.html"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // z.B. Google Fonts: Netzwerk-only, Offline-Fallback ist die System-Schrift

  // Navigation (App wird geöffnet/neu geladen, z.B. übers Homescreen-Icon): wenn die exakte URL nicht
  // 1:1 im Cache liegt (z.B. abweichende Groß-/Kleinschreibung, Query-Parameter, Redirect-Ziel) und das
  // Netz offline ist, sonst auf die gecachte index.html zurückfallen statt mit leerem Bildschirm zu enden.
  if (e.request.mode === "navigate") {
    e.respondWith(
      // cache: "no-cache" erzwingt eine Rueckfrage beim Server, statt index.html aus dem
      // HTTP-Cache zu nehmen. Genau daran hing der Fehler "auf dem Handy ist noch die alte
      // Fassung": die versionierten Adressen (style.css?v=NN) helfen nur, wenn das HTML frisch
      // ist, das auf sie zeigt. Kommt index.html aus dem Cache, zeigt es auf die ALTEN Adressen
      // -- und die liegen im Service-Worker-Cache, also kommt die ganze App alt zurueck.
      // Ist nichts Neues da, antwortet der Server mit 304 und es fliesst fast nichts.
      fetch(e.request, { cache: "no-cache" })
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then(cached => cached || caches.match("./index.html")))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
