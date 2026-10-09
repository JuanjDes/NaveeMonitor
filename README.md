# NAVEE Monitor

Aplicación en desarrollo para explorar y monitorizar mediante Bluetooth Low Energy (BLE) un **NAVEE NT5 Max**, inicialmente en su versión europea/española y con uso principal desde un teléfono Android.

El primer objetivo es **observar, leer, registrar y comprender** la interfaz BLE del patinete. Los datos y capacidades disponibles se confirmarán mediante pruebas en la unidad real, sin asumir compatibilidad entre versiones de firmware.

## Estado actual

El proyecto está en su fase inicial de documentación y preparación. Todavía no hay una aplicación ejecutable, conexión BLE implementada ni UUID o estructuras del protocolo confirmados.

La primera entrega prevista es un **BLE Explorer**. El dashboard y la interpretación de telemetría se desarrollarán después de obtener y analizar datos reales.

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
└── README.md                  # Presentación y estado del proyecto
```

La estructura de código se incorporará a medida que sea necesaria, separando interfaz, conexión BLE, registro, protocolo y validación.

## Desarrollo local

Todavía no hay pasos de instalación o ejecución. Se documentarán junto con la primera versión funcional.

Antes de modificar código, revisar:

1. [AGENTS.md](AGENTS.md).
2. Este README.
3. [CONTEXTO-CODEX-NAVEE.md](CONTEXTO-CODEX-NAVEE.md).
4. `docs/decisiones.md`, cuando exista.
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
