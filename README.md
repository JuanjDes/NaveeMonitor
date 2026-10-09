# NAVEE Monitor

Aplicación en desarrollo para explorar y monitorizar mediante Bluetooth Low Energy (BLE) un **NAVEE NT5 Max**, inicialmente en su versión europea/española y con uso principal desde un teléfono Android.

El primer objetivo es **observar, leer, registrar y comprender** la interfaz BLE del patinete. Los datos y capacidades disponibles se confirmarán mediante pruebas en la unidad real, sin asumir compatibilidad entre versiones de firmware.

## Estado actual

Está implementada la primera etapa de conexión: interfaz móvil, selector Bluetooth, conexión/desconexión GATT, nombre e ID del dispositivo, y gestión de cancelaciones y errores. Las pruebas automatizadas usan dispositivos simulados. El 2026-10-09, el usuario confirmó varias conexiones y desconexiones correctas con su patinete desde el móvil. Las pruebas reales de pérdida de alcance, cancelaciones y recuperación ante errores siguen pendientes de confirmación.

La siguiente etapa del **BLE Explorer** será enumerar los servicios y características autorizados. Todavía no hay UUID ni estructuras del protocolo confirmados, lecturas, notificaciones o registro de tramas. El dashboard y la interpretación de telemetría se desarrollarán después de obtener y analizar datos reales. La instalación PWA y el uso sin conexión también están pendientes.

## Primera entrega: BLE Explorer

Funciones previstas:

- Abrir el selector Bluetooth mediante el botón `Conectar`.
- Seleccionar el patinete y conectarse a su servidor GATT.
- Mostrar nombre, identificador cuando esté disponible y estado de conexión.
- Enumerar los servicios y características accesibles desde el navegador.
- Mostrar UUID y propiedades: `read`, `write`, `writeWithoutResponse`, `notify` e `indicate`.
- Leer características compatibles y suscribirse a notificaciones compatibles.
- Mostrar datos en hexadecimal, decimal y ASCII cuando tenga sentido.
- Registrar marcas de tiempo, UUID, datos y errores en un log con tamaño limitado.
- Permitir copiar y exportar el registro.
- Gestionar cancelaciones, desconexiones, errores y funciones no disponibles.

Mostrar una propiedad de escritura no implica utilizarla. Esta entrega no incluirá comandos de configuración ni interpretación de campos desconocidos.

## Alcance y privacidad

El funcionamiento inicial se limita a diagnóstico, lectura y recepción de notificaciones. No se modificarán firmware, ESC, BMS, región, límites de velocidad ni parámetros de seguridad.

Las posibles capacidades relacionadas con Cruise Control y configuraciones regionales se tratarán como cuestiones de investigación pendientes de confirmar. Cualquier futura función experimental deberá estar separada del modo normal de monitorización.

Los datos y registros permanecerán locales por defecto. No se enviará telemetría a servidores externos ni se añadirá analítica. Todo dato externo deberá validarse antes de procesarlo o mostrarlo.

## Enfoque técnico previsto

- HTML5 y CSS, con una interfaz orientada a móvil.
- JavaScript modular y APIs nativas del navegador.
- Web Bluetooth para las operaciones BLE/GATT.
- PWA como formato inicial previsto.
- Almacenamiento local cuando sea necesario.
- Chrome/Chromium en Android como entorno objetivo de pruebas.

La implementación comprobará la disponibilidad de las APIs y los permisos necesarios. La viabilidad del descubrimiento GATT y del acceso a datos se validará con el navegador y el patinete reales; no se da por hecho que todos los servicios sean accesibles ni que la telemetría pueda leerse sin autenticación.

Si las limitaciones encontradas impiden las funciones necesarias, se evaluará una aplicación Android nativa.

## Estructura actual

```text
NaveeMonitor/
├── AGENTS.md                  # Reglas de trabajo en el repositorio
├── CONTEXTO-CODEX-NAVEE.md     # Objetivos, alcance y contexto del proyecto
├── README.md                  # Presentación y estado del proyecto
├── index.html                 # Interfaz de conexión
├── css/styles.css             # Estilos adaptados a móvil
├── js/
│   ├── app.js                 # Coordinación de conexión e interfaz
│   ├── ble/connection.js      # Ciclo de vida de la conexión BLE
│   └── ui/connection-view.js   # Presentación y controles
├── docs/
│   ├── decisiones.md          # Decisiones de arquitectura
│   └── pruebas.md             # Validación y pruebas con el patinete
├── tests/connection.test.js   # Pruebas con BLE simulado
└── package.json               # Módulos y comando de pruebas; sin dependencias
```

La estructura de código se incorporará a medida que sea necesaria, separando interfaz, conexión BLE, registro, protocolo y validación.

## Desarrollo local

La aplicación es estática: no necesita instalación de paquetes ni compilación. Desde la carpeta del proyecto, con Python 3 instalado:

```powershell
python -m http.server 8080 --bind 127.0.0.1
```

Abrir `http://localhost:8080` en el navegador del ordenador. Mantener la terminal abierta y usar `Ctrl+C` para detener el servidor. Evitar abrir `index.html` directamente como archivo: los módulos JavaScript deben servirse por HTTP/HTTPS.

### Prueba desde Android

Web Bluetooth necesita un contexto seguro y que el selector se abra mediante una acción del usuario. Una URL HTTP con la IP local del ordenador no sustituye a HTTPS.

Para probar sin publicar la aplicación, usar Chrome y reenvío de puertos por USB:

1. Arrancar el servidor local anterior en el ordenador.
2. Activar la depuración USB en las opciones de desarrollador de Android, conectar el teléfono y autorizar el ordenador de confianza.
3. En Chrome del ordenador, abrir `chrome://inspect/#devices` y activar **Discover USB devices**.
4. En **Port forwarding**, añadir el puerto `8080` con destino `localhost:8080` y activar el reenvío.
5. En Chrome del teléfono, abrir `http://localhost:8080`. El Bluetooth utilizado será el del teléfono.
6. Activar Bluetooth, encender el patinete y pulsar **Conectar**. Si la app oficial mantiene una conexión, desconectarla antes.

Alternativamente, servir la aplicación desde un alojamiento HTTPS. Este repositorio no despliega la web automáticamente.

Referencias: [Web Bluetooth en Chrome](https://developer.chrome.com/docs/capabilities/bluetooth) y [reenvío de puertos a Android](https://developer.chrome.com/docs/devtools/remote-debugging/local-server).

El selector muestra dispositivos cercanos sin filtrar por nombre: aún no se ha confirmado el nombre anunciado por esta unidad. Seleccionar únicamente el patinete que se desea probar. El ID mostrado es el identificador proporcionado por el navegador, no el número de serie.

### Pruebas automatizadas

Con Node.js 20 o posterior:

```powershell
npm test
```

No es necesario ejecutar `npm install`. Las pruebas verifican el flujo de conexión con dobles de BLE y el renderizado de estado; no sustituyen las pruebas de hardware ni una revisión visual en móvil. Consultar [docs/pruebas.md](docs/pruebas.md).

### Reglas de trabajo

Antes de modificar código, revisar:

1. [AGENTS.md](AGENTS.md).
2. Este README.
3. [CONTEXTO-CODEX-NAVEE.md](CONTEXTO-CODEX-NAVEE.md).
4. [docs/decisiones.md](docs/decisiones.md).
5. La estructura y el estado actual del repositorio.

Trabajar mediante ramas, con cambios pequeños y verificables. Evitar dependencias innecesarias y refactorizaciones ajenas a la tarea.

## Hoja de ruta

1. **Detector y explorador BLE:** conexión y enumeración de servicios y características.
2. **Logger:** lecturas, notificaciones y exportación de tramas.
3. **Investigación del protocolo:** pruebas reproducibles y documentación de UUID y campos.
4. **Parser NAVEE:** interpretación de datos confirmados, con pruebas sin conexión al patinete.
5. **Dashboard:** visualización de los datos realmente disponibles, como batería, velocidad, kilometraje, firmware y errores.
6. **Históricos:** registro local de trayectos y métricas respaldadas por los datos obtenidos.
7. **Investigación avanzada:** evaluación de capacidades adicionales, separada del funcionamiento normal.

## Documentación de descubrimientos

Se crearán progresivamente estos documentos:

- `docs/servicios-gatt.md`: servicios, características y propiedades observadas.
- `docs/protocolo-navee.md`: estructuras e interpretaciones del protocolo, con su nivel de confianza.
- `docs/pruebas.md`: condiciones, experimentos y resultados.
- `docs/decisiones.md`: decisiones de arquitectura y sus motivos.

Cada descubrimiento indicará si es una **hipótesis**, **probable** o **confirmado**, junto con las pruebas que lo respaldan. Una única observación no será suficiente para confirmar un campo.
