/**
 * Prints out the ABI for contracts extracted from Gnosis's `contracts/abi`.
 *
 * babel-node-debug -c --no-debug-brk scripts/abi.js [--abi-dir DIR] [--contracts CONTRACT ...]
 */

import _ from 'lodash';
import nodeFs from 'fs';
import yargs from 'yargs';
import Promise from 'bluebird';
global.Promise = Promise;

const fs = Promise.promisifyAll(nodeFs);

function contractName(filename) {
  return filename.split('.')[0];
}

yargs
  .array('contracts');

const config = Object.assign({
  abiDir: '../../contracts/abi',
  contracts: [
    'EventToken',
    'HunchGameToken',
    'Market',
    'DifficultyResolver',
  ],
}, yargs.argv);

fs.readdirAsync(config.abiDir)
  .then((files) => _.filter(files, file => config.contracts.indexOf(file.split('.')[0]) !== -1))
  .then((files) => {
    return Promise.all(files.map((filename) => {
      return fs.readFileAsync([config.abiDir, filename].join('/'))
        .then(json => [filename, json]);
    }));
  })
  .then((abis) => {
    abis.forEach(([filename, json]) => {
      const abi = JSON.parse(json).abi;
      console.log(`const ${contractName(filename)} = ${JSON.stringify(abi)};`);
    })
  });
