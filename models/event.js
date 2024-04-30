import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  cityName: { type: String, required: true },
  userLocation: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  date: { type: Date, required: true },
  weather: { type: String, required: true },
  distanceKm: { type: Number, required: true },
  image: { type: Buffer, required: true },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
});

const Event = mongoose.model('Event', eventSchema);

export default Event;
