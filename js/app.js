import { BleConnection } from "./ble/connection.js";
import { createConnectionView } from "./ui/connection-view.js";
import { GattExplorer } from "./ble/gatt.js";
import { parseServiceUuids } from "./ble/services.js";
import { createGattView } from "./ui/gatt-view.js";
import { downloadReport } from "./utils/report.js";

const connection = new BleConnection({
  bluetooth: navigator.bluetooth,
  secureContext: window.isSecureContext,
});
const view = createConnectionView(document);
const explorer = new GattExplorer();
const gattView = createGattView(document);

function syncConnection() {
  const snapshot = connection.snapshot;
  view.render(snapshot);
  gattView.renderConnection(snapshot.state);
  explorer.setServer(connection.server, snapshot.requestedServiceUuids);
}

connection.addEventListener("change", syncConnection);
explorer.addEventListener("change", () => gattView.render(explorer.snapshot));
view.bind(() => {
  let services;
  try {
    services = parseServiceUuids(gattView.getServiceInput());
  } catch (error) {
    gattView.showInputError(error.message);
    return;
  }
  // No await before requestDevice: it must run in the button's user gesture.
  return connection.connect(services);
}, () => connection.disconnect());

gattView.bind({
  discover: () => explorer.discover(),
  read: (key) => explorer.read(key),
  export: () => {
    try {
      downloadReport(explorer.createReport());
      gattView.showReportMessage("Descarga solicitada. Comprueba los archivos descargados del navegador.");
    } catch {
      gattView.showReportMessage("No se pudo exportar el informe. Prueba a copiarlo.");
    }
  },
  copy: async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(JSON.stringify(explorer.createReport(), null, 2));
      gattView.showReportMessage("Informe copiado.");
    } catch {
      gattView.showReportMessage("No se pudo copiar el informe. Prueba a exportarlo como archivo.");
    }
  },
});
syncConnection();
gattView.render(explorer.snapshot);
