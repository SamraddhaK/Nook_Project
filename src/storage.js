/*
 * storage.js
 * Everything Nook saves, in one place.
 *
 *  - Signed-in users: Supabase (real accounts, a profile row and a game_results table).
 *  - Guests: the browser's localStorage, so the game still works without an account.
 *    When a guest signs up or logs in, their games move into the account.
 *
 * Every Supabase call here is protected by Row Level Security (see supabase/schema.sql),
 * so a user can only ever read or change their own rows.
 */
import { supabase } from './supabase';

/* ---------- small localStorage helpers (guests + time of day) ---------- */

function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback; // private browsing or blocked storage
  }
}

function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the site still works, it just won't remember */
  }
}

export const loadCycle = () => readJSON('nook-cycle', 10);
export const saveCycle = (value) => writeJSON('nook-cycle', value);
export const loadGuestResults = () => readJSON('nook-results', []);
export const saveGuestResults = (results) => writeJSON('nook-results', results);

/* ---------- accounts ---------- */

/** Turns Supabase's technical error messages into friendly ones. */
function friendly(error) {
  const msg = error?.message || '';
  if (/invalid login credentials/i.test(msg)) return 'That email and password don’t match. Try again?';
  if (/already registered|already exists/i.test(msg)) return 'That email already has an account. Try logging in instead.';
  if (/email not confirmed/i.test(msg)) return 'Please confirm your email first. Check your inbox for the link.';
  if (/rate limit|too many/i.test(msg)) return 'Too many tries. Wait a minute and try again.';
  return msg || 'Something went wrong. Please try again.';
}

/** Creates an account. The name goes along as metadata and becomes the profile name. */
export async function signUp({ name, email, password }) {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
  if (error) return { error: friendly(error) };
  // With "Confirm email" turned on, there's no session until they click the email link.
  return { user: data.user, needsConfirmation: !data.session };
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: friendly(error) };
  return { user: data.user };
}

export async function signOut() {
  await supabase.auth.signOut();
}

/** The signed-in user from a previous visit, or null. */
export async function getCurrentUser() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

/**
 * Calls `callback(user)` whenever someone signs in or out (in this tab or another).
 * Returns a function that stops listening.
 */
export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') return;
    // Supabase recommends not making other Supabase calls directly inside this callback.
    setTimeout(() => callback(session?.user ?? null), 0);
  });
  return () => data.subscription.unsubscribe();
}

/* ---------- profile ---------- */

export async function loadProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('name, cycle, fund, avatar').eq('id', userId).maybeSingle();
  if (error) console.error('Could not load profile:', error.message);
  return data;
}

export async function saveProfile(userId, patch) {
  const { error } = await supabase.from('profiles').upsert({ id: userId, ...patch });
  if (error) console.error('Could not save profile:', error.message);
}

/* ---------- game journal ---------- */

// The app uses camelCase names; the database uses snake_case columns.
const toRow = (userId, r) => ({
  user_id: userId,
  n: r.n,
  diff: r.diff,
  fund: r.fund,
  final: r.final,
  hold: r.hold,
  perfect: r.perfect,
  skill: r.skill,
  trades: r.trades,
  in_market: r.inMarket,
  panic: r.panic,
  beat_hold: r.beatHold,
  period_from: r.period?.from ?? null,
  period_to: r.period?.to ?? null,
});

const fromRow = (row) => ({
  n: row.n,
  diff: row.diff,
  fund: row.fund,
  final: Number(row.final),
  hold: Number(row.hold),
  perfect: Number(row.perfect),
  skill: row.skill,
  trades: row.trades,
  inMarket: Number(row.in_market),
  panic: row.panic,
  beatHold: row.beat_hold,
  period: row.period_from ? { from: row.period_from, to: row.period_to } : null,
});

export async function loadCloudResults(userId) {
  const { data, error } = await supabase
    .from('game_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Could not load games:', error.message);
    return [];
  }
  return data.map(fromRow);
}

export async function addCloudResult(userId, result) {
  const { error } = await supabase.from('game_results').insert(toRow(userId, result));
  if (error) console.error('Could not save game:', error.message);
}

export async function clearCloudResults(userId) {
  const { error } = await supabase.from('game_results').delete().eq('user_id', userId);
  if (error) console.error('Could not clear games:', error.message);
}

/** Moves games played as a guest into the account, numbered after any games already there. */
export async function importGuestResults(userId, guestResults) {
  if (!guestResults.length) return;
  const existing = await loadCloudResults(userId);
  const rows = guestResults.map((r, i) => toRow(userId, { ...r, n: existing.length + i + 1 }));
  const { error } = await supabase.from('game_results').insert(rows);
  if (error) console.error('Could not import guest games:', error.message);
}
