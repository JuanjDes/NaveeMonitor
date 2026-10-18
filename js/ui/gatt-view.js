import { DEFAULT_SERVICE_INPUT } from "../ble/services.js";
import { STATES } from "../ble/connection.js";

// Labels observed in nRF Connect; they do not decode or confirm payload semantics.
const OBSERVED_SERVICES = {
  "0000d0ff-3c17-d293-8e48-14fe2e4da212": {
    name: "Servicio desconocido · D0FF",
    characteristics: {
      "0000b001-0000-1000-8000-00805f9b34fb": "B001",
      "0000b002-0000-1000-8000-00805f9b34fb": "B002",
      "0000b003-0000-1000-8000-00805f9b34fb": "B003",
    },
  },
  "87290102-3c51-43b1-a1a9-11b9dc38478b": {
    name: "Información del accesorio",
    characteristics: {
      "6aa50001-6352-4d57-a7b4-003a416fbb0b": "Datos del producto",
      "6aa50002-6352-4d57-a7b4-003a416fbb0b": "Fabricante del accesorio",
      "6aa50003-6352-4d57-a7b4-003a416fbb0b": "Modelo del accesorio",
      "6aa50005-6352-4d57-a7b4-003a416fbb0b": "Categoría del accesorio",
      "6aa50006-6352-4d57-a7b4-003a416fbb0b": "Capacidades del accesorio",
      "6aa50007-6352-4d57-a7b4-003a416fbb0b": "Versión de firmware del accesorio",
      "6aa50008-6352-4d57-a7b4-003a416fbb0b": "Versión de Find My",
      "6aa50009-6352-4d57-a7b4-003a416fbb0b": "Tipo de batería del accesorio",
      "6aa5000a-6352-4d57-a7b4-003a416fbb0b": "Nivel de batería del accesorio",
    },
  },
  "00001804-0000-1000-8000-00805f9b34fb": {
    name: "Potencia de transmisión Bluetooth",
    characteristics: { "00002a07-0000-1000-8000-00805f9b34fb": "Potencia de transmisión · 2A07" },
  },
};

export function createGattView(root) {
  const input = root.querySelector("#service-uuids");
  const error = root.querySelector("#service-error");
  const discover = root.querySelector("#discover");
  const exportButton = root.querySelector("#export-report");
  const copyButton = root.querySelector("#copy-report");
  const message = root.querySelector("#gatt-message");
  const reportMessage = root.querySelector("#report-message");
  const stale = root.querySelector("#stale-report");
  const services = root.querySelector("#gatt-services");
  let onRead = () => {};
  input.value = DEFAULT_SERVICE_INPUT;
  input.addEventListener("input", () => { error.textContent = ""; input.removeAttribute("aria-invalid"); });

  function element(tag, text, className) {
    const node = root.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function renderCharacteristic(item, enabled, number, labels) {
    const name = labels?.[item.uuid] ?? `Característica ${number}`;
    const card = element("div", undefined, "gatt-characteristic");
    card.append(element("h4", name), element("p", item.uuid, "gatt-uuid"));
    const properties = element("ul", undefined, "gatt-properties");
    for (const [name, supported] of Object.entries(item.properties)) {
      properties.append(element("li", `${name}: ${supported ? "sí" : "no"}`, supported ? "supported" : ""));
    }
    const button = element("button", item.properties.read ? `Leer ${name}` : "Lectura no disponible", "secondary gatt-read");
    button.type = "button";
    button.disabled = !enabled || !item.properties.read;
    button.dataset.readKey = item.key;
    button.setAttribute("aria-label", `Leer ${name} (${item.uuid})`);
    button.addEventListener("click", () => onRead(item.key));
    card.append(button, properties);
    if (item.lastReadAttemptAt) card.append(element("p", `Último intento de lectura: ${item.lastReadAttemptAt}`, "footnote"));
    else if (item.properties.read) card.append(element("p", "Sin intentos de lectura en esta exploración.", "footnote"));
    if (item.error) card.append(element("p", `${item.errorName ? `${item.errorName}: ` : ""}${item.error}`, "field-error"));
    if (item.value) {
      const value = item.value;
      const empty = "(vacío)";
      card.append(element("pre", `${value.timestamp} · ${value.byteLength} bytes\nHEX: ${value.hex || empty}\nDEC: ${value.decimal || empty}\nASCII: ${value.ascii || empty}`, "gatt-value"));
    }
    return card;
  }

  return {
    getServiceInput: () => input.value,
    showInputError(text) {
      error.textContent = text;
      input.setAttribute("aria-invalid", "true");
      input.focus();
    },
    showReportMessage(text) { reportMessage.textContent = text; },
    bind(handlers) {
      discover.addEventListener("click", handlers.discover);
      exportButton.addEventListener("click", handlers.export);
      copyButton.addEventListener("click", handlers.copy);
      onRead = handlers.read;
    },
    renderConnection(state) {
      input.disabled = ![STATES.DISCONNECTED, STATES.ERROR].includes(state);
    },
    render(snapshot) {
      message.textContent = snapshot.message;
      stale.hidden = !snapshot.stale;
      discover.disabled = !snapshot.connected || snapshot.busy;
      exportButton.disabled = copyButton.disabled = !snapshot.attempted || snapshot.busy;
      services.setAttribute("aria-busy", String(snapshot.busy));
      if (!snapshot.attempted) reportMessage.textContent = "";
      const fragment = root.createDocumentFragment();
      for (const [index, service] of snapshot.services.entries()) {
        const labels = OBSERVED_SERVICES[service.uuid];
        const section = element("section", undefined, "gatt-service");
        section.append(element("h3", `${labels?.name ?? `Servicio ${index + 1}`}${service.primary ? " · primario" : ""}`), element("p", service.uuid, "gatt-uuid"));
        if (labels) section.append(element("p", "Etiquetas basadas en la observación de nRF Connect; valores sin interpretar.", "footnote"));
        if (service.error) section.append(element("p", service.error, "field-error"));
        if (!service.characteristics.length && !service.error) section.append(element("p", "Sin características accesibles.", "footnote"));
        for (const [charIndex, item] of service.characteristics.entries()) {
          section.append(renderCharacteristic(item, snapshot.connected && !snapshot.busy, charIndex + 1, labels?.characteristics));
        }
        fragment.append(section);
      }
      services.replaceChildren(fragment);
    },
  };
}
