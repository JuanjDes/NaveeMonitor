import test from "node:test";
import assert from "node:assert/strict";
import { BleConnection, STATES } from "../js/ble/connection.js";
import { createConnectionView } from "../js/ui/connection-view.js";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

class FakeDevice extends EventTarget {
  name = "NAVEE de prueba";
  id = "browser-test-id";
  disconnectCalls = 0;
  gatt = {
    connected: false,
    connect: async () => { this.gatt.connected = true; return this.gatt; },
    disconnect: () => {
      this.disconnectCalls++;
      this.gatt.connected = false;
      this.dispatchEvent(new Event("gattserverdisconnected"));
    },
  };
}

function setup(requestDevice = async () => new FakeDevice()) {
  return new BleConnection({ bluetooth: { requestDevice }, secureContext: true });
}

test("unsupported or insecure contexts cannot open a chooser", async () => {
  let calls = 0;
  const insecure = new BleConnection({ bluetooth: { requestDevice() { calls++; } }, secureContext: false });
  await insecure.connect();
  assert.equal(insecure.snapshot.state, STATES.UNAVAILABLE);
  assert.equal(calls, 0);
  const unsupported = new BleConnection({ secureContext: true });
  await unsupported.connect();
  assert.equal(unsupported.snapshot.state, STATES.UNAVAILABLE);
});

test("opens chooser immediately, ignores duplicate clicks and connects only once", async () => {
  const chooser = deferred();
  let calls = 0;
  const connection = setup((options) => {
    calls++;
    assert.deepEqual(options, { acceptAllDevices: true });
    return chooser.promise;
  });
  const pending = connection.connect();
  assert.equal(calls, 1);
  assert.equal(connection.snapshot.state, STATES.SELECTING);
  await connection.connect();
  assert.equal(calls, 1);
  const device = new FakeDevice();
  chooser.resolve(device);
  await pending;
  assert.equal(connection.snapshot.state, STATES.CONNECTED);
  assert.equal(connection.snapshot.name, device.name);
  connection.disconnect();
  assert.equal(connection.snapshot.state, STATES.DISCONNECTED);
  assert.match(connection.snapshot.message, /Has desconectado/);
});

test("chooser cancellation allows retry", async () => {
  let first = true;
  const connection = setup(async () => {
    if (first) { first = false; throw new DOMException("Cancelled", "NotFoundError"); }
    return new FakeDevice();
  });
  await connection.connect();
  assert.equal(connection.snapshot.state, STATES.DISCONNECTED);
  await connection.connect();
  assert.equal(connection.snapshot.state, STATES.CONNECTED);
});

test("connection failures are controlled and do not expose raw error contents", async () => {
  const device = new FakeDevice();
  device.gatt.connect = async () => { throw new DOMException("secret details", "NetworkError"); };
  const connection = setup(async () => device);
  await connection.connect();
  assert.equal(connection.snapshot.state, STATES.ERROR);
  assert.doesNotMatch(connection.snapshot.message, /secret/);
  device.dispatchEvent(new Event("gattserverdisconnected"));
  assert.equal(connection.snapshot.state, STATES.ERROR);
});

test("missing GATT and denied permissions are handled", async () => {
  for (const request of [async () => ({}), async () => { throw new DOMException("Denied", "SecurityError"); }]) {
    const connection = setup(request);
    await connection.connect();
    assert.equal(connection.snapshot.state, STATES.ERROR);
  }
});

test("unexpected disconnect updates state without automatic reconnection", async () => {
  const device = new FakeDevice();
  let calls = 0;
  const connection = setup(async () => { calls++; return device; });
  await connection.connect();
  device.gatt.disconnect();
  assert.equal(connection.snapshot.state, STATES.DISCONNECTED);
  assert.match(connection.snapshot.message, /perdido/);
  assert.equal(calls, 1);
});

test("a late connection after cancellation is closed and never appears connected", async () => {
  const device = new FakeDevice();
  const connecting = deferred();
  device.gatt.connect = () => connecting.promise;
  const connection = setup(async () => device);
  const pending = connection.connect();
  await Promise.resolve();
  assert.equal(connection.snapshot.state, STATES.CONNECTING);
  connection.disconnect();
  device.gatt.connected = true;
  connecting.resolve(device.gatt);
  await pending;
  assert.equal(connection.snapshot.state, STATES.DISCONNECTED);
  assert.equal(device.gatt.connected, false);
});

test("events from a previous device cannot overwrite a newer connection", async () => {
  const oldDevice = new FakeDevice();
  const nextDevice = new FakeDevice();
  const devices = [oldDevice, nextDevice];
  const connection = setup(async () => devices.shift());
  await connection.connect();
  connection.disconnect();
  await connection.connect();
  oldDevice.dispatchEvent(new Event("gattserverdisconnected"));
  assert.equal(connection.snapshot.state, STATES.CONNECTED);
});

test("disconnect failure preserves the real connection and permits retry", async () => {
  const device = new FakeDevice();
  const connection = setup(async () => device);
  await connection.connect();
  const disconnect = device.gatt.disconnect;
  device.gatt.disconnect = () => { throw new Error("Failure"); };
  connection.disconnect();
  assert.equal(connection.snapshot.state, STATES.CONNECTED);
  device.gatt.disconnect = disconnect;
  connection.disconnect();
  assert.equal(connection.snapshot.state, STATES.DISCONNECTED);
});

test("invalid and oversized device metadata is bounded", async () => {
  const device = new FakeDevice();
  device.name = "a".repeat(1000);
  device.id = { invalid: true };
  const connection = setup(async () => device);
  await connection.connect();
  assert.equal(connection.snapshot.name.length, 256);
  assert.equal(connection.snapshot.id, "No disponible");
});

test("view treats device HTML as text and enables controls for each state", () => {
  const elements = new Map();
  const root = { querySelector(selector) {
    if (!elements.has(selector)) elements.set(selector, { dataset: {}, set innerHTML(_) { assert.fail("Unsafe HTML rendering"); } });
    return elements.get(selector);
  } };
  const view = createConnectionView(root);
  for (const state of Object.values(STATES)) {
    view.render({ state, message: "Test", name: "<img src=x onerror=alert(1)>", id: "<script>" });
    assert.equal(elements.get("#device-name").textContent, "<img src=x onerror=alert(1)>");
    assert.equal(elements.get("#connect").disabled, ![STATES.DISCONNECTED, STATES.ERROR].includes(state));
    assert.equal(elements.get("#disconnect").disabled, ![STATES.CONNECTED, STATES.CONNECTING].includes(state));
  }
});
