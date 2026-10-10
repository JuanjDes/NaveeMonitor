import test from "node:test";
import assert from "node:assert/strict";
import { GattExplorer, GATT_LIMITS } from "../js/ble/gatt.js";
import { normalizeUuid, parseServiceUuids, MAX_SERVICE_UUIDS } from "../js/ble/services.js";
import { formatPacket, MAX_PACKET_BYTES } from "../js/utils/hex.js";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function characteristic(uuid = "2a19", properties = { read: true }) {
  return { uuid: normalizeUuid(uuid), properties, readCalls: 0,
    async readValue() { this.readCalls++; return new DataView(Uint8Array.from([0x55, 0, 0xff]).buffer); },
    writeValue() { assert.fail("Must never write"); },
    startNotifications() { assert.fail("Notifications are out of scope"); },
  };
}

function service(characteristics = [characteristic()], uuid = "180f") {
  return { uuid: normalizeUuid(uuid), isPrimary: true, async getCharacteristics() { return characteristics; } };
}

function setup(services = [service()]) {
  const server = { connected: true, async getPrimaryServices() { return services; } };
  const explorer = new GattExplorer();
  explorer.setServer(server, parseServiceUuids("180f"));
  return { explorer, server };
}

test("normalizes and deduplicates short and full UUIDs; accepts blank input", () => {
  const full = "0000180f-0000-1000-8000-00805f9b34fb";
  assert.deepEqual(parseServiceUuids(`180F, 0x180f; ${full}\n0000180F`), [full]);
  assert.equal(normalizeUuid("12345678"), "12345678-0000-1000-8000-00805f9b34fb");
  assert.deepEqual(parseServiceUuids(" \n"), []);
});

test("rejects malformed or oversized service inputs before BLE", () => {
  for (const input of [null, "xyz", "180", "<script>", "a".repeat(2049), Array(MAX_SERVICE_UUIDS + 1).fill("180f").join(" ")]) {
    assert.throws(() => parseServiceUuids(input), TypeError);
  }
});

test("formats only the view's bytes, including non-printable and empty values", () => {
  const buffer = Uint8Array.from([99, 0x55, 0, 0xff, 88]).buffer;
  assert.deepEqual(formatPacket(new DataView(buffer, 1, 3)), { byteLength: 3, hex: "55 00 FF", decimal: "85 0 255", ascii: "U.." });
  assert.equal(formatPacket(new DataView(new ArrayBuffer(0))).hex, "");
  assert.equal(formatPacket(new DataView(new ArrayBuffer(MAX_PACKET_BYTES))).byteLength, MAX_PACKET_BYTES);
  assert.throws(() => formatPacket(new Uint8Array(2)), TypeError);
  assert.throws(() => formatPacket(new DataView(new ArrayBuffer(MAX_PACKET_BYTES + 1))), RangeError);
});

test("discovery preserves duplicate UUID instances and never reads or writes automatically", async () => {
  const a = characteristic();
  const b = characteristic();
  const { explorer } = setup([service([a, b]), service([characteristic()])]);
  await explorer.discover();
  const snapshot = explorer.snapshot;
  assert.equal(snapshot.services.length, 2);
  assert.equal(snapshot.services[0].characteristics.length, 2);
  const keys = snapshot.services.flatMap((row) => row.characteristics.map((item) => item.key));
  assert.equal(new Set(keys).size, 3);
  assert.equal(a.readCalls + b.readCalls, 0);
  assert.equal(snapshot.services[0].characteristics[0].properties.write, false);
  assert.ok(snapshot.discoveredAt);
  assert.equal(snapshot.busy, false);
});

test("discovery serializes service operations and blocks duplicate discovery and reads", async () => {
  const pending = deferred();
  let secondServiceCalls = 0;
  let discoveryCalls = 0;
  const first = service();
  first.getCharacteristics = () => pending.promise;
  const second = service();
  second.getCharacteristics = async () => { secondServiceCalls++; return []; };
  const { explorer, server } = setup();
  server.getPrimaryServices = async () => { discoveryCalls++; return [first, second]; };
  const task = explorer.discover();
  await Promise.resolve();
  await explorer.discover();
  await explorer.read("s0/c0");
  assert.equal(discoveryCalls, 1);
  assert.equal(secondServiceCalls, 0);
  pending.resolve([]);
  await task;
  assert.equal(secondServiceCalls, 1);
});

test("a service failure does not hide other services", async () => {
  const denied = service();
  denied.getCharacteristics = async () => { throw new DOMException("secret details", "SecurityError"); };
  const { explorer } = setup([denied, service()]);
  await explorer.discover();
  const snapshot = explorer.snapshot;
  assert.equal(snapshot.incomplete, true);
  assert.match(snapshot.services[0].error, /Acceso no permitido/);
  assert.doesNotMatch(snapshot.services[0].error, /secret/);
  assert.equal(snapshot.services[1].characteristics.length, 1);
});

test("empty and denied service discovery explain limits and permit retry", async () => {
  const { explorer, server } = setup([]);
  await explorer.discover();
  assert.match(explorer.snapshot.message, /No hay servicios accesibles/);
  server.getPrimaryServices = async () => { throw new DOMException("Hidden", "SecurityError"); };
  await explorer.discover();
  assert.equal(explorer.snapshot.busy, false);
  assert.equal(explorer.snapshot.incomplete, true);
  assert.match(explorer.snapshot.message, /Acceso no permitido/);
  server.getPrimaryServices = async () => [service()];
  await explorer.discover();
  assert.equal(explorer.snapshot.services.length, 1);
});

test("reads require read support; failed retry removes the previous value", async () => {
  const readable = characteristic();
  const writeOnly = characteristic("2a20", { write: true });
  const { explorer } = setup([service([readable, writeOnly])]);
  await explorer.discover();
  await explorer.read("s0/c1");
  await explorer.read("missing");
  assert.equal(writeOnly.readCalls, 0);
  await explorer.read("s0/c0");
  assert.equal(explorer.snapshot.services[0].characteristics[0].value.hex, "55 00 FF");
  readable.readValue = async () => { throw new DOMException("Failed", "NetworkError"); };
  await explorer.read("s0/c0");
  const item = explorer.snapshot.services[0].characteristics[0];
  assert.equal(item.value, null);
  assert.match(item.error, /operación GATT/);
});

test("malformed packets produce a controlled read error", async () => {
  const readable = characteristic();
  const { explorer } = setup([service([readable])]);
  await explorer.discover();
  readable.readValue = async () => new DataView(new ArrayBuffer(MAX_PACKET_BYTES + 1));
  await explorer.read("s0/c0");
  assert.equal(explorer.snapshot.services[0].characteristics[0].value, null);
  assert.match(explorer.snapshot.services[0].characteristics[0].error, /tamaño/);
});

test("disconnect during discovery discards late results, including after reconnection", async () => {
  const pending = deferred();
  const { explorer, server } = setup();
  server.getPrimaryServices = () => pending.promise;
  const task = explorer.discover();
  explorer.setServer(null);
  explorer.setServer({ connected: true, getPrimaryServices: async () => [] });
  await explorer.discover();
  pending.resolve([service()]);
  await task;
  assert.equal(explorer.snapshot.services.length, 0);
  assert.equal(explorer.snapshot.busy, false);
});

test("disconnect during read retains report but blocks old handles and late values", async () => {
  const pending = deferred();
  const readable = characteristic();
  const { explorer } = setup([service([readable])]);
  await explorer.discover();
  readable.readValue = () => pending.promise;
  const task = explorer.read("s0/c0");
  explorer.setServer(null);
  pending.resolve(new DataView(new ArrayBuffer(1)));
  await task;
  await explorer.read("s0/c0");
  const report = explorer.createReport();
  assert.equal(report.stale, true);
  assert.equal(report.connected, false);
  assert.equal(report.services[0].characteristics[0].value, null);
  assert.doesNotThrow(() => JSON.stringify(report));
  explorer.setServer({ connected: true });
  assert.equal(explorer.snapshot.services.length, 0);
});

test("a disconnected server cannot leave the explorer stuck busy", async () => {
  const { explorer, server } = setup();
  server.getPrimaryServices = async () => { server.connected = false; throw new DOMException("Gone", "NetworkError"); };
  await explorer.discover();
  assert.equal(explorer.snapshot.connected, false);
  assert.equal(explorer.snapshot.busy, false);
});

test("report and metadata snapshots cannot mutate internal readings or service lists", async () => {
  const { explorer } = setup();
  await explorer.discover();
  await explorer.read("s0/c0");
  const report = explorer.createReport();
  report.services[0].characteristics[0].value.hex = "tampered";
  report.requestedServiceUuids.length = 0;
  assert.equal(explorer.snapshot.services[0].characteristics[0].value.hex, "55 00 FF");
  assert.equal(explorer.snapshot.requestedServiceUuids.length, 1);
});

test("discovery bounds services and characteristics and marks a partial report", async () => {
  const chars = Array.from({ length: GATT_LIMITS.characteristicsPerService + 1 }, () => characteristic());
  const services = Array.from({ length: GATT_LIMITS.services + 1 }, () => service(chars));
  const { explorer } = setup(services);
  await explorer.discover();
  assert.equal(explorer.snapshot.services.length, GATT_LIMITS.services);
  assert.equal(explorer.snapshot.services[0].characteristics.length, GATT_LIMITS.characteristicsPerService);
  assert.equal(explorer.snapshot.incomplete, true);
});
