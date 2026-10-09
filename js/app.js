import { BleConnection } from "./ble/connection.js";
import { createConnectionView } from "./ui/connection-view.js";

const connection = new BleConnection({
  bluetooth: navigator.bluetooth,
  secureContext: window.isSecureContext,
});
const view = createConnectionView(document);

connection.addEventListener("change", () => view.render(connection.snapshot));
view.bind(() => connection.connect(), () => connection.disconnect());
view.render(connection.snapshot);
