/**
 * Created by denisgranha on 8/4/16.
 */
import BigNumber from 'bignumber.js';
import testrpcConfig from './config';
import {expect} from 'chai';
import gnosis from '../../src/';
import {waitForReceipt} from '../../src/lib/transactions';
import {exec} from 'child_process';
import {promiseCallback} from '../../src/lib/callbacks';

describe('market maker', function testSuite() {
  let config;
  let marketHash;
  this.timeout(150000);

  beforeEach(function createEvents(){
    return gnosis.config.initialize(
      testrpcConfig
    )
    .then((initializedConfig) => {
      config = initializedConfig;
      gnosis.state.reset();
      const command = "node " +
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
      .then((out) => {
        // We build the state, in order to let the function access
        // the market data
        return gnosis.state.buildState(config).then((state) =>
        {
          expect(state.markets[config.addresses.defaultMarket]).to.be.ok;
          expect(
            Object.keys(state.markets[config.addresses.defaultMarket]).length
          ).to.equal(1);
          marketHash = Object.keys(
            state.markets[config.addresses.defaultMarket]
          )[0];
        });
      });
    });
  });

  it('calc costs buying', () => {
    config.addresses.lmsrMarketMaker = null;
    return gnosis.contracts.events.calcBaseFee(
      new BigNumber('1e19'),
      config
    )
    .then((baseFee) => {
      let initialFunding = new BigNumber('1e19').minus(baseFee);
      return new Promise((resolve, reject) => {
        gnosis.contracts.marketMaker.calcCostsBuying(
          marketHash,
          initialFunding,
          [initialFunding, initialFunding],
          1,
          new BigNumber('1e18'),
          config,
          null,
          promiseCallback(resolve, reject)
        ).call();
      })
      .then((result) => {
        expect(result).to.be.a('object');
        expect(result.toString(10)).to.be.a('string');
        expect(result.toString(10)).to.equal('508688060865134215');
      });
    });
  });

  it('calc costs buying lmsr market maker', () => {
    return gnosis.contracts.events.calcBaseFee(
      new BigNumber('1e19'),
      config
    )
    .then((baseFee) => {
      let initialFunding = new BigNumber('1e19').minus(baseFee);
      return new Promise((resolve, reject) => {
        gnosis.contracts.marketMaker.calcCostsBuying(
          marketHash,
          initialFunding,
          [initialFunding, initialFunding],
          1,
          new BigNumber('1e18'),
          config,
          null,
          promiseCallback(resolve, reject)
        ).call();
      })
      .then((result) => {
        expect(result).to.be.a('object');
        expect(result.toString(10)).to.be.a('string');
        expect(result.toString(10)).to.equal('508688060865134215');
      });
    });
  });

  it('calc costs buying with fee', () => {
    config.addresses.lmsrMarketMaker = null;
    return new Promise((resolve, reject) => {
      gnosis.contracts.marketMaker.calcCostsBuyingWithFees(
        marketHash,
        1,
        new BigNumber('1e18'),
        config,
        promiseCallback(resolve, reject)
      );
    })
    .then((result) => {
      expect(result).to.be.a('object');
      expect(result.toString(10)).to.be.a('string');
      expect(result.toString(10)).to.equal('510676785042921717');
    });
  });

  it('calc earnings selling', () => {
    return new Promise((resolve, reject) => {
        config.addresses.lmsrMarketMaker = null;
        gnosis.contracts.marketMaker.calcEarningsSelling(
          marketHash,
          new BigNumber('1e19'),
          [new BigNumber('1e19'), new BigNumber('1e19')],
          1,
          new BigNumber('1e18'),
          config,
          null,
          promiseCallback(resolve, reject)
        ).call();
    })
    .then((result) => {
      expect(result).to.be.a('object');
      expect(result.toString(10)).to.be.a('string');
      expect(result.toString(10)).to.equal('491327565610525849');
    });
  });

  it('calc earnings selling LMSR market maker', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.marketMaker.calcEarningsSelling(
        marketHash,
        new BigNumber('1e19'),
        [new BigNumber('1e19'), new BigNumber('1e19')],
        1,
        new BigNumber('1e18'),
        config,
        null,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((result) => {
        expect(result).to.be.a('object');
        expect(result.toString(10)).to.be.a('string');
        expect(result.toString(10)).to.equal('491327565610525849');
    });
  });

  it('calc earning selling with fee', () => {
      config.addresses.lmsrMarketMaker = null;
      return new Promise((resolve, reject) => {
        gnosis.contracts.marketMaker.calcEarningsSellingWithFees(
          marketHash,
          1,
          new BigNumber('1e18'),
          config,
          null,
          null,
          promiseCallback(resolve, reject)
        );
      })
      .then((result) => {
        expect(result).to.be.a('object');
        expect(result.toString(10)).to.be.a('string');
        expect(result.toString(10)).to.equal('491327565610525849');
      });
  });

  it('calc costs buying with javascript library', () => {
      return gnosis.contracts.events.calcBaseFee(
        new BigNumber('1e19'),
        config
      )
      .then((baseFee) => {
        const initialFunding = new BigNumber('1e19').minus(baseFee);
        let cost = gnosis.marketMaker.calcCostsBuying(
            initialFunding,
            [initialFunding, initialFunding],
            1,
            new BigNumber('1e18')
        );

        expect(cost).to.be.a('object');
        expect(cost.toString(10)).to.be.a('string');
        expect(cost.toString(10)).to.equal('508688060865134215');
      });
  });

  it('calc earnings selling with javascript library', () => {
      const initialFunding = new BigNumber('1e19');
      const earnings = gnosis.marketMaker.calcEarningsSelling(
          initialFunding,
          [initialFunding, initialFunding],
          1,
          new BigNumber('1e18')
      );
      expect(earnings).to.be.a('object');
      expect(earnings.toString(10)).to.be.a('string');
      expect(earnings.toString(10)).to.equal('491327565610525849');
  });
});
