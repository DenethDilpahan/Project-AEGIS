# AEGIS prototype (React + Node)

Dev (hot reload):  `npm install && npm run dev`  → open http://localhost:5173 (API on :3000)
Demo build:        `npm install && npm start`    → open http://localhost:3000

Demo: Dashboard → "Start flood scenario" (1 tick = 1 simulated minute, ~1 min total). Scripted values are labelled DEMO DATA.

Real sensor (ESP32) → backend:
curl -X POST localhost:3000/api/sensor -H "Content-Type: application/json" \
  -d '{"nodeId":"node-1","waterLevel":58,"rainfall":42,"temp":27,"humidity":90}'
(waterLevel = % of channel depth, rainfall = mm/h; set AEGIS_KEY to require an x-api-key header. Demo mode blocks device posts until Reset.)

API: GET /api/state · POST /api/sensor · /api/reports · /api/confirm · /api/simulate · /api/demo/{start|stop|reset}

Risk engine: Severity = 4W + 2C + 2R + 3E (max 11): LOW 0-2, MODERATE 3-5, HIGH 6-8, CRITICAL 9-11.
Confidence = (N + M + sensor reliability) / 3. Thresholds live in CFG at the top of server.js.

Not built: database (in-memory; swap in MongoDB), auth, SMS/push, predictive model, real map.

## UI views (press 1-6 to switch while presenting)
0 Mission (start here; "Run AEGIS demo" plays the whole story automatically) · 1 National Dashboard · 2 School Dashboard · 3 Community App · 4 Digital Twin + What-If · 5 Architecture.
Sidebar has the presenter controls (Start scenario / Pause / Reset). Non-Gampaha districts on the national map are DEMO DATA.
