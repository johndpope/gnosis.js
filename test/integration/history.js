/**
 * Created by denisgranha on 19/4/16.
 */

import {expect} from 'chai';
import gnosis from '../../src/';
import testrpcConfig from './config';
import BigNumber from 'bignumber.js';
import {waitForReceipt} from '../../src/lib/transactions';
import {requestWithBlockNumber} from '../../src/lib/web3-batch';
import CryptoJS from 'crypto-js';
import * as hex from '../../src/lib/hex';
import {promiseCallback} from '../../src/lib/callbacks';
import {exec} from 'child_process';

var events = testrpcConfig.events;


// Event hash for event used on create.js tests
let eventHash;

describe('prices history', function testSuite()
{
  let config;
  let marketHashes;
  let marketHash;
  this.timeout(60000);

  beforeEach( () => {
    return gnosis.config.initialize(
      testrpcConfig
    )
    .then((initializedConfig) =>
    {
      config = initializedConfig;
      const command = "node "+
      "--require babel-register --require " +
      "babel-polyfill stress_tests/create_events 1";
      const command_options = {cwd:  __dirname+"/../../"};

      return new Promise((resolve, reject) => {
        exec(
          command,
          command_options,
          promiseCallback(resolve, reject)
        );
      })
      .then((out) =>
      {
        gnosis.state.reset();
        return gnosis.state.buildState(config).then((state) => {
          marketHash = Object.keys(
            state.markets[config.addresses.defaultMarketFactory]
          )[0];
        });
      });
    });
  });

  it('get shares sample', (done) => {
      gnosis.state.getSample(
          config.addresses.defaultMarket,
          marketHash,
          'latest',
          config).then((sample) => {
              expect(sample).to.be.a('object');
              expect(sample.shareDistribution).to.be.a('array');
              expect(sample.shareDistribution.length).to.equal(2);
              expect(sample.timestamp).to.be.a('number');
              expect(sample.blockNumber).to.equal('latest');
              done();
      });

      config.batch.execute();
      config.batch = config.web3.createBatch();
  });

  it('get history', (done) => {
      return gnosis.state.updateHistory(
          config.addresses.defaultMarketFactory,
          marketHash,
          0,
          15,
          2,
          config)
          .then((history) => {
              expect(history).to.be.a('array');
              expect(history.length).to.equal(2);
              expect(history[0].timestamp).to.be.a('number');
              expect(history[0].shareDistribution).to.be.a('array');
              done();
          });
  });
});
