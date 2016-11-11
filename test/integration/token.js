/**
 * Created by denisgranha on 11/4/16.
 */

import BigNumber from 'bignumber.js';
import Promise from 'bluebird';
import {expect} from 'chai';
import gnosis from '../../src/';
import * as hex from '../../src/lib/hex';
import {promiseCallback} from '../../src/lib/callbacks';

import testrpcConfig from './config';

global.Promise = Promise;
// Use bluebird for better error logging during development.


let eventHash;

const market = {
  fee: new BigNumber('0'),
  initialFunding: new BigNumber('1e19'),
  makerAddress: testrpcConfig.addresses.defaultMarketMaker
};

describe('abstract token', function runTests()
{
  this.timeout(40000);
  let config;
  let marketHashes;
  let marketHash;

  beforeEach(() => {
    return gnosis.config.initialize(
      testrpcConfig
    )
    .then((initializedConfig) => {
      config = initializedConfig;
      const testEvent = testrpcConfig.events[0];
      let identifiers = gnosis.helpers.getEventIdentifiers(testEvent);
      return gnosis.helpers.signOracleFee(
        config.account,
        identifiers.descriptionHash,
        testEvent.fee,
        testEvent.feeToken,
        config
      )
      .then((feeData) => {
        expect(feeData).to.be.a('object');
        return new Promise((resolve, reject) => {
          gnosis.contracts.eventFactory.createOffChainEvent(
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
            gnosis.contracts.eventFactory.getEventHashes(
              [identifiers.descriptionHash],
              [config.account],
              config,
              promiseCallback(resolve, reject)
            ).call();
          })
          .then((eventHashes) => {
            expect(eventHashes).to.be.a('array');
            expect(eventHashes.length).to.equal(3);
            eventHash = hex.encode(eventHashes[eventHashes.length-1], 256);

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
                gnosis.contracts.etherToken.buyTokens(
                  market.initialFunding,
                  config,
                  promiseCallback(resolve, reject)
                ).catch(reject);
              }).then((receipt) => {
                return new Promise((resolve, reject) => {
                  // Need to approve before, tokens to buy
                  gnosis.contracts.token.approve(
                    testEvent.tokenAddress,
                    config.addresses.defaultMarketFactory,
                    market.initialFunding,
                    config,
                    promiseCallback(resolve, reject)
                  ).catch(reject);
                }).then((receipt) => {

                  // Create market
                  return new Promise((resolve, reject) => {
                    gnosis.contracts.marketFactory.createMarket(
                      market,
                      eventHash,
                      config,
                      promiseCallback(resolve, reject)
                    );
                  })
                  .then((receipt) => {
                    expect(receipt).to.be.a('object');
                    return new Promise((resolve, reject) => {
                      gnosis.contracts.marketFactory.getMarketHashes(
                        [eventHash],
                        [config.account],
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
                      marketHash = hex.encode(result[result.length-1], 256);
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  it('allowance', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.token.allowance(
        config.addresses.hunchGameToken,
        config.addresses.hunchGameMarketFactory,
        config.account,
        config,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((result) =>
    {
        expect(result.eq(0)).to.be.true;
    });
  });

  it('approve hunchgame tokens', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.token.approve(
        config.addresses.hunchGameToken,
        config.addresses.hunchGameMarketFactory,
        new BigNumber('1e18'),
        config,
        promiseCallback(resolve, reject)
      );
    })
    .then((receipt) => {
      return new Promise((resolve, reject) => {
        gnosis.contracts.token.allowance(
          config.addresses.hunchGameToken,
          config.account,
          config.addresses.hunchGameMarketFactory,
          config,
          promiseCallback(resolve, reject)
        ).call();
      })
      .then((result) => {
        expect(result.eq(new BigNumber('1e18'))).to.be.true;
      });
    });
  });

  it('balance of', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.token.balanceOf(
        config.addresses.hunchGameToken,
        config.account,
        config,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((result) => {
      expect(result.toString(10)).to.not.equal("0");
    });

  });

  it('totalSupply', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.token.totalSupply(
        config.addresses.hunchGameToken,
        config,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((result) =>
    {
      expect(result.greaterThan(0)).to.be.true;
    });
  });

  it('transfer tokens to another account', () => {
    return new Promise((resolve, reject) => {
      // initial balance of other account must be zero
      gnosis.contracts.token.balanceOf(
        config.addresses.hunchGameToken,
        config.accounts[1],
        config,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((result) => {
      expect(result.eq(0)).to.be.true;

      return new Promise((resolve, reject) => {
        gnosis.contracts.token.transfer(
          config.addresses.hunchGameToken,
          config.accounts[1],
          new BigNumber('1'),
          config,
          promiseCallback(resolve, reject)
        );
      })
      .then((receipt) =>
      {
        expect(receipt).to.be.a('object');

        // Balance of destination account should be equal to 1
        // (amount of tokens transfered)
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
          expect(result.eq(1)).to.be.true;
        });
      });
    });
  });

  it('transfer tokens from another another account to an allowed third party',
    () => {
      // Approve thirds party to spend 1 token
      return new Promise((resolve, reject) => {
        gnosis.contracts.token.approve(
          config.addresses.hunchGameToken,
          config.accounts[1],
          new BigNumber('1'),
          config,
          promiseCallback(resolve, reject)
        );
      })
      .then((result) =>
      {
        // Transfer from original account to third party address
        config.account = config.accounts[1];

        return new Promise((resolve, reject) => {
          gnosis.contracts.token.transferFrom(
            config.addresses.hunchGameToken,
            config.accounts[0],
            config.accounts[1],
            new BigNumber('1'),
            config,
            promiseCallback(resolve, reject)
          );
        })
        .then((receipt) =>
        {
          expect(receipt).to.be.a('object');
          return new Promise((resolve, reject) => {
            gnosis.contracts.token.balanceOf(
              config.addresses.hunchGameToken,
              config.accounts[1],
              config,
              promiseCallback(resolve, reject)
            ).call();
          })
          .then((result) => {
              config.account = config.accounts[0];
              expect(result.eq(1)).to.be.true;
          });
        });
      });
  });
});
