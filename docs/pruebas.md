# Pruebas

## Pruebas automatizadas de conexión

Ejecutar `npm test` con Node.js 20 o posterior. No requiere `npm install`.

Los dispositivos BLE se simulan para probar selección, cancelación, permisos denegados, errores GATT, desconexión voluntaria e inesperada, intentos duplicados, respuestas tardías, validación del nombre/ID y renderizado seguro. Estas pruebas no confirman compatibilidad con hardware real.

Resultado del 2026-10-09: **11 pruebas superadas** con Node.js 20.18.0. No había navegador conectado disponible para una revisión visual durante la sesión de desarrollo. La prueba posterior del usuario con hardware se registra a continuación.

## Comprobación manual en navegador y Android

1. Servir el proyecto siguiendo el README y abrir la página directamente en Chrome.
2. Comprobar que los botones, textos y datos caben en una pantalla móvil y se pueden utilizar con teclado.
3. Sin soporte Web Bluetooth o contexto seguro, comprobar el aviso y el botón Conectar deshabilitado.
4. Pulsar Conectar y cancelar el selector: debe quedar desconectado y permitir otro intento.
5. Encender el patinete, activar Bluetooth y desconectar la app oficial si mantiene una conexión.
6. Elegir el patinete: comprobar nombre, ID y transición a Conectado. No interpretar el ID como número de serie.
7. Pulsar Desconectar y repetir la conexión: comprobar que no se duplican eventos.
8. Si una conexión tarda, pulsar Cancelar conexión: no debe aparecer Conectado después de la cancelación.
9. Apagar el patinete mientras está conectado: debe indicar pérdida de conexión sin reconectar automáticamente.

## Segunda etapa: exploración GATT (2026-10-11)

Las pruebas automatizadas añaden validación de UUID, descubrimiento secuencial y parcial, UUID duplicados, permisos denegados, lecturas manuales, límites de tamaño, respeto al offset de DataView, desconexiones con operaciones pendientes, aislamiento de informes y flujo completo de la aplicación con DOM/BLE simulados.

Resultado del 2026-10-11: **28 pruebas superadas** mediante `npm test`, incluidas las pruebas de conexión existentes. El runner se ejecutó fuera del entorno restringido porque este bloqueaba la creación de procesos con `EPERM`.

La revisión visual está pendiente: no hay navegador conectado disponible en esta sesión. El primer intento real de descubrimiento se registra más abajo; el resto de comprobaciones de esta lista sigue pendiente salvo evidencia indicada en ese registro:

1. Comprobar en móvil que aparecen la configuración de UUID y el Explorador GATT.
2. Introducir un UUID inválido y pulsar Conectar: debe indicar el error sin abrir el selector.
3. Conectar con la lista inicial `180A`, `180F` y pulsar Explorar servicios. Registrar resultados o mensaje de error, sin asumir que estos servicios están presentes.
4. Si no hay servicios accesibles, obtener UUID reales mediante una herramienta de diagnóstico BLE y reintentar tras añadirlos y volver a conectar.
5. Comprobar UUID y propiedades. Una característica sin `read` debe tener el botón Leer deshabilitado, aunque admita escritura o notificaciones.
6. Leer manualmente una característica compatible y comprobar timestamp y formatos HEX/decimal/ASCII. No atribuir significado NAVEE a bytes sin evidencia.
7. Copiar y exportar el informe JSON. Comprobar que el archivo refleja los datos visibles, incluso ante errores.
8. Desconectar durante descubrimiento o lectura: no deben aparecer datos tardíos como actuales. Los resultados anteriores deben seguir exportables y las lecturas deshabilitadas.
9. Conectar de nuevo y volver a explorar: debe obtener referencias nuevas y no conservar valores de la sesión anterior como actuales.

Solo se guarda en memoria la última lectura por característica. Exportar antes de recargar, conectar de nuevo o repetir la exploración.

## Registro de pruebas reales

### 2026-10-18 — Firmware del accesorio y nuevo rechazo de B001

- Fuente: `navee-gatt-report_(4)[1].json`; no se incorpora el archivo original.
- Descubrimiento: `2026-10-18T14:12:48.208Z`. Exportación: `2026-10-18T14:14:34.936Z` (16:14:34 en Europe/Madrid). Conexión activa, sin operación pendiente ni informe obsoleto, tres servicios y 13 características.
- B001 se intenta leer a las `2026-10-18T14:13:07.370Z`: `NotSupportedError`, sin valor recibido. Se reproduce el rechazo registrado en los informes anteriores que intentaron esa lectura.
- La característica `6aa50007-6352-4d57-a7b4-003a416fbb0b`, etiquetada Accessory Firmware Version dentro del servicio `87290102-3c51-43b1-a1a9-11b9dc38478b`, devuelve cuatro bytes `01 01 01 00` a las `2026-10-18T14:13:45.092Z`, sin error. Dirección: patinete → aplicación. Es una observación de payload, pendiente de confirmar su formato de versión y reproducibilidad; no se interpreta como firmware ESC/BMS.
- Las demás características no registran intentos en esta exploración. El mensaje general «Lectura recibida» corresponde al resultado más reciente y no implica que B001 haya funcionado.
- Siguiente prueba: desconectar NAVEE Monitor, conectar con nRF Connect en CLIENT, abrir el servicio `0000d0ff-3c17-d293-8e48-14fe2e4da212` y leer la característica Unknown Characteristic `0xB001` con su flecha hacia abajo (no el descriptor `2901`). Registrar el valor o error exacto. Su finalidad sigue desconocida.

### 2026-10-18 — Primeras tres lecturas recibidas desde NAVEE Monitor

- Fuente: `navee-gatt-report_(3)[1].json`; no se incorpora el archivo original al repositorio.
- Descubrimiento: `2026-10-18T12:15:04.748Z`. Exportación: `2026-10-18T12:16:20.731Z` (14:16:20 en Europe/Madrid).
- Se mantienen tres servicios y 13 características. Conexión activa, sin operación pendiente ni informe obsoleto; descubrimiento sin errores registrados (`incomplete: false`).
- Tres características tienen intento y valor recibido, sin error: fabricante del accesorio (`6aa50002…`) devuelve `Realtek` más byte nulo; modelo (`6aa50003…`) devuelve `Realtek Reference Implementation` más byte nulo; potencia Bluetooth (`2A07`) devuelve `07`. Payloads completos, UUID y timestamps en `servicios-gatt.md`.
- B001 no registra intento en esta exploración. La ausencia de error en esta sesión no resuelve el rechazo documentado anteriormente. Las otras siete características del accesorio no se han intentado leer en la exploración exportada.
- Resultado: lectura manual y exportación de valores reales verificadas en esta sesión. No demuestra lectura correcta de todos los atributos ni acceso a batería de tracción, velocidad, kilometraje o firmware del controlador.
- Entorno y versiones: no comunicados; unidad del proyecto según el contexto. Los textos leídos no verifican el modelo exacto del patinete.
- Próximo paso: repetir las lecturas obtenidas, leer versión de firmware del accesorio y exportar antes de volver a explorar/reconectar. Comparar B001 con una lectura en nRF Connect en una conexión separada, sin escrituras a B002.

### 2026-10-18 — Repetición con diagnóstico de lectura actualizado

- Fuente: `navee-gatt-report (2).json`; se documenta el resultado sin incorporar el archivo original.
- Descubrimiento: `2026-10-18T11:11:28.078Z`. Exportación: `2026-10-18T11:11:52.019Z` (13:11:52 en Europe/Madrid).
- Se reproducen los tres servicios y 13 características del informe anterior, con 11 características que anuncian READ. Conexión activa, sin operación pendiente, `stale: false` e `incomplete: false`.
- B001 registra `lastReadAttemptAt: 2026-10-18T11:11:42.538Z` y `errorName: NotSupportedError`. Esta vez el tipo de error está explícito en el JSON. La causa concreta del rechazo sigue sin determinarse; no se recibió ningún valor.
- Las nueve características del accesorio y 2A07 tienen `lastReadAttemptAt: null`, sin valor ni error. En la exploración exportada no consta ningún intento de leerlas. Esto no permite concluir que sus lecturas fallen.
- Los nuevos campos confirman que se utilizó una versión con el diagnóstico actualizado. El informe no verifica por sí solo la presentación visual de los botones.
- Próximo paso: leer manualmente fabricante y modelo en Información del accesorio y 2A07 en Potencia de transmisión Bluetooth; exportar después sin volver a explorar ni reconectar, porque esas acciones reemplazan los resultados. Comparar B001 con una lectura manual en nRF Connect, en una conexión separada, para acotar el rechazo.

### 2026-10-18 — Descubrimiento desde NAVEE Monitor y lectura fallida de B001

- Fuente: `navee-gatt-report (1).json` facilitado por el usuario; no se incorpora el original al repositorio.
- Descubrimiento: `2026-10-18T10:46:28.503Z`. Exportación: `2026-10-18T10:49:22.309Z` (12:49:22 en Europe/Madrid).
- Estado: conectado, exploración intentada, sin operación pendiente ni informe obsoleto; `incomplete: false`.
- Solicitados y descubiertos: D0FF (`0000d0ff-3c17-d293-8e48-14fe2e4da212`), información del accesorio (`87290102-3c51-43b1-a1a9-11b9dc38478b`) y Tx Power (`1804`). Son 13 características, 11 con READ.
- B001 anuncia READ pero registra «Esta operación no está soportada por el dispositivo o el navegador». El código traduce así `NotSupportedError`; el informe antiguo no conserva el nombre original ni el momento del intento. No confirma un problema de autenticación, firmware o permisos concreto.
- Todos los valores son nulos. Las nueve características de información del accesorio y 2A07 no tienen lecturas ni errores registrados. No hay payload ni telemetría confirmada.
- El usuario informa que no localizó «Leer» para B001 ni para la información del accesorio. Se mejora su identificación con nombres observados, botones por característica antes de las propiedades y detalle del último intento/error.
- Siguiente prueba: publicar y recargar los cambios, usar la misma lista de UUID, conectar, explorar, leer fabricante/modelo del accesorio y 2A07, reintentar B001 y exportar. Si B001 vuelve a fallar, comparar una lectura manual de esa misma característica en nRF Connect, en una conexión separada.
- Entorno, firmware y región verificada: no comunicados; unidad del proyecto según el usuario.

### Validación automatizada de las mejoras de lectura

Resultado del 2026-10-18: **29 pruebas superadas** mediante `npm test`.

Los dobles de BLE y DOM comprueban que B001 aparece como «Leer B001», que B002/B003 no permiten lectura directa y que un rechazo de B001 permite reintentar y leer el modelo del accesorio. Se verifica la exportación del tipo de error y la fecha del intento, el borrado del error tras un reintento correcto y la omisión de mensajes arbitrarios. Los datos son simulados: la revisión visual en móvil y las lecturas reales siguen pendientes.

### 2026-10-18 — Capturas de descubrimiento en nRF Connect

- Fuente: once capturas del usuario, aproximadamente de 11:00 a 11:04 según sus nombres y pantalla.
- Diez capturas muestran CLIENT y conexión con un dispositivo llamado NAVEE, en estado BONDED. Se observan siete UUID de servicio distintos; el detalle de características se documenta en `servicios-gatt.md`.
- Hallazgos para la próxima prueba: servicio desconocido `0000d0ff-3c17-d293-8e48-14fe2e4da212` con `B001` READ, `B002` WRITE/WRITE NO RESPONSE y `B003` NOTIFY; servicio de información del accesorio `87290102-3c51-43b1-a1a9-11b9dc38478b` con características READ; servicio `1804` con `2A07` READ.
- La última captura, `110426`, muestra SERVER con Bluetooth desactivado y estado DISCONNECTED: sus servicios locales no se añaden al mapa remoto.
- No hay lecturas de los payloads de los servicios candidatos ni confirmación de batería, firmware del controlador o telemetría. No se ha probado todavía su acceso desde NAVEE Monitor.
- Próximo paso: configurar los tres servicios propuestos en `servicios-gatt.md`, volver a conectar desde NAVEE Monitor, explorar, realizar lecturas manuales y exportar JSON. Las capturas no se copian al repositorio para evitar almacenar la dirección Bluetooth.

### 2026-10-11 — Descubrimiento sin servicios accesibles

- Fuente: informe `navee-gatt-report.json` facilitado por el usuario; no se incorpora el archivo original al repositorio.
- Exportación: `2026-10-10T23:11:30.664Z` (11 de octubre, 01:11:30 en Europe/Madrid).
- Estado: `connected: true`, `attempted: true`, `busy: false`, `stale: false`.
- Servicios solicitados: `0000180a-0000-1000-8000-00805f9b34fb` y `0000180f-0000-1000-8000-00805f9b34fb`.
- Resultado: `services: []`, `discoveredAt: null`, `incomplete: true`; mensaje «No se encontraron atributos accesibles. No permite concluir que el patinete carezca de ellos».
- Interpretación: el mensaje corresponde a `NotFoundError` en la implementación actual. El JSON no conserva el nombre ni el mensaje original de la excepción. No se completó el descubrimiento ni se obtuvieron lecturas.
- No confirma ausencia de servicios GATT ni necesidad de autenticación. No permite determinar los UUID propietarios del patinete.
- Siguiente paso: obtener la lista de servicios con una herramienta nativa de diagnóstico BLE, añadir los UUID observados a la configuración y volver a conectar y explorar. Usar solo descubrimiento, sin escrituras.

### 2026-10-09 — Conexión desde el móvil

- Fuente: prueba realizada y comunicada por el usuario.
- Resultado informado: «conecta perfectamente con el patinete»; posteriormente, «probadas varias conexiones y desconexiones con éxito».
- Alcance validado: conexión inicial y varios ciclos de conexión/desconexión desde el móvil con la unidad del proyecto (NAVEE NT5 Max, según el contexto del proyecto). No se ha indicado el número exacto de ciclos.
- Teléfono, sistema operativo y navegador/versiones: no comunicados.
- URL y origen de la prueba: no comunicados; se había previsto usar GitHub Pages.
- Firmware y verificación de región en esta prueba: no comunicados.
- Pendiente: comprobar pérdida de alcance, cancelaciones y recuperación ante errores con hardware real. No se ha verificado mediante registros la ausencia de eventos duplicados.

No se han capturado tramas ni confirmado UUID. Esta prueba no confirma el acceso a datos de telemetría ni la compatibilidad con otras unidades.

Al realizar una prueba, anotar fecha, teléfono, sistema operativo, versión de navegador, origen usado (HTTPS/localhost), modelo, región y firmware si se conocen, pasos y resultado. Marcar como desconocidos los datos no comprobados y omitir identificadores sensibles innecesarios.
