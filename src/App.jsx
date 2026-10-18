/*
 * App.jsx
 * The whole Nook page, top to bottom. App owns the shared state (time of day,
 * signed-in user, selected fund, game journal) and passes it to each section.
 * Sections: Header → Hero → Marquee → Learn → Explore → Compare → Practice → Ask → Trees → Footer
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { getTheme, getScene, themeVars, phaseOf, mix } from './theme.js';
import {
  NAV_LINKS, MARQUEE_WORDS, WORDS, WORD_CARD_STYLES, FUNDS, SECTOR_COLORS_DAY, SECTOR_COLORS_NIGHT,
  TYPES, TYPE_ORDER, TRAIL_POSITIONS, TREE_OWLS, TREES, CHAT_SUGGESTIONS, CHAT_INTRO, answerQuestion,
} from './data';
import {
  loadCycle, saveCycle, loadGuestResults, saveGuestResults,
  signUp, signIn, signOut, getCurrentUser, onAuthChange,
  loadProfile, saveProfile, loadCloudResults, addCloudResult, clearCloudResults, importGuestResults,
} from './storage';
import {
  MagnifierOwl, PlainOwl, GameOwl, TreeOwl, Leaf, WavyUnderline, PINE_PATH,
  SunIcon, MoonIcon, UserIcon, CloseIcon, MenuIcon,
} from './components/Illustrations';
import Practice from './Practice.jsx';
import LoginModal from './LoginModal';
import OwlMaker from './components/OwlMaker';
import OwlAvatar from './components/OwlAvatar';
import { normalizeOwl, useOwlCursor } from './owl';
export default function App() {
  // Read saved data once, on first render.

  const [cycle, setCycle] = useState(loadCycle);
  const [user, setUser] = useState(null);
  const [results, setResults] = useState(loadGuestResults);
  const profileTimer = useRef(null);
  const [avatar, setAvatar] = useState(null);
  const [owlMaker, setOwlMaker] = useState({ open: false, isNew: false });
  useOwlCursor(avatar);
  const [fund, setFund] = useState('VOO');
  const [activeLink, setActiveLink] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [auth, setAuth] = useState({
    open: false,
    tab: 'signup'
  });



  // Load the signed-in user's profile and saved games
  const loadAccount = useCallback(async (authUser) => {
    const [profile, cloudResults] = await Promise.all([
      loadProfile(authUser.id),
      loadCloudResults(authUser.id)
    ]);

    setUser({
      id: authUser.id,
      email: authUser.email,
      name: profile?.name ||
            authUser.user_metadata?.name ||
            'friend'
    });

    setResults(cloudResults);
    setAvatar(normalizeOwl(profile?.avatar));

    if (profile?.cycle != null) {
      setCycle(profile.cycle);
    }

    if (profile?.fund) {
      setFund(profile.fund);
    }
  }, []);

  // Check login status when Nook first opens
  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then(async (authUser) => {
        if (!active) return;

        if (authUser) {
          await loadAccount(authUser);
        } else {
          setAuth({ open: true, tab: 'signup' });
        }
      })
      .catch(console.error);

    const unsubscribe = onAuthChange((authUser) => {
      if (!active) return;

      if (authUser) {
        loadAccount(authUser).catch(console.error);
      } else {
        setUser(null);
        setResults(loadGuestResults());
        setAvatar(null);
      }
    });

    return () => {
      active = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [loadAccount]);


  const P = cycle / 100;
  const theme = useMemo(() => getTheme(P), [P]);
  const scene = useMemo(() => getScene(P), [P]);

  const changeCycle = (value) => {
    setCycle(value);
    saveCycle(value);
    if (user) {
      clearTimeout(profileTimer.current);
      profileTimer.current = setTimeout(() => saveProfile(user.id, { cycle: value }), 600);
    }
  };

  const changeFund = (key) => {
    setFund(key);
    if (user) saveProfile(user.id, { fund: key });
  };

  const addResult = useCallback((result) => {
    const next = [...results, result];
    setResults(next);
    if (user) addCloudResult(user.id, result);
    else saveGuestResults(next);
  }, [results, user]);

  const clearResults = useCallback(() => {
    setResults([]);
    if (user) clearCloudResults(user.id);
    else saveGuestResults([]);
  }, [user]);


  const goTo = (id) => {
    setActiveLink(id);
    setMenuOpen(false);
  };

  /** Called by LoginModal. Returns an error message, or nothing on success. */
  const handleAuth = async (tab, { name, email, password }) => {
    const guestGames = loadGuestResults();
    const outcome = tab === 'signup'
      ? await signUp({ name, email, password })
      : await signIn({ email, password });
    if (outcome.error) return outcome.error;
    if (outcome.needsConfirmation) return 'Almost there! Check your email for a confirmation link, then come back and log in.';
    if (guestGames.length) {
      await importGuestResults(outcome.user.id, guestGames);
      saveGuestResults([]);
    }
    await loadAccount(outcome.user);
    setAuth({ open: false, tab: 'login' });
    if (tab === 'signup') setOwlMaker({ open: true, isNew: true });
    return null;
  };
  const saveOwl = (next) => {
    setAvatar(next);
    setOwlMaker({ open: false, isNew: false });
    if (user) saveProfile(user.id, { avatar: next });
  };
  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setAvatar(null);
    setResults(loadGuestResults());
  };

  return (
    <div className={`nook ${theme.isNight ? 'is-night' : 'is-day'}`} style={themeVars(theme)}>
      <Header
        phase={phaseOf(P)}
        cycle={cycle}
        onCycle={changeCycle}
        activeLink={activeLink}
        onNavigate={goTo}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((open) => !open)}
        user={user}
        onLogin={() => setAuth({ open: true, tab: 'login' })}
        onLogout={handleSignOut} 
        avatar={avatar}
        onEditOwl={() => setOwlMaker({ open: true, isNew: false })}
      />

      <main>
        <Hero scene={scene} onPickFund={changeFund} />
        <Marquee />
        <Learn />
        <Explore fund={fund} onFund={changeFund} blend={theme.q} />
        <Compare />
        <Practice
          results={results}
          onAddResult={addResult}
          onClearResults={clearResults}
          isSignedIn={!!user}
          userEmail={user?.email}
          onSignup={() => setAuth({ open: true, tab: 'signup' })}
        />
        <AskNook fund={FUNDS[fund]} scene={scene} />
      </main>

      <TreeLine />
      <Footer />

      {owlMaker.open && (
        <OwlMaker
          initial={avatar}
          isNew={owlMaker.isNew}
          onSave={saveOwl}
          onClose={() => setOwlMaker({ open: false, isNew: false })}
        />
)}
      {auth.open && (
        <LoginModal
          initialTab={auth.tab}
          scene={scene}
          onClose={() => setAuth((a) => ({ ...a, open: false }))}
          onSubmit={handleAuth} 
        />
      )}
    </div>
  );
}

/* ================= HEADER ================= */

function CycleSlider({ id, value, onChange, phase, showLabel = true }) {
  return (
    <div className="cycle-slider">
      <SunIcon />
      <label htmlFor={id} className="sr-only">Time of day</label>
      <input id={id} type="range" min="0" max="100" value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <MoonIcon />
      {showLabel && <span className="hand phase">{phase}</span>}
    </div>
  );
}

function Header({ phase, cycle, onCycle, activeLink, onNavigate, menuOpen, onToggleMenu, user, onLogin, onLogout, avatar, onEditOwl }) {
  return (
    <header className="site-header">
      <div className="wrap header-row">
        <a href="#top" className="logo" aria-label="Nook home">
          <MagnifierOwl size={56} />
          Nook
        </a>

        <nav className="nav-pill" aria-label="Main">
          {NAV_LINKS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className={`nav-link ${activeLink === id ? 'is-active' : ''}`} onClick={() => onNavigate(id)}>
              {label}
            </a>
          ))}
        </nav>

        <span className="grow" />

        <div className="cycle-pill">
          <CycleSlider id="cycle" value={cycle} onChange={onCycle} phase={phase} />
        </div>

        {user ? (
          <div className="user-chip">
            <button type="button" className="avatar-btn" onClick={onEditOwl} aria-label="Customize your owl" title="Customize your owl">
              {avatar ? (
                <OwlAvatar avatar={avatar} size={44} crop label="Your owl" />
              ) : (
                <span className="avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
              )}
            </button>
            <span className="user-text">
              <b>Hi, {user.name.split(' ')[0]}</b>
              <button type="button" className="link-btn small" onClick={onLogout}>Log out</button>
            </span>
          </div>
        ) : (
          <button type="button" className="btn btn-light login-btn" aria-label="Log in" onClick={onLogin}>
            <UserIcon /> <span className="login-text">Log in</span>
          </button>
        )}

        <a href="#practice" className="owl-play" onClick={() => onNavigate('practice')}>
          <GameOwl size={52} />
          <span>Play the game</span>
        </a>

        <button type="button" className="menu-btn" aria-expanded={menuOpen} aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={onToggleMenu}>
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-panel">
          <div className="wrap mobile-panel-inner">
            {NAV_LINKS.map(([id, label]) => (
              <a key={id} href={`#${id}`} className={`mobile-link nav-link ${activeLink === id ? 'is-active' : ''}`} onClick={() => onNavigate(id)}>
                {label}
              </a>
            ))}
            <div className="cycle-pill mobile-cycle">
              <CycleSlider id="cycle-mobile" value={cycle} onChange={onCycle} phase={phase} />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/* ================= HERO ================= */

function Hero({ scene, onPickFund }) {
  return (
    <div id="top" className="wrap hero">
      <div className="hero-text">
        <span className="tag fill-payne">INVESTING, BUT FRIENDLY</span>
        <h1 className="hero-title">
          Money talk, minus the <em className="wavy accent">mumbo jumbo.<WavyUnderline /></em>
        </h1>
        <p className="hero-lede">Nook explains ETFs, dividends and all the other scary words in plain English, so you know what you own.</p>
        <form className="search card" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="search" className="sr-only">Search an investment</label>
          <input id="search" type="text" placeholder="Try VOO, QQQ or SPY" />
          <a className="btn" href="#explore">Look it up →</a>
        </form>
        <div className="curious">
          <b>Curious about:</b>
          <a className="chip" href="#explore" onClick={() => onPickFund('VOO')}>VOO</a>
          <a className="chip" href="#explore" onClick={() => onPickFund('QQQ')}>QQQ</a>
          <a className="chip" href="#compare">Stocks vs bonds</a>
          <a className="chip" href="#ask">Dividends</a>
        </div>
      </div>
      <HeroArches scene={scene} />
    </div>
  );
}

/** The three arch windows. Their sky, sun, moon and stars follow the time of day. */
function HeroArches({ scene }) {
  return (
    <div className="arches hide-sm">
      <div className="arch arch-left" style={{ background: scene.leftSky }}>
        <svg viewBox="0 0 200 380" aria-hidden="true">
          <g opacity={scene.starOpacity} fill="#F9E4C5">
            <circle className="twinkle" cx="40" cy="80" r="2" /><circle cx="120" cy="60" r="1.5" />
            <circle className="twinkle delay-1" cx="160" cy="140" r="1.8" /><circle cx="70" cy="170" r="1.3" />
          </g>
          <g opacity={scene.leafOpacity}>
            <path d="M26 260Q24 200 96 190Q100 258 26 260Z" fill="#1B4436" />
            <path d="M104 202Q102 132 176 130Q180 200 104 202Z" fill="#88A33B" />
            <path d="M60 134Q59 96 104 90Q106 132 60 134Z" fill="#5B758C" />
          </g>
          <g opacity={scene.fireflyOpacity} fill="#DDAD8A">
            <circle className="twinkle" cx="60" cy="300" r="2.5" />
            <circle className="twinkle delay-1" cx="150" cy="280" r="2" />
            <circle className="twinkle delay-2" cx="110" cy="320" r="2.2" />
          </g>
          <path d="M0 380V330Q100 290 200 340V380Z" fill={scene.leftHill} />
        </svg>
      </div>

      <div className="arch arch-right" style={{ background: scene.rightSky }}>
        <svg viewBox="0 0 200 450" aria-hidden="true">
          <g opacity={scene.starOpacity} fill="#F9E4C5">
            <circle cx="150" cy="70" r="1.6" /><circle className="twinkle" cx="30" cy="160" r="2" />
            <circle cx="170" cy="190" r="1.3" /><circle className="twinkle delay-2" cx="110" cy="40" r="1.8" />
          </g>
          <g opacity={scene.moonOpacity}>
            <circle cx="70" cy={scene.moonY} r="28" fill="#F9E4C5" />
            <circle cx="82" cy={scene.moonY - 10} r="25" fill={scene.rightSky} />
          </g>
          <path transform="translate(14 250) scale(1.233 1.25)" d={PINE_PATH} fill={scene.pineA} />
          <path transform="translate(96 200) scale(1.433 1.5)" d={PINE_PATH} fill={scene.pineB} />
          <path d="M0 450V390Q100 340 200 400V450Z" fill={scene.rightHill} />
        </svg>
      </div>

      <div className="arch arch-mid" style={{ background: scene.midSky }}>
        <svg viewBox="0 0 280 580" role="img" aria-label="Nook the owl inspecting a forest with a magnifying glass">
          <g opacity={scene.starOpacity} fill="#F9E4C5">
            <circle className="twinkle" cx="60" cy="90" r="2" /><circle cx="140" cy="60" r="1.5" />
            <circle cx="230" cy="110" r="1.7" /><circle className="twinkle delay-1" cx="90" cy="200" r="1.4" />
          </g>
          <circle cx="196" cy={scene.sunY} r="36" fill={scene.sun} opacity={scene.sunOpacity} />
          <path d="M0 380L90 250L150 330L205 275L280 380V580H0Z" fill={scene.mount} />
          <path d="M0 440Q80 380 160 430T280 410V580H0Z" fill={scene.hill} />
          <path transform="translate(20 360) scale(.767 .8)" d={PINE_PATH} fill={scene.pineB} />
          <path transform="translate(214 345) scale(.867 .92)" d={PINE_PATH} fill={scene.pineB} />
          <path d="M0 500Q100 450 280 490V580H0Z" fill={scene.front} />
          <MagnifierOwl x="46" y="330" width="200" height="174" />
        </svg>
      </div>

      <div className="note card-s fill-duff note-etf">ETF = a basket of lots of little investments</div>
      <div className="note card-s fill-sage note-jargon">no jargon. no judgement.</div>
      <Leaf size={34} vein={false} fill="#88A33B" className="drift drift-1" />
      <Leaf size={28} vein={false} className="drift drift-2" />
    </div>
  );
}

function Marquee() {
  const words = [...MARQUEE_WORDS, ...MARQUEE_WORDS]; // doubled so the loop is seamless
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {words.map((word, i) => (
          <span key={i} className="marquee-item">
            {word}
            <i className={i % 2 ? 'marquee-leaf moss' : 'marquee-leaf peach'} />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ================= LEARN ================= */

function Learn() {
  const [page, setPage] = useState(0);
  const cards = WORD_CARD_STYLES.map((style, i) => ({ ...style, word: WORDS[(page * 3 + i) % WORDS.length] }));

  return (
    <section id="learn" className="section learn">
      <div className="wrap">
        <div className="section-head">
          <h2 className="display">Scary words, <em className="accent">translated.</em></h2>
          <div className="section-head-side">
            <p>Nook explains each term like a friend who happens to be good with money.</p>
            <button type="button" className="btn btn-light btn-sm" onClick={() => setPage((p) => (p + 1) % 3)}>Show me three more ↻</button>
          </div>
        </div>
        <div className="word-grid">
          {cards.map(({ word: [term, def], fill, rotate, offset }) => (
            <div key={term} className={`word-card card lift ${fill}`} style={{ transform: `rotate(${rotate}deg)`, marginTop: offset }}>
              <PlainOwl size={72} className="word-owl" />
              <small className="kicker">THEY SAY</small>
              <h3>{term}</h3>
              <p>{def}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================= EXPLORE ================= */

function Explore({ fund: fundKey, onFund, blend }) {
  const [amount, setAmount] = useState(100);
  const fund = FUNDS[fundKey];
  const biggest = fund.holdings[0][1];
  const dollars = (weight) => '$' + ((weight * amount) / 100).toFixed(2);
  const riskPercent = `${(fund.risk / 5) * 100 - 10}%`;

  return (
    <section id="explore" className="section band explore">
      <div className="wrap stack-64">
        <div className="explore-top">
          <div className="explore-intro">
            <span className="tag fill-duff">EXPLORE A FUND</span>
            <div className="fund-tabs" role="group" aria-label="Choose a fund">
              {Object.values(FUNDS).map((f) => (
                <button key={f.ticker} type="button" className={`chip chip-lg ${fundKey === f.ticker ? 'is-on' : ''}`} aria-pressed={fundKey === f.ticker} onClick={() => onFund(f.ticker)}>
                  {f.ticker} · {f.nick}
                </button>
              ))}
            </div>
            <div className="ticker-row">
              <h2 className="ticker">{fund.ticker}</h2>
              <span className="nick fill-duff">{fund.nick}</span>
            </div>
            <span className="muted">{fund.name} · <b>sample data</b></span>
            <p className="fund-plain">{fund.plain}</p>
            <div className="note card-s fill-sage tilt-left">{fund.metaphor}</div>
          </div>

          <div className="arch-panel card fill-payne">
            <span className="kicker center">WHAT YOUR MONEY ACTUALLY BUYS</span>
            <h3 className="arch-title">If you put in <em>${amount}</em></h3>
            <label htmlFor="amount" className="sr-only">Amount to invest</label>
            <input id="amount" type="range" min="10" max="1000" step="10" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            <div className="holdings">
              {fund.holdings.map(([name, weight]) => (
                <div key={name} className="holding">
                  <span className="holding-name">{name}</span>
                  <span className="holding-track"><span style={{ width: `${(weight / biggest) * 100}%` }} /></span>
                  <span className="holding-value">{dollars(weight)}</span>
                </div>
              ))}
              <div className="row-between holding-others"><span>{fund.others}</span><span>{dollars(fund.otherWeight)}</span></div>
            </div>
            <span className="hand center">yearly cost to own it: about ${((fund.fee * amount) / 100).toFixed(2)}</span>
          </div>
        </div>

        <div className="facts card">
          <div className="fact">
            <small className="kicker">WHAT IT IS</small>
            <span className="fact-value">{fund.kind}</span>
            <span className="muted">{fund.kindNote}</span>
          </div>
          <div className="fact">
            <small className="kicker">YEARLY FEE</small>
            <span className="fact-value">{fund.fee.toFixed(2)}%</span>
            <span className="muted">{fund.feeNote}</span>
          </div>
          <div className="fact">
            <small className="kicker">BUMPINESS</small>
            <span className="fact-value">{fund.riskWord}</span>
            <div className="risk-scale" role="img" aria-label={`Bumpiness ${fund.risk} out of 5`}>
              <span className="risk-track" />
              <span className="risk-fill" style={{ width: riskPercent }} />
              <PlainOwl size={34} className="risk-owl" style={{ left: riskPercent }} />
            </div>
            <div className="row-between muted small"><span>calm</span><span>wild</span></div>
          </div>
          <div className="fact">
            <small className="kicker">SPREAD OUT?</small>
            <span className="fact-value">{fund.count}</span>
            <span className="muted">{fund.divNote}</span>
          </div>
        </div>

        <div className="inside">
          <div className="inside-text">
            <h3 className="sub-display">{fund.insideTitle}</h3>
            <div className="sector-bar" role="img" aria-label={`Sector mix: ${fund.sectors.map(([s, p]) => `${s} ${p}%`).join(', ')}`}>
              {fund.sectors.map(([label, pct], i) => (
                <span key={label} style={{ width: `${pct}%`, background: mix(SECTOR_COLORS_DAY[i], SECTOR_COLORS_NIGHT[i], blend) }} />
              ))}
            </div>
            <div className="sector-legend">
              {fund.sectors.map(([label, pct], i) => (
                <span key={label}>
                  <i style={{ background: mix(SECTOR_COLORS_DAY[i], SECTOR_COLORS_NIGHT[i], blend) }} />
                  <b>{label}</b> {pct}%
                </span>
              ))}
            </div>
            <p>{fund.owlNote}</p>
          </div>

          <div className="history-card card fill-sage">
            <h3>{fund.ticker} over five years</h3>
            <svg viewBox="0 0 640 220" role="img" aria-label="Illustrative chart rising over five years with a dip in the middle">
              <path d={`${fund.chartLine} L640 220 L0 220 Z`} fill="currentColor" opacity=".12" />
              <path d={fund.chartLine} fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
              <circle cx="320" cy={fund.dipY} r="9" fill="#DDAD8A" stroke="currentColor" strokeWidth="3" />
            </svg>
            <span className="small faded">Illustrative shape, not real prices</span>
            <div className="note card-s fill-peach history-note">see the wobble? dips happen. plans ride them out.</div>
          </div>
        </div>

        <div 
        className="return-band card fill-deep">
          <div>
            <b className="return-title">Feel like you understand {fund.ticker} now?</b>
            <p>Head back to your investing platform to decide at your own pace. Nook never places trades.</p>
          </div>
          <a className="btn btn-peach btn-on-dark" href="#top">Return to Investing Platform →</a>
        </div>
      </div>
    </section>
  );
}

/* ================= COMPARE ================= */

function Compare() {
  const [picks, setPicks] = useState(['broad', 'single']);
  const pick = (key) => {
    if (!picks.includes(key)) setPicks([picks[1], key]); // keep the two most recent picks
  };

  const [a, b] = picks.map((k) => TYPES[k]);
  let take;
  if (a.risk === b.risk) {
    take = `${a.name} and ${b.name} have similar bumpiness. The real difference is what’s inside and how they pay you: ${a.pays.toLowerCase()} versus ${b.pays.toLowerCase()}.`;
  } else {
    const calm = a.risk < b.risk ? a : b;
    const wild = calm === a ? b : a;
    take = `${calm.name} is the calmer ride. ${wild.name} has more growth potential but swings harder. Lots of people hold a mix, leaning calmer for money they’ll need sooner.`;
  }

  return (
    <section id="compare" className="section compare">
      <div className="wrap stack-44">
        <div className="section-intro">
          <div className="grow">
            <span className="tag fill-sage">COMPARE TYPES</span>
            <h2 className="display mt-20">Same money, <em className="accent">different trees.</em></h2>
            <p className="lede">Climb the risk trail: the higher up, the bumpier the ride. Tap any two stops to see them side by side.</p>
          </div>
          <div className="note card-s fill-duff tilt-right hide-sm">higher up = better views, more wind</div>
        </div>

        <div className="trail hide-sm">
          <svg viewBox="0 0 1200 360" aria-hidden="true">
            <path className="trail-back" d="M0 360 L0 300 C 160 260, 260 300, 420 250 S 700 230, 860 160 S 1100 120, 1200 150 L1200 360 Z" />
            <path className="trail-main" d="M0 360 L0 330 L72 315 C 160 300, 200 290, 240 280 C 320 262, 360 248, 408 235 C 480 216, 530 204, 576 200 C 640 196, 680 194, 720 190 C 800 170, 850 140, 900 120 C 980 88, 1040 56, 1080 50 C 1130 44, 1170 70, 1200 90 L1200 360 Z" />
            <path className="trail-path" transform="translate(0 14)" d="M30 322 L72 315 C 160 300, 200 290, 240 280 C 320 262, 360 248, 408 235 C 480 216, 530 204, 576 200 C 640 196, 680 194, 720 190 C 800 170, 850 140, 900 120 C 980 88, 1040 56, 1080 50" />
            <g className="trail-pines">
              {[[140, 270, 0.45], [320, 232, 0.5], [650, 172, 0.42], [980, 70, 0.4], [1150, 60, 0.42]].map(([x, y, s]) => (
                <path key={x} transform={`translate(${x} ${y}) scale(${s})`} d={PINE_PATH} />
              ))}
            </g>
            <text x="20" y="352" className="trail-label">calm</text>
            <text x="1130" y="352" className="trail-label">wild</text>
          </svg>
          {TYPE_ORDER.map((key) => {
            const [left, top] = TRAIL_POSITIONS[key];
            const on = picks.includes(key);
            return (
              <button key={key} type="button" className="pin" style={{ left: `${left}%`, top: `${top}%` }} aria-pressed={on} onClick={() => pick(key)}>
                <span className={`pin-label ${on ? 'is-on' : ''}`}>{TYPES[key].short}</span>
                <span className="pin-stem" />
                <span className="pin-dot" />
              </button>
            );
          })}
        </div>

        <div className="type-chips" role="group" aria-label="Pick two investment types">
          <b>Comparing:</b>
          {TYPE_ORDER.map((key) => (
            <button key={key} type="button" className={`chip ${picks.includes(key) ? 'is-on' : ''}`} aria-pressed={picks.includes(key)} onClick={() => pick(key)}>
              {TYPES[key].short}
            </button>
          ))}
        </div>

        <div className="versus">
          {[a, b].map((type, i) => (
            <article key={type.name} className={`side-card card ${i === 0 ? 'fill-sage side-left' : 'fill-duff side-right'}`}>
              <small className="kicker">{type.example}</small>
              <h3 className="side-title">{type.name}</h3>
              <span className="hand side-metaphor">{type.metaphor}</span>
              <div className="side-rows dashed-top">
                <div className="row-between">
                  <span>Bumpiness</span>
                  <Dots count={type.risk} shape="leaf" label={`Bumpiness ${type.risk} of 5`} />
                </div>
                <div className="row-between">
                  <span>Growth potential</span>
                  <Dots count={type.growth} shape="round" label={`Growth potential ${type.growth} of 5`} />
                </div>
                <div className="row-between"><span>Yearly fee</span><b className="right">{type.fee}</b></div>
                <div className="row-between"><span>How spread out</span><b className="right narrow">{type.spread}</b></div>
                <div className="row-between"><span>Pays you</span><b className="right narrow">{type.pays}</b></div>
              </div>
              <div className="side-notes dashed-top">
                <span><b>Good for:</b> {type.goodFor}</span>
                <span><b>Watch out:</b> {type.watchOut}</span>
              </div>
            </article>
          ))}
          <span className="vs-badge hide-sm" aria-hidden="true">vs</span>
        </div>

        <div className="take">
          <MagnifierOwl size={96} />
          <div className="take-bubble">
            <b className="hand list-title">nook’s take</b>
            <p>{take}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Dots({ count, shape, label }) {
  return (
    <span className="dots" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => <span key={n} className={`dot-${shape} ${n <= count ? 'is-full' : ''}`} />)}
    </span>
  );
}

/* ================= ASK NOOK ================= */

function AskNook({ fund, scene }) {
  const [messages, setMessages] = useState(CHAT_INTRO);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);

  // Demo Mode by default to save Gemini requests
  // const liveMode = new URLSearchParams(
  //   window.location.search
  // ).get('live') === '1';

  // If I want to use Gemini for true answers
  const liveMode = true;



  
  const send = async (text) => {
    const question = text.trim();
    if (!question || typing) return;

    const updatedMessages = [
      ...messages,
      { role: 'user', text: question }
    ];

    setMessages(updatedMessages);
    setDraft('');

    // DEMO MODE: Uses zero Gemini requests
    if (!liveMode) {
      setMessages((current) => [
        ...current,
        {
          role: 'bot',
          text: answerQuestion(question, fund)
        }
      ]);
      return;
    }

    // LIVE AI MODE: Send question to Gemini
    setTyping(true);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: updatedMessages.slice(-10),
          fundTicker: fund?.ticker ?? 'VOO'
        })
      });

      const data = await response.json();

      if (!response.ok || !data.reply) {
        throw new Error(
          data.error || 'Gemini could not answer'
        );
      }

      setMessages((current) => [
        ...current,
        { role: 'bot', text: data.reply }
      ]);

    } catch (error) {
      console.error('Gemini error:', error);

      // Use prepared answers if Gemini fails
      setMessages((current) => [
        ...current,
        {
          role: 'bot',
          text:
            'Live AI is unavailable. Here is a prepared explanation:\n\n' +
            answerQuestion(question, fund)
        }
      ]);

    } finally {
      setTyping(false);
    }
  };


  return (
    <section id="ask" className="section ask">
      <div className="wrap ask-grid">
        <div className="ask-intro">
          <h2 className="display big">Ask Nook <em className="accent">anything.</em></h2>
          <p className="lede">Silly questions welcome. Nook answers in plain words, knows which fund you were just looking at, and never tells you what to buy.</p>
          <div className="ask-art hide-sm">
            <div className="arch arch-small" style={{ background: scene.midSky }}>
              <svg viewBox="0 0 240 320" aria-hidden="true">
                <g opacity={scene.starOpacity} fill="#F9E4C5">
                  <circle className="twinkle" cx="40" cy="60" r="2" /><circle cx="190" cy="50" r="1.5" />
                  <circle className="twinkle delay-1" cx="120" cy="30" r="1.8" /><circle cx="70" cy="130" r="1.4" />
                </g>
                <circle cx="170" cy="90" r="26" fill={scene.orb} />
                <circle cx="182" cy="82" r="22" fill={scene.midSky} opacity={scene.starOpacity} />
                <path d="M0 250 Q60 210 120 236 T240 226 V320 H0Z" fill={scene.hill} />
                <path d="M20 248 L120 240 L230 236" stroke="#5B3D2A" strokeWidth="10" strokeLinecap="round" />
                <PlainOwl x="50" y="120" width="140" height="122" />
              </svg>
            </div>
            <div className="note card-s fill-duff note-awake">owls don’t sleep at night. neither does this one.</div>
          </div>
        </div>

        <div className="chat card">
          <div className="chat-head dashed-bottom">
            <PlainOwl size={52} />
            <div className="chat-name">
              <b>Nook</b>
              <span>awake all night, happy to help</span>
            </div>
            <span className="online"><span className="dot dot-moss" />online</span>
          </div>

          <div className="chat-scroll">
            <div className="chat-log" aria-live="polite">
              {messages.map((m, i) => (
                <div key={i} className={`bubble ${m.role === 'user' ? 'bubble-user' : 'bubble-bot'}`}>{m.text}</div>
              ))}
              {typing && (
                <div className="bubble bubble-bot typing" aria-label="Nook is typing">
                  <span /><span /><span />
                </div>
              )}
            </div>
          </div>

          <div className="chat-suggestions">
            {CHAT_SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="chip" onClick={() => send(s)}>{s}</button>
            ))}
          </div>

          <form className="chat-form" onSubmit={(e) => { e.preventDefault(); send(draft); }}>
            <label htmlFor="ask-input" className="sr-only">Ask a question</label>
            <input id="ask-input" type="text" placeholder="Ask in your own words…" value={draft} onChange={(e) => setDraft(e.target.value)} />
            <button type="submit" className="btn">Send</button>
          </form>
          <span className="fine-print">
          {liveMode
            ? 'LIVE GEMINI: AI responses enabled. Not financial advice.'
            : 'DEMO MODE: Prepared answers only. No Gemini requests.'}
          </span>
        </div>
      </div>
    </section>
  );
}

/* ================= TREES + FOOTER ================= */

function TreeLine() {
  const [popped, setPopped] = useState({});
  return (
    <div className="tree-line">
      <span className="hand tree-hint" aria-hidden="true">psst… someone lives in these trees</span>
      <div className="trees">
        {TREES.map(([width, direction], i) => {
          const owl = TREE_OWLS[(i * 5) % TREE_OWLS.length];
          const open = !!popped[i];
          return (
            <button
              key={i}
              type="button"
              className={`tree ${direction} ${open ? 'is-open' : ''}`}
              style={{ width }}
              aria-pressed={open}
              aria-label={open ? `Hide ${owl.name} the owl` : 'Peek at the owl in this tree'}
              onClick={() => setPopped((p) => ({ ...p, [i]: !p[i] }))}
            >
              <span className="tree-owl" style={{ width: owl.size }} aria-hidden="true">
                <span className="hoo">{owl.say}</span>
                <TreeOwl owl={owl} />
              </span>
              <svg className={`pine ${i % 2 ? 'pine-b' : 'pine-a'}`} viewBox="0 0 60 100" aria-hidden="true">
                <path d={PINE_PATH} />
              </svg>
            </button>
          );
        })}
      </div>
      <div className="ground" />
    </div>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-row">
        <span className="footer-brand">
          <PlainOwl size={58} sleepy />
          <span>Nook</span>
        </span>
        <span className="footer-text">Investing education for a brighter tomorrow. For learning only, not financial advice. Figures are sample data in this prototype.</span>
        <a href="#top" className="footer-link">← Return to Investing Platform</a>
      </div>
    </footer>
  );
}
