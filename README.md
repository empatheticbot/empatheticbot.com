# Empatheticbot

Monthly web development subscription for local businesses.

## Features

- **Scroll-based Animation**: The site starts with a sketch-style, low-fidelity wireframe look. As you scroll, the elements progressively "fill in" and become polished and complete.
- **Pulsing Logo**: The heart in the Empatheticbot logo pulses like a heartbeat.
- **Responsive Design**: Works beautifully on all screen sizes.
- **Built with Astro**: Fast, modern, and optimized.

## Development

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
npm install
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

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

This site is configured to deploy on Cloudflare Pages using the `@astrojs/cloudflare` adapter.

#### Deploy via Cloudflare Dashboard

1. Push your code to GitHub
2. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
3. Go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**
4. Select your repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node version**: 18 or higher
6. Click **Save and Deploy**

#### Deploy via Wrangler CLI

```bash
# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
npm run build
wrangler pages deploy dist
```

#### Environment Variables

If you need environment variables for your deployment, add them in the Cloudflare Dashboard under **Settings** > **Environment variables**.

## About

Empatheticbot offers a monthly subscription service for local businesses who want a real human partner to help build and maintain their online presence. No more futzing with templates or paying large sums up front only to need costly changes later.
