'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.createMarket = createMarket;
exports.closeMarket = closeMarket;
exports.getMarketHashes = getMarketHashes;
exports.getMarketHashesProcessed = getMarketHashesProcessed;
exports.getMarket = getMarket;
exports.getMarkets = getMarkets;
exports.getMarketsProcessed = getMarketsProcessed;
exports.withdrawFees = withdrawFees;
exports.getShareDistribution = getShareDistribution;
exports.getShareDistributionWithTimestamp = getShareDistributionWithTimestamp;
exports.buyShares = buyShares;
exports.sellShares = sellShares;
exports.calcMarketFee = calcMarketFee;
exports.shortSellShares = shortSellShares;

var _transactions = require('../lib/transactions');

var _abi = require('../abi');

var abi = _interopRequireWildcard(_abi);

var _web3Batch = require('../lib/web3-batch');

var _callbacks = require('../lib/callbacks');

var _hex = require('../lib/hex');

var hex = _interopRequireWildcard(_hex);

var _constants = require('../constants');

var constants = _interopRequireWildcard(_constants);

var _state = require('../state');

var _bignumber = require('bignumber.js');

var _bignumber2 = _interopRequireDefault(_bignumber);

var _eventFactory = require('./event-factory');

var _co = require('co');

var _co2 = _interopRequireDefault(_co);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Create a market for the event on chain.
 * @return {Promise}  Resolves to an object containing the market hash and transaction hash of the sent transaction.
 */
/**
 * Created by denisgranha on 8/4/16.
 */

function createMarket(market, eventHash, config) {
    var callback = void 0,
        marketAddress = void 0;

    for (var _len = arguments.length, args = Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
        args[_key - 3] = arguments[_key];
    }

    if (args.length > 0) {
        callback = args.pop();
    }

    marketAddress = args.pop();

    if (!marketAddress) {
        marketAddress = config.addresses.defaultMarketFactory;
    }
    var contractInstance = config.web3.eth.contract(abi.marketFactory).at(marketAddress);

    var transactionArgs = [eventHash, market.fee, market.initialFunding, market.makerAddress, (0, _transactions.txDefaults)(config)];

    return (0, _transactions.callAndSendTransaction)(contractInstance.createMarket, "createMarket", transactionArgs, config, (0, _transactions.errorOnFailure)('createMarket'), callback);
}

/**
 * Sends a transaction to the Market Contract in order to close a previosly created market
 * @param marketAddress
 * @param marketHash
 * @param config
 * @param callback
 * @returns {*}
 */
function closeMarket(marketHash, config) {
    var callback = void 0,
        marketAddress = void 0;

    for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
        args[_key2 - 2] = arguments[_key2];
    }

    callback = args.pop();
    marketAddress = args.pop();

    if (!marketAddress) {
        marketAddress = config.addresses.defaultMarketFactory;
    }
    var contractInstance = config.web3.eth.contract(abi.marketFactory).at(marketAddress);
    var transactionArgs = [marketHash, (0, _transactions.txDefaults)(config)];

    var booleanSuccessTest = function booleanSuccessTest(res) {
        return res;
    };
    return (0, _transactions.callAndSendTransaction)(contractInstance.closeMarket, "closeMarket", transactionArgs, config, (0, _transactions.errorOnFailure)('closeMarket', booleanSuccessTest), callback);
}

/**
 * Returns market_hashes for given event_hashes
 * @param marketAddress
 * @param eventHashes
 * @param config
 * @param callback
 * @returns {Promise|Promise<T>}
 */
function getMarketHashes(eventHashes, investors, config) {
    for (var _len3 = arguments.length, args = Array(_len3 > 3 ? _len3 - 3 : 0), _key3 = 3; _key3 < _len3; _key3++) {
        args[_key3 - 3] = arguments[_key3];
    }

    var callback = args.pop();
    var marketAddress = args.pop();

    if (!marketAddress) {
        marketAddress = config.addresses.defaultMarketFactory;
    }
    var contractInstance = config.web3.eth.contract(abi.marketFactory).at(marketAddress);
    return (0, _web3Batch.requestWithBlockNumber)(contractInstance.getMarketHashes, eventHashes, investors, 'latest', callback);
}

function getMarketHashesProcessed(eventHashes, investors, config, marketAddress) {
    if (!marketAddress) {
        marketAddress = config.addresses.defaultMarketFactory;
    }
    return new _promise2.default(function (resolve, reject) {
        getMarketHashes(eventHashes, investors, config, marketAddress, (0, _callbacks.promiseCallback)(resolve, reject)).call();
    }).then(function (marketHashesResponse) {
        return new _promise2.default(function (resolve, reject) {
            var marketHashes = [];
            if (marketHashesResponse.length > 2) {
                var index = 2;
                while (index < marketHashesResponse.length) {
                    var currentEventHash = hex.encode(marketHashesResponse[index - 2], 256);
                    var numHashes = marketHashesResponse[index - 1].toNumber();
                    for (var offset = 0; offset < numHashes; offset++) {
                        // We add a new entry on state.markets for each marketHash, with its respective event
                        var marketHash = hex.encode(marketHashesResponse[index + offset], 256);
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
function getMarket(marketHash, config) {
    for (var _len4 = arguments.length, args = Array(_len4 > 2 ? _len4 - 2 : 0), _key4 = 2; _key4 < _len4; _key4++) {
        args[_key4 - 2] = arguments[_key4];
    }

    var callback = args.pop();
    var marketAddress = args.pop();

    if (!marketAddress) {
        marketAddress = config.addresses.defaultMarketFactory;
    }
    var contractInstance = config.web3.eth.contract(abi.marketFactory).at(marketAddress);
    return (0, _web3Batch.requestWithBlockNumber)(contractInstance.getMarket, marketHash, 'latest', callback);
}

function getMarkets(marketHashes, config) {
    for (var _len5 = arguments.length, args = Array(_len5 > 2 ? _len5 - 2 : 0), _key5 = 2; _key5 < _len5; _key5++) {
        args[_key5 - 2] = arguments[_key5];
    }

    var callback = args.pop();
    var marketAddress = args.pop();
    var investorAddress = args.pop();

    if (!marketAddress) {
        marketAddress = config.addresses.defaultMarketFactory;
    }
    if (!investorAddress) {
        investorAddress = config.addressFilters.investor;
    }

    var contractInstance = config.web3.eth.contract(abi.marketFactory).at(marketAddress);
    return (0, _web3Batch.requestWithBlockNumber)(contractInstance.getMarkets, marketHashes, investorAddress, 'latest', callback);
}

function getMarketsProcessed(marketHashes, config) {
    for (var _len6 = arguments.length, args = Array(_len6 > 2 ? _len6 - 2 : 0), _key6 = 2; _key6 < _len6; _key6++) {
        args[_key6 - 2] = arguments[_key6];
    }

    var marketAddress = args.pop();
    var investorAddress = args.pop();

    if (!marketAddress) {
        marketAddress = config.addresses.defaultMarketFactory;
    }
    if (!investorAddress) {
        investorAddress = config.addressFilters.investor;
    }
    return new _promise2.default(function (resolve, reject) {
        getMarkets(marketHashes, config, investorAddress, marketAddress, (0, _callbacks.promiseCallback)(resolve, reject)).call();
    }).then(function (contractData) {
        return new _promise2.default(function (resolve, reject) {
            var markets = {};
            var marketIndex = 0;
            while (marketIndex < contractData.length) {
                if (contractData[marketIndex].equals(0)) {
                    break;
                }
                var marketHash = hex.encode(contractData[marketIndex], 256);
                var eventHash = hex.encode(contractData[marketIndex + 1], 256);
                var outcomeCount = contractData[marketIndex + 8].toNumber();
                var marketShares = contractData.slice(marketIndex + 9, marketIndex + 9 + outcomeCount);
                var initialFunding = contractData[marketIndex + 4];

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

function withdrawFees(marketHash, config) {
    var callback = void 0,
        marketAddress = void 0;

    for (var _len7 = arguments.length, args = Array(_len7 > 2 ? _len7 - 2 : 0), _key7 = 2; _key7 < _len7; _key7++) {
        args[_key7 - 2] = arguments[_key7];
    }

    callback = args.pop();
    marketAddress = args.pop();

    if (!marketAddress) {
        marketAddress = config.addresses.defaultMarketFactory;
    }
    var contractInstance = config.web3.eth.contract(abi.marketFactory).at(marketAddress);
    var transactionArgs = [marketHash, (0, _transactions.txDefaults)(config)];

    return (0, _transactions.callAndSendTransaction)(contractInstance.withdrawFees, "withdrawFees", transactionArgs, config, (0, _transactions.errorOnFailure)('withdrawFees'), callback);
}

function getShareDistribution(marketHash, blockNumber, config) {
    for (var _len8 = arguments.length, args = Array(_len8 > 3 ? _len8 - 3 : 0), _key8 = 3; _key8 < _len8; _key8++) {
        args[_key8 - 3] = arguments[_key8];
    }

    var callback = args.pop();
    var marketAddress = args.pop();

    if (!marketAddress) {
        marketAddress = config.addresses.defaultMarketFactory;
    }
    var contractInstance = config.web3.eth.contract(abi.marketFactory).at(marketAddress);
    return (0, _web3Batch.requestWithBlockNumber)(contractInstance.getShareDistribution, marketHash, blockNumber, callback);
}

function getShareDistributionWithTimestamp(marketHash, blockNumber, config) {
    for (var _len9 = arguments.length, args = Array(_len9 > 3 ? _len9 - 3 : 0), _key9 = 3; _key9 < _len9; _key9++) {
        args[_key9 - 3] = arguments[_key9];
    }

    var callback = args.pop();
    var marketAddress = args.pop();

    if (!marketAddress) {
        marketAddress = config.addresses.defaultMarketFactory;
    }
    var contractInstance = config.web3.eth.contract(abi.marketFactory).at(marketAddress);
    return (0, _web3Batch.requestWithBlockNumber)(contractInstance.getShareDistributionWithTimestamp, marketHash, blockNumber, callback);
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
function buyShares(marketHash, outcomeIndex, numShares, maxTotalPrice, config) {
    var callback = void 0,
        marketAddress = void 0;

    for (var _len10 = arguments.length, args = Array(_len10 > 5 ? _len10 - 5 : 0), _key10 = 5; _key10 < _len10; _key10++) {
        args[_key10 - 5] = arguments[_key10];
    }

    callback = args.pop();
    marketAddress = args.pop();

    if (!marketAddress) {
        marketAddress = config.addresses.defaultMarketFactory;
    }
    var contractInstance = config.web3.eth.contract(abi.marketFactory).at(marketAddress);

    var transactionArgs = [marketHash, outcomeIndex, numShares, maxTotalPrice, (0, _transactions.txDefaults)(config)];

    return (0, _transactions.callAndSendTransaction)(contractInstance.buyShares, "buyShares", transactionArgs, config, (0, _transactions.errorOnFailure)('buyShares'), callback);
}

/**
 * Sell outcome shares to the given market maker.
 * NOTE: numShares must be at least 1/10,000th of the initial funding. See
 * LMSRMarketMaker.calcC.
 * @return {Promise} Resolves to the transaction hash and the simulated total payment.
 */
function sellShares(marketHash, outcomeIndex, numShares, minTotalPrice, config) {
    var callback = void 0,
        marketAddress = void 0;

    for (var _len11 = arguments.length, args = Array(_len11 > 5 ? _len11 - 5 : 0), _key11 = 5; _key11 < _len11; _key11++) {
        args[_key11 - 5] = arguments[_key11];
    }

    callback = args.pop();
    marketAddress = args.pop();

    if (!marketAddress) {
        marketAddress = config.addresses.defaultMarketFactory;
    }
    var contractInstance = config.web3.eth.contract(abi.marketFactory).at(marketAddress);

    var txArgs = [marketHash, outcomeIndex, numShares, minTotalPrice, (0, _transactions.txDefaults)(config)];

    return (0, _transactions.callAndSendTransaction)(contractInstance.sellShares, "sellShares", txArgs, config, (0, _transactions.errorOnFailure)('sellShares'), callback);
}

function calcMarketFee(marketHash, amount, config, marketAddress) {
    if (!marketAddress) {
        marketAddress = config.addresses.defaultMarketFactory;
    }
    var markets = (0, _state.get)(config).markets;

    return new _promise2.default(function (resolve, reject) {
        // Try to get information from the state first
        if (markets[marketAddress] && markets[marketAddress][marketHash]) {
            resolve(markets[marketAddress][marketHash].fee);
        } else {
            // Market is not the state, try to get it from the blockchain
            getMarket(marketHash, config, marketAddress, function (e, contractData) {
                resolve(contractData[1]);
            });
        }
    }).then(function (marketFee) {
        return amount.mul(marketFee).div(new _bignumber2.default('1000000'));
    });
}

function shortSellShares(marketHash, outcomeIndex, numberOfShares, moneyToEarn, config) {
    var callback = void 0,
        marketAddress = void 0;

    for (var _len12 = arguments.length, args = Array(_len12 > 5 ? _len12 - 5 : 0), _key12 = 5; _key12 < _len12; _key12++) {
        args[_key12 - 5] = arguments[_key12];
    }

    callback = args.pop();
    marketAddress = args.pop();

    if (!marketAddress) {
        marketAddress = config.addresses.defaultMarketFactory;
    }
    var contractInstance = config.web3.eth.contract(abi.marketFactory).at(marketAddress);
    var transactionArgs = [marketHash, outcomeIndex, numberOfShares, moneyToEarn, (0, _transactions.txDefaults)(config)];
    return (0, _transactions.callAndSendTransaction)(contractInstance.shortSellShares, "shortSellShares", transactionArgs, config, (0, _transactions.errorOnFailure)('shortSellShares'), callback);
}