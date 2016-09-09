/**
 * Created by denisgranha on 8/4/16.
 */
import {callAndSendTransaction, errorOnFailure, txDefaults, sendTransaction}
  from '../lib/transactions';
import {promiseCallback} from '../lib/callbacks';
import {requestWithBlockNumber} from '../lib/web3-batch';
import * as abi from '../abi';
import BigNumber from 'bignumber.js';
import {decodeSignature, outcomeHash} from '../helpers';
import * as hex from '../../src/lib/hex';
import _ from 'lodash';

export function getOracleOutcomes(descriptionHashes, oracleAddresses, config,
  callback) {
    const contractInstance = config.web3.eth
      .contract(abi.ultimateOracle)
      .at(config.addresses.ultimateOracle);
    return requestWithBlockNumber(
        contractInstance.getOracleOutcomes,
        descriptionHashes,
        oracleAddresses,
        'latest',
        callback
    );
}

export function challengeWinningOutcome(descriptionHash, outcome, challengeAmount, config,
  callback){
    const contractInstance = config.web3.eth
      .contract(abi.ultimateOracle)
      .at(config.addresses.ultimateOracle);

    const args = [
        descriptionHash,
        outcome,
        Object.assign({value: challengeAmount}, txDefaults(config))
    ];

    const booleanSuccessTest = res => res;
    return callAndSendTransaction(
        contractInstance.challengeWinningOutcome,
        "challengeWinningOutcome",
        args,
        config,
        errorOnFailure('challengeWinningOutcome', booleanSuccessTest),
        callback);
}

export function getShares(forAddress, descriptionHashes, outcomes, config,
  callback){
    const contractInstance = config.web3.eth
      .contract(abi.ultimateOracle)
      .at(config.addresses.ultimateOracle);
    return requestWithBlockNumber(
        contractInstance.getShares,
        forAddress,
        descriptionHashes,
        outcomes,
        'latest',
        callback
    );
}

export function setUltimateOutcome(descriptionHash, config, callback){
    const contractInstance = config.web3.eth
      .contract(abi.ultimateOracle)
      .at(config.addresses.ultimateOracle);

    const args = [
        descriptionHash,
        txDefaults(config)
    ];

    const booleanSuccessTest = res => res;
    return callAndSendTransaction(
        contractInstance.setUltimateOutcome,
        "setUltimateOutcome",
        args,
        config,
        errorOnFailure('setUltimateOutcome', booleanSuccessTest),
        callback);
}

export function voteForUltimateOutcome(descriptionHash, outcome, voteValue,
  config, callback){
    const contractInstance = config.web3.eth
      .contract(abi.ultimateOracle)
      .at(config.addresses.ultimateOracle);

    const args = [
        descriptionHash,
        outcome,
        Object.assign({value: voteValue}, txDefaults(config))
    ];

    const booleanSuccessTest = res => res;
    return callAndSendTransaction(
        contractInstance.voteForUltimateOutcome,
        "voteForUltimateOutcome",
        args,
        config,
        errorOnFailure('voteForUltimateOutcome', booleanSuccessTest),
        callback);
}

export function getUltimateOutcomes(descriptionHashes, config, callback){
    const contractInstance = config.web3.eth
      .contract(abi.ultimateOracle)
      .at(config.addresses.ultimateOracle);
    return requestWithBlockNumber(
        contractInstance.getUltimateOutcomes,
        descriptionHashes,
        'latest',
        callback
    );
}

export function withdraw(descriptionHash, config, callback){
    const contractInstance = config.web3.eth
      .contract(abi.ultimateOracle)
      .at(config.addresses.ultimateOracle);

    const args = [
        descriptionHash,
        txDefaults(config)
    ];

    const booleanSuccessTest = res => res;
    return callAndSendTransaction(
        contractInstance.withdraw,
        "withdraw",
        args,
        config,
        errorOnFailure('withdraw', booleanSuccessTest),
        callback);
}

/**
 * Sends a transaction to the Resolver Contract to set the result outcome
 * for a given event, represented by
 * description hash
 * @param resolverAddress resolver contract address
 * @param descriptionHash
 * @param outcomeIndex
 * @param oracleAddress
 * @param config
 * @params callback
 * @returns {*}
 */
export function setOutcome(eventIdentifier, descriptionHash, outcomeIndex,
  oracleAddress, config, callback) {
    const contractInstance = config.web3.eth
      .contract(abi.ultimateOracle)
      .at(config.addresses.ultimateOracle);
    return new Promise( (resolve, reject) => {
        config.web3.eth.sign(
          oracleAddress,
          outcomeHash(descriptionHash, outcomeIndex),
          promiseCallback(resolve, reject)
        );
    })
    .then((signature) => {
        const decodedSignature = decodeSignature(signature);
        const outcomeData = [
          outcomeIndex,
          decodedSignature.v,
          decodedSignature.r,
          decodedSignature.s
        ];
        const args = [
            eventIdentifier,
            outcomeData.map(int => hex.encode(int, 256)),
            txDefaults(config),
        ];
        const booleanSuccessTest = res => res;
        return callAndSendTransaction(
            contractInstance.setOutcome,
            "setOutcome",
            args,
            config,
            errorOnFailure('setOutcome', booleanSuccessTest),
            callback);
    });
}

/**
 * Sends a transaction to the Resolver Contract to set the result outcome
 * for a given event, represented by
 * description hash with result signature
 * @param eventIdentifier Oracle Contract Event Identifier
 * @param signatures
 * @param config
 * @params callback
 * @returns {*}
 */
export function setOutcomeWithSignature(
  eventIdentifier,
  signatures,
  config,
  callback
) {
    const contractInstance = config.web3.eth
      .contract(abi.ultimateOracle)
      .at(config.addresses.ultimateOracle);
        const outcomeData = _.flatten(
          signatures.map(
            signature =>
              [
                signature.outcomeIndex,
                signature.v,
                signature.r,
                signature.s
              ]

          )
        );
        const args = [
            eventIdentifier,
            outcomeData.map(int => hex.encode(int, 256)),
            txDefaults(config),
        ];
        const booleanSuccessTest = res => res;
        return callAndSendTransaction(
            contractInstance.setOutcome,
            "setOutcomeWithSignature",
            args,
            config,
            errorOnFailure('setOutcomeWithSignature', booleanSuccessTest),
            callback);
}
