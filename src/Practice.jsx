/*
 * Practice.jsx
 * The "Pretend money, real lessons" section: difficulty picker, the 10-day
 * trading game, the results popup and the Nook journal with progress reports.
 * Game maths lives in game.js; this file is only state and layout.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  DIFFICULTIES, DEMO_RESULTS, TOTAL_HOURS, START_HOUR,
  makeSeries, fetchRealSeries, formatPeriod, hintFor, scoreGame, gradeFor, lessonFor, buildReport, nextDifficulty,
  money, signedMoney, hourLabel,
} from './game';
import { GameOwl, PlainOwl, Leaf, CloseIcon, CheckIcon, WavyUnderline } from './components/Illustrations';

const DIFF_KEYS = ['easy', 'medium', 'hard'];
const DIFF_CHIP = { easy: 'fill-sage-fixed', medium: 'fill-peach', hard: 'fill-payne-fixed' };
const TICK_MS = { easy: 380, medium: 380, hard: 650 }; // hard mode plays itself: 70 hours in about 45 seconds

function newGame(diff, fund, series) {
  return {
    mode: 'play', diff, fund, series, step: START_HOUR, cash: 100, shares: 0, costBasis: 0,
    trades: [], hoursInMarket: 0, panicSells: 0,
    message: diff === 'hard' ? 'Hard mode: real prices, no pausing, no hints. Trust your plan.' : 'You have $100. Watch the line, then buy when you think it’s low.',
  };
}

/** Moves the game forward by `hours`, updating the coach message along the way. */
function advance(game, hours) {
  if (!game || game.mode !== 'play') return game;
  const P = game.series.prices;
  let { step, hoursInMarket, message } = game;
  for (let n = 0; n < hours && step < TOTAL_HOURS; n++) {
    if (game.shares > 0) hoursInMarket += 1;
    step += 1;
    const i = step - 1;
    const pct = ((P[i] - P[i - 1]) / P[i - 1]) * 100;
    if (game.diff === 'medium' && Math.abs(pct) >= 0.7) {
      message = pct > 0
        ? `Up ${pct.toFixed(1)}% that hour. Jumps like this tempt people to sell.`
        : `Down ${Math.abs(pct).toFixed(1)}% that hour. Is it a bargain, or a warning?`;
    }
    if (game.diff === 'easy' && i % 7 === 0) message = 'New day. Look at the dashed line to see where the wobble is heading.';
  }
  return { ...game, step, hoursInMarket, message };
}

/** Converts prices into SVG coordinates for the chart (800 × 260 drawing). */
function buildChart(game) {
  const { series } = game;
  const i = game.step - 1;
  const price = series.prices[i];
  const visible = series.prices.slice(0, game.step);
  const showForecast = game.diff === 'easy' && game.step < TOTAL_HOURS;
  const forecastIdx = [];
  if (showForecast) for (let j = i; j <= Math.min(TOTAL_HOURS - 1, i + 3); j++) forecastIdx.push(j);

  let lo = Math.min(...visible, ...forecastIdx.map((j) => series.smooth[j]));
  let hi = Math.max(...visible, ...forecastIdx.map((j) => series.smooth[j]));
  const pad = (hi - lo) * 0.15 + 0.5;
  lo -= pad;
  hi += pad;
  const X = (k) => 20 + k * (760 / (TOTAL_HOURS - 1));
  const Y = (v) => 240 - ((v - lo) / (hi - lo)) * 210;
  const line = visible.map((v, k) => `${X(k).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');

  return {
    price,
    line,
    area: `${line} ${X(i).toFixed(1)},250 ${X(0).toFixed(1)},250`,
    forecast: forecastIdx.map((j, n) => `${X(j).toFixed(1)},${Y(n === 0 ? price : series.smooth[j]).toFixed(1)}`).join(' '),
    showForecast,
    nowX: X(i),
    nowY: Y(price),
    hi, lo,
    markers: game.trades.map((t) => ({ ...t, left: `${(X(t.hour) / 800) * 100}%`, top: `${(Y(series.prices[t.hour]) / 260) * 100}%` })),
    move: i > 0 ? ((price - series.prices[i - 1]) / series.prices[i - 1]) * 100 : 0,
  };
}

export default function Practice({ results, onAddResult, onClearResults, isSignedIn, userEmail, onSignup, showDemo = true }) {
  const [diff, setDiff] = useState('easy');
  const [fund, setFund] = useState('VOO');
  const [game, setGame] = useState(null); // null or mode 'done' → setup screen
  const [autoPlay, setAutoPlay] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  /** Starts a game. Hard mode loads real prices from /api/prices and plays itself. */
  const start = async (level = diff) => {
    const seed = (results.length + 1) * 7919 + (Date.now() % 997);
    setShowResults(false);
    setLoadError('');
    let series;
    if (level === 'hard') {
      setLoading(true);
      try {
        series = await fetchRealSeries(fund);
      } catch (err) {
        // Keep the game playable if the market data service is down.
        setLoadError(`${err.message} Playing with practice prices instead.`);
        series = makeSeries('hard', fund, seed);
      } finally {
        setLoading(false);
      }
    } else {
      series = makeSeries(level, fund, seed);
    }
    setDiff(level);
    setGame(newGame(level, fund, series));
    setAutoPlay(level === 'hard');
  };

  /** Scores a finished game, saves it to the journal and opens the results popup. */
  const finish = useCallback((finalGame) => {
    const result = scoreGame(finalGame, finalGame.series, results.length + 1);
    onAddResult(result);
    setLastResult(result);
    setShowResults(true);
    setAutoPlay(false);
    setGame({ ...finalGame, mode: 'done' });
  }, [results, onAddResult]);

  /** Moves the clock forward. Called from button clicks and the auto-play timer. */
  const stepForward = useCallback((hours) => {
    if (game?.mode !== 'play') return;
    const next = advance(game, hours);
    if (next.step >= TOTAL_HOURS) finish(next);
    else setGame(next);
  }, [game, finish]);

  // Auto-play: each tick moves one hour and schedules the next one.
  useEffect(() => {
    if (!autoPlay || game?.mode !== 'play') return undefined;
    const id = setTimeout(() => stepForward(1), TICK_MS[game.diff]);
    return () => clearTimeout(id);
  }, [autoPlay, game, stepForward]);

  const buy = (all) => {
    setGame((g) => {
      const price = g.series.prices[g.step - 1];
      const amount = all ? g.cash : Math.min(25, g.cash);
      if (amount < 0.01) return g;
      const shares = amount / price;
      return {
        ...g,
        cash: g.cash - amount,
        shares: g.shares + shares,
        costBasis: g.costBasis + amount,
        trades: [...g.trades, { type: 'Buy', hour: g.step - 1, amount }],
        message: g.diff === 'hard' ? 'Bought.' : `Bought ${money(amount)} at ${money(price)}. That’s ${shares.toFixed(4)} shares; pieces of a share count too.`,
      };
    });
  };

  const sellAll = () => {
    setGame((g) => {
      if (g.shares <= 0) return g;
      const P = g.series.prices;
      const i = g.step - 1;
      const proceeds = g.shares * P[i];
      const gain = proceeds - g.costBasis;
      const panicked = gain < 0 && i > 0 && P[i] < P[i - 1];
      return {
        ...g,
        cash: g.cash + proceeds,
        shares: 0,
        costBasis: 0,
        panicSells: g.panicSells + (panicked ? 1 : 0),
        trades: [...g.trades, { type: 'Sell', hour: i, amount: proceeds }],
        message: g.diff === 'hard' ? 'Sold.'
          : gain >= 0 ? `Sold for ${money(proceeds)}, up ${money(gain)}. Nice timing, or a bit of luck? Usually both.`
          : `Sold for ${money(proceeds)}, down ${money(-gain)}. Selling right after a drop locks the loss in.`,
      };
    });
  };

  const playing = game?.mode === 'play';

  return (
    <section id="practice" className="section band practice">
      <div className="wrap stack-52">
        <div className="section-intro">
          <div className="grow">
            <span className="tag fill-payne">PRACTICE MODE · NO REAL MONEY</span>
            <h2 className="display practice-title">
              Pretend money, <em className="wavy accent">real lessons.<WavyUnderline /></em>
            </h2>
            <p className="lede">You get $100 and ten trading days of hourly prices. Buy when you think it's low, sell when you think it's high, and Nook keeps a journal of how you're improving.</p>
          </div>
          <div className="practice-mascot hide-sm">
            <div className="note card-s fill-duff">nobody times it perfectly. not even the pros.</div>
            <GameOwl size={110} className="wobble" />
          </div>
        </div>

        {playing ? (
          <GameBoard
            game={game}
            autoPlay={autoPlay}
            onNext={() => stepForward(1)}
            onNextDay={() => stepForward(7 - (game.step % 7) || 7)}
            onToggleAuto={() => setAutoPlay((a) => !a)}
            onQuit={() => { setAutoPlay(false); setGame(null); }}
            onBuy={buy}
            onSell={sellAll}
          />
        ) : (
          <GameSetup diff={diff} fund={fund} onDiff={setDiff} onFund={setFund} onStart={() => start()} loading={loading} error={loadError} />
        )}

        <Journal
          results={results}
          showDemo={showDemo}
          isSignedIn={isSignedIn}
          userEmail={userEmail}
          onSignup={onSignup}
          onClear={() => { onClearResults(); setLastResult(null); }}
        />
      </div>

      {showResults && lastResult && (
        <ResultsModal
          result={lastResult}
          results={results}
          onClose={() => setShowResults(false)}
          onAgain={() => start()}
          onLevelUp={() => start(nextDifficulty(lastResult.diff))}
        />
      )}
    </section>
  );
}

function GameSetup({ diff, fund, onDiff, onFund, onStart, loading, error }) {
  return (
    <div className="stack-28">
      <h3 className="step-title">1. Pick your difficulty</h3>
      <div className="diff-row">
        {DIFF_KEYS.map((key) => {
          const d = DIFFICULTIES[key];
          const selected = diff === key;
          return (
            <button
              key={key}
              type="button"
              className={`diff-card card lift ${d.fill} ${selected ? 'is-selected' : ''}`}
              style={{ transform: `rotate(${selected ? 0 : d.rotate}deg)`, marginTop: d.offset }}
              aria-pressed={selected}
              onClick={() => onDiff(key)}
            >
              <span className="diff-top">
                <span className="kicker">{d.tag}</span>
                {selected && <span className="check-badge"><CheckIcon /></span>}
              </span>
              <span className="diff-title">{d.title}</span>
              <span className="diff-desc">{d.desc}</span>
              <span className="diff-note">{d.note}</span>
            </button>
          );
        })}
      </div>
      <div className="setup-bottom">
        <div className="setup-funds">
          <h3 className="step-title small">2. Pick an investment</h3>
          {[['VOO', 'VOO · steady'], ['QQQ', 'QQQ · bumpier']].map(([key, label]) => (
            <button key={key} type="button" className={`chip chip-lg ${fund === key ? 'is-on' : ''}`} aria-pressed={fund === key} onClick={() => onFund(key)}>
              {label}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-xl" onClick={onStart} disabled={loading}>
          {loading ? 'Loading real prices…' : 'Start 10 days with $100'} <Leaf vein={false} />
        </button>
      </div>
      {error && <p className="setup-error" role="alert">{error}</p>}
    </div>
  );
}

function GameBoard({ game, autoPlay, onNext, onNextDay, onToggleAuto, onQuit, onBuy, onSell }) {
  const chart = buildChart(game);
  const hourIndex = game.step - 1;
  const day = Math.floor(hourIndex / 7) + 1;
  const value = game.cash + game.shares * chart.price;
  const profit = value - 100;
  const hint = chart.showForecast ? hintFor(game.series, hourIndex, game.shares > 0) : '';
  const d = DIFFICULTIES[game.diff];
  const isHard = game.diff === 'hard';
  const dataLabel = !isHard ? 'Practice data'
    : game.series.real ? 'Real market data · 1-hour delay · dates revealed at the end'
    : 'Practice prices (live data unavailable right now)';

  return (
    <div className="stack-24">
      <div className="board-top">
        <span className={`tag ${DIFF_CHIP[game.diff]}`}>{d.title.toUpperCase()} · {game.fund}</span>
        <span className="data-label">
          <span className={`dot ${isHard ? 'dot-peach' : 'dot-moss'}`} />
          {dataLabel}
        </span>
        <span className="grow" />
        <div className="days" role="img" aria-label={`Day ${day} of 10`}>
          {Array.from({ length: 10 }, (_, k) => k + 1).map((n) => (
            <span key={n} className={`day ${n < day ? 'is-past' : ''} ${n === day ? 'is-now' : ''}`}>{n}</span>
          ))}
        </div>
      </div>

      <div className="board">
        <div className="chart-card card">
          <div className="price-row">
            <span className="price">{money(chart.price)}</span>
            <span className={chart.move >= 0 ? 'text-up' : 'text-down'}>
              {chart.move >= 0 ? '▲' : '▼'} {Math.abs(chart.move).toFixed(2)}% this hour
            </span>
            <span className="hand time">{hourLabel(hourIndex)}</span>
          </div>

          <div className="chart-wrap">
            <svg viewBox="0 0 800 260" className="chart" role="img" aria-label={`${game.fund} practice chart, ${hourLabel(hourIndex)}, price ${money(chart.price)}`}>
              {[30, 135, 240].map((y) => <line key={y} x1="20" y1={y} x2="780" y2={y} className="grid-line" />)}
              <polygon points={chart.area} className="chart-area" />
              <polyline points={chart.line} className="chart-line" />
              {chart.showForecast && <polyline points={chart.forecast} className="chart-forecast" />}
              <line x1={chart.nowX} y1="20" x2={chart.nowX} y2="250" className="chart-now" />
              <circle cx={chart.nowX} cy={chart.nowY} r="9" className="chart-dot" />
            </svg>
            {chart.markers.map((m, k) => (
              <span key={k} className={`trade-marker ${m.type === 'Buy' ? 'is-buy' : 'is-sell'}`} style={{ left: m.left, top: m.top }}>
                {m.type === 'Buy' ? 'B' : 'S'}
              </span>
            ))}
            <span className="axis-label top">{money(chart.hi)}</span>
            <span className="axis-label bottom">{money(chart.lo)}</span>
          </div>

          {hint && (
            <div className="hint">
              <Leaf size={34} vein={false} className="wobble" />
              <span className="hand">{hint}</span>
            </div>
          )}

          <div className="controls">
            {isHard ? (
              <span className="live-note"><span className="dot dot-peach pulse" /> The market is moving. No pausing in hard mode.</span>
            ) : (
              <>
                <button type="button" className="btn btn-light" onClick={onNext}>Next hour →</button>
                <button type="button" className="btn btn-light" onClick={onNextDay}>Skip to next day ⇥</button>
                <button type="button" className={`btn ${autoPlay ? 'btn-peach' : 'btn-light'}`} aria-pressed={autoPlay} onClick={onToggleAuto}>
                  {autoPlay ? 'Pause ❚❚' : 'Auto-play ▶'}
                </button>
              </>
            )}
            <button type="button" className="link-btn push-right" onClick={onQuit}>Quit game</button>
          </div>
        </div>

        <div className="wallet-col">
          <div className="wallet card">
            <div className="row-between">
              <span className="kicker">YOUR WALLET</span>
              <span className="hand">started with $100</span>
            </div>
            <span className="wallet-value">{money(value)}</span>
            <span className={profit >= 0 ? 'text-up' : 'text-down'}>{signedMoney(profit)} so far</span>
            <div className="row-between dashed-top"><span>Cash</span><b>{money(game.cash)}</b></div>
            <div className="row-between"><span>Shares owned</span><b>{game.shares.toFixed(4)}</b></div>
            <div className="row-between dashed-bottom"><span>Trades so far</span><b>{game.trades.length}</b></div>
            <div className="trade-buttons">
              <button type="button" className="btn btn-sage" disabled={game.cash < 0.01} onClick={() => onBuy(false)}>Buy $25</button>
              <button type="button" className="btn" disabled={game.cash < 0.01} onClick={() => onBuy(true)}>Buy all</button>
              <button type="button" className="btn btn-peach" disabled={game.shares <= 0} onClick={onSell}>Sell all</button>
            </div>
          </div>
          <div className="coach">
            <PlainOwl size={56} />
            <div className="bubble bubble-bot" aria-live="polite">{game.message}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Journal({ results, showDemo, isSignedIn, userEmail, onSignup, onClear }) {
  const usingDemo = results.length === 0 && showDemo;
  const list = usingDemo ? DEMO_RESULTS : results;
  const report = list.length >= 3 ? buildReport(list) : null;
  const remaining = 3 - list.length;

  return (
    <div id="journal" className="stack-28 journal">
      <div className="journal-head">
        <h3 className="display journal-title">Your Nook <em className="accent">journal.</em></h3>
        <div className="journal-badges">
          {usingDemo && <span className="pill-dashed">Demo games shown. Yours replace them after your first game.</span>}
          {isSignedIn
            ? <span className="pill fill-sage"><CheckIcon size={14} /> Saved to {userEmail}</span>
            : <button type="button" className="btn btn-peach btn-sm" onClick={onSignup}>Sign up to keep your journal →</button>}
        </div>
      </div>

      {!report ? (
        <div className="journal-empty">
          <PlainOwl size={64} sleepy />
          <span>
            {list.length === 0
              ? 'No games yet. Finish a game and Nook starts your journal. After 3 games you get a full progress report.'
              : `Nice start! Play ${remaining} more game${remaining > 1 ? 's' : ''} to unlock your progress report.`}
          </span>
        </div>
      ) : (
        <div className="journal-grid">
          <div className={`report card report-${report.state}`}>
            <span className="pill-outline">{report.tag}</span>
            <h4 className="report-headline">{report.headline}</h4>
            <p>{report.summary}</p>
            <div className="report-lists">
              <div>
                <b className="hand list-title">What you're doing well</b>
                {report.good.map((item) => <div key={item} className="leaf-item"><span className="leaf-bullet moss" />{item}</div>)}
              </div>
              <div>
                <b className="hand list-title">{report.fixTitle}</b>
                {report.fix.map((item) => <div key={item} className="leaf-item"><span className="leaf-bullet peach" />{item}</div>)}
              </div>
            </div>
          </div>

          <div className="journal-side">
            <div className="score-chart">
              <div className="row-between"><b>Timing score by game</b><span className="muted small">100 = perfect timing</span></div>
              <div className="bars" role="img" aria-label={`Timing scores: ${list.slice(-8).map((r) => `#${r.n} ${r.skill}`).join(', ')}`}>
                {list.slice(-8).map((r) => (
                  <div key={r.n} className="bar-col">
                    <span className="bar-value">{r.skill}</span>
                    <span className={`bar ${DIFF_CHIP[r.diff]}`} style={{ height: `${Math.max(6, r.skill)}%` }} />
                  </div>
                ))}
              </div>
              <div className="legend">
                <span><i className="fill-sage-fixed" />Easy</span>
                <span><i className="fill-peach" />Medium</span>
                <span><i className="fill-payne-fixed" />Hard</span>
              </div>
            </div>

            <div>
              <b>Past games</b>
              {list.slice(-5).reverse().map((r) => (
                <div key={r.n} className="game-row">
                  <span className="game-num">#{r.n}</span>
                  <span className={`mini-tag ${DIFF_CHIP[r.diff]}`}>{DIFFICULTIES[r.diff].title}</span>
                  <span>{r.fund}</span>
                  <b className="push-right">{money(r.final)}</b>
                  <span className="muted">{r.beatHold ? 'beat hold' : 'hold won'}</span>
                </div>
              ))}
            </div>
            {results.length > 0 && <button type="button" className="link-btn" onClick={onClear}>Clear my journal</button>}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultsModal({ result, results, onClose, onAgain, onLevelUp }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const values = [result.final, result.hold, result.perfect];
  const min = Math.min(...values) - 1.5;
  const max = Math.max(...values);
  const bars = [
    ['You', result.final, 'bar-ink'],
    ['Buy once & hold', result.hold, 'bar-moss'],
    ['Perfect timing', result.perfect, 'bar-peach'],
  ];
  const report = results.length >= 3 ? buildReport(results) : null;
  const left = 3 - results.length;
  const tip = report ? report.fix[0] : left > 0 ? `play ${left} more game${left > 1 ? 's' : ''} to unlock your progress report` : '';
  const next = nextDifficulty(result.diff);

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal card pop" role="dialog" aria-modal="true" aria-labelledby="results-title">
        <button type="button" className="close-btn" aria-label="Close results" onClick={onClose}><CloseIcon /></button>
        <div className="modal-head">
          <GameOwl size={88} />
          <div>
            <span className="hand modal-kicker">market closed · {DIFFICULTIES[result.diff].title.toLowerCase()} · {result.fund}</span>
            <h2 id="results-title" className="modal-title">{gradeFor(result.skill)}</h2>
          </div>
        </div>
        <div className="final-row">
          <span className="final-value">{money(result.final)}</span>
          <span className={result.final >= 100 ? 'text-up big' : 'text-down big'}>{signedMoney(result.final - 100)}</span>
        </div>
        <div className="compare-bars">
          {bars.map(([label, v, cls]) => (
            <div key={label} className="compare-bar">
              <span className="compare-label">{label}</span>
              <span className="compare-track"><span className={cls} style={{ width: `${((v - min) / (max - min)) * 100}%` }} /></span>
              <span className="compare-value">{money(v)}</span>
            </div>
          ))}
        </div>
        <div className="pill-row">
          <span className="pill fill-sage">Timing score {result.skill}/100</span>
          <span className="pill fill-card">{result.trades} trades</span>
          <span className="pill fill-card">Invested {Math.round(result.inMarket * 100)}% of the time</span>
        </div>
        {result.period && (
          <div className="reveal fill-payne-fixed">
            <span className="kicker">THE BIG REVEAL</span>
            <span>This was real {result.fund}, {formatPeriod(result.period)}.</span>
          </div>
        )}
        <p className="modal-text">{lessonFor(result)}</p>
        {tip && <div className="note card-s fill-peach tilt-right">{tip}</div>}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onAgain}>Play again</button>
          {next && result.skill >= 30 && (
            <button type="button" className="btn btn-peach" onClick={onLevelUp}>Try {DIFFICULTIES[next].title} →</button>
          )}
          <a href="#journal" className="text-link" onClick={onClose}>See my journal</a>
        </div>
      </div>
    </div>
  );
}
