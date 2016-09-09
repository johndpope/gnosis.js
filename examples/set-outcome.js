import Promise from 'bluebird';
import gnosis from '../src';
import {ec as EC} from 'elliptic';

global.Promise = Promise;  // Use bluebird for better error logging during development.
const ec = new EC('secp256k1');

// This key is for account 0xe0931803cd14986c8017aad70618bd5f0b58965a.
const keypair = ec.keyFromPrivate('29e228e7a7312cdd1ab98da15bb21ec0f6cd3f0a5a87ea8ab38a14760082d0e8');
const descriptionHash = '0x3f7d2a3affbf0b8856a14795244452a46d76ca8f1cfecf8e59d581970c75a405';
const winningOutcome = 0;

gnosis.config.initialize({
  keypair,
  addresses: {
    Resolver: gnosis.config.defaultConfig.addresses.UltimateResolver,
  }
}).then((config) => {
  return gnosis.actions.setWinningOutcome(descriptionHash, winningOutcome, config);
});
