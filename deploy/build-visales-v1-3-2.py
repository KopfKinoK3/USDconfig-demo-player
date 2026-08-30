import re, sys, io

# Bauskript fuer die ausgelieferte Fassung v1.3.2 (visales.de).
# Herkunft: Beilage mk130-bauskript.py des Handovers vom 29.08.2026
#   (USDconfig 1.4x/_BRIEFINGS/beilagen-handover-2026-08-29/).
# Aufruf aus dem Wurzelverzeichnis des Repos USDconfig-demo-player:
#   python3 deploy/build-visales-v1-3-2.py
# Erzeugt deploy/visales/usdconfig-demo-v1-3-2.html aus rules-demo.html.
# Bricht ab, sobald eine Fundstelle nicht genau einmal vorkommt. Das ist
# Absicht: weicht der Quellcode ab, wird das gemeldet, nicht angepasst.
# Versionsgebunden mit Absicht: fuer v1.4 entsteht eine eigene Datei.
SRC = 'rules-demo.html'
DST = 'deploy/visales/usdconfig-demo-v1-3-2.html'

s = io.open(SRC, encoding='utf-8').read()
orig = s
n = 0

def rep(old, new):
    global s, n
    assert s.count(old) == 1, ('nicht genau einmal gefunden: %r (%d)' % (old[:70], s.count(old)))
    s = s.replace(old, new)
    n += 1

# 1. Titel
rep('<title>USDconfig Regeln &amp; Werte Demo · viSales</title>',
    '<title>USDconfig Demo · Regeln und Werte · Vitra ID Chair · viSales</title>')

# 2. canonical
rep('<link rel="canonical" href="https://kopfkinok3.github.io/USDconfig-demo-player/rules-demo.html">',
    '<link rel="canonical" href="https://visales.de/usdconfig-demo-v1-3-2.html">')

# 3. og:site_name
rep('<meta property="og:site_name" content="viSales USDconfig">',
    '<meta property="og:site_name" content="viSales">')

# 4. og:url
rep('<meta property="og:url" content="https://kopfkinok3.github.io/USDconfig-demo-player/rules-demo.html">',
    '<meta property="og:url" content="https://visales.de/usdconfig-demo-v1-3-2.html">')

# 5. og:image auf visales.de
rep('<meta property="og:image" content="https://kopfkinok3.github.io/USDconfig-demo-player/assets/og-usdconfig.png">',
    '<meta property="og:image" content="https://visales.de/assets/images/og-usdconfig-demo.png">')

# 6. Versionskennzeichnung im Kopf, direkt nach twitter:card
rep('<meta name="twitter:card" content="summary_large_image">\n',
    '<meta name="twitter:card" content="summary_large_image">\n\n'
    '<!-- Ausgelieferte Player-Version. Muss mit dem Dateinamen, mit dem Tag im\n'
    '     Repo USDconfig-demo-player und mit der Anzeige auf der Buehne\n'
    '     uebereinstimmen. -->\n'
    '<meta name="usdconfig-version" content="1.3.2">\n')

# 7. Herkunftshinweis ganz oben
rep('<meta charset="UTF-8">\n',
    '<meta charset="UTF-8">\n\n'
    '<!-- Eigenstaendige Demo-Seite fuer visales.de. Oberflaeche und Logik\n'
    '     unveraendert aus rules-demo.html im Repo USDconfig-demo-player.\n'
    '     Abweichungen ausschliesslich fuer die Auslieferung: ASSET_BASE,\n'
    '     PLAYER_VERSION, canonical, og:url, og:image.\n'
    '     Aenderungen an Oberflaeche oder Logik gehoeren zuerst ins Repo. -->\n')

# 8. Engine-Badge bekommt eine Kennung
rep('<div class="badge">model-viewer · WebGL</div>',
    '<div class="badge" id="engine-badge">model-viewer · WebGL</div>')

# 9. ASSET_BASE auf GitHub Pages, PLAYER_VERSION daneben
rep("const ASSET_BASE = '';",
    "/* Modelle und Datensatz liegen auf GitHub Pages. Einziger der drei\n"
    "   gemessenen Hosts, der USDZ und GLB korrekt typisiert und CORS offen\n"
    "   ausliefert (gemessen 21. und 28.08.2026). */\n"
    "const ASSET_BASE = 'https://kopfkinok3.github.io/USDconfig-demo-player/';\n\n"
    "/* Ausgelieferte Version, an drei Stellen sichtbar: Dateiname,\n"
    "   meta usdconfig-version im Kopf, Badge auf der Buehne. */\n"
    "const PLAYER_VERSION = '1.3.2';")

# 10. Version sichtbar auf der Buehne, in init()
rep("  readStateFromUrl();\n  syncUrl();\n  updateViewer();\n  renderStep(0);",
    "  const badge = document.getElementById('engine-badge');\n"
    "  if (badge) badge.textContent =\n"
    "    `model-viewer · WebGL · OpenUSD · USDconfig ${PLAYER_VERSION}`;\n\n"
    "  readStateFromUrl();\n  syncUrl();\n  updateViewer();\n  renderStep(0);")

io.open(DST, 'w', encoding='utf-8').write(s)
print('Ersetzungen:', n)
print('Zeichen vorher/nachher:', len(orig), len(s))
