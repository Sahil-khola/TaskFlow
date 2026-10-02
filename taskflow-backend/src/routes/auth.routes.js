import express from 'express';
import { signup, login, getMe, searchUsers } from '../controllers/auth.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.post('/signup', signup);
router.post('/login', login);
router.get('/me', auth, getMe);
// Member add karne ke liye email se user dhundho (sirf logged-in users ke liye)
router.get('/users', auth, searchUsers);
router.post('/logout', (req, res) => {
  // Cookie hatao — server side koi session store nahi hai
  res.clearCookie('token');
  res.json({ success: true, msg: 'Logged out' });
});

export default router;