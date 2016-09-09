/**
 * Created by denisgranha on 21/3/16.
 */
import testrpcConfig from './config';
import gnosis from '../../src/';
import {expect} from 'chai';
import BigNumber from 'bignumber.js';
import * as hex from '../../src/lib/hex';
import {promiseCallback} from '../../src/lib/callbacks';

describe('events', function testSuite(){
    this.timeout(40000);
    let config;
    let eventHash;
    let testEvent = testrpcConfig.events[0];

    beforeEach(() => {
      // Initialize gnosis.js config object
      return gnosis.config.initialize(testrpcConfig)
      .then((appConfig) => {
        // make config accesible to all tests
        config = appConfig;

        // Sign event data
        let ids = gnosis.helpers.getEventIdentifiers(testEvent);
        return gnosis.helpers.signWithDescription(
            config.account,
            testEvent.fee,
            ids.descriptionHash,
            config
        )
        .then((feeData) =>
        {
          expect(feeData).to.be.a('object');
          // Create event in the blockchain
          return new Promise((resolve, reject) => {
            gnosis.contracts.events.createOffChainEvent(
              testEvent,
              ids.descriptionHash,
              [feeData],
              config,
              promiseCallback(resolve, reject)
            );
          })
          .then((receipt) => {
              expect(receipt).to.be.a('object');
              expect(receipt.transactionHash).to.be.a('string');
              // Get event from description_hash
              return new Promise((resolve, reject) => {
                gnosis.contracts.events.getEventHashes(
                  [ids.descriptionHash],
                  config,
                  promiseCallback(resolve, reject)
                ).call();
              }).then((result) => {
                  expect(result).to.be.a('array');
                  expect(result.length).to.be.above(0);

                  // Get event from eventHash
                  eventHash = '0x' + result[result.length - 1].toString(16);
                  return new Promise((resolve, reject) => {
                    gnosis.contracts.events.getEvent(
                      eventHash,
                      config,
                      promiseCallback(resolve, reject)
                    ).call();
                  }).then((result) => {
                      expect(result).to.be.a('array');
                      expect(result[0]).to.be.a('string');
                      expect(result[0]).to.not.equal(
                          hex.encode(new BigNumber('0'), 256)
                      );
                  })
                });
            });
          });
      });
    });

    it('create ranged event', () => {
      let rangedEvent = {
          'kind': 'ranged',
          'tags': ['kanye-west', 'kim-kardashian'],
          'title': "Ranged event",
          'description': "Ranged event.",
          'sourceURL': 'http://gawker.com/',
          'resolutionDate': '2016-11-02T08:30:30Z',
          'lowerBound': 0,
          'upperBound': 1000,
          'unit': 'eth',
          'decimals': 10,
          'fee': new BigNumber('0'),
          'outcomeCount': 2,
          'resolverAddress': config.addresses.ultimateOracle,
          'tokenAddress': config.addresses.defaultMarket
      };

      let ids = gnosis.helpers.getEventIdentifiers(rangedEvent);
      return gnosis.helpers.signWithDescription(
        config.account,
        rangedEvent.fee,
        ids.descriptionHash,
        config
      ).then((feeData)=> {
        expect(feeData).to.be.a('object');
        return new Promise((resolve, reject) => {
          gnosis.contracts.events.createOffChainEvent(
            rangedEvent,
            ids.descriptionHash,
            [feeData],
            config,
            promiseCallback(resolve, reject)
          );
        }).then((receipt) => {
          expect(receipt).to.be.a('object');
          expect(receipt.transactionHash).to.be.a('string');
          // Get event from description_hash
          return new Promise((resolve, reject) => {
            gnosis.contracts.events.getEventHashes(
              [ids.descriptionHash],
              config,
              promiseCallback(resolve, reject)
            ).call();
          }).then((result) => {
            expect(result).to.be.a('array');
            expect(result.length).to.be.above(0);

            // Get event from event_hash
            let rangedEventHash = '0x' + result[result.length-1].toString(16);
            return gnosis.contracts.events.getEventsProcessed(
              [rangedEventHash],
              config.addresses.ultimateOracle,
              null,
              null,
              config
            ).then((result) => {
              expect(result).to.be.a('object');
              expect(result[rangedEventHash]).to.be.a('object');
              expect(result[rangedEventHash].kind).to.equal('ranged');
              expect(result[rangedEventHash].lowerBound.eq(0)).to.be.true;
              expect(result[rangedEventHash].upperBound.eq(1000)).to.be.true;
            });
          });
        });
      });
    });

    it('create discrete on chain event', () => {
      let onChainEvent = {
          'kind': 'discrete',
          'title': "On Chain event",
          'description': "On Chain event",
          'sourceURL': 'http://gawker.com/',
          'outcomes': ['Yes', 'No'],
          'fee': new BigNumber('0'),
          'outcomeCount': 2,
          'resolverAddress': config.addresses.ultimateOracle,
          'tokenAddress': config.addresses.defaultMarket

      };

      let ids = gnosis.helpers.getEventIdentifiers(onChainEvent);
      return gnosis.helpers.signWithDescription(
        config.account,
        onChainEvent.fee,
        ids.descriptionHash,
        config)
        .then((feeData)=> {
          expect(feeData).to.be.a('object');
          return new Promise((resolve, reject) => {
            return gnosis.contracts.events.createEvent(
              onChainEvent,
              ids.descriptionHash,
              [
                new BigNumber(ids.descriptionHash),
                feeData.message,
                feeData.v,
                feeData.r,
                feeData.s
              ].map(int => hex.encode(int, 256)),
              config,
              promiseCallback(resolve, reject)
            );
          }).then((receipt) => {
            expect(receipt).to.be.a('object');
            expect(receipt.transactionHash).to.be.a('string');
            // Get event from description_hash
            return new Promise((resolve, reject) => {
              gnosis.contracts.events.getEventHashes(
                [ids.descriptionHash],
                config,
                promiseCallback(resolve, reject)
              ).call();
            }).then((result) => {
              expect(result).to.be.a('array');
              expect(result.length).to.be.above(0);

              // Get event from event_hash
              let rangedEventHash = '0x'+result[result.length-1].toString(16);
              return gnosis.contracts.events.getEventsProcessed(
                [rangedEventHash],
                config.addresses.ultimateOracle,
                null,
                null,
                config
              ).then((result) => {
                expect(result).to.be.a('object');
                expect(result[rangedEventHash]).to.be.a('object');
                expect(result[rangedEventHash].kind).to.equal('discrete');
              });
            });
          });
        });
    });

    it('getEvents', () => {
      return new Promise((resolve, reject) => {
        gnosis.contracts.events.getEvents(
          [eventHash],
          config.addresses.ultimateOracle,
          null,
          null,
          config,
          promiseCallback(resolve, reject)
        ).call();
      }).then((result) => {
          expect(result).to.be.a('array');
          expect(result.length).to.equal(14);
      });
    });

    it('get base fee, ok', () => {
      return new Promise((resolve, reject) => {
        gnosis.contracts.events.getBaseFee(
          config,
          promiseCallback(resolve, reject)
        ).call();
      }).then((result) => {
          expect(result.toString(10)).to.equal("2000");
      });
    });

    it('calcBaseFeeForShares, ok', (done) => {
      gnosis.contracts.events.calcBaseFeeForShares(
        new BigNumber('1e18'),
        config
      ).then((baseFee) => {
        expect(baseFee.eq(new BigNumber('2004008016032064'))).to.be.true;
        done();
      });
    });

    it('calcBaseFee, ok', (done) => {
        gnosis.contracts.events.calcBaseFee(
          new BigNumber('1e18'),
          config)
        .then((baseFee) => {
          expect(baseFee.eq(new BigNumber('2000000000000000'))).to.be.true;
          done();
        });
    });

    it('Buy All outcomes hunchgame, ok', () => {
      return new Promise((resolve, reject) => {
        // Need to approve before, tokens to buy
        gnosis.contracts.abstractToken.approve(
          testrpcConfig.events[0].tokenAddress,
          config.addresses.events,
          new BigNumber('1e19'),
          config,
          promiseCallback(resolve, reject)
        );
      }).then((receipt) => {
        return new Promise((resolve, reject) => {
          gnosis.contracts.events.buyAllOutcomes(
            eventHash,
            new BigNumber('1e19'),
            config,
            promiseCallback(resolve, reject)
          ).then((result) => {
              expect(result).to.be.a('object');
              expect(result.simulatedResult).to.be.true;
          });
        }).then((receipt) => {

        });
      });
    });

    it('buy all outcomes, ether based', () => {
      let event = {
        'kind': 'discrete',
        'title': "ether event",
        'description': "ether event",
        'sourceURL': 'http://gawker.com/',
        'outcomes': ['Yes', 'No'],
        'fee': new BigNumber('0'),
        'outcomeCount': 2,
        'resolverAddress': config.addresses.ultimateOracle,
        'tokenAddress': config.addresses.etherToken
      };
      let ids = gnosis.helpers.getEventIdentifiers(event);
      return gnosis.helpers.signWithDescription(
        config.account,
        event.fee,
        ids.descriptionHash,
        config
      ).then((feeData)=> {
        expect(feeData).to.be.a('object');
        return new Promise((resolve, reject) => {
          gnosis.contracts.events.createOffChainEvent(
            event,
            ids.descriptionHash,
            [feeData],
            config,
            promiseCallback(resolve, reject)
          );
        })
        .then((receipt) => {
          expect(receipt).to.be.a('object');
          expect(receipt.transactionHash).to.be.a('string');

          return new Promise((resolve, reject) => {
            // Get event from description_hash
            gnosis.contracts.events.getEventHashes(
              [ids.descriptionHash],
              config,
              promiseCallback(resolve, reject)
            ).call();
          })
          .then((result) => {
            expect(result).to.be.a('array');
            expect(result.length).to.be.above(0);

            // Get event from event_hash
            let etherEventHash = '0x'+result[result.length-1].toString(16);

            return new Promise((resolve, reject) => {
              gnosis.contracts.etherToken.buyTokens(
                new BigNumber('1e19'),
                config,
                promiseCallback(resolve, reject)
              );
            }).then((receipt) => {
              // Need to approve before, tokens to buy
              return new Promise((resolve, reject) => {
                gnosis.contracts.abstractToken.approve(
                  event.tokenAddress,
                  config.addresses.events,
                  new BigNumber('1e19'),
                  config,
                  promiseCallback(resolve, reject)
                );
              }).then((receipt) => {
                  return gnosis.contracts.events.buyAllOutcomes(
                    etherEventHash,
                    new BigNumber('1e19'),
                    config
                  )
                  .then((result) =>
                  {
                      expect(result).to.be.a('object');
                      expect(result.simulatedResult).to.be.true;
                  });
                });
              });
            });
          });
        });
    });

    it('Buy All outcomes, none ok', () => {

      return gnosis.contracts.events.buyAllOutcomes(
        eventHash,
        new BigNumber('0'),
        config
      )
      .catch(
        (error) =>
          {
              expect(error).to.be.ok;
          }
      );
    });

    it('Redeem All outcomes, ok', () => {
      // Need to approve before, tokens to buy
      return new Promise((resolve, reject) => {
        return gnosis.contracts.abstractToken.approve(
          testEvent.tokenAddress,
          config.addresses.events,
          new BigNumber('10e19'),
          config,
          promiseCallback(resolve, reject)
        );
      }).then((receipt) => {
        return gnosis.contracts.events.buyAllOutcomes(
          eventHash,
          new BigNumber('10e19'),
          config
        )
        .then((result) => {
          expect(result).to.be.a('object');
          expect(result.simulatedResult).to.be.true;
          return gnosis.contracts.events.redeemAllOutcomes(
            eventHash,
            new BigNumber('1'),
            config
          )
          .then((result) => {
            expect(result).to.be.a('object');
            expect(result.simulatedResult).to.be.true;
          });
        });
      });
    });

    it('Redeem All outcomes, none ok', () => {
      // Need to approve before, tokens to buy
      return new Promise((resolve, reject) => {
        gnosis.contracts.abstractToken.approve(
          testEvent.tokenAddress,
          config.addresses.events,
          new BigNumber('10e19'),
          config,
          promiseCallback(resolve, reject)
        );
      }).then((receipt) => {
        return gnosis.contracts.events.redeemAllOutcomes(
          eventHash,
          new BigNumber('0'),
          config
        )
        .catch(
          (error) => {
              expect(error).to.be.ok;
          }
        );
      });
    });

    it('Redeem winnings without winning outcome set', () => {
      // Need to approve before, tokens to buy
      return new Promise((resolve, reject) => {
        gnosis.contracts.abstractToken.approve(
          testEvent.tokenAddress,
          config.addresses.events,
          new BigNumber('10e19'),
          config,
          promiseCallback(resolve, reject)
        );
      }).then((receipt) => {
        return gnosis.contracts.events.redeemWinnings(
          eventHash,
          config
        )
        .catch(
          (error) => {
              expect(error).to.be.ok;
          }
        );
      });
    });

    it('get Shares', () => {
      // Need to approve before, tokens to buy
      return new Promise((resolve, reject) => {
        gnosis.contracts.abstractToken.approve(
          testEvent.tokenAddress,
          config.addresses.events,
          new BigNumber('10e19'),
          config,
          promiseCallback(resolve, reject)
        );
      }).then((receipt) => {
        // Buy outcomes to take shares of the event
        return new Promise((resolve, reject) => {
          gnosis.contracts.events.buyAllOutcomes(
            eventHash,
            new BigNumber('10e19'),
            config,
            promiseCallback(resolve, reject)
          );
        }).then((receipt) =>
          {
            // get shares of event without building the state, shares will
            // be taken from blockchain instead
            return new Promise((resolve, reject) => {
              gnosis.contracts.events.getShares(
                config.account,
                [eventHash],
                config,
                promiseCallback(resolve, reject)
              ).call();
            }).then((result) =>
              {
                expect(result).to.be.a('array');
                expect(result.length).to.be.above(1);

              });

          });
      });
    });

    it('create event with fee', () => {
      let eventWithFee = {
        'kind': 'discrete',
        'title': "event with fee",
        'description': "event with fee",
        'sourceURL': 'http://gawker.com/',
        'outcomes': ['Yes', 'No'],
        'fee': new BigNumber('1e17'),
        'outcomeCount': 2,
        'resolverAddress': config.addresses.ultimateOracle,
        'tokenAddress': config.addresses.defaultMarket
      };

      let ids = gnosis.helpers.getEventIdentifiers(eventWithFee);
      return gnosis.helpers.signWithDescription(
        config.account,
        eventWithFee.fee,
        ids.descriptionHash,
        config
      )
      .then((feeData) => {
        expect(feeData).to.be.a('object');

        return new Promise((resolve, reject) => {
          return gnosis.contracts.etherToken.buyTokens(
            new BigNumber('1e17'),
            config,
            promiseCallback(resolve, reject)
          );
        }).then((receipt) => {
          // Need to approve before, tokens to buy
          return new Promise((resolve, reject) => {
            gnosis.contracts.abstractToken.approve(
              config.addresses.etherToken,
              config.addresses.events,
              new BigNumber('1e17'),
              config,
              promiseCallback(resolve, reject)
            );
          })
          .then((receipt) => {
            return new Promise((resolve, reject) => {
              gnosis.contracts.events.createOffChainEvent(
                eventWithFee,
                ids.descriptionHash,
                [feeData],
                config,
                promiseCallback(resolve, reject)
              );
            }).then((receipt) => {
              expect(receipt).to.be.a('object');
              expect(receipt.transactionHash).to.be.a('string');
              // Get event from description_hash
              return new Promise((resolve, reject) => {
               gnosis.contracts.events.getEventHashes(
                 [ids.descriptionHash],
                 config,
                 promiseCallback(resolve, reject)
               ).call();
              })
              .then((result) => {
                  expect(result).to.be.a('array');
                  expect(result.length).to.be.above(0);
              });
            });
          });
        });
      });
    });

    it('permit permanent approval', () => {
      return gnosis.contracts.events.permitPermanentApproval(
        config.addresses.defaultMarket,
        config
      )
      .then((result) => {
        expect(result.simulatedResult).to.be.true;
      });
    });

    it('check permament approval', () => {
      return new Promise((resolve, reject) => {
        gnosis.contracts.events.isPermanentlyApproved(
          config.account,
          config.addresses.defaultMarket,
          config,
          promiseCallback(resolve, reject)
        ).call();
      })
      .then((approved) => {
        expect(approved).to.be.false;
        return new Promise((resolve, reject) => {
          gnosis.contracts.events.permitPermanentApproval(
            config.addresses.defaultMarket,
            config,
            promiseCallback(resolve, reject)
          );
        })
        .then((receipt) => {
          return new Promise((resolve, reject) => {
            gnosis.contracts.events.isPermanentlyApproved(
              config.account,
              config.addresses.defaultMarket,
              config,
              promiseCallback(resolve, reject)
            ).call();
          }).then((approved) =>
            {
                expect(approved).to.be.true;
            })
        });
      });
    });

    it('check revoke permament approval', () => {
      return new Promise((resolve, reject) => {
        gnosis.contracts.events.permitPermanentApproval(
          config.addresses.defaultMarket,
          config,
          promiseCallback(resolve, reject)
        );
      })
      .then((receipt) => {
        return new Promise((resolve, reject) => {
          gnosis.contracts.events.revokePermanentApproval(
            config.addresses.defaultMarket,
            config,
            promiseCallback(resolve, reject)
          );
        }).then((receipt) => {
            expect(receipt).to.be.a('object');
            return new Promise((resolve, reject) => {
              gnosis.contracts.events.isPermanentlyApproved(
                config.account,
                config.addresses.defaultMarket,
                config,
                promiseCallback(resolve, reject)
              ).call();
            }).then((approved) => {
              expect(approved).to.be.false;
            });
        });
      });

    });
});
