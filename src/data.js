/*
 * data.js
 * All the content the site shows: glossary words, fund details, investment
 * types, the tree owls, and Nook's prepared chat answers.
 * Edit text here without touching any components.
 * Fund figures are sample data for the prototype.
 */

export const NAV_LINKS = [
  ['learn', 'Learn'],
  ['explore', 'Explore'],
  ['compare', 'Compare'],
  ['practice', 'Practice'],
  ['ask', 'Ask Nook'],
];

export const MARQUEE_WORDS = ['ETF', 'dividend', 'expense ratio', 'index fund', 'diversification', 'bonds'];

export const WORDS = [
  ['Expense ratio', 'The small yearly fee a fund takes for running itself. Lower is nicer to your wallet.'],
  ['Dividend', 'A thank-you payment some companies send to the people who own a piece of them.'],
  ['Diversified', 'Not putting all your eggs in one basket. If one wobbles, the others hold steady.'],
  ['Index fund', 'A fund that copies a list, like the S&P 500, instead of paying someone to pick winners.'],
  ['Volatility', 'How bumpy the ride is. High volatility means bigger swings, up and down.'],
  ['Bond', 'An IOU. You lend money to a government or company and they pay you back with interest.'],
  ['Market cap', 'A company’s total price tag: share price times the number of shares.'],
  ['Bear market', 'When prices fall about 20% or more from a recent high. They end, but feel long.'],
  ['Compounding', 'Earning returns on your returns. Slow at first, then surprisingly fast.'],
];

/* How the three glossary cards are coloured and tilted. */
export const WORD_CARD_STYLES = [
  { fill: 'fill-payne', rotate: -2, offset: 0 },
  { fill: 'fill-duff', rotate: 1.5, offset: 28 },
  { fill: 'fill-sage', rotate: -1, offset: 0 },
];

export const FUNDS = {
  VOO: {
    ticker: 'VOO', nick: 'Steady Eddie', name: 'Vanguard S&P 500 ETF',
    plain: 'A slice of about 500 of the biggest U.S. companies, all in one go.',
    metaphor: 'think: the whole neighborhood, not just one house',
    kind: 'Index fund', kindNote: 'It copies the S&P 500 list instead of paying someone to pick stocks.',
    fee: 0.03, feeNote: 'About 3 cents a year for every $100. Very low.',
    risk: 3, riskWord: 'Medium',
    count: '~500 companies', divNote: 'Every major industry. One stumble won’t sink it.',
    holdings: [['Nvidia', 7], ['Microsoft', 6], ['Apple', 6], ['Amazon', 4], ['Meta', 3]],
    others: '~495 others', otherWeight: 74,
    sectors: [['Tech', 33], ['Financials', 13], ['Health care', 10], ['Consumer', 10], ['Everything else', 34]],
    insideTitle: 'Mostly tech, with a bit of everything.',
    owlNote: 'Bigger companies take up more room, so a handful of tech giants have a big say in how VOO moves.',
    chartLine: 'M0 190 L60 180 L120 150 L170 160 L230 120 L280 130 L320 170 L370 150 L420 140 L480 100 L540 70 L600 40 L640 28',
    dipY: 170,
    riskAnswer: 'VOO moves with the whole U.S. stock market. In 2022 it fell roughly 18%, then recovered over time. Because it holds about 500 companies, one company failing won’t sink it.',
  },
  QQQ: {
    ticker: 'QQQ', nick: 'Tech-curious', name: 'Invesco QQQ Trust',
    plain: '100 big non-financial companies on the Nasdaq. More tech, more zip, bumpier ride.',
    metaphor: 'think: the tallest trees in the forest. great views, more wind',
    kind: 'Index fund', kindNote: 'It copies the Nasdaq-100 list instead of paying someone to pick stocks.',
    fee: 0.2, feeNote: 'About 20 cents a year for every $100. Still low.',
    risk: 4, riskWord: 'Medium-high',
    count: '~100 companies', divNote: 'Spread across companies, but about half is tech.',
    holdings: [['Nvidia', 9], ['Microsoft', 8], ['Apple', 8], ['Amazon', 5], ['Broadcom', 5]],
    others: '~95 others', otherWeight: 65,
    sectors: [['Tech', 50], ['Communication', 16], ['Consumer', 14], ['Health care', 6], ['Everything else', 14]],
    insideTitle: 'Heavy on tech and the internet giants.',
    owlNote: 'When tech has a great year QQQ usually beats the broad market. When tech struggles, it usually falls further.',
    chartLine: 'M0 196 L60 170 L120 140 L170 160 L230 100 L280 120 L320 186 L370 150 L420 130 L480 80 L540 60 L600 30 L640 18',
    dipY: 186,
    riskAnswer: 'QQQ swings more than a broad fund like VOO because it leans heavily on tech. In 2022 it fell roughly a third. It still holds about 100 companies, so one stumble won’t sink it.',
  },
};

/* Sector bar colours for day and night; they blend with the slider. */
export const SECTOR_COLORS_DAY = ['#1B4436', '#88A33B', '#DDAD8A', '#5B758C', '#D6DFC8'];
export const SECTOR_COLORS_NIGHT = ['#9DBBDB', '#5B8FCB', '#DDAD8A', '#3D5E86', '#22395C'];

/* Compare section: stops on the risk trail, from calm to wild. */
export const TYPE_ORDER = ['savings', 'bonds', 'dividend', 'broad', 'intl', 'tech', 'single'];

/* [left %, top %] of each pin on the mountain drawing. */
export const TRAIL_POSITIONS = {
  savings: [6, 82], bonds: [20, 73], dividend: [34, 61], broad: [48, 52], intl: [60, 49], tech: [75, 31], single: [90, 12],
};

export const TYPES = {
  savings: { name: 'Savings account', short: 'Savings', example: 'E.G. HIGH-YIELD SAVINGS', risk: 1, growth: 1, metaphor: 'the nest: safe and cozy, grows slowly', fee: 'None', spread: 'Not invested in companies', pays: 'Interest', goodFor: 'emergency money and anything you’ll need in the next year or two.', watchOut: 'inflation can quietly grow faster than your interest.' },
  bonds: { name: 'Bond fund', short: 'Bonds', example: 'E.G. BND', risk: 2, growth: 2, metaphor: 'the riverbed: steady, slow-moving', fee: 'Very low', spread: 'Thousands of loans to governments and companies', pays: 'Regular interest', goodFor: 'smoothing out the bumps when you also own stocks.', watchOut: 'when interest rates rise, bond prices can dip for a while.' },
  dividend: { name: 'Dividend ETF', short: 'Dividend fund', example: 'E.G. SCHD', risk: 3, growth: 3, metaphor: 'the orchard: drops fruit you can collect', fee: 'Very low', spread: 'About 100 established, profitable companies', pays: 'Dividends, usually every quarter', goodFor: 'people who like regular cash payouts.', watchOut: 'it leans on certain industries, so it can lag when tech booms.' },
  broad: { name: 'Broad index ETF', short: 'Index fund', example: 'E.G. VOO', risk: 3, growth: 4, metaphor: 'the whole forest, not one tree', fee: 'Very low (0.03%)', spread: 'About 500 large U.S. companies', pays: 'Small dividends', goodFor: 'a simple, long-term foundation.', watchOut: 'it still falls when the whole market falls.' },
  intl: { name: 'International ETF', short: 'International', example: 'E.G. VXUS', risk: 3, growth: 3, metaphor: 'forests on other continents', fee: 'Very low', spread: 'Thousands of companies outside the U.S.', pays: 'Small dividends', goodFor: 'not betting everything on one country.', watchOut: 'currency swings can help or hurt your returns.' },
  tech: { name: 'Tech-heavy ETF', short: 'Tech fund', example: 'E.G. QQQ', risk: 4, growth: 5, metaphor: 'the tallest trees: great views, more wind', fee: 'Low (0.20%)', spread: 'About 100 companies, roughly half tech', pays: 'Very small dividends', goodFor: 'people okay with bigger swings for more growth potential.', watchOut: 'it can drop much harder than the broad market.' },
  single: { name: 'Single stock', short: 'Single stock', example: 'E.G. ONE COMPANY LIKE APPLE', risk: 5, growth: 5, metaphor: 'one tree: if it falls, it all falls', fee: 'No yearly fee', spread: 'Just one company', pays: 'Depends on the company', goodFor: 'learning one company deeply, with money you can afford to see swing.', watchOut: 'one bad news day can knock off 20% or more.' },
};

/* The six little owls hiding in the footer trees. */
export const TREE_OWLS = [
  { name: 'Nook', body: '#88A33B', belly: '#F9E4C5', tufts: false, eyes: 'open', glasses: false, say: 'hoo!', size: 46 },
  { name: 'Snooze', body: '#5B758C', belly: '#D6DFC8', tufts: false, eyes: 'sleepy', glasses: false, say: 'zzz…', size: 44 },
  { name: 'Professor', body: '#DDAD8A', belly: '#FFFAF1', tufts: false, eyes: 'open', glasses: true, say: 'diversify!', size: 48 },
  { name: 'Tufts', body: '#7A5C46', belly: '#F9E4C5', tufts: true, eyes: 'open', glasses: false, say: 'who, me?', size: 50 },
  { name: 'Winky', body: '#A9BE5E', belly: '#FFFAF1', tufts: false, eyes: 'wink', glasses: false, say: 'buy low ;)', size: 44 },
  { name: 'Pip', body: '#F3D7B0', belly: '#FFFAF1', tufts: true, eyes: 'open', glasses: false, say: 'peep', size: 34 },
];

/* [tree width in px, which way its owl pops out] */
export const TREES = [
  [70, 'up'], [52, 'right'], [86, 'up'], [60, 'left'], [78, 'up'], [48, 'right'], [92, 'up'],
  [58, 'left'], [80, 'up'], [50, 'right'], [88, 'up'], [62, 'left'], [74, 'up'],
];

export const CHAT_SUGGESTIONS = ['VOO vs QQQ', 'Is $100 enough to start?', 'What fees will I pay?', 'How risky is it?'];

export const CHAT_INTRO = [
  { role: 'user', text: 'What does an ETF actually mean?' },
  { role: 'bot', text: 'Picture a fruit basket. Instead of buying one apple, you buy a basket with lots of fruit in it, and it trades like a single share.' },
];

/**
 * Nook's prepared answers for the prototype.
 * In production, replace this with a call to your AI backend and pass the
 * current fund's data along so answers are grounded in real numbers.
 */
export function answerQuestion(question, fund) {
  const s = question.toLowerCase();
  const has = (...words) => words.some((w) => s.includes(w));

  if (has('should i', 'worth it', 'good investment', 'recommend', 'which one should'))
    return 'That one’s yours to decide, and it depends on your goals, when you’ll need the money, and how you feel about bumps. What I can do is lay out the trade-offs. Want me to compare two options, or explain what makes one riskier?';
  if ((has('voo') && has('qqq')) || has(' vs ', 'versus', 'difference between'))
    return 'VOO holds about 500 big U.S. companies across every industry and costs 0.03% a year. QQQ holds about 100 on the Nasdaq, leans heavily toward tech and costs 0.20%. QQQ’s ride is usually bumpier, in both directions.';
  if (has('etf'))
    return 'Picture a fruit basket. Instead of buying one apple, you buy a basket with lots of fruit in it, and the whole basket trades like a single share.';
  if (has('dividend'))
    return 'A dividend is a slice of a company’s profit paid out to the people who own its shares, often every few months. Not every company pays one, and they can be cut in tough times.';
  if (has('expense', 'fee', 'cost'))
    return `${fund.ticker}’s yearly fee is ${fund.fee.toFixed(2)}%, about ${Math.round(fund.fee * 100)} cents a year for every $100. It’s taken out automatically, so you never get a bill.`;
  if (has('bond'))
    return 'A bond is an IOU. You lend money to a government or company, and they pay you interest and give the money back later. Bond funds bundle thousands of these, so they tend to move more gently than stocks.';
  if (has('index'))
    return 'An index is just a list, like “the 500 biggest U.S. companies.” An index fund buys everything on the list, so nobody is guessing which stocks will win. That’s also why the fees are low.';
  if (has('risk', 'crash', 'lose', 'safe', 'drop'))
    return `${fund.riskAnswer} Money you need soon belongs somewhere calmer; money you won’t touch for years can ride the bumps.`;
  if (has('start', 'begin', 'first'))
    return 'Start by deciding what the money is for and when you’ll need it. Then explore a broad, low-fee fund, try the practice game to feel the ups and downs, and ask me anything along the way.';
  if (has('100', 'little money', 'small amount', 'fraction'))
    return 'Yes, $100 is plenty to start. Many platforms let you buy fractions of a share, so even if one share costs $500, your $100 buys a fifth of it and you still own a sliver of every company inside.';
  if (has('compound'))
    return 'Compounding is earning returns on your returns. If $100 grows to $107, next year you’re growing $107, not $100. Slow at first, then surprisingly fast.';
  if (has('diversif'))
    return 'Diversification means not putting all your eggs in one basket. If one company wobbles, the others can hold things steady.';
  if (/^(hi|hey|hello)\b/.test(s))
    return 'Hi! Ask me what a word means, what’s inside a fund, or how two investments compare. I’m up all night.';
  return 'Good question. In the full version I’d answer that using real fund data. For now, try asking about ETFs, dividends, fees, bonds, risk, or how to start.';
}
