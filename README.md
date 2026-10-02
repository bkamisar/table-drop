# Table Drop 🍽️

**Know the exact second the hardest tables open.**

Table Drop counts down to the moment a restaurant releases reservations, tells you which
night that drop unlocks, and sends you straight to the official booking page. That's all it
does — **it never books anything for you.**

> The live site is linked in this repository's **About** section.

## What it does

- **Countdowns to the drop.** Add a restaurant, and Table Drop works out when its next
  reservations open — in the restaurant's own time zone, so a Paris 9 AM drop is correct
  wherever you are.
- **Pick your night.** Choose the date you want to eat and the countdown retargets to the exact
  moment *that* night's tables unlock. Set one date for a whole city at once (handy for a trip).
- **One click to the booking page.** The button opens the restaurant's official booking page,
  pre-set to your date (and a party of two on sites that accept it in the link).
- **Calendar alerts.** "Add to calendar" downloads a calendar event at the drop time with an
  alert 5 minutes before — works on any phone or computer.
- **Any city.** Add restaurants anywhere; pick the restaurant's time zone and Table Drop does
  the rest.

## How it stays within booking-site rules

Reservation platforms (Resy, Tock, OpenTable, SevenRooms, Zenchef and others) prohibit
automated booking and scraping in their terms of service. Table Drop doesn't do either:

- It **never contacts a booking platform by itself** — no scraping, no polling, no availability
  checks. It does date arithmetic on rules that people enter.
- It **never books, holds, or confirms** a table. You open the official page and book as a
  person.
- Booking links are checked against a short allow-list of real booking-platform domains, and
  only `https` links are ever opened.

### Why a drop rule is measured, not read off the website

Venues say things like "reservations open 30 days in advance," but count that differently: some
count today as day one, some don't. So the number on the page can be off by one. Table Drop
asks for something you can *see*: **the furthest date you can book right now**. From that and the
stated release time it works out the true window. The **Verify** tab walks through a list one
restaurant at a time (about 30 seconds each) and stamps each one **✓ verified** with the month
it was checked. The built-in starter list contains only restaurants that were verified first-hand
this way. Verification is done by people looking at the booking page — never by software.

## Privacy

- **No accounts, no backend, no analytics.** The website is static files. Your list is saved only
  in **your own browser** and never leaves your device. (As with any website, the host — GitHub
  Pages — can see ordinary request logs for the page itself.)
- Because it's stored in the browser, a list doesn't follow you between devices. Use
  **export list** / **import list** (on the My Restaurants tab) to back it up or move it. Imported
  files go through the same checks as typed entries.
- Clearing your browser's site data removes your list — export first if you want to keep it.

## Desktop version (Windows)

The same app also runs as a small local program on your own computer. It adds one thing the
website can't do: **wake-up**. For a restaurant with a target date, it can schedule Windows to
wake your laptop **3 minutes before** that night's reservations open and open the app, so you're
ready when your own alarm goes off. (Leave the laptop asleep, not shut down, ideally plugged in,
with "Allow wake timers" enabled in Windows power settings. `Test wake-up.bat` schedules a test
wake about 5 minutes out so you can try it safely.)

1. Install [Node.js](https://nodejs.org) (LTS).
2. Double-click **`Start Table Drop.bat`** (the first run installs and builds; it opens the
   app in your browser at `http://127.0.0.1:4173`).
3. To stop it, close the small "Table Drop server" window.

The server listens only on your own machine (`127.0.0.1`) — nothing is exposed to the network.
Your list is stored at `~/.reservation-tool/store.json` (override with `RESERVATION_STORE`).

## Development

```bash
npm install
npm test            # unit tests
npm run app         # build + run the desktop app
npm run build:web   # build the static website into dist-web/
```

- `src/core/` — the drop-rule engine, validation, and data model (shared by both versions)
- `src/renderer/` — the React interface; talks to a swappable data source
  (`sources/server.ts` for desktop, `sources/browser.ts` for the website)
- `src/server/` — the desktop app's local server and Windows wake-up scheduling
- `scripts/export-starter.ts` — builds the website's built-in list from **verified**
  restaurants only
- Pushing to `main` deploys the website to GitHub Pages (`.github/workflows/pages.yml`).

---

Table Drop is an independent project and is **not affiliated with** Resy, Tock, OpenTable,
SevenRooms, Zenchef, or any restaurant.
