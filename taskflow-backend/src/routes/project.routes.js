import express from 'express';
import auth from '../middleware/auth.js';
import { createProject, getProjects, getProjectById , updateProject, addMember, removeMember} from '../controllers/project.controller.js';
const router = express.Router();
 
router.post('/', auth, createProject);
router.get('/', auth, getProjects);
router.get('/:id', auth, getProjectById);
router.patch('/:id', auth, updateProject);


router.post('/:id/members', auth, addMember);
router.delete('/:id/members/:userId', auth, removeMember);

export default router;