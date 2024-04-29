import { Router } from 'express';

import eventData from '../EventData/eventData.js';

const router = Router();

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

export default router;
