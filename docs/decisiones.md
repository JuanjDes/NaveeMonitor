# Decisiones de arquitectura

## 2026-10-09 — Primera entrega de conexión

### Decisión

Empezar con una web estática de HTML, CSS y módulos JavaScript, sin dependencias de ejecución ni compilación. Separar la conexión BLE (`js/ble/connection.js`), el DOM (`js/ui/connection-view.js`) y su coordinación (`js/app.js`). Utilizar el runner integrado de Node.js para pruebas con dispositivos simulados.

### Alcance

Esta entrega abre el selector, conecta a GATT, muestra nombre e ID del navegador y permite desconectar o cancelar una conexión pendiente. No enumera servicios, lee características, inicia notificaciones ni envía escrituras. No hay reconexión automática, almacenamiento o envío de datos externos.

Se posponen el manifest y el Service Worker hasta estabilizar la primera versión; todavía no es una PWA instalable ni ofrece uso sin conexión.

### Selección y permisos

Usar `acceptAllDevices: true` porque no se ha confirmado el nombre anunciado ni ningún UUID del NT5 Max. El usuario debe identificar su patinete en el selector; la aplicación no verifica el modelo mediante el nombre.

No inventar UUID ni solicitar servicios en esta entrega. En la siguiente etapa, el acceso a servicios exigirá declararlos en filtros o `optionalServices`; enumerar servicios accesibles desde Web Bluetooth no equivale a obtener todo el mapa GATT. Será necesario obtener los UUID mediante observaciones o una herramienta de diagnóstico cuando el navegador no permita descubrirlos.

Referencia: [Web Bluetooth en Chrome](https://developer.chrome.com/docs/capabilities/bluetooth).

### Estado y recuperación

Estados explícitos: desconectado, seleccionando, conectando, conectado, error y no disponible. El selector se cancela desde el navegador; la conexión pendiente se cancela desde la interfaz. Las sesiones descartan resultados tardíos y retiran listeners al terminar. El identificador del navegador no se interpreta como MAC ni número de serie.

### Resultado

El 2026-10-09, el usuario confirmó una conexión correcta desde el móvil con el patinete del proyecto y, posteriormente, varias conexiones y desconexiones con éxito. Esto valida la conexión inicial y los ciclos de conexión/desconexión en su entorno de prueba; no confirma todavía acceso a servicios, telemetría, recuperación ante errores ni compatibilidad con otros teléfonos o versiones de firmware. Los detalles del entorno no se han comunicado. Véase el registro de `pruebas.md`.
