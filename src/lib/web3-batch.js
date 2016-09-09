import {inputDefaultBlockNumberFormatter} from 'web3/lib/web3/formatters';

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
export class Batcher {
  constructor(config: BatcherConfig) {
    this.config = config;
    this._clear();
  }

  _clear() {
    this.batch = this.config.web3.createBatch();
    this.pending = false;
  }

  add(request) {
    this.batch.add(request);

    if (!this.pending) {
      setTimeout(() => this._execute(), 0);
      this.pending = true;
    }
  }

  _execute() {
    this.batch.execute();
    this._clear();
  }
}

/**
 * Construct a request for batching that calls a function at a given block
 * number. Web3's SolidityFunction.prototype.request makes this impossible,
 * so we wrap it.
 * @param  {SolidityFunction} contractFunction
 * @param  {Object} ...args  The arguments to pass to the SolidityFunction, followed by the block number and callback.
 * @return {Request}
 */
export function requestWithBlockNumber(contractFunction, ...args) {
  const callback = args.pop();
  const blockNumber = inputDefaultBlockNumberFormatter(args.pop());
  const request = contractFunction.request(...args, blockNumber, callback);
  const params = request.params;
  request.call = function()
    {
      // console.log(...args);
      contractFunction.call(...args, callback);

  };
  return Object.assign({}, request, {
    method: 'eth_call',
    params: [
      {
        to: params[0].to,
        data: params[0].data
      },
      blockNumber
    ]
  });
}
