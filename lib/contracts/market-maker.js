'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.calcCostsBuying = calcCostsBuying;
exports.calcCostsBuyingWithFees = calcCostsBuyingWithFees;
exports.calcEarningsSelling = calcEarningsSelling;
exports.calcEarningsSellingWithFees = calcEarningsSellingWithFees;

var _abi = require('../abi');

var abi = _interopRequireWildcard(_abi);

var _web3Batch = require('../lib/web3-batch');

var _eventFactory = require('./event-factory');

var eventFactory = _interopRequireWildcard(_eventFactory);

var _marketFactory = require('./market-factory');

var marketFactory = _interopRequireWildcard(_marketFactory);

var _marketMaker = require('../market-maker');

var marketMaker = _interopRequireWildcard(_marketMaker);

var _state = require('../state');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// if LMSR makerAddress
// use javascript implementation
/**
 * Created by denisgranha on 8/4/16.
 */
function calcCostsBuying(marketHash, initialFunding, shareDistribution, outcomeIndex, numberOfShares, config) {
    for (var _len = arguments.length, args = Array(_len > 6 ? _len - 6 : 0), _key = 6; _key < _len; _key++) {
        args[_key - 6] = arguments[_key];
    }

    var callback = args.pop();
    var marketMakerAddress = args.pop();

    if (!marketMakerAddress) {
        marketMakerAddress = config.addresses.defaultMarketMaker;
    }

    var contractInstance = config.web3.eth.contract(abi.marketMaker).at(marketMakerAddress);

    // If LMSR, do javascript call
    if (marketMakerAddress == config.addresses.lmsrMarketMaker) {
        return {
            call: function call() {
                callback(null, marketMaker.calcCostsBuying(initialFunding, shareDistribution, outcomeIndex, numberOfShares));
            }
        };
    } else {
        return (0, _web3Batch.requestWithBlockNumber)(contractInstance.calcCostsBuying, marketHash, initialFunding, shareDistribution, outcomeIndex, numberOfShares, 'latest', callback);
    }
}

function calcCostsBuyingWithFees(marketHash, outcomeIndex, numberOfShares, config) {
    for (var _len2 = arguments.length, args = Array(_len2 > 4 ? _len2 - 4 : 0), _key2 = 4; _key2 < _len2; _key2++) {
        args[_key2 - 4] = arguments[_key2];
    }

    var callback = args.pop();
    var marketAddress = args.pop();
    var marketMakerAddress = args.pop();

    if (!marketMakerAddress) {
        marketMakerAddress = config.addresses.defaultMarketMaker;
    }

    if (!marketAddress) {
        marketAddress = config.addresses.defaultMarketFactory;
    }

    return new _promise2.default(function (resolve, reject) {
        // get Market information initialFunding and shareDistribution
        // Try first to get it from the state
        var markets = (0, _state.get)(config).markets;
        if (markets[marketAddress] && markets[marketAddress][marketHash]) {
            var stateMarket = markets[marketAddress][marketHash];
            resolve(stateMarket);
        } else {
            // Get market info from blockchain
            marketFactory.getMarketsProcessed([marketHash], config, config.account, marketAddress).then(function (marketsProcessed) {
                if (marketsProcessed.length) {
                    resolve(marketsProcessed[0]);
                } else {
                    reject('market does not exist');
                }
            });
        }
    }).then(function (marketObject) {
        var initialFunding = marketObject.initialFunding;
        var shareDistribution = marketObject.shares;
        // get base fee
        return eventFactory.calcBaseFeeForShares(numberOfShares, config).then(function (baseFee) {
            return calcCostsBuying(marketHash, initialFunding, shareDistribution, outcomeIndex, numberOfShares, config, marketMakerAddress, function (e, costs) {
                return marketFactory.calcMarketFee(marketHash, costs, config, marketAddress).then(function (marketFee) {
                    var costsWithFees = costs.plus(baseFee).plus(marketFee);
                    if (callback) {
                        callback(null, costsWithFees);
                    } else {
                        return costsWithFees;
                    }
                });
            }).call();
        });
    });
}

// if LMSR makerAddress
// use javascript implementation
function calcEarningsSelling(marketHash, initialFunding, shareDistribution, outcome, numberOfShares, config) {
    for (var _len3 = arguments.length, args = Array(_len3 > 6 ? _len3 - 6 : 0), _key3 = 6; _key3 < _len3; _key3++) {
        args[_key3 - 6] = arguments[_key3];
    }

    var callback = args.pop();
    var marketMakerAddress = args.pop();

    if (!marketMakerAddress) {
        marketMakerAddress = config.addresses.defaultMarketMaker;
    }

    var contractInstance = config.web3.eth.contract(abi.marketMaker).at(marketMakerAddress);

    if (marketMakerAddress == config.addresses.lmsrMarketMaker) {
        return {
            call: function call() {
                callback(null, marketMaker.calcEarningsSelling(initialFunding, shareDistribution, outcome, numberOfShares));
            }
        };
    } else {
        return (0, _web3Batch.requestWithBlockNumber)(contractInstance.calcEarningsSelling, marketHash, initialFunding, shareDistribution, outcome, numberOfShares, 'latest', callback);
    }
}

function calcEarningsSellingWithFees(marketHash, outcomeIndex, numberOfShares, config) {
    for (var _len4 = arguments.length, args = Array(_len4 > 4 ? _len4 - 4 : 0), _key4 = 4; _key4 < _len4; _key4++) {
        args[_key4 - 4] = arguments[_key4];
    }

    var callback = args.pop();
    var marketAddress = args.pop();
    var marketMakerAddress = args.pop();

    if (!marketMakerAddress) {
        marketMakerAddress = config.addresses.defaultMarketMaker;
    }

    if (!marketAddress) {
        marketAddress = config.addresses.defaultMarketFactory;
    }

    return new _promise2.default(function (resolve, reject) {
        // get Market information initialFunding and shareDistribution
        // Try first to get it from the state
        var markets = (0, _state.get)(config).markets;
        if (markets[marketAddress] && markets[marketAddress][marketHash]) {
            var stateMarket = markets[marketAddress][marketHash];
            resolve(stateMarket);
        } else {
            // Get market info from blockchain
            marketFactory.getMarketsProcessed([marketHash], config, config.account, marketAddress).then(function (marketsProcessed) {
                if (marketsProcessed.length) {
                    resolve(marketsProcessed[0]);
                } else {
                    reject('market does not exist');
                }
            });
        }
    }).then(function (marketObject) {
        var initialFunding = marketObject.initialFunding;
        var shareDistribution = marketObject.shares;
        calcEarningsSelling(marketHash, initialFunding, shareDistribution, outcomeIndex, numberOfShares, config, marketMakerAddress, function (e, earnings) {
            marketFactory.calcMarketFee(marketHash, earnings, config, marketAddress).then(function (marketFee) {
                callback(null, earnings.minus(marketFee));
            });
        }).call();
    });
}

// TODO calcSharesSellingWithFees
// TODO calcSharesBuyingWithFees