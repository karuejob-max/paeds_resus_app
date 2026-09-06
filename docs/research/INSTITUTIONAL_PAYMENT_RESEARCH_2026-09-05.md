# Institutional payment research — 2026-09-05

## Sources

1. Stripe global availability: https://stripe.com/global
   The official country list viewed on 2026-09-05 did not list Kenya as a supported Stripe account country.

2. Pesapal: https://www.pesapal.com/
   Official material viewed on 2026-09-05 states that Pesapal supports online payments for businesses, including M-Pesa and card payments, e-invoices, payment links, and subscription businesses. Exact recurring-token, settlement, refund, and webhook terms still require merchant onboarding confirmation.

3. IntaSend payments: https://intasend.com/payments/
   Official material viewed on 2026-09-05 presents IntaSend as an Africa-focused payment provider. It remains a candidate/fallback until exact institutional recurring-card, M-Pesa, reconciliation, refund, webhook, and multi-currency capabilities are confirmed in writing.

4. Indicative USD/KES rate: https://www.currency.me.uk/convert/usd/kes
   Search result viewed on 2026-09-05 showed approximately USD 1 = KES 129.45. This is an indicative reference only; invoices store their own locked FX snapshot and do not reprice historically.

## Product decision

Use KES for Kenya-facing invoices and a USD reference ledger for cross-country pricing. Use annual invoice-first renewal. Make card autopay opt-in only when the payment provider confirms reusable mandates. Treat M-Pesa as a payment request per invoice rather than a Stripe-like silent recurring debit. Keep provider-specific data behind an adapter.
