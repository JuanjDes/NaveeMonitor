import { validateServiceUuids } from "./services.js";

export const STATES = Object.freeze({
  DISCONNECTED: "DISCONNECTED",
  SELECTING: "SELECTING",
  CONNECTING: "CONNECTING",
  CONNECTED: "CONNECTED",
  ERROR: "ERROR",
  UNAVAILABLE: "UNAVAILABLE",
});

const MAX_DEVICE_TEXT_LENGTH = 256;

function deviceText(value, fallback) {
  if (typeof value !== "string") return fallback;
  const text = value.replace(/[\u0000-\u001f\u007f-\u009f]/g, "").trim();
  return text ? text.slice(0, MAX_DEVICE_TEXT_LENGTH) : fallback;
}

function connectionError(error) {
  switch (error?.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "El navegador no ha permitido el acceso Bluetooth. Revisa los permisos y abre la página directamente en Chrome mediante HTTPS o localhost.";
    case "NetworkError":
      return "No se pudo mantener la conexión. Acerca el patinete, comprueba el Bluetooth y desconecta la app oficial antes de reintentar.";
    case "NotSupportedError":
      return "El dispositivo o el navegador no permite esta conexión GATT.";
    default:
      return "No se pudo conectar al dispositivo. Comprueba que está encendido y disponible e inténtalo de nuevo.";
  }
}

export function getCompatibility(bluetooth, secureContext) {
  if (!secureContext) return "Bluetooth requiere una página segura. Abre esta aplicación mediante HTTPS o localhost.";
  if (typeof bluetooth?.requestDevice !== "function") return "Web Bluetooth no está disponible. Prueba con Chrome en Android o un navegador compatible.";
  return null;
}

// Connection lifecycle only; service discovery belongs to GattExplorer.
export class BleConnection extends EventTarget {
  #bluetooth;
  #session = null;
  #snapshot;

  constructor({ bluetooth, secureContext }) {
    super();
    this.#bluetooth = bluetooth;
    const unavailable = getCompatibility(bluetooth, secureContext);
    this.#snapshot = {
      state: unavailable ? STATES.UNAVAILABLE : STATES.DISCONNECTED,
      message: unavailable ?? "Todo listo. Pulsa Conectar y selecciona tu patinete.",
      name: "Sin seleccionar",
      id: "No disponible",
      requestedServiceUuids: [],
    };
  }

  get snapshot() { return { ...this.#snapshot, requestedServiceUuids: [...this.#snapshot.requestedServiceUuids] }; }

  get server() {
    return this.#snapshot.state === STATES.CONNECTED && this.#session?.device.gatt.connected
      ? this.#session.device.gatt : null;
  }

  #update(state, message, details = {}) {
    this.#snapshot = { ...this.#snapshot, ...details, state, message };
    this.dispatchEvent(new Event("change"));
  }

  #release(session) {
    if (session?.device && session.onDisconnect) {
      session.device.removeEventListener("gattserverdisconnected", session.onDisconnect);
    }
    if (this.#session === session) this.#session = null;
  }

  async connect(optionalServices = []) {
    if (![STATES.DISCONNECTED, STATES.ERROR].includes(this.#snapshot.state)) return;
    let requestedServiceUuids;
    try {
      requestedServiceUuids = validateServiceUuids(optionalServices);
    } catch {
      this.#update(STATES.ERROR, "La lista de servicios no es válida. Revisa los UUID antes de conectar.");
      return;
    }
    const session = { device: null, onDisconnect: null };
    this.#session = session;
    this.#update(STATES.SELECTING, "Selecciona tu patinete en el selector del navegador. Puedes cancelar desde ese selector.", {
      name: "Sin seleccionar", id: "No disponible", requestedServiceUuids,
    });
    try {
      // Keep requestDevice before the first await to preserve the click's user activation.
      // The advertised name and proprietary service UUIDs are not yet known.
      const options = { acceptAllDevices: true };
      if (requestedServiceUuids.length) options.optionalServices = requestedServiceUuids;
      const device = await this.#bluetooth.requestDevice(options);
      if (this.#session !== session) return;
      if (!device?.gatt || typeof device.gatt.connect !== "function") {
        throw new DOMException("GATT unavailable", "NotSupportedError");
      }
      session.device = device;
      session.onDisconnect = () => {
        if (this.#session !== session) return;
        this.#release(session);
        this.#update(STATES.DISCONNECTED, "Se ha perdido la conexión con el dispositivo. Pulsa Conectar para volver a intentarlo.");
      };
      device.addEventListener("gattserverdisconnected", session.onDisconnect);
      this.#update(STATES.CONNECTING, "Conectando al dispositivo… Puedes cancelar si tarda demasiado.", {
        name: deviceText(device.name, "Sin nombre"),
        id: deviceText(device.id, "No disponible"),
      });
      await device.gatt.connect();
      if (this.#session !== session) {
        // A cancelled attempt must never become the visible active connection.
        // Avoid disconnecting the same device if a newer session already owns it.
        if (this.#session?.device !== device && device.gatt.connected) device.gatt.disconnect();
        return;
      }
      if (!device.gatt.connected) throw new DOMException("Disconnected", "NetworkError");
      this.#update(STATES.CONNECTED, "Conexión Bluetooth establecida. Ya puedes explorar los servicios autorizados.");
    } catch (error) {
      if (this.#session !== session) return;
      const cancelled = this.#snapshot.state === STATES.SELECTING && error?.name === "NotFoundError";
      this.#release(session);
      this.#update(cancelled ? STATES.DISCONNECTED : STATES.ERROR,
        cancelled ? "No se seleccionó ningún dispositivo. Puedes volver a pulsar Conectar." : connectionError(error));
    }
  }

  disconnect() {
    const session = this.#session;
    if (!session?.device) return;
    const wasConnecting = this.#snapshot.state === STATES.CONNECTING;
    try {
      // Detach first: the disconnect event may fire synchronously in some implementations.
      session.device.removeEventListener("gattserverdisconnected", session.onDisconnect);
      session.device.gatt.disconnect();
      this.#release(session);
      this.#update(STATES.DISCONNECTED, wasConnecting ? "Intento de conexión cancelado." : "Has desconectado el dispositivo.");
    } catch {
      session.device.addEventListener("gattserverdisconnected", session.onDisconnect);
      this.#update(this.#snapshot.state, "No se pudo desconectar. Vuelve a intentarlo o cierra esta pestaña.");
    }
  }
}
