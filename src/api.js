export const API = import.meta.env.VITE_API_URL || '';
export const post = (u, b) => fetch(API + u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b || {}) }).then(r => r.json());
export const COL = { LOW: '#3dd68c', MODERATE: '#ffb340', HIGH: '#ff7a3d', CRITICAL: '#ff4561' };
export const WC = { LOW: 0x35c8e8, MODERATE: 0xffb340, HIGH: 0xff7a3d, CRITICAL: 0xff4561 };
