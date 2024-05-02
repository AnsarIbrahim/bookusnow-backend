import { Router } from 'express';
import { check } from 'express-validator';

import { createEvent } from '../controllers/eventControllers.js';
import upcomingEventsData from '../EventData/upcomingEventsData.js';
import eventData from '../EventData/eventData.js';
import fileUpload from '../middleware/file-upload.js';
import checkAuth from '../middleware/check-auth.js';
import Event from '../models/event.js';
import { deleteEvent } from '../controllers/eventControllers.js';
import downloadAndConvertSvg from '../middleware/convert-svg.js';

const router = Router();

router.get('/upcomeEvent', async (req, res, next) => {
  if (!upcomingEventsData || !Array.isArray(upcomingEventsData.events)) {
    return res
      .status(500)
      .json({ message: 'Upcoming events data is not available.' });
  }

  if (upcomingEventsData.events.length === 0) {
    return res.status(404).json({ message: 'No upcoming events found.' });
  }

  const upcomingEventsDataWithPng = await Promise.all(
    upcomingEventsData.events.map(async (event) => {
      const eventCopy = { ...event };
      if (typeof eventCopy.imgUrl === 'string') {
        try {
          eventCopy.imgUrl = await downloadAndConvertSvg(
            eventCopy.imgUrl,
            'upcomingEvents'
          );
        } catch (error) {
          console.error(
            `Failed to convert image for event ${eventCopy.eventName}:`,
            error
          );
        }
      }
      return eventCopy;
    })
  );

  res.json({
    upcomingEventsData: upcomingEventsDataWithPng,
  });
});

router.get('/', async (req, res, next) => {
  let dbEvents;
  try {
    dbEvents = await Event.find();
  } catch (err) {
    return res
      .status(500)
      .json({ message: 'Fetching events from database failed.' });
  }

  if (!eventData || !Array.isArray(eventData.events)) {
    return res.status(500).json({ message: 'Events data is not available.' });
  }

  if (eventData.events.length === 0 && (!dbEvents || dbEvents.length === 0)) {
    return res.status(404).json({ message: 'No events found.' });
  }

  const eventDataWithPng = await Promise.all(
    eventData.events.map(async (event) => {
      if (typeof event.imgUrl === 'string') {
        try {
          event.imgUrl = await downloadAndConvertSvg(event.imgUrl, 'events');
        } catch (error) {
          console.error(
            `Failed to convert image for event ${event.id}:`,
            error
          );
        }
      }
      return event;
    })
  );

  res.json({
    eventData: eventDataWithPng,
    dbEvents: dbEvents.map((event) => event.toObject({ getters: true })),
  });
});

router.get('/:eid', (req, res, next) => {
  const eventId = req.params.eid;

  const event = eventData.events.find((event) => event.id === eventId);

  if (!event) {
    return res
      .status(404)
      .json({ message: 'Could not find an event for the provided id.' });
  }

  res.json({ event });
});

router.use(checkAuth);

router.post(
  '/',
  fileUpload.single('image'),
  [
    check('eventName').not().isEmpty(),
    check('cityName').not().isEmpty(),
    check('date').isISO8601(),
  ],
  createEvent
);

router.delete('/:eid', deleteEvent);

export default router;
