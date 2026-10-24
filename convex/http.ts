import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import { auth } from './auth';
import { aiProxy } from './playgroundAi';
import { allowedOrigins } from './lib/siteUrl';
import { timingSafeEqual } from './lib/security';
import { handleAsaasWebhook } from './lib/asaasWebhook';

const http = httpRouter();

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
  path: '/webhooks/asaas',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const result = await handleAsaasWebhook({
      expectedToken: process.env.ASAAS_WEBHOOK_TOKEN,
      receivedToken: req.headers.get('asaas-access-token'),
      body: await req.text(),
      markPaid: async (payment) => {
        await ctx.runMutation(internal.checkouts.markPaidByLink, {
          uniqueLink: payment.uniqueLink,
          paymentId: payment.paymentId,
          installmentId: payment.installmentId,
          value: payment.value,
        });
      },
      markRefunded: async (payment) => {
        await ctx.runMutation(internal.checkouts.markRefundedByLink, {
          uniqueLink: payment.uniqueLink,
          paymentId: payment.paymentId,
          installmentId: payment.installmentId,
          event: payment.event,
        });
      },
    });
    return new Response(result.body, { status: result.status });
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
