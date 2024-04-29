import { Router } from 'express';
import { check } from 'express-validator';

import userControllers from '../controllers/usersControllers';
import fileUpload from '../middleware/file-upload';

const router = Router();

router.get('/', userControllers.getUsers);

router.post(
  '/signup',
  fileUpload.single('image'),
  [
    check('username').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({ min: 6 }),
    check('role').not().isEmpty(),
  ],
  userControllers.signup
);

router.post('login', userControllers.login);

export default router;
