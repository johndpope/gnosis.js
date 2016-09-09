/**
 * Created by denisgranha on 11/4/16.
 */

import BigNumber from 'bignumber.js';
import Promise from 'bluebird';
import {expect} from 'chai';
import gnosis from '../../src/';
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

  it('allowance', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.abstractToken.allowance(
        config.addresses.defaultMarket,
        config.addresses.defaultMarket,
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
      gnosis.contracts.abstractToken.approve(
        config.addresses.defaultMarket,
        config.addresses.defaultMarket,
        new BigNumber('1e18'),
        config,
        promiseCallback(resolve, reject)
      );
    })
    .then((receipt) => {
      return new Promise((resolve, reject) => {
        gnosis.contracts.abstractToken.allowance(
          config.addresses.defaultMarket,
          config.account,
          config.addresses.defaultMarket,
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
      gnosis.contracts.abstractToken.balanceOf(
        config.addresses.defaultMarket,
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
      gnosis.contracts.abstractToken.totalSupply(
        config.addresses.defaultMarket,
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
      gnosis.contracts.abstractToken.balanceOf(
        config.addresses.defaultMarket,
        config.accounts[1],
        config,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((result) => {
      expect(result.eq(0)).to.be.true;

      return new Promise((resolve, reject) => {
        gnosis.contracts.abstractToken.transfer(
          config.addresses.defaultMarket,
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
          gnosis.contracts.abstractToken.balanceOf(
            config.addresses.defaultMarket,
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
        gnosis.contracts.abstractToken.approve(
          config.addresses.defaultMarket,
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
          gnosis.contracts.abstractToken.transferFrom(
            config.addresses.defaultMarket,
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
            gnosis.contracts.abstractToken.balanceOf(
              config.addresses.defaultMarket,
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
