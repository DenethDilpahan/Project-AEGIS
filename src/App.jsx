import { useEffect, useRef, useState } from 'react';
import Mission from './Mission';
import Dashboard from './Dashboard';
import Twin from './Twin';
import WhatIf from './WhatIf';
import { National, Community, Arch } from './Views';
import { COL, post, API } from './api';

const NAV = [['home', '🏠 Mission'], ['nat', '🌏 National'], ['sch', '🏫 School'], ['app', '📱 Community'], ['twin', '🧊 Twin & What-If'], ['arch', '🧠 Architecture']];
const STAGES = [['Sense', 'data comes in'], ['Fuse', '2+ sources agree'], ['Verify', 'official confirms'], ['Decide', 'alert + actions'], ['Predict', 'what-if outlook']];

export default function App() {
  const [st, setSt] = useState(null), [tab, setTab] = useState('home'), [sim, setSim] = useState(null), [simMin, setSimMin] = useState(null), [log, setLog] = useState([]);
  const prev = useRef({}), timers = useRef([]), stRef = useRef(null); stRef.current = st;
  useEffect(() => {
    const f = () => fetch(API + '/api/state').then(r => r.json()).then(setSt).catch(() => {});
    f(); const i = setInterval(f, 1500); return () => clearInterval(i);
  }, []);
  useEffect(() => {
    const k = e => { if (/INPUT|TEXTAREA/.test(e.target.tagName)) return; const n = NAV[+e.key - 1]; if (n) { timers.current.forEach(clearTimeout); timers.current = []; setTab(n[0]); } };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);
  useEffect(() => {   // builds the AEGIS event timeline from state changes
    if (!st) return; const p = prev.current;
    if (!st.history.length) { prev.current = {}; if (log.length) setLog([]); return; }
    const w = st.latest?.waterLevel ?? 0, r = st.latest?.rainfall ?? 0, n = st.reports.length, lv = st.risk.level, add = [];
    const e = (k, x, y) => add.push({ t: new Date().toLocaleTimeString([], { hour12: false }), k, x, y });
    if (w >= 50 && !p.w50) e('📡', 'Sensor', `Water level rising: ${w}%`);
    if (r >= 30 && !p.r) e('🌧', 'Weather', `Severe rainfall: ${r} mm/h`);
    if (n > (p.n || 0)) e('📱', 'Community', st.reports[n - 1].text);
    if (w >= st.critical && !p.wc) e('📡', 'Sensor', `Critical threshold crossed: ${w}%`);
    if (st.official && !p.o) e('📰', 'Verification', 'Flood condition confirmed');
    if (p.lv && lv !== p.lv) e('🧠', 'AEGIS', `Risk changed to ${lv}`);
    if ((lv === 'HIGH' || lv === 'CRITICAL') && !p.rec) e('🚨', 'AEGIS', 'School evacuation preparation recommended');
    prev.current = { w50: p.w50 || w >= 50, r: p.r || r >= 30, n, wc: p.wc || w >= st.critical, o: st.official, lv, rec: p.rec || lv === 'HIGH' || lv === 'CRITICAL' };
    if (add.length) setLog(l => [...add.reverse(), ...l]);
  }, [st]);
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const go = k => { clear(); setTab(k); };
  const runDemo = async () => {   // one click: scenario + automatic walk through the views
    clear(); setSim(null); setSimMin(null); setLog([]); prev.current = {};
    await post('/api/demo/reset'); await post('/api/demo/start'); setTab('sch');
    const at = (s, f) => timers.current.push(setTimeout(f, s * 1000));
    at(23, () => setTab('app')); at(30, () => setTab('nat')); at(38, () => setTab('twin'));
    at(44, () => { const l = stRef.current?.latest || {}; post('/api/simulate', { level: l.waterLevel ?? 60, rainfall: l.rainfall ?? 50, rainMult: 2, duration: 60, blockage: 60, reports: 3 }).then(s => { setSim(s); setSimMin(s.steps.length - 1); }); });
    at(56, () => setTab('home'));
  };
  const ctl = a => { clear(); post('/api/demo/' + a); if (a === 'reset') { setSim(null); setSimMin(null); } };
  let lvl = st?.latest?.waterLevel ?? 0, risk = st?.risk.level || 'LOW', tag = st?.demo ? 'LIVE · DEMO DATA' : 'LIVE';
  if (sim && simMin != null) { const s = sim.steps[simMin]; lvl = s.level; risk = s.risk; tag = `SIMULATED · +${simMin} min`; }
  const alarm = risk === 'HIGH' || risk === 'CRITICAL', M = st?.risk.factors.find(f => f.name.startsWith('M'))?.v;
  const on = [!!st?.latest, !!M, !!st?.official, alarm, !!sim];
  
  return (
    <div className="app">
      <aside>
        <div className="logo"><span className="mark" />AEGIS</div>
        {NAV.map(([k, n]) => <button key={k} className={'nav ' + (tab === k ? 'on' : '')} onClick={() => go(k)}>{n}</button>)}
        <div style={{ flex: 1 }} />
        <div className="mut small">Presenter · keys 1–6</div>
        <button className="btn p" onClick={runDemo}>▶ Run AEGIS demo</button>
        <button className="btn" onClick={() => ctl('stop')}>■ Pause</button>
        <button className="btn" onClick={() => ctl('reset')}>↺ Reset</button>
      </aside>
      <main>
        <div className="top">
          <h2>{NAV.find(n => n[0] === tab)[1]}</h2>
          <span className={'badge ' + (alarm ? 'throb' : '')} style={{ background: COL[st?.risk.level] || '#456' }}>{st?.risk.level || '–'}</span>
          {st && <span className="mut">Severity {st.risk.score}/11 · Confidence {Math.round(st.risk.confidence * 100)}%</span>}
          {st?.demo && <span className="demo">DEMO DATA</span>}
        </div>
        <div className="pipe">{STAGES.map(([s, d], i) => <div key={s} className={'stage ' + (on[i] ? 'on' : '')}><b>{s}</b><span>{d}</span></div>)}</div>
        {tab === 'home' && <Mission st={st} onRun={runDemo} onExplore={() => go('sch')} />}
        {tab === 'nat' && <National st={st} />}
        {tab === 'sch' && <Dashboard st={st} log={log} />}
        {tab === 'app' && <Community st={st} />}
        {tab === 'arch' && <Arch st={st} />}
        <div className="g" style={{ display: tab === 'twin' ? 'grid' : 'none' }}>
          <div className="card"><Twin {...{ lvl, risk, tag }} /></div>
          {tab === 'twin' && <div className="card"><WhatIf {...{ st, sim, setSim, simMin, setSimMin }} /></div>}
        </div>
      </main>
    </div>
  );
}
