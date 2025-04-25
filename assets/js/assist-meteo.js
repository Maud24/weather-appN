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
  appendMessage(
    "👋 Salut ! Tu peux me demander :\n" +
    "👉 'Quel est le taux d’humidité à Buea ?'"
  );
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
  const preps = ["à", "a", "au", "en", "pour", "de"];
  let query = null;

  for (let prep of preps) {
    const match = cleaned.match(new RegExp(`${prep}\\s+([a-zA-ZÀ-ÿ\\s.'-]+)`));
    if (match) {
      query = match[1].trim();
      break;
    }
  }

  if (!query) {
    const words = cleaned.split(" ");
    query = words[words.length - 1];
  }

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
  if (!question) return (isWaiting = false);

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
    const isTomorrow = /(demain|va[- ]?t[- ]?il.*demain|pluie.*demain|pleuvra[- ]?t[- ]?il demain)/.test(cleaned);
    const isTemp = /température|temp|chaud|froid|brulant|glacial|chaude|froide|chaleur|canicule|ressenti/.test(cleaned);
    const isHumid = /humidité|humidite|moite|taux d'humidite|humide/.test(cleaned);
    const isRain = /pleut|pluie|pleuvoir|averse|va[- ]?t[- ]?il pleuvoir|pluvieux|orages?|orageux|averse/.test(cleaned);
    const isWind = /vent|souffle|rafale|ouragan|tempete|brise/.test(cleaned);
    const isGeneral = /meteo|temps|climat|il fait|quel temps|fait-il|va[- ]?t[- ]?il|prévision|conditions|donne[- ]?moi|peux[- ]?tu|quelle est la meteo/.test(cleaned)
      || (!isTemp && !isHumid && !isWind && !isRain && !isTomorrow);


    if (isTomorrow && isRain) {
      const res = await fetch(`${url.forecast(city.lat, city.lon)}&appid=4e961e64c39ef786890e2a72153035ef`);
      const forecast = await res.json();
      const list = forecast.list;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const targetDate = tomorrow.toISOString().split("T")[0];

      const rainSlots = list
        .filter(item => item.dt_txt.startsWith(targetDate) && item.weather[0].description.toLowerCase().includes("rain"))
        .map(item => new Date(item.dt_txt).getHours());

      let message = `📅 Prévisions pour demain à ${city.name}, ${city.country} :\n`;

      if (rainSlots.length) {
        const min = Math.min(...rainSlots);
        const max = Math.max(...rainSlots);
        message += `🌧️ Il y a des risques de pluie entre ${min}h et ${max + 3}h.\n`;
        message += "⚠️ Équipe-toi d’un parapluie, et évite les longues sorties si possible.\n";
        message += "🧥 Prévois des vêtements imperméables, surtout en après-midi.";
      } else {
        message += "☀️ D'après les prévisions, pas de pluie attendue demain.\n";
        message += "💡 Tu peux prévoir tes activités en extérieur, mais reste informé(e) en cas de changement.";
      }

      appendMessage(message);
      isWaiting = false;
      return;
    }

    const data = await getWeatherData(city.lat, city.lon);
    const airRes = await fetch(`${url.airPollution(city.lat, city.lon)}&appid=4e961e64c39ef786890e2a72153035ef`);
    const airData = await airRes.json();
    const air = airData.list[0];

    const desc = data.weather[0].description.toLowerCase();
    const temp = data.main.temp;
    const feels = data.main.feels_like;
    const humidity = data.main.humidity;
    const wind = data.wind.speed;
    const aqi = air.main.aqi;

    let response = `🌍 Météo actuelle à ${city.name}, ${city.country} :\n`;

    if (isTemp) {
      response += `🌡️ Température : ${temp}°C (ressenti : ${feels}°C)\n`;
      response += temp > 32
        ? "🔥 Il fait très chaud ! Bois de l’eau fréquemment et évite le soleil direct.\n"
        : temp < 10
        ? "❄️ Il fait froid, pense à bien te couvrir. 🧣🧥\n"
        : "🌤️ Température modérée, agréable pour sortir.\n";
    }

    if (isRain) {
      response += desc.includes("rain")
        ? "🌧️ Il pleut actuellement.\n"
        : "☀️ Pas de pluie pour l’instant.\n";
      response += `🌦️ Conditions : ${desc}\n`;
    }

    if (isHumid) {
      response += `💧 Humidité : ${humidity}%\n`;
    }

    if (isWind) {
      response += `💨 Vent : ${wind} m/s\n`;
    }

    if (isGeneral) {
      response += `🌡️ ${temp}°C (ressenti : ${feels}°C)\n🌥️ Ciel : ${desc}\n💧 Humidité : ${humidity}%\n💨 Vent : ${wind} m/s\n`;
    }

    response += `🧪 AQI (qualité de l'air) : ${aqi}/5\n\n💡 Conseil météo : `;
    if (desc.includes("storm")) {
      response += "Orages possibles : reste à l’abri et évite les zones découvertes. ⚡";
    } else if (desc.includes("rain")) {
      response += "Risque de pluie. Garde un parapluie avec toi. ☔";
    } else if (temp > 32) {
      response += "Il fait très chaud ! Privilégie l’ombre et hydrate-toi. 🥵";
    } else if (temp < 10) {
      response += "Il fait frais. Prends une veste si tu sors. 🧥";
    } else {
      response += "Le temps est idéal pour une sortie ! 🌈";
    }

    appendMessage(response);

  } catch (err) {
    console.error("❌ Erreur chatbot :", err);
    appendMessage("❗ Ville non reconnue ou problème météo. Essaie par exemple : 'Quel temps à Douala ?'");
  } finally {
    isWaiting = false;
  }
}
