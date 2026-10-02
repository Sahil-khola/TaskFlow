import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './src/routes/auth.routes.js';
import projectRoutes from './src/routes/project.routes.js';
import taskRoutes from './src/routes/task.routes.js';
import connectDB from './src/config/db.js';
import cookieParser from 'cookie-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

const app = express();



app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cookieParser());

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));


app.use(
  cors({
    origin: isProd && !process.env.FRONTEND_URL ? true : process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' , message: 'Server is healthy' });
});


const distPath = path.resolve(__dirname, '..', 'taskflow-frontend', 'dist');

app.use(
  express.static(distPath, {
    index: false,
    maxAge: isProd ? '1y' : 0,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache');
    },
  })
);

app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, msg: 'API route not found' });
  }


  const indexHtml = path.join(distPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    return res.sendFile(indexHtml);
  }

  res
    .status(503)
    .type('text/plain')
    .send('Frontend build not found. Run the build command so taskflow-frontend/dist exists.');
});

const start = async () => {
  try {
    await connectDB();

    const port = process.env.PORT || 5001;
    app.listen(port, () => {
      console.log(`Server running on port ${port} (${isProd ? 'production' : 'development'})`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();

export default app;
