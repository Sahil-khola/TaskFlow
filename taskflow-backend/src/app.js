import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import taskRoutes from './routes/task.routes.js';
import DB from './config/db.js';
import helmet from 'helmet';

 DB();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(cors({origin: process.env.FRONTEND_URL}));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/health', (req,res)=>res.json({status:"ok"}));
app.listen(process.env.PORT || 4000, ()=>console.log(`http://localhost:${process.env.PORT || 4000}`));
export default app;