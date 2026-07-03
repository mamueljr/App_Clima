# 📑 AuraWeather - Registro de Desarrollo y Especificaciones (`continue.md`)

Este archivo sirve como bitácora viva del proyecto **AuraWeather**. Contiene la descripción general, las especificaciones tecnológicas y el historial detallado de todas las mejoras y cambios realizados por fecha.

---

## 📝 Descripción del Proyecto

**AuraWeather** es una aplicación web y móvil híbrida premium diseñada para consultar y predecir el clima en tiempo real de cualquier parte del mundo. Desarrollada con un enfoque moderno de **Glassmorphism**, cuenta con soporte para ser instalada como una **PWA (Progressive Web App)** y está preconfigurada para compilarse como una aplicación nativa de Android mediante **Capacitor**.

La aplicación destaca por sus efectos visuales climatológicos dinámicos en vivo (motor de partículas 2D de lluvia y nieve), sonido ambiental sintetizado en tiempo real, geolocalización inteligente y un gráfico interactivo del pronóstico para las próximas horas.

---

## 🛠️ Tecnologías Utilizadas

* **Frontend Core**: HTML5 (semántico) y JavaScript (ES6 vanilla).
* **Diseño y Estilos (CSS)**: Vanilla CSS3, con uso intensivo de variables dinámicas, desenfoques de fondo (`backdrop-filter`) y keyframes para partículas.
* **Gráficos e Iconografía**:
  * **Chart.js**: Renderizado de gráficos de líneas interactivos y responsivos.
  * **Lucide Icons**: Paquete de iconos minimalistas.
* **APIs de Clima y Datos**:
  * **Open-Meteo API**: Consulta gratuita de pronósticos (temperatura, viento, humedad, radiación UV, amanecer/atardecer) y geocodificación.
* **Sonido Dinámico (Offline)**:
  * **Web Audio API**: Generación y filtrado de ondas de audio digital en el cliente para simular lluvia, viento y tormentas sin archivos externos.
* **Integración del Sistema & PWA**:
  * **Service Worker (`sw.js`)**: Estrategia de caché local para soporte offline.
  * **Web Share API**: Compartición nativa del reporte climatológico.
  * **Capacitor (Android)**: Envoltura híbrida para empaquetado nativo en móviles.
* **CI/CD / Nube**:
  * **GitHub Actions**: Pipeline para compilación automática del archivo `.apk` de instalación nativa en la nube.

---

## 📅 Historial de Cambios y Mejoras

### 30 de Junio de 2026
* **Tarjeta de Astronomía (Sol y Luna)**:
  * Implementación de un widget interactivo con un arco SVG dinámico de doble propósito.
  * Durante el día, dibuja un **Sol dorado** (`#fbbf24`) que sigue una curva trigonométrica basada en el tiempo transcurrido desde el amanecer hasta el atardecer.
  * Durante la noche, el nodo se transforma en una **Luna plateada** (`#e2e8f0`) que avanza sobre la misma curva midiendo el transcurso de la noche hasta el amanecer del día siguiente.
  * Se añadió el cálculo matemático del ciclo sinódico lunar para determinar la fase lunar exacta (ej. *Creciente Cóncava*, *Luna Llena*) y su porcentaje de iluminación.
* **Pronóstico por Horas Deslizable (Swipeable)**:
  * Creación de un carrusel de tarjetas horizontal deslizable con soporte táctil para móviles, mostrando las siguientes 12 horas de forma clara y accesible sin necesidad de leer el gráfico.
* **Filtros del Gráfico de Tendencia**:
  * Adición de botones (**6H / 12H / 24H**) en el gráfico para que los usuarios puedan recortar el rango de horas.
  * Se estableció **6H por defecto** para evitar que la gráfica se encime o se comprima en pantallas verticales de teléfonos.
* **Sintetizador de Audio Ambiental (Web Audio API)**:
  * Creación de un motor de sonido climatológico sintetizado 100% offline. Genera lluvia (ruido blanco + filtro paso banda), tormenta (lluvia + truenos de baja frecuencia periódicos) y viento (ruido blanco + LFO oscilante).
  * Persistencia de sonido: Se guarda la preferencia del usuario en `localStorage` (`aura_sound_muted`). El sonido está **activado por defecto** y, para cumplir con las políticas de autoplay de los navegadores, se activa con el primer toque o interacción del usuario en la pantalla.
* **Remoción de la Sección de Radar**:
  * Se eliminó el mapa interactivo de Leaflet y RainViewer para eliminar avisos de "zoom level not supported" generados por la API de radar en niveles altos de ampliación, aligerando el peso total de carga de la aplicación.
* **Mejoras de Espaciado y Usabilidad**:
  * Corrección de margen inferior en cabeceras de tarjeta (`.card-header` a `1.25rem`) para separar los subtítulos del contenido inferior.
  * Ajuste de columnas en el pronóstico de 7 días para móviles (`grid-template-columns: 2.8fr 3fr 2.2fr` en menores a 480px), asignando más espacio al nombre del día para evitar que se encime con el icono meteorológico.

### 2 de Julio de 2026
* **Control de Tiempos de Espera (Fetch Timeout)**:
  * Se creó una función utilitaria `fetchWithTimeout` que permite abortar peticiones fetch si sobrepasan un tiempo límite, previniendo congelamientos de la interfaz ante caídas de red o fallas en servidores externos.
  * **API del Clima**: Configurado con un tiempo límite de **8 segundos** para peticiones a Open-Meteo. Si se agota el tiempo, la app aborta la petición, oculta el cargador infinito ("skeleton loader") y despliega una interfaz con un botón destacado de **Reintentar** y un icono de desconexión.
  * **API de Geolocalización Inversa**: Configurado con un límite de **4 segundos** en `bigdatacloud.net` para la geolocalización por GPS e inicio automático, garantizando que el flujo inicial de la app no quede bloqueado si la resolución del nombre de ciudad se ralentiza.
  * **API de Autocompletado de Ciudades**: Límite de **5 segundos** para evitar bloqueos en el campo de búsqueda de texto.
