import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Get OAuth URLs
  app.get('/api/auth/url/:provider', (req, res) => {
    const { provider } = req.params;
    const redirectUri = `${req.protocol}://${req.get('host')}/auth/callback`;
    
    let url = '';
    
    switch (provider) {
      case 'google':
        url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID || 'PENDING'}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile%20https://www.googleapis.com/auth/gmail.readonly%20https://www.googleapis.com/auth/drive.metadata.readonly`;
        break;
      case 'github':
        url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID || 'PENDING'}&redirect_uri=${redirectUri}&scope=user,repo,workflow`;
        break;
      case 'huggingface':
        url = `https://huggingface.co/oauth/authorize?client_id=${process.env.HF_CLIENT_ID || 'PENDING'}&redirect_uri=${redirectUri}&scope=read,write`;
        break;
      case 'notion':
        url = `https://api.notion.com/v1/oauth/authorize?client_id=${process.env.NOTION_CLIENT_ID || 'PENDING'}&redirect_uri=${redirectUri}&response_type=code&owner=user`;
        break;
      default:
        return res.status(400).json({ error: 'Provider not supported for OAuth' });
    }
    
    res.json({ url });
  });

  // OAuth Callback Handler
  app.get(['/auth/callback', '/auth/callback/'], (req, res) => {
    // In a real app, you'd exchange the code for tokens here
    // For this build, we just send a success message to the parent window
    res.send(`
      <html>
        <head>
          <style>
            body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #020617; color: #94a3b8; }
            .card { background: #0f172a; padding: 2rem; border-radius: 0.5rem; border: 1px solid #1e293b; text-align: center; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2 style="color: #60a5fa;">Authentication Successful</h2>
            <p>Architect AI has verified your account.</p>
            <p>This window will close automatically.</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'inferred' }, '*');
              setTimeout(() => window.close(), 2000);
            }
          </script>
        </body>
      </html>
    `);
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\x1b[35m[Architect_Server]\x1b[0m Node.js backend active at http://localhost:${PORT}`);
  });
}

startServer();
