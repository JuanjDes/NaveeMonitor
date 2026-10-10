# Decisiones de arquitectura

## 2026-10-11 — Exploración GATT y lecturas manuales

### Decisión

Añadir `js/ble/services.js` para validar y normalizar UUID, `js/ble/gatt.js` para descubrir y leer atributos, `js/ui/gatt-view.js` para su interfaz, y utilidades de conversión y exportación. Mantener la conexión existente y pasarle los UUID validados mediante `optionalServices`. No añadir dependencias.

### Permisos y alcance

Solicitar inicialmente los servicios estándar `180A` y `180F`, cuya presencia en el patinete no está confirmada. Permitir editar la lista antes de conectar. El descubrimiento enumera servicios primarios accesibles mediante `getPrimaryServices()` y sus características; no obtiene necesariamente toda la tabla GATT. Los permisos que el navegador conserve de otras conexiones pueden ampliar el conjunto visible.

No deducir la ausencia de un servicio a partir de un resultado vacío ni identificar campos NAVEE por su posición. Los UUID propietarios deberán obtenerse de observaciones reales. No se realiza barrido de UUID ni autenticación improvisada.

### Lecturas y recuperación

Las lecturas requieren pulsar Leer y una propiedad `read` válida. Mostrar datos crudos con timestamp, sin interpretar el protocolo. Ejecutar una sola operación GATT a la vez. Al desconectar, invalidar las referencias a características y descartar resultados pendientes mediante una generación de sesión. Conservar un informe marcado como anterior hasta conectar de nuevo.

Limitar la entrada a 32 UUID y 2048 caracteres, la exploración a 32 servicios y 64 características por servicio, y cada valor a 512 bytes. Marcar informes parciales cuando un servicio falla o se alcanza un límite. No utilizar UUID como identificadores únicos de instancia: pueden repetirse.

### Exportación y privacidad

Copiar o descargar JSON solo por acción del usuario. No guardar datos de forma persistente ni enviarlos a servidores. Omitir nombre e ID del navegador; avisar de que las lecturas pueden contener identificadores. El informe guarda la última lectura de cada característica, no un historial de tramas. Notificaciones y logger continuo quedan para la siguiente entrega.

### Validación y referencias

Pruebas con BLE simulado para permisos, descubrimiento parcial, duplicados, conversión de buffers, fallos, concurrencia y desconexiones. Añadir una prueba de integración con DOM simulado para comprobar el flujo de botones y exportación. La revisión visual y las pruebas GATT con el patinete real quedan pendientes.

Referencias: [Web Bluetooth en Chrome](https://developer.chrome.com/docs/capabilities/bluetooth) y [UUID asignados por Bluetooth SIG](https://www.bluetooth.com/wp-content/uploads/Files/Specification/HTML/Assigned_Numbers/out/en/index-en.html).

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
