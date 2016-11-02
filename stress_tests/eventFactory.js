/**
 * Created by denisgranha on 1/4/16.
 */
import faker from 'faker';
import BigNumber from 'bignumber.js';
import * as hex from '../src/lib/hex';
import gnosis from '../src';

export default function create(config){
    return {
        'kind': 'discrete',
        'tags': ['ethereum'],
        'title': faker.Lorem.sentence(),
        'description': faker.Lorem.paragraph(),
        'sourceURL': 'http://'+ faker.Internet.domainName(),
        'resolutionDate': faker.Date.future(10, new Date( new Date().getTime() + 1000*60*5)),
        'outcomes': ['Yes', 'No'],
        'fee': new BigNumber('0'),
        'feeToken': config.addresses.etherToken,
        'outcomeCount': 2,
        'resolverAddress': config.addresses.ultimateOracle,
        'tokenAddress': config.addresses.etherToken,
        'market': {
            'fee': new BigNumber('0'),
            'initialFunding': new BigNumber('1e19'),
            'makerAddress': config.addresses.defaultMarketMaker,
        },
    };
};
