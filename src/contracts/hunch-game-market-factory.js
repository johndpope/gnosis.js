/**
 * Created by denisgranha on 8/4/16.
 */

import {callAndSendTransaction, errorOnFailure, txDefaults, waitForReceipt}
  from '../lib/transactions';
import {promiseCallback} from '../lib/callbacks';
import {requestWithBlockNumber} from '../lib/web3-batch';
import co from 'co';
import * as abi from '../abi';


export function addCredit(config, callback) {
    const contractInstance = config.web3.eth
      .contract(abi.hunchGameMarketFactory)
      .at(config.addresses.hunchGameMarketFactory);
    const args = [
        txDefaults(config),
    ];

    const booleanSuccessTest = res => res;
    return callAndSendTransaction(
        contractInstance.addCredit,
        "addCredit",
        args,
        config,
        errorOnFailure('addCredit', booleanSuccessTest),
        callback);
}


/**
 * Buy Hunch Game tokens. One wei buys 10,000 of the base unit.
 */
export function buyCredits(spend, config, callback) {
    const contractInstance = config.web3.eth
      .contract(abi.hunchGameMarketFactory)
      .at(config.addresses.hunchGameMarketFactory);
    const args = [
        Object.assign({value: spend}, txDefaults(config)),
    ];

    const booleanSuccessTest = res => res;
    return callAndSendTransaction(
        contractInstance.buyCredits,
        "buyCredits",
        args,
        config,
        errorOnFailure('buyCredits', booleanSuccessTest),
        callback);
}

export function getUserLevel(config, address, callback) {
    const contractInstance = config.web3.eth
      .contract(abi.hunchGameMarketFactory)
      .at(config.addresses.hunchGameMarketFactory);
    return requestWithBlockNumber(
        contractInstance.userLevel,
        address,
        'latest',
        callback);
}

/**
 * Returns timestamp of last free credit of user
 * @param config
 * @param address
 * @param callback
 * @returns {Promise|Promise<T>}
 */
export function getLastCredit(config, address, callback) {
    const contractInstance = config.web3.eth
      .contract(abi.hunchGameMarketFactory)
      .at(config.addresses.hunchGameMarketFactory);
    return requestWithBlockNumber(
        contractInstance.getLastCredit,
        address,
        'latest',
        callback);
}

/**
 * * Returns amount of tokens in given events
 * @param forAddress
 * @param eventHashes
 * @param config
 * @param callback
 * @returns {Request}
 */
export function getTokensInEvents(forAddress, eventHashes, config, callback) {
    const contractInstance = config.web3.eth
      .contract(abi.hunchGameMarketFactory)
      .at(config.addresses.hunchGameMarketFactory);
    return requestWithBlockNumber(
        contractInstance.getTokensInEvents,
        forAddress,
        eventHashes,
        'latest',
        callback);
}

export function getHighScores(userAddresses, config, callback) {
    const contractInstance = config.web3.eth
      .contract(abi.hunchGameMarketFactory)
      .at(config.addresses.hunchGameMarketFactory);
    return requestWithBlockNumber(
        contractInstance.getHighScores,
        userAddresses,
        'latest',
        callback);
}
