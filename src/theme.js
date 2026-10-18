/*
 * theme.js
 * The day-cycle colour system.
 *
 * The time-of-day slider gives a number from 0 to 100. We turn it into P (0–1)
 * and move through five palettes, like a real day (morning is the original look):
 *   morning (crisp dawn) → afternoon (balanced daylight) → golden hour (warm glow)
 *   → dusk (twilight indigo) → midnight (deep night)
 *
 * Background colours blend between neighbouring palettes. Text colours blend
 * only among the light palettes (morning → golden hour) or among the dark ones
 * (dusk → midnight), and switch from dark to light in one quick step between
 * golden hour and dusk, so text always stays readable.
 *
 * Each palette lists:
 *   backgrounds: bg, band (alternate section), card, sage / duff / payne (coloured
 *     fills), deep (footer + return banner), btn, track, plus illustration colours
 *   text: ink, line (borders + hard shadows), muted, accent, btnInk, onSage,
 *     onPayne, onDuff, up / down (gains and losses)
 * Where a palette's accent is too light to read as small text, `accent` (text)
 * uses a deeper shade of the same hue and the bright shade goes on buttons.
 */

// Every palette must have the same keys.
// The chat box has its own keys (chatBg, botBubble, botInk, userBubble, userInk)
// so it can be lifted a little at night without changing every other card.

const MORNING = { // the original Morning Nook: cream, sage, forest green (unchanged)
  bg: '#FFFAF1', band: '#F9E4C5', card: '#FFFFFF', sage: '#D6DFC8', duff: '#DDAD8A',
  payne: '#5B758C', deep: '#1B4436', btn: '#1B4436', track: '#E9E1CF',
  owlBody: '#88A33B', tuft: '#5B758C', pineA: '#294D40', pineB: '#102B23', foot: '#102B23',
  chatBg: '#FFFFFF', botBubble: '#D6DFC8', userBubble: '#5B758C',
  ink: '#1B4436', line: '#1B4436', muted: '#4A6273', accent: '#5B758C', btnInk: '#FFFAF1',
  onSage: '#1B4436', onPayne: '#FFFAF1', onDuff: '#1B4436', up: '#4E6B1F', down: '#A2482A',
  botInk: '#1B4436', userInk: '#FFFAF1',
};

const AFTERNOON = { // balanced daylight & focus
  bg: '#F1F5F9', band: '#E2E8F0', card: '#FFFFFF', sage: '#E5F3D0', duff: '#C7D7FE',
  payne: '#1E3A8A', deep: '#0F172A', btn: '#2563EB', track: '#E2E8F0',
  owlBody: '#65A30D', tuft: '#2563EB', pineA: '#294D40', pineB: '#102B23', foot: '#0F172A',
  chatBg: '#FFFFFF', botBubble: '#E5F3D0', userBubble: '#1E3A8A',
  ink: '#0F172A', line: '#94A3B8', muted: '#475569', accent: '#2563EB', btnInk: '#FFFFFF',
  onSage: '#0F172A', onPayne: '#FFFFFF', onDuff: '#0F172A', up: '#4D7C0F', down: '#B91C1C',
  botInk: '#0F172A', userInk: '#FFFFFF',
};

const GOLDEN = { // warm glow & transition
  bg: '#FAF5EE', band: '#F5EBDD', card: '#FFFBEB', sage: '#FEEFEF', duff: '#FB7185',
  payne: '#78350F', deep: '#292524', btn: '#D97706', track: '#EFE6D8',
  owlBody: '#9C9A3E', tuft: '#FB7185', pineA: '#57534E', pineB: '#292524', foot: '#292524',
  chatBg: '#FFFBEB', botBubble: '#FEEFEF', userBubble: '#78350F',
  ink: '#292524', line: '#D1D5DB', muted: '#57534E', accent: '#B45309', btnInk: '#1C1917',
  onSage: '#292524', onPayne: '#FFFBEB', onDuff: '#1C1917', up: '#4D7C0F', down: '#BE123C',
  botInk: '#292524', userInk: '#FFFBEB',
};

const DUSK = { // twilight & deepening shadows
  bg: '#1E1B4B', band: '#25215C', card: '#312E81', sage: '#2A2766', duff: '#FB7185',
  payne: '#4338CA', deep: '#13113A', btn: '#8B5CF6', track: '#3730A3',
  owlBody: '#8B8FD6', tuft: '#F43F5E', pineA: '#2A2766', pineB: '#13113A', foot: '#13113A',
  chatBg: '#3B3893', botBubble: '#4F4AB0', userBubble: '#6D28D9',
  ink: '#E0E7FF', line: '#4338CA', muted: '#A5B4FC', accent: '#A78BFA', btnInk: '#FFFFFF',
  onSage: '#E0E7FF', onPayne: '#E0E7FF', onDuff: '#1E1B4B', up: '#86EFAC', down: '#FDA4AF',
  botInk: '#F5F7FF', userInk: '#FFFFFF',
};

const MIDNIGHT = { // deep night & calm
  bg: '#090D16', band: '#0D1220', card: '#111827', sage: '#0F1A2E', duff: '#06B6D4',
  payne: '#312E81', deep: '#05080F', btn: '#06B6D4', track: '#1F2937',
  owlBody: '#4F6B8F', tuft: '#06B6D4', pineA: '#111827', pineB: '#05080F', foot: '#05080F',
  chatBg: '#1E293B', botBubble: '#334155', userBubble: '#0E7490',
  ink: '#94A3B8', line: '#1F2937', muted: '#7C8BA1', accent: '#06B6D4', btnInk: '#090D16',
  onSage: '#94A3B8', onPayne: '#E0E7FF', onDuff: '#090D16', up: '#22D3EE', down: '#FB7185',
  botInk: '#E2E8F0', userInk: '#FFFFFF',
};

const TEXT_KEYS = ['ink', 'line', 'muted', 'accent', 'btnInk', 'onSage', 'onPayne', 'onDuff', 'up', 'down', 'botInk', 'userInk'];
const BACKGROUND_KEYS = Object.keys(MORNING).filter((key) => !TEXT_KEYS.includes(key));

// Where each palette sits on the slider. Repeating a palette holds it steady for a while.
const BACKGROUND_STOPS = [
  [0, MORNING], [0.1, MORNING],
  [0.28, AFTERNOON], [0.36, AFTERNOON],
  [0.44, GOLDEN], [0.5, GOLDEN],
  [0.53, DUSK], [0.72, DUSK],
  [0.9, MIDNIGHT], [1, MIDNIGHT],
];
const LIGHT_TEXT_STOPS = BACKGROUND_STOPS.filter(([at]) => at <= 0.5);
const DARK_TEXT_STOPS = BACKGROUND_STOPS.filter(([at]) => at >= 0.53);

export const clamp = (v) => Math.max(0, Math.min(1, v));

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** Blend two hex colours. p = 0 gives a, p = 1 gives b. */
export function mix(a, b, p) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * p).toString(16).padStart(2, '0')).join('');
}

/** How bright a colour looks (WCAG relative luminance, 0–1). */
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two colours (1 = none, 21 = black on white). */
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Blend through several colour stops, e.g. morning → golden hour → night. */
export function blendStops(stops, p) {
  if (p <= stops[0][0]) return stops[0][1];
  for (let i = 0; i < stops.length - 1; i++) {
    const [p0, c0] = stops[i];
    const [p1, c1] = stops[i + 1];
    if (p <= p1) return mix(c0, c1, (p - p0) / (p1 - p0));
  }
  return stops[stops.length - 1][1];
}

/** Picks one key out of a list of [position, palette] stops and blends it at P. */
const blendKey = (stops, key, P) => blendStops(stops.map(([at, palette]) => [at, palette[key]]), P);

/** The full UI palette for a point in the day. */
export function getTheme(P) {
  // q runs 0 → 1 across the quick golden-hour → dusk step (50% to 53% of the slider).
  let q = clamp((P - 0.5) / 0.03);
  q = q * q * (3 - 2 * q); // smoothstep easing
  const isNight = q >= 0.5;

  const t = {};
  for (const key of BACKGROUND_KEYS) t[key] = blendKey(BACKGROUND_STOPS, key, P);
  for (const key of TEXT_KEYS) t[key] = blendKey(isNight ? DARK_TEXT_STOPS : LIGHT_TEXT_STOPS, key, P);
  // Button text: whichever of white or near-black reads better on the current button colour,
  // so it never turns grey while the button colour is blending between palettes.
  if (contrast(t.btn, t.btnInk) < 4.5) {
    t.btnInk = contrast(t.btn, '#FFFFFF') >= contrast(t.btn, '#0F172A') ? '#FFFFFF' : '#0F172A';
  }
  return { ...t, q, isNight };
}

/** Turns { onSage: '#…' } into { '--on-sage': '#…' } so CSS can use var(--on-sage). */
export function themeVars(theme) {
  const vars = {};
  for (const [key, value] of Object.entries(theme)) {
    if (typeof value === 'string') {
      vars['--' + key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())] = value;
    }
  }
  return vars;
}

/** Colours and positions for the illustrated scenery (sky, hills, sun, moon, stars). */
export function getScene(P) {
  return {
    leftSky: blendStops([[0, '#DDAD8A'], [0.5, '#E39C76'], [1, '#22385A']], P),
    rightSky: blendStops([[0, '#5B758C'], [0.5, '#6F6A87'], [1, '#13253F']], P),
    midSky: blendStops([[0, '#D6DFC8'], [0.5, '#EBC59F'], [1, '#0F2038']], P),
    leftHill: blendStops([[0, '#1B4436'], [1, '#0C1A30']], P),
    rightHill: blendStops([[0, '#88A33B'], [0.5, '#7C7B4A'], [1, '#2B4A75']], P),
    mount: blendStops([[0, '#5B758C'], [0.5, '#80708A'], [1, '#22406A']], P),
    hill: blendStops([[0, '#88A33B'], [0.5, '#8E8A55'], [1, '#1D3A63']], P),
    front: blendStops([[0, '#1B4436'], [1, '#0B1830']], P),
    pineA: blendStops([[0, '#1B4436'], [1, '#132A4B']], P),
    pineB: blendStops([[0, '#294D40'], [1, '#10223F']], P),
    sun: blendStops([[0, '#F3CF97'], [0.5, '#E8906A'], [1, '#D9734E']], P),
    sunY: 140 + P * 300,
    sunOpacity: clamp(1 - (P - 0.5) / 0.25),
    moonY: 330 - P * 240,
    moonOpacity: clamp((P - 0.45) / 0.3),
    starOpacity: clamp((P - 0.55) / 0.3),
    fireflyOpacity: clamp((P - 0.6) / 0.25),
    leafOpacity: clamp(1 - P / 0.6),
    orb: P < 0.5 ? '#F3CF97' : '#F9E4C5',
    loginSunY: 90 + P * 300,
  };
}

export function phaseOf(P) {
  if (P < 0.19) return 'morning';
  if (P < 0.4) return 'afternoon';
  if (P < 0.52) return 'golden hour';
  if (P < 0.81) return 'dusk';
  return 'midnight';
}
