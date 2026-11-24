# Skizix – Quellcode

Hier liegt Skizix in übersichtlichen Einzelteilen. Daraus wird die `index.html` im Hauptordner
des Repos gebaut, die GitHub Pages veröffentlicht. **Die `index.html` nie direkt bearbeiten**,
sondern immer die Dateien hier und danach neu bauen.

## Aufbau

| Ordner / Datei | Inhalt |
|---|---|
| `seite.html` | Grundgerüst der Seite: Werkzeugleiste, Leisten, Dialoge. Platzhalter `{{…}}` werden beim Bauen gefüllt. |
| `css/aussehen.css` | Aussehen: Farben, Layout, Knöpfe, Menüs, Dialoge, Folienleiste |
| `css/schrift-tafel.css` | Eingebettete Schrift Roboto Mono (Menüs und Text auf der Tafel) |
| `css/schrift-logo.css` | Eingebettete Schrift Doto (Schriftzug) |
| `css/schrift-oberflaeche.css` | Eingebettete Schrift Plus Jakarta Sans (Menüs und Knöpfe) |
| `js/01-grundlagen.js` … `js/19-beispiel-start.js` | Das Programm, nach Themen getrennt. Die Nummern legen die Reihenfolge fest. |
| `supabase/` | Datenbank-Skripte für Supabase. Jedes Skript einmal im Supabase-Dashboard unter „SQL Editor“ ausführen. |
| `build.py` | Setzt alles zur `index.html` zusammen |
| `tests/` | Automatische Tests |

Die App-Dateien `sw.js`, `manifest.webmanifest` und die Symbole liegen direkt im Hauptordner.
Bei größeren Änderungen in `sw.js` die Versionsnummer `CACHE` erhöhen.

## Bauen

```
python3 quelle/build.py            # baut index.html
python3 quelle/build.py --pruefen  # prüft nur, ob index.html zum Quellcode passt
```

## Testen

```
python3 quelle/tests/alle_tests.py           # baut und testet alles (ca. 4 Minuten)
python3 quelle/tests/alle_tests.py pdf       # nur Tests, deren Name „pdf“ enthält
```

Voraussetzungen: Python 3, Playwright (`pip install playwright`), Google Chrome; für den PDF-Test
zusätzlich `pdfinfo`, `pdftotext` und `qpdf`, falls vorhanden.

Die Tests bedienen Skizix in einem unsichtbaren Browser wie ein Mensch: Formen, Pfeile, Folien,
Rückgängig, Bilder, Vorlagen, Präsentation, PDF-Export, zwei Fenster, Offline-Start, Leistung mit
2.000 Elementen und das Konto (Anmelden, Boards auf zwei Geräten, Umbenennen,
Löschen, Abmelden). Supabase wird dabei durch eine Attrappe ersetzt, es geht nichts ins
Internet. Die Echtzeit-Verbindung (WebSocket) zwischen Geräten ist noch nicht automatisch getestet.

Bei jeder Änderung auf GitHub laufen dieselben Tests automatisch (`.github/workflows/tests.yml`),
das Ergebnis steht im Reiter „Actions“.

## Schriften

Roboto Mono: Copyright 2015 The Roboto Mono Project Authors. Doto: Copyright 2024 The Doto Project
Authors. Plus Jakarta Sans: Copyright 2020 The Plus Jakarta Sans Project Authors. Alle unter der SIL
Open Font License 1.1.
