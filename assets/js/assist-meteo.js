'use strict';

import { fetchData, url, getWeatherData } from './api.js';

let isWaiting = false;

const toggleButton = document.getElementById("chatbot-toggle");
const chatWindow = document.getElementById("chatbot");
const closeButton = document.getElementById("close-chatbot");
const sendButton = document.getElementById("send-chat");
const inputField = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");

// === UI ===
toggleButton.addEventListener("click", () => {
  chatWindow.classList.toggle("hidden");
  if (!chatWindow.classList.contains("hidden")) {
    chatMessages.innerHTML = '';
    greetUser();
  }
});
closeButton.addEventListener("click", () => {
  chatWindow.classList.add("hidden");
  chatMessages.innerHTML = '';
});
sendButton.addEventListener("click", handleChat);
inputField.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleChat();
});

function appendMessage(text, isUser = false) {
  const msg = document.createElement("div");
  msg.className = isUser ? "user-message" : "bot-message";
  msg.textContent = text;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function greetUser() {
  appendMessage("👋 Bonjour ! Tu peux me demander : 'Va-t-il pleuvoir demain à Paris ?', 'Quel temps à Douala ?' ou encore 'Pluie à Yaoundé, CM ?'");
}

function normalize(str) {
  return str.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/’/g, "'")
    .trim();
}

async function extractCityAndCoords(question) {
  const cleaned = normalize(question);
  let query = null;

  const matchWithCountry = cleaned.match(/([a-zA-ZÀ-ÿ\s.'-]+?),\s*([a-zA-Z]{2})/i);
  if (matchWithCountry) {
    query = `${matchWithCountry[1].trim()},${matchWithCountry[2].trim().toUpperCase()}`;
  } else {
    const match = cleaned.match(/(?:à|a|au|en|pour)\s+([a-zA-ZÀ-ÿ\s.'-]+)/i);
    if (match && match[1]) {
      query = match[1].trim();
    } else {
      query = cleaned.split(' ').slice(-1)[0];
    }
  }

  if (!query || query.length < 2) throw new Error("Ville non reconnue");

  const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=4e961e64c39ef786890e2a72153035ef`;
  const res = await fetch(geoUrl);
  const data = await res.json();

  if (!data.length) throw new Error("Ville introuvable");

  const { name, lat, lon, country } = data[0];
  return { name, lat, lon, country };
}

async function handleChat() {
  if (isWaiting) return;
  isWaiting = true;

  const question = inputField.value.trim();
  if (!question) {
    isWaiting = false;
    return;
  }

  appendMessage(question, true);
  inputField.value = "";

  const cleaned = normalize(question);

  const greetings = ["bonjour", "hello", "salut", "hey"];
  const goodbyes = ["merci", "merci beaucoup", "c’est noté", "ok", "bonne journée", "au revoir", "bye"];

  if (greetings.some(g => cleaned.startsWith(g))) {
    appendMessage("👋 Bonjour ! Je suis là pour t’aider avec la météo. 😊");
    isWaiting = false;
    return;
  }

  if (goodbyes.some(bye => cleaned.includes(bye))) {
    appendMessage("🙏 Avec plaisir ! À bientôt pour d'autres infos météo. ☀️");
    isWaiting = false;
    return;
  }

  try {
    const city = await extractCityAndCoords(question);
    const isTomorrow = /demain|tomorrow/.test(cleaned);

    // 🔁 DEMAIN : prévoir la météo à venir
    if (isTomorrow) {
      const res = await fetch(`${url.forecast(city.lat, city.lon)}&appid=4e961e64c39ef786890e2a72153035ef`);
      const forecast = await res.json();
      const list = forecast.list;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const targetDate = tomorrow.toISOString().split("T")[0];

      const rainHours = list
        .filter(item => item.dt_txt.startsWith(targetDate) && item.weather[0].description.toLowerCase().includes("rain"))
        .map(item => {
          const date = new Date(item.dt_txt);
          const hour = date.getHours().toString().padStart(2, "0");
          return `${hour}h`;
        });

      let message = `🌍 Météo prévue demain pour ${city.name}, ${city.country} :\n`;

      if (rainHours.length) {
        message += `🌧️ Oui, il va pleuvoir demain aux heures suivantes : ${rainHours.join(", ")}\n`;
      } else {
        message += `☀️ Non, pas de pluie prévue demain selon les prévisions actuelles.\n`;
      }

      appendMessage(message);
      isWaiting = false;
      return;
    }

    // 🌤️ Temps actuel
    const data = await getWeatherData(city.lat, city.lon);
    const airRes = await fetch(`${url.airPollution(city.lat, city.lon)}&appid=4e961e64c39ef786890e2a72153035ef`);
    const airData = await airRes.json();
    const air = airData.list[0];

    const isTemp = /température|chaud|froid|ressenti|brulant|glacial|chaude/.test(cleaned);
    const isHumid = /humidité|humidite|moite|Taux d'humidite/.test(cleaned);
    const isRain = /pleut|pluie|pleuvoir|averse|va-t-il pleuvoir|il pleut/.test(cleaned);
    const isWind = /vent|souffle|rafale|ouragan/.test(cleaned);
    const isGeneral = /meteo|temps|climat|il fait|quel temps|fait-il|va t-il|donne moi la meteo|y'aura|Il va|Donne moi|Puis-je avoir|Quel est/.test(cleaned) || (!isTemp && !isHumid && !isWind && !isRain);

    const temp = data.main.temp;
    const feels = data.main.feels_like;
    const desc = data.weather[0].description.toLowerCase();
    const humidity = data.main.humidity;
    const wind = data.wind.speed;
    const aqi = air.main.aqi;

    let response = `🌍 Météo pour ${city.name}, ${city.country} :\n`;

    if (isTemp) {
      const isHot = temp > 28;
      const isCold = temp < 12;
      response += isHot ? "🔥 Oui, il fait bien chaud aujourd’hui !\n" :
                 isCold ? "❄️ Non, il fait plutôt froid.\n" :
                 "🌤️ Non, la température est douce et agréable.\n";
      response += `🌡️ Température : ${temp}°C, ressenti : ${feels}°C\n`;
    }

    if (isRain) {
      const raining = desc.includes("rain") || desc.includes("shower");
      response += raining
        ? "🌧️ Oui, il pleut actuellement.\n"
        : "☀️ Non, pas de pluie pour l'instant.\n";
      response += `🌦️ Conditions : ${desc}\n`;
    }

    if (isWind) {
      response += `💨 Vent : ${wind} m/s\n`;
    }

    if (isHumid) {
      response += `💧 Humidité : ${humidity}%\n`;
    }

    if (isGeneral) {
      response += `🌡️ Température : ${temp}°C (ressenti : ${feels}°C)\n`;
      response += `🌥️ Ciel : ${desc}\n`;
      response += `💨 Vent : ${wind} m/s — 💧 Humidité : ${humidity}%\n`;
    }

    response += `🧪 Qualité de l'air (AQI) : ${aqi}/5\n`;

    response += "\n💡 Conseils : ";
    if (temp > 30) {
      response += "Il fait très chaud ! Bois beaucoup d'eau. 🥵";
    } else if (temp < 10) {
      response += "Il fait froid ! Couvre-toi bien. 🧥";
    } else if (desc.includes("rain")) {
      response += "Un parapluie te sera utile ! ☔";
    } else {
      response += "Le temps est bon, profite de ta journée ! 🌈";
    }

    appendMessage(response);

  } catch (err) {
    console.error("❌ Erreur chatbot :", err);
    appendMessage("❗ Je n'ai pas pu comprendre la ville ou récupérer les données. Essaie avec : 'Quel temps à Yaoundé ?' ou 'Paris, FR'");
  } finally {
    isWaiting = false;
  }
}
