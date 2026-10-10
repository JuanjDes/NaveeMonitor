import { normalizeUuid, validateServiceUuids } from "./services.js";
import { formatPacket } from "../utils/hex.js";

export const GATT_LIMITS = Object.freeze({ services: 32, characteristicsPerService: 64 });
export const PROPERTY_NAMES = Object.freeze([
  "read", "write", "writeWithoutResponse", "notify", "indicate",
  "broadcast", "authenticatedSignedWrites", "reliableWrite", "writableAuxiliaries",
]);

function describeError(error) {
  switch (error?.name) {
    case "SecurityError":
    case "NotAllowedError":
      return "Acceso no permitido. Revisa los UUID solicitados y los permisos; el navegador también puede bloquear este atributo.";
    case "NotFoundError":
      return "No se encontraron atributos accesibles. No permite concluir que el patinete carezca de ellos.";
    case "NetworkError":
      return "La operación GATT falló. Comprueba la conexión; el dispositivo puede requerir autenticación.";
    case "NotSupportedError":
      return "Esta operación no está soportada por el dispositivo o el navegador.";
    case "TypeError":
    case "RangeError":
      return "El dispositivo devolvió datos con un formato o tamaño no admitido.";
    default:
      return "No se pudo completar la operación GATT. Puedes reintentar o desconectar y volver a conectar.";
  }
}

export class GattExplorer extends EventTarget {
  #server = null;
  #generation = 0;
  #characteristics = new Map();
  #snapshot = {
    connected: false, busy: false, stale: false, attempted: false,
    message: "Conecta el patinete para explorar sus servicios autorizados.",
    requestedServiceUuids: [], discoveredAt: null, services: [], incomplete: false,
  };

  get snapshot() { return structuredClone(this.#snapshot); }

  #update(changes) {
    Object.assign(this.#snapshot, changes);
    this.dispatchEvent(new Event("change"));
  }

  setServer(server, requestedServiceUuids = []) {
    if (server === this.#server) return;
    const requested = validateServiceUuids(requestedServiceUuids);
    this.#generation++;
    this.#server = server;
    this.#characteristics.clear();
    if (!server) {
      this.#update({ connected: false, busy: false, stale: this.#snapshot.attempted,
        message: "Desconectado. El informe anterior se conserva para exportarlo; las lecturas están deshabilitadas." });
      return;
    }
    this.#update({ connected: true, busy: false, stale: false, attempted: false,
      message: "Pulsa Explorar servicios. Solo se mostrarán los servicios accesibles con los permisos del navegador.",
      requestedServiceUuids: requested, services: [], discoveredAt: null, incomplete: false });
  }

  #isCurrent(generation) {
    return generation === this.#generation && this.#server?.connected === true;
  }

  #finish(generation) {
    if (generation !== this.#generation) return;
    if (!this.#server?.connected) this.setServer(null);
    else this.#update({ busy: false });
  }

  async discover() {
    if (!this.#server?.connected || this.#snapshot.busy) return;
    const generation = this.#generation;
    this.#characteristics.clear();
    this.#update({ busy: true, attempted: true, services: [], discoveredAt: null, incomplete: false,
      message: "Explorando servicios y características… Si la operación no termina, puedes desconectar." });
    try {
      const services = await this.#server.getPrimaryServices();
      if (!this.#isCurrent(generation)) return;
      if (!Array.isArray(services)) throw new TypeError("Invalid services");
      const rows = [];
      let incomplete = services.length > GATT_LIMITS.services;
      for (const [serviceIndex, service] of services.slice(0, GATT_LIMITS.services).entries()) {
        if (!this.#isCurrent(generation)) return;
        const row = { key: `s${serviceIndex}`, uuid: normalizeUuid(service.uuid),
          primary: service.isPrimary === true, characteristics: [], error: null };
        rows.push(row);
        try {
          // GATT operations are sequential across the entire device.
          const characteristics = await service.getCharacteristics();
          if (!this.#isCurrent(generation)) return;
          if (!Array.isArray(characteristics)) throw new TypeError("Invalid characteristics");
          if (characteristics.length > GATT_LIMITS.characteristicsPerService) incomplete = true;
          for (const [index, characteristic] of characteristics.slice(0, GATT_LIMITS.characteristicsPerService).entries()) {
            const key = `${row.key}/c${index}`;
            const properties = Object.fromEntries(PROPERTY_NAMES.map((name) => [name, characteristic.properties?.[name] === true]));
            const item = { key, uuid: normalizeUuid(characteristic.uuid), properties, value: null, error: null };
            row.characteristics.push(item);
            this.#characteristics.set(key, { characteristic, item });
          }
        } catch (error) {
          if (!this.#isCurrent(generation)) return;
          incomplete = true;
          row.error = describeError(error);
        }
      }
      if (!this.#isCurrent(generation)) return;
      this.#update({ services: rows, incomplete, discoveredAt: new Date().toISOString(),
        message: rows.length === 0
          ? "No hay servicios accesibles con los permisos actuales. Necesitamos identificar los UUID del patinete; esto no significa que no tenga servicios."
          : `${rows.length} servicio(s) accesible(s). ${incomplete ? "Informe parcial: hubo errores o se alcanzó un límite de tamaño." : "Puedes leer las características que indiquen read."}` });
    } catch (error) {
      if (!this.#isCurrent(generation)) return;
      this.#characteristics.clear();
      this.#update({ incomplete: true, message: describeError(error) });
    } finally {
      this.#finish(generation);
    }
  }

  async read(key) {
    if (!this.#server?.connected || this.#snapshot.busy) return;
    const entry = this.#characteristics.get(key);
    if (!entry || entry.characteristic.properties?.read !== true) {
      this.#update({ message: "Esta característica no está disponible para lectura." });
      return;
    }
    const generation = this.#generation;
    entry.item.error = null;
    // Clear a previous value so a failed retry cannot look like a fresh read.
    entry.item.value = null;
    this.#update({ busy: true, message: "Leyendo característica… Si la operación no termina, puedes desconectar." });
    try {
      const value = await entry.characteristic.readValue();
      if (!this.#isCurrent(generation)) return;
      entry.item.value = { timestamp: new Date().toISOString(), ...formatPacket(value) };
      this.#update({ message: "Lectura recibida. Se muestran bytes sin interpretar el protocolo NAVEE." });
    } catch (error) {
      if (!this.#isCurrent(generation)) return;
      entry.item.error = describeError(error);
      this.#update({ message: "La lectura ha fallado. Consulta el detalle de la característica." });
    } finally {
      this.#finish(generation);
    }
  }

  createReport() {
    return {
      format: "navee-monitor-gatt", version: 1, exportedAt: new Date().toISOString(),
      scope: "Servicios primarios accesibles al navegador; no es un mapa GATT completo. Bytes sin interpretar. Solo se conserva la última lectura de cada característica.",
      ...this.snapshot,
    };
  }
}
