# Servicios GATT

## Estado de conocimiento

A fecha de 2026-10-11, la conexión y desconexión del patinete están probadas por el usuario. **Todavía no se han observado ni confirmado UUID del NAVEE NT5 Max utilizado en las pruebas.** Las lecturas simuladas de los tests no constituyen evidencia del protocolo real.

## Servicios estándar propuestos para la primera comprobación

| UUID corto | UUID completo | Nombre estándar | Presencia en esta unidad |
| --- | --- | --- | --- |
| `180A` | `0000180a-0000-1000-8000-00805f9b34fb` | Device Information | Sin comprobar |
| `180F` | `0000180f-0000-1000-8000-00805f9b34fb` | Battery | Sin comprobar |

Fuente de los nombres y asignaciones: [Bluetooth SIG, Assigned Numbers](https://www.bluetooth.com/wp-content/uploads/Files/Specification/HTML/Assigned_Numbers/out/en/index-en.html). No son UUID propietarios descubiertos ni una garantía de compatibilidad.

## Limitaciones de Web Bluetooth

El navegador requiere declarar servicios en filtros o `optionalServices` al solicitar el dispositivo. La aplicación enumera únicamente servicios primarios accesibles, sujetos a permisos y bloqueos del navegador. Puede haber permisos conservados de sesiones anteriores. Una lista vacía no demuestra que el patinete carezca de datos; una conexión GATT correcta tampoco demuestra que exista acceso a telemetría.

Referencia: [Web Bluetooth en Chrome](https://developer.chrome.com/docs/capabilities/bluetooth).

Si no aparecen servicios, el siguiente paso es obtener su tabla GATT con una herramienta BLE que pueda descubrir los UUID y añadir los de servicio a la configuración de NAVEE Monitor. Realizar únicamente descubrimiento y diagnóstico; no escribir valores ni enviar comandos desconocidos.

## Registrar un hallazgo

Para cada servicio o característica observada, anotar:

- Fecha, modelo, firmware y región conocidos; indicar desconocido cuando corresponda.
- UUID de servicio y característica, instancia si hay UUID repetidos y propiedades.
- Dirección: patinete → aplicación para una lectura o notificación recibida.
- Payload y timestamp, evitando datos identificativos innecesarios en el repositorio.
- Interpretación como hipótesis, probable o confirmada; una única observación no confirma un campo.
- Pasos reproducibles y número de comprobaciones.

El informe JSON del explorador ayuda a recopilar observaciones. Revisar sus lecturas antes de compartirlo: pueden contener identificadores. No añadirlo automáticamente al repositorio.
