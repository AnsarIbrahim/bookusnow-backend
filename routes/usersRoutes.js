import { Router } from 'express';
import { check } from 'express-validator';

import {
  getUsers,
  getAdmins,
  signup,
  login,
} from '../controllers/usersControllers.js';
import fileUpload from '../middleware/file-upload.js';

const router = Router();

router.get('/', getUsers);

router.get('/admins', getAdmins);

router.post(
  '/signup',
  fileUpload.single('image'),
  [
    check('username').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({ min: 6 }),
    check('role').not().isEmpty(),
  ],
  signup
);

router.post('/login', login);

export default router;
