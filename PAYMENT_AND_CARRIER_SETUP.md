# Payments and delivery activation

The marketplace data model and protected-order flow are implemented in migration `010_marketplace_core.sql`. Before accepting real orders, configure one payment service provider and one carrier provider.

1. Apply the Supabase migrations.
2. Deploy `payment-webhook` without JWT verification and set `PAYMENT_WEBHOOK_SECRET` plus the Supabase service-role secrets.
3. Replace the generic HMAC validation and `payment.captured` payload mapping with the exact verification process from the selected PSP.
4. Configure the PSP success webhook to call `settle_payment_hold`; only this service-role webhook changes an order from `pending_payment` to `paid`.
5. Connect the carrier API to create shipment labels and write tracking events to `shipments`. Do not expose carrier or payment keys in Expo.
6. Schedule `release_due_orders()` with Supabase Cron once per hour to release held funds after the two-day post-delivery issue window.

The app intentionally does not allow a buyer or seller to mark a payment as paid. That restriction is required for buyer protection.
