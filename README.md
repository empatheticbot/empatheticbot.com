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

This site is configured as a static site that deploys seamlessly to Cloudflare Pages.

#### Deploy via Cloudflare Dashboard (Recommended)

1. Push your code to GitHub
2. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
3. Go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**
4. Select your repository
5. Configure build settings:
   - **Framework preset**: Astro
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. Click **Save and Deploy**

Cloudflare will automatically detect your Astro project and configure the correct settings.

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
