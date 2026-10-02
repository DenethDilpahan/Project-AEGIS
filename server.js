const express = require('express'), path = require('path');
const app = express();
app.use(express.json());

const ORIGIN = process.env.ALLOWED_ORIGIN || '*';
app.use((req, res, next) => {
  res.set({
    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
  });
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.get('/healthz', (req, res) => res.send('ok'));
app.use(express.static(path.join(__dirname, 'dist')));

// ---- config (tune with real field data) ----
const CFG = { critical: 70, rainSevere: 30, riseFast: 1.5, window: 15 * 60e3, roadCut: 80, key: process.env.AEGIS_KEY || '' };
const S = { readings: [], reports: [], official: false, demo: false, vt: Date.now() };
const now = () => (S.demo ? S.vt : Date.now());
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const num = v => typeof v === 'number' && isFinite(v);

// ---- sensor ingestion (validated; invalid readings lower reliability) ----
function addReading(r, src) {
  const ok = num(r.waterLevel) && num(r.rainfall) && r.waterLevel >= 0 && r.waterLevel <= 100 && r.rainfall >= 0 && r.rainfall <= 500;
  S.readings.push({ t: now(), node: r.nodeId || 'node-1', waterLevel: r.waterLevel, rainfall: r.rainfall,
    temp: r.temp, humidity: r.humidity, smoke: r.smoke, light: r.light, valid: ok, src });
  if (S.readings.length > 300) S.readings.shift();
  return ok;
}

// ---- RISK ENGINE: Severity S = 4W + 2C + 2R + 3E (max 11); Confidence = (N + M + reliability)/3 ----
function assess(i) {
  const W = +(i.level >= CFG.critical), T = +(i.rise >= CFG.riseFast), C = +(i.reports >= 1),
        R = +(i.rainfall >= CFG.rainSevere), N = +!!i.official;
  const E = +((W || T || C || R) && i.exposed !== false);                 // assets in zone + a hazard signal
  const M = +([W || T, C, R, N].reduce((a, b) => a + b, 0) >= 2);         // >=2 independent source types agree
  const score = 4 * W + 2 * C + 2 * R + 3 * E;
  const level = score >= 9 ? 'CRITICAL' : score >= 6 ? 'HIGH' : score >= 3 ? 'MODERATE' : 'LOW';
  const confidence = (N + M + (i.reliability ?? 1)) / 3;
  return { score, level, confidence, rise: i.rise, factors: [
    { name: 'W  water ≥ critical', v: W, w: 4 }, { name: 'C  community reports', v: C, w: 2 },
    { name: 'R  severe rainfall', v: R, w: 2 }, { name: 'E  exposure + hazard signal', v: E, w: 3 },
    { name: 'T  rising fast (hazard signal)', v: T, w: 0 }, { name: 'N  official confirmation (confidence)', v: N, w: 0 },
    { name: 'M  multi-source agreement (confidence)', v: M, w: 0 }] };
}

function live() {
  const valid = S.readings.filter(r => r.valid), recent = valid.filter(r => r.t >= now() - 5 * 60e3);
  let rise = 0;
  if (recent.length > 1) { const a = recent[0], b = recent[recent.length - 1], dt = (b.t - a.t) / 60e3; if (dt > 0) rise = (b.waterLevel - a.waterLevel) / dt; }
  const last10 = S.readings.slice(-10);
  return { last: valid[valid.length - 1], rise, reports: S.reports.filter(x => x.t >= now() - CFG.window).length,
    rel: last10.length ? last10.filter(r => r.valid).length / last10.length : 0 };
}

app.get('/api/state', (req, res) => {
  const l = live();
  const risk = assess({ level: l.last?.waterLevel ?? 0, rainfall: l.last?.rainfall ?? 0, rise: l.rise, reports: l.reports, official: S.official, reliability: l.rel });
  res.json({ risk, latest: l.last, history: S.readings.filter(r => r.valid).slice(-60), reports: S.reports, official: S.official, demo: S.demo, critical: CFG.critical });
});

// ESP32 posts here: {nodeId, waterLevel(%), rainfall(mm/h), temp, humidity, smoke, light}
app.post('/api/sensor', (req, res) => {
  if (CFG.key && req.get('x-api-key') !== CFG.key) return res.status(401).json({ error: 'bad key' });
  if (S.demo) return res.status(409).json({ error: 'demo running' });
  addReading(req.body, 'device') ? res.json({ ok: true }) : res.status(400).json({ error: 'invalid reading' });
});
app.post('/api/reports', (req, res) => {
  const text = String(req.body.text || '').trim().slice(0, 200);
  if (!text) return res.status(400).json({ error: 'text required' });
  S.reports.push({ t: now(), text, src: 'user' }); res.json({ ok: true });
});
app.post('/api/confirm', (req, res) => { S.official = !!req.body.value; res.json({ ok: true }); });

// ---- WHAT-IF SIMULATOR: inflow ∝ rainfall, outflow ∝ level × drain capacity ----
app.post('/api/simulate', (req, res) => {
  const b = req.body, rain = (+b.rainfall || 0) * (+b.rainMult || 1), dur = clamp(+b.duration || 30, 1, 180), block = clamp(+b.blockage || 0, 0, 100);
  let L = clamp(+b.level || 0, 0, 100), ttc = null, cut = null;
  const steps = [{ m: 0, level: L }];
  for (let m = 1; m <= dur; m++) {
    L = clamp(L + rain * 0.03 - 2 * (1 - block / 100) * L / 100, 0, 100);
    steps.push({ m, level: +L.toFixed(1) });
    if (ttc == null && L >= CFG.critical) ttc = m;
    if (cut == null && L >= CFG.roadCut) cut = m;
  }
  steps.forEach((s, i) => { s.risk = assess({ level: s.level, rainfall: rain, rise: s.level - steps[Math.max(0, i - 1)].level, reports: +b.reports || 0 }).level; });
  res.json({ steps, ttc, roadCut: cut, peak: Math.max(...steps.map(s => s.level)), rain });
});

// ---- scripted demo scenario (clearly flagged DEMO DATA; 1 tick = 1 simulated minute) ----
let timer = null, tick = 0;
const RP = { 14: 'Water covering the road near the school gate', 17: 'Drain overflowing', 20: 'Road difficult to cross' };
const stop = () => { clearInterval(timer); timer = null; };
app.post('/api/demo/:a', (req, res) => {
  const a = req.params.a;
  if (a === 'reset' || a === 'start') { stop(); S.readings = []; S.reports = []; S.official = false; tick = 0; S.demo = a === 'start'; S.vt = Date.now(); }
  if (a === 'stop') stop();
  if (a === 'start') timer = setInterval(() => {
    tick++; S.vt += 60e3;
    addReading({ waterLevel: +clamp(35 + Math.max(0, tick - 5) * 1.6, 0, 95).toFixed(1), rainfall: clamp(10 + tick * 2, 0, 80), temp: 27, humidity: 90, smoke: 0, light: 20 }, 'demo');
    if (RP[tick]) S.reports.push({ t: now(), text: RP[tick], src: 'demo' });
    if (tick === 24) S.official = true;   // official confirmation arrives
    if (tick >= 40) stop();
  }, 1500);
  res.json({ ok: true });
});

app.listen(process.env.PORT || 3000, () => console.log('AEGIS prototype on http://localhost:' + (process.env.PORT || 3000)));
