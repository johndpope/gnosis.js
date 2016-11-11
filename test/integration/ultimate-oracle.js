/**
 * Created by denisgranha on 6/6/16.
 */
import testrpcConfig from './config';
import gnosis from '../../src/';
import {expect} from 'chai';
import * as util from 'util';
import {exec} from 'child_process';
import BigNumber from 'bignumber.js';
import {promiseCallback} from '../../src/lib/callbacks';
import * as hex from '../../src/lib/hex';

describe('ultimate oracle', function runTests()
{
  this.timeout(80000);
  let config;
  let state;
  let descriptionHash;
  let eventIdentifier;

  beforeEach(() =>
  {
    return gnosis.config.initialize(
      testrpcConfig
    )
    .then((initializedConfig) =>
    {
      config = initializedConfig;
      const command = "node --require babel-register " +
      "--require babel-polyfill " +
      "stress_tests/create_events_and_buy_outcomes 1";

      const command_options = {cwd: __dirname + "/../../"};
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
        return gnosis.state.buildState(
          config
        )
        .then((build) =>
        {
          state = build;
          descriptionHash = Object.keys(state.eventDescriptions)[0];
          eventIdentifier = state.events[Object.keys(state.events)[0]]
            .eventIdentifier;
        });
      });
    });
  });

  it('getOracleOutcomes', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.ultimateOracle.getOracleOutcomes(
        [descriptionHash],
        [config.account],
        config,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((outcomes) => {
      expect(outcomes).to.be.a('array');
      expect(outcomes.length).to.equal(0);
      return new Promise((resolve, reject) => {
        gnosis.contracts.ultimateOracle.setOutcome(
          eventIdentifier,
          descriptionHash,
          new BigNumber('1000'),
          config.account,
          config,
          promiseCallback(resolve, reject)
        );
      })
      .then((receipt) => {
        expect(receipt).to.be.a('object');

        return new Promise((resolve, reject) => {
          return gnosis.contracts.ultimateOracle.getOracleOutcomes(
            [descriptionHash],
            [config.account],
            config,
            promiseCallback(resolve, reject)
          ).call();
        })
        .then((outcomes) => {
            expect(outcomes).to.be.a('array');
            expect(hex.encode(outcomes[0], 256)).to.equal(descriptionHash);
            expect(outcomes[1].eq(1)).to.be.true;
            expect('0x' + outcomes[2].toString(16)).to.equal(config.account);
            expect(outcomes[3].greaterThan(0)).to.be.true;
            expect(outcomes[4].eq(1000)).to.be.true;
          });
        });
      });
  });

  it('getUltimateOutcomes, without winning outcomes', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.ultimateOracle.getUltimateOutcomes(
        [descriptionHash],
        [new BigNumber('0')],
        config,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((result) => {
      expect(result).to.be.a('array');
      expect(result.length).to.equal(10);
      expect(hex.encode(result[0], 256)).to.equal(descriptionHash);
      expect(result[1].eq(0)).to.be.true; // isFinalOutcome
      expect(result[2].eq(0)).to.be.true; // closingAtTimeStamp
      expect(result[3].eq(0)).to.be.true; // frontRunner
      expect(result[4].eq(0)).to.be.true; // frontRunnerShares
      expect(result[5].eq(0)).to.be.true; // SharesFrontRunner
      expect(result[6].eq(0)).to.be.true; // SharesOutcome
      expect(result[7].eq(0)).to.be.true; // totalDeposits
      expect(result[8].eq(0)).to.be.true; // depositsFrontRunner
      expect(result[9].eq(0)).to.be.true; // depositsOutcome
    });
  });

  it('challenge oracle outcome', () => {
    return new Promise((resolve, reject) => {
      return gnosis.contracts.ultimateOracle.setOutcome(
        eventIdentifier,
        descriptionHash,
        new BigNumber('1'),
        config.account,
        config,
        promiseCallback(resolve, reject)
      );
    })
    .then((receipt) => {
      expect(receipt).to.be.a('object');
      return gnosis.contracts.etherToken.buyTokens(
        new BigNumber('1e20'),
        config
      )
      .then(function(result){
        return gnosis.contracts.token.approve(
          config.addresses.etherToken,
          config.addresses.ultimateOracle,
          new BigNumber('1e20'),
          config
        )
        .then(function(result){
          return gnosis.contracts.ultimateOracle.challengeOracle(
            descriptionHash,
            config.account,
            new BigNumber('0'),
            config
          )
          .then((result) => {
          });
        });
      });
    });
  });

  it('getShares without challenge', () => {
    return new Promise((resolve, reject) => {
      return gnosis.contracts.ultimateOracle.getShares(
        config.account,
        [descriptionHash],
        [new BigNumber('0')], // can only get one outcome for each event
        config,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((result) => {
      expect(result).to.be.a('array');
      expect(result.length).to.equal(1);
      expect(result[0].eq(0)).to.be.true;
    });
  });

  it('getShares', () => {
    return new Promise((resolve, reject) => {
      return gnosis.contracts.ultimateOracle.setOutcome(
        eventIdentifier,
        descriptionHash,
        new BigNumber('1'),
        config.account,
        config,
        promiseCallback(resolve, reject)
      );
    })
    .then((receipt) => {
      return gnosis.contracts.etherToken.buyTokens(
        new BigNumber('1e21'),
        config
      )
      .then(function(result){
        return gnosis.contracts.token.approve(
          config.addresses.etherToken,
          config.addresses.ultimateOracle,
          new BigNumber('1e21'),
          config
        )
        .then(function(result){
          return new Promise((resolve, reject) => {
            return gnosis.contracts.ultimateOracle.challengeOracle(
              descriptionHash,
              config.account,
              new BigNumber('0'),
              config,
              promiseCallback(resolve, reject)
            ).catch(reject);
          })
          .then((receipt) =>
          {
            expect(receipt).to.be.a('object');
            return new Promise((resolve, reject) => {
              return gnosis.contracts.ultimateOracle.getShares(
                config.account,
                [descriptionHash],
                [new BigNumber('0')], // can only get one outcome for each event
                config,
                promiseCallback(resolve, reject)
              ).call();
            })
            .then((result) =>
            {
              expect(result).to.be.a('array');
              expect(result.length).to.equal(1);
              expect(result[0].eq(new BigNumber('1e20'))).to.be.true;
            });
          });
        });
      });
    });
  });

  it('voteForUltimateOutcome', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.ultimateOracle.setOutcome(
        eventIdentifier,
        descriptionHash,
        new BigNumber('1'),
        config.account,
        config,
        promiseCallback(resolve, reject)
      );
    })
    .then((receipt) =>
    {
      return gnosis.contracts.etherToken.buyTokens(
        new BigNumber('1e23'),
        config
      )
      .then(function(result){
        return gnosis.contracts.token.approve(
          config.addresses.etherToken,
          config.addresses.ultimateOracle,
          new BigNumber('1e23'),
          config
        )
        .then(function(result){
          return new Promise((resolve, reject) => {
            gnosis.contracts.ultimateOracle.challengeOracle(
              descriptionHash,
              config.account,
              new BigNumber('0'),
              config,
              promiseCallback(resolve, reject)
            );
          })
          .then((receipt) =>
          {
            expect(receipt).to.be.a('object');
            return gnosis.contracts.ultimateOracle.voteForUltimateOutcome(
              descriptionHash,
              new BigNumber('1'),
              new BigNumber('1e21'),
              config
            )
            .then((result) =>
            {

            });
          });
        });
      });
    });
  });

  it('setUltimateOutcome after voting for Ultimate Outcome', () => {
    return new Promise((resolve, reject) => {
      return gnosis.contracts.ultimateOracle.setOutcome(
        eventIdentifier,
        descriptionHash,
        new BigNumber('1'),
        config.account,
        config,
        promiseCallback(resolve, reject)
      );
    })
    .then((receipt) =>
    {
      return gnosis.contracts.etherToken.buyTokens(
        new BigNumber('1e23'),
        config
      )
      .then(function(result){
        return gnosis.contracts.token.approve(
          config.addresses.etherToken,
          config.addresses.ultimateOracle,
          new BigNumber('1e23'),
          config
        )
        .then(function(result){
          return new Promise((resolve, reject) => {
            return gnosis.contracts.ultimateOracle.challengeOracle(
              descriptionHash,
              config.account,
              new BigNumber('0'),
              config,
              promiseCallback(resolve, reject)
            );
          })
          .then((receipt) =>
          {
            expect(receipt).to.be.a('object');

            return new Promise((resolve, reject) => {
              return gnosis.contracts.ultimateOracle.voteForUltimateOutcome(
                descriptionHash,
                new BigNumber('1'),
                new BigNumber('1e21'),
                config,
                promiseCallback(resolve, reject)
              );
            })
            .then((receipt) =>
            {
              expect(receipt).to.be.a('object');

              return new Promise((resolve, reject) => {
                config.web3.eth.getBlock(
                  "latest",
                  promiseCallback(resolve, reject)
                );
              })
              .then((response) =>
              {
                // console.log("Before change %s", response.timestamp);
                var futureTime = Math.ceil(response.timestamp + 60 * 60 * 24 * 365);

                return new Promise((resolve, reject) => {
                  //change timestamp
                  config.web3.currentProvider.sendAsync(
                    {
                      jsonrpc: "2.0",
                      method: "evm_increaseTime",
                      id: 12346,
                      params: [60 * 60 * 24 * 365]
                    },
                    promiseCallback(resolve, reject)
                  );
                })
                .then((changeT) =>
                {

                  return new Promise((resolve, reject) => {
                    config.web3.currentProvider.sendAsync(
                      {
                        jsonrpc: "2.0",
                        method: "evm_mine",
                        id: 12346,
                        params: []
                      },
                      promiseCallback(resolve, reject)
                    );
                  })
                  .then((mineBlocks) =>
                  {

                    return new Promise((resolve, reject) => {
                      gnosis.contracts.ultimateOracle.setUltimateOutcome(
                        descriptionHash,
                        config,
                        promiseCallback(resolve, reject)
                      );
                    })
                    .then((receipt) =>
                    {
                        expect(receipt).to.be.a('object');
                        return new Promise((resolve, reject) => {
                          gnosis.contracts.ultimateOracle.getUltimateOutcomes(
                            [descriptionHash],
                            [new BigNumber('1')],
                            config,
                            promiseCallback(resolve, reject)
                          ).call();
                        })
                        .then((result) =>
                        {
                          expect(result).to.be.a('array');
                          expect(result.length).to.equal(10);
                          expect(hex.encode(result[0], 256)).to
                            .equal(descriptionHash);
                          expect(result[1].eq(1)).to.be.true; // isFinal
                          expect(result[2].greaterThan(0)).to.be.true; // timestamp
                          expect(result[3].eq(1)).to.be.true;
                          expect(result[4].eq(new BigNumber('4e20'))).to.be.true;
                          expect(result[5].eq(new BigNumber('3e20'))).to.be.true;
                          expect(result[6].eq(new BigNumber('3e20'))).to.be.true;
                          expect(result[7].eq(new BigNumber('0'))).to.be.true;
                          expect(result[8].eq(new BigNumber('0'))).to.be.true;
                          expect(result[9].eq(new BigNumber('0'))).to.be.true;

                          return gnosis.contracts.ultimateOracle.redeemWinnings(
                              descriptionHash,
                              config
                          )
                          .then((result) =>
                          {                              
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
});
