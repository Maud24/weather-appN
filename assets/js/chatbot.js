import { getWeatherData } from './api.js'; // Assurez-vous que cette fonction est définie dans api.js

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('[data-current-location-btn]').addEventListener('click', () => {
        const chatbotContainer = document.getElementById('chatbot');
        chatbotContainer.classList.toggle('active'); // Affiche ou masque le chatbot
        if (chatbotContainer.classList.contains('active')) {
            WeatherChatbot(); // Initialisez le chatbot si visible
        }
    });
});

function WeatherChatbot() {
    const messages = [];
    const inputField = document.createElement('input');
    const chatContainer = document.getElementById('chatbot');

    // Configuration de l'input
    inputField.placeholder = "Posez votre question sur la météo (ex: California, US)...";
    inputField.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const question = inputField.value.trim();
            if (question) {
                messages.push({ text: question, isUser: true });
                inputField.value = '';

                const intent = analyzeIntent(question);
                if (intent) {
                    try {
                        const { lat, lon } = await getCoordinates(intent.state, intent.country);
                        const weatherData = await getWeatherData(lat, lon);
                        const response = `La température actuelle à ${intent.state}, ${intent.country} est ${weatherData.main.temp}°C.`;
                        messages.push({ text: response, isUser: false });
                    } catch (error) {
                        messages.push({ text: "Erreur lors de la récupération des données météo.", isUser: false });
                    }
                } else {
                    messages.push({ text: "Veuillez spécifier un état et un pays.", isUser: false });
                }
                renderMessages();
            }
        }
    });

    const renderMessages = () => {
        chatContainer.innerHTML = '';
        messages.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.textContent = msg.text;
            msgDiv.className = msg.isUser ? 'user-message' : 'bot-message';
            chatContainer.appendChild(msgDiv);
        });
    };

    chatContainer.appendChild(inputField);
}

// Fonction pour analyser l'intention
const analyzeIntent = (question) => {
    const regex = /(\w+)\s*,\s*(\w+)/; // Exemple : "California, US"
    const match = question.match(regex);
    if (match) {
        return { state: match[1], country: match[2] };
    }
    return null;
};

// Fonction pour obtenir les coordonnées
const getCoordinates = async (state, country) => {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${state},${country}&appid=4e961e64c39ef786890e2a72153035ef`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error("Erreur de réseau");
    
    const data = await res.json();
    if (data.length > 0) {
        return { lat: data[0].lat, lon: data[0].lon };
    } else {
        throw new Error("Aucune donnée trouvée");
    }
};
