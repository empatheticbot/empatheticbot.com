import type { APIRoute } from 'astro';
import { stripe } from '../../lib/stripe';
import type Stripe from 'stripe';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return new Response(
      `Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id);

        // TODO: Fulfill the subscription
        // - Create user account if new customer
        // - Grant access to services
        // - Send welcome email
        // - Store subscription details in your database

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', subscription.id);

        // TODO: Handle subscription changes
        // - Update user's plan in database
        // - Adjust access levels
        // - Send notification email

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription canceled:', subscription.id);

        // TODO: Handle subscription cancellation
        // - Revoke access at period end
        // - Send cancellation confirmation
        // - Archive user data if needed

        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice paid:', invoice.id);

        // TODO: Handle successful payment
        // - Send receipt
        // - Extend subscription period

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment failed:', invoice.id);

        // TODO: Handle failed payment
        // - Send payment failure notification
        // - Retry billing or suspend account

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      `Webhook handler failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
};
