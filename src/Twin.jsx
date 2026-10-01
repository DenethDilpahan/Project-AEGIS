import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { WC, COL } from './api';
export default function Twin({ lvl, risk, tag }) {
  const cv = useRef(), o = useRef({});
  useEffect(() => {
    const c = cv.current, R = new THREE.WebGLRenderer({ canvas: c, antialias: true });
    R.setSize(800, 450, false);
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x0b1f2b);
    const cam = new THREE.PerspectiveCamera(50, 800 / 450, 0.1, 100);
    sc.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dl = new THREE.DirectionalLight(0xffffff, 0.6); dl.position.set(5, 10, 5); sc.add(dl);
    const box = (w, h, d, col, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: col })); m.position.set(x, y, z); sc.add(m); return m; };
    box(20, 0.1, 14, 0x3d6a3d, 0, -0.05, 0);   // ground
    box(20, 0.12, 3, 0x333333, 0, 0.02, 2);    // road
    box(6, 2.5, 4, 0xb08050, -4, 1.25, -4);    // school
    box(20, 0.05, 1.2, 0x444466, 0, 0, 4.6);   // drain
    box(0.1, 2, 0.1, 0xcccccc, 3, 1, 3.5);     // sensor pole
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.25), new THREE.MeshBasicMaterial({ color: 0x00ff88 })); node.position.set(3, 2.2, 3.5); sc.add(node);
    const water = box(20, 1, 8, 0x2080ff, 0, 0.5, 3); water.material.transparent = true; water.material.opacity = 0.6;
    o.current = { water, node };
    const v = { az: 0.6, el: 0.5, rad: 20 }; let drag = false, raf;
    const down = () => (drag = true), up = () => (drag = false);
    const move = e => { if (drag) { v.az -= e.movementX * 0.01; v.el = Math.min(1.4, Math.max(0.1, v.el + e.movementY * 0.01)); } };
    const wheel = e => { e.preventDefault(); v.rad = Math.min(40, Math.max(8, v.rad + e.deltaY * 0.02)); };
    c.addEventListener('pointerdown', down); window.addEventListener('pointerup', up); window.addEventListener('pointermove', move);
    c.addEventListener('wheel', wheel, { passive: false });
    const loop = () => {
      cam.position.set(v.rad * Math.sin(v.az) * Math.cos(v.el), v.rad * Math.sin(v.el), v.rad * Math.cos(v.az) * Math.cos(v.el));
      cam.lookAt(0, 0, 0); R.render(sc, cam); raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('pointerup', up); window.removeEventListener('pointermove', move); R.dispose(); };
  }, []);
  useEffect(() => {
    const { water, node } = o.current; if (!water) return;
    const h = (lvl / 100) * 0.8 + 0.02;
    water.scale.y = h; water.position.y = h / 2;
    water.material.color.set(WC[risk]); node.material.color.set(WC[risk]);
  }, [lvl, risk]);
  const road = lvl >= 80 ? ['CUT OFF', COL.CRITICAL] : lvl >= 50 ? ['AT RISK', COL.HIGH] : ['CLEAR', COL.LOW];
  const sch = risk === 'HIGH' || risk === 'CRITICAL' ? ['EVACUATION PREPAREDNESS', COL.HIGH] : ['NORMAL', COL.LOW];
  return (
    <div className="twin">
      <canvas ref={cv} style={{ width: '100%', aspectRatio: '16/9' }} />
      <div className="hud"><b>{tag}</b><div className="hr"><span>School gate zone</span></div>
        <div className="hr"><span>Water level</span><b>{lvl}%</b></div>
        <div className="hr"><span>Road</span><b style={{ color: road[1] }}>{road[0]}</b></div>
        <div className="hr"><span>School</span><b style={{ color: sch[1] }}>{sch[0]}</b></div>
        <div className="hr"><span>Sensor #01</span><b style={{ color: COL.LOW }}>● ONLINE</b></div></div>
      <div className="mut small">Drag to rotate · scroll to zoom</div>
    </div>
  );
}
