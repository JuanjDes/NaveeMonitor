import { DEFAULT_SERVICE_INPUT } from "../ble/services.js";
import { STATES } from "../ble/connection.js";

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

  function renderCharacteristic(item, enabled, number) {
    const card = element("div", undefined, "gatt-characteristic");
    card.append(element("h4", `Característica ${number}`), element("p", item.uuid, "gatt-uuid"));
    const properties = element("ul", undefined, "gatt-properties");
    for (const [name, supported] of Object.entries(item.properties)) {
      properties.append(element("li", `${name}: ${supported ? "sí" : "no"}`, supported ? "supported" : ""));
    }
    card.append(properties);
    const button = element("button", item.properties.read ? "Leer" : "Lectura no disponible", "secondary");
    button.type = "button";
    button.disabled = !enabled || !item.properties.read;
    button.dataset.readKey = item.key;
    button.setAttribute("aria-label", `Leer característica ${item.uuid}`);
    button.addEventListener("click", () => onRead(item.key));
    card.append(button);
    if (item.error) card.append(element("p", item.error, "field-error"));
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
        const section = element("section", undefined, "gatt-service");
        section.append(element("h3", `Servicio ${index + 1}${service.primary ? " · primario" : ""}`), element("p", service.uuid, "gatt-uuid"));
        if (service.error) section.append(element("p", service.error, "field-error"));
        if (!service.characteristics.length && !service.error) section.append(element("p", "Sin características accesibles.", "footnote"));
        for (const [charIndex, item] of service.characteristics.entries()) {
          section.append(renderCharacteristic(item, snapshot.connected && !snapshot.busy, charIndex + 1));
        }
        fragment.append(section);
      }
      services.replaceChildren(fragment);
    },
  };
}
