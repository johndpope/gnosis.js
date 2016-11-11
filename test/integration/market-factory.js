/**
 * Created by denisgranha on 8/4/16.
 */

import {expect} from 'chai';
import gnosis from '../../src/';
import testrpcConfig from './config';
import BigNumber from 'bignumber.js';
import {requestWithBlockNumber} from '../../src/lib/web3-batch';
import * as hex from '../../src/lib/hex';
import {promiseCallback} from '../../src/lib/callbacks';

const market = {
  fee: new BigNumber('0'),
  initialFunding: new BigNumber('1e19'),
  makerAddress: testrpcConfig.addresses.defaultMarketMaker
};

const testEvent = testrpcConfig.events[0];

// Event hash for event used on create.js tests
let eventHash;
let eventData;

describe('markets', function testSuite()
{
  let config;
  let marketHashes;
  let marketHash;
  this.timeout(40000);

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
              eventData = eventInfo;
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
                    ).catch(reject);
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

  it('outcome identifier', () => {
      let identifier = gnosis.helpers
        .outcomeIdentifier(
          '0xed7102bbde47ebfd882c8d2cd9ad2ffe7dd09502c6ef9f3da9266b1a77caa553',
          0
        );
      expect(identifier).to.be.a('string');
      expect(identifier).to.equal(
        '0x11fc1fc9bff219a34bc7596d8b32c0f3b5884b200ca92c3123ab764f839df012'
      );
  });

  it('close market with callback', () => {
    return new Promise((resolve, reject) => {
     gnosis.contracts.marketFactory.closeMarket(
       marketHash,
       config,
       null,
       promiseCallback(resolve, reject)
     );
    })
    .then((receipt) => {
      expect(receipt).to.be.a('object');
    });
  });

  it('get market hashes unknown event', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.marketFactory.getMarketHashes(
        ['0xunknown'],
        [config.account],
        config,
        null,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((result) => {
      expect(result).to.be.a('array');
      expect(result.length).to.equal(0);
    });
  });

  it('get markets from hashes', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.marketFactory.getMarket(
        marketHash,
        config,
        null,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((result) => {
      expect(result).to.be.a('array');
      expect(new BigNumber(result[3]).greaterThan(0)).to.be.true;
      // Is the initial funding
    });
  });

  it('get shares distribution with timestamp', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.marketFactory.getShareDistributionWithTimestamp(
        marketHash,
        'latest',
        config,
        null,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((result) => {
      expect(result).to.be.a('array');
      expect(result.length).to.equal(3);
      expect(new Date(result[0].toString(10))).to.be.ok;
    });
  });

  it('get share distribution', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.marketFactory.getShareDistribution(
        marketHash,
        'latest',
        config,
        null,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((shareDistribution) => {
      expect(shareDistribution).to.be.a('array');
      expect(shareDistribution[0].greaterThan(0)).to.be.true;
    });
  });

  it('calc base fee', () => {
      return gnosis.contracts.eventFactory.calcBaseFeeForShares(
        new BigNumber('1e18'),
        config
      )
      .then((fee) => {
        // expect(fee.toString(10)).to.equal('2004008016032064');
        expect(fee.toString(10)).to.equal('0');
      });
  });

  it('buy shares', () => {
    return gnosis.contracts.eventFactory.calcBaseFee(
      new BigNumber('1e19'),
      config
    )
    .then((fee) => {
      let initialFunding = new BigNumber('1e19').minus(fee);
      return new Promise((resolve, reject) => {
        gnosis.contracts.marketMaker.calcCostsBuying(
          marketHash,
          initialFunding,
          [initialFunding, initialFunding],
          1,
          new BigNumber('1e18'),
          config,
          config.addresses.defaultMarketMaker,
          promiseCallback(resolve, reject)
        ).call();
      })
      .then((buyCost) => {
        expect(buyCost.greaterThan(0)).to.be.true;
        return gnosis.contracts.eventFactory.calcBaseFeeForShares(
          new BigNumber('1e18'),
          config
        )
        .then((fee) => {
          let maxPrice = fee.plus(buyCost);

          return new Promise((resolve, reject) => {
            gnosis.contracts.etherToken.buyTokens(
              maxPrice,
              config,
              promiseCallback(resolve, reject)
            ).catch(reject);
          }).then((receipt) => {
            return new Promise((resolve, reject) => {
              // Need to approve before, tokens to buy
              gnosis.contracts.token.approve(
                testEvent.tokenAddress,
                config.addresses.defaultMarketFactory,
                maxPrice,
                config,
                promiseCallback(resolve, reject)
              ).catch(reject);
            }).then((receipt) => {

              return gnosis.contracts.marketFactory.buyShares(
                marketHash,
                1,
                new BigNumber('1e18'),
                maxPrice,
                config
              )
              .then((result) => {
                  expect(result).to.be.a('object');
              });
            });
          });
        });
      });
    });
  });

  it('buy shares hunchgame based event', () => {
    let descriptionHash = hex.encode(new BigNumber('123456'), 256);
    let etherEvent = {
      kind: 'discrete',
      descriptionHash,
      'fee': new BigNumber('0'),
      'feeToken': config.addresses.hunchGameToken,
      'outcomeCount': 2,
      'resolverAddress': config.addresses.ultimateOracle,
      'tokenAddress': config.addresses.hunchGameToken
    };

    return gnosis.helpers.signOracleFee(
      config.account,
      descriptionHash,
      etherEvent.fee,
      etherEvent.feeToken,
      config
    )
    .then((feeData) => {
      expect(feeData).to.be.a('object');
      let etherEventHash;

      return new Promise((resolve, reject) => {
        gnosis.contracts.eventFactory.createOffChainEvent(
          etherEvent,
          descriptionHash,
          [feeData],
          config,
          promiseCallback(resolve, reject)
        )
        .then((result) => {
          etherEventHash = result.simulatedResult;
        });
      })
      .then((receipt) => {
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
          let etherMarketHash;
          // Using market.sol contract because hunchgame contract only
          // allows to create market with
          // Hunchgame Contract as currency address
          return new Promise((resolve, reject) => {
            gnosis.contracts.marketFactory.createMarket(
              market,
              etherEventHash,
              config,
              config.addresses.hunchGameMarketFactory,
              promiseCallback(resolve, reject)
            ).then((result) => {
                etherMarketHash = result.simulatedResult;
            });
          })
          .then((receipt) => {
              return gnosis.contracts.eventFactory.calcBaseFee(
                new BigNumber('1e19'),
                config
              )
              .then((fee) => {
                let initialFunding = new BigNumber('1e19').minus(fee);

                return new Promise((resolve, reject) => {
                  gnosis.contracts.marketMaker.calcCostsBuying(
                    etherMarketHash,
                    initialFunding,
                    [initialFunding, initialFunding],
                    1,
                    new BigNumber('1e18'),
                    config,
                    config.addresses.defaultMarketMaker,
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
                    return gnosis.contracts.marketFactory.buyShares(
                      etherMarketHash,
                      1,
                      new BigNumber('1e18'),
                      maxPrice,
                      config,
                      config.addresses.hunchGameMarketFactory,
                      null
                    )
                    .then((result) =>
                    {
                        expect(result).to.be.a('object');
                        expect(
                          new BigNumber(result.simulatedResult
                          ).greaterThan(0)).to.be.true;
                  });
                });
              });
            });
          });
        });
      });
    });
  });


  it('buy 0 shares known market', () => {
    return gnosis.contracts.marketFactory.buyShares(
      marketHash,
      1,
      new BigNumber('0'),
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

  it('buy shares unknown market', () => {

    return gnosis.contracts.marketFactory.buyShares(
      "0xf",
      new BigNumber('1'),
      new BigNumber('1e19'),
      new BigNumber('1e19'),
      config
    )
    .catch((error) => {
      expect(error).to.be.ok;
    });

  });

  it('sell shares, ok', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.eventFactory.permitPermanentApproval(
        config.addresses.defaultMarketFactory,
        config,
        promiseCallback(resolve, reject)
      );
    })
    .then((receipt) => {
      // Buy Shares before sell
      return gnosis.contracts.marketFactory.getMarketsProcessed(
        [marketHash],
        config,
        config.account,
        config.addresses.defaultMarketFactory
      )
      .then((markets) =>
      {
        expect(markets).to.be.a('object');
        expect(Object.keys(markets).length).to.equal(1);
        let market = markets[marketHash];
        expect(market).to.be.a('object');

        return new Promise((resolve, reject) => {
          gnosis.contracts.marketMaker.calcCostsBuying(
              marketHash,
              market.initialFunding,
              market.shares,
              1,
              new BigNumber('1e20'),
              config,
              config.addresses.defaultMarketMaker,
              promiseCallback(resolve, reject)
            ).call();
        })
        .then((buyCost) =>
        {
          expect(buyCost.greaterThan(0)).to.be.true;
          return gnosis.contracts.eventFactory.calcBaseFeeForShares(
            new BigNumber('1e20'),
            config
          )
          .then((fee) => {
              var maxPrice = fee.plus(buyCost);

              return new Promise((resolve, reject) => {
                gnosis.contracts.etherToken.buyTokens(
                  maxPrice,
                  config,
                  promiseCallback(resolve, reject)
                ).catch(reject);
              }).then((receipt) => {
                return new Promise((resolve, reject) => {
                  // Need to approve before, tokens to buy
                  gnosis.contracts.token.approve(
                    testEvent.tokenAddress,
                    config.addresses.defaultMarketFactory,
                    maxPrice,
                    config,
                    promiseCallback(resolve, reject)
                  ).catch(reject);
                }).then((receipt) => {

                  return gnosis.contracts.marketFactory.buyShares(
                    marketHash,
                    1,
                    new BigNumber('1e20'),
                    maxPrice,
                    config
                  )
                  .then((result) =>
                  {
                    expect(result).to.be.a('object');
                    expect(new BigNumber(result.simulatedResult)
                      .greaterThan(0)).to.be.true;

                    return new Promise((resolve, reject) => {
                      gnosis.contracts.marketFactory.getShareDistributionWithTimestamp(
                          marketHash,
                          'latest',
                          config,
                          null,
                          promiseCallback(resolve, reject)
                        ).call();
                    })
                    .then((shareDistributionT) =>
                    {
                      var shareDistribution = [
                        shareDistributionT[1],
                        shareDistributionT[2]
                      ];
                      // Calc sell price
                      return new Promise((resolve, reject) => {
                        gnosis.contracts.marketMaker.calcEarningsSelling(
                          marketHash,
                          market.initialFunding,
                          shareDistribution,
                          1,
                          new BigNumber('1e20'),
                          config,
                          config.addresses.defaultMarketMaker,
                          promiseCallback(resolve, reject)
                        ).call();
                      })
                      .then((sellPrice) =>
                      {
                        expect(sellPrice.greaterThan(0)).to.be.true;

                        return new Promise((resolve, reject) => {
                          // Need to approve before, tokens to buy
                          gnosis.contracts.token.approve(
                            testEvent.tokenAddress,
                            config.addresses.defaultMarketFactory,
                            sellPrice,
                            config,
                            promiseCallback(resolve, reject)
                          ).catch(reject);
                        }).then((receipt) => {
                          return gnosis.contracts.marketFactory.sellShares(
                              marketHash,
                              new BigNumber('1'),
                              new BigNumber('1e20'),
                              sellPrice,
                              config
                          )
                          .then((result) =>
                          {
                            expect(result.simulatedResult.greaterThan(0)).to.be.true;
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
    });
  });



  it('close market', () => {
      return gnosis.contracts.marketFactory.closeMarket(
          marketHash,
          config)
          .then((result) => {
              expect(result).to.be.a('object');
          });
  });


  it('withdraw fees unknown market', () => {
      return gnosis.contracts.marketFactory.withdrawFees(
          marketHash+'8',
          config)
          .catch(
            (error) => {
                expect(error).to.be.ok;
            }
          );
  });

  it('withdraw 0 fees known market', () => {
      return gnosis.contracts.marketFactory.withdrawFees(
          marketHash,
          config)
          .catch(
            (error) => {
                expect(error).to.be.ok;
            }
          );
  });

  it('withdraw >0 fees known market', () => {
    const marketWithFee = {
      fee: new BigNumber('1e3'),
      initialFunding: new BigNumber('1e19'),
      makerAddress: testrpcConfig.addresses.defaultMarketMaker
    };

    return new Promise((resolve, reject) => {
      gnosis.contracts.marketFactory.closeMarket(
        marketHash,
        config,
        null,
        promiseCallback(resolve, reject)
      ).catch(reject);
    })
    .then((receipt) => {
      let marketWithFeeHash;

      return new Promise((resolve, reject) => {
        gnosis.contracts.etherToken.buyTokens(
          marketWithFee.initialFunding.plus('1e19'),
          config,
          promiseCallback(resolve, reject)
        ).catch(reject);
      }).then((receipt) => {
        return new Promise((resolve, reject) => {
          // Need to approve before, tokens to buy
          gnosis.contracts.token.approve(
            testEvent.tokenAddress,
            config.addresses.defaultMarketFactory,
            marketWithFee.initialFunding.plus('1e19'),
            config,
            promiseCallback(resolve, reject)
          ).catch(reject);
        }).then((receipt) => {

          return new Promise((resolve, reject) => {
            gnosis.contracts.marketFactory.createMarket(
              marketWithFee,
              eventHash,
              config,
              null,
              promiseCallback(resolve, reject)
            )
            .then((result) =>
            {
              expect(new BigNumber(result.simulatedResult)
                .greaterThan(0)).to.be.true;
              marketWithFeeHash = result.simulatedResult;
            }, reject);
          })
          .then((receipt) =>
          {
            return gnosis.contracts.marketFactory.shortSellShares(
              marketWithFeeHash,
              1,
              new BigNumber('1e19'),
              new BigNumber('50868806086513421'),
              config
            )
            .then((result) =>
            {
              expect(result.simulatedResult.greaterThan(0)).to.be.true;
              return gnosis.contracts.marketFactory.withdrawFees(
                marketWithFeeHash,
                config
              )
              .then((result) => {
                  expect(result.simulatedResult.greaterThan(0)).to.be.true;
                });
              });

            });
          });
        });
    });
  });

  // it('short sell 0 shares', () => {}); // contract raises a throw statement

  // it('short sell shares unknown market', () => {}); // contract raises a throw statement



});
