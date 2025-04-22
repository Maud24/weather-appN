'use strict';

const api_key = "4e961e64c39ef786890e2a72153035ef";

/**
 * Fetch data from server
 * @param {string} URL API url
 * @param {Function} callback callback
 */
export const fetchData = function(URL, callback) {
    fetch(`${URL}&appid=${api_key}`)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then(data => callback(data))
        .catch(err => console.error("API Fetch Error:", err));
};

export const url = {    
    currentWeather(lat, lon) {
        return `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric`;
    },
    forecast(lat, lon) {
        return `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric`;
    },
    airPollution(lat, lon) {
        return `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}`;
    },
    reverseGeo(lat, lon) {
        return `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=5`;
    },
    /**
     * @param {string} query Search query e.g.: "London", "New York"
     */
    geo(query) {
        return `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5`;
    }
};

 /**
 * Obtenir les données météo actuelles avec async/await
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<Object|null>}
 */
export const getWeatherData = async (lat, lon) => {
    const endpoint = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${api_key}`;
    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("Erreur API météo");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération des données météo :", error);
      return null;
    }
  };
  