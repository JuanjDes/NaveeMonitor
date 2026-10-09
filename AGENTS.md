# AGENTS.md

## Propósito

Este archivo define las reglas que debe seguir Codex al trabajar en este repositorio.

El objetivo del proyecto es desarrollar una aplicación segura, mantenible y modular para monitorizar por Bluetooth Low Energy (BLE) un NAVEE NT5 Max.

La prioridad inicial es **observar, leer, registrar y comprender** el protocolo del patinete antes de implementar cualquier operación de escritura o modificación.

---

## 1. Reglas generales

Antes de modificar código:

1. Lee este archivo completo.
2. Revisa `README.md`.
3. Revisa `CONTEXTO-CODEX-NAVEE.md`.
4. Revisa `docs/decisiones.md` si existe.
5. Inspecciona la estructura actual del proyecto.
6. Identifica qué archivos son realmente necesarios para la tarea.
7. Evita cambios no relacionados.

No reescribas archivos completos si basta con una modificación pequeña.

No hagas refactorizaciones grandes junto con nuevas funcionalidades salvo que sean imprescindibles.

---

## 2. Filosofía de trabajo

Prioriza siempre:

- seguridad;
- simplicidad;
- claridad;
- modularidad;
- mantenibilidad;
- facilidad de depuración;
- cambios pequeños y verificables.

Ante una duda técnica:

> Primero observar, después interpretar y solo después modificar.

Nunca enviar comandos al patinete simplemente para “ver qué pasa”.

---

## 3. Antes de cambios importantes

Si una tarea afecta a varias partes del proyecto, indica primero:

- qué archivos se van a modificar;
- por qué;
- qué comportamiento se espera cambiar;
- qué riesgos existen.

Evita el efecto “excavadora”: no modificar media aplicación para resolver un problema local.

---

## 4. Seguridad por defecto

Todo dato externo debe considerarse potencialmente inválido.

Validar siempre:

- tipos;
- longitudes;
- rangos;
- formatos;
- estados;
- estructuras;
- índices de buffers.

Nunca confiar directamente en:

- datos BLE;
- datos del usuario;
- localStorage;
- IndexedDB;
- parámetros URL;
- archivos importados;
- respuestas de red.

---

## 5. Seguridad DOM

No insertar datos externos mediante:

```javascript
element.innerHTML = externalData;
```

Preferir:

```javascript
element.textContent = externalData;
```

No utilizar:

- `eval()`;
- `new Function()`;
- ejecución dinámica de código;
- interpolación insegura de HTML.

Si fuera imprescindible renderizar HTML dinámico, sanitizarlo correctamente.

---

## 6. Bluetooth Low Energy

La aplicación debe asumir que:

- un servicio puede no existir;
- una característica puede no existir;
- una característica puede cambiar entre firmware;
- una operación puede fallar;
- el dispositivo puede desconectarse en cualquier momento.

Antes de usar una característica comprobar:

- existencia;
- propiedades;
- soporte de `read`;
- soporte de `write`;
- soporte de `writeWithoutResponse`;
- soporte de `notify`;
- soporte de `indicate`.

Nunca asumir compatibilidad por modelo solamente.

---

## 7. Buffers y paquetes BLE

Antes de leer un `ArrayBuffer`, `Uint8Array` o `DataView`:

- comprobar tamaño mínimo;
- comprobar offsets;
- validar índices;
- validar campos esperados.

Ejemplo:

```javascript
if (dataView.byteLength < 4) {
  throw new Error("Paquete BLE demasiado corto");
}
```

Nunca acceder fuera de rango.

Los parsers deben fallar de forma controlada ante paquetes malformados.

---

## 8. Escrituras BLE

Por defecto, la aplicación debe trabajar en **modo solo lectura**.

Separar claramente:

- diagnóstico;
- lectura;
- logging;
- experimentación;
- escritura/configuración.

Nunca enviar escrituras automáticamente durante:

- carga de página;
- conexión inicial;
- reconexión;
- recuperación de errores.

Cualquier escritura debe requerir una acción explícita del usuario.

---

## 9. Parámetros críticos

No modificar automáticamente:

- velocidad máxima;
- región;
- ESC;
- BMS;
- firmware;
- frenado;
- potencia;
- control del motor;
- parámetros térmicos;
- límites de seguridad.

No flashear firmware sin una tarea explícita y separada.

No implementar comandos destructivos o irreversibles por defecto.

---

## 10. Funciones experimentales

Las funciones experimentales deben estar completamente separadas del funcionamiento normal.

Si existen en el futuro:

- etiquetarlas claramente;
- añadir confirmación explícita;
- documentar riesgos;
- no ejecutarlas automáticamente;
- permitir volver al estado anterior cuando sea posible.

El dashboard normal no debe mezclar controles experimentales con acciones cotidianas.

---

## 11. Cableado y hardware

No asumir la función de ningún cable, pin o señal.

No recomendar conectar directamente:

- relés;
- microcontroladores;
- módulos Bluetooth;
- GPIO;
- fuentes externas;

sin conocer previamente:

- tensión;
- corriente;
- referencia a masa;
- tipo de señal;
- dirección;
- comportamiento durante arranque.

La investigación física debe ser reversible y segura.

---

## 12. Arquitectura

Separar responsabilidades.

Arquitectura deseada:

```text
UI
↓
Servicios de aplicación
↓
Capa BLE
↓
Parser / protocolo NAVEE
↓
Datos
```

Evitar mezclar en el mismo módulo:

- DOM;
- BLE;
- parsing;
- almacenamiento;
- lógica de negocio.

---

## 13. Organización recomendada

Ejemplo:

```text
js/
├── app.js
├── ble/
│   ├── scanner.js
│   ├── connection.js
│   ├── gatt.js
│   └── logger.js
├── navee/
│   ├── protocol.js
│   ├── parser.js
│   ├── constants.js
│   └── device.js
├── ui/
│   ├── dashboard.js
│   └── log-viewer.js
└── utils/
    ├── hex.js
    └── validation.js
```

No crear módulos innecesarios.

---

## 14. Funciones

Preferir funciones pequeñas y con una sola responsabilidad.

Buenos nombres:

```javascript
connectToScooter()
listGattServices()
subscribeToNotifications()
parseBatteryStatus()
formatHexFrame()
validatePacket()
```

Evitar nombres vagos:

```javascript
doStuff()
processData()
handleThing()
```

---

## 15. Constantes

No utilizar valores mágicos.

Evitar:

```javascript
if (packet[3] === 42) {
```

Preferir:

```javascript
const PACKET_TYPE_BATTERY = 42;

if (packet[3] === PACKET_TYPE_BATTERY) {
```

Centralizar:

- UUID;
- comandos;
- códigos de error;
- tamaños mínimos;
- timeouts;
- límites de logs;
- estados.

---

## 16. Estados

Mantener estados explícitos.

Ejemplo:

```text
DISCONNECTED
CONNECTING
CONNECTED
AUTHENTICATING
READY
ERROR
```

La interfaz debe reflejar el estado real.

Evitar booleanos ambiguos cuando un estado enumerado sea más claro.

---

## 17. Async / Await

Preferir `async/await`.

Manejar correctamente errores asíncronos.

No iniciar varias operaciones GATT concurrentes sobre la misma característica sin comprobar compatibilidad.

No dejar promesas sin manejar.

---

## 18. Gestión de errores

Toda operación susceptible de fallar debe tener manejo de errores.

Especialmente:

- selector Bluetooth;
- conexión;
- descubrimiento GATT;
- lecturas;
- subscriptions;
- IndexedDB;
- JSON;
- permisos;
- almacenamiento;
- exportación de logs.

Los errores deben:

- ser comprensibles;
- incluir contexto útil;
- no revelar secretos;
- permitir recuperación cuando sea posible.

---

## 19. Reconexión

No crear bucles infinitos de reconexión.

Si se implementa reconexión automática:

- limitar intentos;
- permitir cancelación;
- usar espera progresiva;
- evitar reconexiones simultáneas.

Ejemplo conceptual:

```text
1 s
2 s
5 s
10 s
```

---

## 20. Compatibilidad

Comprobar siempre la existencia de APIs.

Ejemplo:

```javascript
if (!navigator.bluetooth) {
  throw new Error("Web Bluetooth no está disponible en este navegador");
}
```

Mostrar mensajes claros cuando una función no esté soportada.

No asumir que todos los navegadores Chromium se comportan exactamente igual.

---

## 21. Dependencias

Preferir APIs nativas.

Antes de añadir una dependencia:

1. justificar su necesidad;
2. comprobar mantenimiento;
3. revisar tamaño;
4. revisar dependencias indirectas;
5. evitar paquetes abandonados.

No añadir librerías para resolver problemas triviales.

---

## 22. Secretos

Nunca incluir en el repositorio:

- claves API;
- tokens;
- contraseñas;
- claves privadas;
- credenciales;
- identificadores sensibles innecesarios.

No guardar secretos en:

- JavaScript cliente;
- localStorage;
- IndexedDB;
- archivos públicos.

Usar variables de entorno cuando corresponda.

---

## 23. Almacenamiento

Los datos recuperados de almacenamiento local deben validarse.

Ejemplo:

```javascript
try {
  const raw = localStorage.getItem("settings");
  const data = raw ? JSON.parse(raw) : null;

  if (data !== null && typeof data !== "object") {
    throw new Error("Configuración inválida");
  }
} catch (error) {
  console.error("No se pudo cargar la configuración", error);
}
```

No asumir que lo almacenado anteriormente sigue siendo válido.

---

## 24. Privacidad

La aplicación debe ser local por defecto.

No enviar telemetría, logs o datos del patinete a servicios externos sin consentimiento explícito.

No añadir analítica innecesaria.

---

## 25. Logging

Crear un logger reutilizable.

Separar:

- info;
- warning;
- error;
- raw BLE.

Evitar cientos de `console.log()` dispersos.

Los logs BLE deben tener límites para evitar crecimiento ilimitado.

---

## 26. Documentación del protocolo

Cada descubrimiento BLE debe documentarse.

Registrar como mínimo:

- UUID;
- dirección de datos;
- ejemplo de payload;
- interpretación;
- nivel de confianza;
- pruebas realizadas.

Distinguir siempre entre:

- hipótesis;
- probable;
- confirmado.

No marcar un campo como confirmado por una sola observación.

---

## 27. Pruebas

Los parsers deben poder probarse sin tener el patinete conectado.

Usar paquetes simulados.

Ejemplo:

```javascript
const frame = new Uint8Array([
  0x55,
  0xaa,
  0x03,
  0x14
]);
```

Crear pruebas especialmente para:

- parsers;
- validación;
- conversiones HEX;
- checksums;
- longitudes;
- errores;
- almacenamiento.

---

## 28. Rendimiento

No optimizar prematuramente.

Pero evitar:

- listeners duplicados;
- subscriptions duplicadas;
- timers innecesarios;
- renderizados continuos;
- logs sin límite;
- arrays que crecen indefinidamente.

---

## 29. PWA

Si se utiliza Service Worker:

- versionar caché;
- controlar actualizaciones;
- evitar servir JavaScript obsoleto indefinidamente;
- limpiar cachés antiguas;
- evitar cachear datos sensibles.

---

## 30. Git

Trabajar con cambios pequeños.

Commits recomendados:

```text
feat: add BLE device selector
feat: enumerate GATT services
feat: subscribe to notifications
fix: handle GATT disconnect
test: add parser validation cases
docs: document discovered NAVEE service
```

No mezclar cambios no relacionados en el mismo commit.

---

## 31. Refactorización

Refactorizar solo cuando aporte valor claro.

Razones válidas:

- eliminar duplicación;
- mejorar seguridad;
- simplificar flujo;
- facilitar pruebas;
- reducir deuda técnica real.

No refactorizar solo por estética.

---

## 32. Prioridad actual

Orden de trabajo:

1. conexión BLE;
2. BLE Explorer;
3. enumeración de servicios;
4. enumeración de características;
5. logger;
6. notifications;
7. documentación de UUID;
8. parser;
9. dashboard;
10. históricos;
11. funciones avanzadas;
12. funciones experimentales.

No saltar directamente a modificar el comportamiento del patinete.

---

## 33. Regla final

Si existe una solución sencilla, segura y mantenible, elegirla antes que una solución compleja.

Si algo no está confirmado:

- no inventarlo;
- no asumirlo;
- documentar la incertidumbre;
- diseñar una prueba segura para comprobarlo.
