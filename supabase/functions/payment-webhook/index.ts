// Deploy with: supabase functions deploy payment-webhook --no-verify-jwt
// Required secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PAYMENT_WEBHOOK_SECRET.
// Adapt `verifyProviderPayload` to the selected PSP's official signature scheme.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const encoder = new TextEncoder();
const toHex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

async function verifyProviderPayload(rawBody: string, signature: string | null) {
  const secret = Deno.env.get('PAYMENT_WEBHOOK_SECRET');
  if (!secret || !signature) return false;
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  return toHex(digest) === signature.replace(/^sha256=/, '');
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const rawBody = await request.text();
  if (!(await verifyProviderPayload(rawBody, request.headers.get('x-payment-signature')))) return new Response('Invalid signature', { status: 401 });
  const event = JSON.parse(rawBody) as { type: string; data: { orderId: string; paymentId: string; provider?: string } };
  if (event.type !== 'payment.captured') return Response.json({ received: true });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { error } = await admin.rpc('settle_payment_hold', { p_order_id: event.data.orderId, p_provider: event.data.provider || 'configured_provider', p_provider_payment_id: event.data.paymentId });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ received: true });
});
