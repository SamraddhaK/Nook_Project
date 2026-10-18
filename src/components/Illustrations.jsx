/*
 * Illustrations.jsx
 * Every drawing on the site as a small SVG component: the owls, pine trees,
 * leaves and icons. Shapes that should follow the day/night theme use CSS
 * classes (owl-body, owl-tuft, owl-outline) styled in App.css.
 */

export const PINE_PATH = 'M30 0L52 36H40L58 66H36V100H24V66H2L20 36H8Z';
const OWL_BODY = 'M58 44Q50 14 66 6Q80 26 104 30Q152 24 170 58Q188 104 172 144Q152 190 102 190Q50 188 34 142Q24 92 58 44Z';
const OWL_SHADE = 'M58 44Q24 92 34 142Q46 182 80 188Q56 150 66 108Q70 70 58 44Z';
const LEAF_PATH = 'M4 36Q2 10 34 4Q38 34 4 36Z';

/** Nook's logo: the owl holding a magnifying glass. Pass x/y/width/height to nest it in another SVG. */
export function MagnifierOwl({ size = 56, ...rest }) {
  return (
    <svg viewBox="0 0 230 200" width={size} height={Math.round((size * 200) / 230)} aria-hidden="true" {...rest}>
      <path d={OWL_BODY} className="owl-body" />
      <ellipse cx="108" cy="118" rx="58" ry="62" fill="#F9E4C5" />
      <path d={OWL_SHADE} fill="#1B4436" opacity=".25" />
      <circle cx="76" cy="98" r="15" fill="#102B23" />
      <path d="M98 110l-8 13h16z" fill="#DDAD8A" />
      <circle cx="132" cy="94" r="32" fill="#FFFAF1" fillOpacity=".7" stroke="#102B23" strokeWidth="8" />
      <circle cx="134" cy="96" r="16" fill="#102B23" />
      <ellipse cx="139" cy="90" rx="5" ry="3.5" fill="#FFFAF1" transform="rotate(-30 139 90)" />
      <path d="M114 122L96 158" stroke="#102B23" strokeWidth="9" strokeLinecap="round" />
      <path d="M190 24l10 14M202 62l16 7M204 100l18 5M192 134l12 14" stroke="#DDAD8A" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

/** A friendly round owl. `sleepy` closes its eyes. */
export function PlainOwl({ size = 52, sleepy = false, ...rest }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true" {...rest}>
      <path d={OWL_BODY} className="owl-body" />
      <ellipse cx="108" cy="118" rx="58" ry="62" fill="#F9E4C5" />
      <path d={OWL_SHADE} fill="#1B4436" opacity=".25" />
      {sleepy ? (
        <path d="M68 100q14 12 28 0M120 100q14 12 28 0" fill="none" stroke="#102B23" strokeWidth="6" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="82" cy="98" r="15" fill="#102B23" />
          <circle cx="134" cy="98" r="15" fill="#102B23" />
          <circle cx="87" cy="92" r="4.5" fill="#FFFAF1" />
          <circle cx="139" cy="92" r="4.5" fill="#FFFAF1" />
        </>
      )}
      <path d="M108 110l-9 14h18z" fill="#DDAD8A" />
    </svg>
  );
}

/** The "Play the game" owl: a d-pad for one eye and controller buttons for the other. */
export function GameOwl({ size = 52, ...rest }) {
  return (
    <svg viewBox="0 0 120 112" width={size} height={Math.round((size * 112) / 120)} aria-hidden="true" {...rest}>
      <path d="M20 34 Q14 10 38 14 L48 30 Z" className="owl-tuft" strokeWidth="3" strokeLinejoin="round" />
      <path d="M100 34 Q106 10 82 14 L72 30 Z" className="owl-tuft" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="60" cy="62" r="44" className="owl-body owl-outline" strokeWidth="3.5" />
      <path d="M26 40 Q44 30 60 44 Q76 30 94 40 L90 46 Q76 38 60 52 Q44 38 30 46 Z" className="owl-tuft" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="41" cy="62" r="17" fill="#F9E4C5" stroke="#102B23" strokeWidth="3.5" />
      <circle cx="79" cy="62" r="17" fill="#F9E4C5" stroke="#102B23" strokeWidth="3.5" />
      <rect x="37" y="52" width="8" height="20" rx="2" fill="#102B23" />
      <rect x="31" y="58" width="20" height="8" rx="2" fill="#102B23" />
      <circle cx="79" cy="55" r="3.6" fill="#102B23" />
      <circle cx="79" cy="69" r="3.6" fill="#102B23" />
      <circle cx="72" cy="62" r="3.6" fill="#DDAD8A" stroke="#102B23" strokeWidth="1.5" />
      <circle cx="86" cy="62" r="3.6" fill="#DDAD8A" stroke="#102B23" strokeWidth="1.5" />
      <path d="M53 80 L67 80 L60 92 Z" fill="#DDAD8A" stroke="#102B23" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

/** One of the six little owls hiding in the footer trees (see TREE_OWLS in data.js). */
export function TreeOwl({ owl }) {
  const ink = '#102B23';
  const leftOpen = owl.eyes === 'open' || owl.eyes === 'wink';
  const rightOpen = owl.eyes === 'open';
  return (
    <svg viewBox="0 0 60 64" aria-hidden="true">
      {owl.tufts && <path d="M13 18 L9 3 L23 12 Z M47 18 L51 3 L37 12 Z" fill={owl.body} stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />}
      <ellipse cx="30" cy="36" rx="24" ry="26" fill={owl.body} stroke={ink} strokeWidth="2.5" />
      <ellipse cx="9" cy="42" rx="5" ry="11" fill={ink} opacity=".18" />
      <ellipse cx="51" cy="42" rx="5" ry="11" fill={ink} opacity=".18" />
      <ellipse cx="30" cy="44" rx="14" ry="15" fill={owl.belly} />
      {owl.eyes !== 'sleepy' && (
        <>
          <circle cx="21" cy="28" r="8" fill="#FFFAF1" stroke={ink} strokeWidth="2" />
          <circle cx="39" cy="28" r="8" fill="#FFFAF1" stroke={ink} strokeWidth="2" />
        </>
      )}
      {leftOpen && <><circle cx="22" cy="29" r="4" fill={ink} /><circle cx="23.5" cy="27.5" r="1.3" fill="#FFFAF1" /></>}
      {rightOpen && <><circle cx="40" cy="29" r="4" fill={ink} /><circle cx="41.5" cy="27.5" r="1.3" fill="#FFFAF1" /></>}
      {owl.eyes === 'wink' && <path d="M33 29 q6 5 12 0" fill="none" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />}
      {owl.eyes === 'sleepy' && <path d="M14 28 q7 5 14 0 M32 28 q7 5 14 0" fill="none" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />}
      {owl.glasses && (
        <g fill="none" stroke={ink} strokeWidth="2.5">
          <circle cx="21" cy="28" r="10" />
          <circle cx="39" cy="28" r="10" />
          <path d="M28 26 q2 -2 4 0" />
        </g>
      )}
      <path d="M27 35 L33 35 L30 41 Z" fill="#DDAD8A" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function Leaf({ size = 20, fill = '#DDAD8A', vein = true, ...rest }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" {...rest}>
      <path d={LEAF_PATH} fill={fill} />
      {vein && <path d="M6 34L26 14" stroke="#FFFAF1" strokeWidth="2" opacity=".5" />}
    </svg>
  );
}

export function WavyUnderline() {
  return (
    <svg viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden="true" className="wavy-line">
      <path d="M2 8 Q 20 0 38 8 T 74 8 T 110 8 T 146 8 T 182 8 T 218 8 T 254 8 T 298 8" fill="none" stroke="#DDAD8A" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- simple line icons ---------- */
const iconProps = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', 'aria-hidden': true };

export const SunIcon = () => (
  <svg {...iconProps}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
export const MoonIcon = () => (
  <svg {...iconProps}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></svg>
);
export const UserIcon = () => (
  <svg {...iconProps}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
);
export const CloseIcon = () => (
  <svg {...iconProps} strokeWidth={2.5}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const MenuIcon = () => (
  <svg {...iconProps} width={20} height={20} strokeWidth={2.4}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const CheckIcon = ({ size = 16 }) => (
  <svg {...iconProps} width={size} height={size} strokeWidth={3}><path d="M5 12l5 5 9-10" /></svg>
);
