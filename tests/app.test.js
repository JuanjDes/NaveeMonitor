import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// A minimal DOM double validates application wiring; it is not a visual browser test.
class Element {
  children = [];
  dataset = {};
  attributes = {};
  listeners = new Map();
  textContent = "";
  disabled = false;
  constructor(tag = "div") { this.tag = tag; }
  set innerHTML(_) { assert.fail("External data must not use innerHTML"); }
  append(...nodes) {
    for (const node of nodes) {
      if (node.tag === "fragment") this.append(...node.children);
      else { node.parent = this; this.children.push(node); }
    }
  }
  replaceChildren(...nodes) { this.children = []; this.append(...nodes); }
  setAttribute(name, value) { this.attributes[name] = value; }
  removeAttribute(name) { delete this.attributes[name]; }
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }
  async trigger(type) {
    if (type === "click" && this.disabled) return;
    for (const listener of this.listeners.get(type) ?? []) await listener();
  }
  click() { return this.trigger("click"); }
  focus() { this.focused = true; }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this); }
}

function walk(node) { return [node, ...node.children.flatMap(walk)]; }

test("application wiring: configure, connect, discover, read, copy/export, disconnect and reconnect", async (t) => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const elements = new Map([...html.matchAll(/id="([^"]+)"/g)].map((match) => [`#${match[1]}`, new Element()]));
  const documentObject = {
    body: new Element("body"),
    querySelector(selector) { assert.ok(elements.has(selector), `Missing HTML element ${selector}`); return elements.get(selector); },
    createElement: (tag) => new Element(tag),
    createDocumentFragment: () => new Element("fragment"),
  };
  let selectedOptions;
  let copied;
  let downloadBlob;
  let chooserCalls = 0;
  let serviceCalls = 0;
  const device = new EventTarget();
  device.name = "<img src=x onerror=alert(1)>";
  device.id = "test-device";
  const rawText = "<script>";
  const bytes = new TextEncoder().encode(rawText);
  device.gatt = {
    connected: false,
    async connect() { this.connected = true; return this; },
    disconnect() { this.connected = false; device.dispatchEvent(new Event("gattserverdisconnected")); },
    async getPrimaryServices() {
      serviceCalls++;
      return [{ uuid: "180f", isPrimary: true, getCharacteristics: async () => [{
        uuid: "2a19", properties: { read: true, write: true, notify: true },
        readValue: async () => new DataView(bytes.buffer),
        writeValue() { assert.fail("Unexpected write"); },
        startNotifications() { assert.fail("Unexpected subscription"); },
      }] }];
    },
  };
  const globals = {
    document: documentObject,
    window: { isSecureContext: true },
    navigator: {
      bluetooth: { async requestDevice(options) { chooserCalls++; selectedOptions = options; return device; } },
      clipboard: { async writeText(value) { copied = value; } },
    },
  };
  for (const [key, value] of Object.entries(globals)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => { if (original) Object.defineProperty(globalThis, key, original); else delete globalThis[key]; });
  }
  t.mock.method(URL, "createObjectURL", (blob) => { downloadBlob = blob; return "blob:test"; });
  t.mock.method(URL, "revokeObjectURL", () => {});
  t.mock.method(globalThis, "setTimeout", (callback) => { callback(); return 1; });
  await import("../js/app.js");
  const get = (id) => elements.get(`#${id}`);
  assert.equal(get("connect").disabled, false);
  assert.equal(get("discover").disabled, true);
  assert.equal(get("service-uuids").value, "180A\n180F");

  get("service-uuids").value = "bad-uuid";
  await get("connect").click();
  assert.equal(chooserCalls, 0);
  assert.equal(get("service-uuids").attributes["aria-invalid"], "true");
  get("service-uuids").value = "180f";
  await get("service-uuids").trigger("input");
  await get("connect").click();
  assert.deepEqual(selectedOptions.optionalServices, ["0000180f-0000-1000-8000-00805f9b34fb"]);
  assert.equal(get("device-name").textContent, device.name);
  assert.equal(get("discover").disabled, false);
  assert.equal(get("service-uuids").disabled, true);
  assert.equal(serviceCalls, 0);

  await get("discover").click();
  const readButton = walk(get("gatt-services")).find((node) => node.dataset.readKey === "s0/c0");
  assert.ok(readButton);
  await readButton.click();
  assert.ok(walk(get("gatt-services")).some((node) => node.tag === "pre" && node.textContent.includes(rawText)));
  await get("copy-report").click();
  const report = JSON.parse(copied);
  assert.equal(report.services[0].characteristics[0].value.ascii, rawText);
  assert.equal(report.services[0].characteristics[0].properties.notify, true);
  await get("export-report").click();
  assert.equal(JSON.parse(await downloadBlob.text()).format, "navee-monitor-gatt");

  await get("disconnect").click();
  assert.equal(get("stale-report").hidden, false);
  assert.equal(get("discover").disabled, true);
  assert.equal(get("export-report").disabled, false);
  assert.ok(walk(get("gatt-services")).filter((node) => node.tag === "button").every((node) => node.disabled));
  await get("connect").click();
  assert.equal(get("gatt-services").children.length, 0);
  assert.equal(get("export-report").disabled, true);
  assert.equal(get("stale-report").hidden, true);
});
