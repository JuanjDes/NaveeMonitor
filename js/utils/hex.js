export const MAX_PACKET_BYTES = 512;

export function formatPacket(value) {
  if (!(value instanceof DataView)) throw new TypeError("La lectura no contiene un DataView válido.");
  if (value.byteLength > MAX_PACKET_BYTES) throw new RangeError(`La lectura supera el límite de ${MAX_PACKET_BYTES} bytes.`);
  // Respect the view's offset and length; never expose bytes outside this value.
  const bytes = Array.from(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
  return {
    byteLength: bytes.length,
    hex: bytes.map((byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join(" "),
    decimal: bytes.join(" "),
    ascii: bytes.map((byte) => byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ".").join(""),
  };
}
