import axios from 'axios';

import HttpError from '../models/http-error.js';

const mapboxKey = process.env.MAPBOX_API_KEY;
const MAPBOX_API_KEY = mapboxKey;
const getGeocode = async (address) => {
  const response = await axios.get(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      address
    )}.json`,
    {
      params: {
        access_token: MAPBOX_API_KEY,
      },
    }
  );

  const data = response.data;

  if (!data || data.features.length === 0) {
    throw new HttpError(
      'Could not find location for the specified address.',
      422
    );
  }

  const coordinates = data.features[0].geometry.coordinates;

  return {
    lng: coordinates[0],
    lat: coordinates[1],
  };
};

export { getGeocode };
