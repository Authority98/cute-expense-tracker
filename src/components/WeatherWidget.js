import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IoSearch, IoSunnyOutline, IoCloudyOutline, IoRainyOutline, IoThunderstormOutline, IoSnowOutline, IoWaterOutline } from 'react-icons/io5';
import { WiHumidity, WiStrongWind } from 'react-icons/wi';
import { MdLocationOn } from 'react-icons/md';
import { BsCalendar3, BsClock } from 'react-icons/bs';

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchWeather = async (searchCity = '') => {
    setLoading(true);
    setError(null);
    try {
      let url;
      if (searchCity) {
        url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(searchCity)}&units=metric&appid=f23b38671b4791fc9d5a074883681a6b`;
      } else {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        const { latitude, longitude } = position.coords;
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=f23b38671b4791fc9d5a074883681a6b`;
      }

      const response = await axios.get(url);
      setWeather(response.data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      if (error.response) {
        setError(`Error ${error.response.status}: ${error.response.data.message}`);
      } else if (error.request) {
        setError('No response received from the weather service. Please check your internet connection.');
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const handleCitySearch = (e) => {
    e.preventDefault();
    if (city.trim()) {
      fetchWeather(city);
    }
  };

  const getWeatherIcon = (description) => {
    const iconMap = {
      'clear sky': <IoSunnyOutline className="weather-icon" />,
      'few clouds': <IoCloudyOutline className="weather-icon" />,
      'scattered clouds': <IoCloudyOutline className="weather-icon" />,
      'broken clouds': <IoCloudyOutline className="weather-icon" />,
      'shower rain': <IoRainyOutline className="weather-icon" />,
      'rain': <IoRainyOutline className="weather-icon" />,
      'thunderstorm': <IoThunderstormOutline className="weather-icon" />,
      'snow': <IoSnowOutline className="weather-icon" />,
      'mist': <IoCloudyOutline className="weather-icon" />,
    };

    return iconMap[description.toLowerCase()] || <IoCloudyOutline className="weather-icon" />;
  };

  if (loading) {
    return <div className="weather-widget loading">Loading weather...</div>;
  }

  if (error) {
    return (
      <div className="weather-widget error">
        <h2>Weather</h2>
        <p>{error}</p>
        <form onSubmit={handleCitySearch} className="city-search">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Search city..."
          />
          <button type="submit"><IoSearch /></button>
        </form>
      </div>
    );
  }

  if (!weather) {
    return <div className="weather-widget loading">Loading weather...</div>;
  }

  return (
    <div className="weather-widget-container">
      <div className="weather-widget">
        <div className="weather-content">
          <h2>Weather</h2>
          <form onSubmit={handleCitySearch} className="city-search">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Search city..."
            />
            <button type="submit"><IoSearch /></button>
          </form>
          <div className="main-weather">
            {getWeatherIcon(weather.weather[0].description)}
            <div className="temperature-container">
              <span className="current-temp">{Math.round(weather.main.temp)}°C</span>
            </div>
          </div>
          <div className="additional-info">
            <div className="info-item">
              <IoWaterOutline className="info-icon" />
              <span>Precipitation</span>
              <span>{weather.rain ? `${weather.rain['1h']} mm` : '0 mm'}</span>
            </div>
            <div className="info-item">
              <WiHumidity className="info-icon" />
              <span>Humidity</span>
              <span>{weather.main.humidity}%</span>
            </div>
            <div className="info-item">
              <WiStrongWind className="info-icon" />
              <span>Wind</span>
              <span>{Math.round(weather.wind.speed * 3.6)} km/h</span>
            </div>
            <div className="info-item">
              <MdLocationOn className="info-icon" />
              <span>Location</span>
              <span>{weather.name}, {weather.sys.country}</span>
            </div>
            <div className="info-item">
              <BsCalendar3 className="info-icon" />
              <span>Date</span>
              <span>{new Date().toLocaleDateString('en-US', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric'
              })}</span>
            </div>
            <div className="info-item">
              <BsClock className="info-icon" />
              <span>Time</span>
              <span>{new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;