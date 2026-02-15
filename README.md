# Shopping Tracker

Compare grocery prices across 11 US retailers and find the best deals. Built with Next.js, Prisma, and Tailwind CSS.

**Live demo:** [shopping-tracker-app.vercel.app](https://shopping-tracker-app.vercel.app)

## Features

- **Price Comparison** - Search products and see prices side-by-side across Walmart, Target, Amazon, Costco, Kroger, Whole Foods, Publix, H-E-B, Wegmans, Aldi, and Trader Joe's
- **Regional Pricing** - Enter your zip code to get location-adjusted prices and see local retailers
- **Shopping List Optimizer** - Build a list and find the cheapest store combination, accounting for trip costs
- **Price Alerts** - Set target prices and get notified when prices drop
- **Shrinkflation Tracker** - Detect when products shrink but prices stay the same
- **Barcode Scanner** - Scan product barcodes with your phone camera
- **PWA Support** - Installable as a mobile app

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
git clone https://github.com/neels-ai-bot/shopping-tracker.git
cd shopping-tracker
npm install
```

### Environment Variables

Copy `.env` and fill in your API keys:

```env
# Database (SQLite for local dev, PostgreSQL for production)
DATABASE_URL="file:./dev.db"

# Retailer APIs (optional - app works with mock data without these)
WALMART_API_KEY=
KROGER_CLIENT_ID=
KROGER_CLIENT_SECRET=
REDCIRCLE_API_KEY=
AMAZON_ACCESS_KEY=
AMAZON_SECRET_KEY=
AMAZON_PARTNER_TAG=

# Web Push notifications (optional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

### API Keys

The app works without API keys using a built-in mock product catalog. To get real product data:

| Retailer | Where to get the key | Cost |
|----------|---------------------|------|
| Walmart | [developer.walmart.com](https://developer.walmart.com) | Free |
| Kroger | [developer.kroger.com](https://developer.kroger.com) | Free |
| Target | [redcircleapi.com](https://www.redcircleapi.com) | Paid (~$100/mo) |
| Amazon | [affiliate-program.amazon.com](https://affiliate-program.amazon.com) | Free (requires affiliate account) |

### Run

```bash
# Set up the database
npx prisma migrate dev --name init
npm run db:seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run test suite (96 tests) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:reset` | Reset database |
| `npm run db:studio` | Open Prisma Studio |

## Project Structure

```
src/
  app/                  # Next.js pages and API routes
    api/
      search/           # Product search across retailers
      compare/          # Side-by-side price comparison
      list/             # Shopping list CRUD
      alerts/           # Price alert CRUD
      scrape/           # Background price scraping
      scan/             # Barcode lookup
    compare/            # Compare page
    list/               # Shopping list page
    alerts/             # Price alerts page
    shrinkflation/      # Shrinkflation tracker page
  components/           # React components
  lib/
    scrapers/           # Retailer-specific search modules
    optimizer.ts        # Shopping list cost optimizer
    location.ts         # Zip-to-state lookup and regional pricing
    retailer-config.ts  # Retailer availability by region
    shrinkflation.ts    # Package size tracking
    brand-mapper.ts     # Store-brand equivalent finder
  types/                # TypeScript type definitions
```

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Prisma with SQLite (dev) / PostgreSQL (prod)
- **Styling:** Tailwind CSS
- **Testing:** Vitest (96 tests across 8 files)
- **Deployment:** Vercel

## Deployment

The app is deployed on Vercel. To deploy your own:

```bash
npx vercel
```

Set `DATABASE_URL` to a PostgreSQL connection string in Vercel environment variables for full database functionality. Without it, the app runs in mock-only mode (search and comparison still work).
