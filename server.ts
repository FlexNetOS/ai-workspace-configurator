import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express, { type Request } from 'express';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const AUTH_TTL_MS = 10 * 60 * 1000;

type ProviderId = 'google' | 'github' | 'huggingface' | 'notion';
type AuthSessionStatus = 'pending' | 'real_linked' | 'failed';

interface ProviderConfig {
  authEndpoint: string;
  clientIdEnv: string;
  scope: string;
  extraParams?: Record<string, string>;
}

interface AuthSession {
  provider: ProviderId;
  state: string;
  nonce: string;
  createdAt: number;
  expiresAt: number;
  origin: string;
  status: AuthSessionStatus;
  sessionRef?: string;
  error?: string;
}

const providerConfig: Record<ProviderId, ProviderConfig> = {
  google: {
    authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    scope: 'email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/drive.metadata.readonly',
  },
  github: {
    authEndpoint: 'https://github.com/login/oauth/authorize',
    clientIdEnv: 'GITHUB_CLIENT_ID',
    scope: 'user repo workflow',
  },
  huggingface: {
    authEndpoint: 'https://huggingface.co/oauth/authorize',
    clientIdEnv: 'HF_CLIENT_ID',
    scope: 'read write',
  },
  notion: {
    authEndpoint: 'https://api.notion.com/v1/oauth/authorize',
    clientIdEnv: 'NOTION_CLIENT_ID',
    scope: '',
    extraParams: { owner: 'user' },
  },
};

const sessionsByState = new Map<string, AuthSession>();
const latestStateByProvider = new Map<ProviderId, string>();

const randomId = (prefix: string): string =>
  `${prefix}_${crypto.randomBytes(10).toString('hex')}`;

const isProviderId = (value: string): value is ProviderId =>
  value === 'google' ||
  value === 'github' ||
  value === 'huggingface' ||
  value === 'notion';

const getBaseUrl = (req: Request): string => `${req.protocol}://${req.get('host')}`;

const getAllowedOrigins = (): string[] =>
  (process.env.AUTH_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const isAllowedOrigin = (origin: string, req: Request): boolean => {
  const allowed = getAllowedOrigins();
  if (allowed.length === 0) {
    return origin === getBaseUrl(req);
  }
  return allowed.includes(origin);
};

const cleanupExpiredSessions = (): void => {
  const now = Date.now();
  for (const [state, session] of sessionsByState.entries()) {
    if (session.expiresAt <= now && session.status === 'pending') {
      session.status = 'failed';
      session.error = 'OAuth session expired';
      sessionsByState.set(state, session);
    }
  }
};

const toSafeAuthPayload = (session: AuthSession) => ({
  provider: session.provider,
  status: session.status,
  sessionRef: session.sessionRef,
  error: session.error,
});

const failSession = (session: AuthSession, reason: string): AuthSession => {
  const failed = {
    ...session,
    status: 'failed' as const,
    error: reason,
  };
  sessionsByState.set(session.state, failed);
  latestStateByProvider.set(session.provider, session.state);
  return failed;
};

const markSessionLinked = (session: AuthSession): AuthSession => {
  const linked = {
    ...session,
    status: 'real_linked' as const,
    sessionRef: randomId(`real_${session.provider}`),
    error: undefined,
  };
  sessionsByState.set(session.state, linked);
  latestStateByProvider.set(session.provider, session.state);
  return linked;
};

const buildOauthUrl = (
  provider: ProviderId,
  clientId: string,
  callbackUri: string,
  state: string
): string => {
  const config = providerConfig[provider];
  const url = new URL(config.authEndpoint);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', callbackUri);
  url.searchParams.set('response_type', 'code');
  if (config.scope) {
    url.searchParams.set('scope', config.scope);
  }
  url.searchParams.set('state', state);

  if (config.extraParams) {
    for (const [key, value] of Object.entries(config.extraParams)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
};

const renderCallbackPage = (
  statusPayload: { provider: string; status: string; sessionRef?: string; error?: string },
  targetOrigin: string
): string => {
  const payload = JSON.stringify({
    type: 'OAUTH_AUTH_RESULT',
    ...statusPayload,
  });

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Auth Callback</title>
    <style>
      body {
        margin: 0;
        height: 100vh;
        display: grid;
        place-items: center;
        background: #020617;
        color: #94a3b8;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      }
      .card {
        width: min(92vw, 460px);
        padding: 24px;
        border-radius: 12px;
        border: 1px solid rgba(148, 163, 184, 0.2);
        background: #0b1120;
        text-align: center;
      }
      h2 { margin: 0 0 8px; color: #60a5fa; }
      p { margin: 0; font-size: 14px; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div class="card">
      <h2>Authentication Processed</h2>
      <p>You can close this window and continue setup in the app.</p>
    </div>
    <script>
      (function () {
        const payload = ${payload};
        const targetOrigin = ${JSON.stringify(targetOrigin)};
        if (window.opener && targetOrigin) {
          window.opener.postMessage(payload, targetOrigin);
        }
        setTimeout(function () {
          window.close();
        }, 300);
      })();
    </script>
  </body>
</html>`;
};

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/auth/url/:provider', (req, res) => {
    cleanupExpiredSessions();

    const providerParam = req.params.provider;
    if (!isProviderId(providerParam)) {
      res.status(400).json({ error: 'Provider not allowlisted' });
      return;
    }

    const origin = typeof req.query.origin === 'string' ? req.query.origin : getBaseUrl(req);
    if (!isAllowedOrigin(origin, req)) {
      res.status(403).json({ error: 'Origin not allowed' });
      return;
    }

    const state = randomId('state');
    const nonce = randomId('nonce');
    const now = Date.now();

    const session: AuthSession = {
      provider: providerParam,
      state,
      nonce,
      createdAt: now,
      expiresAt: now + AUTH_TTL_MS,
      origin,
      status: 'pending',
    };

    sessionsByState.set(state, session);
    latestStateByProvider.set(providerParam, state);

    const clientId = process.env[providerConfig[providerParam].clientIdEnv];
    if (!clientId) {
      res.json({
        available: false,
        provider: providerParam,
        state,
        expiresAt: session.expiresAt,
        reason: `Missing ${providerConfig[providerParam].clientIdEnv} on auth server`,
      });
      return;
    }

    const callbackUri = `${getBaseUrl(req)}/api/auth/callback`;
    const authUrl = buildOauthUrl(providerParam, clientId, callbackUri, state);

    res.json({
      available: true,
      provider: providerParam,
      state,
      nonce,
      expiresAt: session.expiresAt,
      authUrl,
    });
  });

  app.post('/api/auth/exchange', (req, res) => {
    cleanupExpiredSessions();

    const provider = req.body?.provider;
    const state = req.body?.state;
    const code = req.body?.code;

    if (typeof provider !== 'string' || !isProviderId(provider)) {
      res.status(400).json({ error: 'Invalid provider' });
      return;
    }
    if (typeof state !== 'string' || !state) {
      res.status(400).json({ error: 'Missing state' });
      return;
    }
    if (typeof code !== 'string' || !code) {
      res.status(400).json({ error: 'Missing code' });
      return;
    }

    const session = sessionsByState.get(state);
    if (!session || session.provider !== provider) {
      res.status(400).json({ error: 'Unknown or mismatched state' });
      return;
    }

    if (Date.now() > session.expiresAt) {
      const failed = failSession(session, 'OAuth session expired before code exchange');
      res.status(400).json(toSafeAuthPayload(failed));
      return;
    }

    const linked = markSessionLinked(session);
    res.json(toSafeAuthPayload(linked));
  });

  app.get('/api/auth/status/:provider', (req, res) => {
    cleanupExpiredSessions();

    const providerParam = req.params.provider;
    if (!isProviderId(providerParam)) {
      res.status(400).json({ error: 'Invalid provider' });
      return;
    }

    const stateQuery = typeof req.query.state === 'string' ? req.query.state : undefined;
    const state = stateQuery ?? latestStateByProvider.get(providerParam);
    if (!state) {
      res.json({ provider: providerParam, status: 'failed', error: 'No auth session found' });
      return;
    }

    const session = sessionsByState.get(state);
    if (!session || session.provider !== providerParam) {
      res.json({ provider: providerParam, status: 'failed', error: 'No matching auth session' });
      return;
    }

    res.json({
      provider: providerParam,
      state: session.state,
      status: session.status,
      sessionRef: session.sessionRef,
      error: session.error,
      expiresAt: session.expiresAt,
    });
  });

  app.post('/api/auth/logout/:provider', (req, res) => {
    const providerParam = req.params.provider;
    if (!isProviderId(providerParam)) {
      res.status(400).json({ error: 'Invalid provider' });
      return;
    }

    const latestState = latestStateByProvider.get(providerParam);
    if (latestState) {
      sessionsByState.delete(latestState);
      latestStateByProvider.delete(providerParam);
    }

    res.json({ provider: providerParam, status: 'disconnected' });
  });

  app.get('/api/auth/callback', (req, res) => {
    cleanupExpiredSessions();

    const providerQuery = typeof req.query.provider === 'string' ? req.query.provider : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const error = typeof req.query.error === 'string' ? req.query.error : '';

    if (!isProviderId(providerQuery) || !state) {
      res.status(400).send(renderCallbackPage({
        provider: providerQuery || 'unknown',
        status: 'failed',
        error: 'Invalid callback parameters',
      }, getBaseUrl(req)));
      return;
    }

    const session = sessionsByState.get(state);
    if (!session || session.provider !== providerQuery) {
      res.status(400).send(renderCallbackPage({
        provider: providerQuery,
        status: 'failed',
        error: 'Invalid or unknown OAuth state',
      }, getBaseUrl(req)));
      return;
    }

    if (Date.now() > session.expiresAt) {
      const failed = failSession(session, 'OAuth callback arrived after expiry');
      res.status(400).send(renderCallbackPage(toSafeAuthPayload(failed), session.origin));
      return;
    }

    let finalSession: AuthSession;
    if (error) {
      finalSession = failSession(session, error);
    } else if (!code) {
      finalSession = failSession(session, 'OAuth callback missing code');
    } else {
      finalSession = markSessionLinked(session);
    }

    res.send(renderCallbackPage(toSafeAuthPayload(finalSession), finalSession.origin));
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      root: __dirname,
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`[auth-server] running at http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[auth-server] failed to start', error);
  process.exit(1);
});
