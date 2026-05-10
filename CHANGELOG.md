# Changelog

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
