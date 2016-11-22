'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.getOracleOutcomes = getOracleOutcomes;
exports.challengeOracle = challengeOracle;
exports.getShares = getShares;
exports.setUltimateOutcome = setUltimateOutcome;
exports.voteForUltimateOutcome = voteForUltimateOutcome;
exports.getUltimateOutcomes = getUltimateOutcomes;
exports.redeemWinnings = redeemWinnings;
exports.setOutcome = setOutcome;
exports.setOutcomeWithSignature = setOutcomeWithSignature;

var _transactions = require('../lib/transactions');

var _callbacks = require('../lib/callbacks');

var _web3Batch = require('../lib/web3-batch');

var _abi = require('../abi');

var abi = _interopRequireWildcard(_abi);

var _bignumber = require('bignumber.js');

var _bignumber2 = _interopRequireDefault(_bignumber);

var _helpers = require('../helpers');

var _hex = require('../lib/hex');

var hex = _interopRequireWildcard(_hex);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Created by denisgranha on 8/4/16.
 */
function getOracleOutcomes(descriptionHashes, oracleAddresses, config, callback) {
  var contractInstance = config.web3.eth.contract(abi.ultimateOracle).at(config.addresses.ultimateOracle);
  return (0, _web3Batch.requestWithBlockNumber)(contractInstance.getOracleOutcomes, descriptionHashes, oracleAddresses, 'latest', callback);
}

function challengeOracle(descriptionHash, oracle, outcome, config, callback) {
  var contractInstance = config.web3.eth.contract(abi.ultimateOracle).at(config.addresses.ultimateOracle);

  var args = [descriptionHash, oracle, outcome, (0, _transactions.txDefaults)(config)];

  var booleanSuccessTest = function booleanSuccessTest(res) {
    return res;
  };
  return (0, _transactions.callAndSendTransaction)(contractInstance.challengeOracle, "challengeOracle", args, config, (0, _transactions.errorOnFailure)('challengeOracle', booleanSuccessTest), callback);
}

function getShares(forAddress, descriptionHashes, outcomes, config, callback) {
  var contractInstance = config.web3.eth.contract(abi.ultimateOracle).at(config.addresses.ultimateOracle);
  return (0, _web3Batch.requestWithBlockNumber)(contractInstance.getShares, forAddress, descriptionHashes, outcomes, 'latest', callback);
}

function setUltimateOutcome(descriptionHash, config, callback) {
  var contractInstance = config.web3.eth.contract(abi.ultimateOracle).at(config.addresses.ultimateOracle);

  var args = [descriptionHash, (0, _transactions.txDefaults)(config)];

  var booleanSuccessTest = function booleanSuccessTest(res) {
    return res;
  };
  return (0, _transactions.callAndSendTransaction)(contractInstance.setUltimateOutcome, "setUltimateOutcome", args, config, (0, _transactions.errorOnFailure)('setUltimateOutcome', booleanSuccessTest), callback);
}

function voteForUltimateOutcome(descriptionHash, outcome, voteValue, config, callback) {
  var contractInstance = config.web3.eth.contract(abi.ultimateOracle).at(config.addresses.ultimateOracle);

  var args = [descriptionHash, outcome, voteValue, (0, _transactions.txDefaults)(config)];

  var booleanSuccessTest = function booleanSuccessTest(res) {
    return res;
  };
  return (0, _transactions.callAndSendTransaction)(contractInstance.voteForUltimateOutcome, "voteForUltimateOutcome", args, config, (0, _transactions.errorOnFailure)('voteForUltimateOutcome', booleanSuccessTest), callback);
}

function getUltimateOutcomes(descriptionHashes, outcomes, config, callback) {
  var contractInstance = config.web3.eth.contract(abi.ultimateOracle).at(config.addresses.ultimateOracle);
  return (0, _web3Batch.requestWithBlockNumber)(contractInstance.getUltimateOutcomes, descriptionHashes, outcomes, 'latest', callback);
}

function redeemWinnings(descriptionHash, config, callback) {
  var contractInstance = config.web3.eth.contract(abi.ultimateOracle).at(config.addresses.ultimateOracle);

  var args = [descriptionHash, (0, _transactions.txDefaults)(config)];

  var booleanSuccessTest = function booleanSuccessTest(res) {
    return res;
  };
  return (0, _transactions.callAndSendTransaction)(contractInstance.redeemWinnings, "redeemWinnings", args, config, (0, _transactions.errorOnFailure)('redeemWinnings', booleanSuccessTest), callback);
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
function setOutcome(eventIdentifier, descriptionHash, outcomeIndex, oracleAddress, config, callback) {
  var contractInstance = config.web3.eth.contract(abi.ultimateOracle).at(config.addresses.ultimateOracle);
  return new _promise2.default(function (resolve, reject) {
    config.web3.eth.sign(oracleAddress, (0, _helpers.outcomeHash)(descriptionHash, outcomeIndex), (0, _callbacks.promiseCallback)(resolve, reject));
  }).then(function (signature) {
    var decodedSignature = (0, _helpers.decodeSignature)(signature);
    var outcomeData = [outcomeIndex, decodedSignature.v, decodedSignature.r, decodedSignature.s];
    var args = [eventIdentifier, outcomeData.map(function (int) {
      return hex.encode(int, 256);
    }), (0, _transactions.txDefaults)(config)];
    var booleanSuccessTest = function booleanSuccessTest(res) {
      return res;
    };
    return (0, _transactions.callAndSendTransaction)(contractInstance.setOutcome, "setOutcome", args, config, (0, _transactions.errorOnFailure)('setOutcome', booleanSuccessTest), callback);
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
function setOutcomeWithSignature(eventIdentifier, signatures, config, callback) {
  var contractInstance = config.web3.eth.contract(abi.ultimateOracle).at(config.addresses.ultimateOracle);
  var outcomeData = _lodash2.default.flatten(signatures.map(function (signature) {
    return [signature.outcomeIndex, signature.v, signature.r, signature.s];
  }));
  var args = [eventIdentifier, outcomeData.map(function (int) {
    return hex.encode(int, 256);
  }), (0, _transactions.txDefaults)(config)];
  var booleanSuccessTest = function booleanSuccessTest(res) {
    return res;
  };
  return (0, _transactions.callAndSendTransaction)(contractInstance.setOutcome, "setOutcomeWithSignature", args, config, (0, _transactions.errorOnFailure)('setOutcomeWithSignature', booleanSuccessTest), callback);
}