'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = RxWeb3;

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Wrap a protocol's filter and watch functions in a stream.
 * @param  {Web3.Eth|Web3.Shh} protocol
 * @return {Function}
 */
function buildWatchStream(protocol) {
  /**
   * Build a stream of events by watching a Web3 filter.
   * @param  {String|Object} filterSpec Web3 filter argument
   * @return {Observable} A stream of block hashes, transaction hashes, or log data as provided by web3.
   */
  return function stream(filterSpec) {
    return _rx2.default.Observable.create(function (observer) {
      var filter = protocol.filter(filterSpec);
      filter.watch(function (error, result) {
        if (error) {
          observer.onError(error);
        } else {
          observer.onNext(result);
        }
      });

      return function () {
        filter.stopWatching();
      };
    });
  };
}

/**
 * Builds an object with methods that generate streams from watched filter
 * callbacks.
 * @param {Web3} web3
 */
function RxWeb3(web3) {
  this.eth = buildWatchStream(web3.eth);
  this.shh = buildWatchStream(web3.shh);
}
module.exports = exports['default'];