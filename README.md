# Espresso & Emotion

Statische One-Page-Website für Espresso & Emotion.

## Struktur

- `index.html` ist der einzige Einstiegspunkt und enthält Markup, Styles und die clientseitige Interaktion.
- Die HTML-Kommentare markieren die wartbaren Bereiche: Site-Chrome, redaktioneller Inhalt, Anfrageprozess und Footer-Utilities.
- Bilder und Logo sind derzeit als Data-URLs eingebettet. Dadurch benötigt die Seite beim Deployment keine Asset-Pipeline und funktioniert direkt auf GitHub Pages.
- `CNAME` legt die Custom Domain `espresso-emotion.de` fest.
- `.nojekyll` verhindert, dass GitHub Pages bei diesem vollständig statischen Projekt unnötig Jekyll verarbeitet.

## Lokal prüfen

Im Projektordner genügt ein beliebiger statischer HTTP-Server, zum Beispiel:

```bash
python3 -m http.server 8000
```

Danach ist die Website unter `http://localhost:8000` erreichbar. Ein Öffnen der Datei per `file://` funktioniert ebenfalls, kann aber Browserfunktionen wie Clipboard oder lokale Speicherung einschränken.

## GitHub Pages

1. Repository auf GitHub pushen.
2. Unter **Settings > Pages** die Bereitstellung aus dem Branch `main` und dem Ordner `/ (root)` aktivieren.
3. Als Custom Domain `espresso-emotion.de` verwenden. Die Domain ist bereits in `CNAME` hinterlegt.
4. Beim Domainanbieter die von GitHub Pages angezeigten DNS-Einträge setzen und HTTPS aktivieren.

Es ist kein Build-Schritt und keine Dependency-Installation erforderlich.