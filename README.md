# Espresso & Emotion

Statische One-Page-Website für Espresso & Emotion.

## Struktur

- `index.html` ist der Einstiegspunkt und enthält ausschließlich die HTML-Struktur, Metadaten und die Verweise auf CSS und JavaScript.
- `assets/css/styles.css` enthält alle Layout-, Farb-, Typografie-, Responsive- und Animationsregeln.
- `assets/js/main.js` enthält die clientseitige Interaktion: Preisrechner, schrittweisen Anfrageprozess, Verfügbarkeitskalender, Bewertungen, FAQ-Akkordeon, Navigation, Galerie-Modal, Kontaktformular, Cookie-Hinweis und Toast-Meldungen.
- Die HTML-Kommentare markieren die wartbaren Bereiche: Site-Chrome, redaktioneller Inhalt, Anfrageprozess und Footer-Utilities.
- Bilder und Logo sind derzeit als Data-URLs eingebettet. Dadurch benötigt die Seite beim Deployment keine Asset-Pipeline und funktioniert direkt auf GitHub Pages.
- `CNAME` legt die Custom Domain `espresso-emotion.de` fest.
- `.nojekyll` verhindert, dass GitHub Pages bei diesem vollständig statischen Projekt unnötig Jekyll verarbeitet.

### Inhalte pflegen

- Texte, Links, Formularfelder und die HTML-Reihenfolge werden in `index.html` geändert.
- Farben, Abstände, Breakpoints, Animationen und visuelle Zustände werden in `assets/css/styles.css` geändert.
- Preise, Kontaktdaten, Verfügbarkeit, Berechnungslogik und interaktive Abläufe werden in `assets/js/main.js` geändert.
- Die Bilder liegen aktuell direkt in den `src`- und `data-image`-Attributen von `index.html`. Bei einem späteren Bildtausch sollten die Data-URLs dort gemeinsam ersetzt werden.

## Lokal prüfen

Im Projektordner genügt ein beliebiger statischer HTTP-Server, zum Beispiel:

```bash
python3 -m http.server 8000
```

Danach ist die Website unter `http://localhost:8000` erreichbar. Ein Öffnen der Datei per `file://` funktioniert ebenfalls, kann aber Browserfunktionen wie Clipboard oder lokale Speicherung einschränken.

Nach Änderungen an CSS oder JavaScript sollte die Seite über diesen HTTP-Server neu geladen werden, damit relative Pfade wie `assets/css/styles.css` und `assets/js/main.js` korrekt aufgelöst werden.

## GitHub Pages

1. Repository auf GitHub pushen.
2. Unter **Settings > Pages** die Bereitstellung aus dem Branch `main` und dem Ordner `/ (root)` aktivieren.
3. Als Custom Domain `espresso-emotion.de` verwenden. Die Domain ist bereits in `CNAME` hinterlegt.
4. Beim Domainanbieter die von GitHub Pages angezeigten DNS-Einträge setzen und HTTPS aktivieren.

Es ist kein Build-Schritt und keine Dependency-Installation erforderlich.