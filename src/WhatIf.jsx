import { useState } from 'react';
import Chart from './Chart';
import { post, COL } from './api';
export default function WhatIf({ st, sim, setSim, simMin, setSimMin }) {
  const [p, setP] = useState({ level: 40, rainfall: 30, reports: 0, rainMult: 1.2, duration: 30, blockage: 0 });
  const set = k => e => setP({ ...p, [k]: +e.target.value });
  const load = () => { const l = st?.latest || {}; setP({ ...p, level: l.waterLevel ?? 40, rainfall: l.rainfall ?? 30, reports: st?.reports.length || 0 }); };
  const run = async () => { const s = await post('/api/simulate', p); setSim(s); setSimMin(s.steps.length - 1); };
  return (
    <div className="g">
      <div>
        <h3>Scenario</h3>
        <label>Base water level % <input type="number" value={p.level} onChange={set('level')} /></label>
        <label>Base rainfall mm/h <input type="number" value={p.rainfall} onChange={set('rainfall')} /></label>
        <label>Reports <input type="number" value={p.reports} onChange={set('reports')} /></label>
        <button onClick={load}>Load live values</button>
        <label>Rainfall change ×{p.rainMult} <input type="range" min="0.5" max="3" step="0.1" value={p.rainMult} onChange={set('rainMult')} /></label>
        <label>Duration {p.duration} min <input type="range" min="10" max="120" step="5" value={p.duration} onChange={set('duration')} /></label>
        <label>Drain blockage {p.blockage}% <input type="range" min="0" max="100" step="5" value={p.blockage} onChange={set('blockage')} /></label>
        <button onClick={run}>Run simulation</button>
        <button onClick={() => setSimMin(null)}>Back to live twin</button>
        {sim && <>
          <div className="pred"><div><span>Critical level in</span><b>{sim.ttc != null ? '~' + sim.ttc + ' min' : 'not reached'}</b></div><div><span>Road cut off in</span><b>{sim.roadCut != null ? '~' + sim.roadCut + ' min' : 'not reached'}</b></div><div><span>Peak water level</span><b>{sim.peak}%</b></div><div><span>Final risk</span><b style={{ color: COL[sim.steps.at(-1).risk] }}>{sim.steps.at(-1).risk}</b></div></div>
          <label>Scrub timeline (drives the Digital Twin): minute {simMin ?? '–'}
            <br /><input type="range" min="0" max={sim.steps.length - 1} value={simMin ?? sim.steps.length - 1} onChange={e => setSimMin(+e.target.value)} /></label>
        </>}
      </div>
      <div><h3>Simulated water level</h3>{sim && <Chart data={sim.steps.map(s => s.level)} line={70} h={200} />}</div>
    </div>
  );
}
