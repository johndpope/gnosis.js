/**
 * Created by denisgranha on 8/4/16.
 */
import BigNumber from 'bignumber.js';
import CryptoJS from 'crypto-js';
import * as crypto from './lib/crypto';
import * as hex from './lib/hex';
import {promiseCallback} from './lib/callbacks';
import _ from 'lodash';

export function signFactserverPayload(oracleAddress, payload, config) {
    const message = JSON.stringify(payload);

    const messageHash = CryptoJS.SHA3(message, {outputLength: 256})
      .toString(CryptoJS.enc.Hex);
    return new Promise( (resolve, reject) => {
        config.web3.eth.sign(oracleAddress, messageHash,
            promiseCallback(resolve, reject));
    })
        .then((signature) =>
        {
            const decodedSignature = decodeSignature(signature);
            return new Promise( (resolve, reject) => {
                resolve({
                    signature: {
                        address: oracleAddress,
                        r: decodedSignature.r.toString(10),
                        s: decodedSignature.s.toString(10),
                        v: decodedSignature.v.toNumber()
                    },
                    message: message
                });
            });
        });
}

export function outcomeIdentifier(eventHash, outcomeIndex) {
    return crypto.evmKeccak(eventHash, hex.encode(outcomeIndex, 8));
}

function getDescriptionJSON(event) {
    const data = {
        title: event.title,
        description: event.description,
        resolutionDate: event.resolutionDate,
        sourceURL: event.sourceURL,
        tags: event.tags
    };
    if (event.outcomes) {
        data.outcomes = event.outcomes;
    } else {
        data.unit = event.unit;
        data.decimals = event.decimals;
    }

    if(event.imageEncodedHash){
      data.imageEncodedHash = event.imageEncodedHash;
    }

    return JSON.stringify(data);
}

export function getEventIdentifiers(event) {
    const descriptionJSON = getDescriptionJSON(event);
    const descriptionHash = CryptoJS.SHA3(descriptionJSON, {outputLength: 256});
    return {
        descriptionHash: '0x' + descriptionHash.toString(CryptoJS.enc.Hex),
        descriptionJSON: descriptionJSON,
    };
}

/**
 * Generate the signed data expected by /api/event/oracle/result/ or fee
 * signatures.
 * The data is the uint256 fee/result followed by the v, r and s components of
 * a signature, which are 8, 256 and 256 bits, respectively.
 * The signature payload is the hash of the uint256 description hash
 * concatenated with the uint256 fee/result.
 */
export function signWithDescription(oracleAddress, message, descriptionHash,
   config){
    const hash = crypto.evmKeccak(descriptionHash, hex.encode(message, 256));

    return new Promise( (resolve, reject) => {
        config.web3.eth.sign(oracleAddress, hash,
            promiseCallback(resolve, reject));
    })
    .then((signature) =>
    {
        const decodedSignature = decodeSignature(signature);
        return new Promise( (resolve, reject) => {
            resolve(Object.assign({
                message,
                address: oracleAddress,
                descriptionHash: descriptionHash,
            }, decodedSignature))
        });
    });
}

/**
* Generates the signature expected to subscribe an oracle to one concrete event.
* @param fee: bigNumber. Represents the fee oracle charges event creator for resolving
*       the event.
* @param feeToken: bigNumber|hexString. Token address used to charge oracle fees.
* @param descriptionHash: hexString. Hash that identifies the event description.
**/
export function signOracleFee(oracleAddress, descriptionHash, fee, feeToken,
  config){
  const feeHash = crypto.evmKeccak(
    descriptionHash,
    hex.encode(fee, 256),
    feeToken
  );

  return new Promise( (resolve, reject) => {
      config.web3.eth.sign(oracleAddress, feeHash,
          promiseCallback(resolve, reject));
  })
  .then((signature) =>
  {
      const decodedSignature = decodeSignature(signature);
      return new Promise( (resolve, reject) => {
          resolve(Object.assign({
              fee,
              feeToken,
              address: oracleAddress,
              descriptionHash: descriptionHash,
          }, decodedSignature))
      });
  });
}

export function signMsg(account, message, config){
    const msgHash = '0x' + CryptoJS.SHA3(message,  { outputLength: 256 })
      .toString(CryptoJS.enc.hex);

    return new Promise( (resolve, reject) => {
        config.web3.eth.sign(account, msgHash,
            promiseCallback(resolve, reject));
    })
        .then((signature) =>
        {
            const decodedSignature = decodeSignature(signature);
            decodedSignature.address = account;
            return new Promise( (resolve, reject) => {
                resolve(decodedSignature);
            });
        });
}

/**
 * Sign result outcome with the oracle private key
 */
export function outcomeHash(descriptionHash, outcomeIndex) {
    return crypto.evmKeccak(descriptionHash, hex.encode(outcomeIndex, 256));
}

/**
 * Deconstruct signature returned by eth_sign
 * @param signature
 */
export function decodeSignature(signature) {
    signature=signature.slice(2);
   return {
        r : new BigNumber('0x'+ signature.slice(0,64)),
        s : new BigNumber('0x'+ signature.slice(64,128)),
        v : new BigNumber('0x'+ signature.slice(128,130))
   }
}

export function encodeFeeSignatures(feeSignatures) {

    const validationData = _.flatten(
        feeSignatures.map((feeSignature, index) => {
          if(index){
            return [
              feeSignature.fee,
              new BigNumber(feeSignature.feeToken),
              feeSignature.v,
              feeSignature.r,
              feeSignature.s
            ];
          }
          else{
            return [
              new BigNumber(feeSignature.descriptionHash),
              feeSignature.fee,
              new BigNumber(feeSignature.feeToken),
              feeSignature.v,
              feeSignature.r,
              feeSignature.s
            ];
          }
        }
    ));

    // Pad all of the resolver data to 32 bytes. The function expects bytes,
    // so web3 would pad values on the right. ultimateOracle.isValidEvent
    // expects values padded on the left that it can just cast to uints and
    // addresses, so we must left pad them in advance.

    const validationDataBytes = validationData.map(int => hex.encode(int, 256));

    return validationDataBytes;
}
