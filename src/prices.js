/*
 * api/prices.js  →  GET /api/prices?symbol=VOO
 *
 * Hard mode's backend. Runs on the server (a Vercel Function), never in the browser,
 * so the Alpaca API keys stay secret.
 *
 * How it works:
 *  1. About once an hour it downloads the last ~6 weeks of hourly prices for VOO and QQQ
 *     from Alpaca, stopping one hour before "now" (the one-hour delay).
 *  2. It groups them into trading days of 7 hourly prices (9–10 AM through 3–4 PM, New York time).
 *  3. Each request picks a random run of 10 trading days from the past month and returns
 *     70 prices plus the dates, so every game is different.
 */

const SYMBOLS = ['VOO', 'QQQ'];
const MARKET_HOURS = [9, 10, 11, 12, 13, 14, 15]; // hour each bar starts, New York time
const DAYS_PER_GAME = 10;
const LOOKBACK_CALENDAR_DAYS = 31; // "a random time within a month"
const DELAY_MS = 60 * 60 * 1000; // newest price is at least one hour old
const REFRESH_MS = 60 * 60 * 1000; // re-download the pool once an hour

// Kept in memory between requests while the function stays warm.
let pool = null; // { fetchedAt, days: { VOO: [{ date, prices }], QQQ: [...] } }

/** Converts a UTC timestamp to its New York date (YYYY-MM-DD) and hour (0–23). */
const nyTime = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
});
function toNewYork(iso) {
  const parts = Object.fromEntries(nyTime.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

/** Downloads hourly bars from Alpaca's market data API (free plan uses the IEX feed). */
async function downloadBars() {
  const end = new Date(Date.now() - DELAY_MS);
  // Extra days at the start so a game that begins a month ago still has 10 trading days to play.
  const start = new Date(end.getTime() - (LOOKBACK_CALENDAR_DAYS + 16) * 24 * 60 * 60 * 1000);
  const bars = Object.fromEntries(SYMBOLS.map((s) => [s, []]));
  let pageToken = null;

  do {
    const url = new URL('https://data.alpaca.markets/v2/stocks/bars');
    url.searchParams.set('symbols', SYMBOLS.join(','));
    url.searchParams.set('timeframe', '1Hour');
    url.searchParams.set('start', start.toISOString());
    url.searchParams.set('end', end.toISOString());
    url.searchParams.set('feed', 'iex');
    url.searchParams.set('adjustment', 'all');
    url.searchParams.set('limit', '10000');
    if (pageToken) url.searchParams.set('page_token', pageToken);

    const res = await fetch(url, {
      headers: {
        'APCA-API-KEY-ID': process.env.ALPACA_KEY_ID,
        'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
      },
    });
    if (!res.ok) throw new Error(`Alpaca responded ${res.status}: ${await res.text()}`);
    const data = await res.json();
    for (const symbol of SYMBOLS) bars[symbol].push(...(data.bars?.[symbol] ?? []));
    pageToken = data.next_page_token;
  } while (pageToken);

  return bars;
}

/** Turns a list of hourly bars into full trading days of 7 closing prices each. */
function groupIntoDays(bars) {
  const byDate = new Map();
  for (const bar of bars) {
    const { date, hour } = toNewYork(bar.t);
    if (!MARKET_HOURS.includes(hour)) continue; // skip pre-market and after-hours
    if (!byDate.has(date)) byDate.set(date, new Map());
    byDate.get(date).set(hour, bar.c);
  }

  const today = toNewYork(new Date().toISOString()).date;
  const days = [];
  for (const [date, hours] of [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (hours.size < 5) continue; // half days and thin data
    if (date === today && hours.size < MARKET_HOURS.length) continue; // today isn't finished yet
    // Fill the odd missing hour with the previous price so every day has exactly 7.
    let last = hours.get(MARKET_HOURS.find((h) => hours.has(h)));
    const prices = MARKET_HOURS.map((h) => (last = hours.get(h) ?? last));
    days.push({ date, prices: prices.map((p) => Math.round(p * 100) / 100) });
  }
  return days;
}

/** Returns the cached pool, refreshing it if it is more than an hour old. */
async function getPool() {
  if (pool && Date.now() - pool.fetchedAt < REFRESH_MS) return pool;
  try {
    const bars = await downloadBars();
    pool = {
      fetchedAt: Date.now(),
      days: Object.fromEntries(SYMBOLS.map((s) => [s, groupIntoDays(bars[s])])),
    };
  } catch (err) {
    if (!pool) throw err; // nothing to fall back on
    console.error('Refresh failed, serving the previous pool:', err);
  }
  return pool;
}

export async function GET(request) {
  const symbol = (new URL(request.url).searchParams.get('symbol') || 'VOO').toUpperCase();
  if (!SYMBOLS.includes(symbol)) {
    return Response.json({ error: 'Only VOO and QQQ are available for now.' }, { status: 400 });
  }

  try {
    const days = (await getPool()).days[symbol];

    // A game may start on any trading day in the past month that still leaves 10 days to play.
    const monthAgo = new Date(Date.now() - LOOKBACK_CALENDAR_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const lastStart = days.length - DAYS_PER_GAME;
    const starts = [];
    for (let i = 0; i <= lastStart; i++) if (days[i].date >= monthAgo) starts.push(i);
    if (!starts.length) {
      return Response.json({ error: 'Not enough recent trading days yet.' }, { status: 503 });
    }

    const first = starts[Math.floor(Math.random() * starts.length)];
    const window = days.slice(first, first + DAYS_PER_GAME);

    return Response.json(
      {
        symbol,
        prices: window.flatMap((d) => d.prices), // 70 hourly prices, oldest first
        from: window[0].date,
        to: window[window.length - 1].date,
        delay: '1 hour',
      },
      { headers: { 'Cache-Control': 'no-store' } }, // every game gets a fresh random window
    );
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Couldn’t load real prices right now.' }, { status: 502 });
  }
}
