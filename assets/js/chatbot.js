import { getWeatherData } from './api.js';

const toggleButton = document.getElementById("chatbot-toggle");
const chatWindow = document.getElementById("chatbot");
const closeButton = document.getElementById("close-chatbot");
const sendButton = document.getElementById("send-chat");
const inputField = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");

toggleButton.addEventListener("click", () => {
    chatWindow.classList.toggle("hidden");
  
    if (!chatWindow.classList.contains("hidden")) {
      chatMessages.innerHTML = '';
      greetUser();
    }
  });
  
  closeButton.addEventListener("click", () => {
    chatWindow.classList.add("hidden");
    chatMessages.innerHTML = ''; // On vide l'historique à la fermeture
  });
  

// Envoyer un message
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
    appendMessage("👋 Bonjour ! Pose-moi une question météo comme : Douala II, CM");
  }
  

  async function findCityFromQuery(query) {
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=1&appid=4e961e64c39ef786890e2a72153035ef`;
    const res = await fetch(geoUrl);
    const data = await res.json();
    if (data.length > 0) {
      return {
        name: `${data[0].name}${data[0].state ? ' ' + data[0].state : ''}, ${data[0].country}`,
        lat: data[0].lat,
        lon: data[0].lon
      };
    }
    throw new Error("Ville introuvable.");
  }
  

async function getCoordinates(state, country) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${state},${country}&appid=4e961e64c39ef786890e2a72153035ef`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.length > 0) return { lat: data[0].lat, lon: data[0].lon };
  throw new Error("Lieu non trouvé.");
}

function getRecommendation(temp) {
    if (temp < 10) {
      return "🥶 Il fait froid, pense à bien te couvrir !";
    } else if (temp >= 10 && temp < 20) {
      return "🧥 Temps frais, une petite veste serait utile.";
    } else if (temp >= 20 && temp < 30) {
      return "😎 Le temps est agréable, profite bien !";
    } else {
      return "🥵 Il fait chaud, n’oublie pas de bien t’hydrater !";
    }
  }
  

  async function handleChat() {
    const question = inputField.value.trim();
    if (!question) return;
  
    appendMessage(question, true);
    inputField.value = "";
  
    // Vérifie les salutations simples
    const lower = question.toLowerCase();
    const greetings = ["bonjour", "hello", "salut", "hey"];
    if (greetings.some(greet => lower.startsWith(greet))) {
      appendMessage("👋 Bonjour ! Je suis prêt à répondre à tes questions météo. 😊");
      return;
    }

    // Vérifie les formules d'au revoir
    const farewells = [
        "merci", "merci beaucoup", "c'est compris", "ok", "d'accord", "bonne soirée",
        "à bientôt", "au revoir", "ciao", "cool", "c’est génial", "super", "parfait",
        "waouh, merci", "Tu es un génie", "C'est parfait", "Parfait", "parfait", "waouh", "Thanks you",
    ];
    
    if (farewells.some(bye => lower.includes(bye))) {
        appendMessage("😊 Avec plaisir ! Si tu as d'autres questions météo, n’hésite pas !");
        return;
    }
  
  
    // Recherche de ville, pays au bon format dans la question
    const match = question.match(/([a-zA-Z\s]+?),\s*([a-zA-Z]{2})/);
    if (!match) {
      appendMessage("❌ Format invalide. Utilise le format : Douala II, CM");
      return;
    }
  
    const cityName = match[1].trim();
    const countryCode = match[2].trim();
  
    try {
      const city = await findCityFromQuery(`${cityName},${countryCode}`);
      const data = await getWeatherData(city.lat, city.lon);
  
      const temp = data.main.temp;
      const condition = data.weather[0].main.toLowerCase();
  
      let conseil = "";
      if (temp > 30) conseil = "💧 Il fait chaud ! Bois beaucoup d’eau.";
      else if (temp < 15) conseil = "🧥 Il fait frais. N'oublie pas une veste.";
      else if (condition.includes("rain")) conseil = "🌧 Il pourrait pleuvoir. Prends un parapluie.";
      else conseil = "🌤 Le temps est agréable. Bonne journée !";
  
      const answer = `📍 À ${city.name}, il fait actuellement ${temp}°C. ${conseil}`;
      appendMessage(answer);
    } catch (e) {
      appendMessage("❗ Je n’ai pas trouvé cette ville. Vérifie ton format.");
    }
  }
  
