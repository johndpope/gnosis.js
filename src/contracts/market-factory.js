/**
 * Created by denisgranha on 8/4/16.
 */

import {callAndSendTransaction, errorOnFailure, waitForReceipt, txDefaults} from '../lib/transactions';
import * as abi from '../abi';
import {requestWithBlockNumber} from '../lib/web3-batch';
import {promiseCallback} from '../lib/callbacks';
import * as hex from '../lib/hex';
import * as constants from '../constants';
import {get} from '../state';
import BigNumber from 'bignumber.js';
import {getEvent, ensurePermanentApproval} from './event-factory';
import co from 'co';

/**
 * Create a market for the event on chain.
 * @return {Promise}  Resolves to an object containing the market hash and transaction hash of the sent transaction.
 */
export function createMarket(market, eventHash, config, ...args) {
    let callback, marketAddress;

    if(args.length > 0){
        callback = args.pop();
    }

    marketAddress = args.pop();

    if(!marketAddress){
        marketAddress = config.addresses.defaultMarketFactory;
    }
    const contractInstance = config.web3.eth.contract(abi.marketFactory).at(marketAddress);

    const transactionArgs = [
        eventHash,
        market.fee,
        market.initialFunding,
        market.makerAddress,
        txDefaults(config),
    ];

    return callAndSendTransaction(
        contractInstance.createMarket,
        "createMarket",
        transactionArgs,
        config,
        errorOnFailure('createMarket'),
        callback);

}

/**
 * Sends a transaction to the Market Contract in order to close a previosly created market
 * @param marketAddress
 * @param marketHash
 * @param config
 * @param callback
 * @returns {*}
 */
export function closeMarket(marketHash, config, ...args) {
    let callback, marketAddress;

    callback = args.pop();
    marketAddress = args.pop();

    if(!marketAddress){
        marketAddress = config.addresses.defaultMarketFactory;
    }
    const contractInstance = config.web3.eth.contract(abi.marketFactory).at(marketAddress);
    const transactionArgs = [
        marketHash,
        txDefaults(config),
    ];

    const booleanSuccessTest = res => res;
    return callAndSendTransaction(
        contractInstance.closeMarket,
        "closeMarket",
        transactionArgs,
        config,
        errorOnFailure('closeMarket', booleanSuccessTest),
        callback);
}

/**
 * Returns market_hashes for given event_hashes
 * @param marketAddress
 * @param eventHashes
 * @param config
 * @param callback
 * @returns {Promise|Promise<T>}
 */
export function getMarketHashes(eventHashes, investors, config, ...args) {
    const callback = args.pop();
    let marketAddress = args.pop();

    if(!marketAddress){
        marketAddress = config.addresses.defaultMarketFactory;
    }
    const contractInstance = config.web3.eth.contract(abi.marketFactory).at(marketAddress);
    return requestWithBlockNumber(
        contractInstance.getMarketHashes,
        eventHashes,
        investors,
        'latest',
        callback);
}

export function getMarketHashesProcessed(eventHashes, investors, config, marketAddress) {
    if(!marketAddress){
        marketAddress = config.addresses.defaultMarketFactory;
    }
    return new Promise((resolve, reject) => {
        getMarketHashes(eventHashes, investors, config, marketAddress, promiseCallback(resolve, reject)).call();
    })
    .then((marketHashesResponse) => {
        return new Promise((resolve, reject) => {
            let marketHashes = [];
            if(marketHashesResponse.length > 2) {
                let index = 2;
                while (index < marketHashesResponse.length)
                    {
                        let currentEventHash = hex.encode(marketHashesResponse[index - 2], 256);
                        let numHashes = marketHashesResponse[index - 1].toNumber();
                        for (var offset = 0; offset < numHashes; offset++)
                            {
                                // We add a new entry on state.markets for each marketHash, with its respective event
                                let marketHash = hex.encode(marketHashesResponse[index + offset], 256);
                                marketHashes.push(marketHash);

                            }
                        index += numHashes + 2;
                    }
            }
            resolve(marketHashes);
        });
    });
}

/**
 * Returns Market Object stored on MarketContract identified by market_hash
 * @param marketHash
 * @param config
 * @returns {Promise|Promise<T>}
 */
export function getMarket(marketHash, config, ...args) {
    const callback = args.pop();
    let marketAddress = args.pop();

    if(!marketAddress){
        marketAddress = config.addresses.defaultMarketFactory;
    }
    const contractInstance = config.web3.eth.contract(abi.marketFactory).at(marketAddress);
    return requestWithBlockNumber(
        contractInstance.getMarket,
        marketHash,
        'latest',
        callback);
}

export function getMarkets(marketHashes, config, ...args) {
    const callback = args.pop();
    let marketAddress = args.pop();
    let investorAddress = args.pop();

    if(!marketAddress){
        marketAddress = config.addresses.defaultMarketFactory;
    }
    if(!investorAddress){
        investorAddress = config.addressFilters.investor;
    }

    const contractInstance = config.web3.eth.contract(abi.marketFactory).at(marketAddress);
    return requestWithBlockNumber(
        contractInstance.getMarkets,
        marketHashes,
        investorAddress,
        'latest',
        callback);
}

export function getMarketsProcessed(marketHashes, config, ...args) {
    let marketAddress = args.pop();
    let investorAddress = args.pop();

    if(!marketAddress){
        marketAddress = config.addresses.defaultMarketFactory;
    }
    if(!investorAddress){
        investorAddress = config.addressFilters.investor;
    }
    return new Promise((resolve, reject) => {
        getMarkets(marketHashes, config, investorAddress, marketAddress, promiseCallback(resolve, reject)).call();
    }).then((contractData) => {
        return new Promise((resolve, reject) => {
            const markets = {};
            let marketIndex = 0;
            while (marketIndex < contractData.length) {
                if (contractData[marketIndex].equals(0)) {
                    break;
                }
                const marketHash = hex.encode(contractData[marketIndex], 256);
                const eventHash = hex.encode(contractData[marketIndex + 1], 256);
                const outcomeCount = contractData[marketIndex + 8].toNumber();
                const marketShares = contractData.slice(
                    marketIndex + 9, marketIndex + 9 + outcomeCount);
                const initialFunding = contractData[marketIndex + 4];

                markets[marketHash] = {
                    marketHash: marketHash,
                    eventHash: eventHash,
                    fee: contractData[marketIndex + 2],
                    collectedFees: contractData[marketIndex + 3],
                    initialFunding: initialFunding,
                    investorAddress: hex.encode(contractData[marketIndex + 5], 160),
                    makerAddress: hex.encode(contractData[marketIndex + 6], 160),
                    createdAtBlock: hex.encode(contractData[marketIndex + 7]),
                    shares: marketShares,
                    outcomeCount: outcomeCount
                };

                marketIndex += 9 + outcomeCount;
            }
            resolve(markets);
        });
    });
}

export function withdrawFees(marketHash, config, ...args) {
    let callback, marketAddress;

    callback = args.pop();
    marketAddress = args.pop();

    if(!marketAddress){
        marketAddress = config.addresses.defaultMarketFactory;
    }
    const contractInstance = config.web3.eth.contract(abi.marketFactory).at(marketAddress);
    const transactionArgs = [
        marketHash,
        txDefaults(config),
    ];

    return callAndSendTransaction(
        contractInstance.withdrawFees,
        "withdrawFees",
        transactionArgs,
        config,
        errorOnFailure('withdrawFees'),
        callback);

}

export function getShareDistribution(marketHash, blockNumber, config, ...args) {
    const callback = args.pop();
    let marketAddress = args.pop();

    if(!marketAddress){
        marketAddress = config.addresses.defaultMarketFactory;
    }
    const contractInstance = config.web3.eth.contract(abi.marketFactory).at(marketAddress);
    return requestWithBlockNumber(
        contractInstance.getShareDistribution,
        marketHash,
        blockNumber,
        callback);
}

export function getShareDistributionWithTimestamp(marketHash, blockNumber, config, ...args) {
    const callback = args.pop();
    let marketAddress = args.pop();

    if(!marketAddress){
        marketAddress = config.addresses.defaultMarketFactory;
    }
    const contractInstance = config.web3.eth.contract(abi.marketFactory).at(marketAddress);
    return requestWithBlockNumber(
        contractInstance.getShareDistributionWithTimestamp,
        marketHash,
        blockNumber,
        callback);
}

/**
 * Buy outcome shares from the given market maker.
 * NOTE: numShares must be at least 1/10,000th of the initial funding. See
 * @param marketHash
 * @param outcomeIndex
 * @param numShares
 * @param maxTotalPrice
 * @param config
 * @param marketAddress
 * @param callback
 * @returns {Promise<TResult>|Promise.<T>}
 */
export function buyShares(marketHash, outcomeIndex, numShares, maxTotalPrice, config, ...args) {
    let callback, marketAddress;

    callback = args.pop();
    marketAddress = args.pop();

    if(!marketAddress){
        marketAddress = config.addresses.defaultMarketFactory;
    }
    const contractInstance = config.web3.eth.contract(abi.marketFactory).at(marketAddress);

    const transactionArgs = [
        marketHash,
        outcomeIndex,
        numShares,
        maxTotalPrice,
        txDefaults(config),
    ];

    return callAndSendTransaction(
        contractInstance.buyShares,
        "buyShares",
        transactionArgs,
        config,
        errorOnFailure('buyShares'),
        callback);

}

/**
 * Sell outcome shares to the given market maker.
 * NOTE: numShares must be at least 1/10,000th of the initial funding. See
 * LMSRMarketMaker.calcC.
 * @return {Promise} Resolves to the transaction hash and the simulated total payment.
 */
export function sellShares(marketHash, outcomeIndex, numShares, minTotalPrice, config, ...args) {
    let callback, marketAddress;

    callback = args.pop();
    marketAddress = args.pop();

    if(!marketAddress){
        marketAddress = config.addresses.defaultMarketFactory;
    }
    const contractInstance = config.web3.eth.contract(abi.marketFactory).at(marketAddress);

    const txArgs = [
        marketHash,
        outcomeIndex,
        numShares,
        minTotalPrice,
        txDefaults(config)
    ];

    return callAndSendTransaction(
        contractInstance.sellShares,
        "sellShares",
        txArgs,
        config,
        errorOnFailure('sellShares'),
        callback
    );
}

export function calcMarketFee(marketHash, amount, config, marketAddress) {
    if(!marketAddress){
        marketAddress = config.addresses.defaultMarketFactory;
    }
    let markets = get(config).markets;

    return new Promise((resolve, reject) => {
        // Try to get information from the state first
        if (markets[marketAddress] && markets[marketAddress][marketHash]){
            resolve(markets[marketAddress][marketHash].fee);
        }
        else{
            // Market is not the state, try to get it from the blockchain
            getMarket(marketHash, config, marketAddress, (e, contractData) => {
                resolve(contractData[1]);
            });
        }
    }).then((marketFee) => {
        return amount.mul(marketFee).div(new BigNumber('1000000'));
    });
}

export function shortSellShares(marketHash, outcomeIndex, numberOfShares, moneyToEarn, config, ...args) {
    let callback, marketAddress;

    callback = args.pop();
    marketAddress = args.pop();

    if(!marketAddress){
        marketAddress = config.addresses.defaultMarketFactory;
    }
    const contractInstance = config.web3.eth.contract(abi.marketFactory).at(marketAddress);
    const transactionArgs = [
        marketHash,
        outcomeIndex,
        numberOfShares,
        moneyToEarn,
        txDefaults(config)
    ];
    return callAndSendTransaction(
        contractInstance.shortSellShares,
        "shortSellShares",
        transactionArgs,
        config,
        errorOnFailure('shortSellShares'),
        callback
    );
}
