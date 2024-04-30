import fs from 'fs';

import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import haversine from 'haversine';

import HttpError from '../models/http-error.js';
import User from '../models/user.js';
import Event from '../models/event.js';
import { getGeocode } from '../utils/location.js';
import { getWeather } from '../utils/weather.js';

const createEvent = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { eventName, cityName, date, userLocation, image } = req.body;

  let coordinates;
  try {
    coordinates = await getGeocode(cityName);
  } catch (error) {
    return next(
      new HttpError('Fetching coordinates failed, please try again later', 500)
    );
  }

  let weather;
  try {
    weather = await getWeather(cityName);
  } catch (error) {
    return next(
      new HttpError('Fetching weather failed, please try again later', 500)
    );
  }

  let imageBuffer;
  if (req.file) {
    imageBuffer = fs.readFileSync(req.file.path);
  } else {
    const defaultImagePath = 'uploads/images/default.jpg';
    if (fs.existsSync(defaultImagePath)) {
      imageBuffer = fs.readFileSync(defaultImagePath);
    } else {
      return next(new HttpError('Default image not found.', 404));
    }
  }

  let eventCityCoordinates, userLocationCoordinates;
  try {
    eventCityCoordinates = await getGeocode(cityName);
    userLocationCoordinates = await getGeocode(userLocation);
  } catch (error) {
    return next(
      new HttpError('Fetching coordinates failed, please try again later', 500)
    );
  }

  if (!eventCityCoordinates || !userLocationCoordinates) {
    return next(
      new HttpError(
        'Could not fetch coordinates for one or both locations',
        500
      )
    );
  }

  const distance = haversine(
    {
      latitude: userLocationCoordinates.lat,
      longitude: userLocationCoordinates.lng,
    },
    { latitude: eventCityCoordinates.lat, longitude: eventCityCoordinates.lng }
  );

  const createdEvent = new Event({
    eventName,
    cityName,
    date,
    weather,
    image: imageBuffer,
    distanceKm: distance,
    userLocation: {
      type: 'Point',
      coordinates: [userLocationCoordinates.lng, userLocationCoordinates.lat],
    },
    creator: req.userData.userId,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Creating event failed, please try again.',
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError('Could not find user for provided id.', 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdEvent.save({ session: sess });
    user.events.push(createdEvent);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Creating event failed, please try again.',
      500
    );
    return next(error);
  }

  res.status(201).json({ event: createdEvent });
};

const deleteEvent = async (req, res, next) => {
  const eventId = req.params.eid;

  let event;
  try {
    event = await Event.findById(eventId).populate('creator');
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete event.',
      500
    );
    return next(error);
  }

  if (!event) {
    const error = new HttpError('Could not find event for this id.', 404);
    return next(error);
  }

  // Check if the user is an admin or the creator of the event
  if (
    req.userData.userId !== event.creator.id.toString() &&
    req.userData.role !== 'admin'
  ) {
    const error = new HttpError(
      'You are not allowed to delete this event.',
      401
    );
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await event.deleteOne({ session: sess });
    event.creator.events.pull(event);
    await event.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.error(err);
    const error = new HttpError(
      'Something went wrong, could not delete event.',
      500
    );
    return next(error);
  }

  res.status(200).json({ message: 'Deleted event.' });
};

export { createEvent, deleteEvent };
