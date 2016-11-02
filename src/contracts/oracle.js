/**
 * Created by denisgranha on 8/4/16.
 */
import * as abi from '../abi';
import * as crypto from '../lib/crypto';
import * as hex from '../lib/hex';
import {
  callAndSendTransaction,
  errorOnFailure,
  txDefaults,
  sendTransaction
} from '../lib/transactions';
import {requestWithBlockNumber} from '../lib/web3-batch';
import {promiseCallback} from '../lib/callbacks';
import BigNumber from 'bignumber.js';
import {decodeSignature, outcomeHash} from '../helpers';
import _ from 'lodash';
import {signing} from 'eth-lightwallet';


// TODO, setOutcome moved to Ultimate Oracle

/**
 * Checks if the outcome of an event is already set, it has a delay
 * (ultimateOracle = 12h) since the set outcome
 * transaction was sent
 * @param resolverAddress oracle contract address
 * @param eventIdentifier
 * @param config
 * @param callback
 * @returns {Promise|Promise<T>}
 */
export function isOutcomeSet(resolverAddress, eventIdentifier, config,
  callback) {
    const contractInstance = config.web3.eth
      .contract(abi.oracle)
      .at(resolverAddress);

    return requestWithBlockNumber(
        contractInstance.isOutcomeSet,
        eventIdentifier,
        'latest',
        callback
    );
}

/**
 * Gets the current outcome for an event if it's already resolved
 * @param resolverAddress oracle contract address
 * @param eventIdentifier
 * @param config
 * @param callback
 * @returns {Promise|Promise<T>}
 */
export function getOutcome(resolverAddress, eventIdentifier, config, callback) {
    const contractInstance = config.web3.eth
      .contract(abi.oracle)
      .at(resolverAddress);

    return requestWithBlockNumber(
        contractInstance.getOutcome,
        eventIdentifier,
        'latest',
        callback
    );
}

export function getOffChainFee(descriptionHash, feeSignatures){
    let eventFee = feeSignatures.reduce((acc, fee) => {
        let v = new Buffer(new BigNumber(fee.v).toString(16), 'hex');
        let r = new Buffer(
          hex.encode(new BigNumber(fee.r), 256).slice(2),
           'hex'
         );
        let s = new Buffer(
          hex.encode(new BigNumber(fee.s), 256).slice(2),
           'hex'
         );

        let address = '0x' + signing.recoverAddress(
                descriptionHash + hex.encode(fee.fee, 256).slice(2),
                v,
                r,
                s
            ).toString('hex');

        if(address == fee.address){
            // Check feeSignature
            return fee.fee.add(new BigNumber(acc));
        }
        else{
            return acc;
        }
    }, new BigNumber(0));

    return eventFee;
}

export function getFee(resolverAddress, validationData, config, callback){
    const contractInstance = config.web3.eth
      .contract(abi.oracle)
      .at(resolverAddress);

    return requestWithBlockNumber(
        contractInstance.getFee,
        validationData,
        'latest',
        callback);

}

export function getEventData(resolverAddress, eventIdentifier, config, callback){
    const contractInstance = config.web3.eth
      .contract(abi.oracle)
      .at(resolverAddress);

    return requestWithBlockNumber(
        contractInstance.getEventData,
        eventIdentifier,
        'latest',
        callback);

}

export function registerEvent(resolverAddress, eventData, config, callback){
  const contractInstance = config.web3.eth
    .contract(abi.oracle)
    .at(resolverAddress);

  const args = [
      eventData,
      txDefaults(config),
  ];

  const booleanSuccessTest = res => res;
  return callAndSendTransaction(
      contractInstance.registerEvent,
      "registerEvent",
      args,
      config,
      errorOnFailure('registerEvent', booleanSuccessTest),
      callback);
}
