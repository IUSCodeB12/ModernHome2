# Stripe payments — implementation plan (#2)

**Status: deferred — needs a Stripe account + keys before it can be built or
tested.** Payment code that moves real money must not be shipped untested, so
this is scoped to run as one focused session once the account exists.

The schema is already prepared: `bookings.deposit_cents`, `deposit_paid_at`,
`stripe_checkout_session_id`; `invoices.stripe_payment_intent_id`, `status`,
`paid_at`. The manual/offline flow stays as the fallback.

## Prerequisites (you)
1. Create a Stripe account; get **test** + **live** keys.
2. Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. `pnpm add stripe @stripe/stripe-js`.
4. Register the webhook endpoint (below) in the Stripe dashboard.

## Build steps

### A. Deposit checkout (after quote accepted)
- Server action `createDepositCheckout(quoteId)` — verify ownership, create a
  Stripe Checkout Session (mode `payment`, amount = `deposit_cents`, metadata
  `{ bookingId }`), store `stripe_checkout_session_id`, return the URL.
- Portal: a "Pay deposit" button on an `approved` booking → redirect to Checkout.
- Success/cancel return URLs back to `/portal/[id]`.

### B. Balance payment (after job complete)
- `createBalanceCheckout(quoteId)` — amount = invoice `total_cents`, metadata
  `{ invoiceId }`. Portal "Pay now" button on `invoiced` bookings (alongside the
  existing offline option).

### C. Webhook — the source of truth (`app/api/stripe/webhook/route.ts`)
- `runtime = "nodejs"`; read the raw body; **verify the signature** with
  `STRIPE_WEBHOOK_SECRET` (reject if it fails — never trust unsigned events).
- On `checkout.session.completed`:
  - deposit session → set `deposit_paid_at`, move booking `approved → booked`
    (reuse the existing transition so the confirmation email fires).
  - balance session → mark the invoice `paid` + `paid_at`, move booking
    `invoiced → paid` (fires the receipt email).
- Idempotency: guard on already-paid rows so retried events are no-ops.

### D. Reconciliation / edge cases
- Keep the offline "mark paid" admin path as a fallback.
- Handle `payment_intent.payment_failed` (surface in portal), refunds
  (`charge.refunded` → revert status), and session expiry.

## Testing (once keys exist)
- Stripe test cards (`4242…`) through deposit + balance.
- `stripe listen --forward-to localhost:3000/api/stripe/webhook` for local webhooks.
- Verify signature rejection with a tampered payload.
- Confirm idempotency by replaying an event.

## Do NOT
- Trust client-reported payment success — the **webhook** is authoritative.
- Store card data. Stripe Checkout keeps PCI scope off our servers.
