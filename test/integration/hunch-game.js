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
  this.timeout(40000);
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
      return gnosis.helpers.signOracleFee(
        config.account,
        identifiers.descriptionHash,
        testEvent.fee,
        config.addresses.hunchGameToken,
        config
      )
      .then((feeData) => {
        expect(feeData).to.be.a('object');

        let hunchgameEvent = {
          kind: 'discrete',
          descriptionHash: identifiers.descriptionHash,
          'fee': new BigNumber('0'),
          'feeToken': config.addresses.hunchGameToken,
          'outcomeCount': 2,
          'resolverAddress': config.addresses.ultimateOracle,
          'tokenAddress': config.addresses.hunchGameToken
        };

        return new Promise((resolve, reject) => {
          gnosis.contracts.eventFactory.createOffChainEvent(
            hunchgameEvent,
            identifiers.descriptionHash,
            [feeData],
            config,
            promiseCallback(resolve, reject)
          ).catch(reject);
        })
        .then((receipt) => {
          expect(receipt).to.be.a('object');

          return new Promise((resolve, reject) => {
            gnosis.contracts.eventFactory.getEventHashes(
              [identifiers.descriptionHash,],
              [config.account],
              config,
              promiseCallback(resolve, reject)
            ).call();
          })
          .then((eventHashes) => {
            expect(eventHashes).to.be.a('array');
            expect(eventHashes.length).to.equal(3);
            eventHash = '0x'+eventHashes[eventHashes.length-1].toString(16);

            return new Promise((resolve, reject) => {
              gnosis.contracts.eventFactory.getEvent(
                eventHash,
                config,
                promiseCallback(resolve, reject)
              ).call();
            })
            .then((eventInfo) => {
              expect(eventInfo).to.be.a('array');

              return new Promise((resolve, reject) => {
                gnosis.contracts.token.approve(
                  config.addresses.hunchGameToken,
                  config.addresses.hunchGameMarketFactory,
                  new BigNumber('1e19').plus('1e18'),
                  config,
                  promiseCallback(resolve, reject)
                );
              })
              .then((receipt) => {

                // Create market
                return new Promise((resolve, reject) => {
                  gnosis.contracts.marketFactory.createMarket(
                    market,
                    eventHash,
                    config,
                    config.addresses.hunchGameMarketFactory,
                    promiseCallback(resolve, reject)
                  ).catch(reject);
                })
                .then((receipt) => {
                  expect(receipt).to.be.a('object');
                  return new Promise((resolve, reject) => {
                    gnosis.contracts.marketFactory.getMarketHashes(
                      [eventHash],
                      [config.account],
                      config,
                      config.addresses.hunchGameMarketFactory,
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
  });

  it('fails to add credits again', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.hunchGameMarketFactory.addCredit(
        config,
        promiseCallback(resolve, reject)
      ).catch(reject);
    })
    .then((receipt) =>
    {
      return gnosis.contracts.hunchGameMarketFactory.addCredit(
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
      gnosis.contracts.token.balanceOf(
        config.addresses.hunchGameToken,
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
      gnosis.contracts.token.balanceOf(
        config.addresses.hunchGameToken,
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
      gnosis.contracts.token.balanceOf(
        config.addresses.hunchGameToken,
        config.accounts[1],
        config,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((result) =>
    {
      expect(new BigNumber(result).eq(0)).to.be.true;

      return new Promise((resolve, reject) => {
        gnosis.contracts.hunchGameMarketFactory.addCredit(
          config,
          promiseCallback(resolve, reject)
        );
      })
      .then((receipt) => {
        return new Promise((resolve, reject) => {
          gnosis.contracts.token.balanceOf(
            config.addresses.hunchGameToken,
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
      gnosis.contracts.hunchGameMarketFactory.getUserLevel(
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
      gnosis.contracts.hunchGameMarketFactory.getLastCredit(
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
      gnosis.contracts.hunchGameMarketFactory.getLastCredit(
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
    return gnosis.contracts.hunchGameMarketFactory.buyCredits(
      1,
      config
    )
    .then((result) =>
    {      
    });
  });

  it('get tokens in events, unknown', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.hunchGameMarketFactory.getTokensInEvents(
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
      gnosis.contracts.hunchGameMarketFactory.getHighScores(
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
    return gnosis.contracts.eventFactory.calcBaseFee(
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
        return gnosis.contracts.eventFactory.calcBaseFeeForShares(
          new BigNumber('1e18'),
          config
        )
        .then((fee) =>
        {
          let maxPrice = fee.plus(buyCost);
          return new Promise((resolve, reject) => {
            gnosis.contracts.marketFactory.buyShares(
              marketHash,
              1,
              new BigNumber('1e18'),
              maxPrice,
              config,
              config.addresses.hunchGameMarketFactory,
              promiseCallback(resolve, reject)
            );
          })
          .then((receipt) =>
          {
            expect(receipt).to.be.a('object');
            return new Promise((resolve, reject) => {
              gnosis.contracts.hunchGameMarketFactory.getTokensInEvents(
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
