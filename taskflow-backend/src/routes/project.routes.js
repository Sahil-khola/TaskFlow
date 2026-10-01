import express from 'express';
import auth from '../middleware/auth.js';
import { createProject, getProjects, getProjectById } from '../controllers/project.controller.js';
const router = express.Router();
router.post('/', auth, createProject);
router.get('/', auth, getProjects);
router.get('/:id', auth, getProjectById);

export default router;