/* Oberflaechentest (Ebene 2) fuer die Auslieferungsfassung unter deploy/visales/.
   Ebene 2 in test/a1a2.js prueft weiterhin rules-demo.html; dieses Skript prueft
   die Fassung, die tatsaechlich auf visales.de landet -- Standard
   deploy/visales/usdconfig-demo-v1-3-0.html, per UI_FILE auch jede andere Datei
   im Repo, insbesondere wizard.html als Gegenprobe.

   Aufruf (aus der Repo-Wurzel):
     node test/ui-visales.js
     UI_FILE=wizard.html UI_TAG=wizard node test/ui-visales.js

   Parameter (alle ueber Umgebungsvariablen, mit Standardwerten):
     UI_FILE    Pfad relativ zur Repo-Wurzel der zu pruefenden HTML-Datei.
                Standard: deploy/visales/usdconfig-demo-v1-3-0.html
     UI_VERSION erwartete PLAYER_VERSION/meta-Version. Standard: 1.3.0
     UI_TAG     Praefix der Screenshot-Dateien. Standard: v130
     UI_OUT     Zielordner fuer die Screenshots. Standard: . (Arbeitsverzeichnis)
     UI_CHROME  Pfad zu einem Chromium-Executable (Cloud-Container-Standard:
                /opt/pw-browsers/chromium-1194/chrome-linux/chrome). Ist die
                Variable leer oder zeigt sie auf keine vorhandene Datei, startet
                das Skript stattdessen das von Playwright verwaltete Chromium
                (lokal per "npx playwright install chromium").
     UI_PORT    Port des lokalen Testservers. Standard: 8085

   Voraussetzung: vendor/model-viewer.min.js unter der Repo-Wurzel (siehe unten,
   Abbruch mit Meldung, wenn die Datei fehlt).

   Am Ende zusaetzlich eine maschinenlesbare Zeile "SUMMARY <tag> pass=<n> fail=<m>"
   und Exit-Code ungleich 0, wenn mindestens ein Fall fehlgeschlagen ist. Bei der
   Gegenprobe gegen wizard.html ist ein Exit-Code ungleich 0 gewollt; das Skript
   kennt den Unterschied zwischen "geplantes Rot" und "Fehler" nicht, das steht
   im Bericht, der diesen Lauf einordnet.

   Ab v1.3.1 (SPEC-A2, Abschnitt "Regelhinweise an der Option") zwei zusaetzliche
   Pruefungen in Testfall 3 (ohne Parameter): Regelhinweise an den Optionskarten
   des ersten Schritts und am Farbraster von Schritt "Bezug", mit einem vierten
   Screenshot (${UI_TAG}-bezug.png) fuer das Farbraster.

   Ab v1.3.2 (SPEC-A2, Abschnitt "Sperren mit Grund") Testfall 5 zwischen
   Testfall 3 und dem Fallback: gesperrtes Farbfeld (Lehne Trim vorbelegt,
   Screenshot ${UI_TAG}-gesperrt-farbe.png) und gesperrte Karte (Sitzform
   Kontur vorbelegt, Screenshot ${UI_TAG}-gesperrt-karte.png), je mit
   aria-disabled, Grundtext im DOM, Klick ohne Zustandsaenderung und Toast.

   Der Canonical-Link wird gegen den Dateinamen aus UI_FILE gepruft, nicht gegen
   eine feste Version. */

const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const MIME = { '.html': 'text/html', '.glb': 'model/gltf-binary', '.js': 'text/javascript', '.json': 'application/json' };

const UI_FILE = process.env.UI_FILE || 'deploy/visales/usdconfig-demo-v1-3-0.html';
const UI_VERSION = process.env.UI_VERSION || '1.3.0';
const UI_TAG = process.env.UI_TAG || 'v130';
const UI_OUT = process.env.UI_OUT || '.';
const UI_CHROME = process.env.UI_CHROME || '';
const UI_PORT = Number(process.env.UI_PORT || 8085);
const CANON = 'https://visales.de/' + path.basename(UI_FILE);

const VENDOR_MV = path.join(ROOT, 'vendor', 'model-viewer.min.js');
if (!fs.existsSync(VENDOR_MV)) {
  console.error(
    'vendor/model-viewer.min.js fehlt unter der Repo-Wurzel. Beschaffen mit:\n' +
    '  npm pack @google/model-viewer@3.5.0\n' +
    'und daraus package/dist/model-viewer.min.js nach vendor/model-viewer.min.js kopieren.'
  );
  process.exit(1);
}
const V = fs.readFileSync(VENDOR_MV, 'utf8');

const server = http.createServer((q, s) => {
  const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(p, (e, d) => {
    if (e) { s.writeHead(404); s.end('404'); return; }
    s.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
    s.end(d);
  });
});

const BASE = 'https://kopfkinok3.github.io/USDconfig-demo-player/';

async function mk(b) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.route('https://ajax.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: V }));
  await p.route(BASE + '**', r => {
    const rel = r.request().url().slice(BASE.length).split('?')[0];
    const f = path.join(ROOT, rel);
    if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: 'x' });
    const ct = rel.endsWith('.json') ? 'application/json' : 'model/gltf-binary';
    r.fulfill({ status: 200, contentType: ct, body: fs.readFileSync(f) });
  });
  return p;
}
const wait = async p => {
  await p.waitForFunction(() => document.getElementById('loading').classList.contains('hidden'), null, { timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(600);
};

/* g() (innerhalb jedes evaluate()-Blocks neu definiert, da der Code in die
   Seite injiziert wird) sichert einen einzelnen Wert ab: fehlt ein Element
   (z.B. auf wizard.html), liefert das Feld null statt das ganze Skript mit
   einem ReferenceError abzubrechen. So macht ein fehlendes Element den
   einzelnen Testfall rot statt den gesamten Lauf zu toeten. */

(async () => {
  fs.mkdirSync(UI_OUT, { recursive: true });
  await new Promise(r => server.listen(UI_PORT, r));

  const launchOpts = {
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  };
  let chromeSource = 'Playwright-Chromium (kein UI_CHROME oder Pfad nicht vorhanden)';
  if (UI_CHROME && fs.existsSync(UI_CHROME)) {
    launchOpts.executablePath = UI_CHROME;
    chromeSource = UI_CHROME;
  }
  console.log('Chromium-Quelle: ' + chromeSource);

  const b = await chromium.launch(launchOpts);
  const results = [];
  const check = (n, ok, info) => { results.push({ n, ok, info }); };

  // 1) Datensatz geladen, Preis berechnet, Version sichtbar
  let p = await mk(b);
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`http://localhost:${UI_PORT}/${UI_FILE}?Sitzform=sitzform_normal&Lehne=lehne_trim&Armlehnen=armlehnen_poliert_ring&Bezug=Plano_67_cognac`, { waitUntil: 'load' });
  await wait(p);
  let r = await p.evaluate(() => {
    const g = f => { try { return f(); } catch (e) { return null; } };
    return {
      dataset: g(() => !!DATASET),
      version: g(() => PLAYER_VERSION),
      meta: g(() => document.querySelector('meta[name=usdconfig-version]').content),
      engine: g(() => document.getElementById('engine-badge').textContent),
      priceLabel: g(() => document.querySelector('.price-label').textContent),
      price: g(() => document.getElementById('price-value').textContent),
      viol: g(() => [...document.querySelectorAll('.violation-item')].map(e => e.textContent)),
      violHidden: g(() => document.getElementById('violations').classList.contains('hidden')),
      heading: g(() => document.getElementById('summary-heading').textContent.replace(/\s+/g, ' ').trim()),
      canonical: g(() => document.querySelector('link[rel=canonical]').href),
    };
  });
  check('Datensatz geladen', r.dataset === true, r.dataset);
  check('Version an drei Stellen gleich', r.version === UI_VERSION && r.meta === UI_VERSION && new RegExp(UI_VERSION.replace(/\./g, '\\.')).test(r.engine || ''), `${r.version}/${r.meta}`);
  check('Preiszeile heisst Demo-Preis', r.priceLabel === 'Demo-Preis', r.priceLabel);
  check('Preis berechnet', /\d/.test(r.price || ''), r.price);
  check('Zusammenfassung heisst Demo-Konfiguration', /DEMO.*Demo-Konfiguration/.test(r.heading || ''), r.heading);
  check('Canonical auf visales.de fuer die geprüfte Datei', r.canonical === CANON, r.canonical);
  check('keine JS-Fehler', errs.length === 0, errs.join(' | '));
  await p.screenshot({ path: path.join(UI_OUT, `${UI_TAG}-mit-regeln.png`) });
  await p.close();
  const priceOk = r.price, violOk = r.viol;

  // 2) Regelverstoss sichtbar: requires (Ring-Armlehnen brauchen Sitzform normal)
  p = await mk(b);
  await p.goto(`http://localhost:${UI_PORT}/${UI_FILE}?Sitzform=sitzform_kontur&Lehne=lehne_soft&Armlehnen=armlehnen_poliert_ring&Bezug=Plano_67_cognac`, { waitUntil: 'load' });
  await wait(p);
  r = await p.evaluate(() => {
    const g = f => { try { return f(); } catch (e) { return null; } };
    return {
      viol: g(() => [...document.querySelectorAll('.violation-item')].map(e => e.textContent)),
      hidden: g(() => document.getElementById('violations').classList.contains('hidden')),
      price: g(() => document.getElementById('price-value').textContent),
    };
  });
  check('Verstoss wird angezeigt', r.hidden === false && Array.isArray(r.viol) && r.viol.length > 0, JSON.stringify(r.viol));
  check('Summe bleibt trotz Verstoss', /\d/.test(r.price || ''), r.price);
  await p.screenshot({ path: path.join(UI_OUT, `${UI_TAG}-verstoss.png`) });
  await p.close();
  const priceTestfall2 = r.price;

  // 3) Ohne Parameter: nichts vorbelegt
  p = await mk(b);
  await p.goto(`http://localhost:${UI_PORT}/${UI_FILE}`, { waitUntil: 'load' });
  await wait(p);
  r = await p.evaluate(() => {
    const g = f => { try { return f(); } catch (e) { return null; } };
    return {
      sel: g(() => document.querySelectorAll('.opt-card.selected').length),
      price: g(() => document.getElementById('price-value').textContent),
    };
  });
  check('keine Vorbelegung', r.sel === 0, r.sel);
  const hintsStep1 = await p.evaluate(() => {
    const g = f => { try { return f(); } catch (e) { return null; } };
    return {
      count: g(() => document.querySelectorAll('.opt-card .opt-rule').length),
      texts: g(() => [...document.querySelectorAll('.opt-card .opt-rule')].map(e => e.textContent)),
    };
  });
  check('Regelhinweise auf Schritt 1', hintsStep1.count === 2 && (hintsStep1.texts || []).every(t => t.startsWith('Regel (Demo): ')), JSON.stringify(hintsStep1.texts));
  await p.screenshot({ path: path.join(UI_OUT, `${UI_TAG}-start.png`) });
  const hintsBezug = await p.evaluate(() => {
    const g = f => { try { return f(); } catch (e) { return null; } };
    g(() => renderStep(3));
    return {
      list: g(() => document.querySelectorAll('.swatch-rules .opt-rule').length),
      marked: g(() => document.querySelectorAll('.swatch.swatch--rule').length),
      text: g(() => document.querySelector('.swatch-rules .opt-rule').textContent),
    };
  });
  check('Regelhinweis am Farbraster', hintsBezug.list === 1 && hintsBezug.marked === 1 && /Gelb Pastellgruen nicht mit Lehne Trim/.test(hintsBezug.text || ''), JSON.stringify(hintsBezug));
  await p.waitForTimeout(600);
  await p.screenshot({ path: path.join(UI_OUT, `${UI_TAG}-bezug.png`) });
  await p.close();

  // 5) Sperren mit Grund (v1.3.2): Farbfeld gesperrt durch Lehne Trim
  p = await mk(b);
  await p.goto(`http://localhost:${UI_PORT}/${UI_FILE}?Lehne=lehne_trim`, { waitUntil: 'load' });
  await wait(p);
  let s5 = await p.evaluate(() => {
    const g = f => { try { return f(); } catch (e) { return null; } };
    g(() => renderStep(3));
    const sw = document.querySelector('.swatch--blocked');
    if (sw) sw.click();
    return {
      blocked: g(() => document.querySelectorAll('.swatch--blocked').length),
      aria: g(() => sw.getAttribute('aria-disabled')),
      title: g(() => sw.title),
      line: g(() => document.querySelector('.swatch-rules .opt-rule--blocked').textContent),
      bezug: g(() => state.Bezug),
      toast: g(() => document.getElementById('toast').classList.contains('visible') ? document.getElementById('toast').textContent : null),
    };
  });
  check('Farbfeld gesperrt mit Grund', s5.blocked === 1 && s5.aria === 'true' && /Gesperrt \(Demo\): nicht mit Lehne Trim/.test(s5.title || '') && /Gelb Pastellgruen nicht mit Lehne Trim/.test(s5.line || ''), JSON.stringify(s5));
  check('Klick auf gesperrtes Farbfeld: keine Auswahl, Toast', (s5.bezug === null || s5.bezug === undefined) && /Gelb Pastellgruen/.test(s5.toast || ''), JSON.stringify({ bezug: s5.bezug, toast: s5.toast }));
  await p.waitForTimeout(600);
  await p.screenshot({ path: path.join(UI_OUT, `${UI_TAG}-gesperrt-farbe.png`) });
  await p.close();

  // 5b) Karte gesperrt durch Sitzform Kontur
  p = await mk(b);
  await p.goto(`http://localhost:${UI_PORT}/${UI_FILE}?Sitzform=sitzform_kontur`, { waitUntil: 'load' });
  await wait(p);
  s5 = await p.evaluate(() => {
    const g = f => { try { return f(); } catch (e) { return null; } };
    g(() => renderStep(2));
    const card = document.querySelector('.opt-card--blocked');
    if (card) card.click();
    return {
      blocked: g(() => document.querySelectorAll('.opt-card--blocked').length),
      label: g(() => card.querySelector('.opt-label').textContent),
      aria: g(() => card.getAttribute('aria-disabled')),
      line: g(() => card.querySelector('.opt-rule--blocked').textContent),
      arm: g(() => state.Armlehnen),
      toast: g(() => document.getElementById('toast').classList.contains('visible') ? document.getElementById('toast').textContent : null),
    };
  });
  check('Karte gesperrt mit Grund', s5.blocked === 1 && s5.label === 'Poliert, Ring' && s5.aria === 'true' && /Gesperrt \(Demo\): braucht Sitzform Normal, gewählt ist Sitzform Kontur/.test(s5.line || ''), JSON.stringify(s5));
  check('Klick auf gesperrte Karte: keine Auswahl, Toast', (s5.arm === null || s5.arm === undefined) && /Poliert, Ring/.test(s5.toast || ''), JSON.stringify({ arm: s5.arm, toast: s5.toast }));
  await p.waitForTimeout(600);
  await p.screenshot({ path: path.join(UI_OUT, `${UI_TAG}-gesperrt-karte.png`) });
  await p.close();

  // 4) Ohne Datensatz: Fallback statt weisser Seite
  p = await mk(b);
  await p.route(BASE + 'data/**', r2 => r2.fulfill({ status: 404, body: 'nope' }));
  await p.goto(`http://localhost:${UI_PORT}/${UI_FILE}`, { waitUntil: 'load' });
  await wait(p);
  r = await p.evaluate(() => {
    const g = f => { try { return f(); } catch (e) { return null; } };
    return {
      cards: g(() => document.querySelectorAll('.opt-card').length),
      price: g(() => document.getElementById('price-value').textContent),
    };
  });
  check('Fallback ohne Datensatz', typeof r.cards === 'number' && r.cards > 0, `${r.cards} Karten, Preis: ${r.price}`);
  await p.close();

  await b.close();
  server.close();

  let f = 0;
  results.forEach(x => { if (!x.ok) f++; console.log(`${x.ok ? 'PASS' : 'FAIL'}  ${x.n}${x.ok ? '' : '   -> ' + x.info}`); });
  console.log(`\nPreis im Testfall 1: ${priceOk}`);
  console.log(`Verstoesse Testfall 1: ${JSON.stringify(violOk)}`);
  console.log(`Preis im Testfall 2: ${priceTestfall2}`);
  console.log(f === 0 ? '\nAlle bestanden.' : `\n${f} gescheitert.`);
  console.log(`SUMMARY ${UI_TAG} pass=${results.length - f} fail=${f}`);
  if (f > 0) process.exitCode = 1;
})();
