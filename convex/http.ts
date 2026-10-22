import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import { auth } from './auth';
import { aiProxy } from './playgroundAi';
import { allowedOrigins } from './lib/siteUrl';

const http = httpRouter();

// Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  let result = 0;
  for (let i = 0; i < aBytes.length; i++) result |= aBytes[i] ^ bBytes[i];
  return result === 0;
}

// Verify Stripe webhook signature (HMAC-SHA256)
async function verifyStripeSignature(payload: string, header: string, secret: string): Promise<boolean> {
  try {
    const parts = Object.fromEntries(header.split(',').map((p) => p.split('=')));
    const timestamp = parts['t'];
    const v1 = parts['v1'];
    if (!timestamp || !v1) return false;

    // Reject replays older than 5 minutes; guard against NaN timestamp
    const ts = Number(timestamp);
    if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
    const computed = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
    return timingSafeEqual(computed, v1);
  } catch {
    return false;
  }
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function apiJson(body: unknown, status = 200, origin: string | null = null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (origin && allowedOrigins().has(origin)) Object.assign(headers, corsHeaders(origin));
  return new Response(JSON.stringify(body), { status, headers });
}

function extractIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

function makeApiHandler(
  handler: (ctx: any, req: Request, ip: string, userAgent: string, origin: string | null) => Promise<Response>,
) {
  return httpAction(async (ctx, req) => {
    const origin = req.headers.get('origin');
    if (req.method === 'OPTIONS') {
      if (!origin || !allowedOrigins().has(origin)) return new Response('Forbidden', { status: 403 });
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    const ip = extractIp(req);
    const userAgent = req.headers.get('user-agent') ?? 'unknown';
    return handler(ctx, req, ip, userAgent, origin);
  });
}

// Required by @convex-dev/auth — exposes /.well-known/openid-configuration etc.
auth.addHttpRoutes(http);

// Public submit endpoints — IP extracted server-side
http.route({
  path: '/api/contact/submit',
  method: 'POST',
  handler: makeApiHandler(async (ctx, req, ip, userAgent, origin) => {
    let body: unknown;
    try { body = await req.json(); } catch { return apiJson({ error: 'INVALID_JSON' }, 400, origin); }
    try {
      const result = await ctx.runMutation(internal.contactRequests._submitInternal, { ...(body as object), ipAddress: ip, userAgent });
      return apiJson(result, 200, origin);
    } catch (e: unknown) {
      return apiJson({ error: (e as Error)?.message ?? 'ERROR' }, 400, origin);
    }
  }),
});

http.route({
  path: '/api/contact/submit',
  method: 'OPTIONS',
  handler: makeApiHandler(async () => new Response(null, { status: 204 })),
});

http.route({
  path: '/api/testimonial/submit',
  method: 'POST',
  handler: makeApiHandler(async (ctx, req, ip, userAgent, origin) => {
    let body: unknown;
    try { body = await req.json(); } catch { return apiJson({ error: 'INVALID_JSON' }, 400, origin); }
    try {
      const result = await ctx.runMutation(internal.testimonialSubmissions._submitInternal, { ...(body as object), ipAddress: ip, userAgent });
      return apiJson(result, 200, origin);
    } catch (e: unknown) {
      return apiJson({ error: (e as Error)?.message ?? 'ERROR' }, 400, origin);
    }
  }),
});

http.route({
  path: '/api/testimonial/submit',
  method: 'OPTIONS',
  handler: makeApiHandler(async () => new Response(null, { status: 204 })),
});

http.route({
  path: '/api/proposal/session',
  method: 'POST',
  handler: makeApiHandler(async (ctx, req, ip, userAgent, origin) => {
    let body: unknown;
    try { body = await req.json(); } catch { return apiJson({ error: 'INVALID_JSON' }, 400, origin); }
    try {
      const result = await ctx.runMutation(internal.proposals._createSessionInternal, { ...(body as object), ipAddress: ip, userAgent });
      return apiJson({ token: result }, 200, origin);
    } catch (e: unknown) {
      return apiJson({ error: (e as Error)?.message ?? 'ERROR' }, 400, origin);
    }
  }),
});

http.route({
  path: '/api/proposal/session',
  method: 'OPTIONS',
  handler: makeApiHandler(async () => new Response(null, { status: 204 })),
});

http.route({
  path: '/api/proposal/accept',
  method: 'POST',
  handler: makeApiHandler(async (ctx, req, ip, userAgent, origin) => {
    let body: unknown;
    try { body = await req.json(); } catch { return apiJson({ error: 'INVALID_JSON' }, 400, origin); }
    try {
      const result = await ctx.runMutation(internal.proposals._acceptInternal, { ...(body as object), ipAddress: ip, userAgent }) as { acceptanceId: string; contentHash: string };
      return apiJson({ id: result.acceptanceId, contentHash: result.contentHash, ipAddress: ip }, 200, origin);
    } catch (e: unknown) {
      return apiJson({ error: (e as Error)?.message ?? 'ERROR' }, 400, origin);
    }
  }),
});

http.route({
  path: '/api/proposal/accept',
  method: 'OPTIONS',
  handler: makeApiHandler(async () => new Response(null, { status: 204 })),
});

http.route({
  path: '/webhooks/stripe',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('Missing stripe-signature header', { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return new Response('STRIPE_WEBHOOK_SECRET not configured', { status: 500 });
    }

    const body = await req.text();

    // Verify Stripe webhook signature using HMAC-SHA256
    const isValid = await verifyStripeSignature(body, signature, webhookSecret);
    if (!isValid) {
      return new Response('Invalid signature', { status: 401 });
    }

    let event: { type: string; data: { object: Record<string, unknown> } };
    try {
      event = JSON.parse(body);
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
      const session = event.data.object;
      const externalRef = session['metadata'] as Record<string, string> | undefined;
      const checkoutUniqueLink = externalRef?.['uniqueLink'];

      if (checkoutUniqueLink) {
        await ctx.runMutation(internal.checkouts.markPaidByLink, {
          uniqueLink: checkoutUniqueLink,
          gatewayData: JSON.stringify(session),
        });
      }
    }

    return new Response('ok', { status: 200 });
  }),
});

http.route({
  path: '/webhooks/asaas',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const asaasToken = process.env.ASAAS_WEBHOOK_TOKEN;
    if (!asaasToken) return new Response('ASAAS_WEBHOOK_TOKEN not configured', { status: 500 });
    const receivedToken = req.headers.get('asaas-access-token') ?? '';
    if (!timingSafeEqual(receivedToken, asaasToken)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.text();

    let event: { event: string; payment?: Record<string, unknown> };
    try {
      event = JSON.parse(body);
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    if (event.event === 'PAYMENT_CONFIRMED' || event.event === 'PAYMENT_RECEIVED') {
      const payment = event.payment;
      const externalRef = payment?.['externalReference'] as string | undefined;

      if (externalRef) {
        await ctx.runMutation(internal.checkouts.markPaidByLink, {
          uniqueLink: externalRef,
          asaasChargeId: payment?.['id'] as string | undefined,
          gatewayData: JSON.stringify(payment),
        });
      }
    }

    return new Response('ok', { status: 200 });
  }),
});

http.route({
  path: '/webhooks/vercel-deploy',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const secret = req.headers.get('x-webhook-secret');
    const expectedSecret = process.env.VERCEL_WEBHOOK_SECRET;

    if (!expectedSecret || !timingSafeEqual(secret ?? '', expectedSecret)) {
      return new Response('Unauthorized', { status: 401 });
    }

    await ctx.runMutation(internal.publishStatus.setPublished, {});

    return new Response('ok', { status: 200 });
  }),
});

http.route({ path: '/playground/ai-proxy', method: 'POST', handler: aiProxy });
http.route({ path: '/playground/ai-proxy', method: 'OPTIONS', handler: aiProxy });

export default http;
