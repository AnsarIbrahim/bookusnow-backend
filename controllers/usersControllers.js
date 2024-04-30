import fs from 'fs';

import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import HttpError from '../models/http-error.js';
import User from '../models/user.js';

const jwtKey = process.env.JWT_KEY;

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, '-password');
  } catch (error) {
    return next(
      new HttpError('Fetching users failed, please try again later.', 500)
    );
  }

  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const getAdmins = async (req, res, next) => {
  let admins;
  try {
    admins = await User.find({ role: 'admin' }, '-password');
  } catch (error) {
    return next(
      new HttpError('Fetching admins failed, please try again later.', 500)
    );
  }

  res.json({
    admins: admins.map((admin) => admin.toObject({ getters: true })),
  });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { username, email, password, role } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    return next(
      new HttpError('Signing up failed, please try again later.', 500)
    );
  }

  if (existingUser) {
    return next(
      new HttpError('User exists already, please login instead.', 422)
    );
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (error) {
    return next(new HttpError('Could not create user, please try again.', 500));
  }

  let imageBuffer;
  if (req.file) {
    imageBuffer = fs.readFileSync(req.file.path);
  } else {
    imageBuffer = fs.readFileSync('uploads/images/default.jpg');
  }

  const createdUser = new User({
    username,
    email,
    password: hashedPassword,
    role,
    image: imageBuffer,
  });

  try {
    await createdUser.save();
  } catch (error) {
    return next(
      new HttpError('Signing up failed, please try again later.', 500)
    );
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      jwtKey,
      { expiresIn: '1h' }
    );
  } catch (error) {
    return next(
      new HttpError('Signing up failed, please try again later.', 500)
    );
  }

  res.status(201).json({
    userId: createdUser.id,
    email: createdUser.email,
    token: token,
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email }, '+password');
  } catch (error) {
    return next(
      new HttpError('Logging in failed, please try again later.', 500)
    );
  }

  if (!existingUser) {
    return next(
      new HttpError('Invalid credentials, could not log you in.', 403)
    );
  }

  let isValidPassword = false;

  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (error) {
    return next(
      new HttpError('Could not log you in, please check your credentials.', 500)
    );
  }

  if (!isValidPassword) {
    return next(
      new HttpError('Invalid credentials, could not log you in.', 403)
    );
  }

  let token;

  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      jwtKey,
      { expiresIn: '1h' }
    );
  } catch (error) {
    return next(
      new HttpError('Logging in failed, please try again later.', 500)
    );
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};

export { getUsers, getAdmins, signup, login };
