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
* **API de Respaldo Automático (MET Norway Failover)**:
  * Se integró la API pública de **MET Norway (yr.no)** como proveedor de clima secundario de respaldo.
  * Si la petición a la API principal (Open-Meteo) falla o supera el tiempo de espera de 8 segundos, la aplicación captura el fallo e inicia de forma inmediata una llamada a la API de MET Norway.
  * Se desarrolló un transformador de datos (`mapMetNorwayToOpenMeteo`) que adapta la estructura JSON de MET Norway al formato estándar de Open-Meteo. Esto hace que el cambio de API sea 100% transparente para el usuario final, manteniendo intactos todos los componentes visuales (gráficos de tendencias, tarjetas deslizables, astronomía diurna/nocturna y sintetizador de audio).
* **Actualización Forzada e Inmediata de PWA**:
  * Se implementó un detector de actualizaciones avanzadas en el registro del Service Worker en `index.html`.
  * Ahora, cuando se publica una nueva versión de la app en GitHub Pages, la aplicación envía un comando `SKIP_WAITING` y escucha el evento `controllerchange`.
  * Esto fuerza una **recarga de página automática e instantánea** para el usuario tan pronto como la nueva versión se instala, eliminando por completo el problema del "caché pegajoso" sin requerir que el usuario borre los datos de forma manual o cierre la aplicación.

### 3 de Julio de 2026
* **Migración de API de Respaldo a BrightSky (Solución a bloqueo CORS)**:
  * **Problema detectado**: La API de MET Norway no soporta CORS directamente en el navegador, lo que bloqueaba las peticiones desde el teléfono del usuario final.
  * **Solución**: Se reemplazó por la API de **BrightSky (api.brightsky.dev)**, la cual sirve datos del Servicio Meteorológico Alemán (DWD).
  * **Ventajas**: BrightSky no requiere llave API, soporta CORS de forma nativa desde el navegador web de cualquier teléfono/PC, y cubre pronósticos globales de forma gratuita.
  * **Adaptador de Datos (`mapBrightSkyToOpenMeteo`)**: Se rediseñó el adaptador de datos para mapear la estructura horaria e íconos de BrightSky al formato nativo de Open-Meteo de manera 100% transparente para la renderización de la app.
  * **Exclusión de Caché en sw.js**: Se actualizó el Service Worker (caché **`v15`**) para omitir el almacenamiento dinámico de las llamadas a `api.brightsky.dev`.
