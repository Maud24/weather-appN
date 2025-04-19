/**
 * @license MIT
 * @fileoverview Menage all routes
 * @copyright codewithsadee 2023 All rights reserved
 * @author codewithsadee <mohammadsadee24@gmail.com>
 */

'use strict';

import { updateWeather, error404 } from "./App1.js";
const defaultLocation = "#/weather?lat=51.5073219&lon=-0.1276474" // London

const currentLocation = () => {
    window.navigator.geolocation.getCurrentPosition(res => {
        const { latitude, longitude } = res.coords;
        updateWeather(latitude, longitude);
    }, err =>{
        window.location.hash = defaultLocation;
    });
}

/**
 * @param {string} query Searched query
 */
const searchedLocation = (query) => {
    const params = new URLSearchParams(query);
    const lat = parseFloat(params.get("lat"));
    const lon = parseFloat(params.get("lon"));

    updateWeather(lat, lon);
};

// updateWeather("lat=51.5073219", "lon=-0.1276474")

const routes = new Map([
    ["/current-location",currentLocation],
    ["/weather",searchedLocation]
]);

const checkHash =  function () {
    const requestURL = window.location.hash.slice(1);
    
    const [route, query] = requestURL.includes("?") ? requestURL.split("?") : [requestURL];

    routes.get(route) ? routes.get(route)(query) : error404();
}

window.addEventListener("hashchange", checkHash);

window.addEventListener("load", () => {
    if (!window.location.hash) {
        window.location.hash = "#/current-location";
    } else {
        checkHash();
    }
});