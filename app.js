'use strict';
/* TupperFit — diario de comidas, macros y ejercicio.
   Todo se guarda en el propio dispositivo (localStorage). Sin servidor, sin cuentas. */

// ───────── utilidades ─────────
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const KEY = 'tupperfit.v1';
const MEALS = [['desayuno', 'Desayuno', '🥣'], ['media', 'Media mañana', '🍎'], ['almuerzo', 'Almuerzo', '🍱'], ['merienda', 'Merienda', '🥛'], ['cena', 'Cena', '🌙'], ['otros', 'Otros', '🍫']];
const TYPES = { tupper: '🍱 Tupper', casero: '🍳 Casero', producto: '🏷️ Producto', base: '🥦 Básico' };
const ACTIVITY = [[1.2, 'Sedentario (poco o nada de ejercicio)'], [1.375, 'Ligero (1-3 días/semana)'], [1.55, 'Moderado (3-5 días/semana)'], [1.725, 'Intenso (6-7 días/semana)']];
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const pad = n => String(n).padStart(2, '0');
const ds = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return ds(d); };
const mondayOf = s => { const d = parseD(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return ds(d); };
const todayS = () => ds(new Date());
const r0 = n => Math.round(n || 0);
const r1 = n => Math.round((n || 0) * 10) / 10;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(n) ? n : 0; };
const fmtDate = (s, o) => parseD(s).toLocaleDateString('es-ES', o || { weekday: 'long', day: 'numeric', month: 'long' });
const calcKcal = (p, c, f) => 4 * p + 4 * c + 9 * f;
const sum = a => a.reduce((x, y) => x + y, 0);
const avg = a => (a.length ? sum(a) / a.length : 0);

// ───────── datos ─────────
// Valores por 100 g (estimaciones habituales; revisa las etiquetas de tus productos).
const BASE_FOODS = [
  ['Pechuga de pollo (cruda)', 110, 23, 0, 1.5], ['Pechuga de pavo (cruda)', 105, 24, 0, 1], ['Huevo entero', 143, 12.6, 0.7, 9.5], ['Clara de huevo', 52, 11, 0.7, 0.2],
  ['Atún al natural (lata)', 116, 26, 0, 1], ['Salmón', 208, 20, 0, 13], ['Merluza', 82, 17, 0, 1.5], ['Gambas', 85, 18, 0.2, 1],
  ['Pavo en lonchas (fiambre)', 105, 18, 2, 2.5], ['Jamón serrano', 241, 31, 0, 13], ['Ternera magra', 135, 21, 0, 5.5],
  ['Yogur griego 0%', 57, 10, 4, 0.2], ['Skyr natural', 63, 11, 4, 0.2], ['Queso fresco batido 0%', 46, 8, 4, 0.2], ['Queso fresco', 95, 8, 3, 6], ['Leche semidesnatada', 47, 3.3, 4.8, 1.6], ['Leche desnatada', 35, 3.4, 5, 0.1],
  ['Avena (copos)', 370, 13, 60, 7], ['Pan integral', 250, 9, 43, 3.5], ['Tortita de arroz', 387, 8, 81, 3], ['Arroz cocido', 130, 2.7, 28, 0.3], ['Pasta cocida', 158, 5.8, 31, 0.9], ['Patata cocida', 86, 1.7, 20, 0.1],
  ['Lentejas cocidas', 116, 9, 20, 0.4], ['Garbanzos cocidos', 164, 9, 27, 2.6],
  ['Plátano', 90, 1, 20, 0.3], ['Manzana', 52, 0.3, 14, 0.2], ['Naranja', 47, 0.9, 12, 0.1], ['Fresas', 32, 0.7, 7.7, 0.3], ['Kiwi', 61, 1.1, 15, 0.5], ['Arándanos', 57, 0.7, 14, 0.3], ['Uvas', 69, 0.7, 18, 0.2], ['Sandía', 30, 0.6, 7.6, 0.2],
  ['Tomate', 18, 0.9, 3.9, 0.2], ['Ensalada verde / lechuga', 15, 1.4, 2.2, 0.2], ['Brócoli', 34, 2.8, 7, 0.4], ['Zanahoria', 41, 0.9, 10, 0.2],
  ['Aguacate', 160, 2, 9, 15], ['Aceite de oliva', 884, 0, 0, 100], ['Almendras', 579, 21, 22, 50], ['Nueces', 654, 15, 14, 65], ['Chocolate negro 85%', 579, 9, 19, 46],
  ['Proteína whey (polvo)', 400, 80, 8, 6], ['Café con leche (taza ~200 ml semi)', 47, 3.3, 4.8, 1.6],
].map((a, i) => ({ id: 'base' + i, name: a[0], type: 'base', unit: '100g', kcal: a[1], p: a[2], c: a[3], f: a[4], fav: false, used: 0 }));

const SPORTS = { caminar: ['🚶 Caminar', 3.5], correr: ['🏃 Correr', 9], bici: ['🚴 Bici', 7], natacion: ['🏊 Natación', 6], aquagym: ['💦 Aquagym', 5.5], fuerza: ['🏋️ Fuerza / gimnasio', 4], eliptica: ['🌀 Elíptica', 5], yoga: ['🧘 Yoga / pilates', 2.5], baile: ['💃 Baile / zumba', 5], hiit: ['🔥 HIIT', 8], otro: ['⚡ Otro', 4] };
const WEEK_MIN_GOAL = 150; // recomendación general de actividad semanal (OMS)

// Peso típico (g) de una unidad, para poder decir "dos huevos" o "un plátano".
const BASE_SERV = { 'Huevo entero': 60, 'Clara de huevo': 33, 'Plátano': 120, 'Manzana': 180, 'Naranja': 150, 'Kiwi': 75, 'Tortita de arroz': 9, 'Aguacate': 150, 'Tomate': 120, 'Zanahoria': 80, 'Yogur griego 0%': 125, 'Skyr natural': 150 };
const fixBase = foods => { foods.forEach(f => { if (f.type === 'base' && !f.serv && BASE_SERV[f.name]) f.serv = BASE_SERV[f.name]; }); return foods; };

const DEF_PROFILE = { configured: false, sex: 'f', age: 35, height: 165, weight: 75, goalWeight: 0, activity: 1.375, goalKgWeek: 0.5, kcal: 1700, pP: 35, pC: 40, pF: 25, stepsGoal: 10000 };

let db = load();
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return { profile: { ...DEF_PROFILE, ...(d.profile || {}) }, foods: fixBase(d.foods || []), log: d.log || {}, plan: d.plan || {}, lastBackup: d.lastBackup || null, created: d.created || todayS(), freeDays: d.freeDays || {}, body: d.body || {} };
    }
  } catch (e) { console.warn('No se pudo leer', e); }
  return { profile: { ...DEF_PROFILE }, foods: fixBase(BASE_FOODS.map(f => ({ ...f }))), log: {}, plan: {}, lastBackup: null, created: todayS(), freeDays: {}, body: {} };
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch (e) { toast('⚠️ No se pudo guardar (almacenamiento lleno o bloqueado)'); }
}

const getDay = (date, create) => {
  if (!db.log[date] && create) db.log[date] = { entries: [], weight: null, steps: null, burned: null, water: null, note: '', workouts: [] };
  return db.log[date] || { entries: [], weight: null, steps: null, burned: null, water: null, note: '', workouts: [] };
};
const workouts = d => d.workouts || [];
const isFreeDay = date => !!db.freeDays[date];
const isFreeEntry = (date, e) => isFreeDay(date) || !!e.free;
const getPlan = (date, create) => { if (!db.plan[date] && create) db.plan[date] = []; return db.plan[date] || []; };

// ───────── cálculos ─────────
const scale = (b, unit, qty) => { const k = unit === '100g' ? qty / 100 : qty; return { kcal: b.kcal * k, p: b.p * k, c: b.c * k, f: b.f * k }; };
const eM = e => scale(e.base, e.unit, e.qty);
const totals = entries => entries.reduce((t, e) => { const m = eM(e); return { kcal: t.kcal + m.kcal, p: t.p + m.p, c: t.c + m.c, f: t.f + m.f }; }, { kcal: 0, p: 0, c: 0, f: 0 });
const qtyLabel = e => e.unit === '100g' ? `${r1(e.qty)} g` : `${r1(e.qty)} ${e.qty === 1 ? 'ración' : 'raciones'}`;

function latestWeight(upTo) {
  const ks = Object.keys(db.log).filter(k => (!upTo || k <= upTo) && db.log[k].weight).sort();
  return ks.length ? db.log[ks[ks.length - 1]].weight : db.profile.weight;
}
function bmr(upTo) {
  const p = db.profile;
  return 10 * latestWeight(upTo) + 6.25 * p.height - 5 * p.age + (p.sex === 'm' ? 5 : -161);
}
const tdee = upTo => bmr(upTo) * db.profile.activity;
function targets() {
  const p = db.profile;
  return { kcal: p.kcal, p: p.kcal * p.pP / 100 / 4, c: p.kcal * p.pC / 100 / 4, f: p.kcal * p.pF / 100 / 9 };
}
// Gasto del día: si has anotado las calorías activas del reloj, se usa metabolismo basal ×1,2 + activas; si no, el gasto medio según tu nivel de actividad.
function expenditure(date) {
  const d = getDay(date);
  return d.burned > 0 ? bmr(date) * 1.2 + d.burned : tdee(date);
}
const mismatch = f => { const k = calcKcal(f.p, f.c, f.f); return f.kcal > 0 && Math.abs(f.kcal - k) > 15 && Math.abs(f.kcal - k) / Math.max(k, 1) > 0.12; };

function weekStats(mon) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(mon, i), d = getDay(date), t = totals(d.entries);
    const logged = d.entries.length > 0, freeEs = d.entries.filter(e => isFreeEntry(date, e));
    days.push({ date, d, t, logged, hasFree: freeEs.length > 0, tFree: totals(freeEs), exp: expenditure(date), def: logged ? expenditure(date) - t.kcal : 0 });
  }
  // Las medias y los avisos se calculan con los días "de plan" (sin comida libre); el déficit y la grasa estimada usan TODOS los días.
  const L = days.filter(x => x.logged), PL = L.filter(x => !x.hasFree), B = PL.length ? PL : L, tg = targets();
  const kcal = avg(B.map(x => x.t.kcal)), p = avg(B.map(x => x.t.p)), c = avg(B.map(x => x.t.c)), f = avg(B.map(x => x.t.f));
  const ws = days.filter(x => x.d.weight).map(x => x.d.weight);
  const st = days.filter(x => x.d.steps).map(x => x.d.steps);
  const kc = p * 4 + c * 4 + f * 9 || 1;
  return {
    days, L, n: L.length, kcal, p, c, f, pctP: p * 4 / kc * 100, pctC: c * 4 / kc * 100, pctF: f * 9 / kc * 100,
    deficit: avg(L.map(x => x.def)), totalDef: sum(L.map(x => x.def)),
    inRange: PL.filter(x => Math.abs(x.t.kcal - tg.kcal) <= tg.kcal * 0.05).length, np: PL.length, allFree: L.length > 0 && !PL.length,
    freeDays: L.filter(x => x.hasFree).length, freeKcal: sum(L.map(x => x.tFree.kcal)), eaten: sum(L.map(x => x.t.kcal)),
    freeMeals: sum(L.map(x => x.d.entries.filter(e => isFreeEntry(x.date, e)).length)), margin: sum(L.map(x => tg.kcal - x.t.kcal)),
    wAvg: ws.length ? avg(ws) : null, wFirst: ws[0] ?? null, wLast: ws.length ? ws[ws.length - 1] : null, wCount: ws.length,
    steps: st.length ? avg(st) : null, burned: avg(days.filter(x => x.d.burned).map(x => x.d.burned)),
    wMin: sum(days.map(x => sum(workouts(x.d).map(k => k.min)))), wKcal: sum(days.map(x => sum(workouts(x.d).map(k => k.kcal)))), wN: sum(days.map(x => workouts(x.d).length)),
    byType: days.reduce((o, x) => { workouts(x.d).forEach(k => { o[k.type] = o[k.type] || { min: 0, n: 0 }; o[k.type].min += k.min; o[k.type].n++; }); return o; }, {}),
  };
}

// ───────── gráficos SVG ─────────
function barChart(items, { target, color = 'var(--kcal)', fmt = r0 } = {}) {
  const W = 340, H = 170, pl = 34, pr = 8, pt = 16, pb = 24;
  const max = Math.max(target || 0, ...items.map(i => i.v || 0), 1) * 1.15;
  const bw = (W - pl - pr) / items.length, y = v => pt + (H - pt - pb) * (1 - v / max);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img">`;
  for (let i = 0; i <= 3; i++) { const v = max * i / 3; s += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${pl - 4}" y="${y(v) + 3}" class="ax" text-anchor="end">${r0(v)}</text>`; }
  items.forEach((it, i) => {
    const x = pl + i * bw + bw * 0.16, w = bw * 0.68;
    if (it.v > 0) s += `<rect x="${x}" y="${y(it.v)}" width="${w}" height="${y(0) - y(it.v)}" rx="3" fill="${it.color || color}"/><text x="${x + w / 2}" y="${y(it.v) - 3}" class="val">${fmt(it.v)}</text>`;
    s += `<text x="${x + w / 2}" y="${H - 8}" class="ax" text-anchor="middle">${esc(it.l)}</text>`;
  });
  if (target) s += `<line x1="${pl}" x2="${W - pr}" y1="${y(target)}" y2="${y(target)}" class="tgt"/>`;
  return s + '</svg>';
}
function lineChart(items, { color = 'var(--p)', unit = '' } = {}) {
  const pts = items.map((it, i) => ({ ...it, i })).filter(it => it.v != null);
  if (pts.length < 1) return '<p class="empty">Anota tu peso en "Hoy" para ver la evolución.</p>';
  const W = 340, H = 150, pl = 36, pr = 12, pt = 16, pb = 24;
  let lo = Math.min(...pts.map(p => p.v)), hi = Math.max(...pts.map(p => p.v));
  if (hi - lo < 1) { lo -= 0.5; hi += 0.5; }
  const span = hi - lo; lo -= span * 0.15; hi += span * 0.15;
  const x = i => pl + (W - pl - pr) * (items.length === 1 ? 0.5 : i / (items.length - 1)), y = v => pt + (H - pt - pb) * (1 - (v - lo) / (hi - lo));
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img">`;
  for (let i = 0; i <= 3; i++) { const v = lo + (hi - lo) * i / 3; s += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${pl - 4}" y="${y(v) + 3}" class="ax" text-anchor="end">${r1(v)}</text>`; }
  s += `<polyline fill="none" stroke="${color}" stroke-width="2.2" points="${pts.map(p => `${x(p.i)},${y(p.v)}`).join(' ')}"/>`;
  pts.forEach(p => { s += `<circle cx="${x(p.i)}" cy="${y(p.v)}" r="3.5" fill="${color}"/><text x="${x(p.i)}" y="${y(p.v) - 7}" class="val">${r1(p.v)}${unit}</text>`; });
  items.forEach((it, i) => { s += `<text x="${x(i)}" y="${H - 8}" class="ax" text-anchor="middle">${esc(it.l)}</text>`; });
  return s + '</svg>';
}
function weightChart(pts, goal) {
  const W = 340, H = 200, pl = 36, pr = 12, pt = 16, pb = 26, DAY = 864e5;
  const t0 = parseD(pts[0].d).getTime(), t1 = parseD(pts[pts.length - 1].d).getTime(), span = Math.max(t1 - t0, DAY);
  const x = d => pl + (W - pl - pr) * (pts.length === 1 ? 0.5 : (parseD(d).getTime() - t0) / span);
  const trend = pts.map(p => { const w = pts.filter(q => q.d <= p.d && parseD(p.d) - parseD(q.d) <= 6 * DAY); return { d: p.d, v: avg(w.map(q => q.v)) }; });
  let lo = Math.min(...pts.map(p => p.v)), hi = Math.max(...pts.map(p => p.v));
  const showGoal = goal > 0 && goal >= lo - Math.max(hi - lo, 2) * 1.5; if (showGoal) lo = Math.min(lo, goal);
  if (hi - lo < 1) { lo -= 0.5; hi += 0.5; } const pad2 = (hi - lo) * 0.12; lo -= pad2; hi += pad2;
  const y = v => pt + (H - pt - pb) * (1 - (v - lo) / (hi - lo));
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img">`;
  for (let i = 0; i <= 4; i++) { const v = lo + (hi - lo) * i / 4; s += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${pl - 4}" y="${y(v) + 3}" class="ax" text-anchor="end">${r0(v)}</text>`; }
  if (showGoal) s += `<line x1="${pl}" x2="${W - pr}" y1="${y(goal)}" y2="${y(goal)}" class="tgt"/><text x="${W - pr}" y="${y(goal) - 3}" class="ax" text-anchor="end">objetivo ${r1(goal)}</text>`;
  if (pts.length > 1) { s += `<polyline fill="none" stroke="var(--p)" stroke-width="1" opacity=".35" points="${pts.map(p => `${x(p.d)},${y(p.v)}`).join(' ')}"/><polyline fill="none" stroke="var(--brand)" stroke-width="2.6" stroke-linejoin="round" points="${trend.map(p => `${x(p.d)},${y(p.v)}`).join(' ')}"/>`; }
  pts.forEach((p, i) => { s += `<circle cx="${x(p.d)}" cy="${y(p.v)}" r="${pts.length > 40 ? 1.8 : 3}" fill="var(--p)"/>`; if (pts.length <= 10 || i === pts.length - 1) s += `<text x="${x(p.d)}" y="${y(p.v) - 7}" class="val">${r1(p.v)}</text>`; });
  [pts[0].d, pts.length > 2 ? pts[Math.floor((pts.length - 1) / 2)].d : null, pts[pts.length - 1].d].forEach((d, i) => { if (d && (i !== 2 || pts.length > 1)) s += `<text x="${x(d)}" y="${H - 8}" class="ax" text-anchor="${i === 0 && pts.length > 1 ? 'start' : i === 2 ? 'end' : 'middle'}">${fmtDate(d, { day: 'numeric', month: 'short' })}</text>`; });
  return s + '</svg>';
}
function progressCard() {
  const all = Object.keys(db.log).filter(k => db.log[k].weight).sort().map(k => ({ d: k, v: db.log[k].weight }));
  let h = '<div class="card"><h2>📉 Progreso de peso</h2>';
  if (!all.length) return h + '<p class="empty">Anota tu peso en "Hoy" (a diario o cuando te peses) y aquí verás cómo evoluciona desde que empezó el plan.</p></div>';
  const first = all[0], last = all[all.length - 1], goal = db.profile.goalWeight, today = todayS();
  let pts = S.wRange === 'all' ? all : all.filter(p => p.d >= addDays(today, -S.wRange)); if (!pts.length) pts = all.slice(-1);
  const lost = first.v - last.v, weeks = (parseD(last.d) - parseD(first.d)) / 6048e5, rate = weeks >= 1 ? lost / weeks : null, left = goal > 0 ? last.v - goal : null;
  h += `<div class="chips">${[['all', 'Todo'], ['90', '3 meses'], ['30', '1 mes']].map(([k, l]) => `<button class="chip ${S.wRange === k ? 'on' : ''}" data-act="wrange" data-k="${k}">${l}</button>`).join('')}</div>${weightChart(pts, goal)}
    <p class="muted">Línea verde = tendencia (media de 7 días, más fiable que el peso de un día); puntos azules = cada pesada.</p>
    <div class="grid3"><div class="stat"><b>${r1(first.v)}</b><span>inicio (${fmtDate(first.d, { day: 'numeric', month: 'short' })})</span></div><div class="stat"><b>${r1(last.v)}</b><span>actual</span></div>
    <div class="stat"><b class="${lost >= 0 ? 'good' : 'badc'}">${lost >= 0 ? '−' : '+'}${r1(Math.abs(lost))} kg</b><span>${lost >= 0 ? 'perdidos' : 'ganados'} (${r1(Math.abs(lost) / first.v * 100)}%)</span></div></div>
    <div class="grid3 mt"><div class="stat"><b>${rate != null ? r1(rate) + ' kg' : '—'}</b><span>ritmo medio por semana</span></div><div class="stat"><b>${left != null ? (left > 0 ? r1(left) + ' kg' : '¡Meta!') : '—'}</b><span>para tu objetivo${goal > 0 ? ` (${r1(goal)})` : ''}</span></div><div class="stat"><b>${all.length}</b><span>pesadas registradas</span></div></div>`;
  if (left > 0 && rate > 0.1) h += `<p class="muted">A este ritmo llegarías a tu objetivo hacia <b>${fmtDate(addDays(today, Math.round(left / rate * 7)), { month: 'long', year: 'numeric' })}</b>.</p>`;
  else if (!(goal > 0)) h += '<p class="muted">Pon tu peso objetivo en Ajustes para ver cuánto te falta.</p>';
  return h + '</div>';
}
function ring(pct, color, big, small) {
  const R = 62, C = 2 * Math.PI * R, v = Math.max(0, Math.min(1, pct));
  return `<div class="ring"><svg viewBox="0 0 150 150" width="150" height="150"><circle cx="75" cy="75" r="${R}" fill="none" stroke="var(--line)" stroke-width="14"/><circle cx="75" cy="75" r="${R}" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${C * v} ${C}" transform="rotate(-90 75 75)"/></svg><div class="mid"><span class="big">${big}</span><span class="muted">${small}</span></div></div>`;
}
function donut(p, c, f) {
  const R0 = 30, C = 2 * Math.PI * R0, k = [[p * 4, 'var(--p)'], [c * 4, 'var(--c)'], [f * 9, 'var(--f)']], tot = sum(k.map(x => x[0]));
  let off = 0, segs = `<circle cx="40" cy="40" r="${R0}" fill="none" stroke="var(--line)" stroke-width="12"/>`;
  if (tot) k.forEach(([v, col]) => { const len = C * v / tot; segs += `<circle cx="40" cy="40" r="${R0}" fill="none" stroke="${col}" stroke-width="12" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 40 40)"/>`; off += len; });
  return `<svg viewBox="0 0 80 80" width="92" height="92" style="flex:none">${segs}<text x="40" y="38" text-anchor="middle" font-size="13" font-weight="700" fill="var(--text)">${r0(tot)}</text><text x="40" y="50" text-anchor="middle" font-size="8" fill="var(--muted)">kcal</text></svg>`;
}
function statusTag(tot, t, free) {
  const off = tot.kcal - t.kcal;
  if (free && tot.kcal) return `<span class="tag" style="background:#ede9fe;color:#6d28d9">🎉 ${free}</span>`;
  return !tot.kcal ? '' : Math.abs(off) <= t.kcal * 0.05 ? '<span class="tag">✅ en objetivo</span>' : off > 0 ? `<span class="tag bad">⚠️ te pasas ${r0(off)} kcal</span>` : `<span class="tag warn">faltan ${r0(-off)} kcal</span>`;
}
// Resumen de un día con gráfico circular: ¿cubro mis macros y no me paso?
function daySummary(tot, t, free) {
  const off = tot.kcal - t.kcal, kc = tot.p * 4 + tot.c * 4 + tot.f * 9 || 1, pr = db.profile;
  const st = statusTag(tot, t, free);
  const warn = [];
  if (free) { /* día libre: sin avisos */ } else if (tot.kcal && tot.p < t.p * 0.9) warn.push(`faltan ${r0(t.p - tot.p)} g de proteína`);
  if (!free && tot.f > t.f * 1.1) warn.push(`${r0(tot.f - t.f)} g de grasa de más`);
  if (!free && tot.c > t.c * 1.1) warn.push(`${r0(tot.c - t.c)} g de hidratos de más`);
  return `<div class="row" style="gap:12px">${donut(tot.p, tot.c, tot.f)}<div class="grow"><div><b>${r0(tot.kcal)}</b> / ${r0(t.kcal)} kcal ${st}</div>
    <div class="muted" style="font-size:.78rem;margin-bottom:5px">P ${r0(tot.p * 4 / kc * 100)}% · C ${r0(tot.c * 4 / kc * 100)}% · G ${r0(tot.f * 9 / kc * 100)}% (obj. ${pr.pP}/${pr.pC}/${pr.pF})</div>
    ${macroRow('Proteínas', 'var(--p)', tot.p, t.p)}${macroRow('Hidratos', 'var(--c)', tot.c, t.c)}${macroRow('Grasas', 'var(--f)', tot.f, t.f)}</div></div>${warn.length ? `<div class="warnc" style="font-size:.82rem">⚠️ ${warn.join(' · ')}</div>` : ''}`;
}
// Cantidad real consumida: en gramos o en unidades/raciones (si conocemos el peso de una unidad).
const modeOpts = f => f.unit === '100g' ? [['g', 'gramos'], ...(f.serv > 0 ? [['ud', `unidades (${r1(f.serv)} g)`]] : [])] : [['rac', 'raciones'], ...(f.serv > 0 ? [['g', `gramos (ración = ${r1(f.serv)} g)`]] : [])];
const toNative = (f, v, mode) => f.unit === '100g' ? (mode === 'ud' ? v * f.serv : v) : (mode === 'g' && f.serv > 0 ? v / f.serv : v);
const defMode = f => f.unit === '100g' ? (f.serv > 0 ? 'ud' : 'g') : 'rac';
const defQty = (f, mode) => mode === 'g' ? 100 : 1;
const macroRow = (label, color, v, t) => {
  const pct = t ? v / t * 100 : 0;
  return `<div class="macro"><div class="h"><span><span class="dot" style="background:${color}"></span>${label}</span><span><b>${r0(v)}</b> / ${r0(t)} g</span></div><div class="bar"><i style="width:${Math.min(100, pct)}%;background:${pct > 110 ? 'var(--bad)' : color}"></i></div></div>`;
};

// ───────── protección y copias de seguridad ─────────
const P = { persisted: null };
async function askPersist() {
  try { if (navigator.storage?.persist) P.persisted = (await navigator.storage.persisted()) || (await navigator.storage.persist()); } catch (e) { /* sin soporte */ }
  if (S.tab === 'ajustes' && !document.activeElement?.closest?.('input,select,textarea')) render();
}
const backupDays = () => Math.floor((parseD(todayS()) - parseD(db.lastBackup || db.created)) / 864e5);
const needsBackup = () => Object.values(db.log).some(d => d.entries.length) && backupDays() >= 7;
async function doBackup(share) {
  const name = `tupperfit-${todayS()}.json`, json = JSON.stringify(db, null, 1);
  const download = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  try {
    const file = new File([json], name, { type: 'application/json' });
    if (share && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'Copia de TupperFit' }); else download();
  } catch (e) { if (e.name === 'AbortError') return; download(); }
  db.lastBackup = todayS(); save(); render(); toast('Copia guardada ✔');
}

// ───────── estado de la interfaz ─────────
const S = { tab: 'hoy', date: todayS(), planWeek: mondayOf(todayS()), weekStart: mondayOf(todayS()), q: '', filter: 'all', wRange: 'all', pOpen: {} };
let M = null; // estado de la ventana "añadir"
let R = null; // estado del editor de platos con ingredientes
let C = null; // estado del catálogo de nococinomas

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 2600);
}
function openModal(html) { const m = $('#modal'); m.innerHTML = `<div class="sheet">${html}</div>`; m.hidden = false; }
function closeModal() { $('#modal').hidden = true; $('#modal').innerHTML = ''; M = null; R = null; C = null; if (typeof extrasClose === 'function') extrasClose(); }

// ───────── vistas ─────────
const VIEWS = { hoy: () => viewHoy(), alimentos: () => viewAlimentos(), plan: () => viewPlan(), semana: () => viewSemana(), ajustes: () => viewAjustes() }; // extras.js añade "medidas"
function render() {
  $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === S.tab));
  $('#topinfo').textContent = `Objetivo ${r0(db.profile.kcal)} kcal`;
  $('#view').innerHTML = VIEWS[S.tab]();
}

function viewHoy() {
  const date = S.date, day = getDay(date), t = targets(), tot = totals(day.entries);
  const rem = t.kcal - tot.kcal, over = rem < 0;
  const kc = tot.p * 4 + tot.c * 4 + tot.f * 9 || 1;
  const exp = expenditure(date), def = exp - tot.kcal;
  const plan = getPlan(date).filter(e => !e.done);
  const isToday = date === todayS();
  let h = `<div class="daynav"><button data-act="day" data-n="-1">‹</button><div class="t" data-act="cal" data-for="hoy">📅 ${isToday ? 'Hoy · ' : ''}${fmtDate(date)}</div><button data-act="day" data-n="1">›</button></div>`;
  if (!isToday) h += `<div class="center" style="margin:-4px 0 10px"><button class="btn sm sec" data-act="today">Ir a hoy</button></div>`;
  if (!db.profile.configured) h += `<div class="card"><b>👋 ¡Bienvenida!</b><p class="muted">Empieza configurando tu perfil para calcular tus calorías y macros objetivo.</p><button class="btn" data-act="tab" data-tab="ajustes">Configurar perfil</button></div>`;

  if (needsBackup()) h += `<div class="card" style="border-color:var(--warn)"><b>💾 Haz una copia de seguridad</b><p class="muted">${db.lastBackup ? `Hace ${backupDays()} días de tu última copia.` : `Aún no has hecho ninguna copia y llevas ${backupDays()} días de datos.`} Si se borran los datos del navegador, se perderían.</p><button class="btn" data-act="backup-share">Guardar copia ahora</button></div>`;
  h += `<div class="card"><div class="row" style="gap:14px">${ring(tot.kcal / t.kcal, over ? (isFreeDay(date) ? 'var(--ex)' : 'var(--bad)') : 'var(--kcal)', r0(Math.abs(rem)), over ? 'kcal de más' : 'kcal restantes')}
    <div class="grow"><div class="muted">Comido</div><b style="font-size:1.3rem">${r0(tot.kcal)}</b> <span class="muted">/ ${r0(t.kcal)} kcal</span>
    <div class="muted mt">Reparto actual</div><div style="font-size:.85rem">P ${r0(tot.p * 4 / kc * 100)}% · C ${r0(tot.c * 4 / kc * 100)}% · G ${r0(tot.f * 9 / kc * 100)}%</div>
    <div class="muted">Objetivo: P ${db.profile.pP}% · C ${db.profile.pC}% · G ${db.profile.pF}%</div></div></div>
    <div class="mt">${macroRow('Proteínas', 'var(--p)', tot.p, t.p)}${macroRow('Hidratos', 'var(--c)', tot.c, t.c)}${macroRow('Grasas', 'var(--f)', tot.f, t.f)}</div>
    ${day.entries.length ? `<div class="row between wrap" style="font-size:.85rem"><span class="muted">Gasto estimado ${r0(exp)} kcal${day.burned > 0 ? ' (con tu reloj)' : ''}</span><span class="${def >= 0 ? 'good' : 'badc'}"><b>${def >= 0 ? 'Déficit' : 'Superávit'} ${r0(Math.abs(def))} kcal</b></span></div>` : ''}</div>`;

  const fd = isFreeDay(date), fk = totals(day.entries.filter(e => isFreeEntry(date, e))).kcal;
  h += `<div class="row wrap" style="margin:-4px 0 12px"><button class="btn sm sec" data-act="voice">🎤 Dictar comidas</button><button class="btn sm ${fd ? '' : 'ghost'}" style="${fd ? 'background:var(--ex)' : ''}" data-act="free-day" data-date="${date}">🎉 ${fd ? 'Día libre ✔ (quitar)' : 'Marcar como día libre'}</button>${fk ? `<span class="muted">${r0(fk)} kcal libres</span>` : ''}</div>${fd ? '<p class="muted" style="margin-top:-6px">Hoy es día libre: se registra tal cual (cuenta en tu déficit real) pero no se considera un fallo ni entra en las medias del plan.</p>' : ''}`;
  if (plan.length) {
    h += `<div class="card plancard"><div class="row between"><h3>🗓️ Planificado para hoy</h3><button class="btn sm" data-act="plan-reg-all">Registrar todo</button></div>`;
    plan.forEach(e => { const m = eM(e); h += `<div class="entry"><div class="grow"><div class="n">${e.free ? '🎉 ' : ''}${esc(e.name)}</div><div class="s">${MEALS.find(x => x[0] === e.meal)[1]} · ${qtyLabel(e)}</div></div><span class="k">${r0(m.kcal)}</span><button class="icon" data-act="plan-reg" data-id="${e.id}" title="Registrar">✅</button></div>`; });
    h += '</div>';
  }

  MEALS.forEach(([key, name, ic]) => {
    const es = day.entries.filter(e => e.meal === key), st = totals(es);
    if (key === 'otros' && !es.length) return;
    h += `<div class="card meal"><h3><span>${ic} ${name}</span><span class="muted">${es.length ? r0(st.kcal) + ' kcal' : ''}</span></h3>`;
    if (!es.length) h += '<div class="empty">Nada registrado</div>';
    es.forEach(e => {
      const m = eM(e);
      h += `<div class="entry" data-act="edit-entry" data-id="${e.id}" data-where="log"><div class="grow"><div class="n">${e.free ? '🎉 ' : ''}${esc(e.name)}</div><div class="s">${qtyLabel(e)} · P ${r0(m.p)} · C ${r0(m.c)} · G ${r0(m.f)}</div></div><span class="k">${r0(m.kcal)}</span><button class="icon" data-act="del-entry" data-id="${e.id}" data-where="log" title="Quitar">🗑️</button></div>`;
    });
    h += `<button class="btn sm sec mt" data-act="add" data-target="log" data-meal="${key}">＋ Añadir</button></div>`;
  });
  if (!day.entries.some(e => e.meal === 'otros')) h += `<button class="btn sm ghost" data-act="add" data-target="log" data-meal="otros">＋ Añadir otro (picoteo, bebida…)</button>`;

  const wk = workouts(day);
  h += `<div class="card mt"><h3><span>💪 Ejercicio</span><span class="muted">${wk.length ? `${sum(wk.map(k => k.min))} min · ${r0(sum(wk.map(k => k.kcal)))} kcal` : ''}</span></h3>${wk.length ? '' : '<div class="empty">Sin ejercicio registrado</div>'}${wk.map(k => `<div class="entry"><div class="grow"><div class="n">${SPORTS[k.type][0]}</div><div class="s">${k.min} min</div></div><span class="k">${r0(k.kcal)}${k.est ? '~' : ''}</span><button class="icon" data-act="del-work" data-id="${k.id}">🗑️</button></div>`).join('')}<button class="btn sm sec mt" data-act="add-work">＋ Añadir ejercicio</button></div>`;
  h += `<div class="card"><h3>🏃 Cuerpo y actividad</h3><div class="grid2">
    <div class="field"><label>Peso (kg)</label><input type="number" inputmode="decimal" step="0.1" data-day="weight" value="${day.weight ?? ''}" placeholder="${latestWeight(date)}"></div>
    <div class="field"><label>Pasos</label><input type="number" inputmode="numeric" data-day="steps" value="${day.steps ?? ''}" placeholder="${db.profile.stepsGoal}"></div>
    <div class="field"><label>Calorías activas (Amazfit)</label><input type="number" inputmode="numeric" data-day="burned" value="${day.burned ?? ''}" placeholder="p. ej. 350"></div>
    <div class="field"><label>Agua (litros)</label><input type="number" inputmode="decimal" step="0.25" data-day="water" value="${day.water ?? ''}" placeholder="2"></div></div>
    <div class="field"><label>Nota del día</label><input type="text" data-day="note" value="${esc(day.note)}" placeholder="Cómo te has sentido, hambre, sueño…"></div>
    <p class="muted">Copia estos datos desde Zepp (pasos y calorías activas). Con las calorías activas el déficit es más preciso.</p></div>`;
  return h;
}

function foodListHtml(selId) {
  const q = S.q.trim().toLowerCase();
  let list = db.foods.filter(f => (S.filter === 'all' || (S.filter === 'fav' ? f.fav : f.type === S.filter)) && (!q || f.name.toLowerCase().includes(q)));
  list.sort((a, b) => (b.fav - a.fav) || ((b.used || 0) - (a.used || 0)) || a.name.localeCompare(b.name));
  if (!list.length) return '<p class="empty">No hay alimentos que coincidan. Crea uno nuevo con el botón de arriba.</p>';
  return list.map(f => `<div class="food ${f.id === selId ? 'sel' : ''}" data-act="${M ? 'pick' : 'edit-food'}" data-id="${f.id}">
    <button class="star" data-act="fav" data-id="${f.id}" title="Favorito">${f.fav ? '⭐' : '☆'}</button>
    <div class="grow"><div class="n">${esc(f.name)} ${mismatch(f) ? '<span class="tag warn" title="Las kcal no cuadran con las macros">⚠️ revisar</span>' : ''}</div>
    <div class="s muted">${TYPES[f.type] || ''}${f.ingredients ? ` · ${f.ingredients.length} ingredientes` : ''} · ${f.unit === '100g' ? 'por 100 g' : 'por ración'} · P ${r1(f.p)} C ${r1(f.c)} G ${r1(f.f)}</div></div><b>${r0(f.kcal)}</b></div>`).join('');
}
const chipsHtml = () => `<div class="chips">${[['all', 'Todos'], ['fav', '⭐ Favoritos'], ['tupper', '🍱 Tuppers'], ['casero', '🍳 Caseros'], ['producto', '🏷️ Productos'], ['base', '🥦 Básicos']].map(([k, l]) => `<button class="chip ${S.filter === k ? 'on' : ''}" data-act="filter" data-k="${k}">${l}</button>`).join('')}</div>`;

function viewAlimentos() {
  return `<div class="row between" style="margin-bottom:8px"><h2 style="margin:0">🍱 Mis alimentos</h2><button class="btn" data-act="food-menu">＋ Añadir</button></div>
    <div class="card"><div class="field"><input type="search" id="q" placeholder="Buscar en mis ${db.foods.length} alimentos…" value="${esc(S.q)}"></div>${chipsHtml()}<div id="foodlist">${foodListHtml()}</div></div>`;
}
// Todas las formas de añadir un alimento, en un solo sitio
function foodMenu() {
  const opt = (act, ic, t, d) => `<div class="opt" data-act="${act}"><span class="ic">${ic}</span><div class="grow"><b>${t}</b><div class="muted">${d}</div></div><span class="muted">›</span></div>`;
  openModal(`<div class="hd"><h2>¿Cómo quieres añadirlo?</h2><button class="icon" data-act="close">✕</button></div>
    ${opt('catalog', '🔎', 'Catálogo nococinomas', 'Elige entre los tuppers de su web, ya con sus macros')}
    ${opt('scan', '📷', 'Escanear código de barras', 'Para productos del supermercado')}
    ${opt('new-food', '✍️', 'Escribirlo a mano', 'Nombre y valores de la etiqueta; también sirve de calculadora')}
    ${opt('voice-new', '🎤', 'Decirlo por voz', 'Dicta el nombre y las calorías y macros')}
    ${opt('new-recipe', '🍳', 'Plato con ingredientes', 'Tu receta casera, ingrediente a ingrediente')}
    ${opt('import', '📋', 'Importar varios', 'Pega una lista de tuppers de golpe')}`);
}

function planBudget(mon, t) {
  const ds7 = [0, 1, 2, 3, 4, 5, 6].map(i => addDays(mon, i)), pl = ds7.filter(d => getPlan(d).length), eaten = sum(pl.map(d => totals(getPlan(d)).kcal));
  if (!pl.length) return '';
  const free = sum(ds7.map(d => totals(getPlan(d).filter(e => isFreeEntry(d, e))).kcal)), margin = pl.length * t.kcal - eaten;
  return `<div class="card"><h3>⚖️ Presupuesto de la semana</h3><div class="row between"><span>Planificado (${pl.length} ${pl.length === 1 ? 'día' : 'días'})</span><b>${r0(eaten)} kcal</b></div><div class="row between"><span>Presupuesto (${pl.length} × ${r0(t.kcal)})</span><b>${r0(pl.length * t.kcal)} kcal</b></div>
    <div class="advice ${margin >= 0 ? '' : 'bad'} mt">${margin >= 0 ? `✅ Te quedan <b>${r0(margin)} kcal</b> de margen: es lo que puedes gastar en comidas libres sin salirte del déficit previsto.` : `⚠️ Con este plan te pasas <b>${r0(-margin)} kcal</b> sobre el presupuesto semanal. Reduce algún día para compensar la comida libre.`}</div>${free ? `<p class="muted">Incluye ${r0(free)} kcal en comidas libres.</p>` : ''}</div>`;
}
function viewPlan() {
  const mon = S.planWeek, t = targets(), today = todayS();
  let h = `<div class="daynav"><button data-act="pweek" data-n="-1">‹</button><div class="t" data-act="cal" data-for="plan">📅 Semana del ${fmtDate(mon, { day: 'numeric', month: 'short' })}</div><button data-act="pweek" data-n="1">›</button></div>
    <div class="row wrap" style="margin-bottom:10px"><button class="btn sm sec" data-act="plan-copy-prev">📋 Copiar plan de la semana anterior</button><button class="btn sm sec" data-act="plan-from-log">⏪ Usar lo que comí la semana anterior</button></div>
    ${planBudget(mon, t)}
    <div class="row wrap" style="margin-bottom:10px"><button class="btn sm ghost" data-act="pall" data-k="open">Desplegar todos</button><button class="btn sm ghost" data-act="pall" data-k="close">Plegar todos</button></div>`;
  const orders = {};
  for (let i = 0; i < 7; i++) {
    const date = addDays(mon, i), es = getPlan(date), tot = totals(es);
    const fl = isFreeDay(date) ? 'día libre' : es.some(e => e.free) ? 'con comida libre' : '';
    const open = S.pOpen[date] ?? es.length === 0; // los días con comidas se pliegan solos
    es.forEach(e => { if (db.foods.find(f => f.id === e.foodId)?.type === 'tupper') orders[e.name] = (orders[e.name] || 0) + e.qty; });
    h += `<div class="card pday ${date === today ? 'today' : ''}"><h3 data-act="pday" data-date="${date}" style="cursor:pointer"><span style="text-transform:capitalize">${open ? '▾' : '▸'} ${fmtDate(date, { weekday: 'long', day: 'numeric' })}${isFreeDay(date) ? ' 🎉' : ''}</span>${!open && es.length ? `<span style="font-weight:400;font-size:.85rem">${statusTag(tot, t, fl)} <b>${r0(tot.kcal)}</b> kcal · P ${r0(tot.p)} g</span>` : ''}</h3>`;
    if (open) {
      h += es.length ? `<div style="margin-bottom:6px">${daySummary(tot, t, fl)}</div>` : '<div class="empty">Sin planificar</div>';
      MEALS.forEach(([key, name, ic]) => es.filter(e => e.meal === key).forEach(e => {
        const m = eM(e);
        h += `<div class="entry" data-act="edit-entry" data-id="${e.id}" data-where="plan" data-date="${date}"><span>${ic}</span><div class="grow"><div class="n">${e.free ? '🎉 ' : ''}${esc(e.name)}</div><div class="s">${qtyLabel(e)} · P ${r0(m.p)}</div></div><span class="k">${r0(m.kcal)}</span><button class="icon" data-act="del-entry" data-id="${e.id}" data-where="plan" data-date="${date}">🗑️</button></div>`;
      }));
      h += `<div class="row wrap mt"><button class="btn sm sec" data-act="add" data-target="plan" data-date="${date}" data-meal="almuerzo">＋ Añadir</button>${es.length ? `<button class="btn sm ghost" data-act="plan-dup" data-date="${date}">Duplicar al día siguiente</button>` : ''}<button class="btn sm ghost" data-act="free-day" data-date="${date}">🎉 ${isFreeDay(date) ? 'Quitar día libre' : 'Día libre'}</button></div>`;
    }
    h += '</div>';
  }
  const names = Object.keys(orders);
  h += `<div class="card"><h3>🛒 Pedido de tuppers de la semana</h3>${names.length ? names.sort().map(n => `<div class="row between entry"><span>${esc(n)}</span><b>× ${r1(orders[n])}</b></div>`).join('') + `<p class="muted">Total: ${r0(sum(Object.values(orders)))} tuppers</p>` : '<p class="empty">Planifica tuppers (alimentos de tipo "Tupper") y aquí verás cuántos pedir.</p>'}</div>`;
  return h;
}

function viewSemana() {
  const mon = S.weekStart, w = weekStats(mon), prev = weekStats(addDays(mon, -7)), t = targets(), p = db.profile;
  const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const delta = (a, b, u, inv) => (!prev.n || b == null || a == null) ? '' : `<span class="${(a - b) * (inv ? -1 : 1) >= 0 ? 'good' : 'badc'}">${a - b >= 0 ? '▲' : '▼'} ${Math.abs(r1(a - b))}${u}</span>`;
  let h = progressCard() + `<h2 style="margin:14px 0 8px">Balance de la semana</h2><div class="daynav"><button data-act="wweek" data-n="-1">‹</button><div class="t" data-act="cal" data-for="semana">📅 ${fmtDate(mon, { day: 'numeric', month: 'short' })} – ${fmtDate(addDays(mon, 6), { day: 'numeric', month: 'short' })}</div><button data-act="wweek" data-n="1">›</button></div>`;
  if (!w.n) return h + '<div class="card"><p class="empty">No hay comidas registradas esta semana. Registra tus días en la pestaña "Hoy" y aquí verás el balance.</p></div>';

  const fat = w.totalDef / 7700;
  h += `<div class="card"><h2>Resumen</h2><div class="grid3">
    <div class="stat"><b>${r0(w.kcal)}</b><span>kcal/día${w.freeDays ? ' (sin comidas libres)' : ''} · obj. ${r0(t.kcal)}</span>${delta(w.kcal, prev.kcal, '', true)}</div>
    <div class="stat"><b>${r0(w.p)} g</b><span>proteína/día (obj. ${r0(t.p)})</span>${delta(w.p, prev.p, '')}</div>
    <div class="stat"><b>${w.n}/7</b><span>días registrados</span></div>
    <div class="stat"><b class="${w.deficit >= 0 ? 'good' : 'badc'}">${r0(w.deficit)}</b><span>déficit medio kcal/día</span></div>
    <div class="stat"><b>${r1(fat)} kg</b><span>grasa estimada perdida</span></div>
    <div class="stat"><b>${w.inRange}/${w.np}</b><span>días de plan en objetivo (±5%)</span></div></div>${w.freeDays ? `<p class="muted mt">Las medias y avisos no cuentan los ${w.freeDays} ${w.freeDays === 1 ? 'día' : 'días'} con comida libre. El déficit y la grasa estimada sí incluyen todo lo que comiste.</p>` : ''}</div>`;

  h += `<div class="card"><h3>Calorías por día</h3>${barChart(w.days.map((x, i) => ({ l: labels[i], v: x.logged ? x.t.kcal : 0, color: x.hasFree ? 'var(--ex)' : x.t.kcal > t.kcal * 1.05 ? 'var(--bad)' : 'var(--kcal)' })), { target: t.kcal })}<p class="muted">Línea roja = tu objetivo (${r0(t.kcal)} kcal). Morado = día con comida libre.</p></div>`;
  const wb = w.margin, rem = w.days.filter(x => !x.logged).length;
  h += `<div class="card"><h3>🎉 Comidas libres y presupuesto</h3>${w.freeMeals ? `<div class="grid3"><div class="stat"><b>${w.freeDays}</b><span>${w.freeDays === 1 ? 'día' : 'días'} con comida libre</span></div><div class="stat"><b>${r0(w.freeKcal)}</b><span>kcal libres</span></div><div class="stat"><b>${r0(w.freeKcal / (w.eaten || 1) * 100)}%</b><span>de lo que comiste</span></div></div><p class="muted">Si no las compensas, ${r0(w.freeKcal)} kcal equivalen a unos ${r1(w.freeKcal / 7700)} kg de grasa. Con una comida libre a la semana y el resto en plan, el déficit se mantiene.</p>` : '<p class="muted">No has marcado comidas libres esta semana. En "Hoy" puedes marcar un día libre, o añadir una comida con la casilla 🎉 o en la pestaña "Libre".</p>'}
    <div class="advice ${wb >= 0 ? '' : 'bad'}">${wb >= 0 ? `⚖️ Presupuesto semanal: te sobran <b>${r0(wb)} kcal</b>${rem ? ` (contando ${rem} ${rem === 1 ? 'día sin registrar' : 'días sin registrar'} justo en tu objetivo)` : ''}. Es tu margen para una comida libre.` : `⚖️ Presupuesto semanal: te has pasado <b>${r0(-wb)} kcal</b>${rem ? ` (contando ${rem} ${rem === 1 ? 'día sin registrar' : 'días sin registrar'} en tu objetivo)` : ''}. Intenta compensar en los próximos días.`}</div></div>`;
  h += `<div class="card"><h3>Proteína por día (g)</h3>${barChart(w.days.map((x, i) => ({ l: labels[i], v: x.logged ? x.t.p : 0 })), { target: t.p, color: 'var(--p)' })}</div>`;
  h += `<div class="card"><h3>Reparto de macros</h3>
    ${[['Proteínas', 'var(--p)', w.pctP, p.pP], ['Hidratos', 'var(--c)', w.pctC, p.pC], ['Grasas', 'var(--f)', w.pctF, p.pF]].map(([n, c, v, o]) => `<div class="macro"><div class="h"><span><span class="dot" style="background:${c}"></span>${n}</span><span><b>${r0(v)}%</b> (objetivo ${o}%)</span></div><div class="bar"><i style="width:${Math.min(100, v)}%;background:${c}"></i></div></div>`).join('')}
    <p class="muted">Media diaria: ${r0(w.p)} g P · ${r0(w.c)} g C · ${r0(w.f)} g G</p></div>`;
  h += `<div class="card"><h3>⚖️ Peso</h3>${lineChart(w.days.map((x, i) => ({ l: labels[i], v: x.d.weight })), { unit: '' })}${w.wAvg ? `<p class="muted">Media semanal ${r1(w.wAvg)} kg ${delta(w.wAvg, prev.wAvg, ' kg', true)}${w.wCount > 1 ? ` · variación en la semana ${r1(w.wLast - w.wFirst) > 0 ? '+' : ''}${r1(w.wLast - w.wFirst)} kg` : ''}</p>` : ''}</div>`;
  h += `<div class="card"><h3>👣 Pasos</h3>${w.steps ? barChart(w.days.map((x, i) => ({ l: labels[i], v: x.d.steps || 0 })), { target: p.stepsGoal, color: 'var(--c)' }) + `<p class="muted">Media ${r0(w.steps)} pasos/día (objetivo ${p.stepsGoal}) ${delta(w.steps, prev.steps, '')}</p>` : '<p class="empty">Anota tus pasos en "Hoy".</p>'}</div>`;

  const tn = Object.entries(w.byType).sort((a, b) => b[1].min - a[1].min);
  h += `<div class="card"><h3>💪 Ejercicio</h3>${w.wN || w.burned ? `<div class="grid3"><div class="stat"><b>${w.wN}</b><span>sesiones</span>${delta(w.wN, prev.wN, '')}</div><div class="stat"><b class="${w.wMin >= WEEK_MIN_GOAL ? 'good' : ''}">${w.wMin}</b><span>minutos (obj. ${WEEK_MIN_GOAL})</span>${delta(w.wMin, prev.wMin, '')}</div><div class="stat"><b>${r0(w.wKcal)}</b><span>kcal en ejercicios</span></div></div>
    <div class="bar mt"><i style="width:${Math.min(100, w.wMin / WEEK_MIN_GOAL * 100)}%;background:var(--ex)"></i></div><p class="muted">${w.wMin >= WEEK_MIN_GOAL ? '✅ Has llegado a los ' + WEEK_MIN_GOAL + ' min semanales recomendados.' : `Te faltan ${WEEK_MIN_GOAL - w.wMin} min para los ${WEEK_MIN_GOAL} min semanales recomendados.`}</p>
    <h3 class="mt">Minutos por día</h3>${barChart(w.days.map((x, i) => ({ l: labels[i], v: sum(workouts(x.d).map(k => k.min)) })), { color: 'var(--ex)' })}
    ${tn.length ? tn.map(([k, v]) => `<div class="row between entry"><span>${SPORTS[k][0]}</span><span class="muted">${v.n} × · <b>${v.min} min</b></span></div>`).join('') : ''}
    ${w.days.some(x => x.d.burned) ? `<h3 class="mt">Calorías activas del reloj</h3>${barChart(w.days.map((x, i) => ({ l: labels[i], v: x.d.burned || 0 })), { color: 'var(--ex)' })}` : ''}` : '<p class="empty">Registra tus entrenos en "Hoy → Ejercicio" para ver aquí minutos, sesiones y tipos de actividad.</p>'}</div>`;
  h += `<div class="card"><h2>💡 Qué corregir</h2>${advice(w, prev).map(a => `<div class="advice ${a[0]}">${a[1]}</div>`).join('')}</div>`;

  const bad = [];
  w.L.forEach(x => x.d.entries.forEach(e => { if (!e.free && mismatch({ ...e.base })) bad.push(e); }));
  if (bad.length) h += `<div class="card"><h3>🔎 Revisión de datos</h3><p class="muted">Estos alimentos tienen kcal que no cuadran con sus macros (4·P + 4·C + 9·G). Puede ser por fibra, polioles, alcohol o un dato mal copiado:</p>${[...new Set(bad.map(e => e.name))].map(n => { const e = bad.find(b => b.name === n), k = calcKcal(e.base.p, e.base.c, e.base.f); return `<div class="entry"><span class="grow">${esc(n)}</span><span class="muted">dice ${r0(e.base.kcal)} · macros ${r0(k)}</span></div>`; }).join('')}</div>`;

  h += `<div class="card"><h3>Planificar la semana siguiente</h3><p class="muted">Copia lo que comiste esta semana como borrador del plan de la próxima y ajústalo.</p><button class="btn" data-act="plan-next-from-week">🗓️ Crear plan de la próxima semana</button></div>`;
  return h;
}

function advice(w, prev) {
  const a = [], t = targets(), p = db.profile, kg = latestWeight(addDays(w.days[6].date, 0));
  if (w.n < 5) a.push(['warn', `Solo has registrado ${w.n} días: cuantos más registres, más fiables son las conclusiones.`]);
  const on = !w.allFree, dk = w.kcal - t.kcal;
  if (!on) a.push(['', '🎉 Todos los días registrados tienen comida libre: no hay días "de plan" para valorar calorías y macros.']);
  else if (dk > t.kcal * 0.05) a.push(['bad', `Te has pasado una media de <b>${r0(dk)} kcal/día</b> sobre tu objetivo. Mira qué días se disparan (gráfico de calorías) y ajusta meriendas o cenas.`]);
  else if (dk < -t.kcal * 0.15) a.push(['warn', `Has comido <b>${r0(-dk)} kcal/día por debajo</b> del objetivo. Un déficit demasiado agresivo aumenta el hambre y puede hacerte perder músculo.`]);
  else a.push(['', `✅ Calorías en el objetivo (${r0(w.kcal)} de ${r0(t.kcal)} kcal/día de media).`]);
  if (on && w.kcal < bmr() && w.kcal > 0) a.push(['bad', `Tu media (${r0(w.kcal)} kcal) está por debajo de tu metabolismo basal (~${r0(bmr())} kcal). Conviene subir un poco las calorías.`]);
  const gkg = w.p / kg;
  if (!on) { /* sin días de plan */ } else if (w.p < t.p * 0.9) a.push(['warn', `Proteína baja: <b>${r0(w.p)} g/día</b> frente a ${r0(t.p)} g objetivo (${r1(gkg)} g/kg). Añade yogur griego/skyr, claras, atún o un tupper más proteico.`]);
  else if (on) a.push(['', `✅ Proteína correcta: ${r0(w.p)} g/día (${r1(gkg)} g/kg de peso).`]);
  if (on && w.pctF > p.pF + 4) a.push(['warn', `Grasas altas: <b>${r0(w.pctF)}%</b> frente al ${p.pF}% objetivo. Revisa aceite, frutos secos y tuppers con más grasa.`]);
  if (on && w.pctC > p.pC + 6) a.push(['warn', `Hidratos por encima del objetivo (${r0(w.pctC)}% vs ${p.pC}%).`]);
  if (w.wCount >= 2 && w.n >= 4) {
    const exp = -w.totalDef / 7700, real = w.wLast - w.wFirst;
    if (real > exp + 0.6) a.push(['warn', `El peso ha bajado menos de lo estimado (${r1(real)} kg real vs ${r1(exp)} kg esperado). Puede ser retención de líquidos o que estés infraestimando raciones; observa otra semana antes de bajar calorías.`]);
  }
  if (prev.wAvg && w.wAvg) { const d = w.wAvg - prev.wAvg; a.push([d <= 0 ? '' : 'warn', `Peso medio ${d <= 0 ? 'bajando' : 'subiendo'}: ${d > 0 ? '+' : ''}${r1(d)} kg respecto a la semana anterior.`]); }
  if (w.steps != null) a.push([w.steps >= p.stepsGoal ? '' : 'warn', w.steps >= p.stepsGoal ? `✅ Pasos: media de ${r0(w.steps)}/día, objetivo cumplido.` : `Pasos por debajo del objetivo (${r0(w.steps)} de ${p.stepsGoal}). Un paseo de 20 min suma ~2.000 pasos.`]);
  return a;
}

function viewAjustes() {
  const p = db.profile, b = bmr(), td = tdee(), sug = Math.round(td - p.goalKgWeek * 1100), t = targets(), tot = p.pP + p.pC + p.pF, wt = latestWeight();
  const inp = (k, label, extra = '') => `<div class="field"><label>${label}</label><input type="number" inputmode="decimal" data-prof="${k}" value="${p[k]}" ${extra}></div>`;
  return `<div class="card"><h2>👤 Tu perfil</h2><div class="grid2">
    <div class="field"><label>Sexo</label><select data-prof="sex"><option value="f" ${p.sex === 'f' ? 'selected' : ''}>Mujer</option><option value="m" ${p.sex === 'm' ? 'selected' : ''}>Hombre</option></select></div>
    ${inp('age', 'Edad')}${inp('height', 'Altura (cm)')}${inp('weight', 'Peso inicial (kg)', 'step="0.1"')}${inp('goalWeight', 'Peso objetivo (kg)', 'step="0.1"')}${inp('stepsGoal', 'Objetivo de pasos')}</div>
    <div class="field"><label>Nivel de actividad</label><select data-prof="activity">${ACTIVITY.map(([v, l]) => `<option value="${v}" ${p.activity === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="field"><label>Ritmo de pérdida deseado</label><select data-prof="goalKgWeek">${[[0.25, '0,25 kg/semana (suave)'], [0.5, '0,5 kg/semana (recomendado)'], [0.75, '0,75 kg/semana'], [1, '1 kg/semana (agresivo)']].map(([v, l]) => `<option value="${v}" ${p.goalKgWeek === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="preview">Metabolismo basal: <b>${r0(b)} kcal</b> · Gasto diario estimado: <b>${r0(td)} kcal</b><br>Para perder ${p.goalKgWeek} kg/semana: <b>${sug} kcal/día</b> ${sug < b ? '<span class="badc">⚠️ por debajo de tu basal</span>' : ''}</div></div>

  <div class="card"><h2>🎯 Objetivos diarios</h2>
    <div class="field"><label>Calorías objetivo (kcal/día)</label><input type="number" inputmode="numeric" data-prof="kcal" value="${p.kcal}"></div>
    <button class="btn sm sec" data-act="use-sug">Usar la sugerida (${sug} kcal)</button>
    <div class="grid3 mt">${inp('pP', '% Proteínas')}${inp('pC', '% Hidratos')}${inp('pF', '% Grasas')}</div>
    <div class="preview ${tot !== 100 ? 'badc' : ''}">Suma: <b>${tot}%</b> ${tot !== 100 ? '⚠️ debe sumar 100%' : '✅'}<br>
    Proteínas <b>${r0(t.p)} g</b> · Hidratos <b>${r0(t.c)} g</b> · Grasas <b>${r0(t.f)} g</b></div>
    <div class="preview muted">📐 Así se calcula: ${p.pP}% de ${r0(p.kcal)} kcal = ${r0(p.kcal * p.pP / 100)} kcal ÷ 4 kcal/g = <b>${r0(t.p)} g de proteína</b>. Hidratos igual (÷ 4) y grasas ÷ 9.<br>Proteína por kg: ${r0(t.p)} g ÷ ${r1(wt)} kg (tu último peso) = <b>${r1(t.p / wt)} g/kg</b> ${t.p / wt < 1.2 ? '<span class="warnc">· bajo para un déficit: sube el % de proteínas</span>' : ''}</div>
    <p class="muted">Las calorías se calculan con 4 kcal/g de proteínas e hidratos y 9 kcal/g de grasas. Con déficit se suele recomendar 1,6–2,2 g de proteína por kg.</p></div>

  <div class="card"><h2>💾 Copia de seguridad</h2><p class="muted">Tus datos viven solo en este dispositivo. Guarda copias para no perderlos y para pasarlos de un dispositivo a otro.</p>
    <div class="preview">Última copia: <b>${db.lastBackup ? `${fmtDate(db.lastBackup, { day: 'numeric', month: 'long' })} (hace ${backupDays()} días)` : 'ninguna todavía'}</b><br>Protección del navegador: ${P.persisted ? '🔒 <b>activa</b> (no los borrará solo si falta espacio)' : '⚠️ no garantizada: el navegador podría borrar los datos si le falta espacio. Instala la app en la pantalla de inicio y haz copias.'}</div>
    <div class="row wrap"><button class="btn" data-act="backup-share">💾 Guardar copia (compartir)</button><button class="btn sec" data-act="export">⬇️ Descargar archivo</button><button class="btn sec" data-act="import-file">⬆️ Importar datos</button></div>
    <p class="muted">"Guardar copia" abre el menú de compartir del móvil: elígete Drive, WhatsApp o el correo. Recomendado: una vez por semana.</p>
    <input type="file" id="file" accept=".json,application/json" hidden>
    <button class="btn danger sm mt" data-act="reset">Borrar todos los datos</button></div>
  <p class="muted center">TupperFit · v1.0 · Las estimaciones no sustituyen el consejo de un profesional sanitario.</p>`;
}

// ───────── ventana "añadir comida" ─────────
function openAdd(ctx) {
  M = { ...ctx, tab: 'lib', selId: null, qty: 1 };
  S.q = ''; S.filter = 'all';
  renderAdd();
}
const mealSelect = id => `<select id="${id}">${MEALS.map(([k, n]) => `<option value="${k}" ${M.meal === k ? 'selected' : ''}>${n}</option>`).join('')}</select>`;

function renderAdd() {
  const title = M.target === 'plan' ? `Planificar · ${fmtDate(M.date, { weekday: 'long', day: 'numeric' })}` : 'Añadir comida';
  let h = `<div class="hd"><h2>${title}</h2><button class="icon" data-act="close">✕</button></div>
    <div class="seg"><button class="${M.tab === 'lib' ? 'on' : ''}" data-act="mtab" data-k="lib">Mis alimentos</button><button class="${M.tab === 'new' ? 'on' : ''}" data-act="mtab" data-k="new">Nuevo</button><button data-act="recipe-from-add">🍳 Receta</button><button class="${M.tab === 'free' ? 'on' : ''}" data-act="mtab" data-k="free">🎉 Libre</button></div>
    <div class="row wrap" style="margin-bottom:8px"><button class="btn sm sec" data-act="scan">📷 Escanear código</button><button class="btn sm sec" data-act="voice-add">🎤 Dictar</button></div><div id="m-day" class="preview"></div>`;
  if (M.tab === 'lib') {
    const f = db.foods.find(x => x.id === M.selId);
    h += `<div class="field"><input type="search" id="mq" placeholder="Buscar…" value="${esc(S.q)}"></div>${chipsHtml()}<div id="mlist" style="max-height:34vh;overflow-y:auto">${foodListHtml(M.selId)}</div>`;
    if (f) {
      h += `<div class="card" style="margin-top:10px"><b>${esc(f.name)}</b><div class="field mt"><label>${f.unit === '100g' ? 'Los valores son por 100 g: indica el peso real que has comido' : '¿Cuánto has comido?'}</label><div class="row"><input type="number" inputmode="decimal" id="m-qty" data-live="lib" value="${M.qty}" step="any"><select id="m-mode" data-live="lib" style="width:auto">${modeOpts(f).map(([k, l]) => `<option value="${k}" ${M.mode === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div><div class="field"><label>Comida</label>${mealSelect('m-meal')}</div>${f.ingredients ? `<div class="muted" style="font-size:.8rem">🍳 Plato completo (${r1(f.servings)} ${f.servings === 1 ? 'ración' : 'raciones'}): ${f.ingredients.map(i => `${esc(i.name)} ${ingQty(i)}`).join(' · ')}</div>` : ''}<label class="row" style="color:var(--text)"><input type="checkbox" id="m-free" style="width:auto"> 🎉 Comida libre (fuera de plan)</label><div id="m-prev" class="preview"></div><button class="btn block" data-act="add-confirm">Añadir</button></div>`;
    }
  } else if (M.tab === 'free') h += freeForm();
  else h += foodForm(M.pre || { name: '', type: 'producto', unit: '100g', kcal: '', p: '', c: '', f: '' }, true);
  openModal(h);
  if (M.tab === 'lib') updatePreview(); else if (M.tab === 'new') updateFormPreview(); else updDay(null);
}

const FREE_PRESETS = [['Pizza (½ pizza grande)', 900, 38, 100, 36], ['Hamburguesa con patatas', 1000, 40, 90, 50], ['Menú de restaurante', 1100, 45, 95, 55], ['Tapas / raciones', 800, 35, 50, 48], ['Postre / helado', 350, 5, 45, 16], ['Picoteo / chocolatina', 250, 3, 30, 13], ['Caña de cerveza', 90, 1, 7, 0], ['Copa de vino', 125, 0, 4, 0]];
function freeForm() {
  return `<p class="muted">Para una comida fuera de plan. Cuenta en tus calorías reales, pero no se considera un fallo en el balance semanal. Elige una estimación o escribe la tuya (son valores orientativos).</p>
  <div class="chips" style="flex-wrap:wrap">${FREE_PRESETS.map((x, i) => `<button class="chip" data-act="fr-preset" data-i="${i}">${x[0]}</button>`).join('')}</div>
  <div class="field"><label>¿Qué has comido?</label><input type="text" id="fr-name" placeholder="p. ej. Cena con amigos"></div>
  <div class="grid4"><div class="field"><label>kcal</label><input type="number" inputmode="decimal" id="fr-kcal" step="any"></div><div class="field"><label>Prot. (g)</label><input type="number" inputmode="decimal" id="fr-p" step="any"></div><div class="field"><label>Hidr. (g)</label><input type="number" inputmode="decimal" id="fr-c" step="any"></div><div class="field"><label>Grasas (g)</label><input type="number" inputmode="decimal" id="fr-f" step="any"></div></div>
  <div class="field"><label>Comida</label>${mealSelect('m-meal')}</div><button class="btn block" data-act="free-confirm">Añadir comida libre</button>`;
}
function foodForm(f, withQty) {
  return `<p class="muted">Introduce la información nutricional de la etiqueta. Si dejas las kcal vacías, se calculan a partir de las macros.</p>
  <div class="field"><label>Nombre</label><input type="text" id="f-name" value="${esc(f.name)}" placeholder="p. ej. Pollo al curry con arroz"></div>
  <div class="grid2"><div class="field"><label>Tipo</label><select id="f-type">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}" ${f.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
  <div class="field"><label>Los valores son…</label><select id="f-unit" data-live="form"><option value="100g" ${f.unit === '100g' ? 'selected' : ''}>por 100 g</option><option value="racion" ${f.unit === 'racion' ? 'selected' : ''}>por ración / tupper</option></select></div></div>
  <div class="grid4"><div class="field"><label>kcal</label><input type="number" inputmode="decimal" id="f-kcal" data-live="form" value="${f.kcal}" step="any"></div><div class="field"><label>Prot. (g)</label><input type="number" inputmode="decimal" id="f-p" data-live="form" value="${f.p}" step="any"></div><div class="field"><label>Hidr. (g)</label><input type="number" inputmode="decimal" id="f-c" data-live="form" value="${f.c}" step="any"></div><div class="field"><label>Grasas (g)</label><input type="number" inputmode="decimal" id="f-f" data-live="form" value="${f.f}" step="any"></div></div>
  <div id="f-check" class="muted"></div>
  <div class="field"><label>Peso de 1 unidad o ración (g) — opcional</label><input type="number" inputmode="decimal" id="f-serv" value="${f.serv || ''}" step="any" placeholder="p. ej. 120 (un plátano) o 350 (un tupper)"></div>
  <p class="muted" style="margin-top:-4px">Con este dato podrás añadirlo luego por unidades o por gramos reales.</p>
  <div class="field"><label>Código de barras — opcional</label><input type="text" inputmode="numeric" id="f-barcode" value="${esc(f.barcode || '')}" placeholder="para reconocerlo al escanear"></div>
  ${withQty ? `<div class="grid2 mt"><div class="field"><label id="f-qtylbl">Cantidad</label><input type="number" inputmode="decimal" id="f-qty" data-live="form" value="${f.unit === 'racion' ? 1 : 100}" step="any"></div><div class="field"><label>Comida</label>${mealSelect('m-meal')}</div></div><div id="m-prev" class="preview"></div>
  <label class="row" style="color:var(--text)"><input type="checkbox" id="f-save" style="width:auto" checked> Guardar en mis alimentos</label>
  <label class="row" style="color:var(--text)"><input type="checkbox" id="f-free" style="width:auto"> 🎉 Comida libre (fuera de plan)</label>
  <button class="btn block mt" data-act="new-confirm">Añadir a ${M.target === 'plan' ? 'plan' : 'hoy'}</button>` : `<label class="row" style="color:var(--text)"><input type="checkbox" id="f-fav" style="width:auto" ${f.fav ? 'checked' : ''}> ⭐ Favorito</label>`}`;
}
function readForm() {
  const p = num($('#f-p').value), c = num($('#f-c').value), f = num($('#f-f').value);
  let kcal = num($('#f-kcal').value); if (!kcal) kcal = calcKcal(p, c, f);
  return { name: $('#f-name').value.trim(), type: $('#f-type').value, unit: $('#f-unit').value, kcal: r1(kcal), p, c, f, serv: num($('#f-serv').value) || 0, barcode: ($('#f-barcode').value.replace(/\D/g, '') || undefined) };
}
function updateFormPreview() {
  const f = readForm(), k = calcKcal(f.p, f.c, f.f), chk = $('#f-check');
  if (chk) chk.innerHTML = mismatch(f) ? `<span class="warnc">⚠️ Las macros suman ${r0(k)} kcal pero indicas ${r0(f.kcal)}. Revisa los datos (puede ser fibra o polioles).</span>` : (f.p || f.c || f.f) ? `Macros ≈ ${r0(k)} kcal` : '';
  const q = $('#f-qty'); if (!q) return;
  const lbl = $('#f-qtylbl'); if (lbl) lbl.textContent = f.unit === '100g' ? 'Cantidad (gramos)' : 'Raciones';
  const m = scale(f, f.unit, num(q.value));
  $('#m-prev').innerHTML = `<b>${r0(m.kcal)} kcal</b> · P ${r1(m.p)} g · C ${r1(m.c)} g · G ${r1(m.f)} g`;
  updDay(m);
}
function updatePreview() {
  const f = db.foods.find(x => x.id === M.selId), q = $('#m-qty'); if (!f || !q) return updDay(null);
  const m = scale(f, f.unit, toNative(f, num(q.value), $('#m-mode').value));
  $('#m-prev').innerHTML = `<b>${r0(m.kcal)} kcal</b> · P ${r1(m.p)} g · C ${r1(m.c)} g · G ${r1(m.f)} g`;
  updDay(m);
}
// Cómo queda el día con lo que estás a punto de añadir
function updDay(m) {
  const el = $('#m-day'); if (!el) return;
  const b = totals(M.target === 'plan' ? getPlan(M.date) : getDay(M.date).entries), t = targets(), x = { kcal: b.kcal + (m?.kcal || 0), p: b.p + (m?.p || 0), c: b.c + (m?.c || 0), f: b.f + (m?.f || 0) };
  const cl = (v, tg) => v > tg * 1.05 ? 'badc' : 'good';
  el.innerHTML = `<div class="muted" style="font-size:.75rem">${m ? 'El día quedaría así' : 'Llevas en este día'}</div><b class="${cl(x.kcal, t.kcal)}">${r0(x.kcal)}</b> / ${r0(t.kcal)} kcal · <span class="${cl(x.p, t.p)}">P ${r0(x.p)}/${r0(t.p)}</span> · <span class="${cl(x.c, t.c)}">C ${r0(x.c)}/${r0(t.c)}</span> · <span class="${cl(x.f, t.f)}">G ${r0(x.f)}/${r0(t.f)}</span>`;
}

function pushEntry(f, qty, meal, free) {
  const e = { id: uid(), meal, name: f.name, qty, unit: f.unit, base: { kcal: f.kcal, p: f.p, c: f.c, f: f.f }, foodId: f.id };
  if (free) e.free = true;
  if (M.target === 'plan') { getPlan(M.date, true).push(e); S.pOpen[M.date] = true; } else getDay(M.date, true).entries.push(e);
}

// ───────── editor de platos con ingredientes ─────────
function openRecipe(f, ctx) {
  R = f ? { id: f.id, name: f.name, servings: f.servings || 1, fav: f.fav, serv: f.serv || 0, ing: f.ingredients.map(i => ingNorm({ ...i, base: { ...i.base } })) } : { id: null, name: '', servings: 1, fav: false, serv: 0, ing: [] };
  R.ctx = ctx || null; renderRecipe();
}
// Un ingrediente guarda la cantidad real (qty: gramos o raciones del alimento) y cómo la quieres ver (mode/disp: gramos, unidades o raciones).
const ingNorm = i => { if (!i.mode) { i.mode = i.unit === '100g' ? 'g' : 'rac'; i.disp = i.qty; } i.serv = i.serv || 0; return i; };
const fromNative = (f, q, mode) => f.unit === '100g' ? (mode === 'ud' && f.serv > 0 ? q / f.serv : q) : (mode === 'g' && f.serv > 0 ? q * f.serv : q);
const ingQty = i => { ingNorm(i); return `${r1(i.disp)} ${i.mode === 'ud' ? (i.disp === 1 ? 'unidad' : 'unidades') : i.mode === 'g' ? 'g' : (i.disp === 1 ? 'ración' : 'raciones')}`; };
const ingLine = i => { const m = scale(i.base, i.unit, i.qty); return `${r0(m.kcal)} kcal · P ${r1(m.p)} · C ${r1(m.c)} · G ${r1(m.f)}`; };
function recipeListHtml() {
  const q = ($('#rq')?.value || '').trim().toLowerCase();
  const l = db.foods.filter(f => !f.ingredients && (!q || f.name.toLowerCase().includes(q))).sort((a, b) => (b.fav - a.fav) || ((b.used || 0) - (a.used || 0)) || a.name.localeCompare(b.name)).slice(0, 25);
  return l.length ? l.map(f => `<div class="food" data-act="r-pick" data-id="${f.id}"><div class="grow"><div class="n">${esc(f.name)}</div><div class="s muted">${f.unit === '100g' ? 'por 100 g' : 'por ración'} · P ${r1(f.p)} C ${r1(f.c)} G ${r1(f.f)}</div></div><b>${r0(f.kcal)}</b></div>`).join('') : '<p class="empty">Sin resultados. Usa "Ingrediente manual".</p>';
}
function renderRecipe() {
  const keep = $('.sheet')?.scrollTop || 0;
  const mi = (id, ph) => `<input type="number" inputmode="decimal" id="${id}" step="any" placeholder="${ph}">`;
  openModal(`<div class="hd"><h2>🍳 ${R.id ? 'Editar plato' : 'Plato con ingredientes'}</h2><button class="icon" data-act="close">✕</button></div>
    <p class="muted">Monta el plato con sus ingredientes y cantidades: las macros se suman solas.</p>
    <div class="field"><label>Nombre del plato</label><input type="text" data-r="name" value="${esc(R.name)}" placeholder="p. ej. Tortitas de avena y claras"></div>
    <h3>Ingredientes</h3>
    ${R.ing.length ? R.ing.map((i, k) => `<div class="entry"><div class="grow"><div class="n">${esc(i.name)}</div><div class="s" id="ri-m-${k}">${ingLine(i)}</div></div><input type="number" inputmode="decimal" step="any" data-ri="1" data-i="${k}" value="${r1(ingNorm(i).disp)}" style="width:76px"><select data-rm="1" data-i="${k}" style="width:auto;max-width:120px">${modeOpts(i).map(([m, l]) => `<option value="${m}" ${i.mode === m ? 'selected' : ''}>${l}</option>`).join('')}</select><button class="icon" data-act="r-del" data-i="${k}">🗑️</button></div>`).join('') : '<p class="empty">Aún no has añadido ingredientes.</p>'}
    <div class="field mt"><label>Añadir ingrediente de tus alimentos</label><input type="search" id="rq" placeholder="Buscar: claras, avena, aceite…"></div>
    <div id="rlist" style="max-height:24vh;overflow-y:auto">${recipeListHtml()}</div>
    <details class="mt"><summary class="muted">＋ Ingrediente manual (por 100 g)</summary><div class="field mt"><input type="text" id="rm-name" placeholder="Nombre (p. ej. Harina de avena)"></div>
      <div class="grid4"><div class="field"><label>kcal</label>${mi('rm-kcal', '')}</div><div class="field"><label>Prot.</label>${mi('rm-p', '')}</div><div class="field"><label>Hidr.</label>${mi('rm-c', '')}</div><div class="field"><label>Grasas</label>${mi('rm-f', '')}</div></div>
      <div class="field"><label>Gramos que lleva el plato</label>${mi('rm-g', '100')}</div><div class="field"><label>Peso de 1 unidad (g) — opcional, para contarlo en unidades</label>${mi('rm-serv', 'p. ej. 60 un huevo')}</div><button class="btn sm sec" data-act="r-manual">Añadir ingrediente</button></details>
    <div class="field mt"><label>¿Cuántas raciones salen de este plato?</label><input type="number" inputmode="decimal" step="any" data-r="servings" value="${R.servings}"></div>
    <div class="field"><label>Peso de 1 ración (g) — opcional</label><input type="number" inputmode="decimal" step="any" data-r="serv" value="${R.serv || ''}" placeholder="para añadirlo por gramos"></div>
    <div id="r-tot" class="preview"></div>
    <div class="row"><button class="btn grow" data-act="r-save">Guardar plato</button>${R.id ? '<button class="btn danger" data-act="food-del-r">Eliminar</button>' : ''}</div>`);
  updateRTot(); $('.sheet').scrollTop = keep;
}
function updateRTot() {
  const t = totals(R.ing), s = R.servings > 0 ? R.servings : 1, el = $('#r-tot'); if (!el) return;
  el.innerHTML = R.ing.length ? `<b>Plato completo:</b> ${r0(t.kcal)} kcal · P ${r1(t.p)} · C ${r1(t.c)} · G ${r1(t.f)}<br><b>Por ración (÷ ${r1(s)}):</b> <b>${r0(t.kcal / s)} kcal</b> · P ${r1(t.p / s)} g · C ${r1(t.c / s)} g · G ${r1(t.f / s)} g` : 'Añade ingredientes para ver el total.';
  R.ing.forEach((i, k) => { const e = $(`#ri-m-${k}`); if (e) e.textContent = ingLine(i); });
}

// ───────── catálogo de nococinomas ─────────
// data/nococinomas.json lo genera scripts/scrape_nococinomas.py (GitHub lo actualiza cada semana).
async function openCatalog() {
  C = { data: null, q: '', sort: 'ratio', maxK: '', minP: '', cat: 'all' };
  openModal('<div class="hd"><h2>🔎 Catálogo nococinomas</h2><button class="icon" data-act="close">✕</button></div><p class="empty">Cargando catálogo…</p>');
  try {
    const r = await fetch('data/nococinomas.json', { cache: 'no-store' }); if (!r.ok) throw 0;
    const d = await r.json(); if (!C) return;
    d.items = d.items.filter(x => !/familiar|\+\s*grandes?\b/i.test(x.name)); d.count = d.items.length; C.data = d;
  } catch (e) { if (C) openModal('<div class="hd"><h2>🔎 Catálogo nococinomas</h2><button class="icon" data-act="close">✕</button></div><p>No se ha podido cargar el catálogo. Ábrela desde la dirección web publicada (no desde el archivo local) y con conexión a internet.</p>'); return; }
  renderCatalog();
}
const perTupper = x => { const k = x.weight / 100; return { kcal: x.kcal * k, p: x.p * k, c: x.c * k, f: x.f * k }; };
function catListHtml() {
  const q = C.q.trim().toLowerCase(), maxK = num(C.maxK), minP = num(C.minP);
  let l = C.data.items.map(x => ({ x, t: perTupper(x) })).filter(({ x, t }) => (!q || x.name.toLowerCase().includes(q)) && (C.cat === 'all' || x.cat === C.cat) && (!maxK || t.kcal <= maxK) && (!minP || t.p >= minP));
  const key = { name: (a, b) => a.x.name.localeCompare(b.x.name), prot: (a, b) => b.t.p - a.t.p, kcal: (a, b) => a.t.kcal - b.t.kcal, ratio: (a, b) => b.t.p / (b.t.kcal || 1) - a.t.p / (a.t.kcal || 1) }[C.sort];
  l.sort(key); const total = l.length; l = l.slice(0, 60);
  if (!l.length) return '<p class="empty">Ningún tupper cumple esos filtros.</p>';
  return `<p class="muted">${total} resultados${total > 60 ? ' (se muestran 60: afina los filtros)' : ''}</p>` + l.map(({ x, t }) => {
    const saved = db.foods.some(f => f.nocId === x.id);
    return `<div class="food"><div class="grow"><div class="n">${esc(x.name)}</div><div class="s muted">${r0(x.weight)} g · P ${r1(t.p)} · C ${r1(t.c)} · G ${r1(t.f)} · <b>${r0(t.p / (t.kcal || 1) * 100)} g P/100 kcal</b></div></div><div class="right"><b>${r0(t.kcal)}</b> kcal<br><button class="btn sm ${saved ? 'ghost' : 'sec'}" data-act="cat-save" data-id="${x.id}">${saved ? '✔ Guardado' : '＋ Guardar'}</button></div></div>`;
  }).join('');
}
function renderCatalog() {
  const cats = [...new Set(C.data.items.map(x => x.cat))].sort();
  openModal(`<div class="hd"><h2>🔎 Catálogo nococinomas</h2><button class="icon" data-act="close">✕</button></div>
    <p class="muted">${C.data.count} tuppers · datos de la web actualizados el ${fmtDate(C.data.updated, { day: 'numeric', month: 'long', year: 'numeric' })}. Los valores son <b>por tupper</b> (calculados con su peso).</p>
    <div class="field"><input type="search" id="cq" data-c="q" placeholder="Buscar: pollo, lentejas, pasta…" value="${esc(C.q)}"></div>
    <div class="grid2"><div class="field"><label>Ordenar por</label><select data-c="sort">${[['ratio', 'Más proteína por kcal'], ['prot', 'Más proteína'], ['kcal', 'Menos calorías'], ['name', 'Nombre']].map(([k, l]) => `<option value="${k}" ${C.sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="field"><label>Categoría</label><select data-c="cat"><option value="all">Todas</option>${cats.map(c => `<option ${C.cat === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
    <div class="field"><label>Máx. kcal por tupper</label><input type="number" inputmode="numeric" data-c="maxK" value="${esc(C.maxK)}" placeholder="p. ej. 450"></div>
    <div class="field"><label>Mín. proteína (g)</label><input type="number" inputmode="numeric" data-c="minP" value="${esc(C.minP)}" placeholder="p. ej. 30"></div></div>
    <div class="row wrap" style="margin-bottom:8px"><button class="btn sm sec" data-act="cat-sync">🔄 Actualizar los que ya tengo guardados</button></div>
    <div id="clist">${catListHtml()}</div>`);
}
const catFood = x => { const t = perTupper(x); return { name: x.name, type: 'tupper', unit: 'racion', kcal: r1(t.kcal), p: r1(t.p), c: r1(t.c), f: r1(t.f), serv: x.weight, nocId: x.id, url: x.url }; };

// ───────── calendario ─────────
let K = null;
function openCal(f) {
  const base = f === 'hoy' ? S.date : f === 'plan' ? S.planWeek : S.weekStart, d = parseD(base);
  K = { f, y: d.getFullYear(), m: d.getMonth() }; renderCal();
}
function renderCal() {
  const first = new Date(K.y, K.m, 1), off = (first.getDay() + 6) % 7, n = new Date(K.y, K.m + 1, 0).getDate(), today = todayS();
  const cur = K.f === 'hoy' ? S.date : K.f === 'plan' ? S.planWeek : S.weekStart;
  let cells = '';
  for (let i = 0; i < off; i++) cells += '<i>.</i>';
  for (let d = 1; d <= n; d++) {
    const date = ds(new Date(K.y, K.m, d)), sel = K.f === 'hoy' ? date === cur : mondayOf(date) === cur;
    const has = K.f === 'plan' ? getPlan(date).length > 0 : getDay(date).entries.length > 0;
    cells += `<button class="${sel ? 'sel' : ''} ${date === today ? 'today' : ''} ${has ? 'has' : ''}" data-act="cal-pick" data-d="${date}">${d}</button>`;
  }
  openModal(`<div class="hd"><h2>📅 Ir a otro día</h2><button class="icon" data-act="close">✕</button></div>
    <div class="daynav"><button data-act="cal-m" data-n="-1">‹</button><div class="t" style="text-transform:capitalize;cursor:default">${new Date(K.y, K.m, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</div><button data-act="cal-m" data-n="1">›</button></div>
    <div class="cal">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(x => `<div class="wd">${x}</div>`).join('')}${cells}</div>
    <p class="muted">El punto marca los días con ${K.f === 'plan' ? 'plan' : 'comidas registradas'}.${K.f !== 'hoy' ? ' Al elegir un día se abre su semana.' : ''}</p>
    <button class="btn sec block mt" data-act="cal-pick" data-d="${today}">Ir a hoy</button>`);
}

// ───────── ejercicio ─────────
function openWorkout() {
  M = { workout: true, date: S.date };
  openModal(`<div class="hd"><h2>💪 Añadir ejercicio</h2><button class="icon" data-act="close">✕</button></div>
    <div class="field"><label>Tipo</label><select id="w-type" data-live="work">${Object.entries(SPORTS).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select></div>
    <div class="grid2"><div class="field"><label>Minutos</label><input type="number" inputmode="numeric" id="w-min" data-live="work" value="30"></div>
    <div class="field"><label>Calorías (opcional)</label><input type="number" inputmode="numeric" id="w-kcal" data-live="work" placeholder="si lo sabes (reloj)"></div></div>
    <div id="w-prev" class="preview"></div><button class="btn block" data-act="work-save">Guardar</button>`);
  updateWork();
}
function updateWork() {
  const t = $('#w-type').value, min = num($('#w-min').value), est = SPORTS[t][1] * latestWeight(S.date) * min / 60, k = num($('#w-kcal').value);
  $('#w-prev').innerHTML = k ? `<b>${r0(k)} kcal</b> (dato tuyo)` : `≈ <b>${r0(est)} kcal</b> estimadas (${SPORTS[t][1]} MET × ${r0(latestWeight(S.date))} kg × ${r1(min / 60)} h). Si tu reloj te da otro dato, escríbelo arriba.`;
}

// ───────── acciones ─────────
const findEntry = (id, where, date) => (where === 'plan' ? getPlan(date || S.date) : getDay(S.date).entries).find(e => e.id === id);

const A = {
  cal: el => openCal(el.dataset.for),
  'cal-m': el => { K.m += +el.dataset.n; if (K.m < 0) { K.m = 11; K.y--; } else if (K.m > 11) { K.m = 0; K.y++; } renderCal(); },
  'cal-pick': el => {
    const d = el.dataset.d; if (K.f === 'hoy') S.date = d; else if (K.f === 'plan') S.planWeek = mondayOf(d); else S.weekStart = mondayOf(d);
    closeModal(); render(); window.scrollTo(0, 0);
  },
  wrange: el => { S.wRange = el.dataset.k; render(); },
  'add-work': () => openWorkout(),
  'work-save': () => {
    const t = $('#w-type').value, min = num($('#w-min').value); if (min <= 0) return toast('Indica los minutos');
    const given = num($('#w-kcal').value), est = SPORTS[t][1] * latestWeight(M.date) * min / 60;
    getDay(M.date, true).workouts = [...workouts(getDay(M.date)), { id: uid(), type: t, min, kcal: r0(given || est), est: !given }];
    save(); closeModal(); render(); toast('Ejercicio guardado ✔');
  },
  'del-work': el => { const d = getDay(S.date, true); d.workouts = workouts(d).filter(k => k.id !== el.dataset.id); save(); render(); },
  pday: el => { const d = el.dataset.date, es = getPlan(d); S.pOpen[d] = !(S.pOpen[d] ?? es.length === 0); render(); },
  pall: el => { for (let i = 0; i < 7; i++) S.pOpen[addDays(S.planWeek, i)] = el.dataset.k === 'open'; render(); },
  'free-day': el => { const d = el.dataset.date; if (db.freeDays[d]) delete db.freeDays[d]; else db.freeDays[d] = true; save(); render(); },
  'fr-preset': el => { const x = FREE_PRESETS[+el.dataset.i]; $('#fr-name').value = x[0]; $('#fr-kcal').value = x[1]; $('#fr-p').value = x[2]; $('#fr-c').value = x[3]; $('#fr-f').value = x[4]; },
  'free-confirm': () => {
    const p = num($('#fr-p').value), c = num($('#fr-c').value), f = num($('#fr-f').value), k = num($('#fr-kcal').value) || calcKcal(p, c, f), name = $('#fr-name').value.trim();
    if (!name) return toast('Dile qué has comido'); if (!k) return toast('Indica las kcal (aunque sea aproximado)');
    pushEntry({ id: null, name, unit: 'racion', kcal: r1(k), p, c, f }, 1, $('#m-meal').value, true); save(); closeModal(); render(); toast('Comida libre registrada 🎉');
  },
  'food-menu': () => { M = null; foodMenu(); },
  tab: el => { S.tab = el.dataset.tab; render(); window.scrollTo(0, 0); },
  day: el => { S.date = addDays(S.date, +el.dataset.n); render(); },
  today: () => { S.date = todayS(); render(); },
  pweek: el => { S.planWeek = addDays(S.planWeek, 7 * el.dataset.n); render(); },
  wweek: el => { S.weekStart = addDays(S.weekStart, 7 * el.dataset.n); render(); },
  close: closeModal,
  add: el => openAdd({ target: el.dataset.target, date: el.dataset.date || S.date, meal: el.dataset.meal }),
  mtab: el => { M.tab = el.dataset.k; renderAdd(); },
  filter: el => { S.filter = el.dataset.k; if (M) renderAdd(); else render(); },
  pick: el => { M.selId = el.dataset.id; const f = db.foods.find(x => x.id === M.selId); M.mode = defMode(f); M.qty = defQty(f, M.mode); renderAdd(); },
  fav: el => { const f = db.foods.find(x => x.id === el.dataset.id); f.fav = !f.fav; save(); if (M) { const sc = $('#mlist').scrollTop; renderAdd(); $('#mlist').scrollTop = sc; } else render(); },
  'add-confirm': () => {
    const f = db.foods.find(x => x.id === M.selId), qty = f ? toNative(f, num($('#m-qty').value), $('#m-mode').value) : 0; if (!f || qty <= 0) return toast('Indica una cantidad');
    f.used = Date.now(); pushEntry(f, qty, $('#m-meal').value, $('#m-free').checked); save(); closeModal(); render(); toast('Añadido ✔');
  },
  'new-confirm': () => {
    const f = readForm(), qty = num($('#f-qty').value);
    if (!f.name) return toast('Ponle un nombre'); if (qty <= 0) return toast('Indica una cantidad'); if (!f.kcal) return toast('Introduce kcal o macros');
    let food = { id: uid(), fav: false, used: Date.now(), ...f };
    if ($('#f-save').checked) db.foods.push(food);
    pushEntry(food, qty, $('#m-meal').value, $('#f-free').checked); save(); closeModal(); render(); toast('Añadido ✔');
  },
  'del-entry': (el, ev) => {
    ev.stopPropagation(); const { id, where, date } = el.dataset;
    if (where === 'plan') db.plan[date] = getPlan(date).filter(e => e.id !== id); else getDay(S.date, true).entries = getDay(S.date).entries.filter(e => e.id !== id);
    save(); render();
  },
  'edit-entry': el => {
    const { id, where, date } = el.dataset, e = findEntry(id, where, date); if (!e) return;
    M = { target: where, date: date || S.date, meal: e.meal, editId: id };
    openModal(`<div class="hd"><h2>${esc(e.name)}</h2><button class="icon" data-act="close">✕</button></div><div class="grid2"><div class="field"><label>${e.unit === '100g' ? 'Gramos' : 'Raciones'}</label><input type="number" inputmode="decimal" id="e-qty" value="${e.qty}" step="any"></div><div class="field"><label>Comida</label>${mealSelect('m-meal')}</div></div><label class="row" style="color:var(--text)"><input type="checkbox" id="e-free" style="width:auto" ${e.free ? 'checked' : ''}> 🎉 Comida libre (fuera de plan)</label><button class="btn block mt" data-act="edit-save">Guardar</button>`);
  },
  'edit-save': () => {
    const e = findEntry(M.editId, M.target, M.date), q = num($('#e-qty').value); if (!e || q <= 0) return toast('Cantidad no válida');
    e.qty = q; e.meal = $('#m-meal').value; if ($('#e-free').checked) e.free = true; else delete e.free; save(); closeModal(); render();
  },
  'plan-reg': el => { regPlan(getPlan(S.date).find(e => e.id === el.dataset.id)); save(); render(); },
  'plan-reg-all': () => { getPlan(S.date).filter(e => !e.done).forEach(regPlan); save(); render(); toast('Plan registrado ✔'); },
  'plan-dup': el => { const d = el.dataset.date; db.plan[addDays(d, 1)] = [...getPlan(addDays(d, 1)), ...getPlan(d).map(e => ({ ...e, id: uid(), done: false }))]; save(); render(); toast('Duplicado al día siguiente'); },
  'plan-copy-prev': () => {
    const prev = addDays(S.planWeek, -7); let n = 0;
    for (let i = 0; i < 7; i++) { const src = getPlan(addDays(prev, i)); if (src.length) { db.plan[addDays(S.planWeek, i)] = src.map(e => ({ ...e, id: uid(), done: false })); if (db.freeDays[addDays(prev, i)]) db.freeDays[addDays(S.planWeek, i)] = true; n++; } }
    save(); render(); toast(n ? 'Plan copiado ✔' : 'La semana anterior no tenía plan');
  },
  'plan-from-log': () => { copyLogToPlan(addDays(S.planWeek, -7), S.planWeek); },
  'plan-next-from-week': () => { const next = addDays(S.weekStart, 7); copyLogToPlan(S.weekStart, next); S.planWeek = next; S.tab = 'plan'; render(); },
  'new-recipe': () => { M = null; openRecipe(null, null); },
  'recipe-from-add': () => { const c = { target: M.target, date: M.date, meal: M.meal }; openRecipe(null, c); },
  'r-pick': el => { const f = db.foods.find(x => x.id === el.dataset.id); const ing = { id: uid(), name: f.name, unit: f.unit, serv: f.serv || 0, base: { kcal: f.kcal, p: f.p, c: f.c, f: f.f } }; ing.mode = defMode(ing); ing.disp = defQty(ing, ing.mode); ing.qty = toNative(ing, ing.disp, ing.mode); R.ing.push(ing); renderRecipe(); },
  'r-del': el => { R.ing.splice(+el.dataset.i, 1); renderRecipe(); },
  'r-manual': () => {
    const name = $('#rm-name').value.trim(), p = num($('#rm-p').value), c = num($('#rm-c').value), f = num($('#rm-f').value); let k = num($('#rm-kcal').value) || calcKcal(p, c, f);
    if (!name) return toast('Ponle nombre al ingrediente'); if (!k) return toast('Indica kcal o macros');
    const g = num($('#rm-g').value) || 100; R.ing.push({ id: uid(), name, unit: '100g', serv: num($('#rm-serv').value) || 0, qty: g, mode: 'g', disp: g, base: { kcal: r1(k), p, c, f } }); renderRecipe();
  },
  'r-save': () => {
    const s = R.servings > 0 ? R.servings : 0; if (!R.name.trim()) return toast('Ponle un nombre al plato'); if (!R.ing.length) return toast('Añade algún ingrediente'); if (!s) return toast('Indica cuántas raciones salen');
    const t = totals(R.ing), v = { name: R.name.trim(), type: 'casero', unit: 'racion', kcal: r1(t.kcal / s), p: r1(t.p / s), c: r1(t.c / s), f: r1(t.f / s), serv: R.serv || 0, servings: s, ingredients: R.ing.map(({ id, name, unit, qty, base, serv, mode, disp }) => ({ id, name, unit, qty, base, serv, mode, disp })) };
    let food = R.id && db.foods.find(x => x.id === R.id);
    if (food) Object.assign(food, v); else { food = { id: uid(), fav: false, used: 0, ...v }; db.foods.push(food); }
    save(); const ctx = R.ctx; R = null;
    if (ctx) { M = { ...ctx, tab: 'lib', selId: food.id, mode: 'rac', qty: 1 }; renderAdd(); } else { closeModal(); render(); }
    toast('Plato guardado ✔');
  },
  'food-del-r': () => { if (confirm('¿Eliminar este plato? Los días ya registrados no cambian.')) { db.foods = db.foods.filter(x => x.id !== R.id); save(); closeModal(); render(); } },
  catalog: () => openCatalog(),
  'cat-save': el => {
    const x = C.data.items.find(i => String(i.id) === el.dataset.id), ex = db.foods.find(f => f.nocId === x.id);
    if (ex) { Object.assign(ex, catFood(x)); toast('Ya lo tenías: datos actualizados'); } else { db.foods.push({ id: uid(), fav: false, used: 0, ...catFood(x) }); toast('Guardado en tus alimentos ✔'); }
    save(); const sc = $('.sheet').scrollTop; $('#clist').innerHTML = catListHtml(); $('.sheet').scrollTop = sc;
  },
  'cat-sync': () => {
    let n = 0; db.foods.filter(f => f.nocId).forEach(f => { const x = C.data.items.find(i => i.id === f.nocId); if (x) { Object.assign(f, catFood(x)); n++; } });
    save(); toast(n ? `${n} tuppers actualizados ✔` : 'No tienes tuppers del catálogo guardados');
  },
  'new-food': () => { M = null; openModal(`<div class="hd"><h2>Nuevo alimento</h2><button class="icon" data-act="close">✕</button></div>${foodForm({ name: '', type: 'tupper', unit: 'racion', kcal: '', p: '', c: '', f: '' }, false)}<button class="btn block mt" data-act="food-save">Guardar</button>`); updateFormPreview(); },
  'edit-food': el => {
    const f = db.foods.find(x => x.id === el.dataset.id); if (f.ingredients) { M = null; return openRecipe(f, null); } M = { foodId: f.id };
    openModal(`<div class="hd"><h2>Editar alimento</h2><button class="icon" data-act="close">✕</button></div>${foodForm(f, false)}<div class="row mt"><button class="btn grow" data-act="food-save">Guardar</button><button class="btn danger" data-act="food-del">Eliminar</button></div>`); updateFormPreview();
  },
  'food-save': () => {
    const f = readForm(); if (!f.name) return toast('Ponle un nombre'); if (!f.kcal) return toast('Introduce kcal o macros');
    f.fav = $('#f-fav').checked;
    if (M?.foodId) Object.assign(db.foods.find(x => x.id === M.foodId), f); else db.foods.push({ id: uid(), used: 0, ...f });
    save(); closeModal(); render(); toast('Guardado ✔');
  },
  'food-del': () => { if (confirm('¿Eliminar este alimento? Los días ya registrados no cambian.')) { db.foods = db.foods.filter(x => x.id !== M.foodId); save(); closeModal(); render(); } },
  import: () => { M = null; openModal(`<div class="hd"><h2>Importar varios</h2><button class="icon" data-act="close">✕</button></div><p class="muted">Pega una línea por plato con este formato (separado por <b>;</b> o tabulador):<br><b>Nombre; kcal; proteínas; hidratos; grasas</b><br>Ejemplo: <i>Pollo al curry con arroz; 420; 38; 40; 11</i><br>Se guardan como "Tupper" por ración.</p><textarea id="imp" placeholder="Pollo al curry con arroz; 420; 38; 40; 11"></textarea><button class="btn block mt" data-act="import-go">Importar</button>`); },
  'import-go': () => {
    let n = 0;
    $('#imp').value.split('\n').forEach(line => {
      const x = line.split(/[;\t|]/).map(s => s.trim()); if (x.length < 5 || !x[0]) return;
      const [name, k, p, c, f] = [x[0], num(x[1]), num(x[2]), num(x[3]), num(x[4])]; if (!k && !p && !c && !f) return;
      const ex = db.foods.find(y => y.name.toLowerCase() === name.toLowerCase());
      if (ex) Object.assign(ex, { kcal: k, p, c, f }); else db.foods.push({ id: uid(), name, type: 'tupper', unit: 'racion', kcal: k, p, c, f, fav: false, used: 0 });
      n++;
    });
    save(); closeModal(); render(); toast(n ? `${n} alimentos importados ✔` : 'No se reconoció ninguna línea');
  },
  'use-sug': () => { db.profile.kcal = Math.round(tdee() - db.profile.goalKgWeek * 1100); db.profile.configured = true; save(); render(); },
  export: () => doBackup(false),
  'backup-share': () => doBackup(true),
  'import-file': () => $('#file').click(),
  reset: () => { if (confirm('¿Borrar TODOS tus datos? No se puede deshacer.') && confirm('Seguro del todo. ¿Borrar?')) { localStorage.removeItem(KEY); db = load(); render(); toast('Datos borrados'); } },
};
function regPlan(e) {
  if (!e || e.done) return;
  getDay(S.date, true).entries.push({ ...e, id: uid(), done: undefined }); e.done = true;
}
function copyLogToPlan(fromMon, toMon) {
  let n = 0;
  for (let i = 0; i < 7; i++) { const src = getDay(addDays(fromMon, i)).entries; if (src.length) { db.plan[addDays(toMon, i)] = src.map(e => ({ ...e, id: uid(), done: false })); if (db.freeDays[addDays(fromMon, i)]) db.freeDays[addDays(toMon, i)] = true; n++; } }
  save(); render(); toast(n ? 'Plan creado ✔ Ajústalo a tu gusto' : 'No había comidas registradas en esa semana');
}

// ───────── eventos ─────────
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-act]'); if (el && A[el.dataset.act]) A[el.dataset.act](el, ev);
  else if (ev.target.id === 'modal') closeModal();
});
$('#nav').addEventListener('click', ev => { const b = ev.target.closest('button'); if (b) A.tab(b); });
document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.id === 'q') { S.q = t.value; $('#foodlist').innerHTML = foodListHtml(); }
  else if (t.id === 'mq') { S.q = t.value; $('#mlist').innerHTML = foodListHtml(M.selId); }
  else if (t.dataset.live === 'lib') { M.qty = num($('#m-qty').value); M.mode = $('#m-mode').value; updatePreview(); }
  else if (t.dataset.live === 'form') updateFormPreview();
  else if (t.dataset.live === 'work') updateWork();
  else if (t.dataset.c && C) { C[t.dataset.c] = t.value; $('#clist').innerHTML = catListHtml(); }
  else if (t.dataset.r) { R[t.dataset.r] = t.dataset.r === 'name' ? t.value : num(t.value); updateRTot(); }
  else if (t.dataset.ri) { const g = R.ing[+t.dataset.i]; g.disp = num(t.value); g.qty = toNative(g, g.disp, g.mode); updateRTot(); }
  else if (t.dataset.rm) { const g = R.ing[+t.dataset.i], row = t.closest('.entry'); g.mode = t.value; g.disp = r1(fromNative(g, g.qty, g.mode)); row.querySelector('[data-ri]').value = g.disp; updateRTot(); }
  else if (t.id === 'rq') $('#rlist').innerHTML = recipeListHtml();
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.dataset.day) {
    const d = getDay(S.date, true), k = t.dataset.day; d[k] = k === 'note' ? t.value : (t.value === '' ? null : num(t.value)); save(); render();
  } else if (t.dataset.prof) {
    const k = t.dataset.prof; db.profile[k] = k === 'sex' ? t.value : num(t.value); db.profile.configured = true; save(); render();
  } else if (t.id === 'file' && t.files[0]) {
    const rd = new FileReader();
    rd.onload = () => { try { const d = JSON.parse(rd.result); if (!d.foods || !d.log) throw 0; if (confirm('Esto reemplazará los datos actuales por los del archivo. ¿Continuar?')) { localStorage.setItem(KEY, JSON.stringify(d)); db = load(); render(); toast('Datos importados ✔'); } } catch (e) { toast('Archivo no válido'); } };
    rd.readAsText(t.files[0]);
  }
});

render();
askPersist();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
