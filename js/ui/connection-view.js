import { STATES } from "../ble/connection.js";

const LABELS = {
  [STATES.DISCONNECTED]: "Desconectado",
  [STATES.SELECTING]: "Seleccionando",
  [STATES.CONNECTING]: "Conectando",
  [STATES.CONNECTED]: "Conectado",
  [STATES.ERROR]: "Error de conexión",
  [STATES.UNAVAILABLE]: "No disponible",
};

export function createConnectionView(root) {
  const status = root.querySelector("#connection-state");
  const message = root.querySelector("#connection-message");
  const name = root.querySelector("#device-name");
  const id = root.querySelector("#device-id");
  const connect = root.querySelector("#connect");
  const disconnect = root.querySelector("#disconnect");

  return {
    bind(onConnect, onDisconnect) {
      connect.addEventListener("click", onConnect);
      disconnect.addEventListener("click", onDisconnect);
    },
    render(snapshot) {
      status.textContent = LABELS[snapshot.state];
      status.dataset.state = snapshot.state;
      message.textContent = snapshot.message;
      name.textContent = snapshot.name;
      id.textContent = snapshot.id;
      connect.disabled = ![STATES.DISCONNECTED, STATES.ERROR].includes(snapshot.state);
      disconnect.disabled = ![STATES.CONNECTED, STATES.CONNECTING].includes(snapshot.state);
      disconnect.textContent = snapshot.state === STATES.CONNECTING ? "Cancelar conexión" : "Desconectar";
    },
  };
}
