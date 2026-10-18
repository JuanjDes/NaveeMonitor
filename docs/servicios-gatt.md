# Servicios GATT

## Estado de conocimiento

A fecha de 2026-10-18, la conexión y desconexión del patinete están probadas por el usuario. Las capturas de nRF Connect aportan **UUID y propiedades observados en una sesión real**, pendientes de reproducir desde NAVEE Monitor. No hay campos de telemetría ni comandos del protocolo confirmados. Las lecturas simuladas de los tests no constituyen evidencia del protocolo real.

## Observación del 2026-10-18 — nRF Connect

Fuente: once capturas facilitadas por el usuario, con nombres `Screenshot_20261018_110009_nRF Connect.jpg` a `Screenshot_20261018_110426_nRF Connect.jpg`. No se incorporan las imágenes ni la dirección Bluetooth al repositorio. Las diez primeras muestran la pestaña CLIENT, dispositivo llamado NAVEE y estados CONNECTED/BONDED. Modelo exacto, firmware y región no se han leído en estas capturas; el NT5 Max europeo procede del contexto del proyecto.

La última captura (`110426`) muestra SERVER, DISCONNECTED y Bluetooth desactivado. Se excluye de la evidencia sobre servicios remotos: CLIENT lista servicios del dispositivo remoto y SERVER los locales del teléfono, según la [documentación de Nordic](https://github.com/nordicsemi/Android-nRF-Connect/blob/main/documentation/README.md#connection).

### Servicios visibles en CLIENT

| UUID | Nombre mostrado por nRF Connect | Evidencia |
| --- | --- | --- |
| `1801` | Generic Attribute | `110009` |
| `1800` | Generic Access | `110009` |
| `1812` | Human Interface Device | `110111`, `110312` |
| `87290102-3c51-43b1-a1a9-11b9dc38478b` | Accessory Information Service | `110155`, `110214`, `110225` |
| `FD44` | Find My Network Service | `110155`, `110242`, `110251` |
| `1804` | Tx Power | `110155`, `110312` |
| `0000d0ff-3c17-d293-8e48-14fe2e4da212` | Unknown Service | `110155`, `110321` |

Los nombres son etiquetas mostradas por la herramienta, no valores leídos del patinete. `180A` y `180F` no aparecen en las capturas aportadas; no se afirma su ausencia en todos los modos o versiones del dispositivo. La presencia de servicios etiquetados Find My no demuestra que sean el canal de telemetría del controlador.

### Servicio desconocido: `0000d0ff-3c17-d293-8e48-14fe2e4da212`

Captura `110321`:

| Característica | UUID completo normalizado | Propiedades observadas | Descriptor visible |
| --- | --- | --- | --- |
| `B001` | `0000b001-0000-1000-8000-00805f9b34fb` | READ | `2901` |
| `B002` | `0000b002-0000-1000-8000-00805f9b34fb` | WRITE, WRITE NO RESPONSE | — |
| `B003` | `0000b003-0000-1000-8000-00805f9b34fb` | NOTIFY | `2902` mostrado dos veces |

No hay payload visible ni semántica confirmada. Hipótesis: la combinación de escritura y notificaciones podría servir como canal de intercambio, pero no identifica su finalidad (telemetría, mantenimiento u otra). Primera prueba: explorar y leer exclusivamente `B001`. No enviar datos a `B002`. `B003` no admite lectura directa según las propiedades mostradas; su recepción requerirá implementar una suscripción explícita en una etapa posterior. No se ha confirmado que emita espontáneamente.

La duplicación visual de `2902` se conserva como observación, sin inferir el número real de descriptores hasta disponer de handles o un volcado adicional.

### Información del accesorio: `87290102-3c51-43b1-a1a9-11b9dc38478b`

Capturas `110214` y `110225`. Todas las características siguientes muestran READ. Sus UUID tienen la forma `<prefijo>-6352-4d57-a7b4-003a416fbb0b`:

| Prefijo | Etiqueta mostrada |
| --- | --- |
| `6aa50001` | Accessory Product Data |
| `6aa50002` | Accessory Manufacturer Name |
| `6aa50003` | Accessory Model Name |
| `6aa50005` | Accessory Category |
| `6aa50006` | Accessory Capabilities |
| `6aa50007` | Accessory Firmware Version |
| `6aa50008` | Find My Version |
| `6aa50009` | Accessory Battery Type |
| `6aa5000a` | Accessory Battery Level |

No se muestran valores leídos. No interpretar Accessory Battery Level como porcentaje de la batería de tracción, ni Accessory Firmware Version como versión del ESC o BMS, sin pruebas adicionales.

### Otros atributos observados

- `1801`: `2A05` (INDICATE), descriptor `2902`; la captura indica notificaciones e indicaciones deshabilitadas.
- `1800`: `2A00`, `2A01` y `2A04` (READ). La herramienta muestra valores de conexión a cero para `2A04`; no se usan como valores operativos confirmados.
- `1812`: `2A4E` (READ, WRITE NO RESPONSE), varias instancias `2A4D` con combinaciones de READ/WRITE/NOTIFY/WRITE NO RESPONSE; `2A4B` (READ), `2A22` (NOTIFY, READ, WRITE), `2A32` (READ, WRITE, WRITE NO RESPONSE), `2A4A` (READ), `2A4C` (WRITE NO RESPONSE). Descriptores visibles `2902`, `2907` y `2908`. No se deduce el número exacto de instancias por el solapamiento entre capturas.
- `FD44`: características `4f860001` a `4f860005`, todas con sufijo `-943b-49ef-bed4-2f730304427a`, propiedades INDICATE/WRITE y descriptor `2902`. Etiquetas: Pairing Control Point, Configuration Control Point, Not Owner Control Point, Paired Owner Info Control Point y Debug Control Point. Sin lecturas disponibles ni comandos implementados.
- `1804`: `2A07` (Tx Power Level), READ. Es un atributo de potencia de transmisión Bluetooth, no una medición de potencia del motor.

El servicio HID `1812` está en la [lista de bloqueo de Web Bluetooth](https://raw.githubusercontent.com/WebBluetoothCG/registries/master/gatt_blocklist.txt). No se propone añadirlo ni eludir el bloqueo.

### Próxima prueba con la app existente

Desconectar nRF Connect y la app oficial. En NAVEE Monitor, antes de conectar, sustituir el contenido de la lista de UUID de **servicio** por:

```text
0000d0ff-3c17-d293-8e48-14fe2e4da212
87290102-3c51-43b1-a1a9-11b9dc38478b
1804
```

Conectar, explorar y leer las características que admitan READ, empezando por `B001` y la información del accesorio. Exportar el informe incluso si hay errores. No introducir UUID de características como si fueran servicios. Esta prueba ya es posible sin modificar ni publicar de nuevo el código; se aprovecha la configuración editable existente.

Nivel de confianza: UUID y propiedades observados en una sesión; acceso desde Web Bluetooth y significado de los payloads pendientes. BONDED no confirma autenticación de aplicación ni demuestra que el bonding sea imprescindible.

## Servicios estándar propuestos para la primera comprobación

| UUID corto | UUID completo | Nombre estándar | Presencia en esta unidad |
| --- | --- | --- | --- |
| `180A` | `0000180a-0000-1000-8000-00805f9b34fb` | Device Information | Sin comprobar |
| `180F` | `0000180f-0000-1000-8000-00805f9b34fb` | Battery | Sin comprobar |

Fuente de los nombres y asignaciones: [Bluetooth SIG, Assigned Numbers](https://www.bluetooth.com/wp-content/uploads/Files/Specification/HTML/Assigned_Numbers/out/en/index-en.html). No son UUID propietarios descubiertos ni una garantía de compatibilidad.

Primera prueba real, 2026-10-11: con ambos UUID solicitados, el informe del usuario muestra conexión activa pero ningún servicio accesible y un descubrimiento fallido. Su presencia sigue sin confirmarse; este resultado no demuestra que el patinete carezca de otros servicios. Véase `pruebas.md`.

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
