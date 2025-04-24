/**
 * @license MIT
 * @fileoverview Menage all routes
 * @copyright Maud24 2025 All rights reserved
 * @author Maud24 <ondiguimarine@gmail.com>
 */

 let isLoadingWeather = false; // Déclaration en haut du fichier
 
'use strict'

import { fetchData, url } from "./api.js";
import * as module from "./module.js";
import { getWeatherData } from "./api.js";

// Exemple d'utilisation
const exampleFunction = async () => {
  const lat = 34.05; // Latitude pour Los Angeles
  const lon = -118.25; // Longitude pour Los Angeles
  try {
      const weatherData = await getWeatherData(lat, lon);
      console.log(weatherData);
  } catch (error) {
      console.error("Erreur lors de la récupération des données météo :", error);
  }
};
exampleFunction();

/**
 * Add event listener on multiple elements 
 * @param {NodeList} elements Elements node array
 * @param {string} eventType Event Type e.g.: "click", "mouseover"
 * @param {Function} callback Callback function
 */
const addEventOnElements = (elements, eventType, callback) => {
    for (const element of elements) {
        element.addEventListener(eventType, callback);
    }
}

/**
 * Toggle search in mobile devices
 */
const searchView = document.querySelector("[data-search-view]");
const searchTogglers = document.querySelectorAll("[data-search-toggler]");

const toggleSearch = () => {
    searchView.classList.toggle("active");
}
addEventOnElements(searchTogglers, "click", toggleSearch);


/**
 * SEARCH INTEGRATION
 */
const searchField = document.querySelector("[data-search-field]");
const searchResult = document.querySelector("[data-search-result]");

let searchTimeout = null;
const searchTimeoutDuration = 500;

searchField.addEventListener("input", function () {

    if (searchTimeout) clearTimeout(searchTimeout);

    if (!searchField.value) {
        searchResult.classList.remove("active");
        searchResult.innerHTML = "";
        searchField.classList.remove("searching");
    } else {
        searchField.classList.add("searching");
    }

    if (searchField.value) {
        searchTimeout = setTimeout(() => {
            fetchData(url.geo(searchField.value), function (locations) {
                searchField.classList.remove("searching");
                searchResult.classList.add("active");
                searchResult.innerHTML = `
                    <ul class="view-list" data-search-list></ul>
                `;

                const /** {NodeList} | [] */ items =  [];

                for (const { name, lat, lon, country, state } of locations) {
                    const searchItem = document.createElement("li");
                    searchItem.classList.add("view-item");

                    searchItem.innerHTML = `
                        <span class="m-icon">location_on</span>

                        <div>
                            <p class="item-title">${name}</p>

                            <p class="label-2 item-subtitle">${state || ""} ${country}</p>
                        </div>

                        <a href="#/weather?lat=${lat}&lon=${lon}" class="item-link has-state" aria-label="${name} weather" data-search-toggler></a>
                    `;

                    searchResult.querySelector("[data-search-list]").appendChild(searchItem);
                    items.push(searchItem.querySelector("[data-search-toggler]"));
                }

                addEventOnElements(items, "click", function () {
                    toggleSearch();
                    searchResult.classList.remove("active");
                })
            });
        }, searchTimeoutDuration);
    }

});

const container = document.querySelector("[data-container]");
const loading = document.querySelector("[data-loading]");
const errorContent = document.querySelector("[data-error-content]");

function addToHistory(name, lat, lon) {
    const historyList = JSON.parse(localStorage.getItem("weatherSearchHistory")) || [];
    const newEntry = { name, lat, lon };
  
    // Supprimer doublons
    const filtered = historyList.filter(item => item.name !== name);
  
    filtered.unshift(newEntry); // Ajouter au début
    const updated = filtered.slice(0, 5); // Limite à 5
  
    localStorage.setItem("weatherSearchHistory", JSON.stringify(updated));
    renderHistory(); // Mettre à jour l'affichage
  }

  function renderHistory() {
    const list = document.getElementById("history-list");
    const history = JSON.parse(localStorage.getItem("weatherSearchHistory")) || [];
    list.innerHTML = "";
  
    history.forEach(entry => {
      const li = document.createElement("li");
      li.classList.add("card", "card-sm");
      li.style.cursor = "pointer";
      li.textContent = entry.name;
      li.addEventListener("click", () => {
        updateWeather(entry.lat, entry.lon);
      });
      list.appendChild(li);
    });
  }
  
  let tempChart; // global pour pouvoir le détruire avant de le recréer

  function renderTempChart(forecastList, timezone) {
    const ctx = document.getElementById("tempChart").getContext("2d");
  
    const labels = [];
    const dataTemps = [];
  
    for (let i = 0; i < 8; i++) {
      const item = forecastList[i];
      const hour = module.getHours(item.dt, timezone);
      labels.push(hour);
      dataTemps.push(item.main.temp);
    }
  
    // Si un ancien graphique existe, on le détruit
    if (tempChart) {
      tempChart.destroy();
    }
  
    tempChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: "Température (°C)",
          data: dataTemps,
          borderColor: "#B5A1E5",
          backgroundColor: "rgba(181, 161, 229, 0.2)",
          tension: 0.3,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: {
              color: "#EAE6F2"
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: "#EAE6F2"
            }
          },
          y: {
            ticks: {
              color: "#EAE6F2"
            }
          }
        }
      }
    });
  }
 
/**
 * Render all weather data in html page
 * 
 * @param {number} lat Latitude
 * @param {number} lon Longitude
 */
export const updateWeather = function (lat, lon) {
  if (isLoadingWeather) return; // Éviter les appels multiples
    isLoadingWeather = true; // Marquer comme en cours de chargement

    loading.style.display = "grid";
    container.style.overflowY = "hidden";
    container.classList.remove("fade-in");
    errorContent.style.display = "none";

    //Reinitialiser les sections de meteo
    const currentWeatherSection = document.querySelector("[data-current-weather]");
    const highlightSection = document.querySelector("[data-highlights]");
    const hourlySection = document.querySelector("[data-hourly-forecast]");
    const forecastSection = document.querySelector("[data-5-day-forecast]");

    currentWeatherSection.innerHTML = "";
    highlightSection.innerHTML = "";
    hourlySection.innerHTML = "";
    forecastSection.innerHTML = "";

    //verifier si la localisation actuelle est desactivee
    const currentLocationBtn = document.querySelector("[data-current-location-btn]");
    
    if (currentLocationBtn) {
        if (window.location.hash === "#/current-location") {
            currentLocationBtn.setAttribute("disabled", "");
        } else {
            currentLocationBtn.removeAttribute("disabled");
        }
      }

            
      // Fonction pour afficher l'alerte
  // Fonction pour afficher la modale d'alerte
function showAlert(message, type = 'warning') {
    const alertModal = document.querySelector('.alert-modal');
    const alertContent = alertModal.querySelector('.alert-content');
    const closeButton = alertModal.querySelector('.close-btn');

    let alertIcon = '';
    
    if (type === 'storm') {
        alertIcon = '⛈️'; // Emoji d'orage
        alertContent.querySelector('h3').innerHTML = `${alertIcon} Alerte Orage !`;
    } else {
        alertIcon = '⚠️'; // Emoji d'alerte générique
        alertContent.querySelector('h3').innerHTML = `${alertIcon} Alerte Météo !`;
    }
    alertContent.querySelector('p').textContent = message;

    // Afficher la modale
    alertModal.style.display = 'flex';

    // Fermer la modale lorsque la croix est cliquée
    closeButton.addEventListener('click', function() {
        alertModal.style.display = 'none';
    });    
}

// Fonction pour vérifier les alertes et afficher l'alerte
function checkWeatherAlert(weatherData) {
    // Si l'alerte météo contient des informations sur l'orage
    if (weatherData.weather[0].description.toLowerCase().includes('storm') || weatherData.weather[0].description.toLowerCase().includes('thunderstorm')) {
        showAlert('Il y a un orage en approche. Veuillez prendre vos précautions.', 'storm');
    } else if (weatherData.weather[0].description.toLowerCase().includes('rain')) {
        showAlert('De la pluie est attendue. Prenez un parapluie !');
    }
}

    /**
     * CURRENT WEATHER SECTION
     */
    //recuperation des donnees
    fetchData(url.currentWeather(lat, lon), function (currentWeather) {

      
      // Vérifie s’il pleut pour afficher le GIF
      const rainGif = document.getElementById("rain-overlay");
      const weatherDesc = currentWeather.weather[0].description.toLowerCase();
      if (weatherDesc.includes("rain") || weatherDesc.includes("shower") || weatherDesc.includes("drizzle") || weatherDesc.includes("storm") || weatherDesc.includes("orage")) {
        rainGif.style.display = "block";
      } else {
        rainGif.style.display = "none";
      }

      checkWeatherAlert(currentWeather); // <- Appel déplacé ici pour éviter doublon
  
      const {
          weather,
          dt: dateUnix,
          sys: { sunrise: sunriseUnixUTC, sunset: sunsetUnixUTC },
          main: { temp, feels_like, pressure, humidity },
          visibility,
          timezone
      } = currentWeather;
  
      const [{ description, icon }] = weather;      

      const card = document.createElement("div");
      card.classList.add("card", "card-lg", "current-weather-card");
  
      card.innerHTML = `
          <h2 class="title-2 card-title">Météo actuelle</h2>
          <div class="weapper">
              <p class="heading">${parseInt(temp)}&deg;<sup>c</sup></p>
              <img src="./assets/images/weather_icons/${icon}.png" width="64" height="64" alt="${description}" class="weather-icon">
          </div>
          <p class="body-3">${description}</p>
          <ul class="meta-list">
              <li class="meta-item">
                  <span class="m-icon">calendar_today</span>
                  <p class="title-3 meta-text">${module.getDate(dateUnix, timezone)}</p>
              </li>
              <li class="meta-item">
                  <span class="m-icon">location_on</span>
                  <p class="title-3 meta-text" data-location></p>
              </li>
          </ul>
      `;      
      fetchData(url.reverseGeo(lat, lon), function([{ name, country }]) {
          card.querySelector("[data-location]").innerHTML = `${name}, ${country}`;
          addToHistory(`${name}, ${country}`, lat, lon);
      });
      currentWeatherSection.appendChild(card);
  
        /**
         * TODAY'S HIGHLIGHTS
         */
        fetchData(url.airPollution(lat, lon), function (airPollution) {

            const [{
                main: {aqi },
                components: { no2, o3, so2, pm2_5 }
            }]=airPollution.list;

            const card = document.createElement("div");
            card.classList.add("card", "card-lg");
            card.innerHTML = `
            
                        <h2 class="title-2" id="highlights-label">Points forts d'aujourd'hui</h2>

                        <div class="highlight-list">
                            <div class="card card-sm highlight-card one">

                                <h3 class="title-3">Qualité de l'Air</h3>

                                <div class="wrapper">

                                    <span class="m-icon">air</span>

                                    <ul class="card-list">

                                        <li class="card-item">
                                            <p class="title-1">${pm2_5.toPrecision(3)}</p>

                                            <p class="label-1">PM<sub>2.5</sub></p>
                                        </li>

                                        <li class="card-item">
                                            <p class="title-1">${so2.toPrecision(3)}</p>

                                            <p class="label-1">SO<sub>2</sub></p>
                                        </li>
                                        
                                        <li class="card-item">
                                            <p class="title-1">${no2.toPrecision(3)}</p>

                                            <p class="label-1">NO<sub>2</sub></p>
                                        </li>
                                        
                                        <li class="card-item">
                                            <p class="title-1">${o3.toPrecision(3)}</p>

                                            <p class="label-1">O<sub>3</sub></p>
                                        </li>

                                    </ul>

                                </div>


                                <span class="badge aqi-${aqi} label-${aqi}" title="${module.aqiText[aqi].message}">
                                    ${module.aqiText[aqi].level}
                                </span>

                            </div>

                            <div class="card card-sm highlight-card two">

                                <h3 class="title-3">Levée et couchée de soleil</h3>

                                <div class="card-list">

                                    <div class="card-item">
                                        <span class="m-icon">clear_day</span>

                                        <div>
                                        <p class="label-1">Soleil</p> 

                                        <p class="title-1">${module.getTime(sunriseUnixUTC, timezone)}</p>
                                        </div>
                                    </div>

                                    <div class="card-item">
                                        <span class="m-icon">clear_night</span>

                                        <div>
                                        <p class="label-1">Lune</p> 

                                        <p class="title-1">${module.getTime(sunsetUnixUTC, timezone)}</p>
                                        </div>
                                    </div>
                                
                                </div>
                            </div>

                            <div class="card-sm highlight-card">

                                <h3 class="title-3">Humidité</h3>

                                <div class="wrapper">
                                    <span class="m-icon">humidity_percentage</span>

                                    <p class="title-1">${humidity}<sub>%</sub></p>
                                </div>

                            </div>
                            

                            <div class="card-sm highlight-card">

                                <h3 class="title-3">Pression</h3>

                                <div class="wrapper">
                                    <span class="m-icon">airwave</span>

                                    <p class="title-1">${pressure}<sub>hPa</sub></p>
                                </div>

                            </div>
                                                        
                            <div class="card-sm highlight-card">

                                <h3 class="title-3">Visibilité</h3>

                                <div class="wrapper">
                                    <span class="m-icon">visibility</span>
                                    <p class="title-1">${visibility / 1000}<sub>Km</sub></p>
                                </div>

                            </div>

                            <div class="card-sm highlight-card">

                                <h3 class="title-3">On dirait</h3>

                                <div class="wrapper">
                                    <span class="m-icon">thermostat</span>

                                    <p class="title-1">${parseInt(feels_like)}&deg;<sup>c</sup></p>
                                </div>

                            </div>

                        </div>
            `;
            highlightSection.appendChild(card);

        });

        /**
         * 24H FORECAST SECTION
         */
        fetchData(url.forecast(lat, lon), function (forecast) {

            const {
                list: forecastList,
                city: { timezone }
            } = forecast;

            hourlySection.innerHTML = `
                <h2 class="title-2">Aujourd'hui à</h2>

                    <div class="slider-container">
                        <ul class="slider-list" data-temp></ul>

                        <ul class="slider-list" data-wind></ul>
                    </div>
            `;

        for (const [index, data] of forecastList.entries()) {
            if(index > 7) break;

            const {
                dt: dateTimeUnix,
                main: { temp },
                weather,
                wind: { deg: windDirection, speed: windSpeed }
            } = data
            const [{ icon, description}] = weather

            const tempLi = document.createElement("li");
            tempLi.classList.add("slider-item");

            tempLi.innerHTML = `
                <div class="card card-sm slider-card">


                <p class="body-3">${module.getHours(dateTimeUnix, timezone)}</p>
                
                <img src="./assets/images/weather_icons/${icon}.png" width="48" height="48" loading="lazy" alt="${description}" class="weather-icon" title="${description}">

                <p class="body-3">${parseInt(temp)}&deg;</p>

                </div>
            `;
            hourlySection.querySelector("[data-temp]").appendChild(tempLi);

            const windLi = document.createElement("li");
            windLi.classList.add("slider-item");

            windLi.innerHTML = `
                <div class="card card-sm slider-card">


                    <p class="body-3">${module.getHours(dateTimeUnix, timezone)}</p>
                    
                    <img src="./assets/images/weather_icons/direction.png" width="48" height="48" loading="lazy" alt="direction" class="weather-icon" style="transform: rotate(${windDirection - 180}deg)">

                    <p class="body-3">${parseInt(module.mps_to_kmh(windSpeed))} km/h</p>

                </div>
            `;
            hourlySection.querySelector("[data-wind]").appendChild(windLi);
        }

        // --- Graphique de température sur 24h ---
        const hours = [];
        const temperatures = [];

        for (let i = 0; i < 24; i++) {
        const forecast = forecastList[i];
        const hour = module.getHours(forecast.dt, timezone);
        const temp = parseInt(forecast.main.temp);

        hours.push(hour);
        temperatures.push(temp);
        }

        const existingChart = Chart.getChart("temperatureChart");
        if (existingChart) existingChart.destroy();

        const ctx = document.getElementById("temperatureChart").getContext("2d");
        new Chart(ctx, {
        type: 'line',
        data: {
        labels: hours,
        datasets: [{
            label: 'Température (°C)',
            data: temperatures,
            backgroundColor: 'rgba(255,99,132,0.2)',
            borderColor: 'rgba(255,99,132,1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3
        }]
        },
        options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
            beginAtZero: false,
            title: {
                display: true,
                text: '°C'
            }
            }
        },
        plugins: {
            legend: {
            display: true
            }
        }
        }
        });

                /**
         * 5 DAY FORECAST SECTION
         */
                forecastSection.innerHTML = `
                <h2 class="title-2" id="forecast-label">Prévisions sur 5 jours</h2>
    
                <div class="card card-lg forecast-card">
                    <ul data-forecast-list></ul>
                </div>
            `;
    
            const forecastListContainer = forecastSection.querySelector("[data-forecast-list]");
            forecastListContainer.innerHTML = "";
    
            // Grouper par jour
            const days = {};
            forecastList.forEach(item => {
              const date = item.dt_txt.split(" ")[0];
              if (!days[date]) days[date] = [];
              days[date].push(item);
            });
    
            const sortedDates = Object.keys(days).slice(0, 5); // seulement 5 jours
    
            sortedDates.forEach(dateStr => {
            const dayData = days[dateStr];
            const temps = dayData.map(d => d.main.temp);
            const tempMins = dayData.map(d => d.main.temp_min);
            const tempMaxs = dayData.map(d => d.main.temp_max);
            const icons = dayData.map(d => d.weather[0].icon);
            const descriptions = dayData.map(d => d.weather[0].description);

            const minTemp = Math.min(...tempMins);
            const maxTemp = Math.max(...tempMaxs);
            const icon = icons[0];
            const desc = descriptions[0];
            const date = new Date(dateStr);
    
              const li = document.createElement("li");
              li.classList.add("card-item");
    
              li.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                <img src="./assets/images/weather_icons/${icon}.png" width="36" height="36" alt="${desc}" class="weather-icon" title="${desc}">
                <p class="label-1" style="margin: 0; font-weight: 600;">
                🌡️ ${parseInt(minTemp)}° / ${parseInt(maxTemp)}° — ${date.getDate()} ${module.monthNames[date.getUTCMonth()]}, ${module.weekDayNames[date.getUTCDay()]}
                </p>
                </div>
              `;
              forecastListContainer.appendChild(li);
            });

        loading.style.display = "none";
        container.style.overflowY = "overlay";
        container.classList.add("fade-in");
        isLoadingWeather = false;

        renderTempChart(forecastList, timezone);

        displayMap(lat, lon);

        });
    });
}

const api_key = "4e961e64c39ef786890e2a72153035ef";

let map;
let marker;
let weatherMask;
let miniMap;
// 1. Ajouter le toggle "Animation du vent"

function displayMap(lat, lon) {
  updateRainOverlay(lat, lon);

    const apiKey = "4e961e64c39ef786890e2a72153035ef";
  
    if (!map) {
      map = L.map("map").setView([lat, lon], 10);
             

            // Checkbox animation du vent
            const windCheckboxControl = L.control({ position: "topright" });
            windCheckboxControl.onAdd = function () {
            const div = L.DomUtil.create("div", "map-layer-toggle");
            div.innerHTML = `
                <label style="display: flex;
            align-items: center;
            gap: 8px;
            background-color: #f0f8ff;
            color: #333;
            padding: 8px 12px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            cursor: pointer">
                <input type="checkbox" id="wind-animation-checkbox" style="margin-right: 6px;" />
                <span>🌬️ Animation du vent</span>
                </label>
            `;
            return div;
            };
            windCheckboxControl.addTo(map);

            let windyIframeControl;

            document.getElementById("wind-animation-checkbox").addEventListener("change", function (e) {
            if (e.target.checked) {
                // Afficher l'iframe Windy
                if (!windyIframeControl) {
                windyIframeControl = L.control({ position: "bottomright" });
                windyIframeControl.onAdd = function () {
                    const div = L.DomUtil.create("div", "windy-iframe-container");
                    div.innerHTML = `
                    <iframe 
                        width="400" 
                        title="Animation du vent - Windy"
                        height="300"
                        src="https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=400&height=300&zoom=7&level=surface&overlay=wind"
                        frameborder="0"
                        style="border-radius: 8px;">
                    </iframe>`;
                    return div;
                };
                windyIframeControl.addTo(map);
                }
            } else {
                // Retirer l'iframe Windy si décoché
                if (windyIframeControl) {
                map.removeControl(windyIframeControl);
                windyIframeControl = null;
                }
            }
            });

        const baseLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://carto.com/">CartoDB</a>',
            subdomains: 'abcd',
            maxZoom: 19
          }).addTo(map);
      
          marker = L.marker([lat, lon]).addTo(map);
  
      // Cercle de 30 km
      weatherMask = L.circle([lat, lon], {
        radius: 30000,
        color: "#007bff",
        weight: 2,
        fillOpacity: 0.05
      }).addTo(map);
  
      // Couches météo interactives
      const weatherLayers = {
        "Pluie": L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`, { opacity: 0.9 }),
        "Nuages": L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`, { opacity: 0.8 }),
        "Température": L.tileLayer(`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${apiKey}`, { opacity: 0.5 }),
        "Vent": L.tileLayer(`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${apiKey}`, { opacity: 0.7 })
      };

      // Ajouter les couches météo au contrôle (mais pas activées d’office)
    L.control.layers(null, weatherLayers, { collapsed: false }).addTo(map);

    let windyOverlay = null;

    // Activer une couche par défaut si tu veux (par exemple pluie)
      weatherLayers["Pluie"].addTo(map);
  
      // Recentrage
      const recenterControl = L.control({ position: "topleft" });
      recenterControl.onAdd = function () {
        const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
        div.innerHTML = `<a href="#" title="Recentrer">⟳</a>`;
        div.onclick = function (e) {
          e.preventDefault();
          map.setView([lat, lon], 10);
        };
        return div;
      };
      recenterControl.addTo(map);
  
      // Recherche intégrée à la carte
      const searchInput = L.control({ position: "topright" });
      searchInput.onAdd = function () {
        const div = L.DomUtil.create("div", "leaflet-control leaflet-bar");
        div.innerHTML = `
          <input id="map-search" type="text" placeholder="Rechercher..." style="padding:6px; width:160px;">
        `;
        L.DomEvent.disableClickPropagation(div);
        return div;
      };
      searchInput.addTo(map);
  
      document.getElementById("map-search").addEventListener("keyup", function (e) {
        if (e.key === "Enter") {
          const query = e.target.value;
          fetchData(url.geo(query), ([result]) => {
            if (!result) return;
            const { lat, lon } = result;
            updateWeather(lat, lon); // charge tout depuis la nouvelle position
          });
        }
      });
  
      // Infobulle météo au clic
      map.on("click", function (e) {
        fetchData(url.currentWeather(e.latlng.lat, e.latlng.lng), function (data) {
          const temp = parseInt(data.main.temp);
          const desc = data.weather[0].description;
          const popupContent = `<strong>${temp}°C</strong><br>${desc}`;
          L.popup()
            .setLatLng(e.latlng)
            .setContent(popupContent)
            .openOn(map);
            
        });

      });
  
      // Minimap
      miniMap = new L.Control.MiniMap(
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          minZoom: 0,
          maxZoom: 13
        }),
        { toggleDisplay: true, minimized: false, position: "bottomright" }
      ).addTo(map);
  
      // Légende dynamique météo
      const legend = L.control({ position: "bottomleft" });
      legend.onAdd = function () {
        const div = L.DomUtil.create("div", "legend");
        div.innerHTML = `
          <h4>Légende météo</h4>
          <p><span class="legend-icon" style="background:#1f78b4"></span> Pluie</p>
          <p><span class="legend-icon" style="background:#a0a0a0"></span> Nuages</p>
          <p><span class="legend-icon" style="background:#f03"></span> Température</p>
          <p><span class="legend-icon" style="background:#00a86b"></span> Vent</p>
        `;
        return div;
      };
      legend.addTo(map);
      
      let windLayer; // Place ça avant les contrôles

      document.getElementById("wind-animation-checkbox").addEventListener("change", function (e) {
        if (e.target.checked) {
            fetch("./assets/data/wind-sample.json") // <- METS le fichier ici
            .then(res => res.json())
            .then(data => {
            windLayer = L.velocityLayer({
              displayValues: true,
              displayOptions: {
                velocityType: "Vent",
                displayPosition: "bottomleft",
                displayEmptyString: "Pas de données",
                angleConvention: "bearingCW",
                speedUnit: "m/s"
              },
              data: module.convertToVelocityFormat(data),
              maxVelocity: 25
            }).addTo(map);
          });
        } else {
          if (windLayer) {
            map.removeLayer(windLayer);
            windLayer = null;
          }
        }
      });
      
    } else {
      map.setView([lat, lon], 10);
      marker.setLatLng([lat, lon]);
  
      if (weatherMask) map.removeLayer(weatherMask);
      weatherMask = L.circle([lat, lon], {
        radius: 30000,
        color: "#007bff",
        weight: 2,
        fillOpacity: 0.05
      }).addTo(map);
    }

        const windyControl = L.control({ position: "bottomright" });
        windyControl.onAdd = function () {
        const div = L.DomUtil.create("div", "windy-iframe-container");
        div.style.display = "none"; // cachée par défaut
        div.innerHTML = `
        <iframe id="windy-iframe" width="300" height="200"
            src="https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=300&height=200&zoom=7"
            frameborder="0">
        </iframe>`;
        return div;
        };
        windyControl.addTo(map);

        // Référence pour toggler
        setTimeout(() => {
        const iframeContainer = document.querySelector(".windy-iframe-container");
        const windyToggle = document.getElementById("windy-iframe-toggle");
        if (iframeContainer && windyToggle) {
        windyToggle.addEventListener("change", () => {
            iframeContainer.style.display = windyToggle.checked ? "block" : "none";
        });
        }
        }, 500);
        let rainOverlay = null;

        async function updateRainOverlay(lat, lon) {
          // Récupère les données météo actuelles
          try {
            const weather = await getWeatherData(lat, lon);
            const condition = weather.weather[0].main.toLowerCase(); // ex: "Rain", "Clouds"
        
            if (condition.includes("rain") || condition.includes("drizzle")) {
              if (!rainOverlay) {
                const RainLayer = L.Control.extend({
                  onAdd: function () {
                    const img = L.DomUtil.create("img");
                    img.src = "./assets/images/rain-overlay.gif";
                    img.style.position = "absolute";
                    img.style.top = 0;
                    img.style.left = 0;
                    img.style.width = "100%";
                    img.style.height = "100%";
                    img.style.pointerEvents = "none";
                    img.style.zIndex = 400;
                    return img;
                  }
                });
                rainOverlay = new RainLayer({ position: "topright" });
                rainOverlay.addTo(map);
              }
            } else {
              if (rainOverlay) {
                map.removeControl(rainOverlay);
                rainOverlay = null;
              }
            }
          } catch (err) {
            console.error("❌ Erreur mise à jour pluie : ", err);
          }
        }
  }

// Charger l'historique au chargement initial
renderHistory();

export const error404 = () => errorContent.style.display = "flex";

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => console.log("✅ Service Worker enregistré :", reg.scope))
      .catch(err => console.error("❌ Erreur lors de l'enregistrement du Service Worker :", err));
  });
}

document.getElementById('chatbot-toggle').addEventListener('click', () => {
  const chatbot = document.getElementById('chatbot');
  chatbot.classList.toggle('active');
});
