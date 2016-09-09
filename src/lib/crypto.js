import BigNumber from 'bignumber.js';
import CryptoJS from 'crypto-js';


// https://bitcoin.stackexchange.com/questions/38351/ecdsa-v-r-s-what-is-v/38909#38909
const UNCOMPRESSED_PUBKEY_HEADER = 27;

/**
 * Generate a Keccak hash from a series of arguments like the EVM SHA3 opcode.
 * https://solidity.readthedocs.org/en/latest/units-and-global-variables.html#mathematical-and-cryptographic-functions
 * @param  {string} ...prefixedHexArgs '0x'-prefixed, hex-encoded bytes. Each
 *                                     argument must be padded to the number of
 *                                     bytes of the type of the value passed to
 *                                     sha3 in the contract.
 * @return {string}  The '0x'-prefixed, hex-encoded hash.
 */
export function evmKeccak(...prefixedHexArgs) {
  const hexArgs = prefixedHexArgs.map(arg => arg.slice(2));
  const hexMessage = hexArgs.join('');
  // Parse the hex-encoded bytes into a WordArray that CryptoJS can handle.
  const message: WordArray = CryptoJS.enc.Hex.parse(hexMessage);
  const hash: WordArray = CryptoJS.SHA3(message, {outputLength: 256});
  return '0x' + hash.toString(CryptoJS.enc.Hex);
}

/**
 * Sign the given hex-encoded bytes.
 */
export function signHex(keypair, hex){
  const signature = keypair.sign(hex);
  return {
    v: UNCOMPRESSED_PUBKEY_HEADER + signature.recoveryParam,
    r: new BigNumber(signature.r.toString(16), 16),
    s: new BigNumber(signature.s.toString(16), 16),
  };
}

/**
 * Sign the hash of a message. If the message is a string, it is encoded
 * as UTF-8 bytes. As a result, hex-encoded strings are not valid input. They
 * must be parsed into WordArrays first.
 */
export function signMessageHash(keypair, message){
  const hash: WordArray = CryptoJS.SHA3(message, {outputLength: 256});
  return signHex(keypair, hash.toString(CryptoJS.enc.Hex));
}
