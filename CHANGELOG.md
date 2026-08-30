# Changelog

## v1.3.2 (2026-08-30)

**Sperren mit Grund.** Eine Option, die zur aktuellen Auswahl nicht passt, ist jetzt vor dem
Klick sichtbar gesperrt, nicht erst als Verstoss danach (Duke-Entscheid 30.08.2026,
Spezifikation `SPEC-A2-regel-layer.md`, Abschnitt "Sperren mit Grund"). Grundsatz: hart sperren,
mit Grund, in beide Richtungen, erste Wahl gewinnt. Fuer jede Option wird die aktuelle Auswahl
gebildet, in der die eigene Stufe durch diese Option ersetzt ist (Was-waere-wenn), und regelweise
geprueft: `excludes` sperrt jede Seite, sobald die andere vollstaendig gewaehlt ist; `requires`
sperrt den Ausloeser und jede Alternative zu einer offenen Voraussetzung, aber nicht, solange die
Voraussetzung noch unbelegt ist; `bundle` sperrt das Paket und jede Alternative zu einem
Paket-Inhalt in beide Richtungen; `affects` sperrt nie. Ein Klick auf Gesperrtes aendert nichts
und zeigt den Grund als Toast, eine bereits gewaehlte, aber im Konflikt stehende Option (etwa aus
einem Link) bleibt gewaehlt und trotzdem als gesperrt markiert.

- **Schritt 1b der Auswertung:** Paket gewaehlt plus eine Alternative zu einem Paket-Inhalt im
  selben Schritt ist jetzt ein Verstoss vom Typ `bundle` mit erzeugter Meldung, zwischen "Buendel
  aufloesen" und `excludes` eingeordnet.
- **Neue Funktionen** im `@pure`-Block von `rules-demo.html`: `optionNames(dataset)` (gemeinsamer
  Bezeichner-Helfer), `bundleConflicts(dataset, selectedCodes)` (Paket-Konflikte als Verstoesse),
  `availabilityFor(dataset, selectedCodes, code)` (liefert `{ blocked, reasons: [{ type, text,
  by }] }`). Export ergaenzt: `module.exports = { loadDataset, evaluateConfiguration, sumField,
  indexOptionsByCode, ruleHintsForOption, availabilityFor, bundleConflicts, optionNames }`.
  Zusaetzlich ein neuer statischer Hinweis: Alternativen zu Paket-Inhalten tragen jetzt "mit
  Paket X festgelegt auf Y" (`ruleHintsForOption`), Optionen mit Regelbezug damit neun statt
  sieben.
- **Renderer und CSS:** gesperrte Karten zeigen Kreuz statt Haken, `aria-disabled="true"` und den
  Grund als eigene Zeile statt der statischen Hinweise; gesperrte Farbfelder tragen einen
  Diagonalstrich, halbe Deckkraft und den Grund im `title` sowie als Zeile unter dem Farbraster.
  Ein Klick auf Gesperrtes ruft `toast()` mit dem ersten Grund auf, statt die Auswahl zu aendern.
- **Ebene 1** (`test/a1a2.js`): 7 neue Tests (A2.10.1 bis A2.10.6 plus Gegenprobe), zwei
  bestehende Tests angepasst (A2.9.3, A2.9.5, neue Paket-Hinweise), 22 auf 29 Tests, je 29 pass,
  0 fail gegen `rules-demo.html` und gegen die neue Auslieferungsdatei. Gegenprobe gegen
  `usdconfig-demo-v1-3-1.html`: 21 pass, 8 fail, rot sind genau A2.9.3, A2.9.5 und A2.10.1 bis
  A2.10.6, weil die alte Fassung Sperren nicht kennt.
- **Ebene 2** (`test/ui-visales.js`): ein Timing-Fix vor dem Farbraster-Screenshot (leeres Bild in
  v1.3.1), 4 neue Pruefungen (Testfall 5, gesperrtes Farbfeld und gesperrte Karte), 13 auf 17
  Pruefungen. Gegen die neue Auslieferungsdatei 17 PASS, 0 FAIL. Gegenprobe gegen
  `usdconfig-demo-v1-3-1.html`: 12 PASS, 5 FAIL (Version, und die vier neuen Sperr-Pruefungen).
- **Neue Auslieferungsdatei:** `deploy/visales/usdconfig-demo-v1-3-2.html`, gebaut aus
  `rules-demo.html` mit `deploy/build-visales-v1-3-2.py` (Kopie des v1.3.1-Bauskripts mit
  angepasster Versionsnummer). `deploy/visales/usdconfig-demo-v1-3-0.html` und
  `usdconfig-demo-v1-3-1.html` bleiben live und unveraendert, `usdconfig-demo-v1-3-2.html` steht
  daneben.
- **Belege:** `USDconfig 1.4x/REPORTS/belege-v132-2026-08-30/` (Logs beider Ebenen, je sechs
  Screenshots fuer die neue Datei und die Gegenprobe).

## v1.3.1 (2026-08-30)

**Regelhinweise an der Option.** Jede Regel steht jetzt an der Option selbst, bevor man sie
durch Probieren findet, nicht erst als Verstoss (Duke-Entscheid 30.08.2026, Spezifikation
`SPEC-A2-regel-layer.md`, Abschnitt "Regelhinweise an der Option"). Die Hinweise sind
vollstaendig aus den vier Regeln abgeleitet, es gibt keine handgepflegten Texte: `requires`
meldet sich an der ausloesenden, der betroffenen und der alternativen Option, `excludes` in
beiden Richtungen, `bundle` am Paket und an jedem enthaltenen Code, `affects` an jeder
beteiligten Option mit Partner und Wirkung. Wer eine Regel aendert, bekommt die Hinweise
geschenkt, ohne eine Zeile Text anzufassen.

- **Neue Funktion:** `ruleHintsForOption(dataset, code)` im `@pure`-Block von `rules-demo.html`,
  reine Funktion, liefert `[{ type, text }]` in Regel-Reihenfolge ohne Dubletten. Export
  ergaenzt: `module.exports = { loadDataset, evaluateConfiguration, sumField,
  indexOptionsByCode, ruleHintsForOption }`.
- **Renderer und CSS:** Optionskarten zeigen jeden Hinweis als eigene Zeile unter dem Namen
  (`.opt-text`, `.opt-rule`). Farbfelder mit Hinweis tragen die Klasse `.swatch--rule`, den
  Hinweistext im `title`, und eine Liste `.swatch-rules` steht unter dem Farbraster, damit der
  Text auch ohne Tooltip im DOM steht.
- **Ebene 1** (`test/a1a2.js`): 7 neue Tests (A2.9.1 bis A2.9.6 plus Gegenprobe), 15 auf 22
  Tests, je 22 pass, 0 fail gegen `rules-demo.html` und gegen die neue Auslieferungsdatei.
  Gegenprobe gegen `usdconfig-demo-v1-3-0.html`: 16 pass, 6 fail, rot sind genau die sechs
  neuen Regelhinweis-Tests, weil die alte Fassung die Funktion nicht kennt.
- **Ebene 2** (`test/ui-visales.js`): 2 neue Pruefungen, 11 auf 13 Pruefungen. Gegen die neue
  Auslieferungsdatei 13 PASS, 0 FAIL. Gegenprobe gegen `usdconfig-demo-v1-3-0.html`: 10 PASS,
  3 FAIL (Version, und die beiden neuen Regelhinweis-Pruefungen).
- **Neue Auslieferungsdatei:** `deploy/visales/usdconfig-demo-v1-3-1.html`, gebaut aus
  `rules-demo.html` mit `deploy/build-visales-v1-3-1.py` (Kopie des v1.3.0-Bauskripts mit
  angepasster Versionsnummer). `deploy/visales/usdconfig-demo-v1-3-0.html` bleibt live und
  unveraendert, `usdconfig-demo-v1-3-1.html` steht daneben.
- **Belege:** `USDconfig 1.4x/REPORTS/belege-v131-2026-08-30/` (Logs beider Ebenen, je vier
  Screenshots fuer die neue Datei und die Gegenprobe).

## v1.3.0 — 2026-08-28

**Datenebenen A1 und A2.** Der Schritt von Ebene 2 auf Ebene 4 der Zieldefinition aus der
Agentic-Roadmap. Umgesetzt in einer eigenen Datei, damit der von Sebastian Grillo geprüfte
Stand unangetastet bleibt.

- **A1, typisierte Werte je Option.** `base` am Produkt trägt absolute Werte, `delta` an einer
  Option den Beitrag dieser Wahl. Zwei getrennte Schlüssel statt eines Schalters, der falsch
  stehen kann. Alle Werte sind Ganzzahlen mit optionalem `scale`, bei Geldbeträgen Pflicht.
  Preise tragen einen Modus: `listenpreis`, `groessenordnung` oder `ausgeblendet`. Der dritte
  Fall sagt „es gibt einen Preis, er wird nicht ausgeliefert" und ist damit etwas anderes als
  ein fehlendes Feld.
- **A2, Regel-Layer als Daten.** Vier Typen neben dem Options-Baum, nicht im Code:
  `requires`, `excludes`, `bundle`, `affects`. `excludes` gilt symmetrisch, die Gegenregel
  wird nicht geschrieben. `if` und `then` bedeuten immer UND. Feste Auswertungsreihenfolge,
  damit zwei korrekte Auswerter dasselbe Ergebnis liefern.
- **Neu:** `rules-demo.html`, `data/buerostuhl-demo.json`, `test/a1a2.js`.
- **Unverändert:** `wizard.html`, `index.html`, `deploy/`. Per `git diff` bestätigt.

Der Regel-Auswerter steht als reine Funktion inline im Player, zwischen `@pure-start` und
`@pure-end`, und wird vom Test per `vm` herausgeschnitten und in Node ausgeführt. Eine Quelle
für Rechen- und Regellogik, kein Bundler, keine Duplikation.

Alle Zahlen und Regeln der Demo sind Beispielwerte. Der Datensatz trägt `"demo": true`, die
Preiszeile heißt `Demo-Preis`, die Zusammenfassung `Demo-Konfiguration`. Wer nur die Zahl
sieht, muss auch den Hinweis sehen.

Abnahme: A1 7 von 7, A2 8 von 8, insgesamt 21 von 21 Tests grün. Bei fehlendem oder kaputtem
Datensatz startet der Player mit einem Konfigurator ohne Werte, statt weiß zu bleiben.

Commit `6367c38`.

### Versionsnummer

v1.3.0 war in der Master-Roadmap für den Plattform-Ausbau reserviert. Der Bezeichner ist hier
vergeben worden, der Plattform-Ausbau heißt seit dem 28.08.2026 v1.4.0. Ausgeliefertes
schlägt Geplantes.

### Ausgelieferte Fassung fuer visales.de

`deploy/visales/usdconfig-demo-v1-3-0.html`, gebaut aus `rules-demo.html`. Oberflaeche und
Logik sind unveraendert uebernommen, der Unterschied ist ausschliesslich die Auslieferung:

- `ASSET_BASE` auf `https://kopfkinok3.github.io/USDconfig-demo-player/`. GLB, USDZ und der
  Datensatz kommen von dort, gemessen am 29.08.2026 alle mit korrektem `content-type` und
  offenem CORS. Alle zwoelf GLB-Dateien, `chair-master.usdz` und
  `data/buerostuhl-demo.json` liefern 200.
- `PLAYER_VERSION = '1.3.0'`, sichtbar an drei Stellen: Dateiname, `meta name=usdconfig-version`
  im Kopf und Badge auf der Buehne.
- `canonical` und `og:url` auf `https://visales.de/usdconfig-demo-v1-3-0.html`, `og:image` auf
  das Vorschaubild auf visales.de.

Kein Warm-Tech-Umbau. Entscheidung Duke Jera vom 29.08.2026: das Wizard-Design bleibt.

Abnahme der ausgelieferten Fassung, gemessen 30.08.2026: Ebene 1 mit
`RULES_FILE=deploy/visales/usdconfig-demo-v1-3-0.html node --test --test-name-pattern='^(Gegenprobe|A1\.|A2\.)' test/a1a2.js`
15 von 15 gruen, Gegenprobe mit `RULES_FILE=wizard.html` bricht beim Laden ab (kein
`@pure-start`/`@pure-end`-Block in `wizard.html`), Exit ungleich 0. Ebene 2 mit dem neuen
`test/ui-visales.js` (lokal mit Playwright-Chromium statt Cloud-Container-Chromium, sonst wie
gebrieft) 11 von 11 gruen gegen die Auslieferungsdatei, Gegenprobe gegen `wizard.html` 3 PASS
und 8 FAIL. Belegbilder und Logs in
`USDconfig 1.4x/REPORTS/belege-deploy-1-2026-08-29/`. Werkzeuge:
`deploy/build-visales-v1-3-0.py` (baut die Auslieferungsdatei aus `rules-demo.html`) und
`test/ui-visales.js` (Ebene 2 gegen die Auslieferungsfassung). Der Deploy-Commit bekommt
keinen eigenen Tag, weil `v1.3.0` bereits auf `6367c38` liegt.

## v1.1.9 — 2026-08-28

`ASSET_BASE` als einzige Stelle, an der sich eine ausgelagerte Fassung des Players
unterscheidet. Verhalten unverändert, die Konstante ist leer. Ohne sie hätte die Fassung auf
visales.de verstreute absolute URLs, und die beiden Player würden auseinanderlaufen.

Commit `1b29d1f`.

## v1.1.8 — 2026-08-28

**Agentic-Hotfix.** Ausgelöst durch den Prüfbericht Sebastian Grillo vom 20.08.2026, der den
Player gegen einen Konzernkonfigurator getestet hat. Befund: der Options-Baum ist strukturell
besser ausgeliefert als beim Konzern, die Ergebnisübergabe war defekt.

### Behoben

- **H1 URL-Parameter werden beim Start gelesen.** `wizard.html` schrieb `Sitzform`, `Lehne`,
  `Armlehnen` und `Bezug` beim Teilen in die URL, las sie aber nie. Jeder geteilte Link zeigte
  beim Öffnen den Standardstuhl, ohne Fehlermeldung. `readStateFromUrl()` liest den Zustand vor
  dem ersten Render und validiert gegen `STEPS[].options`, also gegen dieselbe Liste, aus der
  die Oberfläche gebaut wird. Unbekannte Werte fallen still auf den Standard zurück.
- **H2 Ergebnis steht ohne Knopfdruck in der Adresszeile.** `replaceState`, sobald alle vier
  Schritte entschieden sind. Kein History-Eintrag pro Klick, der Zurück-Knopf bleibt nutzbar.
  Bewusst nicht bei jeder einzelnen Auswahl, siehe Entscheidungen unten.
- **H3 Teilen scheitert nicht mehr lautlos.** `doShare()` prüfte mit `if (navigator.share)` die
  Existenz statt der Erlaubnis. Im iframe existiert die Funktion, der Aufruf wird abgelehnt, es
  gab kein `catch`, der Clipboard-Zweig wurde nie erreicht. Jetzt dreistufig mit Fehlerpfad auf
  jeder Stufe: Share, dann Clipboard, dann URL sichtbar im Panel. Abbruch durch den Nutzer gilt
  nicht als Fehler.
- **H4 allow-Zeile vervollständigt.** Beide Landingpages hatten
  `allow="xr-spatial-tracking; camera"`. Ergänzt um `fullscreen`, `accelerometer`, `gyroscope`,
  `web-share` und `clipboard-write`. `magnetometer` bewusst weggelassen, praktisch keine
  Browserunterstützung. `allowfullscreen` war gesetzt, `fullscreen` fehlte im `allow`.
- **H5 Embed-Snippet dokumentiert.** Beide Landingpages versprechen Kunden die Einbettung per
  iframe-Snippet, dokumentiert war keines. Der Kunde hätte es aus dem Seitenquelltext abgelesen
  und damit die unvollständige allow-Zeile geerbt. Offizielles Snippet jetzt im README mit
  Begründung je Berechtigung, und in der Embed-FAQ beider Sprachfassungen.

### Geändert

- **Keine Option ist mehr vorbelegt.** `state` hält nur getroffene Entscheidungen, `null` heißt
  ungewählt. Ein getrenntes `DEFAULTS` speist ausschließlich den Viewer, damit vor der ersten
  Entscheidung trotzdem ein Stuhl zu sehen ist. Nebeneffekt mit Substanz: der geteilte Link
  enthält nur entschiedene Werte, damit ist von außen unterscheidbar, ob eine Option gewählt
  wurde oder nur zufällig dem Standard entspricht.
- **AR-Knopf ist ausgegraut und als DEMO gekennzeichnet**, solange `canActivateAR` das Gerät
  nicht bestätigt. Ein Klick im gesperrten Zustand meldet sich, statt ins Leere zu führen.
- **Linkvorschau.** Beide Player hatten keinerlei Open-Graph-Tags, ein gemailter Link zeigte gar
  nichts. Jetzt `og:*`, `twitter:card`, `meta description` und `canonical`, dazu
  `assets/og-usdconfig.png`. Das Bild ist fest, weil Crawler kein JavaScript ausführen und
  GitHub Pages für einen Query-String dieselbe Datei liefert.
- `faq-a` im geöffneten Zustand von `max-height: 400px` auf `1400px`. Das Snippet braucht 414
  Pixel und wäre wegen `overflow: hidden` lautlos abgeschnitten worden.

### Nicht enthalten

Die Datenebenen aus Release 1.2, also typisierte Werte, Regel-Layer, Validierung mit
Auswegen und maschinenlesbares Manifest. Dieser Release schließt ausschließlich die
Ergebnisübergabe.

### Entscheidungen

**Versionsnummer.** Der Hotfix heißt v1.1.8, nicht v1.1.1 wie in der Roadmap-Vorlage. v1.1.1
ist am 10.05.2026 vergeben. v1.1.4 bis v1.1.7 sind in der Master-Roadmap für andere Sprints
reserviert und nicht released. v1.1.8 war die erste freie Nummer.

**H2 nur am Ende.** `replaceState` läuft erst bei vollständiger Konfiguration, nicht bei jeder
Auswahl wie in der Roadmap vorgesehen. Die Adresszeile bleibt während des Konfigurierens ruhig.
Der maschinenlesbare Rückweg bleibt erhalten, er greift eine Stufe später.

**USDZ-MIME-Type auf GitHub Pages ist in Ordnung.** Gemessen am 21.08.2026:
`chair-master.usdz` wird als `model/vnd.usdz+zip` ausgeliefert, 18.649.385 Bytes. Die Annahme
eines MIME-Problems, auf der `USE_MODEL_TAG = false` und die Umzugsplanung nach
`media.visales.de` beruhen, trifft für den MIME-Type nicht zu. Ein Umzug braucht ein anderes
Argument. `media.visales.de/USDconfig/` ist zum selben Zeitpunkt 404, der als v1.0 produktiv
geführte RENZ-Player dort nicht mehr nachweisbar.

### Testverfahren

Abnahme über einen Playwright-Headless-Harness gegen einen lokalen http-Server, mit echtem
model-viewer und den echten GLB-Dateien. Jeder Testfall läuft zusätzlich gegen den
Baseline-Stand `5fffa47`. Bestanden heißt grün auf dem neuen Stand und rot auf der Baseline.
Ergebnis: 7 von 7 grün auf v1.1.8, 0 von 7 auf der Baseline, plus separate Prüfungen für H2 und
für beide Landingpages.

## v1.1.4 bis v1.1.7

**Korrigiert am 28.08.2026.** Eine frühere Fassung dieses Eintrags behauptete, v1.1.4 bis
v1.1.7 seien reserviert und nicht released. Das stimmt für v1.1.5 bis v1.1.7, nicht für
v1.1.4.

- **v1.1.4, v1.1.4b, v1.1.4c** sind am 11.05.2026 released, alle drei im privaten Repo
  `USDconfig-backend`, nicht hier. Inhalt: Generator-baseColor-Fix und zwei PBR-Nachbesserungen.
  v1.1.4c ist visuell nicht abgenommen, ein Dateigrößen-Delta von rund 20 Prozent ist offen.
- **v1.1.4d** ist der offene Folgesprint dazu, Byte-Diff-Diagnose.
- **v1.1.5 bis v1.1.7** sind reserviert und nicht released: model-tag aktivieren,
  ADR-Extraktion, generischer Wizard.

Ursache des Fehlers: Für die erste Fassung wurde `USDconfig V1.x/ROADMAP.md` gelesen, die
v1.1.4 seit Mai als „nächster Sprint" führte. Die Wahrheitsquelle für Status ist laut ihrem
eigenen Kopf aber `BACKLOG.md`, und dort stehen die drei Releases korrekt.

## v1.1.3 — 2026-05-11

Frontend-Bug-Fix. Badge-Text für Safari Desktop in `index.html`, `resolveUsdz()` in
`wizard.html` auf `chair-master.usdz` umgestellt. Commit `5fffa47`. Nachgetragen am 21.08.2026,
der Eintrag fehlte.

## v1.1.2 — 2026-05-11

Tool-Rekonstruktion nach Plan B, im privaten Repo `USDconfig-backend`. Neuaufbau auf `pxr`,
`pygltflib` und `zipfile`, 12 GLB-Varianten aus `chair-master.usdz`, KHR_materials_variants,
3 von 3 pytest grün. Betrifft die Tool-Komponente, nicht diesen Player, steht hier wegen der
produktweiten Versionszählung. Nachgetragen am 21.08.2026, der Eintrag fehlte.

## v1.1.1 — 2026-05-10

- LICENSE: Apache 2.0 gesetzt (Copyright 2026 viSales GmbH, Bochum)
- README.md: Architektur-Hinweis, Live-Demo-Links, Tech-Stack
- .gitignore: .DS_Store, .env, output/, Python-Artefakte
- ADR-1: Lizenz-Asymmetrie + Token-Pattern verschriftlicht (siehe unten)

### ADR-1 Lizenz-Asymmetrie + Token-Pattern — 2026-05-09

**Kontext:** USDconfig hat zwei Komponenten mit unterschiedlichen Öffentlichkeits-Anforderungen:
Demo-Player-Frontend ist als Marketing-Asset und AOUSD-Footprint öffentlich auf GitHub.
Tool-Pipeline (USDZ-Analyzer/Generator) ist viSales-internes Wissen, das Wettbewerbsvorteil
sichert. Inventur 2026-05-09 hat zusätzlich einen GitHub Personal Access Token im Klartext
in `upload_to_github.py` gefunden — lokal exponiert, nicht im Repo committed.

**Entscheidung:**
- Demo-Player-Repo: Apache 2.0 Lizenz, Copyright viSales GmbH 2026.
- Tool-Repo: proprietär, privat, keine LICENSE-Datei, kein Public Push.
- Token in `.env`-Datei pro Skript, niemals im Code, niemals committed.
  `python-dotenv` als Standard-Pattern für alle viSales-internen Skripte.
- `.env.example` darf committed werden mit Placeholder-Token (`ghp_REPLACE_ME`).

**Konsequenz:** Demo-Player kann von Dritten geforked und eingebunden werden ohne
juristische Hürde. Tool-Wert bleibt geschützt. Token-Rotation wird zur Routine:
alter Token raus, neuer Token in `.env`, Code unverändert.

## v1.1 — 2026-03-25

Vibecode-Stand released — Vitra-Demo live auf GitHub Pages, DE/EN-Landingpages,
apple-pay-cube AR-Demo.

## v1.0

RENZ Showtime produktiv auf media.visales.de/USDconfig/player.html.
