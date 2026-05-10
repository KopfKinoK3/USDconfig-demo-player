# USDconfig Demo Player

Web-Player für interaktive USDconfig-Produktkonfigurationen — OpenUSD-basiert,
Single-File HTML, model-viewer + KHR_materials_variants + AR Quick Look.

**Live-Demo:** <https://kopfkinok3.github.io/USDconfig-demo-player/>
**Wizard:** <https://kopfkinok3.github.io/USDconfig-demo-player/wizard.html>
**Apple-Pay-Demo:** <https://kopfkinok3.github.io/USDconfig-demo-player/apple-pay-cube/>

## Was es ist

USDconfig ist viSales' B2B-Produktkonfigurator. Dieses Repo enthält die
**öffentliche Frontend-Komponente** (Web-Player). Die Tool-Pipeline
(USDZ-Master → GLB-Varianten + JSON-Spec) ist eine separate, **nicht-öffentliche**
viSales-interne Codebase.

Produktseite: <https://visales.de/usdconfig/>

## Tech-Stack

- Single-File HTML (`index.html`, `wizard.html`)
- [model-viewer 3.5.0](https://modelviewer.dev/) (Google) für GLB/WebGL
- [JSZip 3.10.1](https://stuk.github.io/jszip/)
- Vanilla JS, kein Bundler, kein Build-Step
- Optional: `<model>`-Tag (Apple WebKit-nativ) — vorbereitet, aktuell deaktiviert

## URL-Parameter

```
?glb=…&usdz=…&name=…&v=SetName:Opt1|Opt2:Default&v=…
```

Strukturvarianten via Template:

```
?glb=assets/product-[Sitzform]-[Lehne]-[Armlehnen].glb
```

## Ordnerstruktur

```
.
├── index.html              # Hauptkonfigurator (URL-parametriert)
├── wizard.html             # Step-by-Step-Wizard (Vitra-Demo-Default)
├── assets/                 # GLB-Varianten + Master-USDZ
├── apple-pay-cube/         # Mini-Demo: Apple-Pay-Banner in AR
└── landingpage/{deutsch,english}/  # Marketing-Landingpages
```

## Versionen

- **v1.0** (produktiv RENZ): Player auf `media.visales.de/USDconfig/player.html`
- **v1.1** (released 2026-03): Neuansatz, dieser Demo-Player auf GitHub Pages
- **v1.1.1** (2026-05-10): Hygiene & Sicherheit — LICENSE, README, .gitignore, Token-Pattern

## Lizenz

[Apache 2.0](LICENSE) — Copyright 2026 viSales GmbH, Bochum.

Erstellt mit KI-Unterstützung (Anthropic Claude) im Vibecode-Verfahren.

## viSales

[viSales GmbH](https://visales.de) — visuelle Vertriebskommunikation für
Maschinenbau & Industrie. Mitglied der Alliance for OpenUSD.
