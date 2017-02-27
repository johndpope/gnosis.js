/**
 * Created by denisgranha on 8/4/16.
 */
import BigNumber from 'bignumber.js';
import testrpcConfig from './config';
import {expect} from 'chai';
import gnosis from '../../src/';
import {promiseCallback} from '../../src/lib/callbacks';
import Web3 from 'web3';

describe('market maker', function testSuite() {
  const config = testrpcConfig;
  config.web3 = new Web3(new Web3.providers.HttpProvider(config.ethereumNodeURL));
  const marketHash = '0xa9c7b2809091bc9d8bdb89913348718bc7f67de5cfebcfc0115fdf8700fe4c9f';
  this.timeout(15000);

  it('calc costs buying', () => {
    config.addresses.lmsrMarketMaker = null;
    return gnosis.contracts.eventFactory.calcBaseFee(
      new BigNumber('1e19'),
      config
    )
    .then((baseFee) => {
      const initialFunding = new BigNumber('1e19').minus(baseFee);
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
        // expect(result.toString(10)).to.equal('508688060865134215');
        expect(result.toString(10)).to.equal('508672777026889653'); // fee=0
      });
    });
  });

  it('calc costs buying lmsr market maker', () => {
    return gnosis.contracts.eventFactory.calcBaseFee(
      new BigNumber('1e19'),
      config
    )
    .then((baseFee) => {
      const initialFunding = new BigNumber('1e19').minus(baseFee);
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
        // expect(result.toString(10)).to.equal('508688060865134215');
        expect(result.toString(10)).to.equal('508672777026889653'); // fee=0
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
      // expect(result.toString(10)).to.equal('510676785042921717');
      expect(result.toString(10)).to.equal('508672777026889653'); // fee=0
    });
  });

  it('calc earnings selling', () => {
    return new Promise((resolve, reject) => {
      config.addresses.lmsrMarketMaker = null;
      gnosis.contracts.marketMaker.calcEarningsSelling(
        marketHash,
        new BigNumber('1e19'),
        [new BigNumber('1e19'), new BigNumber('1e19')],
        new BigNumber('1'),
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
    return gnosis.contracts.eventFactory.calcBaseFee(
      new BigNumber('1e19'),
      config
    )
    .then((baseFee) => {
      const initialFunding = new BigNumber('1e19').minus(baseFee);
      const cost = gnosis.marketMaker.calcCostsBuying(
          initialFunding,
          [initialFunding, initialFunding],
          1,
          new BigNumber('1e18')
      );

      expect(cost).to.be.a('object');
      expect(cost.toString(10)).to.be.a('string');
      // expect(cost.toString(10)).to.equal('508688060865134215');
      expect(cost.toString(10)).to.equal('508672777026889653'); // fee=0
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

  it('calc shares discrete', () => {
    const shares = [
      new BigNumber('408049183266706922'),
      new BigNumber('2021507865310667496'),
    ];

    const initialFunding = new BigNumber('1000000000000000000');

    const shares0 = gnosis.marketMaker.calcShares(
      new BigNumber('1e18'),
      new BigNumber('0'),
      shares,
      initialFunding
    );

    const shares1 = gnosis.marketMaker.calcShares(
      new BigNumber('1e18'),
      new BigNumber('1'),
      shares,
      initialFunding
    );

    expect(shares0.toString()).to.equal('1217137481377572498.68412262543254342240677965204509316674');
    expect(shares1.toString()).to.equal('2336754163472673614.43791018692664961720125168955356461338');
  });
});
