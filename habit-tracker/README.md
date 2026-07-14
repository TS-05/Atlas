# Ziel & Habit Tracker

Eine kleine, clientseitige Web-App zum Verwalten von Zielen, Aufgaben und Gewohnheiten. Alle Daten werden ausschließlich im `localStorage` des Browsers gespeichert — es gibt keinen Server und keine Datenübertragung.

## Funktionen

- **Ziel-Hierarchie**: Langfristige Ziele → mittelfristige Meilensteine → kurzfristige Aufgaben/Gewohnheiten. Der Fortschritt wird automatisch von unten nach oben berechnet.
- **Tagesansicht**: Zeigt fällige Aufgaben und Gewohnheiten des Tages inkl. Streak-Zähler.
- **Übersicht**: Statistiken zu Zielen, Aufgaben, Gewohnheiten sowie Pünktlichkeitsquote erledigter Aufgaben.
- **Wochenrückblick-Export**: Erstellt eine Obsidian-kompatible Markdown-Zusammenfassung der letzten 7 Tage zum Download.

## Nutzung

Da die App keine Build-Schritte oder Abhängigkeiten benötigt, reicht es, `index.html` direkt im Browser zu öffnen — zum Beispiel per Doppelklick oder mit einem einfachen lokalen Server:

```bash
npx serve .
```

## Daten & Speicherung

Der App-Zustand (Ziele, Aufgaben, Gewohnheiten) wird unter dem `localStorage`-Schlüssel `habit-tracker-data-v2` im Browser abgelegt. Beim ersten Start wird er mit Beispieldaten vorbefüllt.
