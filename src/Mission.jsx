import { COL } from './api';
const Wave = () => <svg viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="M0 30 Q150 0 300 30 T600 30 T900 30 T1200 30 V60 H0Z" fill="currentColor" /></svg>;
export default function Mission({ st, onRun, onExplore }) {
  const lvl = st?.latest?.waterLevel ?? 20, risk = st?.risk.level || 'LOW';
  return (
    <section className="hero">
      <div className="sea" style={{ height: 8 + lvl * 0.55 + '%', color: risk === 'LOW' ? '#35c8e8' : COL[risk] }}><Wave /><Wave /></div>
      <div className="heroin">
        <p className="kick">AEGIS · early flood warning for schools and communities, Gampaha, Sri Lanka</p>
        <h1>Know the flood is coming before it reaches the school gate.</h1>
        <p className="lead">AEGIS checks roadside sensors, rainfall, citizen reports and official confirmation against each other, then tells a school and the Disaster Management Centre how serious the risk is, how sure it is, and what to do next.</p>
        <div className="cta"><button className="btn p big" onClick={onRun}>Run the AEGIS demo</button><button className="btn big" onClick={onExplore}>Open the school dashboard</button></div>
        <div className="three">
          <div><h4>The gap</h4><p>Flood warnings are slow, come from one source, and rarely say which street or school is affected.</p></div>
          <div><h4>What AEGIS does</h4><p>Cross-checks independent signals, scores the risk with a confidence level, and recommends actions.</p></div>
          <div><h4>Who it protects</h4><p>Students and staff at one school gate today, and every district the sensor network reaches next.</p></div>
        </div>
        <p className="mut small">Prototype: sensor values are scripted until ESP32 nodes are connected. The water behind this page follows the live level.</p>
      </div>
    </section>
  );
}
