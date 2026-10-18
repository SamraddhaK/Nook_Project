/*
 * OwlMaker.jsx
 * The "Make your owl" popup. Optional: closing it keeps whatever owl the user had
 * (the classic Nook owl if they never made one).
 *
 * Props:
 *   initial  – the user's current owl, or null
 *   isNew    – true right after sign-up (changes the greeting)
 *   onSave   – called with the new owl, or null to go back to the classic owl
 *   onClose  – close without changing anything
 */
import { useEffect, useState } from 'react';
import OwlAvatar from './OwlAvatar';
import { CloseIcon } from './Illustrations';
import { DEFAULT_OWL, OWL_COLORS, OWL_SLOTS, normalizeOwl, randomOwl } from '../owl';
import './OwlMaker.css';

export default function OwlMaker({ initial = null, isNew = false, onSave, onClose }) {
  const [owl, setOwl] = useState(() => normalizeOwl(initial) ?? DEFAULT_OWL);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const choose = (slot, value) => setOwl((current) => ({ ...current, [slot]: value }));

  return (
    <div className="overlay overlay-top" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="owl-maker card fill-card pop" role="dialog" aria-modal="true" aria-labelledby="owl-maker-title">
        <button type="button" className="close-btn" aria-label="Close" onClick={onClose}><CloseIcon /></button>

        <div className="owl-maker-preview">
          <OwlAvatar avatar={owl} size={210} label="Preview of your owl" />
          <div className="owl-maker-cursor">
            <OwlAvatar avatar={owl} size={40} crop badge label="Your owl as a cursor" />
            <span className="small">your new cursor</span>
          </div>
          <button type="button" className="chip" onClick={() => setOwl(randomOwl())}>Surprise me</button>
        </div>

        <div className="owl-maker-options">
          <span className="kicker">{isNew ? 'WELCOME TO THE NOOK' : 'YOUR OWL'}</span>
          <h2 id="owl-maker-title" className="owl-maker-title">Make your owl</h2>
          <p className="muted">Totally optional. Skip it and you keep the classic Nook owl. You can change it anytime by clicking your owl in the top corner.</p>

          <fieldset className="owl-group">
            <legend>Feathers</legend>
            <div className="owl-swatches">
              {OWL_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`owl-swatch ${owl.color === c.id ? 'is-on' : ''}`}
                  style={{ background: c.feather }}
                  aria-label={c.name}
                  aria-pressed={owl.color === c.id}
                  title={c.name}
                  onClick={() => choose('color', c.id)}
                />
              ))}
            </div>
          </fieldset>

          {OWL_SLOTS.map((slot) => (
            <fieldset key={slot.id} className="owl-group">
              <legend>{slot.label}</legend>
              <div className="owl-chips">
                <button type="button" className={`chip ${owl[slot.id] === null ? 'is-on' : ''}`} aria-pressed={owl[slot.id] === null} onClick={() => choose(slot.id, null)}>
                  None
                </button>
                {slot.options.map((opt) => (
                  <button key={opt.id} type="button" className={`chip ${owl[slot.id] === opt.id ? 'is-on' : ''}`} aria-pressed={owl[slot.id] === opt.id} onClick={() => choose(slot.id, opt.id)}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}

          <div className="owl-maker-actions">
            <button type="button" className="btn" onClick={() => onSave(owl)}>Save my owl</button>
            {initial ? (
              <button type="button" className="link-btn" onClick={() => onSave(null)}>Go back to the classic owl</button>
            ) : (
              <button type="button" className="link-btn" onClick={onClose}>Maybe later</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
