/* @flow */
import BigNumber from 'bignumber.js';
import _ from 'lodash';

import type {Hash} from '../../src/types.js';
import type {ContractEvent} from '../../src/main.js';


/**
 * getMarkets returns a packed array of market maker data bundles. A bundle is
 * returned for each market maker associated with the given event hashes..
 *
 * From markets.sol:
 *
 // hashes
 market_makers[cur_arr_pos + 0] = event_description_hashes[i];
 market_makers[cur_arr_pos + 1] = event_hashes[j];
 market_makers[cur_arr_pos + 2] = MarketMakerHashes[event_hashes[j]][k];
 // event info
 market_makers[cur_arr_pos + 3] = Events[EventHashes[event_description_hashes[i]][j]].event_type;
 market_makers[cur_arr_pos + 4] = Events[EventHashes[event_description_hashes[i]][j]].closing_date;
 market_makers[cur_arr_pos + 5] = uint(Events[EventHashes[event_description_hashes[i]][j]].resolver_address);
 market_makers[cur_arr_pos + 6] = Events[EventHashes[event_description_hashes[i]][j]].currency_hash;
 market_makers[cur_arr_pos + 7] = Events[EventHashes[event_description_hashes[i]][j]].currency_outcome;
 market_makers[cur_arr_pos + 8] = FactsContract(Events[event_hashes[j]].resolver_address).getWinningOutcome(Events[event_hashes[j]].event_description_hash);
 market_makers[cur_arr_pos + 9] = Events[EventHashes[event_description_hashes[i]][j]].outcome_count;
 // market info
 for(uint8 l=1; l<=Events[EventHashes[event_description_hashes[i]][j]].outcome_count; l++) {
   market_makers[cur_arr_pos + 9 + l] = MarketMakers[MarketMakerHashes[event_hashes[j]][k]].shares[l];
 }
 market_makers[cur_arr_pos + 9 + l] = MarketMakers[MarketMakerHashes[event_hashes[j]][k]].initial_funding;
 market_makers[cur_arr_pos + 9 + l + 1] = MarketMakers[MarketMakerHashes[event_hashes[j]][k]].fee;
 market_makers[cur_arr_pos + 9 + l + 2] = uint(MarketMakers[MarketMakerHashes[event_hashes[j]][k]].market_maker_address);
 */

export function blank() {
  return _.range(1024).map(() => new BigNumber(0));
}

export function contractData(events: {[key: Hash]: Array<ContractEvent>}) {
  const eventBundles = _.map(events, (event, eventHash) => {
    const marketMakerBundles = _.map(event.market_makers, (marketMaker, marketMakerHash) => {
      return [
        new BigNumber(event.description_hash),
        new BigNumber(eventHash),
        new BigNumber(marketMakerHash),
        new BigNumber(event.kind === 'ranged' ? 0 : 1),
        event.closing_date,
        event.resolver_address,
        new BigNumber(event.currency_hash || 0),
        event.currency_outcome,
        event.winning_outcome,
        new BigNumber(event.outcome_count),
      ].concat(marketMaker.shares, [
        marketMaker.initial_funding,
        marketMaker.fee,
        marketMaker.market_maker_address,
      ]);
    });
    return _.flatten(marketMakerBundles);
  });
  const ints = _.flatten(eventBundles);
  return ints.concat(blank().slice(ints.length));
}

export function getExampleData({
    descriptionHash = '0xa22f0bcabf790ea9ac222880d5f637c6',
    eventHash = '0x0d04b667c0bf1401e3b981bf5c7c23aaca70dfff4',
    marketMakerHash = '0x0d04b667c0bf1401e3b981bf5c7c23aaca70dfff4',
    kind = 'discrete',
    outcomeCount = 3}) {
  return {
    [eventHash]: {
      description_hash: descriptionHash,
      kind: kind,
      closing_date: new BigNumber(1446396836),
      resolver_address: new BigNumber('0xd04b667b69c234537c1f0d4c1ba0122bd117c82e'),
      currency_hash: null,
      currency_outcome: new BigNumber(0),
      winning_outcome: new BigNumber(0),
      outcome_count: outcomeCount,
      market_makers: {
        [marketMakerHash]: {
          event_hash: eventHash,
          fee: new BigNumber(0.1),
          initial_funding: new BigNumber(10),
          market_maker_address: new BigNumber('0xabcdef'),
          prices: [
            new BigNumber('0.33333333333333333333'),
            new BigNumber('0.33333333333333333333'),
            new BigNumber('0.33333333333333333333'),
          ],
          shares: [
            new BigNumber(10),
            new BigNumber(10),
            new BigNumber(10),
          ],
        },
      },
    },
  };
}

type EventHashes = [Hash, Hash, Hash]; // description, event, market

export function getTwoExampleMarkets(rangedHashes: EventHashes, discreteHashes: EventHashes) {
  const [rangedDescriptionHash, rangedEventHash, rangedMarketMakerHash] = rangedHashes;
  const rangedMarket = getExampleData({
    descriptionHash: rangedDescriptionHash,
    eventHash: rangedEventHash,
    marketMakerHash: rangedMarketMakerHash,
    kind: 'ranged',
    outcomeCount: 2,
  });
  rangedMarket[rangedEventHash].market_makers[rangedHashes[2]].shares = [
    new BigNumber(10),
    new BigNumber(10),
  ];
  rangedMarket[rangedEventHash].market_makers[rangedHashes[2]].prices = [
    new BigNumber('0.5'),
    new BigNumber('0.5'),
  ];

  const discreteMarket = getExampleData({
    descriptionHash: discreteHashes[0],
    eventHash: discreteHashes[1],
    marketMakerHash: discreteHashes[2],
  });

  return Object.assign({}, rangedMarket, discreteMarket);
}
