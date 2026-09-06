import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes/api.js';
import { db } from './server/db.js';
import { verifyPassword } from './server/crypto.js';
import { startTelegramBotPolling } from './server/telegram.js';

const PORT = 3000;
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Trust proxy for accurate client IP behind cloud reverse proxies
app.set('trust proxy', 1);

// Mount API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'نسمة شتاء',
    timestamp: new Date().toISOString(),
  });
});

async function start() {
  // Start Telegram bot background polling for owner control & commands
  startTelegramBotPolling({
    getStats: () => db.getStats(),
    getPosts: () => db.getAllPostsAdmin(),
    getAdminProfile: () => db.getOwnerProfile(),
    createPost: (data: any) => db.createPost(data),
    deletePost: (id: string) => db.deletePost(id),
    togglePublish: (id: string) => db.togglePublish(id),
    getComments: () => db.getAllCommentsAdmin(),
    deleteComment: (id: string) => db.deleteComment(id),
    getSecurityLogs: () => db.getLoginAttempts(),
    createBackup: () => db.createBackup(),
    verifyAdminPassword: (pwd: string) => {
      const admin = db.getAdminUser();
      return verifyPassword(pwd, admin.passwordHash, admin.salt);
    },
  });

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
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
    console.log(`❄️ «نسمة شتاء» يعمل بنجاح على http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('[Server Start Fatal]:', err);
});
