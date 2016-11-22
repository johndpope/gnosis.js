'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.buyAllOutcomes = buyAllOutcomes;
exports.sellAllOutcomes = sellAllOutcomes;
exports.redeemWinnings = redeemWinnings;
exports.createOffChainEvent = createOffChainEvent;
exports.createEvent = createEvent;
exports.getEventHashes = getEventHashes;
exports.getEventHashesProcessed = getEventHashesProcessed;
exports.getEvents = getEvents;
exports.getEventsProcessed = getEventsProcessed;
exports.getEvent = getEvent;
exports.getShares = getShares;
exports.getSharesProcessed = getSharesProcessed;
exports.getBaseFee = getBaseFee;
exports.calcBaseFeeForShares = calcBaseFeeForShares;
exports.calcBaseFee = calcBaseFee;
exports.permitPermanentApproval = permitPermanentApproval;
exports.isPermanentlyApproved = isPermanentlyApproved;
exports.ensurePermanentApproval = ensurePermanentApproval;
exports.revokePermanentApproval = revokePermanentApproval;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _hex = require('../lib/hex');

var hex = _interopRequireWildcard(_hex);

var _bignumber = require('bignumber.js');

var _bignumber2 = _interopRequireDefault(_bignumber);

var _constants = require('../constants');

var constants = _interopRequireWildcard(_constants);

var _transactions = require('../lib/transactions');

var _web3Batch = require('../lib/web3-batch');

var _callbacks = require('../lib/callbacks');

var _helpers = require('../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _abi = require('../abi');

var abi = _interopRequireWildcard(_abi);

var _state = require('../state');

var _oracle = require('./oracle');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function buyAllOutcomes(eventHash, numShares, config, callback) {
  var contractInstance = config.web3.eth.contract(abi.eventFactory).at(config.addresses.eventFactory);

  var args = [eventHash, numShares, (0, _transactions.txDefaults)(config)];

  var booleanSuccessTest = function booleanSuccessTest(res) {
    return res;
  };

  return (0, _transactions.callAndSendTransaction)(contractInstance.buyAllOutcomes, "buyAllOutcomes", args, config, (0, _transactions.errorOnFailure)('buyAllOutcomes', booleanSuccessTest), callback);
} /**
   * Created by denisgranha on 8/4/16.
   */
function sellAllOutcomes(eventHash, numShares, config, callback) {
  var contractInstance = config.web3.eth.contract(abi.eventFactory).at(config.addresses.eventFactory);
  var args = [eventHash, numShares, (0, _transactions.txDefaults)(config)];
  var booleanSuccessTest = function booleanSuccessTest(res) {
    return res;
  };

  return (0, _transactions.callAndSendTransaction)(contractInstance.sellAllOutcomes, "sellAllOutcomes", args, config, (0, _transactions.errorOnFailure)('sellAllOutcomes', booleanSuccessTest), callback);
}

/**
 * Redeem shares for token after the winning outcome has been set for a market.
 */
function redeemWinnings(eventHash, config, callback) {
  var contractInstance = config.web3.eth.contract(abi.eventFactory).at(config.addresses.eventFactory);
  var args = [eventHash, (0, _transactions.txDefaults)(config)];

  return (0, _transactions.callAndSendTransaction)(contractInstance.redeemWinnings, "redeemWinnings", args, config, (0, _transactions.errorOnFailure)('redeemWinnings'), callback);
}

/**
 *
 * @param event
 * @param descriptionHash
 * @param feeSignatures
 * @param config
 * @param callback
 * @returns {Promise}
 */
function createOffChainEvent(event, descriptionHash, feeSignatures, config, callback) {
  return createEvent(event, descriptionHash, helpers.encodeFeeSignatures(feeSignatures), config, callback);
}

/**
 * Create the event on chain with metadata and fees for the ultimateOracle.
 * @return {Promise}  Resolves to an object containing the event hash and
 * transaction hash of the sent transaction.
 */
function createEvent(event, descriptionHash, validationData, config, callback) {

  var contractInstance = config.web3.eth.contract(abi.eventFactory).at(config.addresses.eventFactory);
  var bounds = { lowerBound: 0, upperBound: 0 };
  if (event.kind === constants.KIND_RANGED) {
    bounds.lowerBound = event.lowerBound;
    bounds.upperBound = event.upperBound;
  }

  var args = [descriptionHash, event.kind === constants.KIND_RANGED, bounds.lowerBound, bounds.upperBound, event.outcomeCount, event.tokenAddress, event.resolverAddress, validationData, (0, _transactions.txDefaults)(config)];

  return (0, _transactions.callAndSendTransaction)(contractInstance.createEvent, "createEvent", args, config, (0, _transactions.errorOnFailure)('createEvent'), callback);
}

/**
 * Gets the event_hashes for a given description_hashes of events
 * @param descriptionHashes
 * @param creators
 * @param config
 * @param callback
 * @returns {Promise|Promise<T>}
 */
function getEventHashes(descriptionHashes, creators, config, callback) {
  var contractInstance = config.web3.eth.contract(abi.eventFactory).at(config.addresses.eventFactory);
  return (0, _web3Batch.requestWithBlockNumber)(contractInstance.getEventHashes, descriptionHashes, creators, 'latest', callback);
}

/**
 * Returns an object of description hashes, where each description hash has a
 * collection of event hashes
 * @param descriptionHashes
 * @param creators
 * @param config
 * @returns {*}
 */
function getEventHashesProcessed(descriptionHashes, creators, config) {
  return new _promise2.default(function (resolve, reject) {
    getEventHashes(descriptionHashes, creators, config, (0, _callbacks.promiseCallback)(resolve, reject)).call();
  }).then(function (eventHashesResponse) {
    return new _promise2.default(function (resolve, reject) {
      var events = [];
      if (eventHashesResponse.length > 2) {
        var index = 2;
        while (index < eventHashesResponse.length) {
          var currentDescription = hex.encode(eventHashesResponse[index - 2]);
          var numHashes = eventHashesResponse[index - 1].toNumber();
          for (var offset = 0; offset < numHashes; offset++) {
            // We add a new entry on state.events for each eventHash, with its
            // respective description
            var eventHash = hex.encode(eventHashesResponse[index + offset], 256);
            events.push(eventHash);
          }
          index += numHashes + 2;
        }
      }
      resolve(events);
    });
  });
}

/**
 * Returns a collection of event objects stored on eventsContract identified by
 * given event_hashes
 * @param eventHashes
 * @param resolverAddress
 * @param config
 * @param callback
 * @returns {Promise|Promise<T>}
 */
function getEvents(eventHashes, resolverAddress, tokenAddress, config, callback) {
  var contractInstance = config.web3.eth.contract(abi.eventFactory).at(config.addresses.eventFactory);
  return (0, _web3Batch.requestWithBlockNumber)(contractInstance.getEvents, eventHashes, resolverAddress, tokenAddress, 'latest', callback);
}

function getEventsProcessed(eventHashes, resolverAddress, tokenAddress, config) {
  return new _promise2.default(function (resolve, reject) {
    getEvents(eventHashes, resolverAddress, tokenAddress, config, (0, _callbacks.promiseCallback)(resolve, reject)).call();
  }).then(function (contractData) {
    return new _promise2.default(function (resolve, reject) {
      // Returned array have the following structure:
      // [eventHash, descriptionHash, isRanged, lowerBound, upperBound,
      // outcomeCount, resolverAddress, tokenAddress, creatorAddress,
      // isWinningOutcomeSet, winningOutcome, eventDataLength, eventData1...,
      // eventDataN, eventHash2, descriptionHash2 ... ]
      var events = {};
      var eventIndex = 0;
      while (eventIndex < contractData.length) {
        if (contractData[eventIndex].equals(0)) {
          break;
        }

        var eventHash = hex.encode(contractData[eventIndex], 256);
        var isResolved = !contractData[eventIndex + 8].eq(0);
        var outcomeCount = contractData[eventIndex + 10].toNumber();

        // tokenAddress, currencyHash should be null if is 0x0

        events[eventHash] = {
          eventHash: eventHash,
          descriptionHash: hex.encode(contractData[eventIndex + 1], 256),
          kind: contractData[eventIndex + 2].eq(0) ? constants.KIND_DISCRETE : constants.KIND_RANGED,
          outcomeCount: outcomeCount,
          eventIdentifier: hex.encode(contractData[eventIndex + 7], 256),
          resolverAddress: hex.encode(contractData[eventIndex + 6], 160),
          tokenAddress: contractData[eventIndex + 5].eq(0) ? null : hex.encode(contractData[eventIndex + 5], 160),
          // creatorAddress: hex.encode(contractData[eventIndex + 2], 160),
          isResolved: isResolved,
          winningOutcome: isResolved ? contractData[eventIndex + 9].toNumber() : null,
          tokens: contractData.slice(eventIndex + 11, eventIndex + 11 + outcomeCount).map(function (token) {
            return hex.encode(token, 160);
          })
        };

        if (events[eventHash].kind === constants.KIND_RANGED) {
          events[eventHash].lowerBound = contractData[eventIndex + 3];
          events[eventHash].upperBound = contractData[eventIndex + 4];
        }

        eventIndex += 11 + outcomeCount;
      }

      resolve(events);
    });
  });
}

/**
 * Returns event object stored on eventsContract indentified by eventHash
 * @param eventHash
 * @param config
 * @param callback
 * @returns {requestObject}
 */
function getEvent(eventHash, config, callback) {
  var contractInstance = config.web3.eth.contract(abi.eventFactory).at(config.addresses.eventFactory);
  return (0, _web3Batch.requestWithBlockNumber)(contractInstance.getEvent, eventHash, 'latest', callback);
}

/**
 *
 * @param forAddress
 * @param eventHashes
 * @param config
 * @param callback
 * @returns {Request}
 */
function getShares(forAddress, eventHashes, config, callback) {
  var contractInstance = config.web3.eth.contract(abi.eventFactory).at(config.addresses.eventFactory);
  return (0, _web3Batch.requestWithBlockNumber)(contractInstance.getShares, forAddress, eventHashes, 'latest', callback);
}

function getSharesProcessed(forAddress, eventHashes, config) {
  return new _promise2.default(function (resolve, reject) {
    getShares(forAddress, eventHashes, config, (0, _callbacks.promiseCallback)(resolve, reject)).call();
  }).then(function (contractData) {
    return new _promise2.default(function (resolve, reject) {
      var index = 2;
      var tokens = {};
      while (index < contractData.length) {
        var currentEventHash = hex.encode(contractData[index - 2], 256);
        var currentEvent = (0, _state.get)(config).events[currentEventHash];
        var numOutcomes = contractData[index - 1].toNumber();

        for (var outcomeIndex = 0; outcomeIndex < numOutcomes; outcomeIndex++) {
          var tokenAddress = currentEvent.tokens[outcomeIndex];
          tokens[tokenAddress] = {
            value: contractData[index + outcomeIndex],
            eventHash: currentEventHash,
            outcomeIndex: outcomeIndex
          };
        }

        index += numOutcomes + 2;
      }
      resolve(tokens);
    });
  }, function (error) {
    return new _promise2.default(function (resolve, reject) {
      resolve({});
    });
  });
}

/**
 * * Returns BaseFee stored on Event Token Contract
 * @param config
 */
function getBaseFee(config, callback) {
  var contractInstance = config.web3.eth.contract(abi.eventFactory).at(config.addresses.eventFactory);
  return (0, _web3Batch.requestWithBlockNumber)(contractInstance.getBaseFee, 'latest', callback);
}

function calcBaseFeeForShares(shares, config) {
  return new _promise2.default(function (resolve, reject) {
    var contractInstance = config.web3.eth.contract(abi.eventFactory).at(config.addresses.eventFactory);
    (0, _web3Batch.requestWithBlockNumber)(contractInstance.calcBaseFeeForShares, shares, 'latest', (0, _callbacks.promiseCallback)(resolve, reject)).call();
  });
  // return new Promise((resolve, reject) =>
  // {
  //     // use the state if available
  //     let baseFee = get(config).baseFee;
  //
  //     if(baseFee){
  //         resolve(baseFee);
  //     }
  //     else{
  //         getBaseFee(config, (e, baseFee) =>
  //         {
  //             resolve(baseFee);
  //         }).call();
  //     }
  //
  // }).then((baseFee) => {
  //     return shares
  //     .mul("1000000")
  //     .div(
  //       new BigNumber("1000000").minus(baseFee)
  //     ).minus(shares);
  // });
}

function calcBaseFee(amount, config) {
  return new _promise2.default(function (resolve, reject) {
    var contractInstance = config.web3.eth.contract(abi.eventFactory).at(config.addresses.eventFactory);
    (0, _web3Batch.requestWithBlockNumber)(contractInstance.calcBaseFee, amount, 'latest', (0, _callbacks.promiseCallback)(resolve, reject)).call();
  });
  // return new Promise((resolve, reject) =>
  // {
  //     // use the state if available
  //     let baseFee = get(config).baseFee;
  //
  //     if(baseFee){
  //         resolve(baseFee);
  //     }
  //     else{
  //         getBaseFee(config, (e, baseFee) =>
  //         {
  //             resolve(baseFee);
  //         }).call();
  //     }
  // }).then((baseFee) => {
  //     return amount.mul(baseFee).div(new BigNumber("1000000")).floor();
  // });
}

function permitPermanentApproval(spender, config, callback) {
  var contractInstance = config.web3.eth.contract(abi.eventFactory).at(config.addresses.eventFactory);
  var args = [spender, (0, _transactions.txDefaults)(config)];

  var booleanSuccessTest = function booleanSuccessTest(res) {
    return res;
  };
  return (0, _transactions.callAndSendTransaction)(contractInstance.permitPermanentApproval, "permitPermanentApproval", args, config, (0, _transactions.errorOnFailure)('permitPermanentApproval', booleanSuccessTest), callback);
}

function isPermanentlyApproved(owner, spender, config, callback) {
  var contractInstance = config.web3.eth.contract(abi.eventFactory).at(config.addresses.eventFactory);

  return (0, _web3Batch.requestWithBlockNumber)(contractInstance.isPermanentlyApproved, owner, spender, 'latest', callback);
}

function ensurePermanentApproval(spender, config) {
  return new _promise2.default(function (resolve, reject) {
    isPermanentlyApproved(config.account, spender, config, (0, _callbacks.promiseCallback)(resolve, reject)).call();
  }).then(function (isPermanentlyApproved) {
    if (!isPermanentlyApproved) {
      return new _promise2.default(function (resolve, reject) {
        permitPermanentApproval(spender, config, (0, _callbacks.promiseCallback)(resolve, reject));
      });
      return true;
    }
  }).then(function (result) {
    return result;
  });
}

function revokePermanentApproval(allowedAddress, config, callback) {
  var contractInstance = config.web3.eth.contract(abi.eventFactory).at(config.addresses.eventFactory);
  var args = [allowedAddress, (0, _transactions.txDefaults)(config)];

  var booleanSuccessTest = function booleanSuccessTest(res) {
    return res;
  };
  return (0, _transactions.callAndSendTransaction)(contractInstance.revokePermanentApproval, "revokePermanentApproval", args, config, (0, _transactions.errorOnFailure)('revokePermanentApproval', booleanSuccessTest), callback);
}