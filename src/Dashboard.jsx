import { useState } from 'react';
import Chart from './Chart';
import { post, COL } from './api';
export default function Dashboard({ st, log }) {
  const [sent, setSent] = useState(false);
  if (!st) return <p className="mut">Connecting to backend…</p>;
  const r = st.risk, l = st.latest, alarm = r.level === 'HIGH' || r.level === 'CRITICAL';
  const F = n => r.factors.find(f => f.name.startsWith(n)).v;
  const sig = [['💧', 'Water level', l ? l.waterLevel + '%' : '–', F('W')], ['🌧', 'Severe rainfall', l ? l.rainfall + ' mm/h' : '–', F('R')],
    ['📱', 'Civilian reports', st.reports.length, F('C')], ['📰', 'Official confirmation', st.official ? 'Confirmed' : 'Pending', +st.official]];
  const trend = r.rise >= 1.5 ? ['↑ Rapidly increasing', COL.CRITICAL] : r.rise > 0.2 ? ['↗ Rising', COL.HIGH] : ['→ Stable', COL.LOW];
  const why = r.factors.filter(f => f.v && f.w).map(f => f.name.slice(3).trim());
  const recs = alarm ? ['Prepare evacuation', 'Close the school gate road', 'Notify authorities'] : [];
  return (<>
    <div className="duo">
      <div className="card"><h3>1 · Signal fusion <span className="mut">independent sources</span></h3>
        {sig.map(([i, n, v, on]) => <div key={n} className={'sig ' + (on ? 'on' : '')}><span>{i}</span><span>{n}</span><b>{v}</b><i>{on ? '✓' : ''}</i></div>)}
      </div>
      <div className="card assess" style={{ '--c': COL[r.level] }}><h3>2 · AEGIS assessment</h3>
        <div className="ringrow">
          <svg viewBox="0 0 100 100" className="ring"><circle cx="50" cy="50" r="42" /><circle className="val" cx="50" cy="50" r="42" strokeDasharray="264" strokeDashoffset={264 * (1 - r.confidence)} /><text x="50" y="55" textAnchor="middle">{Math.round(r.confidence * 100)}%</text></svg>
          <div><div className="mut">Confidence</div><div className="big2">Severity {r.score}<small> / 11</small></div>
            <span className={'badge ' + (alarm ? 'throb' : '')} style={{ background: COL[r.level] }}>{r.level}</span>
            <div style={{ color: trend[1], marginTop: 6 }}>{trend[0]}</div></div>
        </div>
        <p className="mut small">{why.length ? 'Why: ' + why.join(' + ') + '.' : 'No hazard signals. All clear.'}</p>
        <label className="small"><input type="checkbox" checked={st.official} onChange={e => post('/api/confirm', { value: e.target.checked })} /> Simulate official confirmation</label>
      </div>
    </div>
    <div className="duo">
      <div className="card"><h3>3 · Decision <span className="mut">recommended actions</span></h3>
        {recs.length ? recs.map(x => <div className="rec" key={x}>→ {x}</div>) : <div className="mut">No action needed right now.</div>}
        <button className="btn r" disabled={!alarm} onClick={() => setSent(true)}>Send emergency alert</button>
        {sent && alarm && <div className="okmsg">✓ Alert sent to staff and DMC (simulated)</div>}
      </div>
      <div className="card"><h3>Water level <span className="mut">dashed line = critical</span></h3><Chart data={st.history.map(h => h.waterLevel)} line={st.critical} w={520} h={190} /></div>
    </div>
    <div className="card"><h3>AEGIS event timeline</h3>
      {log.length ? log.slice(0, 8).map((e, i) => <div className="ev" key={log.length - i}><time>{e.t}</time><span>{e.k}</span><b>{e.x}</b><span className="mut">{e.y}</span></div>) : <div className="mut">Waiting for events. Press “Run the AEGIS demo” on the Mission page.</div>}
    </div>
  </>);
}
