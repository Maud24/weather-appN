/**
 * @license MIT
 * @fileoverview All module functions
 * @copyright codewithsadee 2023 All rights reserved
 * @author codewithsadee <mohammadsadee24@gmail.com>
 */

'use strict';

export const weekDayNames = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi"
];

export const monthNames = [
    "Jan",
    "Fev",
    "Mar",
    "Avr",
    "Mai",
    "Juin",
    "Juil",
    "Aou",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];


/**
 * @param {number} dateUnix Unix date in seconds
 * @param {number} timezone Timezone shift from UTC in seconds
 * @returns {string} Date String. format:"Sunday 10, Jan"
 */
export const getDate = function(dateUnix, timezone) {
    const date = new Date((dateUnix + timezone) * 1000);
    const weekDayName = weekDayNames[date.getUTCDay()];
    const monthName = monthNames[date.getUTCMonth()];

    return `${weekDayName} ${date.getUTCDate()}, ${monthName}`;
}


/**
 * @param {number} timeUnix Unix date in seconds
 * @param {number} timezone Timezone shift from UTC in seconds
 * @returns {string} Time string. format: "HH:MM AM/PM"
 */
export const getTime = function(timeUnix, timezone) {
    const date = new Date((timeUnix + timezone) * 1000);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const period = hours >= 12 ? "PM" : "AM";

    return `${hours % 12 || 12}:${minutes} ${period}`;
}


/**
 * @param {number} timeUnix Unix date in seconds
 * @param {number} timezone Timezone shift from UTC in seconds
 * @returns {string} Time string. format: "HH AM/PM"
 */
export const getHours = function(timeUnix, timezone) {
    const date = new Date((timeUnix + timezone) * 1000);
    const hours = date.getUTCHours();
    const period = hours >= 12 ? "PM" : "AM";

    return `${hours % 12 || 12} ${period}`;
}




/**
 * @param {number} mps  Metter per seconds
 * @returns {number} Kilometer per hours
 */
export const mps_to_kmh = mps => mps * 3.6;


export const aqiText = {
    1: {
        level: "Good",
        message: "Air quality is considered satisfactory, and air pollution poses little or no risk"
    },
    2: {
        level: "Fair",
        message: "Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number who are unusually sensitive to air pollution."
    },
    3: {
        level: "Moderate",
        message: "Members of sensitive groups may experience health effects. The general public is not likely to be affected"
    },
    4: {
        level: "Poor",
        message: "Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects."
    },
    5: {
        level: "Very Poor",
        message: "Health warnings of emergency conditions. The entire population is more likely to be affected."
    }
}

/**
 * Convert OpenWeather wind data to velocityLayer format
 * You must ensure the input `data` matches expected format.
 */
// Convertir les données fictives pour l'exemple (à remplacer par un vrai format si tu veux plus tard)
export function convertToVelocityFormat(apiData) {
    return {
      header: {
        parameterUnit: "m/s",
        parameterNumber: 2,
        parameterNumberName: "Wind speed",
        nx: 1,
        ny: 1,
        lo1: apiData.coord.lon,
        la1: apiData.coord.lat,
        lo2: apiData.coord.lon,
        la2: apiData.coord.lat,
        dx: 1,
        dy: 1,
        refTime: new Date().toISOString(),
      },
      data: [
        {
          u: apiData.wind.speed,
          v: apiData.wind.deg
        }
      ]
    };
  }
  