# Empatheticbot

Monthly web development subscription for local businesses.

## Features

- **Scroll-based Animation**: The site starts with a sketch-style, low-fidelity wireframe look. As you scroll, the elements progressively "fill in" and become polished and complete.
- **Pulsing Logo**: The heart in the Empatheticbot logo pulses like a heartbeat.
- **Stripe Integration**: Accept recurring subscription payments with three pricing tiers.
- **API Routes**: Server-side endpoints for Stripe checkout and webhook handling.
- **Responsive Design**: Works beautifully on all screen sizes.
- **Built with Astro**: Fast, modern, and optimized with hybrid rendering.

## Development

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
npm install
```

### Environment Variables

Copy the `.env.example` file to `.env` and fill in your Stripe credentials:

```bash
cp .env.example .env
```

You'll need to configure the following:

1. **Stripe API Keys** - Get from [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys)
   - Use test keys for development (`sk_test_...`)
   - Use live keys for production (`sk_live_...`)

2. **Stripe Products & Prices** - Create in [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
   - Create 3 products: Starter ($299/mo), Professional ($499/mo), Enterprise ($999/mo)
   - Set as **recurring** monthly subscriptions
   - Copy the Price IDs to your `.env` file

3. **Stripe Webhook Secret** - Set up in [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
   - Create endpoint pointing to: `https://yourdomain.com/api/webhook`
   - Select these events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
   - Copy the webhook signing secret to your `.env` file

### Running Locally

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

### Testing Stripe Integration

Use Stripe's test card numbers to test subscriptions:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- Use any future expiration date and any 3-digit CVC

For webhook testing during local development, use the Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# or download from https://stripe.com/docs/stripe-cli

# Forward webhooks to your local server
stripe listen --forward-to localhost:4321/api/webhook

# Use the webhook signing secret printed by the CLI in your .env file
```

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Deployment

### Cloudflare Pages

This site uses hybrid rendering (static pages + API routes) and deploys to Cloudflare Pages.

#### Deploy via Cloudflare Dashboard (Recommended)

1. Push your code to GitHub
2. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
3. Go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**
4. Select your repository
5. Configure build settings:
   - **Framework preset**: Astro
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. **Add Environment Variables** in the deployment settings:
   - `STRIPE_SECRET_KEY` - Your Stripe secret key (use live key for production)
   - `STRIPE_WEBHOOK_SECRET` - Your webhook signing secret
   - `STRIPE_PRICE_ID_STARTER` - Price ID for Starter tier
   - `STRIPE_PRICE_ID_PROFESSIONAL` - Price ID for Professional tier
   - `STRIPE_PRICE_ID_ENTERPRISE` - Price ID for Enterprise tier
7. Click **Save and Deploy**

**Important**: After deployment, update your Stripe webhook endpoint URL to point to your production domain: `https://yourdomain.com/api/webhook`

#### Deploy via Wrangler CLI

```bash
# Install Wrangler globally (if not already installed)
npm install -g wrangler@latest

# Build your site
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name=empatheticbot
```

On first deployment, Wrangler will create the Pages project for you.

## About

Empatheticbot offers a monthly subscription service for local businesses who want a real human partner to help build and maintain their online presence. No more futzing with templates or paying large sums up front only to need costly changes later.
