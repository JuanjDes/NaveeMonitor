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
