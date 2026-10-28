// Model danych, Maturité, sortowanie i statystyki. Bez zależności od przeglądarki (testowalne w Node).

export const COLUMNS = [
  'id', 'status_fiche', 'created_at', 'updated_at', 'locked_fields',
  'name', 'producer', 'vintage', 'is_nv', 'bottle_size_ml', 'current_quantity',
  'purchase_price', 'purchase_currency', 'personal_score', 'personal_notes', 'photo_file',
  'country', 'region', 'subregion', 'appellation', 'color', 'grapes', 'description_fr',
  'drinking_window_start', 'drinking_window_end', 'maturity_confidence', 'maturity_basis',
  'maturity_reviewed_at', 'claude_note', 'market_price', 'market_price_sources', 'market_price_date',
  'vivino_score', 'vivino_count', 'vivino_basis', 'vivino_date'
];

export const USER_FIELDS = [
  'name', 'producer', 'vintage', 'is_nv', 'bottle_size_ml',
  'purchase_price', 'purchase_currency', 'personal_score', 'personal_notes'
];

// Kolumny Claude, które użytkownik może poprawić ręcznie; poprawka trafia do locked_fields.
export const CLAUDE_EDITABLE = [
  'country', 'region', 'subregion', 'appellation', 'color', 'grapes', 'description_fr',
  'drinking_window_start', 'drinking_window_end'
];

export const NUMERIC_FIELDS = ['vintage', 'bottle_size_ml', 'current_quantity', 'purchase_price',
  'personal_score', 'drinking_window_start', 'drinking_window_end', 'market_price', 'vivino_score', 'vivino_count'];

export const COLORS = {
  rouge: { label: 'Rouge', tint: '#B8475E' },
  blanc: { label: 'Blanc', tint: '#E3D39A' },
  'rosé': { label: 'Rosé', tint: '#EBA6B0' },
  orange: { label: 'Orange', tint: '#E8A15C' },
  bulles: { label: 'Bulles', tint: '#F0DD8E' }
};
export const UNKNOWN_TINT = '#6E5878';

export const SIZES = [
  { ml: 375, label: '375 ml' },
  { ml: 500, label: '500 ml' },
  { ml: 750, label: '750 ml' },
  { ml: 1500, label: '1,5 l (magnum)' },
  { ml: 3000, label: '3 l' }
];

export const MAT_LABELS = {
  0: 'Maturité à estimer',
  1: 'Trop jeune',
  2: 'À attendre',
  3: 'Approche',
  4: 'À boire',
  5: 'À boire sans trop attendre'
};

export function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(',', '.').trim());
  return Number.isFinite(n) ? n : null;
}

export function str(v) {
  return v === null || v === undefined ? '' : String(v).trim();
}

// Ocena 1-5 liczona z okna picia i bieżącego roku (rozdział 6 specyfikacji).
export function maturity(w, year = new Date().getFullYear()) {
  const S = num(w.drinking_window_start);
  const E = num(w.drinking_window_end);
  if (!S || !E || E < S) return { score: 0, label: MAT_LABELS[0], beyond: false, rank: 0 };
  let score;
  if (year > E) return { score: 5, label: 'Au-delà de la fenêtre', beyond: true, rank: 6 };
  if (year < S - 2) score = 1;
  else if (year < S) score = 2;
  else {
    const n = E - S + 1;
    if (n <= 2) score = year === E ? 5 : 4;
    else {
      const t = Math.round(n / 3);
      score = year < S + t ? 3 : year < S + 2 * t ? 4 : 5;
    }
  }
  return { score, label: MAT_LABELS[score], beyond: false, rank: score };
}

export function isNV(w) {
  return str(w.is_nv).toLowerCase() === 'oui';
}

export function vintageLabel(w) {
  if (isNV(w)) return 'NV';
  const v = num(w.vintage);
  return v ? String(v) : '';
}

export function qty(w) {
  return Math.max(0, num(w.current_quantity) || 0);
}

export function fmtScore(v) {
  const n = num(v);
  return n === null ? '' : n.toFixed(1).replace('.', ',');
}

export function fmtPrice(v) {
  const n = num(v);
  return n === null ? '' : n.toFixed(2).replace('.', ',');
}

export function sizeLabel(w) {
  const ml = num(w.bottle_size_ml) || 750;
  const s = SIZES.find((x) => x.ml === ml);
  return s ? s.label : ml + ' ml';
}

// Contenance seulement si elle n'est pas standard (750 ml).
export function sizeNote(w) {
  const ml = num(w.bottle_size_ml) || 750;
  return ml === 750 ? '' : sizeLabel(w);
}

export function colorInfo(w) {
  return COLORS[str(w.color).toLowerCase()] || null;
}

export function displayName(w) {
  return str(w.name) || str(w.producer) || 'Vin à identifier';
}

// Ligne secondaire: région · appellation millésime
export function subtitle(w) {
  const parts = [];
  if (str(w.region)) parts.push(str(w.region));
  const app = str(w.appellation);
  const v = vintageLabel(w);
  const second = [app, v].filter(Boolean).join(' ');
  if (second) parts.push(second);
  if (str(w.name) && str(w.producer) && str(w.producer) !== str(w.name)) parts.unshift(str(w.producer));
  return parts.join(' · ');
}

const isEmpty = (x) => x === null || x === undefined || x === '' || x === 0;

export function sortWines(list, key, year) {
  const withM = list.map((w) => ({ w, m: maturity(w, year) }));
  const byName = (a, b) => displayName(a.w).localeCompare(displayName(b.w), 'fr');
  const cmp = {
    region: (a, b) => (isEmpty(str(a.w.region)) - isEmpty(str(b.w.region)))
      || str(a.w.region).localeCompare(str(b.w.region), 'fr') || byName(a, b),
    producer: (a, b) => (isEmpty(str(a.w.producer)) - isEmpty(str(b.w.producer)))
      || str(a.w.producer).localeCompare(str(b.w.producer), 'fr') || byName(a, b)
      || (num(a.w.vintage) || 0) - (num(b.w.vintage) || 0),
    appellation: (a, b) => (isEmpty(str(a.w.appellation)) - isEmpty(str(b.w.appellation)))
      || str(a.w.appellation).localeCompare(str(b.w.appellation), 'fr')
      || str(a.w.producer).localeCompare(str(b.w.producer), 'fr') || byName(a, b),
    score: (a, b) => (isEmpty(num(a.w.personal_score)) - isEmpty(num(b.w.personal_score)))
      || (num(b.w.personal_score) || 0) - (num(a.w.personal_score) || 0) || byName(a, b),
    maturity: (a, b) => (isEmpty(a.m.rank) - isEmpty(b.m.rank)) || b.m.rank - a.m.rank || byName(a, b),
    vintage: (a, b) => {
      const va = isNV(a.w) ? null : num(a.w.vintage);
      const vb = isNV(b.w) ? null : num(b.w.vintage);
      return (isEmpty(va) - isEmpty(vb)) || (va || 0) - (vb || 0) || byName(a, b);
    }
  }[key] || byName;
  return withM.sort(cmp).map((x) => x.w);
}

export function normalize(s) {
  return str(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

export function matchesQuery(w, q) {
  const n = normalize(q);
  if (!n) return true;
  const hay = normalize([w.name, w.producer, w.appellation, w.region, w.country, w.grapes, w.vintage].join(' '));
  return n.split(' ').every((part) => hay.includes(part));
}

// Ten sam wino: producent + nazwa + rocznik (lub NV) + pojemność.
export function duplicateKey(w) {
  return [normalize(w.producer), normalize(w.name), isNV(w) ? 'nv' : String(num(w.vintage) || ''),
    String(num(w.bottle_size_ml) || 750)].join('|');
}

function countBy(list, keyFn) {
  const m = new Map();
  list.forEach((w) => {
    const k = keyFn(w);
    m.set(k, (m.get(k) || 0) + qty(w));
  });
  return m;
}

export function stats(list, year) {
  const inStock = list.filter((w) => qty(w) > 0);
  const bottles = inStock.reduce((s, w) => s + qty(w), 0);
  const soon = inStock.filter((w) => maturity(w, year).rank >= 5).reduce((s, w) => s + qty(w), 0);
  const toRows = (m, unknownLabel) => [...m.entries()]
    .map(([k, n]) => ({ label: k || unknownLabel, n, unknown: !k }))
    .sort((a, b) => (a.unknown - b.unknown) || b.n - a.n);
  const countries = toRows(countBy(inStock, (w) => str(w.country)), 'Non renseigné');
  const regionCountry = new Map();
  inStock.forEach((w) => { if (str(w.region) && !regionCountry.has(str(w.region))) regionCountry.set(str(w.region), str(w.country)); });
  let regions = toRows(countBy(inStock, (w) => str(w.region)), 'Non renseigné')
    .map((r) => ({ ...r, country: r.unknown ? '' : regionCountry.get(r.label) || '' }));
  if (regions.length > 6) {
    const known = regions.filter((r) => !r.unknown);
    const top = known.slice(0, 5);
    const rest = regions.filter((r) => !top.includes(r)).reduce((s, r) => s + r.n, 0);
    regions = [...top, { label: 'Autres', n: rest, unknown: true }];
  }
  const colorMap = countBy(inStock, (w) => str(w.color).toLowerCase());
  const colors = [...Object.keys(COLORS).map((k) => ({ key: k, label: COLORS[k].label, tint: COLORS[k].tint, n: colorMap.get(k) || 0 })),
    { key: '', label: 'Non renseigné', tint: UNKNOWN_TINT, n: colorMap.get('') || 0 }].filter((c) => c.n > 0);
  const matMap = new Map();
  inStock.forEach((w) => {
    const m = maturity(w, year);
    const k = m.beyond ? 'beyond' : String(m.score);
    matMap.set(k, (matMap.get(k) || 0) + qty(w));
  });
  const maturityRows = [
    ['1', 'Trop jeune', '#5A3F63'], ['2', 'À attendre', '#7C5878'], ['3', 'Approche', '#A9768A'],
    ['4', 'À boire', '#CC9390'], ['5', 'Sans trop attendre', '#E4AE93'], ['beyond', 'Au-delà de la fenêtre', '#F0C27A'],
    ['0', 'À estimer', '#6E5878']
  ].map(([k, label, c]) => ({ label, c, n: matMap.get(k) || 0 })).filter((r) => r.n > 0);
  // Wartość piwnicy: cena rynkowa, a gdy jej brak, cena zakupu.
  let value = 0, valued = 0;
  inStock.forEach((w) => {
    const p = num(w.market_price) || num(w.purchase_price);
    if (p) { value += p * qty(w); valued += qty(w); }
  });
  return { bottles, wines: inStock.length, soon, countries, regions, colors, maturity: maturityRows, value: Math.round(value), valued };
}

// Podział 12 butelek na półce według kolorów (metoda największej reszty).
export function shelf(list, slots = 12) {
  const inStock = list.filter((w) => qty(w) > 0);
  const total = inStock.reduce((s, w) => s + qty(w), 0);
  if (!total) return Array.from({ length: slots }, () => ({ tint: null }));
  const m = countBy(inStock, (w) => str(w.color).toLowerCase());
  const keys = [...Object.keys(COLORS), ''];
  const raw = keys.map((k) => ({ k, exact: ((m.get(k) || 0) / total) * slots }));
  raw.forEach((r) => { r.n = Math.floor(r.exact); });
  let left = slots - raw.reduce((s, r) => s + r.n, 0);
  [...raw].sort((a, b) => (b.exact - b.n) - (a.exact - a.n)).forEach((r) => {
    if (left > 0 && r.exact > r.n) { r.n += 1; left -= 1; }
  });
  const out = [];
  raw.forEach((r) => {
    for (let i = 0; i < r.n; i++) out.push({ tint: r.k ? COLORS[r.k].tint : UNKNOWN_TINT });
  });
  return out;
}

export function rowToWine(row) {
  const w = {};
  COLUMNS.forEach((c, i) => {
    const v = row[i];
    w[c] = v === undefined || v === null ? '' : v;
  });
  return w;
}

export function wineToRow(w) {
  return COLUMNS.map((c) => {
    const v = w[c];
    if (v === undefined || v === null) return '';
    if (NUMERIC_FIELDS.includes(c)) {
      const n = num(v);
      return n === null ? '' : n;
    }
    return String(v);
  });
}

export function lockedSet(w) {
  return new Set(str(w.locked_fields).split(',').map((s) => s.trim()).filter(Boolean));
}

export function nowIso() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
