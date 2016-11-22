'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

exports.buyTokens = buyTokens;
exports.sellTokens = sellTokens;

var _web3Batch = require('../lib/web3-batch');

var _abi = require('../abi');

var abi = _interopRequireWildcard(_abi);

var _transactions = require('../lib/transactions');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function buyTokens(value, config, callback) {
    var contractInstance = config.web3.eth.contract(abi.etherToken).at(config.addresses.etherToken);
    var args = [(0, _assign2.default)({ value: value }, (0, _transactions.txDefaults)(config))];

    var booleanSuccessTest = function booleanSuccessTest(res) {
        return res;
    };
    return (0, _transactions.callAndSendTransaction)(contractInstance.buyTokens, "buyTokens", args, config, (0, _transactions.errorOnFailure)('buyTokens', booleanSuccessTest), callback);
} /**
   * Created by denisgranha on 5/7/16.
   */

function sellTokens(count, config, callback) {
    var contractInstance = config.web3.eth.contract(abi.etherToken).at(config.addresses.etherToken);
    var args = [count, (0, _transactions.txDefaults)(config)];

    var booleanSuccessTest = function booleanSuccessTest(res) {
        return res;
    };
    return (0, _transactions.callAndSendTransaction)(contractInstance.sellTokens, "sellTokens", args, config, (0, _transactions.errorOnFailure)('sellTokens', booleanSuccessTest), callback);
}