/*
 * game.js
 * The logic behind "Pretend money, real lessons": price generation,
 * scoring a finished game, and the progress report. No React in here,
 * so it is easy to test or swap for real market data later.
 */

export const TOTAL_HOURS = 70; // 10 trading days × 7 hours
export const START_HOUR = 7; // day 1 is already visible when the game starts
const HOURS = ['10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM'];

export const DIFFICULTIES = {
  easy: {
    title: 'Easy', tag: 'GENTLE WAVES', fill: 'fill-sage-fixed', rotate: -2, offset: 0, weight: 1,
    desc: 'Prices rise and fall in smooth, predictable wobbles. Nook draws where the line is heading and drops hints.',
    note: 'great for learning the rhythm',
  },
  medium: {
    title: 'Medium', tag: 'REAL-FEELING WOBBLES', fill: 'fill-peach', rotate: 1.5, offset: 24, weight: 1.3,
    desc: 'Prices bounce around like a normal market. No forecast line; Nook only reacts after big moves.',
    note: 'closer to the real thing',
  },
  hard: {
    title: 'Hard', tag: 'REAL DATA · 1-HR DELAY', fill: 'fill-payne-fixed', rotate: -1, offset: 6, weight: 1.6,
    desc: 'Replays 10 real trading days from the past month, an hour delayed. It plays on its own: no pausing, no hints.',
    note: 'which days? find out at the end',
  },
};

/* Sample games so the journal has something to show before the first real game. */
export const DEMO_RESULTS = [
  { n: 1, diff: 'easy', fund: 'VOO', final: 101.2, hold: 102.4, perfect: 112.3, skill: 10, trades: 14, inMarket: 0.35, panic: 2, beatHold: false },
  { n: 2, diff: 'easy', fund: 'VOO', final: 103.1, hold: 101.8, perfect: 110.9, skill: 28, trades: 9, inMarket: 0.5, panic: 1, beatHold: true },
  { n: 3, diff: 'easy', fund: 'QQQ', final: 104.6, hold: 102.9, perfect: 111.5, skill: 40, trades: 6, inMarket: 0.62, panic: 0, beatHold: true },
  { n: 4, diff: 'medium', fund: 'VOO', final: 101.9, hold: 102.6, perfect: 115.0, skill: 13, trades: 7, inMarket: 0.58, panic: 1, beatHold: false },
  { n: 5, diff: 'medium', fund: 'QQQ', final: 103.8, hold: 102.1, perfect: 114.2, skill: 27, trades: 5, inMarket: 0.7, panic: 0, beatHold: true },
];

export const money = (v) => '$' + v.toFixed(2);
export const signedMoney = (v) => (v >= 0 ? '+' : '−') + '$' + Math.abs(v).toFixed(2);
export const hourLabel = (i) => `day ${Math.floor(i / 7) + 1} · ${HOURS[i % 7]}`;
export const nextDifficulty = (d) => (d === 'easy' ? 'medium' : d === 'medium' ? 'hard' : null);

/* Small seeded random number generator, so each game is different but repeatable. */
function seededRandom(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Builds the hourly prices for one game.
 * Returns { prices, smooth }. `smooth` is the noise-free curve, used to draw
 * Easy mode's dashed forecast line.
 *
 * Hard mode is meant to use real prices delayed by one hour. To wire that up,
 * fetch hourly bars from a market-data API on your server and return them here
 * in the same shape instead of the simulated walk below.
 */
export function makeSeries(diff, fund, seed) {
  const rand = seededRandom(seed);
  const base = fund === 'VOO' ? 512.4 : 476.8;
  const swing = fund === 'VOO' ? 1 : 1.35; // QQQ is bumpier
  const prices = [];
  const smooth = [];

  if (diff === 'easy') {
    const phase = rand() * Math.PI * 2;
    const period = 12 + Math.floor(rand() * 5);
    const amplitude = 0.016 * swing;
    for (let i = 0; i < TOTAL_HOURS; i++) {
      const clean = base * (1 + 0.0005 * i) * (1 + amplitude * Math.sin((2 * Math.PI * i) / period + phase));
      smooth.push(clean);
      prices.push(Math.round(clean * (1 + (rand() - 0.5) * 0.002) * 100) / 100);
    }
  } else {
    const vol = (diff === 'medium' ? 0.0055 : 0.0085) * swing;
    const drift = diff === 'medium' ? 0.0003 : 0.0002;
    let value = base;
    for (let i = 0; i < TOTAL_HOURS; i++) {
      if (i > 0) {
        let shock = (rand() + rand() + rand() - 1.5) * 2 * vol;
        if (diff === 'hard' && rand() < 0.06) shock *= 3;
        if (diff === 'medium' && rand() < 0.04) shock *= 2.2;
        value *= 1 + drift + shock;
      }
      prices.push(Math.round(value * 100) / 100);
      smooth.push(value);
    }
  }
  return { prices, smooth };
}

/**
 * Hard mode: asks our own backend (api/prices.js) for 10 real trading days.
 * The browser never talks to the market data company directly, so the API key stays secret.
 */
export async function fetchRealSeries(fund) {
  const res = await fetch(`/api/prices?symbol=${encodeURIComponent(fund)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !Array.isArray(data.prices) || data.prices.length !== TOTAL_HOURS) {
    throw new Error(data.error || 'Couldn’t load real prices right now.');
  }
  // Real prices have no "smooth" curve; hard mode never shows a forecast anyway.
  return { prices: data.prices, smooth: data.prices, real: true, period: { from: data.from, to: data.to } };
}

/** "Sep 22 – Oct 3, 2026" from two YYYY-MM-DD dates. */
export function formatPeriod({ from, to }) {
  const fmt = (iso, withYear) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}),
  });
  return `${fmt(from, false)} – ${fmt(to, true)}`;
}

/** Easy-mode hint based on where the smooth curve is heading next. */
export function hintFor(series, hourIndex, ownsShares) {
  if (hourIndex + 3 >= TOTAL_HOURS) return '';
  const rising = series.smooth[hourIndex + 3] > series.smooth[hourIndex];
  if (rising) {
    return ownsShares
      ? 'nook’s hint: riding the upswing. watch for the top of the wave.'
      : 'nook’s hint: the wobble is turning up. buying near a low is the classic move.';
  }
  return ownsShares
    ? 'nook’s hint: looks like a dip is coming. some people sell before it and buy back lower.'
    : 'nook’s hint: prices are drifting down. waiting for the low can pay off.';
}

/** Scores a finished game against "buy and hold" and "perfect timing". */
export function scoreGame(game, series, gameNumber) {
  const P = series.prices;
  const last = P[TOTAL_HOURS - 1];
  const final = game.cash + game.shares * last;
  const hold = (100 * last) / P[START_HOUR - 1];
  let perfect = 100;
  for (let i = START_HOUR - 1; i < TOTAL_HOURS - 1; i++) {
    if (P[i + 1] > P[i]) perfect *= P[i + 1] / P[i];
  }
  const round2 = (v) => Math.round(v * 100) / 100;
  return {
    n: gameNumber,
    diff: game.diff,
    fund: game.fund,
    final: round2(final),
    hold: round2(hold),
    perfect: round2(perfect),
    skill: Math.round(Math.max(0, Math.min(1, (final - 100) / Math.max(0.01, perfect - 100))) * 100),
    trades: game.trades.length,
    inMarket: round2(game.hoursInMarket / (TOTAL_HOURS - START_HOUR)),
    panic: game.panicSells,
    beatHold: final > hold,
    period: series.period ?? null, // set for real hard-mode games, shown in the reveal
  };
}

export function gradeFor(skill) {
  if (skill >= 70) return 'Sharp-eyed owl';
  if (skill >= 40) return 'Steady flier';
  if (skill >= 15) return 'Fledgling';
  return 'Still hatching';
}

export function lessonFor(result) {
  if (result.skill >= 70) return 'Incredible timing. Real markets rarely let anyone do this twice in a row, so enjoy it.';
  if (result.beatHold) return 'You beat simply buying once and holding. That is harder than it looks; plenty of experienced investors don’t manage it.';
  return 'Buying once and holding would have done better this time. That happens a lot: trying to time every wobble often means missing the best hours.';
}

const average = (list, pick) => (list.length ? list.reduce((sum, x) => sum + pick(x), 0) / list.length : 0);
const adjustedSkill = (r) => Math.min(100, r.skill * DIFFICULTIES[r.diff].weight);

/**
 * Looks at past games and writes a progress report:
 * is the player improving, what are they doing well, what should they fix?
 * Needs at least 3 games.
 */
export function buildReport(results) {
  let recent = results.slice(-3);
  let earlier = results.slice(0, -3);
  if (!earlier.length) {
    earlier = [results[0]];
    recent = [results[results.length - 1]];
  }
  const trend = average(recent, adjustedSkill) - average(earlier, adjustedSkill);
  const last3 = results.slice(-3);
  const avgTrades = average(last3, (x) => x.trades);
  const avgInMarket = average(last3, (x) => x.inMarket);
  const panicCount = last3.reduce((sum, x) => sum + x.panic, 0);
  const beatCount = last3.filter((x) => x.beatHold).length;
  const latestDiff = results[results.length - 1].diff;
  const good = [];
  const fix = [];

  if (beatCount >= 2) good.push(`You beat buy-and-hold in ${beatCount} of your last 3 games. Your entry timing is getting sharper.`);
  if (avgTrades <= 7) good.push(`You are patient: about ${Math.round(avgTrades)} trades a game. Fewer, deliberate moves usually win.`);
  if (panicCount === 0) good.push('No panic-selling lately. You held your nerve through the dips.');
  if (avgInMarket >= 0.55) good.push('You stay invested most of the time, so you catch the market’s slow upward drift.');
  if (latestDiff !== 'easy' && average(last3, (x) => x.skill) >= 20)
    good.push(`You are holding your own on ${DIFFICULTIES[latestDiff].title}, where the line is much harder to read.`);

  if (avgTrades > 9) fix.push(`You are trading a lot (about ${Math.round(avgTrades)} per game). Pick one rule, like “buy after a 1% dip, sell after a 2% rise”, and stick to it.`);
  if (panicCount > 0) fix.push(`You sold right after a drop ${panicCount} time${panicCount > 1 ? 's' : ''} recently. Try waiting an hour or two before reacting to a dip.`);
  if (avgInMarket < 0.45) fix.push('You sit in cash most of the game. Markets tend to drift upward, so try buying earlier and holding longer.');
  if (beatCount <= 1) fix.push('Buy-and-hold beat you in most recent games. Try one round where you buy on day 1 and only sell once.');

  if (!good.length) good.push('You keep coming back to practice, which is exactly how this gets easier.');
  const up = nextDifficulty(latestDiff);
  if (!fix.length) {
    fix.push(up && average(last3, (x) => x.skill) >= 30
      ? `You are ready for a challenge. Try ${DIFFICULTIES[up].title} next.`
      : 'Keep doing what you are doing, and try the other investment for variety.');
  }

  const state = trend > 4 ? 'up' : trend < -4 ? 'down' : 'flat';
  return {
    state,
    tag: { up: 'TRENDING UP', down: 'SLIPPING A LITTLE', flat: 'HOLDING STEADY' }[state],
    headline: {
      up: 'You’re getting better at this.',
      down: 'Your last few games dipped. Here’s how to fix it.',
      flat: 'You’re steady. Time to sharpen up.',
    }[state],
    summary: `Across ${results.length} games your average timing score went from ${Math.round(average(earlier, (x) => x.skill))} to ${Math.round(average(recent, (x) => x.skill))} (adjusted for difficulty, harder levels count for more).`,
    fixTitle: state === 'up' ? 'Next things to try' : 'How to improve',
    good: good.slice(0, 3),
    fix: fix.slice(0, 3),
  };
}
