'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.encode = encode;
/**
 * Hex encode the number and pad it to at least the given number of bits.
 */
function encode(number) {
  var bits = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

  var charCount = Math.ceil(bits / 4);
  var hex = number.toString(16);
  if (hex.length < charCount) {
    var padding = '0'.repeat(charCount);
    hex = (padding + hex).slice(0 - charCount);
  }
  return '0x' + hex;
}