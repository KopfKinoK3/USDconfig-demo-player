/* Testaufbau fuer A1 (typisierte Werte) und A2 (Regel-Layer).
   Ebene 1: reine Datentests gegen den Regel-Auswerter, kein Browser, keine
   Abhaengigkeit. Ebene 2: Oberflaeche, kopflos mit Playwright.
   Gegenprobe: derselbe Fall zusaetzlich gegen wizard.html (Stand ohne die
   neue Funktion) -- siehe je Abschnitt.
   Aufruf: node test/a1a2.js */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const http = require('node:http');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const ROOT = path.join(__dirname, '..');
/* RULES_FILE (Pfad relativ zur Repo-Wurzel) waehlt die zu pruefende Datei,
   Standard rules-demo.html. So laeuft Ebene 1 auch gegen die ausgelieferte
   Fassung unter deploy/visales/. Ebene 2 bleibt fest auf rules-demo.html. */
const RULES_FILE = process.env.RULES_FILE || 'rules-demo.html';
const RULES_HTML = path.join(ROOT, RULES_FILE);
const WIZARD_HTML = path.join(ROOT, 'wizard.html');
const DATASET_PATH = path.join(ROOT, 'data', 'buerostuhl-demo.json');

/* ── Pure-Block aus einer HTML-Datei extrahieren und per vm ausfuehren ──
   Einzige Quelle: der Block zwischen den Markern in rules-demo.html.
   Gegen wizard.html liefert das absichtlich null, das ist die Gegenprobe:
   der alte Stand hat den Auswerter gar nicht. */
function loadPureModule(htmlPath) {
  const src = fs.readFileSync(htmlPath, 'utf8');
  const m = src.match(/\/\* @pure-start \*\/([\s\S]*?)\/\* @pure-end \*\//);
  if (!m) return null;
  const sandbox = { module: { exports: {} }, console };
  vm.createContext(sandbox);
  vm.runInContext(m[1], sandbox, { filename: htmlPath + '#pure' });
  return sandbox.module.exports;
}

const RULES_MODULE = loadPureModule(RULES_HTML);
const REAL_DATASET = JSON.parse(fs.readFileSync(DATASET_PATH, 'utf8'));

if (!RULES_MODULE) {
  throw new Error(RULES_FILE + ' liefert keinen @pure-start/@pure-end-Block -- Auswerter fehlt.');
}
const { loadDataset, evaluateConfiguration } = RULES_MODULE;

/* ══════════════════════ EBENE 1: reine Datentests ══════════════════════ */

test('Gegenprobe: wizard.html hat keinen Regel-Auswerter (alter Stand)', () => {
  const wizardModule = loadPureModule(WIZARD_HTML);
  assert.equal(wizardModule, null, 'wizard.html darf keinen @pure-start-Block enthalten');
  const src = fs.readFileSync(WIZARD_HTML, 'utf8');
  assert.equal(/Demo-Preis/.test(src), false, 'wizard.html darf kein Demo-Preis-Label tragen');
  assert.equal(/"rules"\s*:/.test(src), false, 'wizard.html darf keine Regeln als Daten tragen');
});

/* -- A1, Abnahme Punkt 1: base am Produkt, delta an der Option -- */
test('A1.1 — base steht am Produkt, Optionen tragen delta', () => {
  assert.ok(REAL_DATASET.base, 'Datensatz braucht base');
  const opt = REAL_DATASET.steps
    .flatMap(s => s.options)
    .find(o => o.code === 'armlehnen_poliert_ring');
  assert.ok(opt && opt.delta, 'Option muss delta tragen');
});

/* -- A1, Abnahme Punkt 2 -- */
test('A1.2 — Preis und Gewicht einer vollstaendigen Auswahl korrekt aufsummiert', () => {
  const result = evaluateConfiguration(REAL_DATASET, [
    'sitzform_normal', 'lehne_soft', 'armlehnen_poliert_ring',
    'Plano_03_pergament_cremeweiss', 'kein_paket',
  ]);
  assert.equal(result.violations.length, 0, 'diese Auswahl ist gueltig, keine Verstoesse erwartet');
  assert.deepEqual(
    { value: result.totals.price.value, complete: result.totals.price.complete },
    { value: 103000, complete: true },
  );
  assert.deepEqual(
    { value: result.totals.weight.value, complete: result.totals.weight.complete },
    { value: 15000, complete: true },
  );
});

/* -- A1, Abnahme Punkt 3 -- */
test('A1.3 — mode "ausgeblendet" liefert keine Summe, sondern die Auskunft', () => {
  const dataset = {
    base: { price: { mode: 'ausgeblendet' }, weight: { value: 1000, unit: 'g' } },
    steps: [{ key: 'X', label: 'X', options: [
      { code: 'a', label: 'A', delta: { price: { mode: 'ausgeblendet' }, weight: { value: 100, unit: 'g' } } },
    ] }],
    rules: [],
  };
  const result = evaluateConfiguration(dataset, ['a']);
  assert.equal(result.totals.price.available, false);
  assert.equal(result.totals.price.reason, 'ausgeblendet');
});

/* -- A1, Abnahme Punkt 4 -- */
test('A1.4 — fehlendes Feld kennzeichnet die Summe als unvollstaendig', () => {
  const dataset = {
    base: {
      price: { mode: 'listenpreis', value: 1000, unit: 'EUR', scale: 2 },
      weight: { value: 500, unit: 'g' },
    },
    steps: [{ key: 'X', label: 'X', options: [
      { code: 'a', label: 'A', delta: { price: { mode: 'listenpreis', value: 200, unit: 'EUR', scale: 2 } } },
    ] }],
    rules: [],
  };
  const result = evaluateConfiguration(dataset, ['a']);
  assert.equal(result.totals.price.complete, true, 'Preis ist bei dieser Auswahl vollstaendig');
  assert.equal(result.totals.weight.complete, false, 'Gewicht fehlt bei Option a, muss unvollstaendig sein');
});

/* -- A1, Abnahme Punkt 5 -- */
test('A1.5 — groessenordnung liefert ein Intervall, keine Punktzahl', () => {
  const dataset = {
    base: { price: { mode: 'groessenordnung', min: 10000, max: 25000, unit: 'EUR', scale: 2 } },
    steps: [{ key: 'X', label: 'X', options: [
      { code: 'a', label: 'A', delta: { price: { mode: 'groessenordnung', min: 1000, max: 2000, unit: 'EUR', scale: 2 } } },
    ] }],
    rules: [],
  };
  const result = evaluateConfiguration(dataset, ['a']).totals.price;
  assert.equal(result.mode, 'groessenordnung');
  assert.equal(result.value, undefined, 'darf nicht zu einer Punktzahl verdichtet werden');
  assert.deepEqual({ min: result.min, max: result.max }, { min: 11000, max: 27000 });
});

/* -- A1, Abnahme Punkt 6 -- */
test('A1.6 — alle Werte sind Ganzzahlen, Geldbetraege tragen scale', () => {
  const fields = [];
  fields.push(REAL_DATASET.base.price, REAL_DATASET.base.weight);
  REAL_DATASET.steps.forEach(s => s.options.forEach(o => {
    fields.push(o.delta.price, o.delta.weight);
  }));
  fields.forEach(f => {
    if (f.value !== undefined) assert.ok(Number.isInteger(f.value), `${JSON.stringify(f)} muss Ganzzahl sein`);
    if (f.unit === 'EUR') assert.equal(typeof f.scale, 'number', `${JSON.stringify(f)} braucht scale`);
  });
});

/* -- A1, Abnahme Punkt 7 -- */
test('A1.7 — Demo-Schalter im Datensatz, Preiszeile und Zusammenfassung tragen Demo-Beschriftung', () => {
  assert.equal(REAL_DATASET.demo, true);
  const src = fs.readFileSync(RULES_HTML, 'utf8');
  assert.ok(/Demo-Preis/.test(src), 'Preiszeile muss "Demo-Preis" tragen');
  assert.ok(/Demo-Konfiguration/.test(src), 'Zusammenfassung muss "Demo-Konfiguration" tragen');
});

/* -- A2, Abnahme Punkt 2 -- */
test('A2.2 — doppelte Codes werden beim Laden als Datenfehler gemeldet', () => {
  const dataset = {
    steps: [
      { key: 'X', label: 'X', options: [{ code: 'dup', label: 'Dup' }] },
      { key: 'Y', label: 'Y', options: [{ code: 'dup', label: 'Dup 2' }] },
    ],
  };
  const { errors } = loadDataset(dataset);
  assert.ok(errors.length > 0, 'doppelter Code muss als Fehler gemeldet werden');
});

/* -- A2, Abnahme Punkt 3 -- */
test('A2.3 — excludes wirkt in beiden Richtungen, obwohl nur eine geschrieben ist', () => {
  const r1 = evaluateConfiguration(REAL_DATASET, ['lehne_trim', 'Plano_39_gelb_pastellgruen']);
  const r2 = evaluateConfiguration(REAL_DATASET, ['Plano_39_gelb_pastellgruen', 'lehne_trim']);
  assert.ok(r1.violations.some(v => v.type === 'excludes'), 'Reihenfolge 1 muss den Verstoss erkennen');
  assert.ok(r2.violations.some(v => v.type === 'excludes'), 'Reihenfolge 2 muss den Verstoss erkennen');

  const clean = evaluateConfiguration(REAL_DATASET, ['lehne_trim']);
  assert.equal(clean.violations.some(v => v.type === 'excludes'), false, 'ohne den Bezug-Code kein Verstoss');
});

/* -- A2, Abnahme Punkt 4 -- */
test('A2.4 — requires mit mehreren if-Codes greift nur, wenn alle gewaehlt sind', () => {
  const dataset = {
    base: {}, rules: [
      { type: 'requires', if: ['a', 'b'], then: ['c'], message: 'Beispielregel: a und b brauchen c.' },
    ],
    steps: [{ key: 'X', label: 'X', options: [
      { code: 'a', label: 'A' }, { code: 'b', label: 'B' }, { code: 'c', label: 'C' },
    ] }],
  };
  assert.equal(evaluateConfiguration(dataset, ['a']).violations.length, 0, 'nur ein if-Code -> Regel greift nicht');
  assert.equal(evaluateConfiguration(dataset, ['a', 'b']).violations.length, 1, 'beide if-Codes ohne then -> Verstoss');
  assert.equal(evaluateConfiguration(dataset, ['a', 'b', 'c']).violations.length, 0, 'alle da -> kein Verstoss');
});

/* -- A2, Abnahme Punkt 5 -- */
test('A2.5 — Buendel addiert die delta der enthaltenen Optionen nicht doppelt', () => {
  const onlyBundle = evaluateConfiguration(REAL_DATASET, ['paket_comfort']);
  assert.equal(onlyBundle.lockedCodes.sort().join(','), 'armlehnen_poliert_ring,lehne_soft');
  // base 89000 + paket_comfort delta 16000, NICHT zusaetzlich + 18000 fuer armlehnen_poliert_ring
  assert.equal(onlyBundle.totals.price.value, 89000 + 16000);

  const alsoExplicit = evaluateConfiguration(REAL_DATASET, ['paket_comfort', 'armlehnen_poliert_ring']);
  assert.equal(alsoExplicit.totals.price.value, 89000 + 16000, 'explizite Doppelwahl darf nicht doppelt zaehlen');
});

/* -- A2, Abnahme Punkt 6 -- */
test('A2.6 — affects wirkt erst nach der Summe, Reihenfolge der Regeln aendert das Ergebnis nicht', () => {
  const real = evaluateConfiguration(REAL_DATASET, ['lehne_trim', 'armlehnen_poliert_ring', 'sitzform_normal']);
  assert.equal(real.attributes.verstellbereich.value, 80 - 20);

  const ruleA = { type: 'affects', if: ['a'], attribute: 'attr', delta: { value: -10, unit: 'mm' }, message: 'Beispielregel: A.' };
  const ruleB = { type: 'affects', if: ['b'], attribute: 'attr', delta: { value: -5, unit: 'mm' }, message: 'Beispielregel: B.' };
  const base = { base: { attr: { value: 100, unit: 'mm' } }, steps: [] };
  const forward = evaluateConfiguration({ ...base, rules: [ruleA, ruleB] }, ['a', 'b']);
  const backward = evaluateConfiguration({ ...base, rules: [ruleB, ruleA] }, ['a', 'b']);
  assert.equal(forward.attributes.attr.value, 85);
  assert.equal(backward.attributes.attr.value, 85);
});

/* -- A2, Abnahme Punkt 7 -- */
test('A2.7 — ungueltige Auswahl liefert Summe UND Verstossliste, kein Abbruch', () => {
  const result = evaluateConfiguration(REAL_DATASET, ['sitzform_kontur', 'armlehnen_poliert_ring']);
  assert.ok(result.violations.length > 0, 'requires-Verstoss erwartet (Ring-Armlehnen ohne Sitzform Normal)');
  assert.equal(result.totals.price.available, true, 'trotz Verstoss wird eine Summe geliefert');
});

/* -- A2, Abnahme Punkt 8 -- */
test('A2.8 — jede Beispielregel ist als solche gekennzeichnet', () => {
  assert.ok(REAL_DATASET.rules.length > 0);
  REAL_DATASET.rules.forEach(r => {
    assert.ok(r.message.includes('Beispielregel'), `Regel ${r.type} muss "Beispielregel" im message tragen`);
  });
});

/* -- A2.9, Regelhinweise an der Option (SPEC-A2, Abschnitt "Regelhinweise") -- */
const { ruleHintsForOption } = RULES_MODULE;
/* Der @pure-Block laeuft per vm in einem eigenen Realm, seine Arrays haben ein fremdes
   Array.prototype; assert/strict deepEqual vergleicht Prototypen, deshalb der Spread in
   den Test-Realm. */
const texts = code => [...ruleHintsForOption(REAL_DATASET, code)].map(h => h.text);

test('A2.9.1 — requires: Hinweis an ausloesender, betroffener und alternativer Option', () => {
  assert.deepEqual(texts('armlehnen_poliert_ring').filter(t => t.startsWith('nur mit')), ['nur mit Sitzform Normal']);
  assert.deepEqual(texts('sitzform_normal'), ['Voraussetzung für Armlehnen Poliert, Ring']);
  assert.deepEqual(texts('sitzform_kontur'), ['nicht mit Armlehnen Poliert, Ring']);
});
test('A2.9.2 — excludes: Hinweis in beiden Richtungen', () => {
  assert.ok(texts('lehne_trim').includes('nicht mit Bezugfarbe Gelb Pastellgruen'));
  assert.deepEqual(texts('Plano_39_gelb_pastellgruen'), ['nicht mit Lehne Trim']);
});
test('A2.9.3 — bundle: Paket nennt Inhalt, Inhalt nennt Paket, Alternativen nennen die Festlegung', () => {
  assert.deepEqual(texts('paket_comfort'), ['enthält Armlehnen Poliert, Ring und Lehne Soft']);
  assert.deepEqual(texts('lehne_soft'), ['im Paket Comfort enthalten']);
  assert.ok(texts('armlehnen_poliert_ring').includes('im Paket Comfort enthalten'));
  assert.deepEqual(texts('kein_paket'), []);
  assert.deepEqual(texts('armlehnen_ohne'), ['mit Paket Comfort festgelegt auf Armlehnen Poliert, Ring']);
});
test('A2.9.4 — affects: Partner und Wirkung mit Vorzeichen als Wort', () => {
  assert.ok(texts('lehne_trim').includes('zusammen mit Armlehnen Poliert, Ring: Verstellbereich minus 20 mm'));
  assert.ok(texts('armlehnen_poliert_ring').includes('zusammen mit Lehne Trim: Verstellbereich minus 20 mm'));
});
test('A2.9.5 — genau die Optionen mit Regelbezug tragen Hinweise', () => {
  const withHints = [];
  REAL_DATASET.steps.forEach(s => s.options.forEach(o => { if (texts(o.code).length) withHints.push(o.code); }));
  assert.deepEqual(withHints.sort(), ['Plano_39_gelb_pastellgruen', 'armlehnen_ohne', 'armlehnen_exoliert_3d', 'armlehnen_poliert_ring', 'lehne_soft', 'lehne_trim', 'paket_comfort', 'sitzform_kontur', 'sitzform_normal'].sort());
  assert.deepEqual(texts('Plano_67_cognac'), []);
});
test('A2.9.6 — Reihenfolge folgt den Regeln im Datensatz, jeder Hinweis traegt seinen Typ', () => {
  const hints = [...ruleHintsForOption(REAL_DATASET, 'armlehnen_poliert_ring')];
  assert.deepEqual(hints.map(h => h.type), ['requires', 'bundle', 'affects']);
  assert.deepEqual(hints.map(h => h.text), ['nur mit Sitzform Normal', 'im Paket Comfort enthalten', 'zusammen mit Lehne Trim: Verstellbereich minus 20 mm']);
});
test('Gegenprobe: die v1.3.0-Auslieferung hat keine Regelhinweise (alter Stand)', () => {
  const oldHtml = path.join(ROOT, 'deploy', 'visales', 'usdconfig-demo-v1-3-0.html');
  const oldModule = loadPureModule(oldHtml);
  assert.ok(oldModule, 'v1.3.0 muss einen @pure-Block haben');
  assert.equal(typeof oldModule.ruleHintsForOption, 'undefined');
  assert.equal(/opt-rule/.test(fs.readFileSync(oldHtml, 'utf8')), false);
});

/* -- A2.10, Sperren mit Grund (SPEC-A2, Abschnitt "Sperren mit Grund") -- */
const { availabilityFor, bundleConflicts } = RULES_MODULE;
const av = (sel, code) => { const a = availabilityFor(REAL_DATASET, sel, code); return { blocked: a.blocked, texts: [...a.reasons].map(r => r.text) }; };

test('A2.10.1 — excludes sperrt in beide Richtungen, mit Grund', () => {
  assert.deepEqual(av(['lehne_trim'], 'Plano_39_gelb_pastellgruen'), { blocked: true, texts: ['nicht mit Lehne Trim'] });
  assert.deepEqual(av(['Plano_39_gelb_pastellgruen'], 'lehne_trim'), { blocked: true, texts: ['nicht mit Bezugfarbe Gelb Pastellgruen'] });
  assert.equal(av(['lehne_soft'], 'Plano_39_gelb_pastellgruen').blocked, false);
});
test('A2.10.2 — requires sperrt Ausloeser und Alternative, nicht bei offener Voraussetzung', () => {
  assert.deepEqual(av(['sitzform_kontur'], 'armlehnen_poliert_ring'), { blocked: true, texts: ['braucht Sitzform Normal, gewählt ist Sitzform Kontur'] });
  assert.deepEqual(av(['armlehnen_poliert_ring'], 'sitzform_kontur'), { blocked: true, texts: ['nicht mit Armlehnen Poliert, Ring'] });
  assert.equal(av([], 'armlehnen_poliert_ring').blocked, false);
  assert.equal(av(['sitzform_normal'], 'armlehnen_poliert_ring').blocked, false);
  assert.equal(av(['armlehnen_poliert_ring'], 'sitzform_normal').blocked, false);
});
test('A2.10.3 — bundle sperrt Alternativen und das Paket, in beide Richtungen', () => {
  assert.deepEqual(av(['paket_comfort'], 'lehne_trim'), { blocked: true, texts: ['mit Paket Comfort festgelegt auf Lehne Soft'] });
  assert.deepEqual(av(['paket_comfort'], 'armlehnen_ohne'), { blocked: true, texts: ['mit Paket Comfort festgelegt auf Armlehnen Poliert, Ring'] });
  assert.equal(av(['paket_comfort'], 'lehne_soft').blocked, false);
  assert.equal(av(['paket_comfort'], 'kein_paket').blocked, false);
  assert.deepEqual(av(['lehne_trim'], 'paket_comfort'), { blocked: true, texts: ['nicht mit Lehne Trim, das Paket enthält Lehne Soft'] });
  assert.equal(av(['lehne_soft', 'armlehnen_poliert_ring'], 'paket_comfort').blocked, false);
  assert.deepEqual(av(['lehne_trim', 'armlehnen_ohne'], 'paket_comfort').texts, ['nicht mit Armlehnen Ohne und Lehne Trim, das Paket enthält Armlehnen Poliert, Ring und Lehne Soft']);
});
test('A2.10.4 — affects sperrt nie, ohne Auswahl ist nichts gesperrt', () => {
  assert.equal(av(['lehne_trim'], 'armlehnen_poliert_ring').blocked, false);
  assert.equal(av(['lehne_trim', 'sitzform_normal'], 'armlehnen_poliert_ring').blocked, false);
  REAL_DATASET.steps.forEach(s => s.options.forEach(o => assert.equal(av([], o.code).blocked, false, o.code)));
});
test('A2.10.5 — Paket-Konflikt ist ein Verstoss mit Kennzeichnung', () => {
  const v = [...bundleConflicts(REAL_DATASET, ['paket_comfort', 'lehne_trim'])];
  assert.equal(v.length, 1);
  assert.equal(v[0].type, 'bundle');
  assert.equal(v[0].message, 'Beispielregel: Paket Comfort legt Lehne Soft fest, Lehne Trim ist damit nicht wählbar.');
  assert.equal([...bundleConflicts(REAL_DATASET, ['paket_comfort', 'lehne_soft'])].length, 0);
  const full = evaluateConfiguration(REAL_DATASET, ['paket_comfort', 'lehne_trim']);
  assert.equal([...full.violations].filter(x => x.type === 'bundle').length, 1);
});
test('A2.10.6 — gewaehlt und trotzdem gesperrt (Link mit ungueltiger Kombination)', () => {
  assert.deepEqual(av(['sitzform_kontur', 'armlehnen_poliert_ring'], 'armlehnen_poliert_ring'), { blocked: true, texts: ['braucht Sitzform Normal, gewählt ist Sitzform Kontur'] });
  assert.deepEqual(av(['sitzform_kontur', 'armlehnen_poliert_ring'], 'sitzform_kontur'), { blocked: true, texts: ['nicht mit Armlehnen Poliert, Ring'] });
});
test('Gegenprobe: die v1.3.1-Auslieferung hat keine Sperren (alter Stand)', () => {
  const oldHtml = path.join(ROOT, 'deploy', 'visales', 'usdconfig-demo-v1-3-1.html');
  const oldModule = loadPureModule(oldHtml);
  assert.ok(oldModule, 'v1.3.1 muss einen @pure-Block haben');
  assert.equal(typeof oldModule.availabilityFor, 'undefined');
  assert.equal(/swatch--blocked/.test(fs.readFileSync(oldHtml, 'utf8')), false);
});

/* ══════════════════════ EBENE 2: Oberflaeche, kopflos ══════════════════════ */

let playwright;
try {
  playwright = require('playwright');
} catch (e) {
  playwright = null;
}

function startStaticServer(root) {
  const MIME = { '.html': 'text/html', '.json': 'application/json', '.js': 'text/javascript', '.glb': 'model/gltf-binary' };
  const server = http.createServer((req, res) => {
    const reqPath = decodeURIComponent(req.url.split('?')[0]);
    const filePath = path.join(root, reqPath);
    if (!filePath.startsWith(root)) { res.writeHead(403); res.end(); return; }
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end(); return; }
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

if (!playwright) {
  test('Ebene 2 (Oberflaeche) — uebersprungen: `npm install` noch nicht ausgefuehrt', { skip: true }, () => {});
} else {
  test('Ebene 2 — Oberflaeche', async (t) => {
    const { server, port } = await startStaticServer(ROOT);
    const base = `http://127.0.0.1:${port}`;
    const browser = await playwright.chromium.launch();
    t.after(async () => { await browser.close(); server.close(); });

    await t.test('rules-demo.html zeigt Demo-Preis und Demo-Konfiguration, keine Konsolenfehler', async () => {
      const page = await browser.newPage();
      const errors = [];
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
      page.on('pageerror', err => errors.push(String(err)));
      await page.goto(`${base}/rules-demo.html`);
      await page.waitForSelector('#loading.hidden', { timeout: 15000 });
      const priceText = await page.textContent('#price-value');
      assert.notEqual(priceText.trim(), '–', 'Demo-Preis muss einen Wert zeigen, sobald der Datensatz geladen ist');
      const bodyText = await page.textContent('#panel');
      assert.ok(bodyText.includes('Demo-Konfiguration'), 'Zusammenfassung muss Demo-Konfiguration tragen');
      assert.equal(errors.length, 0, 'keine JavaScript-Fehler in der Konsole: ' + errors.join(' | '));
      await page.close();
    });

    await t.test('ungueltige Auswahl macht die Verstossliste sichtbar', async () => {
      const page = await browser.newPage();
      await page.goto(`${base}/rules-demo.html?Sitzform=sitzform_kontur&Lehne=lehne_trim&Armlehnen=armlehnen_poliert_ring&Bezug=Plano_39_gelb_pastellgruen&Pakete=kein_paket`);
      await page.waitForSelector('#loading.hidden', { timeout: 15000 });
      await page.evaluate(() => window.renderStep(0));
      const hidden = await page.getAttribute('#violations', 'class');
      assert.ok(!hidden.includes('hidden'), 'Verstossliste muss sichtbar sein');
      const count = await page.locator('.violation-item').count();
      assert.ok(count >= 1, 'mindestens ein Verstoss muss angezeigt werden');
      await page.close();
    });

    await t.test('Buendel markiert enthaltene Optionen als "im Paket enthalten"', async () => {
      const page = await browser.newPage();
      await page.goto(`${base}/rules-demo.html?Pakete=paket_comfort`);
      await page.waitForSelector('#loading.hidden', { timeout: 15000 });
      await page.evaluate(() => window.renderStep(2)); // Schritt "Armlehnen"
      const bodyText = await page.textContent('#step-body');
      assert.ok(bodyText.includes('im Paket enthalten'), 'Armlehnen-Karte muss den Buendel-Hinweis zeigen');
      await page.close();
    });

    await t.test('kaputter Datensatz: Konfigurator startet trotzdem, ohne Werte', async () => {
      const page = await browser.newPage();
      await page.route('**/data/buerostuhl-demo.json', route => route.fulfill({ status: 200, body: '{not valid json' }));
      await page.goto(`${base}/rules-demo.html`);
      await page.waitForSelector('#loading.hidden', { timeout: 15000 });
      const cardCount = await page.locator('.opt-card').count();
      assert.ok(cardCount > 0, 'Konfigurator muss trotz kaputtem Datensatz Optionen zeigen');
      const priceText = await page.textContent('#price-value');
      assert.notEqual(priceText.trim(), '', 'Preiszeile darf nicht leer/weiss bleiben');
      await page.close();
    });

    await t.test('Gegenprobe: wizard.html zeigt weder Demo-Preis noch eine Verstossliste', async () => {
      const page = await browser.newPage();
      await page.goto(`${base}/wizard.html`);
      await page.waitForSelector('#loading.hidden', { timeout: 15000 });
      const bodyText = await page.textContent('#panel');
      assert.equal(bodyText.includes('Demo-Preis'), false);
      assert.equal(bodyText.includes('Demo-Konfiguration'), false);
      assert.equal(await page.locator('#violations').count(), 0);
      await page.close();
    });
  });
}
