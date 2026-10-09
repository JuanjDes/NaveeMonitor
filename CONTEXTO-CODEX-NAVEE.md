# CONTEXTO CODEX — NAVEE NT5 Max Monitor

## 1. Objetivo del proyecto

Desarrollar una aplicación para interactuar por Bluetooth Low Energy (BLE) con un patinete eléctrico NAVEE NT5 Max.

La primera fase del proyecto debe centrarse exclusivamente en la lectura, diagnóstico y monitorización de datos expuestos por el patinete, evitando inicialmente cualquier modificación de parámetros críticos, firmware o controlador.

Objetivos principales:

- Detectar el NAVEE NT5 Max por Bluetooth.
- Conectarse mediante BLE/GATT.
- Enumerar servicios y características disponibles.
- Leer información del patinete cuando sea posible.
- Registrar datos y tramas BLE para facilitar ingeniería inversa.
- Construir una interfaz de monitorización clara y usable desde móvil.
- Documentar el protocolo y los identificadores descubiertos.

Nombre provisional del proyecto:

**NAVEE Monitor**

---

## 2. Dispositivo objetivo

Modelo principal:

- NAVEE NT5 Max
- Versión europea / española
- Velocidad homologada: 25 km/h
- Conectividad Bluetooth Low Energy
- Uso principal de la aplicación desde un teléfono Android

La aplicación debe diseñarse inicialmente pensando en este modelo concreto, aunque la arquitectura debería permitir soportar otros modelos NAVEE en el futuro.

---

## 3. Datos que interesa obtener

Intentar descubrir y mostrar, siempre que el patinete los exponga por BLE:

### Identificación

- Modelo
- Número de serie
- PID / identificador de producto
- SKU
- Región
- Versión de hardware

### Firmware

- Firmware del dashboard
- Firmware del ESC/controlador
- Firmware del BMS
- Versiones adicionales disponibles

### Batería

- Porcentaje de batería
- Voltaje
- Corriente
- Potencia instantánea
- Temperatura
- Estado de carga
- Capacidad estimada
- Datos del BMS
- Posibles códigos de error

### Telemetría

- Velocidad
- Distancia del trayecto
- Odómetro total
- Modo de conducción
- Potencia demandada
- Estado del acelerador
- Estado de frenos
- Estado del motor
- Temperaturas disponibles

### Estado del vehículo

- Luces
- Intermitentes si existen
- Bloqueo
- TCS
- Estado de conexión
- RSSI Bluetooth
- Alarmas
- Errores
- Otros flags de estado

---

## 4. Cruise Control

El NAVEE NT5 Max dispone de soporte de Cruise Control en determinadas versiones/regiones.

En la unidad europea/española que se va a utilizar para este proyecto, la aplicación oficial NAVEE no muestra actualmente la opción de Cruise Control.

Hipótesis a investigar:

- La funcionalidad puede existir en firmware pero estar deshabilitada por región.
- Puede existir un parámetro BLE relacionado con Cruise Control.
- Puede depender del SKU, región o versión de firmware.
- La app debe intentar detectar capacidades y parámetros relacionados, pero inicialmente solo en modo lectura.

No asumir que el Cruise Control puede activarse hasta confirmar exactamente el comportamiento del dispositivo.

---

## 5. Limitación de velocidad

La unidad europea está limitada a 25 km/h.

Se investigará únicamente desde el punto de vista técnico y diagnóstico qué parámetros están relacionados con:

- Región
- SKU
- Modos
- Límites de velocidad
- Capacidades del controlador
- Configuración almacenada en firmware

No asumir que cambiar un valor BLE elimina el límite real.

Puede existir un límite adicional implementado directamente en:

- ESC
- Firmware
- Controlador BLDC
- Perfil regional

### Regla importante

La primera versión de la aplicación NO debe:

- Flashear firmware.
- Modificar el ESC.
- Cambiar parámetros de seguridad.
- Eliminar límites de velocidad.
- Enviar comandos no documentados sin confirmación explícita.
- Realizar escrituras BLE peligrosas automáticamente.

Cualquier investigación futura sobre modificación de parámetros debe estar claramente separada del modo normal de diagnóstico.

---

## 6. Cable blanco / limitación física

Existe información comunitaria que indica que algunos NAVEE pueden disponer de un cable relacionado con la limitación de velocidad.

En el NT5 Max se investigará si existe realmente este comportamiento.

Antes de hacer cualquier modificación física hay que determinar:

- Qué función tiene realmente ese cable.
- A qué módulo llega.
- Si funciona simplemente por continuidad abierto/cerrado.
- Qué tensión tiene.
- Qué tensión presenta respecto a masa.
- Si transporta una señal digital.
- Si forma parte de una comunicación.
- Qué sucede durante el arranque.

No conectar relés, módulos Bluetooth, microcontroladores ni otros circuitos sin conocer previamente las características eléctricas.

Si en algún momento se estudia un módulo externo para pruebas en recinto privado, deberá ser:

- Reversible.
- Aislado.
- Fail-safe.
- Por defecto en configuración original.
- Seguro ante pérdida de alimentación o comunicación.
- Independiente del funcionamiento normal del controlador.

---

## 7. Arquitectura inicial recomendada

Primera opción:

### PWA + Web Bluetooth

Tecnologías:

- HTML5
- CSS
- JavaScript moderno
- Web Bluetooth API
- Web Storage o IndexedDB
- PWA

Entorno objetivo:

- Chrome / Chromium en Android

Arquitectura conceptual:

```text
NAVEE NT5 Max
      |
      | Bluetooth Low Energy
      v
Web Bluetooth API
      |
      v
Capa BLE
      |
      +-- escaneo
      +-- conexión
      +-- servicios GATT
      +-- características
      +-- notifications
      +-- lectura de datos
      |
      v
Parser protocolo NAVEE
      |
      v
Modelo de datos
      |
      v
Interfaz NAVEE Monitor
```

Alternativa futura:

### Android nativo

- Kotlin
- Android BLE APIs
- GATT
- Foreground Service si se necesita telemetría continua

La opción Android nativa puede considerarse si Web Bluetooth limita funciones necesarias.

---

## 8. Primera misión técnica

Crear una herramienta BLE de diagnóstico capaz de:

1. Solicitar conexión Bluetooth desde el navegador.
2. Encontrar el patinete.
3. Conectarse al servidor GATT.
4. Enumerar servicios.
5. Enumerar características.
6. Mostrar UUID.
7. Mostrar propiedades:
   - read
   - write
   - writeWithoutResponse
   - notify
   - indicate
8. Leer características que permitan lectura.
9. Suscribirse a notifications cuando sea posible.
10. Mostrar datos en:
   - hexadecimal
   - decimal
   - ASCII cuando tenga sentido
11. Registrar timestamp.
12. Poder copiar/exportar el log.

Ejemplo de log:

```text
[14:32:18.521]

SERVICE
UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

CHARACTERISTIC
UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Properties:
  Read: true
  Write: false
  Notify: true

DATA
HEX:
55 AA 03 14 8F ...

DEC:
85 170 3 20 143 ...

ASCII:
U....
```

---

## 9. Seguridad de la aplicación

Aplicar desde el principio:

- No usar `eval()`.
- No insertar datos BLE directamente mediante `innerHTML`.
- Escapar cualquier dato mostrado.
- Preferir `textContent`.
- Validar tamaños de paquetes.
- Validar índices antes de acceder a buffers.
- Controlar errores de `DataView`.
- Controlar desconexiones.
- No guardar secretos o claves sensibles en localStorage.
- No registrar información sensible innecesaria.
- No enviar telemetría a servidores externos por defecto.
- Toda comunicación debe permanecer local salvo que el usuario active explícitamente alguna sincronización futura.

---

## 10. Estructura inicial del proyecto

Propuesta:

```text
navee-monitor/
|
|-- index.html
|-- manifest.json
|-- service-worker.js
|
|-- css/
|   `-- styles.css
|
|-- js/
|   |-- app.js
|   |
|   |-- ble/
|   |   |-- scanner.js
|   |   |-- connection.js
|   |   |-- gatt.js
|   |   `-- logger.js
|   |
|   |-- navee/
|   |   |-- protocol.js
|   |   |-- parser.js
|   |   |-- constants.js
|   |   `-- device.js
|   |
|   |-- ui/
|   |   |-- dashboard.js
|   |   `-- log-viewer.js
|   |
|   `-- utils/
|       |-- hex.js
|       `-- security.js
|
|-- docs/
|   |-- protocolo-navee.md
|   |-- servicios-gatt.md
|   |-- pruebas.md
|   `-- decisiones.md
|
`-- CONTEXTO-CODEX-NAVEE.md
```

No es obligatorio crear toda la estructura desde el primer commit. Mantener el proyecto sencillo mientras sea posible.

---

## 11. Fases del proyecto

### Fase 1 — Detector BLE

Objetivo:

Conectar con el NT5 Max y descubrir servicios/características.

Sin interpretar todavía el protocolo.

### Fase 2 — Logger

Registrar todas las tramas y notifications BLE.

Funciones:

- timestamp
- UUID
- HEX
- DEC
- exportación

### Fase 3 — Identificación del protocolo

Relacionar cambios físicos del patinete con tramas BLE.

Ejemplos:

- encender/apagar luz
- cambiar modo
- acelerar con rueda levantada solo cuando sea seguro
- conectar cargador
- bloquear/desbloquear desde app oficial

Documentar diferencias.

### Fase 4 — Parser NAVEE

Convertir tramas:

```text
55 AA 03 14...
```

en datos:

```text
Battery: 82 %
Voltage: 51.4 V
Mode: Drive
Speed: 0 km/h
```

### Fase 5 — Dashboard

Crear interfaz visual con:

- batería
- velocidad
- kilometraje
- firmware
- estado Bluetooth
- errores
- temperaturas

### Fase 6 — Históricos

Guardar trayectos:

- batería inicial
- batería final
- distancia
- duración
- velocidad media
- consumo estimado
- Wh/km
- autonomía real

### Fase 7 — Funciones experimentales

Solo después de conocer bien el protocolo.

Investigar capacidades ocultas:

- Cruise Control
- parámetros regionales
- límites
- configuraciones
- diagnósticos avanzados

Separar completamente estas funciones del modo normal de monitorización.

---

## 12. Posible interfaz

```text
+----------------------------------+
|         NAVEE MONITOR            |
+----------------------------------+
| NT5 Max                 CONNECTED|
|                                  |
| Battery                    82 %   |
| Voltage                  51.4 V   |
| Temperature                27 C   |
|                                  |
| Speed                    0 km/h   |
| Odometer                  428 km  |
| Mode                       Drive  |
|                                  |
| Serial                XXXXXXXX    |
| Region                       EU   |
| Firmware                  X.X.X   |
|                                  |
| Bluetooth RSSI            -58 dBm |
+----------------------------------+
```

Incluir posteriormente una pantalla avanzada:

```text
Dashboard
Diagnostics
BLE Explorer
Raw Frames
Device Info
Trips
Settings
```

---

## 13. Investigación del protocolo

Crear documentación conforme se descubran UUID y comandos.

Ejemplo:

```text
Servicio:
UUID: ...

Característica:
UUID: ...

Dirección:
Scooter -> App

Payload:
55 AA ...

Hipótesis:
estado batería

Confirmado:
NO

Pruebas:
- batería 82 % -> byte 5 = 0x52
- batería 81 % -> byte 5 = 0x51

Conclusión:
probablemente porcentaje de batería
```

No considerar un campo confirmado hasta reproducirlo varias veces.

---

## 14. Autenticación

Es posible que NAVEE utilice un proceso de autenticación antes de permitir determinadas operaciones BLE.

La aplicación debe diseñarse para soportar eventualmente:

```text
connect
   |
discover
   |
authentication
   |
subscribe
   |
telemetry
```

No implementar algoritmos criptográficos improvisados.

Si se identifica autenticación:

- documentar primero el handshake;
- identificar entradas y salidas;
- comprobar implementaciones existentes;
- utilizar Web Crypto API cuando corresponda.

---

## 15. Registro de descubrimientos

Mantener:

`docs/protocolo-navee.md`

para el protocolo confirmado.

Mantener:

`docs/pruebas.md`

para experimentos.

Mantener:

`docs/decisiones.md`

para decisiones de arquitectura.

Ejemplo:

```markdown
## 2026-10-09

### Decisión

Empezar con Web Bluetooth.

### Motivo

Permite probar rápidamente desde Chrome Android sin compilar APK.

### Resultado

Pendiente.
```

---

## 16. Git

Trabajar mediante ramas.

Ejemplo:

```bash
git switch -c feature/ble-scanner
```

Commits pequeños:

```text
feat: add BLE device selector

feat: enumerate GATT services

feat: add characteristic logger

docs: document discovered NAVEE services
```

No mezclar ingeniería inversa, UI y grandes refactorizaciones en un mismo commit.

---

# Instrucciones para Codex

Codex debe tratar este archivo como contexto general del proyecto.

## Reglas

1. No modificar archivos sin entender primero la estructura existente.

2. Antes de hacer cambios importantes, revisar:
   - README.md
   - este archivo
   - docs/decisiones.md si existe.

3. Mantener las soluciones simples.

4. No añadir dependencias npm innecesarias.

5. Priorizar APIs nativas del navegador.

6. Escribir JavaScript modular.

7. Aplicar buenas prácticas de seguridad web.

8. Nunca utilizar datos BLE sin validar tamaño y formato.

9. No implementar escritura sobre parámetros críticos del patinete salvo petición explícita.

10. No implementar modificaciones de:
    - velocidad máxima
    - firmware
    - ESC
    - BMS
    - parámetros de seguridad
    sin separar claramente esas funciones del modo de diagnóstico.

11. El primer objetivo es observar y comprender el protocolo.

12. Cuando se descubra un UUID o estructura BLE:
    - documentarlo;
    - indicar si está confirmado o es una hipótesis.

13. Evitar constantes mágicas.

Ejemplo:

```javascript
const NAVEE_SERVICE_UUID = "...";
```

en vez de repetir UUID directamente por el código.

14. Todas las operaciones BLE deben estar protegidas con manejo de errores.

15. Gestionar correctamente:
    - pérdida de conexión;
    - dispositivo fuera de alcance;
    - cancelación del selector Bluetooth;
    - characteristics no disponibles;
    - navegadores sin Web Bluetooth.

16. La interfaz debe funcionar especialmente bien en móvil.

17. No asumir que todos los NT5 Max tienen el mismo firmware.

18. Identificar siempre:
    - modelo
    - firmware
    - región
    antes de interpretar capacidades específicas.

---

## Prioridad inmediata para Codex

Crear la primera versión del **BLE Explorer**.

Debe permitir:

1. Pulsar `Conectar`.
2. Abrir selector Bluetooth.
3. Elegir el NAVEE NT5 Max.
4. Mostrar:
   - nombre
   - ID cuando esté disponible
   - estado de conexión
5. Conectarse vía GATT.
6. Enumerar servicios.
7. Enumerar características.
8. Mostrar UUID y propiedades.
9. Leer características compatibles.
10. Suscribirse a notifications compatibles.
11. Registrar datos en hexadecimal.
12. Permitir copiar/exportar el registro.

Todavía NO intentar interpretar ni modificar parámetros del patinete.

El objetivo de esta primera versión es obtener un mapa completo de la interfaz BLE real del NAVEE NT5 Max utilizado en las pruebas.
