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
      gnosis.state.reset();
      // Initialize gnosis.js config object
      return gnosis.config.initialize(testrpcConfig)
      .then((appConfig) => {
        // make config accesible to all tests
        config = appConfig;

        // Sign event data
        let ids = gnosis.helpers.getEventIdentifiers(testEvent);
        return gnosis.helpers.signOracleFee(
            config.account,
            ids.descriptionHash,
            testEvent.fee,
            testEvent.feeToken,
            config
        )
        .then((feeData) =>
        {
          expect(feeData).to.be.a('object');
          // Create event in the blockchain
          return new Promise((resolve, reject) => {
            gnosis.contracts.eventFactory.createOffChainEvent(
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
                gnosis.contracts.eventFactory.getEventHashes(
                  [ids.descriptionHash],
                  [config.account],
                  config,
                  promiseCallback(resolve, reject)
                ).call();
              }).then((result) => {
                  expect(result).to.be.a('array');
                  expect(result.length).to.be.above(0);

                  // Get event from eventHash
                  eventHash = hex.encode(result[result.length - 1], 256);
                  return new Promise((resolve, reject) => {
                    gnosis.contracts.eventFactory.getEvent(
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
          'feeToken': config.addresses.etherToken,
          'outcomeCount': 2,
          'resolverAddress': config.addresses.ultimateOracle,
          'tokenAddress': config.addresses.etherToken
      };

      let ids = gnosis.helpers.getEventIdentifiers(rangedEvent);
      return gnosis.helpers.signOracleFee(
        config.account,
        ids.descriptionHash,
        rangedEvent.fee,
        rangedEvent.feeToken,
        config
      ).then((feeData)=> {
        expect(feeData).to.be.a('object');
        return new Promise((resolve, reject) => {
          gnosis.contracts.eventFactory.createOffChainEvent(
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
            gnosis.contracts.eventFactory.getEventHashes(
              [ids.descriptionHash],
              [config.account],
              config,
              promiseCallback(resolve, reject)
            ).call();
          }).then((result) => {
            expect(result).to.be.a('array');
            expect(result.length).to.be.above(0);

            // Get event from event_hash
            let rangedEventHash = '0x' + result[result.length-1].toString(16);
            return gnosis.contracts.eventFactory.getEventsProcessed(
              [rangedEventHash],
              config.addresses.ultimateOracle,
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
          'feeToken': config.addresses.etherToken,
          'outcomeCount': 2,
          'resolverAddress': config.addresses.ultimateOracle,
          'tokenAddress': config.addresses.etherToken

      };

      let ids = gnosis.helpers.getEventIdentifiers(onChainEvent);
      return gnosis.helpers.signOracleFee(
        config.account,
        ids.descriptionHash,
        onChainEvent.fee,
        onChainEvent.feeToken,
        config)
        .then((feeData)=> {
          expect(feeData).to.be.a('object');
          return new Promise((resolve, reject) => {
            return gnosis.contracts.eventFactory.createEvent(
              onChainEvent,
              ids.descriptionHash,
              [
                new BigNumber(ids.descriptionHash),
                feeData.fee,
                feeData.feeToken,
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
              gnosis.contracts.eventFactory.getEventHashes(
                [ids.descriptionHash],
                [config.account],
                config,
                promiseCallback(resolve, reject)
              ).call();
            }).then((result) => {
              expect(result).to.be.a('array');
              expect(result.length).to.be.above(0);

              // Get event from event_hash
              let rangedEventHash = '0x'+result[result.length-1].toString(16);
              return gnosis.contracts.eventFactory.getEventsProcessed(
                [rangedEventHash],
                config.addresses.ultimateOracle,
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
        gnosis.contracts.eventFactory.getEvents(
          [eventHash],
          config.addresses.ultimateOracle,
          null,
          config,
          promiseCallback(resolve, reject)
        ).call();
      }).then((result) => {
          expect(result).to.be.a('array');
          expect(result.length).to.equal(13);
      });
    });

    // it('get base fee, ok', () => {
    //   return new Promise((resolve, reject) => {
    //     gnosis.contracts.eventFactory.getBaseFee(
    //       config,
    //       promiseCallback(resolve, reject)
    //     ).call();
    //   }).then((result) => {
    //       expect(result.toString(10)).to.equal("2000");
    //   });
    // });

    it('calcBaseFeeForShares, ok', () => {
      return gnosis.contracts.eventFactory.calcBaseFeeForShares(
        new BigNumber('1e18'),
        config
      ).then((baseFee) => {
        // expect(baseFee.eq(new BigNumber('2004008016032064'))).to.be.true;
        expect(baseFee.eq(new BigNumber('0'))).to.be.true;
      })
    });

    it('calcBaseFee, ok', () => {
      return gnosis.contracts.eventFactory.calcBaseFee(
        new BigNumber('1e18'),
        config
      )
      .then((baseFee) => {
        //expect(baseFee.eq(new BigNumber('2000000000000000'))).to.be.true;
        expect(baseFee.eq(new BigNumber('0'))).to.be.true;
      });
    });

    it('Buy All outcomes, ok', () => {
      return new Promise((resolve, reject) => {
        gnosis.contracts.etherToken.buyTokens(
          new BigNumber('1e19'),
          config,
          promiseCallback(resolve, reject)
        );
      }).then((receipt) => {
        return new Promise((resolve, reject) => {
          // Need to approve before, tokens to buy
          gnosis.contracts.token.approve(
            testEvent.tokenAddress,
            config.addresses.eventFactory,
            new BigNumber('1e19'),
            config,
            promiseCallback(resolve, reject)
          );
        }).then((receipt) => {
          return new Promise((resolve, reject) => {
            gnosis.contracts.eventFactory.buyAllOutcomes(
              eventHash,
              new BigNumber('1e19'),
              config,
              promiseCallback(resolve, reject)
            ).then((result) => {
                expect(result).to.be.a('object');
                expect(result.simulatedResult).to.be.true;
            }, console.error);
          }).then((receipt) => {

          });
        });
      });
    });

    it('buy all outcomes, hunchgame based', () => {
      let event = {
        'kind': 'discrete',
        'title': "hunchgame event",
        'description': "hunchgame event",
        'sourceURL': 'http://gawker.com/',
        'outcomes': ['Yes', 'No'],
        'fee': new BigNumber('0'),
        'feeToken': config.addresses.hunchGameToken,
        'outcomeCount': 2,
        'resolverAddress': config.addresses.ultimateOracle,
        'tokenAddress': config.addresses.hunchGameToken
      };
      let ids = gnosis.helpers.getEventIdentifiers(event);
      return gnosis.helpers.signOracleFee(
        config.account,
        ids.descriptionHash,
        event.fee,
        event.feeToken,
        config
      ).then((feeData)=> {
        expect(feeData).to.be.a('object');
        return new Promise((resolve, reject) => {
          gnosis.contracts.eventFactory.createOffChainEvent(
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
            gnosis.contracts.eventFactory.getEventHashes(
              [ids.descriptionHash],
              [config.account],
              config,
              promiseCallback(resolve, reject)
            ).call();
          })
          .then((result) => {
            expect(result).to.be.a('array');
            expect(result.length).to.be.above(0);

            // Get event from event_hash
            let etherEventHash = '0x'+result[result.length-1].toString(16);

            // Need to approve before, tokens to buy
            return new Promise((resolve, reject) => {
              gnosis.contracts.token.approve(
                event.tokenAddress,
                config.addresses.eventFactory,
                new BigNumber('1e19'),
                config,
                promiseCallback(resolve, reject)
              );
            }).then((receipt) => {
                return gnosis.contracts.eventFactory.buyAllOutcomes(
                  etherEventHash,
                  new BigNumber('1e19'),
                  config
                )
                .then((result) =>
                {
                    expect(result).to.be.a('object');
                });
              });
            });
          });
        });
    });

    it('Buy All outcomes, none ok', () => {

      return gnosis.contracts.eventFactory.buyAllOutcomes(
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

    it('Sell All outcomes, ok', () => {
      return new Promise((resolve, reject) => {
        gnosis.contracts.etherToken.buyTokens(
          new BigNumber('10e19'),
          config,
          promiseCallback(resolve, reject)
        );
      }).then((receipt) => {
        // Need to approve before, tokens to buy
        return new Promise((resolve, reject) => {
          return gnosis.contracts.token.approve(
            testEvent.tokenAddress,
            config.addresses.eventFactory,
            new BigNumber('10e19'),
            config,
            promiseCallback(resolve, reject)
          );
        }).then((receipt) => {
          return gnosis.contracts.eventFactory.buyAllOutcomes(
            eventHash,
            new BigNumber('10e19'),
            config
          )
          .then((result) => {
            return gnosis.contracts.eventFactory.sellAllOutcomes(
              eventHash,
              new BigNumber('1'),
              config
            )
            .then((result) => {
            });
          });
        });
      });
    });

    it('Sell All outcomes, none ok', () => {
      return new Promise((resolve, reject) => {
        gnosis.contracts.etherToken.buyTokens(
          new BigNumber('1e19'),
          config,
          promiseCallback(resolve, reject)
        );
      }).then((receipt) => {
        // Need to approve before, tokens to buy
        return new Promise((resolve, reject) => {
          gnosis.contracts.token.approve(
            testEvent.tokenAddress,
            config.addresses.eventFactory,
            new BigNumber('10e19'),
            config,
            promiseCallback(resolve, reject)
          );
        }).then((receipt) => {
          return gnosis.contracts.eventFactory.sellAllOutcomes(
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
    });

    it('Redeem winnings without winning outcome set', () => {
      return new Promise((resolve, reject) => {
        gnosis.contracts.etherToken.buyTokens(
          new BigNumber('1e19'),
          config,
          promiseCallback(resolve, reject)
        );
      }).then((receipt) => {
        // Need to approve before, tokens to buy
        return new Promise((resolve, reject) => {
          gnosis.contracts.token.approve(
            testEvent.tokenAddress,
            config.addresses.eventFactory,
            new BigNumber('10e19'),
            config,
            promiseCallback(resolve, reject)
          );
        }).then((receipt) => {
          return gnosis.contracts.eventFactory.redeemWinnings(
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
    });

    it('get Shares', () => {
      return new Promise((resolve, reject) => {
        gnosis.contracts.etherToken.buyTokens(
          new BigNumber('10e19'),
          config,
          promiseCallback(resolve, reject)
        );
      }).then((receipt) => {
        // Need to approve before, tokens to buy
        return new Promise((resolve, reject) => {
          gnosis.contracts.token.approve(
            testEvent.tokenAddress,
            config.addresses.eventFactory,
            new BigNumber('10e19'),
            config,
            promiseCallback(resolve, reject)
          );
        }).then((receipt) => {
          // Buy outcomes to take shares of the event
          return new Promise((resolve, reject) => {
            gnosis.contracts.eventFactory.buyAllOutcomes(
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
                gnosis.contracts.eventFactory.getShares(
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
    });

    it('create event with fee', () => {
      let eventWithFee = {
        'kind': 'discrete',
        'title': "event with fee",
        'description': "event with fee",
        'sourceURL': 'http://gawker.com/',
        'outcomes': ['Yes', 'No'],
        'fee': new BigNumber('1e18'),
        'feeToken': config.addresses.etherToken,
        'outcomeCount': 2,
        'resolverAddress': config.addresses.ultimateOracle,
        'tokenAddress': config.addresses.etherToken
      };


      let ids = gnosis.helpers.getEventIdentifiers(eventWithFee);
      return gnosis.helpers.signOracleFee(
        config.account,
        ids.descriptionHash,
        eventWithFee.fee,
        eventWithFee.feeToken,
        config
      )
      .then((feeData) => {
        expect(feeData).to.be.a('object');

        return new Promise((resolve, reject) => {
          return gnosis.contracts.etherToken.buyTokens(
            eventWithFee.fee,
            config,
            promiseCallback(resolve, reject)
          );
        }).then((receipt) => {
          // Need to approve before, tokens to buy
          return new Promise((resolve, reject) => {
            gnosis.contracts.token.approve(
              config.addresses.etherToken,
              config.addresses.eventFactory,
              eventWithFee.fee,
              config,
              promiseCallback(resolve, reject)
            );
          })
          .then((receipt) => {
            return new Promise((resolve, reject) => {
              gnosis.contracts.eventFactory.createOffChainEvent(
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
               gnosis.contracts.eventFactory.getEventHashes(
                 [ids.descriptionHash],
                 [config.account],
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
      return gnosis.contracts.eventFactory.permitPermanentApproval(
        config.addresses.hunchGameToken,
        config
      )
      .then((result) => {
      });
    });

    it('check permament approval', () => {
      return new Promise((resolve, reject) => {
        gnosis.contracts.eventFactory.isPermanentlyApproved(
          config.account,
          config.addresses.hunchGameToken,
          config,
          promiseCallback(resolve, reject)
        ).call();
      })
      .then((approved) => {
        expect(approved).to.be.false;
        return new Promise((resolve, reject) => {
          gnosis.contracts.eventFactory.permitPermanentApproval(
            config.addresses.hunchGameToken,
            config,
            promiseCallback(resolve, reject)
          );
        })
        .then((receipt) => {
          return new Promise((resolve, reject) => {
            gnosis.contracts.eventFactory.isPermanentlyApproved(
              config.account,
              config.addresses.hunchGameToken,
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
        gnosis.contracts.eventFactory.permitPermanentApproval(
          config.addresses.hunchGameToken,
          config,
          promiseCallback(resolve, reject)
        );
      })
      .then((receipt) => {
        return new Promise((resolve, reject) => {
          gnosis.contracts.eventFactory.revokePermanentApproval(
            config.addresses.hunchGameToken,
            config,
            promiseCallback(resolve, reject)
          );
        }).then((receipt) => {
            expect(receipt).to.be.a('object');
            return new Promise((resolve, reject) => {
              gnosis.contracts.eventFactory.isPermanentlyApproved(
                config.account,
                config.addresses.hunchGameToken,
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
