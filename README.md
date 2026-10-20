# Nook 🦉

**There's more to money than meets the owl.**

Nook is an interactive investing-education site for high school and college students. Instead of telling people what to buy, it helps beginners understand what they're looking at and practice with pretend money before they ever risk real money.

🏆 **Winner, T. Rowe Price NextGen Finance Innovation Challenge, Technica 2026**

**Live site:** [owlaboutthebenjamins.us](https://owlaboutthebenjamins.us)

## Features

- **Pretend money, real lessons:** a stock-market practice game. You start with $100, watch 10 trading days of hourly prices for an index fund (VOO or QQQ), and decide when to buy and sell.
  - **Easy:** smooth, predictable price swings with a forecast line and hints.
  - **Medium:** market-like volatility with no forecast line.
  - **Hard (in progress):** designed to replay real hourly prices from the past month with a one-hour delay, playing on its own with no pausing or hints.
  - After each game, Nook compares your result to buying and holding and to a perfect-timing score, and tracks your trades and progress over time.
- **Ask Nook anything:** a chatbot powered by the Google Gemini API that explains stocks, funds, and financial terms in plain language.
- **Scary words, translated:** plain-English explanations of terms like ETF, expense ratio, dividend, and diversification.
- **Fund explorer:** see what's inside a fund and what a given amount might grow to.
- **Accounts:** sign up to save your game history with Supabase, or play as a guest with progress saved in the browser.
- **Personal touches:** a customizable owl avatar and a light/dark mode toggle.

## Tech stack

- **Frontend:** React 19, Vite, JavaScript, CSS
- **Backend:** Vercel serverless functions (`api/`)
- **AI:** Google Gemini API
- **Auth and database:** Supabase with row-level security
- **Market data (Hard mode, in progress):** Alpaca market data API
- **Hosting:** Vercel

## Run it locally

```bash
npm install
npm run dev
```

Create a `.env` file with:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

The chatbot and Hard mode run as Vercel serverless functions and need these server-side environment variables:

```
GEMINI_API_KEY=...
ALPACA_KEY_ID=...
ALPACA_SECRET_KEY=...
```

## Project layout

```
api/ask.js              Gemini chatbot endpoint
src/App.jsx             main page and sections
src/Practice.jsx        the stock-market practice game
src/game.js             price generation, scoring, and progress report
src/prices.js           Hard mode's real-price endpoint (Alpaca, in progress)
src/storage.js          Supabase + guest localStorage saving
src/components/         owl avatar, owl maker, and illustrations
```

## My role

I designed and built the React user interface (layouts, branding, and the light/dark mode toggle) and developed the backend for the stock-market game and the Gemini chatbot integration.

Built at Technica 2026 with a team of four.
