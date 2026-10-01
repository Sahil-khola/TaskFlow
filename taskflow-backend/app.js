import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './src/routes/auth.routes.js';
import projectRoutes from './src/routes/project.routes.js';
import taskRoutes from './src/routes/task.routes.js';
import connectDB from './src/config/db.js';
import cookieParser from 'cookie-parser'

const app = express();

app.use(cookieParser());

// Middlewares
app.use(express.json());
app.use(cors({ 
  origin: process.env.FRONTEND_URL,
  credentials: true 
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

 app.get('/health', (req, res) => {
  res.json({ status: 'ok' , message: 'Server is healthy' });
});

const start = async () => {
    try {
        await connectDB(); 
        app.listen(process.env.PORT, () => {
            console.log(`Server running on http://localhost:${process.env.PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err.message);
        process.exit(1);
    }
};

start();

export default app;