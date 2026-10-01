import { Fragment, useState } from 'react';
import { COL, post } from './api';
const SPOTS = [['Gampaha', 26, 85, 'live'], ['Kelaniya', 29, 93, 'HIGH'], ['Ratnapura', 40, 110, 'HIGH'], ['Galle', 33, 134, 'MODERATE'], ['Trincomalee', 66, 46, 'MODERATE'], ['Batticaloa', 72, 76, 'LOW'], ['Jaffna', 45, 10, 'LOW']];
const Pill = ({ l }) => <span className="pill" style={{ background: COL[l] }}>{l}</span>;

export function National({ st }) {
  const live = st?.risk.level || 'LOW';
  const spots = SPOTS.map(([n, x, y, l]) => ({ n, x, y, l: l === 'live' ? live : l }));
  const high = spots.filter(s => s.l === 'HIGH' || s.l === 'CRITICAL').length;
  const feed = [...(st?.reports || [])].reverse().slice(0, 4);
  return (
    <div className="grid" style={{ gridTemplateColumns: 'minmax(300px,1.3fr) 1fr' }}>
      <div className="card"><h3>National risk map — Sri Lanka</h3>
        <svg viewBox="0 0 100 150" style={{ width: '100%', maxHeight: 560 }}>
          <path d="M45 5 L55 12 L52 28 L62 40 L70 55 L72 78 L77 98 L68 118 L55 132 L45 140 L34 134 L27 112 L24 92 L26 74 L28 55 L32 36 L38 22 Z" fill="#0e2a38" stroke="#35c8e8" strokeWidth=".6" />
          {spots.map(s => <g key={s.n}><circle className={s.l === 'HIGH' || s.l === 'CRITICAL' ? 'pulse' : ''} cx={s.x} cy={s.y} r="3.2" fill={COL[s.l]} /><text x={s.x + 5} y={s.y + 1.5} fontSize="3.6" fill="#e4f0f3">{s.n}</text></g>)}
        </svg>
        <div className="mut">Gampaha is live from the sensor node. Other districts are <b>DEMO DATA</b>.</div></div>
      <div>
        <div className="grid g4">
          <div className="card stat"><span className="mut">High-risk areas</span><b>{high}</b></div>
          <div className="card stat"><span className="mut">Districts monitored</span><b>{spots.length}</b></div>
          <div className="card stat"><span className="mut">Live reports</span><b>{st?.reports.length ?? 0}</b></div>
          <div className="card stat"><span className="mut">Gampaha risk</span><b style={{ color: COL[live] }}>{live}</b></div>
        </div>
        {(live === 'HIGH' || live === 'CRITICAL') && <div className="alertbox" style={{ borderColor: COL[live] }}><b>⚠ {live} FLOOD RISK — Gampaha</b><div className="mut">Multiple signals corroborated. Take immediate action.</div></div>}
        <div className="card"><h3>Live feed</h3>
          {feed.length ? feed.map((r, i) => <div className="item" key={i}>📱 {r.text}</div>) : <div className="mut">No reports yet</div>}
          {st?.latest && <div className="item">📡 node-1: water {st.latest.waterLevel}% · rain {st.latest.rainfall} mm/h</div>}</div>
      </div>
    </div>
  );
}

export function Community({ st }) {
  const [scr, setScr] = useState('rep'), [cat, setCat] = useState('Flood'), [t, setT] = useState(''), [ok, setOk] = useState('');
  const send = async (text, msg) => { await post('/api/reports', { text }); setOk(msg); setT(''); setTimeout(() => setOk(''), 2500); };
  const r = st?.risk, hot = r && r.level !== 'LOW';
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div className="phone">
        <div className="row"><b>AEGIS</b><span className="mut">Gampaha</span></div>
        <button className="btn r" onClick={() => send('[SOS] Emergency assistance requested', 'SOS sent')}>SOS / EMERGENCY</button>
        <div className="row"><button className={'btn ' + (scr === 'rep' ? 'p' : '')} onClick={() => setScr('rep')}>Report</button><button className={'btn ' + (scr === 'al' ? 'p' : '')} onClick={() => setScr('al')}>Live alerts</button></div>
        {scr === 'rep' ? <>
          <div>{['Flood', 'Waste', 'Infrastructure', 'Other'].map(c => <button key={c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>{c}</button>)}</div>
          <label>Describe the incident<textarea value={t} onChange={e => setT(e.target.value)} placeholder="e.g. Water covering the road near the school gate" /></label>
          <div className="mut">📍 Near School Gate, Gampaha</div>
          <button className="btn p" onClick={() => t.trim() && send(`[${cat}] ${t}`, 'Report submitted')}>Submit report</button>
          {ok && <p style={{ color: '#22c55e' }}>✓ {ok}</p>}
        </> : <>
          {hot && <div className="alertbox" style={{ borderColor: COL[r.level] }}><Pill l={r.level} /> <b>Flood risk — School gate zone</b><div className="mut">Confidence {Math.round(r.confidence * 100)}%. Avoid low-lying roads.</div></div>}
          {!hot && <div className="alertbox" style={{ borderColor: '#22c55e' }}>✓ No active alerts in your area</div>}
          {(st?.reports || []).slice(-4).reverse().map((x, i) => <div className="item" key={i}>{x.text}</div>)}
        </>}
      </div>
    </div>
  );
}

export function Arch({ st }) {
  const r = st?.risk;
  const B = [['Data sources', ['Community reports', 'IoT sensors (ESP32)', 'Weather data']], ['Ingestion', ['REST API', 'Live polling']],
    ['Rule-based risk engine', ['Data fusion', 'Trend detection', 'Multi-source corroboration']], ['Risk scoring', [`Severity ${r?.score ?? 0}/11`, `Confidence ${Math.round((r?.confidence ?? 0) * 100)}%`, r?.level || 'LOW']],
    ['Alert engine', ['Smart alerts', 'Recommendations']], ['Delivery', ['School dashboard', 'Citizen app', 'DMC dashboard']]];
  return (
    <div className="card"><h3>SENSE → FUSE → VERIFY → ACT → LEARN</h3>
      <div className="flow">{B.map(([h, it], i) => <Fragment key={h}>{i > 0 && <span className="arrow">→</span>}
        <div className="box" style={h === 'Risk scoring' ? { borderColor: COL[r?.level || 'LOW'] } : {}}><h4>{h}</h4>{it.map(x => <div key={x}>{x}</div>)}</div></Fragment>)}</div>
      <p><span className="pill" style={{ background: '#16a34a' }}>BUILT</span> sensor API · risk engine · dashboards · digital twin · what-if &nbsp;
        <span className="pill" style={{ background: '#ca8a04' }}>PROTOTYPE</span> community app · corroboration rules &nbsp;
        <span className="pill" style={{ background: '#2563eb' }}>PLANNED</span> predictive model · SMS/push · satellite/GIS · real map</p></div>
  );
}
