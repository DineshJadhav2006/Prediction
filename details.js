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
const pressureEl = document.getElementById("pressure");
const windSpeedEl = document.getElementById("wind-speed");
const chatBox = document.getElementById("chat-box");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
 
// Disaster care messages for chatbot
const disasterCare = {
  flood: {
    en: [
      "Move livestock and machinery to higher ground.",
      "Clear field drainage and secure property.",
      "Postpone fertilizer or pesticide use until water recedes.",
      "Follow local government advisories.",
    ],
    mr: [
      "पशुधन आणि यंत्र उंच जागी हलवा.",
      "शेतातील निचरा मोकळा ठेवा, वस्तू सुरक्षित ठेवा.",
      "पाणी ओसरल्यावर खत किंवा औषध वापरा.",
      "स्थानिक सरकारी सूचनांचे पालन करा.",
    ],
    hi: [
      "पशु और मशीनें ऊँची जगह पर रखें.",
      "खेत की नाली साफ रखें.",
      "पानी उतरने के बाद खाद या दवा दें.",
      "स्थानीय प्रशासन के निर्देशों का पालन करें.",
    ],
  },
  drought: {
    en: [
      "Mulch fields to retain soil moisture.",
      "Choose drought-resistant seed varieties.",
      "Adjust irrigation for critical crop stages.",
      "Offer shade and extra water to livestock.",
      "Postpone planting, harvesting, or spraying when dry.",
    ],
    mr: [
      "मल्च वापरून ओलावा टिकवा.",
      "दुष्काळ प्रतिकार करणारे वाण निवडा.",
      "महत्त्वाच्या अवस्थेसाठी सिंचनाचे नियोजन करा.",
      "पशांना सावली आणि पाणी द्या.",
      "कोरड्या काळात लागवड, कापणी आणि फवारणी पुढे ढकला.",
    ],
    hi: [
      "मल्च से नमी बनाए रखें.",
      "सूखा प्रतिरोधी बीज चुनें.",
      "जरूरी फसल स्टेज के लिए सिंचाई बदलें.",
      "पशु को छाया और पानी दें.",
      "सूखे में बोवाई, कटाई, छिड़काव टालें.",
    ],
  },
};
 
function getCareAdvice(type, lang) {
  if (disasterCare[type] && disasterCare[type][lang]) {
    return `<ul>${disasterCare[type][lang]
      .map((txt) => <li>${txt}</li>)
      .join("")}</ul>`;
  }
  // Fallback to English if no translation available
  return `<ul>${disasterCare[type]["en"]
    .map((txt) => <li>${txt}</li>)
    .join("")}</ul>`;
}
 
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
 
// Risk level analysis based on forecast rainfall
function getRiskLevel(forecastData) {
  let maxRain = 0;
  const next24hForecasts = forecastData.list.slice(0, 8); // roughly next 24 hours
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
 
// Update the risk assessment text and styling safely
function updateRiskAssessment(risk) {
  const riskAssessmentEl = document.getElementById("risk-assessment"); // reset classes
 
  riskAssessmentEl.className = "risk-assessment"; // reset classes
 
  if (risk.level === "danger") {
    riskAssessmentEl.textContent = `Red Zone! Predicted rainfall of ${risk.value.toFixed(
      2
    )} mm is high.`;
    riskAssessmentEl.classList.add("danger");
  } else if (risk.level === "warning") {
    riskAssessmentEl.textContent = `Yellow Zone! Predicted rainfall of ${risk.value.toFixed(
      2
    )} mm is moderate.`;
    riskAssessmentEl.classList.add("warning");
  } else {
    riskAssessmentEl.textContent = `Green Zone. Predicted rainfall of ${risk.value.toFixed(
      2
    )} mm is safe.`;
    riskAssessmentEl.classList.add("normal");
  }
}
 
// Update current weather data in UI
function updateCurrentConditions(current) {
  if (!current || !temperatureEl) return;
 
  temperatureEl.textContent = '${current.main.temp.toFixed(1)} °C';
  humidityEl.textContent = '${current.main.humidity} %';
  rainfallEl.textContent = '${(current.rain?.["1h"] || 0).toFixed(1)} mm';
  pressureEl.textContent = '${current.main.pressure} hPa';
  windSpeedEl.textContent = '${(current.wind.speed * 3.6).toFixed(1)} km/h';
}
 
// Chatbot UI helper functions
function displayUserMsg(message) {
  if (!chatBox) return;
  chatBox.innerHTML += <div class="chat-message user-message">${message}</div>;
  chatBox.scrollTop = chatBox.scrollHeight;
}
 
function displayBotMsg(message) {
  if (!chatBox) return;
  chatBox.innerHTML += <div class="chat-message ai-message">${message}</div>;
  chatBox.scrollTop = chatBox.scrollHeight;
}
 
// Handler for chat input send
function handleChat() {
  if (!chatInput) return;
 
  const msg = chatInput.value.trim().toLowerCase();
  if (!msg) return;
 
  const lang = languageSelect ? languageSelect.value : "en";
 
  displayUserMsg(msg);
 
  let response = "";
  if (msg.includes("flood") || msg.includes("पूर") || msg.includes("बाढ़")) {
    response = '<b>Flood Care Advice:</b> ${getCareAdvice("flood", lang)}';
  } else if (
    msg.includes("drought") ||
 
    msg.includes("दुष्काळ") ||
    msg.includes("सूखा")
  ) {
    response = '<b>Drought Care Advice:</b> ${getCareAdvice("drought", lang)}';
  } else if (
    msg.includes("care") ||
    msg.includes("काळजी") ||
    msg.includes("सावधानी")
  ) {
    response = `<b>Care Advice:</b> ${getCareAdvice(
      "flood",
      lang
    )} ${getCareAdvice("drought", lang)}`;
  } else {
    response = <p>I'm here to help with flood and drought care advice. Please ask about how to protect your crops or livestock during these conditions.</p>;
  }
 
  displayBotMsg(response);
 
  chatInput.value = "";
}
 
// Initialization function on page load
async function initializePage() {
  if (!lat || !lon) {
    if (detailsTitle)
      detailsTitle.textContent =
        "Error: No location selected. Please select a location first.";
    return;
  }
 
  if (detailsTitle) detailsTitle.textContent = "Loading weather data...";
 
  const forecastData = await getForecastData(lat, lon);
  const currentData = await getCurrentWeatherData(lat, lon);
 
  if (!forecastData || !currentData) {
    if (detailsTitle)
      detailsTitle.textContent = "Error: Unable to retrieve weather data.";
    return;
  }
 
  if (detailsTitle)
    detailsTitle.textContent = 'Weather and Risk for ${forecastData.city.name}';
 
  updateRiskAssessment(getRiskLevel(forecastData));
  updateCurrentConditions(currentData);
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
 
// Run initialization on DOM load
window.addEventListener("DOMContentLoaded", initializePage);