import express from 'express';
import auth from '../middleware/auth.js';
import { createProject, getProjects, getProjectById , updateProject} from '../controllers/project.controller.js';
const router = express.Router();

router.post('/', auth, createProject);
router.get('/', auth, getProjects);
router.get('/:id', auth, getProjectById);
router.patch('/:id', auth, updateProject);

export default router;