import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import uniqueValidator from 'mongoose-unique-validator';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'A user must have a name'],
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [20, 'Username must be at most 20 characters long'],
  },
  email: {
    type: String,
    required: [true, 'A user must have an mail'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'A user must have an password'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false,
  },
  image: { type: Buffer, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
});

UserSchema.plugin(uniqueValidator, {
  message: 'Error, expected {PATH} to be unique.',
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  next();
});

const User = mongoose.model('User', UserSchema);

export default User;
