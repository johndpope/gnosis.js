import Rx from 'rx';

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
    return Rx.Observable.create((observer) => {
      const filter = protocol.filter(filterSpec);
      filter.watch((error, result) => {
        if (error) {
          observer.onError(error);
        } else {
          observer.onNext(result);
        }
      });

      return () => {
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
export default function RxWeb3(web3) {
  this.eth = buildWatchStream(web3.eth);
  this.shh = buildWatchStream(web3.shh);
}
