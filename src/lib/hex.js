/**
 * Hex encode the number and pad it to at least the given number of bits.
 */
export function encode(number, bits = 0) {
  const charCount = Math.ceil(bits / 4);
  let hex = number.toString(16);
  if (hex.length < charCount) {
    const padding = '0'.repeat(charCount);
    hex = (padding + hex).slice(0 - charCount);
  }
  return '0x' + hex;
}
