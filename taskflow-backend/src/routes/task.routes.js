import express from 'express';
import auth from '../middleware/auth.js';
import { createTask,getTasksByProject, myTasks, moveTask, addComment, getComments, updateTask, deleteTask } from '../controllers/task.controller.js';
const router = express.Router();

router.get('/my', auth, myTasks);
router.post('/', auth, createTask);
router.get('/project/:projectId', auth,getTasksByProject);
// Edit — koi bhi project member
router.patch('/:id', auth, updateTask);
// Owner/Admin koi bhi task, Member sirf apna assigned task
router.delete('/:id', auth, deleteTask);
// Status/position change — moveTask apni permission check khud karta hai
router.patch('/:id/move', auth, moveTask);
router.post('/:id/comments', auth, addComment);
router.get('/:id/comments', auth, getComments);
export default router;