/**
 * @license MIT
 * @fileoverview All module functions
 * @copyright Maud24 2025 All rights reserved
 * @author Maud24 <ondiguimarine@gmail.com>
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
        message: "La qualité de l’air est considérée comme satisfaisante et la pollution de l’air ne présente que peu ou pas de risque."
    },
    2: {
        level: "Fair",
        message: "La qualité de l’air est acceptable ; Cependant, pour certains polluants, il peut y avoir un problème de santé modéré pour un très petit nombre qui sont exceptionnellement sensibles à la pollution atmosphérique."
    },
    3: {
        level: "Moderate",
        message: "Les membres de groupes sensibles peuvent ressentir des effets sur la santé. Il est peu probable que le grand public soit touché."
    },
    4: {
        level: "Poor",
        message: "Tout le monde peut commencer à ressentir des effets sur la santé ; Les membres de groupes sensibles peuvent subir des effets plus graves sur leur santé."
    },
    5: {
        level: "Very Poor",
        message: "Avertissements sanitaires en cas d’urgence. L’ensemble de la population est plus susceptible d’être touché."
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
  