'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Batcher = undefined;

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

exports.requestWithBlockNumber = requestWithBlockNumber;

var _formatters = require('web3/lib/web3/formatters');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * When you're batching asynchronous RPC calls, you want the batch to be
 * executed once you're done batching up calls. But when the batching is being
 * done in several callbacks, how do you know when you're done? You'd have to
 * maintain some state somewhere to figure out when to actually fire off the batch.
 *
 * That state is already being maintained for you on the event loop. When a
 * response arrives and your callbacks are fired, those callbacks will send off
 * new requests and return. Your callbacks are done once they all return and
 * control is yielded to the event loop. You want your batch to be executed then.
 */

/**
 * Creates new batches after old ones have been sent, and queues batch execution
 * on the event loop every time a new batch is created. If your callbacks call
 * `add` on the same Batcher, your RPC calls will automatically be batched
 * into as few requests as possible.
 */
var Batcher = exports.Batcher = function () {
  function Batcher(config) {
    (0, _classCallCheck3.default)(this, Batcher);

    this.config = config;
    this._clear();
  }

  (0, _createClass3.default)(Batcher, [{
    key: '_clear',
    value: function _clear() {
      this.batch = this.config.web3.createBatch();
      this.pending = false;
    }
  }, {
    key: 'add',
    value: function add(request) {
      var _this = this;

      this.batch.add(request);

      if (!this.pending) {
        setTimeout(function () {
          return _this._execute();
        }, 0);
        this.pending = true;
      }
    }
  }, {
    key: '_execute',
    value: function _execute() {
      this.batch.execute();
      this._clear();
    }
  }]);
  return Batcher;
}();

/**
 * Construct a request for batching that calls a function at a given block
 * number. Web3's SolidityFunction.prototype.request makes this impossible,
 * so we wrap it.
 * @param  {SolidityFunction} contractFunction
 * @param  {Object} ...args  The arguments to pass to the SolidityFunction, followed by the block number and callback.
 * @return {Request}
 */


function requestWithBlockNumber(contractFunction) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  var callback = args.pop();
  var blockNumber = (0, _formatters.inputDefaultBlockNumberFormatter)(args.pop());
  var request = contractFunction.request.apply(contractFunction, args.concat([blockNumber, callback]));
  var params = request.params;
  request.call = function () {
    // console.log(...args);
    contractFunction.call.apply(contractFunction, args.concat([callback]));
  };
  return (0, _assign2.default)({}, request, {
    method: 'eth_call',
    params: [{
      to: params[0].to,
      data: params[0].data
    }, blockNumber]
  });
}