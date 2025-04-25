/**
 * @license MIT
 * @fileoverview Menage all routes
 * @copyright Maud24 2025 All rights reserved
 * @author Maud24 <ondiguimarine@gmail.com>
 */

'use strict';

import { updateWeather, error404 } from "./App1.js";
const defaultLocation = "#/weather?lat=4.055897&lon=9.667027796676162" // Communaute urbaine de Douala

// Fonction pour obtenir la position actuelle
const currentLocation = () => {
    // Vérifiez si l'utilisateur a cliqué sur un bouton pour obtenir la localisation
    window.navigator.geolocation.getCurrentPosition(res => {
        const { latitude, longitude } = res.coords;
        updateWeather(latitude, longitude);
    }, err => {
        window.location.hash = defaultLocation;
    });
};

/**
 * @param {string} query Searched query
 */
const searchedLocation = (query) => {
    const params = new URLSearchParams(query);
    const lat = parseFloat(params.get("lat"));
    const lon = parseFloat(params.get("lon"));

    updateWeather(lat, lon);
};

// Mappage des routes
const routes = new Map([
    ["/current-location", currentLocation],
    ["/weather", searchedLocation]
]);

// Vérification du hash dans l'URL
const checkHash = function () {
    const requestURL = window.location.hash.slice(1);
    
    const [route, query] = requestURL.includes("?") ? requestURL.split("?") : [requestURL];

    routes.get(route) ? routes.get(route)(query) : error404();
};

// Ajout d'écouteurs d'événements
window.addEventListener("hashchange", checkHash, { passive: true });

window.addEventListener("load", () => {
    if (!window.location.hash) {
      // Par défaut, on ne déclenche pas la géolocalisation sans action utilisateur
      window.location.hash = "#/weather?lat=4.055897&lon=9.667027796676162"; // Communaute urbaine de Douala
    } else {
      checkHash();
    }
  });
  
  

// Ajoutez un bouton pour obtenir la localisation actuelle
const locationBtn = document.querySelector('[data-current-location-btn]');
if (locationBtn) {
  locationBtn.addEventListener('click', currentLocation);
}

