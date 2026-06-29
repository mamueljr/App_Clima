/**
 * AuraWeather - Lógica Principal (Premium Javascript)
 */

// Variable global para controlar la instalación de la PWA
let deferredPrompt = null;

// Estado de la aplicación
const AppState = {
  currentCity: {
    name: 'Madrid, España',
    lat: 40.4168,
    lon: -3.7038
  },
  favorites: [],
  hourlyChart: null,
  unit: 'C',
  lastWeatherData: null
};

// Mapeo de códigos de clima WMO (World Meteorological Organization)
const WeatherCodes = {
  0: { label: 'Despejado', icon: 'sun', class: 'weather-clear-day' },
  1: { label: 'Mayormente Despejado', icon: 'cloud-sun', class: 'weather-clear-day' },
  2: { label: 'Parcialmente Nublado', icon: 'cloud-sun', class: 'weather-cloudy' },
  3: { label: 'Cubierto / Nublado', icon: 'cloud', class: 'weather-cloudy' },
  45: { label: 'Niebla', icon: 'cloud-fog', class: 'weather-cloudy' },
  48: { label: 'Niebla con Escarcha', icon: 'cloud-fog', class: 'weather-cloudy' },
  51: { label: 'Llovizna Ligera', icon: 'cloud-drizzle', class: 'weather-rainy' },
  53: { label: 'Llovizna Moderada', icon: 'cloud-drizzle', class: 'weather-rainy' },
  55: { label: 'Llovizna Densa', icon: 'cloud-drizzle', class: 'weather-rainy' },
  56: { label: 'Llovizna Helada Ligera', icon: 'cloud-snow', class: 'weather-snowy' },
  57: { label: 'Llovizna Helada Densa', icon: 'cloud-snow', class: 'weather-snowy' },
  61: { label: 'Lluvia Ligera', icon: 'cloud-rain', class: 'weather-rainy' },
  63: { label: 'Lluvia Moderada', icon: 'cloud-rain', class: 'weather-rainy' },
  65: { label: 'Lluvia Fuerte', icon: 'cloud-rain', class: 'weather-rainy' },
  66: { label: 'Lluvia Helada Ligera', icon: 'cloud-hail', class: 'weather-rainy' },
  67: { label: 'Lluvia Helada Fuerte', icon: 'cloud-hail', class: 'weather-rainy' },
  71: { label: 'Nevada Ligera', icon: 'snowflake', class: 'weather-snowy' },
  73: { label: 'Nevada Moderada', icon: 'snowflake', class: 'weather-snowy' },
  75: { label: 'Nevada Fuerte', icon: 'snowflake', class: 'weather-snowy' },
  77: { label: 'Granizo de Nieve', icon: 'snowflake', class: 'weather-snowy' },
  80: { label: 'Chubascos de Lluvia Ligeros', icon: 'cloud-rain', class: 'weather-rainy' },
  81: { label: 'Chubascos de Lluvia Moderados', icon: 'cloud-rain', class: 'weather-rainy' },
  82: { label: 'Chubascos de Lluvia Violentos', icon: 'cloud-rain-wind', class: 'weather-rainy' },
  85: { label: 'Chubascos de Nieve Ligeros', icon: 'cloud-snow', class: 'weather-snowy' },
  86: { label: 'Chubascos de Nieve Fuertes', icon: 'cloud-snow', class: 'weather-snowy' },
  95: { label: 'Tormenta Eléctrica', icon: 'cloud-lightning', class: 'weather-storm' },
  96: { label: 'Tormenta con Granizo Ligero', icon: 'cloud-lightning', class: 'weather-storm' },
  99: { label: 'Tormenta con Granizo Fuerte', icon: 'cloud-lightning', class: 'weather-storm' }
};

// Selectores del DOM
const elements = {
  citySearch: document.getElementById('city-search'),
  searchResults: document.getElementById('search-results'),
  geoBtn: document.getElementById('geo-btn'),
  favoritesToggleBtn: document.getElementById('favorites-toggle-btn'),
  favoritesBar: document.getElementById('favorites-bar'),
  favoritesList: document.getElementById('favorites-list'),
  statusMessage: document.getElementById('status-message'),
  mainContent: document.getElementById('main-content'),
  weatherLocation: document.getElementById('weather-location'),
  favoriteBtn: document.getElementById('favorite-btn'),
  localTime: document.getElementById('local-time'),
  currentTemp: document.getElementById('current-temp'),
  weatherDesc: document.getElementById('weather-desc'),
  mainWeatherIconContainer: document.getElementById('main-weather-icon-container'),
  tempMax: document.getElementById('temp-max'),
  tempMin: document.getElementById('temp-min'),
  insightText: document.getElementById('insight-text'),
  rainChance: document.getElementById('rain-chance'),
  uvIndex: document.getElementById('uv-index'),
  humidityVal: document.getElementById('humidity-val'),
  windVal: document.getElementById('wind-val'),
  feelsLikeVal: document.getElementById('feels-like-val'),
  pressureVal: document.getElementById('pressure-val'),
  forecastList: document.getElementById('forecast-list'),
  toastContainer: document.getElementById('toast-container'),
  unitToggleBtn: document.getElementById('unit-toggle-btn'),
  shareBtn: document.getElementById('share-btn')
};

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  loadFavorites();
  setupEventListeners();
  
  // Cargar ciudad inicial (por defecto Madrid o última buscada)
  const savedLastCity = localStorage.getItem('aura_last_city');
  if (savedLastCity) {
    try {
      AppState.currentCity = JSON.parse(savedLastCity);
    } catch (e) {
      console.error('Error parseando última ciudad guardada', e);
    }
  }
  
  // Cargar clima inicial inmediatamente
  fetchWeatherData(AppState.currentCity.lat, AppState.currentCity.lon, AppState.currentCity.name);
  
  // Intentar geolocalización automática en segundo plano
  detectUserLocationAutomatically();
}

// Configuración de eventos
function setupEventListeners() {
  // Búsqueda con rebote (debounce)
  let searchTimeout;
  elements.citySearch.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    if (query.length < 3) {
      elements.searchResults.classList.add('hidden');
      return;
    }
    
    searchTimeout = setTimeout(() => {
      searchCity(query);
    }, 400);
  });

  // Cerrar sugerencias al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!elements.citySearch.contains(e.target) && !elements.searchResults.contains(e.target)) {
      elements.searchResults.classList.add('hidden');
    }
  });

  // Geolocalización
  elements.geoBtn.addEventListener('click', getUserLocation);

  // Agregar/Eliminar Favoritos
  elements.favoriteBtn.addEventListener('click', toggleCurrentFavorite);

  // Toggle de barra de favoritos
  elements.favoritesToggleBtn.addEventListener('click', () => {
    elements.favoritesBar.classList.toggle('hidden');
  });

  // Cambio de unidades
  if (elements.unitToggleBtn) {
    elements.unitToggleBtn.addEventListener('click', toggleTemperatureUnit);
  }

  // Compartir clima
  if (elements.shareBtn) {
    elements.shareBtn.addEventListener('click', shareCurrentWeather);
  }

  // Click listener por defecto en el PWA badge para guiar al usuario
  const pwaBadge = document.querySelector('.pwa-badge');
  if (pwaBadge) {
    pwaBadge.addEventListener('click', triggerPWAInstall);
  }
}

// Búsqueda de ciudades (Autocompletado)
async function searchCity(query) {
  try {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=es&format=json`);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      renderSearchResults(data.results);
    } else {
      elements.searchResults.innerHTML = '<li class="no-results">No se encontraron ciudades</li>';
      elements.searchResults.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error buscando ciudad:', error);
    showToast('Error en la búsqueda de ciudades', 'wifi-off');
  }
}

// Mostrar resultados del autocompletado
function renderSearchResults(results) {
  elements.searchResults.innerHTML = '';
  results.forEach(city => {
    const li = document.createElement('li');
    const state = city.admin1 ? `, ${city.admin1}` : '';
    const displayName = `${city.name}${state}, ${city.country}`;
    
    li.innerHTML = `
      <span>${displayName}</span>
      <span class="country-code">${city.country_code ? city.country_code.toUpperCase() : ''}</span>
    `;
    
    li.addEventListener('click', () => {
      AppState.currentCity = {
        name: displayName,
        lat: city.latitude,
        lon: city.longitude
      };
      
      localStorage.setItem('aura_last_city', JSON.stringify(AppState.currentCity));
      elements.citySearch.value = '';
      elements.searchResults.classList.add('hidden');
      
      fetchWeatherData(city.latitude, city.longitude, displayName);
    });
    
    elements.searchResults.appendChild(li);
  });
  
  elements.searchResults.classList.remove('hidden');
}

// Obtener ubicación del GPS
function getUserLocation() {
  if (!navigator.geolocation) {
    showToast('La geolocalización no está soportada por tu navegador', 'alert-triangle');
    return;
  }
  
  showToast('Obteniendo tu ubicación...', 'map-pin');
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      
      // Intentar obtener el nombre de la ciudad mediante geocodificación inversa
      let cityName = 'Ubicación Actual';
      try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=es`);
        const geoData = await response.json();
        if (geoData.city || geoData.locality) {
          cityName = `${geoData.city || geoData.locality}, ${geoData.countryName}`;
        }
      } catch (err) {
        console.warn('No se pudo resolver el nombre de la ubicación, usando genérico', err);
      }
      
      AppState.currentCity = { name: cityName, lat: latitude, lon: longitude };
      localStorage.setItem('aura_last_city', JSON.stringify(AppState.currentCity));
      fetchWeatherData(latitude, longitude, cityName);
    },
    (error) => {
      console.error('Error de geolocalización:', error);
      showToast('Permiso de ubicación denegado o error de señal', 'alert-circle');
    },
    { enableHighAccuracy: true, timeout: 15000 }
  );
}

// Obtener datos del clima
async function fetchWeatherData(lat, lon, cityName) {
  // Mostrar pantalla de carga
  elements.statusMessage.classList.remove('hidden');
  elements.mainContent.classList.add('hidden');
  
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`);
    
    if (!response.ok) throw new Error('Error al consultar la API del clima');
    
    const data = await response.json();
    AppState.lastWeatherData = data;
    renderWeather(data, cityName);
    
    // Ocultar pantalla de carga
    elements.statusMessage.classList.add('hidden');
    elements.mainContent.classList.remove('hidden');
  } catch (error) {
    console.error('Error obteniendo clima:', error);
    elements.statusMessage.innerHTML = `
      <i data-lucide="wifi-off" style="width: 48px; height: 48px; color: #ef4444;"></i>
      <p style="color: #cbd5e1;">Error: ${error.message || error}</p>
      <button onclick="location.reload()" style="background: var(--theme-accent); color:#0f172a; border:none; padding: 0.6rem 1.2rem; border-radius:12px; cursor:pointer; font-weight:600;">Reintentar</button>
    `;
    safeCreateIcons();
  }
}

// Renderizar toda la info del clima en pantalla
function renderWeather(data, cityName) {
  const current = data.current;
  const daily = data.daily;
  const hourly = data.hourly;
  
  // 1. Cabecera y botón de favoritos
  elements.weatherLocation.textContent = cityName;
  updateFavoriteBtnState();
  
  // 2. Tiempo local simulado según zona horaria
  const options = { weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: true };
  const formattedTime = new Date().toLocaleDateString('es-ES', options);
  elements.localTime.textContent = formattedTime;
  
  // 3. Clima Actual
  const tempVal = formatTemp(current.temperature_2m, true);
  elements.currentTemp.textContent = tempVal;
  
  const codeInfo = WeatherCodes[current.weather_code] || { label: 'Desconocido', icon: 'help-circle', class: 'weather-clear-day' };
  elements.weatherDesc.textContent = codeInfo.label;
  
  // Renderizar icono principal de Lucide
  // Si es noche y está despejado/parcialmente nublado, cambiamos a icono de noche
  let mainIconName = codeInfo.icon;
  if (current.is_day === 0) {
    if (current.weather_code === 0) mainIconName = 'moon';
    else if (current.weather_code === 1 || current.weather_code === 2) mainIconName = 'cloud-moon';
  }
  elements.mainWeatherIconContainer.innerHTML = `<i data-lucide="${mainIconName}" class="main-weather-icon"></i>`;
  
  // 4. Cambiar el tema visual del body según el clima
  document.body.className = ''; // Limpiar clases
  if (current.is_day === 0 && (current.weather_code === 0 || current.weather_code === 1)) {
    document.body.classList.add('weather-night');
  } else {
    document.body.classList.add(codeInfo.class);
  }
  
  // 5. Máxima y Mínima del día
  elements.tempMax.textContent = formatTemp(daily.temperature_2m_max[0]);
  elements.tempMin.textContent = formatTemp(daily.temperature_2m_min[0]);
  
  // 6. Métricas detalladas
  elements.humidityVal.textContent = `${current.relative_humidity_2m}%`;
  elements.windVal.textContent = `${current.wind_speed_10m} km/h`;
  elements.feelsLikeVal.textContent = formatTemp(current.apparent_temperature);
  elements.pressureVal.textContent = `${Math.round(current.pressure_msl)} hPa`;
  
  // 7. Aura Insight & Métricas secundarias
  const rainProb = daily.precipitation_probability_max[0];
  const maxUV = daily.uv_index_max[0];
  
  elements.rainChance.textContent = `${rainProb}%`;
  elements.uvIndex.textContent = getUVDescription(maxUV);
  
  generateAuraInsight(current.temperature_2m, current.weather_code, rainProb, maxUV, current.wind_speed_10m);
  
  // 8. Gráfico de 24 Horas
  renderHourlyChart(hourly);
  
  // 9. Pronóstico de 7 Días
  render7DayForecast(daily);
  
  // Actualizar efectos animados de partículas (lluvia / nieve)
  updateWeatherEffects(codeInfo.class, current.is_day);
  
  // Re-procesar iconos de Lucide
  safeCreateIcons();
}

// Descripción del índice UV
function getUVDescription(uv) {
  if (uv <= 2) return `Bajo (${Math.round(uv)})`;
  if (uv <= 5) return `Moderado (${Math.round(uv)})`;
  if (uv <= 7) return `Alto (${Math.round(uv)})`;
  if (uv <= 10) return `Muy Alto (${Math.round(uv)})`;
  return `Extremo (${Math.round(uv)})`;
}

// Generación de IA/Insights basados en reglas de clima
function generateAuraInsight(temp, code, rainProb, uv, wind) {
  let message = "";
  
  if (rainProb >= 60) {
    message = "🌧️ Alta probabilidad de lluvia hoy. Te aconsejamos llevar un paraguas contigo y usar calzado impermeable.";
  } else if (temp >= 32) {
    message = "☀️ Hace mucho calor afuera. Mantente hidratado, evita el sol al mediodía y recuerda usar protector solar de amplio espectro.";
  } else if (uv >= 7) {
    message = "🕶️ El índice de radiación UV está muy elevado. Es ideal llevar gafas de sol, sombrero y bloqueador solar si vas a estar al aire libre.";
  } else if (wind >= 30) {
    message = "💨 Hay alertas de vientos fuertes hoy. Ten precaución con objetos sueltos en terrazas y mantente alerta al caminar cerca de árboles.";
  } else if (code >= 95) {
    message = "⚡ Se pronostican tormentas eléctricas. Es preferible quedarse bajo techo y desconectar aparatos electrónicos delicados.";
  } else if (temp <= 8) {
    message = "❄️ Las temperaturas serán muy bajas. Sal bien abrigado (capas, bufanda y guantes) para evitar enfriamientos.";
  } else if (rainProb >= 20 && rainProb < 60) {
    message = "⛅ Clima inestable. Podrían ocurrir lloviznas intermitentes. Un cortavientos impermeable ligero será tu mejor aliado.";
  } else {
    message = "✨ ¡Día espectacular! Las condiciones climáticas son excelentes para realizar actividades al aire libre o dar un paseo.";
  }
  
  elements.insightText.textContent = message;
}

// Renderizado del Gráfico por Horas con Chart.js
function renderHourlyChart(hourly) {
  // Validar si la librería Chart.js se cargó correctamente
  if (typeof Chart === 'undefined') {
    console.warn('La librería Chart.js no está cargada. Omitiendo gráfico.');
    return;
  }
  
  // Obtener los datos de las próximas 24 horas a partir del índice actual
  const now = new Date();
  const currentHour = now.getHours();
  
  const labels = [];
  const temps = [];
  const rainChances = [];
  
  for (let i = currentHour; i < currentHour + 24; i++) {
    const date = new Date(hourly.time[i]);
    const displayHour = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    labels.push(displayHour);
    
    let tempVal = hourly.temperature_2m[i];
    if (AppState.unit === 'F') {
      tempVal = (tempVal * 9) / 5 + 32;
    }
    temps.push(Math.round(tempVal));
    rainChances.push(hourly.precipitation_probability[i]);
  }
  
  // Destruir gráfico anterior si existe
  if (AppState.hourlyChart) {
    AppState.hourlyChart.destroy();
  }
  
  const ctx = document.getElementById('hourlyChart').getContext('2d');
  
  // Estilo de colores del gráfico según tema del body
  const accentColor = getComputedStyle(document.body).getPropertyValue('--theme-accent').trim() || '#38bdf8';
  
  // Crear gradiente para la temperatura
  const tempGradient = ctx.createLinearGradient(0, 0, 0, 200);
  tempGradient.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
  tempGradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
  
  AppState.hourlyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: `Temperatura (°${AppState.unit})`,
          data: temps,
          borderColor: accentColor,
          borderWidth: 3,
          backgroundColor: tempGradient,
          fill: true,
          tension: 0.4,
          yAxisID: 'yTemp',
          pointRadius: 2,
          pointHoverRadius: 6
        },
        {
          label: 'Prob. Lluvia (%)',
          data: rainChances,
          borderColor: 'rgba(96, 165, 250, 0.6)',
          borderWidth: 2,
          borderDash: [5, 5],
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.3,
          yAxisID: 'yRain',
          pointRadius: 0,
          pointHoverRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: '#cbd5e1',
            font: { family: 'Inter', size: 11 }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: '#0f172ae6',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#94a3b8',
            maxTicksLimit: 8,
            font: { family: 'Inter', size: 10 }
          }
        },
        yTemp: {
          type: 'linear',
          position: 'left',
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: {
            color: '#94a3b8',
            font: { family: 'Inter', size: 10 },
            callback: value => `${value}°`
          }
        },
        yRain: {
          type: 'linear',
          position: 'right',
          grid: { display: false },
          min: 0,
          max: 100,
          ticks: {
            color: '#60a5fa',
            font: { family: 'Inter', size: 10 },
            callback: value => `${value}%`
          }
        }
      }
    }
  });
}

// Renderizado de lista de 7 días
function render7DayForecast(daily) {
  elements.forecastList.innerHTML = '';
  
  // Empezamos desde el día 1 (mañana) hasta el día 7
  for (let i = 1; i < 7; i++) {
    const date = new Date(daily.time[i] + 'T00:00:00'); // Evitar desfasamiento local
    const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    
    const maxStr = formatTemp(daily.temperature_2m_max[i]);
    const minStr = formatTemp(daily.temperature_2m_min[i]);
    const code = daily.weather_code[i];
    const codeInfo = WeatherCodes[code] || { label: 'Desconocido', icon: 'help-circle' };
    
    const row = document.createElement('div');
    row.className = 'forecast-row';
    row.innerHTML = `
      <span class="forecast-day">${capitalizedDay}</span>
      <div class="forecast-desc-col">
        <i data-lucide="${codeInfo.icon}"></i>
        <span class="forecast-desc">${codeInfo.label}</span>
      </div>
      <div class="forecast-temps">
        <span class="forecast-max">${maxStr}</span>
        <span class="forecast-min">${minStr}</span>
      </div>
    `;
    elements.forecastList.appendChild(row);
  }
}

// FAVORITOS Y PERSISTENCIA
function loadFavorites() {
  const saved = localStorage.getItem('aura_favorites');
  if (saved) {
    try {
      AppState.favorites = JSON.parse(saved);
    } catch (e) {
      AppState.favorites = [];
    }
  }
  renderFavoritesList();
}

function renderFavoritesList() {
  elements.favoritesList.innerHTML = '';
  
  if (AppState.favorites.length === 0) {
    elements.favoritesList.innerHTML = '<p class="no-favorites">No tienes ciudades favoritas guardadas.</p>';
    return;
  }
  
  AppState.favorites.forEach((fav) => {
    const badge = document.createElement('div');
    badge.className = 'fav-badge';
    
    // Nombre corto para mostrar (ej: "Madrid")
    const shortName = fav.name.split(',')[0];
    
    badge.innerHTML = `
      <span>${shortName}</span>
      <button class="btn-remove-fav" title="Eliminar favorito">
        <i data-lucide="x"></i>
      </button>
    `;
    
    // Click en la ciudad para cargar
    badge.addEventListener('click', (e) => {
      if (e.target.closest('.btn-remove-fav')) return; // No disparar si se clickea la x
      AppState.currentCity = fav;
      localStorage.setItem('aura_last_city', JSON.stringify(fav));
      fetchWeatherData(fav.lat, fav.lon, fav.name);
      elements.favoritesBar.classList.add('hidden'); // Cerrar menú
    });
    
    // Botón eliminar favorito
    badge.querySelector('.btn-remove-fav').addEventListener('click', (e) => {
      e.stopPropagation();
      removeFavorite(fav);
    });
    
    elements.favoritesList.appendChild(badge);
  });
  
  safeCreateIcons();
}

function toggleCurrentFavorite() {
  const isFav = AppState.favorites.some(f => isSameLocation(f, AppState.currentCity));
  
  if (isFav) {
    removeFavorite(AppState.currentCity);
  } else {
    addFavorite(AppState.currentCity);
  }
}

function addFavorite(city) {
  // Evitar duplicados
  if (!AppState.favorites.some(f => isSameLocation(f, city))) {
    AppState.favorites.push(city);
    localStorage.setItem('aura_favorites', JSON.stringify(AppState.favorites));
    renderFavoritesList();
    updateFavoriteBtnState();
    showToast(`Guardado ${city.name.split(',')[0]} en favoritos`, 'star');
  }
}

function removeFavorite(city) {
  AppState.favorites = AppState.favorites.filter(f => !isSameLocation(f, city));
  localStorage.setItem('aura_favorites', JSON.stringify(AppState.favorites));
  renderFavoritesList();
  updateFavoriteBtnState();
  showToast(`Eliminado ${city.name.split(',')[0]} de favoritos`, 'trash');
}

function updateFavoriteBtnState() {
  const isFav = AppState.favorites.some(f => isSameLocation(f, AppState.currentCity));
  if (isFav) {
    elements.favoriteBtn.classList.add('active');
  } else {
    elements.favoriteBtn.classList.remove('active');
  }
}

function isSameLocation(loc1, loc2) {
  // Comparación por coordenadas aproximadas para manejar pequeñas variaciones
  return Math.abs(loc1.lat - loc2.lat) < 0.05 && Math.abs(loc1.lon - loc2.lon) < 0.05;
}

// TOAST NOTIFICATIONS (Premium feedback)
function showToast(message, iconName = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${message}</span>
  `;
  
  elements.toastContainer.appendChild(toast);
  safeCreateIcons();
  
  // Animación de salida y remoción
  setTimeout(() => {
    toast.style.transition = 'all 0.5s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => {
      toast.remove();
    }, 500);
  }, 3500);
}

// Intentar obtener la ubicación real al inicio de forma silenciosa
function detectUserLocationAutomatically() {
  if (!navigator.geolocation) return;
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      
      showToast('Ubicación detectada. Actualizando clima local...', 'map-pin');
      
      let cityName = 'Tu Ubicación';
      try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=es`);
        const geoData = await response.json();
        if (geoData.city || geoData.locality) {
          cityName = `${geoData.city || geoData.locality}, ${geoData.countryName}`;
        }
      } catch (err) {
        console.warn('Error al resolver nombre de ubicación inicial', err);
      }
      
      AppState.currentCity = { name: cityName, lat: latitude, lon: longitude };
      localStorage.setItem('aura_last_city', JSON.stringify(AppState.currentCity));
      fetchWeatherData(latitude, longitude, cityName);
    },
    (error) => {
      console.warn('Geolocalización automática denegada o fallida:', error);
    },
    { enableHighAccuracy: false, timeout: 15000 }
  );
}

// Llamada segura para procesar iconos de Lucide
function safeCreateIcons() {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  } else {
    console.warn('Lucide no cargó a tiempo. Reintentando en breve...');
    setTimeout(() => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    }, 1000);
  }
}

// Convertidor/Formateador de temperatura
function formatTemp(celsius, rawValueOnly = false) {
  let value = celsius;
  if (AppState.unit === 'F') {
    value = (celsius * 9) / 5 + 32;
  }
  value = Math.round(value);
  if (rawValueOnly) return value;
  return `${value}°${AppState.unit}`;
}

// Alternar unidades de temperatura
function toggleTemperatureUnit() {
  AppState.unit = AppState.unit === 'C' ? 'F' : 'C';
  
  const toggleBtn = elements.unitToggleBtn;
  if (toggleBtn) {
    toggleBtn.textContent = `°${AppState.unit === 'C' ? 'F' : 'C'}`;
    toggleBtn.title = `Cambiar a °${AppState.unit === 'C' ? 'F' : 'C'}`;
  }
  
  // Actualizar indicador de unidad principal
  const unitDisplay = document.querySelector('.temp-unit');
  if (unitDisplay) {
    unitDisplay.textContent = `°${AppState.unit}`;
  }
  
  // Re-renderizar con los datos en cache si existen
  if (AppState.lastWeatherData) {
    renderWeather(AppState.lastWeatherData, AppState.currentCity.name);
  }
  
  showToast(`Unidades cambiadas a °${AppState.unit}`, 'thermometer');
}

// Compartir clima por API Web Share o Copiar
async function shareCurrentWeather() {
  if (!AppState.lastWeatherData) return;
  
  const current = AppState.lastWeatherData.current;
  const codeInfo = WeatherCodes[current.weather_code] || { label: 'Despejado' };
  const tempStr = formatTemp(current.temperature_2m);
  
  const shareText = `AuraWeather: El clima en ${AppState.currentCity.name.split(',')[0]} es de ${tempStr} (${codeInfo.label}). ¡Consulta tu pronóstico en tu navegador!`;
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Clima en ${AppState.currentCity.name.split(',')[0]}`,
        text: shareText,
        url: window.location.href
      });
    } catch (err) {
      console.warn('Error al compartir:', err);
    }
  } else {
    try {
      await navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
      showToast('¡Texto del clima copiado al portapapeles!', 'share-2');
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
      showToast('No se pudo copiar el texto.', 'alert-triangle');
    }
  }
}

// Generación de partículas de clima en el fondo (Lluvia o Nieve)
function updateWeatherEffects(weatherClass, isDay) {
  const bg = document.querySelector('.dynamic-background');
  
  // Eliminar contenedores anteriores
  const oldRain = bg.querySelector('.rain-container');
  const oldSnow = bg.querySelector('.snow-container');
  if (oldRain) oldRain.remove();
  if (oldSnow) oldSnow.remove();

  // Si es de noche y despejado/nublado, no agregamos lluvia/nieve
  if (isDay === 0 && (weatherClass === 'weather-clear-day' || weatherClass === 'weather-night')) {
    return;
  }

  if (weatherClass === 'weather-rainy' || weatherClass === 'weather-storm') {
    const container = document.createElement('div');
    container.className = 'rain-container';
    
    // Generar 40 gotas de lluvia individuales
    for (let i = 0; i < 40; i++) {
      const drop = document.createElement('div');
      drop.className = 'drop';
      drop.style.left = `${Math.random() * 100}%`;
      drop.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
      drop.style.animationDelay = `${Math.random() * 2}s`;
      container.appendChild(drop);
    }
    bg.appendChild(container);
  } else if (weatherClass === 'weather-snowy') {
    const container = document.createElement('div');
    container.className = 'snow-container';
    
    // Generar 30 copos de nieve individuales
    for (let i = 0; i < 30; i++) {
      const flake = document.createElement('div');
      flake.className = 'flake';
      flake.style.left = `${Math.random() * 100}%`;
      flake.style.width = flake.style.height = `${3 + Math.random() * 4}px`;
      flake.style.animationDuration = `${3 + Math.random() * 4}s`;
      flake.style.animationDelay = `${Math.random() * 5}s`;
      container.appendChild(flake);
    }
    bg.appendChild(container);
  }
}

// ==========================================
// CONTROL DE INSTALACIÓN PWA (PROGRAMÁTICO)
// ==========================================

// Capturar el evento de instalación que envía el navegador
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevenir que el navegador muestre su propio banner automático
  e.preventDefault();
  // Guardar el evento para dispararlo más tarde
  deferredPrompt = e;
  
  // Buscar el badge del footer
  const pwaBadge = document.querySelector('.pwa-badge');
  if (pwaBadge) {
    pwaBadge.classList.add('clickable');
    pwaBadge.textContent = 'Instalar AuraWeather';
    pwaBadge.title = 'Instalar como aplicación en tu dispositivo';
    
    // Remover listener viejo por si acaso y añadir el nuevo
    pwaBadge.removeEventListener('click', triggerPWAInstall);
    pwaBadge.addEventListener('click', triggerPWAInstall);
  }
});

// Función para ejecutar la instalación cuando hagan clic
function triggerPWAInstall() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  
  if (isStandalone) {
    showToast('AuraWeather ya está instalada y funcionando.', 'check-circle');
    return;
  }

  if (!deferredPrompt) {
    showToast('Para instalar: pulsa en el menú (︙) de Chrome/Brave y elige "Instalar aplicación".', 'info');
    return;
  }
  
  // Mostrar el banner de instalación guardado
  deferredPrompt.prompt();
  
  // Analizar la respuesta del usuario
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('El usuario aceptó instalar AuraWeather.');
      showToast('¡Instalación iniciada!', 'check');
    } else {
      console.log('El usuario rechazó instalar AuraWeather.');
    }
    
    // Limpiar el prompt guardado ya que solo se puede usar una vez
    deferredPrompt = null;
    
    // Devolver el badge a su estado original
    const pwaBadge = document.querySelector('.pwa-badge');
    if (pwaBadge) {
      pwaBadge.classList.remove('clickable');
      pwaBadge.textContent = 'Versión PWA Instalable';
      pwaBadge.title = '';
    }
  });
}

// Escuchar cuando la app se haya instalado con éxito
window.addEventListener('appinstalled', (evt) => {
  console.log('AuraWeather instalada con éxito.');
  showToast('¡Aplicación instalada con éxito!', 'check-circle');
  
  // Limpiar el botón
  const pwaBadge = document.querySelector('.pwa-badge');
  if (pwaBadge) {
    pwaBadge.classList.remove('clickable');
    pwaBadge.textContent = 'AuraWeather Instalada';
  }
});
