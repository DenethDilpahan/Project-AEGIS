import { useEffect, useRef } from 'react';
export default function Chart({ data, max = 100, line, w = 420, h = 160 }) {
  const ref = useRef();
  useEffect(() => {
    const g = ref.current.getContext('2d'), y = v => h - (v / max) * h;
    g.clearRect(0, 0, w, h);
    if (line != null) { g.setLineDash([6, 5]); g.strokeStyle = '#ff4561'; g.beginPath(); g.moveTo(0, y(line)); g.lineTo(w, y(line)); g.stroke(); g.setLineDash([]); }
    if (!data.length) return;
    const X = i => (i / Math.max(1, data.length - 1)) * w;
    g.beginPath(); data.forEach((v, i) => i ? g.lineTo(X(i), y(v)) : g.moveTo(X(i), y(v)));
    g.lineTo(w, h); g.lineTo(0, h); g.closePath();
    const f = g.createLinearGradient(0, 0, 0, h); f.addColorStop(0, 'rgba(53,200,232,.35)'); f.addColorStop(1, 'rgba(53,200,232,0)'); g.fillStyle = f; g.fill();
    g.strokeStyle = '#35c8e8'; g.lineWidth = 2; g.beginPath();
    data.forEach((v, i) => i ? g.lineTo(X(i), y(v)) : g.moveTo(X(i), y(v))); g.stroke(); g.lineWidth = 1;
  });
  return <canvas ref={ref} width={w} height={h} />;
}
