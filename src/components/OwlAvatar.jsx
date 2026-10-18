/*
 * OwlAvatar.jsx
 * Shows a user's custom owl. `crop` shows just the head (for the header).
 * The drawing comes from owl.js and only ever uses Nook's own colours and
 * accessories, so it's safe to insert as SVG markup.
 */
import { owlSvg } from '../owl';

export default function OwlAvatar({ avatar, size = 48, crop = false, badge = false, label = 'Your owl', className = '' }) {
  return (
    <span
      className={`owl-avatar ${className}`}
      role="img"
      aria-label={label}
      style={{ width: size, height: crop ? size : Math.round((size * 224) / 204) }}
      dangerouslySetInnerHTML={{ __html: owlSvg(avatar, { size, crop, badge }) }}
    />
  );
}
