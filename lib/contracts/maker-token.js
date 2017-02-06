'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

exports.deposit = deposit;
exports.withdraw = withdraw;

var _abi = require('../abi');

var abi = _interopRequireWildcard(_abi);

var _transactions = require('../lib/transactions');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Created by denisgranha on 06/02/16.
 */
function deposit(value, config, callback) {
  var contractInstance = config.web3.eth.contract(abi.makerToken).at(config.addresses.makerToken);
  var args = [(0, _assign2.default)({ value: value }, (0, _transactions.txDefaults)(config))];

  var booleanSuccessTest = function booleanSuccessTest(res) {
    return res;
  };
  return (0, _transactions.callAndSendTransaction)(contractInstance.deposit, 'buyTokens', args, config, (0, _transactions.errorOnFailure)('buyTokens', booleanSuccessTest), callback);
}

function withdraw(count, config, callback) {
  var contractInstance = config.web3.eth.contract(abi.makerToken).at(config.addresses.makerToken);
  var args = [count, (0, _transactions.txDefaults)(config)];

  var booleanSuccessTest = function booleanSuccessTest(res) {
    return res;
  };
  return (0, _transactions.callAndSendTransaction)(contractInstance.withdraw, 'sellTokens', args, config, (0, _transactions.errorOnFailure)('sellTokens', booleanSuccessTest), callback);
}