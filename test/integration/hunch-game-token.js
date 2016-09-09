import BigNumber from 'bignumber.js';
import Promise from 'bluebird';
import {expect} from 'chai';
import gnosis from '../../src/';
import {waitForReceipt} from '../../src/lib/transactions';
import {promiseCallback} from '../../src/lib/callbacks';

import testrpcConfig from './config';

global.Promise = Promise;
// Use bluebird for better error logging during development.


let eventHash;
const testEvent = testrpcConfig.events[0];

const market = {
  fee: new BigNumber('0'),
  initialFunding: new BigNumber('1e19'),
  makerAddress: testrpcConfig.addresses.defaultMarketMaker
};

describe('hunchgame', function runTests() {
  this.timeout(20000);
  let config;
  let marketHashes;
  let marketHash;

  beforeEach(() => {
    return gnosis.config.initialize(
      testrpcConfig
    )
    .then((initializedConfig) =>
    {
      config = initializedConfig;
      let identifiers = gnosis.helpers.getEventIdentifiers(testEvent);
      return gnosis.helpers.signWithDescription(
        config.account,
        testEvent.fee,
        identifiers.descriptionHash,
        config
      )
      .then((feeData) => {
        expect(feeData).to.be.a('object');
        return new Promise((resolve, reject) => {
          gnosis.contracts.events.createOffChainEvent(
            testEvent,
            identifiers.descriptionHash,
            [feeData],
            config,
            promiseCallback(resolve, reject)
          );
        })
        .then((receipt) => {
          expect(receipt).to.be.a('object');

          return new Promise((resolve, reject) => {
            gnosis.contracts.events.getEventHashes(
              [identifiers.descriptionHash,],
              config,
              promiseCallback(resolve, reject)
            ).call();
          })
          .then((eventHashes) => {
            expect(eventHashes).to.be.a('array');
            expect(eventHashes.length).to.equal(3);
            eventHash = '0x'+eventHashes[eventHashes.length-1].toString(16);

            return new Promise((resolve, reject) => {
              gnosis.contracts.events.getEvent(
                eventHash,
                config,
                promiseCallback(resolve, reject)
              ).call();
            })
            .then((eventInfo) => {
              expect(eventInfo).to.be.a('array');
              // Create market
              return new Promise((resolve, reject) => {
                gnosis.contracts.market.createMarket(
                  market,
                  eventHash,
                  config,
                  promiseCallback(resolve, reject)
                );
              })
              .then((receipt) => {
                expect(receipt).to.be.a('object');
                return new Promise((resolve, reject) => {
                  gnosis.contracts.market.getMarketHashes(
                    [eventHash],
                    config,
                    null,
                    promiseCallback(resolve, reject)
                  ).call();
                })
                .then((result) => {
                  expect(result).to.be.a('array');
                  expect(result.length).to.equal(3);
                  expect(result[0]).to.be.a('object');
                  expect(result[0].toString(16)).to.be.a('string');
                  marketHashes = result;
                  marketHash = '0x' + result[result.length-1].toString(16);
                });
              });
            });
          });
        });
      });
    });
  });

  it('fails to add credits again', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.hunchGameToken.addCredit(
        config,
        promiseCallback(resolve, reject)
      );
    })
    .then((receipt) =>
    {
      return gnosis.contracts.hunchGameToken.addCredit(
        config
      )
      .catch(
        (error) =>
        {
            expect(error).to.be.ok;
        });
      });
  });

  it('getBalanceOf main account ok', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.abstractToken.balanceOf(
        config.addresses.defaultMarket,
        config.account,
        config,
        promiseCallback(resolve, reject)
      ).call();
    }).then((result) =>
    {
      expect(result.toString(10)).to.not.equal("0");
    });
  });

  it('getBalanceOf empty account', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.abstractToken.balanceOf(
        config.addresses.defaultMarket,
        config.accounts[1],
        config,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((result) => {
      expect(result.toString(10)).to.equal("0");
    })
  });

  it('getBalanceOf after adding credits', () => {
    config.account = config.accounts[1];
    return new Promise((resolve, reject) => {
      gnosis.contracts.abstractToken.balanceOf(
        config.addresses.defaultMarket,
        config.accounts[1],
        config,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((result) =>
    {
      expect(new BigNumber(result).eq(0)).to.be.true;

      return new Promise((resolve, reject) => {
        gnosis.contracts.hunchGameToken.addCredit(
          config,
          promiseCallback(resolve, reject)
        );
      })
      .then((receipt) => {
        return new Promise((resolve, reject) => {
          gnosis.contracts.abstractToken.balanceOf(
            config.addresses.defaultMarket,
            config.accounts[1],
            config,
            promiseCallback(resolve, reject)
          ).call();
        })
        .then((result) =>
        {
          expect(new BigNumber(result).equals(new BigNumber('1e21'))).to.be.true;
          config.account = config.accounts[0];
        });
      });
    });
  });

  it('get user level ok', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.hunchGameToken.getUserLevel(
        config,
        config.account,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((result) => {
        expect(result.toString(10)).to.equal("0");
      });
  });

  it('get last credit ok', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.hunchGameToken.getLastCredit(
        config,
        config.account,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((result) => {
      var lastCredit = new Date(result.toNumber()*1000);
      var limitDate = new Date(new Date() - 12*60*60*1000);
      expect(lastCredit).to.be.ok;
      expect(lastCredit > limitDate);
    });
  });

  it('get last credit fail, unknown address', () => {
    let unknownAddress = config.account + 'f';
    return new Promise((resolve, reject) => {
      gnosis.contracts.hunchGameToken.getLastCredit(
        config,
        unknownAddress,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((result) => {
      expect(result.toNumber()).to.equal(0);
    });
  });

  it('buy credits ok', () => {
    return gnosis.contracts.hunchGameToken.buyCredits(
      1,
      config
    )
    .then((result) =>
    {
      expect(result.simulatedResult).to.be.true;
    });
  });

  it('get tokens in events, unknown', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.hunchGameToken.getTokensInEvents(
        config.account,
        ['0x4d3e2692111978113260e1ecdb332bfcf5b47f0d786805366d22952235cdcb48'],
        config,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((result) => {
      expect(result).to.be.a('array');
      expect(result.length).to.equal(0);
    });
  });

  it('get users highscores', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.hunchGameToken.getHighScores(
        [config.account],
        config,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((result) =>
    {
      expect(result).to.be.a('array');
      expect(result.length).to.equal(0);
    });
  });

  it('get tokens in known event', () => {
    return gnosis.contracts.events.calcBaseFee(
      new BigNumber('1e19'),
      config
    )
    .then((fee) =>
    {
      let initialFunding = new BigNumber('1e19').minus(fee);
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
      .then((buyCost) => {
        expect(buyCost.greaterThan(0)).to.be.true;
        return gnosis.contracts.events.calcBaseFeeForShares(
          new BigNumber('1e18'),
          config
        )
        .then((fee) =>
        {
          let maxPrice = fee.plus(buyCost);
          return new Promise((resolve, reject) => {
            gnosis.contracts.market.buyShares(
              marketHash,
              1,
              new BigNumber('1e18'),
              maxPrice,
              config,
              null,
              promiseCallback(resolve, reject)
            );
          })
          .then((receipt) =>
          {
            expect(receipt).to.be.a('object');
            return new Promise((resolve, reject) => {
              gnosis.contracts.hunchGameToken.getTokensInEvents(
                config.account,
                [eventHash],
                config,
                promiseCallback(resolve, reject)
              ).call();
            })
            .then((result) =>
            {
              expect(result).to.be.a('array');
              expect(result.length).not.to.equal(0);
            });
          });
        });
      });
    });
  });
});
