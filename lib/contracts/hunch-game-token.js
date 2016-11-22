'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setup = setup;

var _transactions = require('../lib/transactions');

var _abi = require('../abi');

var abi = _interopRequireWildcard(_abi);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * Created by denisgranha on 31/10/16.
 */

function setup(config, callback) {
  var contractInstance = config.web3.eth.contract(abi.hunchGameToken).at(config.addresses.hunchGameToken);
  var args = [config.addresses.hunchGameMarketFactory, (0, _transactions.txDefaults)(config)];

  var booleanSuccessTest = function booleanSuccessTest(res) {
    return res;
  };
  return (0, _transactions.callAndSendTransaction)(contractInstance.setup, "setup", args, config, (0, _transactions.errorOnFailure)('setup', booleanSuccessTest), callback);
}