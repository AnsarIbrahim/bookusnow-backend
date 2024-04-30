import HttpError from '../models/http-error.js';

const checkAdmin = (req, res, next) => {
  if (!req.userData.isAdmin) {
    return next(
      new HttpError('You are not allowed to perform this action', 403)
    );
  }
  next();
};

export default checkAdmin;
