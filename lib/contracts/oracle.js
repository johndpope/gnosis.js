'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.isOutcomeSet = isOutcomeSet;
exports.getOutcome = getOutcome;
exports.getOffChainFee = getOffChainFee;
exports.getFee = getFee;
exports.getEventData = getEventData;
exports.registerEvent = registerEvent;

var _abi = require('../abi');

var abi = _interopRequireWildcard(_abi);

var _crypto = require('../lib/crypto');

var crypto = _interopRequireWildcard(_crypto);

var _hex = require('../lib/hex');

var hex = _interopRequireWildcard(_hex);

var _transactions = require('../lib/transactions');

var _web3Batch = require('../lib/web3-batch');

var _callbacks = require('../lib/callbacks');

var _bignumber = require('bignumber.js');

var _bignumber2 = _interopRequireDefault(_bignumber);

var _helpers = require('../helpers');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _ethLightwallet = require('eth-lightwallet');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

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
/**
 * Created by denisgranha on 8/4/16.
 */
function isOutcomeSet(resolverAddress, eventIdentifier, config, callback) {
    var contractInstance = config.web3.eth.contract(abi.oracle).at(resolverAddress);

    return (0, _web3Batch.requestWithBlockNumber)(contractInstance.isOutcomeSet, eventIdentifier, 'latest', callback);
}

/**
 * Gets the current outcome for an event if it's already resolved
 * @param resolverAddress oracle contract address
 * @param eventIdentifier
 * @param config
 * @param callback
 * @returns {Promise|Promise<T>}
 */
function getOutcome(resolverAddress, eventIdentifier, config, callback) {
    var contractInstance = config.web3.eth.contract(abi.oracle).at(resolverAddress);

    return (0, _web3Batch.requestWithBlockNumber)(contractInstance.getOutcome, eventIdentifier, 'latest', callback);
}

function getOffChainFee(descriptionHash, feeSignatures) {
    var eventFee = feeSignatures.reduce(function (acc, fee) {
        var v = new Buffer(new _bignumber2.default(fee.v).toString(16), 'hex');
        var r = new Buffer(hex.encode(new _bignumber2.default(fee.r), 256).slice(2), 'hex');
        var s = new Buffer(hex.encode(new _bignumber2.default(fee.s), 256).slice(2), 'hex');

        var address = '0x' + _ethLightwallet.signing.recoverAddress(descriptionHash + hex.encode(fee.fee, 256).slice(2), v, r, s).toString('hex');

        if (address == fee.address) {
            // Check feeSignature
            return fee.fee.add(new _bignumber2.default(acc));
        } else {
            return acc;
        }
    }, new _bignumber2.default(0));

    return eventFee;
}

function getFee(resolverAddress, validationData, config, callback) {
    var contractInstance = config.web3.eth.contract(abi.oracle).at(resolverAddress);

    return (0, _web3Batch.requestWithBlockNumber)(contractInstance.getFee, validationData, 'latest', callback);
}

function getEventData(resolverAddress, eventIdentifier, config, callback) {
    var contractInstance = config.web3.eth.contract(abi.oracle).at(resolverAddress);

    return (0, _web3Batch.requestWithBlockNumber)(contractInstance.getEventData, eventIdentifier, 'latest', callback);
}

function registerEvent(resolverAddress, eventData, config, callback) {
    var contractInstance = config.web3.eth.contract(abi.oracle).at(resolverAddress);

    var args = [eventData, (0, _transactions.txDefaults)(config)];

    var booleanSuccessTest = function booleanSuccessTest(res) {
        return res;
    };
    return (0, _transactions.callAndSendTransaction)(contractInstance.registerEvent, "registerEvent", args, config, (0, _transactions.errorOnFailure)('registerEvent', booleanSuccessTest), callback);
}