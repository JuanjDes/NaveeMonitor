export const MAX_SERVICE_UUIDS = 32;
export const MAX_UUID_INPUT_LENGTH = 2048;
const BLUETOOTH_BASE_SUFFIX = "-0000-1000-8000-00805f9b34fb";

// Standard services, not confirmed NAVEE services.
export const DEFAULT_SERVICE_INPUT = "180A\n180F";

export function normalizeUuid(value) {
  if (typeof value !== "string") throw new TypeError("El UUID debe ser texto hexadecimal.");
  const uuid = value.trim().toLowerCase();
  if (/^(?:0x)?(?:[0-9a-f]{4}|[0-9a-f]{8})$/.test(uuid)) {
    return uuid.replace(/^0x/, "").padStart(8, "0") + BLUETOOTH_BASE_SUFFIX;
  }
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuid)) return uuid;
  throw new TypeError("UUID inválido: usa 4 u 8 dígitos hexadecimales o un UUID completo con guiones.");
}

export function validateServiceUuids(values) {
  if (!Array.isArray(values) || values.length > MAX_SERVICE_UUIDS) {
    throw new TypeError(`Introduce como máximo ${MAX_SERVICE_UUIDS} UUID de servicio.`);
  }
  return [...new Set(values.map(normalizeUuid))];
}

export function parseServiceUuids(text) {
  if (typeof text !== "string" || text.length > MAX_UUID_INPUT_LENGTH) {
    throw new TypeError(`La lista de UUID no puede superar ${MAX_UUID_INPUT_LENGTH} caracteres.`);
  }
  return validateServiceUuids(text.trim() ? text.trim().split(/[\s,;]+/) : []);
}
