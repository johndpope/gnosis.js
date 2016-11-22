'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

exports.addCredit = addCredit;
exports.buyCredits = buyCredits;
exports.getUserLevel = getUserLevel;
exports.getLastCredit = getLastCredit;
exports.getTokensInEvents = getTokensInEvents;
exports.getHighScores = getHighScores;

var _transactions = require('../lib/transactions');

var _callbacks = require('../lib/callbacks');

var _web3Batch = require('../lib/web3-batch');

var _co = require('co');

var _co2 = _interopRequireDefault(_co);

var _abi = require('../abi');

var abi = _interopRequireWildcard(_abi);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function addCredit(config, callback) {
    var contractInstance = config.web3.eth.contract(abi.hunchGameMarketFactory).at(config.addresses.hunchGameMarketFactory);
    var args = [(0, _transactions.txDefaults)(config)];

    var booleanSuccessTest = function booleanSuccessTest(res) {
        return res;
    };
    return (0, _transactions.callAndSendTransaction)(contractInstance.addCredit, "addCredit", args, config, (0, _transactions.errorOnFailure)('addCredit', booleanSuccessTest), callback);
}

/**
 * Buy Hunch Game tokens. One wei buys 10,000 of the base unit.
 */
/**
 * Created by denisgranha on 8/4/16.
 */

function buyCredits(spend, config, callback) {
    var contractInstance = config.web3.eth.contract(abi.hunchGameMarketFactory).at(config.addresses.hunchGameMarketFactory);
    var args = [(0, _assign2.default)({ value: spend }, (0, _transactions.txDefaults)(config))];

    var booleanSuccessTest = function booleanSuccessTest(res) {
        return res;
    };
    return (0, _transactions.callAndSendTransaction)(contractInstance.buyCredits, "buyCredits", args, config, (0, _transactions.errorOnFailure)('buyCredits', booleanSuccessTest), callback);
}

function getUserLevel(config, address, callback) {
    var contractInstance = config.web3.eth.contract(abi.hunchGameMarketFactory).at(config.addresses.hunchGameMarketFactory);
    return (0, _web3Batch.requestWithBlockNumber)(contractInstance.userLevel, address, 'latest', callback);
}

/**
 * Returns timestamp of last free credit of user
 * @param config
 * @param address
 * @param callback
 * @returns {Promise|Promise<T>}
 */
function getLastCredit(config, address, callback) {
    var contractInstance = config.web3.eth.contract(abi.hunchGameMarketFactory).at(config.addresses.hunchGameMarketFactory);
    return (0, _web3Batch.requestWithBlockNumber)(contractInstance.getLastCredit, address, 'latest', callback);
}

/**
 * * Returns amount of tokens in given events
 * @param forAddress
 * @param eventHashes
 * @param config
 * @param callback
 * @returns {Request}
 */
function getTokensInEvents(forAddress, eventHashes, config, callback) {
    var contractInstance = config.web3.eth.contract(abi.hunchGameMarketFactory).at(config.addresses.hunchGameMarketFactory);
    return (0, _web3Batch.requestWithBlockNumber)(contractInstance.getTokensInEvents, forAddress, eventHashes, 'latest', callback);
}

function getHighScores(userAddresses, config, callback) {
    var contractInstance = config.web3.eth.contract(abi.hunchGameMarketFactory).at(config.addresses.hunchGameMarketFactory);
    return (0, _web3Batch.requestWithBlockNumber)(contractInstance.getHighScores, userAddresses, 'latest', callback);
}