# Billio

**Billio** is a small self-hosted app for tracking your recurring household charges and subscriptions (rent, electricity, insurance, internet box, VOD, music, and so on).

The idea: a single page that answers the question *"how much do I really pay every month?"*, with quarterly and yearly charges automatically smoothed back to a monthly figure.

![Billio dashboard](docs/dashboard.png)

## What it's for

- Keep all your recurring payments in one place.
- See your **smoothed monthly cost** at a glance (quarterly and yearly charges are spread evenly across months) along with the **total yearly cost**.
- Split expenses across several *accounts* (for example "Shared", "Me", "Partner") and compare totals.
- Pause a subscription temporarily without deleting it (handy for free trials or holidays).

## Features

- **Dashboard** with a per-account summary: number of subscriptions, number of charges, monthly, quarterly, yearly and smoothed totals.
- **Charts**: monthly breakdown by account (pie), subscriptions vs charges by account (bars), overall subscription/charge share (donut).
- **Filterable list** of entries: by account, by type (subscription / charge), by periodicity (monthly / quarterly / yearly), by status (active / inactive).
- **Customisable accounts**: name, colour, display order.
- **Bilingual interface**: English and French, switchable any time from the settings.
- **Multi-currency**: pick from EUR, USD, GBP, CHF, CAD, AUD or JPY; each amount renders in its native format (e.g. `1 234,56 €` for euros, `$1,234.56` for US dollars).
- **Responsive**: comfortable to use on a phone.
- **Secure sign-in**: a single login, hashed password, signed session cookies.

## Getting started

Billio is self-hosted: you install it on your own machine or a small server, and access it from your browser.

Requirements: **Node.js 20 or newer**.

```sh
cp .env.example .env
# Set APP_SESSION_SECRET in .env
# You can generate one with: openssl rand -hex 32

npm install
npm run build
npm run preview
```

The app is then reachable at `http://localhost:4173` (or the port shown in the console).

For long-term use, run the compiled build behind a reverse proxy (nginx, Caddy, Traefik, etc.) with HTTPS in front.

### First sign-in

Default credentials:

- **Login**: `admin`
- **Password**: `admin`

You'll be **forced to change them** on first sign-in. Pick a password of at least 8 characters.

## Using Billio

1. **Create your accounts** in *Settings → Accounts*. An account groups related expenses (per household, per person, per project, and so on). Each account has a colour that's reused in the charts.
2. **Add your entries** from the dashboard. For each one, fill in:
   - a **label** (for example *Netflix*, *Rent*, *Car insurance*),
   - the **type**: *subscription* or *charge*,
   - the **periodicity**: monthly, quarterly or yearly,
   - the **amount**,
   - the **account** the entry belongs to,
   - optionally the day of the month and a note.
3. **Read the dashboard**. The smoothed monthly total is computed automatically (a yearly charge of €120 shows up as €10/month smoothed).
4. **Deactivate** an entry instead of deleting it when the expense is just paused: it drops out of the totals but stays visible under the *Inactive* filter.

## Storage and backup

All your data lives in a single SQLite file (`local.db` at the project root by default). To back it up, just copy that file, either while the app is stopped or with a hot SQLite copy command.

No data is ever sent anywhere; no third-party service is contacted.

## Configuration (optional)

A few environment variables let you tweak the behaviour, but the defaults are fine for most setups:

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `local.db` | Path to the SQLite file |
| `APP_SESSION_SECRET` | generated on first run | Secret used to sign session cookies |
| `APP_SESSION_TTL` | `2592000` (30 days) | Session lifetime, in seconds |
| `PORT` | `3000` | Port the server listens on |

## License

Billio is released under the **Creative Commons Attribution-NonCommercial 4.0 International** license ([CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)).

You are free to:

- **Share**: copy and redistribute the code in any medium or format.
- **Adapt**: remix, transform and build upon the code.

Under the following terms:

- **Attribution**: you must give appropriate credit and indicate if changes were made.
- **NonCommercial**: you may not use the code for commercial purposes.
