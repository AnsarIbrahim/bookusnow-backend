import axios from 'axios';

const getWeather = async (city) => {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&APPID=${process.env.OPENWEATHERMAP_API_KEY}`
    );

    if (
      response.data &&
      response.data.weather &&
      response.data.weather[0] &&
      response.data.main
    ) {
      const weatherDescription = response.data.weather[0].description;
      const temperatureKelvin = response.data.main.temp;

      // Convert temperature from Kelvin to Celsius
      const temperatureCelsius = Math.round(temperatureKelvin - 273.15);

      return `${weatherDescription}, ${temperatureCelsius}C`;
    }

    throw new Error('Could not get weather data');
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export { getWeather };
