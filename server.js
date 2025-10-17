const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const API_KEY = "5a4c5e3313bc10b8a4e086f4c09b522f";

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/weather/current/:lat/:lon', async (req, res) => {
    try {
        const { lat, lon } = req.params;
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Weather data fetch failed' });
    }
});

app.get('/api/weather/forecast/:lat/:lon', async (req, res) => {
    try {
        const { lat, lon } = req.params;
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Forecast data fetch failed' });
    }
});

app.get('/api/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const response = await axios.get(
            `https://api.openweathermap.org/geo/1.0/direct?q=${query},IN&limit=5&appid=${API_KEY}`
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Location search failed' });
    }
});

app.post('/api/risk-assessment', (req, res) => {
    const { rainfall, temperature, humidity, windSpeed } = req.body;
    
    let riskLevel = 'normal';
    let riskScore = 0;
    
    if (rainfall > 10) riskScore += 3;
    else if (rainfall > 5) riskScore += 2;
    else if (rainfall > 2) riskScore += 1;
    
    if (temperature > 35) riskScore += 2;
    if (humidity > 80) riskScore += 1;
    if (windSpeed > 25) riskScore += 2;
    
    if (riskScore >= 4) riskLevel = 'danger';
    else if (riskScore >= 2) riskLevel = 'warning';
    
    res.json({
        riskLevel,
        riskScore,
        recommendations: getRiskRecommendations(riskLevel)
    });
});

app.post('/api/chat', (req, res) => {
    const { message, language = 'en' } = req.body;
    const response = getChatbotResponse(message.toLowerCase(), language);
    res.json({ response });
});

function getRiskRecommendations(riskLevel) {
    const recommendations = {
        danger: [
            "Move livestock to higher ground immediately",
            "Secure all farm equipment and machinery",
            "Avoid outdoor activities",
            "Monitor weather updates continuously"
        ],
        warning: [
            "Prepare drainage systems",
            "Check livestock shelter",
            "Postpone field work if possible",
            "Keep emergency supplies ready"
        ],
        normal: [
            "Continue normal farming activities",
            "Monitor weather conditions",
            "Maintain equipment regularly"
        ]
    };
    return recommendations[riskLevel] || recommendations.normal;
}

function getChatbotResponse(message, language) {
    const responses = {
        en: {
            flood: "For flood protection: Move livestock to higher ground, clear drainage, secure property, and follow government advisories.",
            drought: "For drought management: Use mulch to retain moisture, choose drought-resistant crops, adjust irrigation, and provide shade for livestock.",
            default: "I can help with flood and drought advice. Ask about crop protection or livestock care during disasters."
        },
        mr: {
            flood: "पुरापासून संरक्षण: पशुधन उंच जागी हलवा, निचरा साफ करा, वस्तू सुरक्षित करा.",
            drought: "दुष्काळ व्यवस्थापन: मल्च वापरा, दुष्काळ प्रतिकार करणारे पीक निवडा, सिंचन समायोजित करा.",
            default: "मी पूर आणि दुष्काळाच्या सल्ल्यासाठी मदत करू शकतो."
        }
    };
    
    const lang = responses[language] || responses.en;
    
    if (message.includes('flood') || message.includes('पूर')) {
        return lang.flood;
    } else if (message.includes('drought') || message.includes('दुष्काळ')) {
        return lang.drought;
    }
    return lang.default;
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});