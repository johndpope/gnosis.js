/**
 * Created by denisgranha on 5/7/16.
 */

import {requestWithBlockNumber} from '../lib/web3-batch';
import * as abi from '../abi';
import {callAndSendTransaction, errorOnFailure, txDefaults, waitForReceipt} from '../lib/transactions';

export function buyTokens(value, config, callback){
    const contractInstance = config.web3.eth.contract(abi.etherToken).at(config.addresses.etherToken);
    const args = [
        Object.assign({value: value}, txDefaults(config)),
    ];

    const booleanSuccessTest = res => res;
    return callAndSendTransaction(
        contractInstance.buyTokens,
        "buyTokens",
        args,
        config,
        errorOnFailure('buyTokens', booleanSuccessTest),
        callback);
}

export function sellTokens(count, config, callback){
    const contractInstance = config.web3.eth.contract(abi.etherToken).at(config.addresses.etherToken);
    const args = [
        count,
        txDefaults(config),
    ];

    const booleanSuccessTest = res => res;
    return callAndSendTransaction(
        contractInstance.sellTokens,
        "sellTokens",
        args,
        config,
        errorOnFailure('sellTokens', booleanSuccessTest),
        callback);
}
