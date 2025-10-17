// API Configuration
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5000/api';
const API_KEY = window.API_KEY;

// Parse URL parameters
const params = new URLSearchParams(window.location.search);
const lat = params.get("lat");
const lon = params.get("lon");

// DOM Elements
const languageSelect = document.getElementById("language-select");
const detailsTitle = document.getElementById("details-title");
const riskAssessmentEl = document.getElementById("risk-assessment");
const temperatureEl = document.getElementById("temperature");
const humidityEl = document.getElementById("humidity");
const rainfallEl = document.getElementById("rainfall");
const windSpeedEl = document.getElementById("wind-speed");
const chatBox = document.getElementById("chat-box");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

// Fetch current weather data
async function getCurrentWeatherData(lat, lon) {
    try {
        const response = await fetch(`${API_BASE_URL}/weather/current/${lat}/${lon}`);
        if (!response.ok) throw new Error("Failed to get current weather.");
        return await response.json();
    } catch (error) {
        console.error("Current weather API error:", error);
        return null;
    }
}

// Fetch forecast weather data
async function getForecastData(lat, lon) {
    try {
        const response = await fetch(`${API_BASE_URL}/weather/forecast/${lat}/${lon}`);
        if (!response.ok) throw new Error("Failed to get forecast data.");
        return await response.json();
    } catch (error) {
        console.error("Forecast API error:", error);
        return null;
    }
}

// Risk level analysis
function getRiskLevel(forecastData) {
    let maxRain = 0;
    const next24hForecasts = forecastData.list.slice(0, 8);
    next24hForecasts.forEach((item) => {
        const rainVolume = item.rain?.["3h"] || 0;
        if (rainVolume > maxRain) maxRain = rainVolume;
    });
    
    if (maxRain > 10) {
        return { level: "danger", value: maxRain };
    } else if (maxRain > 5) {
        return { level: "warning", value: maxRain };
    }
    return { level: "normal", value: maxRain };
}

// Update risk assessment
function updateRiskAssessment(risk) {
    riskAssessmentEl.className = "risk-assessment";
    
    if (risk.level === "danger") {
        riskAssessmentEl.textContent = `Red Zone! Predicted rainfall of ${risk.value.toFixed(2)} mm is high.`;
        riskAssessmentEl.classList.add("danger");
    } else if (risk.level === "warning") {
        riskAssessmentEl.textContent = `Yellow Zone! Predicted rainfall of ${risk.value.toFixed(2)} mm is moderate.`;
        riskAssessmentEl.classList.add("warning");
    } else {
        riskAssessmentEl.textContent = `Green Zone. Predicted rainfall of ${risk.value.toFixed(2)} mm is safe.`;
        riskAssessmentEl.classList.add("normal");
    }
}

// Update current conditions
function updateCurrentConditions(current) {
    if (!current) return;
    
    temperatureEl.textContent = `${current.main.temp.toFixed(1)} °C`;
    humidityEl.textContent = `${current.main.humidity} %`;
    rainfallEl.textContent = `${(current.rain?.["1h"] || 0).toFixed(1)} mm`;
    windSpeedEl.textContent = `${(current.wind.speed * 3.6).toFixed(1)} km/h`;
}

// Initialize map
function initializeMap(lat, lon, cityName) {
    if (typeof L !== 'undefined') {
        const map = L.map('map').setView([lat, lon], 12);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        L.marker([lat, lon]).addTo(map)
            .bindPopup(`<b>${cityName}</b><br>Selected Location`)
            .openPopup();
    }
}

// Chatbot functionality
function displayUserMsg(message) {
    if (!chatBox) return;
    chatBox.innerHTML += `<div class="chat-message user-message">${message}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}

function displayBotMsg(message) {
    if (!chatBox) return;
    chatBox.innerHTML += `<div class="chat-message ai-message">${message}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function handleChat() {
    if (!chatInput) return;
    
    const msg = chatInput.value.trim();
    if (!msg) return;
    
    const lang = languageSelect ? languageSelect.value : "en";
    
    displayUserMsg(msg);
    
    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: msg,
                language: lang
            })
        });
        
        const data = await response.json();
        displayBotMsg(data.response);
    } catch (error) {
        displayBotMsg("Sorry, I'm having trouble connecting. Please try again later.");
    }
    
    chatInput.value = "";
}

// Main initialization function
async function initializePage() {
    if (!lat || !lon) {
        if (detailsTitle) {
            detailsTitle.textContent = "Error: No location selected. Please select a location first.";
        }
        return;
    }
    
    if (detailsTitle) detailsTitle.textContent = "Loading weather data...";
    
    const [forecastData, currentData] = await Promise.all([
        getForecastData(lat, lon),
        getCurrentWeatherData(lat, lon)
    ]);
    
    if (!forecastData || !currentData) {
        if (detailsTitle) {
            detailsTitle.textContent = "Error: Unable to retrieve weather data.";
        }
        return;
    }
    
    const cityName = forecastData.city.name;
    if (detailsTitle) {
        detailsTitle.textContent = `Weather and Risk for ${cityName}`;
    }
    
    const risk = getRiskLevel(forecastData);
    updateRiskAssessment(risk);
    updateCurrentConditions(currentData);
    
    // Initialize map with city location
    initializeMap(parseFloat(lat), parseFloat(lon), cityName);
}

// Event listeners
if (sendBtn && chatInput) {
    sendBtn.addEventListener("click", handleChat);
    chatInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
            handleChat();
        }
    });
}

// Initialize page on load
window.addEventListener("DOMContentLoaded", initializePage);