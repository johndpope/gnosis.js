'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.evmKeccak = evmKeccak;
exports.signHex = signHex;
exports.signMessageHash = signMessageHash;

var _bignumber = require('bignumber.js');

var _bignumber2 = _interopRequireDefault(_bignumber);

var _cryptoJs = require('crypto-js');

var _cryptoJs2 = _interopRequireDefault(_cryptoJs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// https://bitcoin.stackexchange.com/questions/38351/ecdsa-v-r-s-what-is-v/38909#38909
var UNCOMPRESSED_PUBKEY_HEADER = 27;

/**
 * Generate a Keccak hash from a series of arguments like the EVM SHA3 opcode.
 * https://solidity.readthedocs.org/en/latest/units-and-global-variables.html#mathematical-and-cryptographic-functions
 * @param  {string} ...prefixedHexArgs '0x'-prefixed, hex-encoded bytes. Each
 *                                     argument must be padded to the number of
 *                                     bytes of the type of the value passed to
 *                                     sha3 in the contract.
 * @return {string}  The '0x'-prefixed, hex-encoded hash.
 */
function evmKeccak() {
  for (var _len = arguments.length, prefixedHexArgs = Array(_len), _key = 0; _key < _len; _key++) {
    prefixedHexArgs[_key] = arguments[_key];
  }

  var hexArgs = prefixedHexArgs.map(function (arg) {
    return arg.slice(2);
  });
  var hexMessage = hexArgs.join('');
  // Parse the hex-encoded bytes into a WordArray that CryptoJS can handle.
  var message = _cryptoJs2.default.enc.Hex.parse(hexMessage);
  var hash = _cryptoJs2.default.SHA3(message, { outputLength: 256 });
  return '0x' + hash.toString(_cryptoJs2.default.enc.Hex);
}

/**
 * Sign the given hex-encoded bytes.
 */
function signHex(keypair, hex) {
  var signature = keypair.sign(hex);
  return {
    v: UNCOMPRESSED_PUBKEY_HEADER + signature.recoveryParam,
    r: new _bignumber2.default(signature.r.toString(16), 16),
    s: new _bignumber2.default(signature.s.toString(16), 16)
  };
}

/**
 * Sign the hash of a message. If the message is a string, it is encoded
 * as UTF-8 bytes. As a result, hex-encoded strings are not valid input. They
 * must be parsed into WordArrays first.
 */
function signMessageHash(keypair, message) {
  var hash = _cryptoJs2.default.SHA3(message, { outputLength: 256 });
  return signHex(keypair, hash.toString(_cryptoJs2.default.enc.Hex));
}