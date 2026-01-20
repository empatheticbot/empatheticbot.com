import Stripe from 'stripe';

// Initialize Stripe with secret key from environment
export const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

// Pricing tiers
export const PRICING_TIERS = {
  starter: {
    name: 'Starter',
    price: 299,
    priceId: import.meta.env.STRIPE_PRICE_ID_STARTER,
    features: [
      'Custom website design',
      '5 pages included',
      'Monthly updates & changes',
      'Mobile responsive',
      'Basic SEO optimization',
      'Email support',
    ],
  },
  professional: {
    name: 'Professional',
    price: 499,
    priceId: import.meta.env.STRIPE_PRICE_ID_PROFESSIONAL,
    features: [
      'Everything in Starter',
      'Unlimited pages',
      'Priority updates & changes',
      'Advanced SEO optimization',
      'Contact forms & integrations',
      'Analytics setup',
      'Direct phone support',
    ],
    popular: true,
  },
  enterprise: {
    name: 'Enterprise',
    price: 999,
    priceId: import.meta.env.STRIPE_PRICE_ID_ENTERPRISE,
    features: [
      'Everything in Professional',
      'E-commerce functionality',
      'Custom integrations',
      'Dedicated developer time',
      'Performance optimization',
      'Weekly strategy calls',
      '24/7 priority support',
    ],
  },
} as const;

export type PricingTier = keyof typeof PRICING_TIERS;
