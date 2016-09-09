import Promise from 'bluebird';
import gnosis from '../src';
import tokens from '../src/tokens';
import {outcomeIdentifier} from '../src/deprecated_code/state/outcomes';
import {promiseCallback} from '../src/lib/callbacks';

global.Promise = Promise;  // Use bluebird for better error logging during development.

const eventHash = '0x345410d90167812594f41986467722fb402cae4f5021d4ba125fc116c1b0d2c7';
const outcomeIndex = 0;

gnosis.config.initialize().then((config) => {
  return new Promise((resolve, reject) => {
    config.batcher.add(
      tokens.requests.balanceOf(
        config.addresses.EventToken,
        outcomeIdentifier(eventHash, outcomeIndex),
        config.account,
        config,
        promiseCallback(resolve, reject)));
  });
}).then((balance) => {
  console.log(`Outcome ${outcomeIndex} shares held: ${balance}`);
});
