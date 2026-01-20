import type { APIRoute } from 'astro';
import { stripe, PRICING_TIERS, type PricingTier } from '../../lib/stripe';

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const body = await request.json();
    const { tier } = body as { tier: PricingTier };

    // Validate tier
    if (!tier || !PRICING_TIERS[tier]) {
      return new Response(
        JSON.stringify({ error: 'Invalid pricing tier' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const tierData = PRICING_TIERS[tier];

    // Validate price ID is configured
    if (!tierData.priceId) {
      return new Response(
        JSON.stringify({ error: 'Price ID not configured for this tier' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: tierData.priceId,
          quantity: 1,
        },
      ],
      success_url: `${url.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${url.origin}/?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_email: body.email || undefined,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
