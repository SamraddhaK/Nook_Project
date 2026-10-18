/*
 * owl.js
 * Everything about a user's custom owl: the colours and accessories to choose
 * from, the drawing (as an SVG string, so the same drawing works on the page
 * AND as the mouse cursor), and a hook that turns it into the cursor.
 *
 * An owl is saved as a small object, e.g.
 *   { color: 'grape', hat: 'tophat', outfit: 'suit', face: null, hold: 'coin' }
 * null (no custom owl) means "use the classic Nook owl".
 */
import { useEffect } from 'react';

const OUTLINE = '#1F2937';

export const OWL_COLORS = [
  { id: 'grape', name: 'Grape', feather: '#9D4EDD' },
  { id: 'bubblegum', name: 'Bubblegum', feather: '#F472B6' },
  { id: 'sunflower', name: 'Sunflower', feather: '#FACC15' },
  { id: 'cherry', name: 'Cherry', feather: '#E11D48' },
  { id: 'snowy', name: 'Snowy', feather: '#F1F5F9' },
  { id: 'cocoa', name: 'Cocoa', feather: '#8B5E3C' },
  { id: 'tangerine', name: 'Tangerine', feather: '#FB923C' },
];

/* ---------- little colour helpers ---------- */
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (parts) => '#' + parts.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const shade = (hex, amount) => toHex(rgb(hex).map((v) => v * (1 - amount))); // darker
const tint = (hex, amount) => toHex(rgb(hex).map((v) => v + (255 - v) * amount)); // lighter

/** Colours for one owl, worked out from its feather colour. */
function paletteFor(colorId) {
  const color = OWL_COLORS.find((c) => c.id === colorId) ?? OWL_COLORS[4];
  const isRed = colorId === 'cherry' || colorId === 'tangerine';
  return {
    feather: color.feather,
    wing: shade(color.feather, colorId === 'snowy' ? 0.16 : 0.22),
    belly: tint(color.feather, colorId === 'snowy' ? 1 : 0.6),
    tie: isRed ? '#FACC15' : '#E11D48', // ties and scarves never match the feathers
    scarf: isRed ? '#2563EB' : '#EF4444',
  };
}

const DOLLAR = 'M9 -9 C9 -15 -9 -15 -9 -6 C-9 2 9 -2 9 6 C9 15 -9 15 -9 9 M0 -19 V19';

/* ---------- accessories: id, label and how to draw it ---------- */
export const OWL_SLOTS = [
  {
    id: 'hat',
    label: 'Hat',
    options: [
      { id: 'tophat', label: 'Top hat', draw: () =>
        `<rect x="72" y="4" width="56" height="50" rx="4" fill="${OUTLINE}"/><rect x="72" y="38" width="56" height="9" fill="#D4A017"/><rect x="54" y="50" width="92" height="11" rx="5.5" fill="${OUTLINE}"/>` },
      { id: 'gradcap', label: 'Graduation cap', draw: () =>
        `<path d="M68 52 L68 66 Q100 78 132 66 L132 52 Z" fill="${OUTLINE}"/><polygon points="100,24 162,42 100,60 38,42" fill="${OUTLINE}" stroke="#374151" stroke-width="2"/><path d="M100 42 L152 46 L152 76" fill="none" stroke="#FACC15" stroke-width="4" stroke-linecap="round"/><circle cx="152" cy="80" r="6" fill="#FACC15"/>` },
      { id: 'crown', label: 'Crown', draw: () =>
        `<polygon points="62,62 60,22 81,40 100,14 119,40 140,22 138,62" fill="#FACC15" stroke="#B8860B" stroke-width="4" stroke-linejoin="round"/><circle cx="100" cy="50" r="6" fill="#E11D48"/><circle cx="78" cy="54" r="4" fill="#3B82F6"/><circle cx="122" cy="54" r="4" fill="#3B82F6"/>` },
      { id: 'visor', label: 'Trader’s visor', draw: () =>
        `<path d="M50 70 Q100 46 150 70 L150 78 Q100 56 50 78 Z" fill="${OUTLINE}"/><path d="M48 74 Q100 54 152 74 L144 92 Q100 74 56 92 Z" fill="#22C55E" fill-opacity=".75" stroke="#15803D" stroke-width="3" stroke-linejoin="round"/>` },
      { id: 'beanie', label: 'Beanie', draw: () =>
        `<path d="M54 68 Q52 16 100 16 Q148 16 146 68 Z" fill="#2563EB" stroke="${OUTLINE}" stroke-width="3"/><rect x="50" y="58" width="100" height="16" rx="8" fill="#1D4ED8" stroke="${OUTLINE}" stroke-width="3"/><circle cx="100" cy="14" r="11" fill="#F8FAFC" stroke="${OUTLINE}" stroke-width="3"/>` },
    ],
  },
  {
    id: 'outfit',
    label: 'Outfit',
    options: [
      { id: 'suit', label: 'Suit & tie', draw: (c) =>
        `<path d="M36 156 Q40 200 100 214 Q160 200 164 156 Q134 150 100 150 Q66 150 36 156 Z" fill="${OUTLINE}"/><polygon points="82,151 118,151 100,192" fill="#F8FAFC"/><path d="M82 151 L93 178 L86 181 Z M118 151 L107 178 L114 181 Z" fill="#374151"/><polygon points="95,151 105,151 103,159 97,159" fill="${c.tie}"/><polygon points="97,159 103,159 108,181 100,192 92,181" fill="${c.tie}"/>` },
      { id: 'bowtie', label: 'Bow tie', draw: (c) =>
        `<path d="M100 148 L78 136 L78 160 Z M100 148 L122 136 L122 160 Z" fill="${c.tie}" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="148" r="6" fill="${c.tie}" stroke="${OUTLINE}" stroke-width="3"/>` },
      { id: 'hoodie', label: 'Hoodie', draw: () =>
        `<path d="M34 152 Q38 200 100 214 Q162 200 166 152 Q134 142 100 142 Q66 142 34 152 Z" fill="#475569"/><path d="M70 182 Q100 176 130 182 L124 204 Q100 208 76 204 Z" fill="#334155"/><path d="M90 146 L88 172 M110 146 L112 172" stroke="#F8FAFC" stroke-width="3" stroke-linecap="round"/><circle cx="88" cy="174" r="3" fill="#F8FAFC"/><circle cx="112" cy="174" r="3" fill="#F8FAFC"/>` },
      { id: 'scarf', label: 'Cozy scarf', draw: (c) =>
        `<path d="M34 132 Q100 162 166 132 L168 150 Q100 182 32 150 Z" fill="${c.scarf}" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/><path d="M116 152 L136 152 L132 198 L114 198 Z" fill="${c.scarf}" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/><path d="M115 168 L134 168 M114 182 L133 182" stroke="#F8FAFC" stroke-width="4"/>` },
    ],
  },
  {
    id: 'face',
    label: 'Face',
    options: [
      { id: 'roundglasses', label: 'Round glasses', draw: () =>
        `<circle cx="76" cy="98" r="25" fill="#E0F2FE" fill-opacity=".25" stroke="${OUTLINE}" stroke-width="5"/><circle cx="124" cy="98" r="25" fill="#E0F2FE" fill-opacity=".25" stroke="${OUTLINE}" stroke-width="5"/><path d="M51 94 L40 88 M149 94 L160 88" stroke="${OUTLINE}" stroke-width="5" stroke-linecap="round"/>` },
      { id: 'sunglasses', label: 'Sunglasses', draw: () =>
        `<rect x="48" y="82" width="52" height="32" rx="14" fill="#111827" stroke="${OUTLINE}" stroke-width="3"/><rect x="100" y="82" width="52" height="32" rx="14" fill="#111827" stroke="${OUTLINE}" stroke-width="3"/><path d="M58 91 L72 91 M110 91 L124 91" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>` },
      { id: 'monocle', label: 'Monocle', draw: () =>
        `<circle cx="124" cy="98" r="25" fill="#E0F2FE" fill-opacity=".25" stroke="#D4A017" stroke-width="5"/><path d="M146 110 Q166 140 150 168" fill="none" stroke="#D4A017" stroke-width="2.5"/>` },
    ],
  },
  {
    id: 'hold',
    label: 'Holding',
    options: [
      { id: 'coin', label: 'Gold coin', draw: () =>
        `<circle cx="170" cy="172" r="20" fill="#FACC15" stroke="#B8860B" stroke-width="4"/><path transform="translate(170 172) scale(.85)" d="${DOLLAR}" fill="none" stroke="#7A5512" stroke-width="4.5" stroke-linecap="round"/>` },
      { id: 'magnifier', label: 'Magnifying glass', draw: () =>
        `<line x1="178" y1="182" x2="196" y2="204" stroke="${OUTLINE}" stroke-width="8" stroke-linecap="round"/><circle cx="166" cy="168" r="19" fill="#E0F2FE" fill-opacity=".8" stroke="${OUTLINE}" stroke-width="6"/>` },
      { id: 'briefcase', label: 'Tiny briefcase', draw: () =>
        `<path d="M160 168 V160 H180 V168" fill="none" stroke="${OUTLINE}" stroke-width="4"/><rect x="146" y="168" width="48" height="36" rx="6" fill="#8B5E3C" stroke="${OUTLINE}" stroke-width="3.5"/><path d="M146 182 H194" stroke="${OUTLINE}" stroke-width="3"/><rect x="165" y="178" width="10" height="8" rx="2" fill="#FACC15" stroke="${OUTLINE}" stroke-width="2"/>` },
      { id: 'piggybank', label: 'Piggy bank', draw: () =>
        `<path d="M156 196 v7 M180 196 v7" stroke="${OUTLINE}" stroke-width="5" stroke-linecap="round"/><ellipse cx="168" cy="180" rx="24" ry="18" fill="#F9A8D4" stroke="${OUTLINE}" stroke-width="3.5"/><path d="M156 166 L160 155 L169 165 Z" fill="#F9A8D4" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="191" cy="181" rx="6" ry="7" fill="#F472B6" stroke="${OUTLINE}" stroke-width="3"/><circle cx="179" cy="174" r="2.5" fill="${OUTLINE}"/><path d="M162 168 h12" stroke="${OUTLINE}" stroke-width="3" stroke-linecap="round"/>` },
    ],
  },
];

/** What a brand-new owl looks like before the user changes anything. */
export const DEFAULT_OWL = { color: 'snowy', hat: null, outfit: null, face: 'roundglasses', hold: null };

/** Cleans up a saved owl so only known colours and accessories are ever drawn. Returns null for "no custom owl". */
export function normalizeOwl(owl) {
  if (!owl || typeof owl !== 'object') return null;
  const clean = { color: OWL_COLORS.some((c) => c.id === owl.color) ? owl.color : DEFAULT_OWL.color };
  for (const slot of OWL_SLOTS) {
    clean[slot.id] = slot.options.some((o) => o.id === owl[slot.id]) ? owl[slot.id] : null;
  }
  return clean;
}

/** A random owl for the "Surprise me" button. */
export function randomOwl() {
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const owl = { color: pick(OWL_COLORS).id };
  for (const slot of OWL_SLOTS) owl[slot.id] = Math.random() < 0.65 ? pick(slot.options).id : null;
  return owl;
}

/**
 * Draws an owl as an SVG string.
 * crop: true shows just the head (used for the cursor and small avatars).
 * badge: true puts a light circle behind it so the cursor shows on dark backgrounds too.
 */
export function owlSvg(owl, { size = 200, crop = false, badge = false } = {}) {
  const o = normalizeOwl(owl) ?? DEFAULT_OWL;
  const c = paletteFor(o.color);
  const part = (slotId) => {
    const slot = OWL_SLOTS.find((s) => s.id === slotId);
    const option = slot.options.find((opt) => opt.id === o[slotId]);
    return option ? option.draw(c) : '';
  };
  const viewBox = crop ? '24 0 152 152' : '0 0 204 224';
  const height = crop ? size : Math.round((size * 224) / 204);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${size}" height="${height}" aria-hidden="true">`
    + (badge ? `<circle cx="100" cy="76" r="73" fill="#FFFFFF" fill-opacity=".9" stroke="${OUTLINE}" stroke-width="3"/>` : '')
    // ear tufts + body + belly
    + `<polygon points="50,74 60,24 92,58" fill="${c.wing}" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>`
    + `<polygon points="150,74 140,24 108,58" fill="${c.wing}" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>`
    + `<ellipse cx="100" cy="132" rx="80" ry="82" fill="${c.feather}" stroke="${OUTLINE}" stroke-width="4"/>`
    + `<ellipse cx="100" cy="168" rx="48" ry="38" fill="${c.belly}"/>`
    + `<path d="M64 180 q6 -8 12 0 M82 188 q6 -8 12 0 M100 190 q6 -8 12 0 M118 188 q6 -8 12 0" fill="none" stroke="${c.wing}" stroke-width="3" stroke-linecap="round" opacity=".55"/>`
    // face, eyes, beak, cheeks
    + `<path d="M100 66 C64 52 34 72 38 102 C42 130 72 138 100 124 C128 138 158 130 162 102 C166 72 136 52 100 66 Z" fill="#FFF8EC" stroke="${OUTLINE}" stroke-width="3"/>`
    + `<circle cx="76" cy="98" r="19" fill="#FFFFFF" stroke="${OUTLINE}" stroke-width="4"/><circle cx="124" cy="98" r="19" fill="#FFFFFF" stroke="${OUTLINE}" stroke-width="4"/>`
    + `<circle cx="79" cy="100" r="9" fill="${OUTLINE}"/><circle cx="121" cy="100" r="9" fill="${OUTLINE}"/>`
    + `<circle cx="82" cy="96" r="3.2" fill="#FFFFFF"/><circle cx="124" cy="96" r="3.2" fill="#FFFFFF"/>`
    + `<path d="M92 114 L108 114 L100 128 Z" fill="#F59E0B" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>`
    + `<ellipse cx="54" cy="120" rx="9" ry="5" fill="#FB7185" opacity=".45"/><ellipse cx="146" cy="120" rx="9" ry="5" fill="#FB7185" opacity=".45"/>`
    // outfit, wings, feet
    + part('outfit')
    + `<path d="M24 128 Q10 172 52 198 Q40 162 44 126 Z" fill="${c.wing}" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>`
    + `<path d="M176 128 Q190 172 148 198 Q160 162 156 126 Z" fill="${c.wing}" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>`
    + `<ellipse cx="80" cy="212" rx="11" ry="6" fill="#F59E0B" stroke="${OUTLINE}" stroke-width="3"/><ellipse cx="120" cy="212" rx="11" ry="6" fill="#F59E0B" stroke="${OUTLINE}" stroke-width="3"/>`
    // accessories on top
    + part('face') + part('hat') + part('hold')
    + '</svg>';
}

/** CSS cursor value for an owl, e.g. url("data:…") 20 20, pointer */
function cursorFor(owl, fallback) {
  const size = 40;
  const svg = owlSvg(owl, { size, crop: true, badge: true });
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${size / 2} ${size / 2}, ${fallback}`;
}

/**
 * Makes the user's owl the mouse cursor while they're signed in with a custom owl.
 * Sets two CSS variables on the page; App.css falls back to the classic owl when they're not set.
 */
export function useOwlCursor(owl) {
  useEffect(() => {
    const root = document.documentElement;
    const clean = normalizeOwl(owl);
    if (!clean) return undefined;
    root.style.setProperty('--owl-cursor-auto', cursorFor(clean, 'auto'));
    root.style.setProperty('--owl-cursor-pointer', cursorFor(clean, 'pointer'));
    return () => {
      root.style.removeProperty('--owl-cursor-auto');
      root.style.removeProperty('--owl-cursor-pointer');
    };
  }, [owl]);
}
