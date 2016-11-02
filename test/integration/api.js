import _ from 'lodash';
import BigNumber from 'bignumber.js';
import Promise from 'bluebird';
import {expect} from 'chai';
import {ec as EC} from 'elliptic';
import Rx from 'rx';
import gnosis from '../../src/';
import * as hex from '../../src/lib/hex';

import testrpcConfig from './config';

global.Promise = Promise;
// Use bluebird for better error logging during development.

const testName = "gnosis";
const testEmail = "test@groupgnosis.com";

const onChainOracle = {
    name: "On Chain Gnosis",
    description: "On Chain Oracle",
    sourceCode: "something big",
    compilerVersion: "1e75as",
    compilerFlags: "-v -f -a"
};

const eventRevision = {
  // Description Hash for above event
  title: "New title",
  description: "New description",
  sourceURL: 'http://groupgnosis.com',
  resolutionDate: '2018-11-02T08:30:30Z',
  outcomes: ['Yes', 'No'],
  nonce: 1
};

let challenge = {
    // Set on the initialize
    oracleAddress: '',
    reason: 'Wrong outcome',
};

const event = testrpcConfig.events[0];

describe('Create events', function createEvent() {
  this.timeout(20000);
  // Store the event in a variable for use in each test.
  let config;

  beforeEach(() => {
    return gnosis.config.initialize(testrpcConfig).then((appConfig) => {
      config = appConfig;
        challenge.oracleAddress = config.accounts[0];
    });
  });


  describe('events', () => {
    it('create ranged event ok', () => {
        let rangedEvent = {
            'kind': 'ranged',
            'tags': ['kanye-west', 'kim-kardashian'],
            'title': "Kim and Kanye's second baby will be a boy.",
            'description': "Kim and Kanye's second baby will be a boy.",
            'sourceURL': 'http://gawker.com/',
            'resolutionDate': '2018-11-02T08:30:30Z',
            'unit': 'eth',
            'decimals': 10,
            'fee': new BigNumber('1e17'), // 0.5 ether
            'feeToken': config.addresses.etherToken
        };

        return gnosis.api.createEvent(rangedEvent, config.account, config)
            .then((response) => {
                expect(response.status).to.equal(201);
            });
    });

    it('create ranged event without subscribe', () => {
      let rangedEvent = {
          'kind': 'ranged',
          'tags': ['kanye-west', 'kim-kardashian'],
          'title': "Kim and Kanye's second baby will be a boy. (on chain event)",
          'description': "Kim and Kanye's second baby will be a boy.",
          'sourceURL': 'http://gawker.com/',
          'resolutionDate': '2018-11-02T08:30:30Z',
          'unit': 'eth',
          'decimals': 10
      };

      return gnosis.api.createEvent(rangedEvent, config.account, config)
        .then((response) =>
        {
          expect(response.status).to.equal(201);
        });

    });

    it('create event fail, duplicated', (done) => {
        return gnosis.api.createEvent(event, config.account, config)
            .then((response) => {
                expect(response.status).to.equal(201);
                return gnosis.api.createEvent(event, config.account, config)
                    .then((response) => {
                        },
                        (error) => {
                            done();
                        });
            });
    });

    it('create event with fee and email', () => {
      event.email = "test@test.com";
      return gnosis.api.createEvent(event, config.account, config)
        .then((response) => {
          expect(response.status).to.equal(201);
        });
    });

    it('subscribe fail, oracle already registered', () => {
      return gnosis.api.createEvent(event, config.account, config)
        .then((response) => {
          expect(response.status).to.equal(201);
          let descriptionHash = response.data.descriptionHash;
          expect(descriptionHash).to.be.a('string');
            return gnosis.api.subscribeOracleToEvent(
              new BigNumber('2'),
              config.addresses.etherToken,
              descriptionHash,
              config.account,
              null,
              config
            )
            .catch(
            (error) => {
              expect(error).to.be.a('object');
            });
        });
    });

    it("subscribe oracle to event ok", () =>
    {
      return gnosis.api.createEvent(event, config.account, config)
          .then((response) => {
              expect(response.status).to.equal(201);
              let descriptionHash = response.data.descriptionHash;
              expect(descriptionHash).to.be.a('string');
              return gnosis.api.subscribeOracleToEvent(
                new BigNumber('1'),
                config.addresses.etherToken,
                descriptionHash,
                config.accounts[1],
                'test@gnosis.pm',
                config
              )
                .then((result) =>
                {
                    expect(result).to.be.a('object');
                    expect(result.data.offChainOracles).to.be.a('object');
                    expect(Object.keys(result.data.offChainOracles).length)
                      .to.equal(2);
                });
        });
    });

  });

  describe('event results', () => {
      it("publish result ok", () => {
        return gnosis.api.createEvent(event, config.account, config)
          .then((response) =>
          {
            expect(response.status).to.equal(201);
            let descriptionHash = response.data.descriptionHash;
            expect(descriptionHash).to.be.a('string');
            let result = {
              result: new BigNumber('1'),
              descriptionHash,
              publicationDate: new Date()
            }
            return gnosis.api.postResult(
              result,
              config.account,
              config)
                .then((result) =>
                {
                  expect(result.data).to.be.a('object');
                  expect(result.data.descriptionHash)
                    .to.equal(descriptionHash);
                  expect(Object.keys(result.data.offChainOracles).length)
                    .to.equal(1);
                  expect(result.data.offChainOracles[config.account])
                    .to.be.a('object');
                  expect(result.data.offChainOracles[config.account].result)
                    .to.be.a('object');
                });
          });
      });

      it("publish result, unknown oracle", () => {
        return gnosis.api.createEvent(event, config.account, config)
          .then((response) =>
          {
            let descriptionHash = response.data.descriptionHash;
            expect(descriptionHash).to.be.a('string');
            let result = {
              result: new BigNumber('1'),
              descriptionHash,
              publicationDate: new Date()
            }
            return gnosis.api.postResult(
              result,
              config.accounts[2],
              config)
                .then((result) =>
                {
                },
                (error) =>
                {
                  expect(error).to.be.a('object');
                  expect(error.status).to.equal(401);
                  expect(error.data.detail).to.equal('Oracle not found');
                });
          });
      });

      it("report result ok", () => {
        return gnosis.api.createEvent(event, config.account, config)
          .then((response) =>
          {
            expect(response.status).to.equal(201);
            let descriptionHash = response.data.descriptionHash;
            expect(descriptionHash).to.be.a('string');
            let result = {
              result: new BigNumber('1'),
              descriptionHash,
              publicationDate: new Date(new Date().getTime() + 1000*60*60*24),
              email: "denis@gnosis.pm"
            }
            return gnosis.api.postResult(
              result,
              config.account,
              config)
                .then((result) =>
                {
                  return gnosis.api.reportResult(
                    "something wrong", // report message
                    descriptionHash,
                    config.account,
                    config.accounts[1],
                    config
                  )
                  .then((response) => {
                    expect(response.status).to.equal(201);
                  });
                });
          });
      });

      it("report result without oracle email", () => {
        return gnosis.api.createEvent(event, config.account, config)
          .then((response) =>
          {
            expect(response.status).to.equal(201);
            let descriptionHash = response.data.descriptionHash;
            expect(descriptionHash).to.be.a('string');
            let result = {
              result: new BigNumber('1'),
              descriptionHash,
              publicationDate: new Date(new Date() + 1000*60*60)
            }
            return gnosis.api.postResult(
              result,
              config.account,
              config)
                .then((result) =>
                {
                  return gnosis.api.reportResult(
                    "something wrong", // report message
                    descriptionHash,
                    config.account,
                    config.accounts[1],
                    config
                  )
                  .catch((response) => {
                    expect(response.status).to.equal(304);
                  })
                });
          });
      });

      // it("post challenge and reject, ok", (done) => {
      //     return gnosis.api.createEvent(event, config.account, config)
      //         .then((response) =>
      //         {
      //             return gnosis.api.postResult(
      //                 new BigNumber('30000000000000000'),
      //                 eventRevision.descriptionHash,
      //                 config.account,
      //                 new Date(new Date().getTime() + 1000*60*60),
      //                 config
      //             )
      //                 .then((result) =>
      //                     {
      //                         expect(result.data).to.be.a('object');
      //                         expect(result.data.descriptionHash).to.equal(eventRevision.descriptionHash);
      //                         expect(result.data.oracles[config.account]).to.be.a('object');
      //                         expect(result.data.oracles[config.account].result).to.be.a('object');
      //
      //                         return gnosis.api.challengeOutcome(challenge, config.accounts[0], config)
      //                             .then((result) =>
      //                             {
      //                                 expect(result).to.be.a('object');
      //                                 expect(result.data).to.be.a('object');
      //                                 expect(result.data.challengeId).to.be.a('number');
      //                                 expect(result.data.oracleAddress).to.equal(challenge.oracleAddress);
      //                                 expect(result.data.descriptionHash).to.equal(challenge.descriptionHash);
      //                                 expect(result.data.status).to.equal('submitted');
      //                                 expect(result.data.reason).to.equal(challenge.reason);
      //                                 expect(result.data.response).to.equal('');
      //
      //                                 return gnosis.api.rejectChallenge({
      //                                         challengeId: result.data.challengeId, response: "wrong"
      //                                     },
      //                                     config.account, config)
      //                                     .then((result) =>
      //                                     {
      //                                         expect(result).to.be.a('object');
      //                                         expect(result.data).to.be.a('object');
      //                                         expect(result.data.challengeId).to.be.a('number');
      //                                         expect(result.data.oracleAddress).to.equal(challenge.oracleAddress);
      //                                         expect(result.data.descriptionHash).to.equal(challenge.descriptionHash);
      //                                         expect(result.data.status).to.equal('rejected');
      //                                         done();
      //                                     });
      //                             });
      //                     });
      //         });
      // });
      //
      // it("post challenge and approve, ok", (done) => {
      //
      //     return gnosis.api.createEvent(event, config.account, config)
      //         .then((response) =>
      //         {
      //             return gnosis.api.postResult(
      //                 new BigNumber('30000000000000000'),
      //                 eventRevision.descriptionHash,
      //                 config.account,
      //                 new Date(new Date().getTime() + 1000*60*60),
      //                 config)
      //                 .then((result) =>
      //                 {
      //                     expect(result.data).to.be.a('object');
      //                     expect(result.data.descriptionHash).to.equal(eventRevision.descriptionHash);
      //                     expect(result.data.oracles[config.account]).to.be.a('object');
      //                     expect(result.data.oracles[config.account].result).to.be.a('object');
      //
      //                     return gnosis.api.challengeOutcome(challenge, config.accounts[0], config)
      //                         .then((result) =>
      //                         {
      //                             return gnosis.api.approveChallenge(
      //                                 result.data.challengeId, eventRevision.descriptionHash, new BigNumber('3'), "You win",
      //                                 config.account, config
      //                                 )
      //                                 .then((result) =>
      //                                 {
      //                                     expect(result).to.be.a('object');
      //                                     expect(result.data).to.be.a('object');
      //                                     expect(result.data.challengeId).to.be.a('number');
      //                                     expect(result.data.oracleAddress).to.equal(challenge.oracleAddress);
      //                                     expect(result.data.descriptionHash).to.equal(challenge.descriptionHash);
      //                                     expect(result.data.status).to.equal('accepted');
      //                                     done();
      //                                 });
      //                         });
      //                 });
      //         });
      // });
  });

  describe('event revisions', () => {

    it('create event revision ok', () =>
    {
      return gnosis.api.createEvent(event, config.account, config)
        .then((response) =>
        {
          expect(response.status).to.equal(201);
          let descriptionHash = response.data.descriptionHash;
          expect(descriptionHash).to.be.a('string');
          eventRevision.descriptionHash = descriptionHash;
          return gnosis.api.createEventRevision(
            eventRevision,
            config.account,
            config
          )
            .then((result) =>
            {
                expect(result).to.be.a('object');
                expect(result.data).to.be.a('object');
                expect(result.data.revisionJSON).to.be.a('string');
                expect(result.data.v).to.be.ok;
                expect(result.data.r).to.be.ok;
                expect(result.data.s).to.be.ok;
            });
          });
    });
  });

    describe('hunchgame api', function runTests() {

      it('get all user', () => {
        return gnosis.hunchgame.getUsers(config)
          .then((result) => {
            expect(result).to.be.a("object");
            expect(Object.keys(result).length).to.be.above(0);
            expect(Object.keys(result[Object.keys(result)[0]]).length)
              .to.equal(2);
            expect(result[Object.keys(result)[0]].address).to.be.a("string");
            expect(result[Object.keys(result)[0]].name).to.be.a("string");
          });
      });

      it('get user, fail not authenticated', () => {
          return gnosis.hunchgame.getUser(config)
              .then(
                  (result) => {

                  },
                  (error) => {
                      expect(error).to.be.a('object');
                      expect(error.status).to.equal(401);
                  });
      });

      it('get user, ok', () => {
          gnosis.hunchgame.setAuthorizationToken(testrpcConfig.oauthToken);
          return gnosis.hunchgame.getUser(config)
              .then(
                  (result) => {
                      expect(result).to.be.a('object');
                      expect(result.data).to.be.a('object');
                      expect(result.data.name).to.be.a('string');
                      expect(result.data.bookmarkedMarkets).to.be.a('array');
                  });
      });

      it('update user, ok', () => {
          gnosis.hunchgame.setAuthorizationToken(testrpcConfig.oauthToken);
          return gnosis.hunchgame.updateUser(
            config,
            {name: 'gnosisTest', showName: true}
          )
              .then((result) => {
                  expect(result).to.be.a('object');
                  expect(result.data).to.be.a('object');
                  expect(result.data.showName).to.equal(true);
                  expect(result.data.name).to.equal('gnosisTest');
              });
      });

      it('bookmark market, ok', () => {
        gnosis.hunchgame.setAuthorizationToken(testrpcConfig.oauthToken);
        return gnosis.hunchgame.bookmark(
          config,
          '0x29e228e7a7312cdd1ab98da15bb21ec0f6cd3f0a5a87ea8ab38a14760082d0e8'
        )
            .then((result) => {
                expect(result).to.be.a('object');
            });
      });

      it('remove bookmark, ok', () => {
        gnosis.hunchgame.setAuthorizationToken(testrpcConfig.oauthToken);
        return gnosis.hunchgame.removeBookmark(
          config,
          '0x29e228e7a7312cdd1ab98da15bb21ec0f6cd3f0a5a87ea8ab38a14760082d0e8'
        )
            .then((result) => {
                expect(result).to.be.a('object');
            });
      });

      it('get featured markets, ok', (done) => {
          gnosis.hunchgame.setAuthorizationToken(testrpcConfig.oauthToken);
          gnosis.hunchgame.getFeaturedMarkets(config)
              .then((response) => {
                  expect(response).to.be.a('object');
                  expect(response.data).to.be.a('object');
                  expect(response.data.results).to.be.a('array');
                  done();
              });
      });

    });

    describe('utils', function runTests() {

        it('Get Contract Addresses', () => {
            return gnosis.api.getContracts({}, config)
                .then((result) => {
                    expect(result).to.be.a('object');
                    expect(result.data).to.be.a('object');
                    expect(result.data.events).to.be.a('object');
                    expect(result.data.ultimateOracle).to.be.a('object');
                    expect(result.data.crowdfunding).to.be.a('object');
                    expect(result.data.marketMakers).to.be.a('array');
                    expect(result.data.markets).to.be.a('array');
                    expect(result.data.tokens).to.be.a('array');
                    expect(result.data.onChainOracles).to.be.a('array');
                    expect(result.data.offChainOracles).to.be.a('array');
                });
        });
    });

    describe('oracles', function testSuite(){
        it('Create Oracle', () => {
            return gnosis.api.addOffChainOracle(
              {name: testName},
              config.account,
              config
            )
                .then((result) => {
                    expect(result).to.be.a("object");
                    expect(result.data.name).to.equal(testName);
                });
        });

        it('Get Oracle Detail', () => {
            return gnosis.api.addOffChainOracle(
              {name: testName},
              config.account,
              config
            )
                .then((result) =>
                {
                    return gnosis.api.getOracleDetails(config, config.account)
                        .then((result) =>
                        {
                            expect(result).to.be.a("object");
                            expect(result.data).to.be.a("object");
                            expect(result.data.name).to.equal(testName);
                            expect(result.data.isActive).to.equal(true);
                            expect(result.data.isWhitelisted).to.equal(false);
                        });
                });
        });

        it('Register On Chain Oracle, ok', () => {
          return gnosis.api.addOffChainOracle(
            {name: testName},
            config.account,
            config
          )
            .then((result) =>
            {
              onChainOracle.address = config.accounts[1];
              return gnosis.api.addOnChainOracle(
                onChainOracle,
                config.account,
                config
              )
                  .then((result) =>
                  {
                      expect(result).to.be.a('object');
                      expect(result.data).to.be.a('object');
                      expect(result.data.name).to.equal(onChainOracle.name);
                  });
              });
        });
    });
});
