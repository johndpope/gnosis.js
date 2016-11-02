/**
 * Created by denisgranha on 11/4/16.
 */

import {requestWithBlockNumber} from '../lib/web3-batch';
import * as abi from '../abi';
import {callAndSendTransaction, errorOnFailure, txDefaults, waitForReceipt} from '../lib/transactions';

export function balanceOf(tokenAddress, owner, config, callback) {
    const contractInstance = config.web3.eth.contract(abi.token).at(tokenAddress);

    return requestWithBlockNumber(
        contractInstance.balanceOf,
        owner,
        'latest',
        callback
    );
}

export function name(tokenAddress, config, callback) {
    const contractInstance = config.web3.eth.contract(abi.token).at(tokenAddress);

    return requestWithBlockNumber(
        contractInstance.name,
        'latest',
        callback
    );
}

export function symbol(tokenAddress, config, callback) {
    const contractInstance = config.web3.eth.contract(abi.token).at(tokenAddress);

    return requestWithBlockNumber(
        contractInstance.symbol,
        'latest',
        callback
    );
}

export function decimals(tokenAddress, config, callback) {
    const contractInstance = config.web3.eth.contract(abi.token).at(tokenAddress);

    return requestWithBlockNumber(
        contractInstance.decimals,
        'latest',
        callback
    );
}

export function allowance(tokenAddress, owner, spender, config, callback) {
    const contractInstance = config.web3.eth.contract(abi.token).at(tokenAddress);

    return requestWithBlockNumber(
        contractInstance.allowance,
        owner,
        spender,
        'latest',
        callback
    );
}


export function approve(tokenAddress, spender, value, config, callback) {
    const contractInstance = config.web3.eth.contract(abi.token).at(tokenAddress);
    const args = [
        spender,
        value,
        txDefaults(config),
    ];

    const booleanSuccessTest = res => res;
    return callAndSendTransaction(
        contractInstance.approve,
        "approve",
        args,
        config,
        errorOnFailure('approve', booleanSuccessTest),
        callback);
}

export function totalSupply(tokenAddress, config, callback){
    const contractInstance = config.web3.eth.contract(abi.token).at(tokenAddress);

    return requestWithBlockNumber(
        contractInstance.totalSupply,
        'latest',
        callback
    );
}

export function transfer(tokenAddress, addressTo, value, config, callback){
    const contractInstance = config.web3.eth.contract(abi.token).at(tokenAddress);
    const args = [
        addressTo,
        value,
        txDefaults(config),
    ];

    const booleanSuccessTest = res => res;
    return callAndSendTransaction(
        contractInstance.transfer,
        "transfer",
        args,
        config,
        errorOnFailure('transfer', booleanSuccessTest),
        callback);
}

export function transferFrom(tokenAddress, addressFrom, addressTo, value, config, callback){
    const contractInstance = config.web3.eth.contract(abi.token).at(tokenAddress);
    const args = [
        addressFrom,
        addressTo,
        value,
        txDefaults(config),
    ];

    const booleanSuccessTest = res => res;
    return callAndSendTransaction(
        contractInstance.transferFrom,
        "transferFrom",
        args,
        config,
        errorOnFailure('transferFrom', booleanSuccessTest),
        callback);
}
