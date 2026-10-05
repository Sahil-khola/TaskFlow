import express from 'express';
import auth from '../middleware/auth.js';
import { createProject, getProjects, getProjectById , updateProject, addMember, removeMember,deleteProject, updateMemberRole} from '../controllers/project.controller.js';
const router = express.Router();

router.post('/', auth, createProject);
router.get('/', auth, getProjects);
router.get('/:id', auth, getProjectById);
// Rename/description sirf OWNER — controller me check hai
router.patch('/:id', auth, updateProject);
// Delete sirf OWNER — controller me check hai
router.delete('/:id', auth, deleteProject);


router.post('/:id/members', auth, addMember);
router.delete('/:id/members/:userId', auth, removeMember);
// Role change OWNER + ADMIN — controller me check hai
router.patch('/:id/members/:userId', auth, updateMemberRole);

export default router;