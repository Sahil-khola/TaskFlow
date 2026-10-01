import express from 'express';
import { signup, login, getMe } from '../controllers/auth.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.post('/signup', signup);
router.post('/login', login);
router.get('/me', auth, getMe);
router.post('/logout', (req, res) => {
  // Cookie hatao — server side koi session store nahi hai
  res.clearCookie('token');
  res.json({ success: true, msg: 'Logged out' });
});

export default router;