import jwt from 'jsonwebtoken';

import HttpError from '../models/http-error.js';

const jwtKey = process.env.JWT_KEY;

const checkAuth = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      throw new Error('Authentication failed!');
    }

    const decodedToken = jwt.verify(token, jwtKey);
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (error) {
    return next(new HttpError('Authentication failed!', 403));
  }
};

export default checkAuth;
