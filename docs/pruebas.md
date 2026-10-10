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

La revisión visual está pendiente: no hay navegador conectado disponible en esta sesión. Las siguientes pruebas con el patinete también están pendientes:

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
