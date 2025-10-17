// Frontend JavaScript for home page
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5000/api';

// DOM Elements
const locationInput = document.getElementById('location-search-input');
const currentLocationBtn = document.getElementById('current-location-btn');
const searchResults = document.getElementById('search-results');
const loadingSpinner = document.getElementById('loading-spinner');

// Zone lists
const dangerList = document.getElementById('danger-list');
const warningList = document.getElementById('warning-list');
const normalList = document.getElementById('normal-list');

// Search functionality
let searchTimeout;
locationInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        searchResults.style.display = 'none';
        return;
    }
    
    searchTimeout = setTimeout(() => searchLocations(query), 300);
});

async function searchLocations(query) {
    try {
        loadingSpinner.style.display = 'block';
        const response = await fetch(`${API_BASE_URL}/search/${encodeURIComponent(query)}`);
        const locations = await response.json();
        
        displaySearchResults(locations);
    } catch (error) {
        console.error('Search error:', error);
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

function displaySearchResults(locations) {
    searchResults.innerHTML = '';
    
    if (locations.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">No locations found</div>';
    } else {
        locations.forEach(location => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.textContent = `${location.name}, ${location.state || 'Maharashtra'}`;
            item.addEventListener('click', () => selectLocation(location));
            searchResults.appendChild(item);
        });
    }
    
    searchResults.style.display = 'block';
}

function selectLocation(location) {
    locationInput.value = location.name;
    searchResults.style.display = 'none';
    
    // Redirect to details page
    window.location.href = `details.html?lat=${location.lat}&lon=${location.lon}&name=${encodeURIComponent(location.name)}`;
}

// Current location functionality
currentLocationBtn.addEventListener('click', getCurrentLocation);

function getCurrentLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by this browser.');
        return;
    }
    
    loadingSpinner.style.display = 'block';
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
                // Get location name from coordinates
                const response = await fetch(
                    `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${window.API_KEY}`
                );
                const locations = await response.json();
                
                if (locations.length > 0) {
                    const location = locations[0];
                    locationInput.value = location.name;
                    selectLocation({ lat: latitude, lon: longitude, name: location.name });
                }
            } catch (error) {
                console.error('Reverse geocoding error:', error);
                // Fallback: use coordinates directly
                selectLocation({ lat: latitude, lon: longitude, name: 'Current Location' });
            } finally {
                loadingSpinner.style.display = 'none';
            }
        },
        (error) => {
            loadingSpinner.style.display = 'none';
            alert('Unable to get your location. Please search manually.');
        }
    );
}

// Load state-wide summary
async function loadStateSummary() {
    try {
        // Sample Maharashtra cities for state summary
        const cities = [
            { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
            { name: 'Pune', lat: 18.5204, lon: 73.8567 },
            { name: 'Nagpur', lat: 21.1458, lon: 79.0882 },
            { name: 'Nashik', lat: 19.9975, lon: 73.7898 },
            { name: 'Aurangabad', lat: 19.8762, lon: 75.3433 }
        ];
        
        const riskData = await Promise.all(
            cities.map(async (city) => {
                try {
                    const response = await fetch(`${API_BASE_URL}/weather/forecast/${city.lat}/${city.lon}`);
                    const forecast = await response.json();
                    
                    // Calculate risk level
                    let maxRain = 0;
                    forecast.list.slice(0, 8).forEach(item => {
                        const rain = item.rain?.['3h'] || 0;
                        if (rain > maxRain) maxRain = rain;
                    });
                    
                    let riskLevel = 'normal';
                    if (maxRain > 10) riskLevel = 'danger';
                    else if (maxRain > 5) riskLevel = 'warning';
                    
                    return { name: city.name, risk: riskLevel };
                } catch (error) {
                    return { name: city.name, risk: 'normal' };
                }
            })
        );
        
        updateSummaryBoxes(riskData);
    } catch (error) {
        console.error('State summary error:', error);
    }
}

function updateSummaryBoxes(riskData) {
    const dangerCities = riskData.filter(city => city.risk === 'danger').map(city => city.name);
    const warningCities = riskData.filter(city => city.risk === 'warning').map(city => city.name);
    const normalCities = riskData.filter(city => city.risk === 'normal').map(city => city.name);
    
    dangerList.innerHTML = dangerCities.length > 0 
        ? dangerCities.map(city => `<li>${city}</li>`).join('')
        : '<li>No high-risk areas</li>';
        
    warningList.innerHTML = warningCities.length > 0
        ? warningCities.map(city => `<li>${city}</li>`).join('')
        : '<li>No moderate-risk areas</li>';
        
    normalList.innerHTML = normalCities.length > 0
        ? normalCities.map(city => `<li>${city}</li>`).join('')
        : '<li>No safe areas</li>';
}

// Hide search results when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        searchResults.style.display = 'none';
    }
});

// Load state summary on page load
document.addEventListener('DOMContentLoaded', loadStateSummary);