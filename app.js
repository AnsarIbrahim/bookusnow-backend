import fs from 'fs';
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import path from 'path';
import { dirname } from 'path';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';

import usersRoutes from './routes/usersRoutes.js';
import eventsRoutes from './routes/eventsRoutes.js';
import HttpError from './models/http-error.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const setupStaticFileServer = (app, route, directory) => {
  app.use(route, express.static(path.join(__dirname, ...directory)));
};

setupStaticFileServer(app, '/uploads/events', ['uploads', 'events']);
setupStaticFileServer(app, '/uploads/upcomingEvents', [
  'uploads',
  'upcomingEvents',
]);

const dir = './uploads/images';

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname);
  },
});

app.use('/uploads/images', express.static(path.join('uploads', 'images')));

app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/events', eventsRoutes);

app.use((req, res, next) => {
  const error = new HttpError('Could not find this route.', 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || 'An unknown error occurred!' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.log(error);
  });
