gnosis.js
---------

`gnosis.js` is a library that constructs the application state for the Gnosis
prediction market platform. Its API lets clients subscribe to a stream of
application states so a callback can be invoked any time a new state is
available.

Currently, data is fetched from the factserver when the stream is subscribed to,
then a new state is generated each time a new Ethereum block is available.

Installation
============

Run `webpack` to generate `dist/gnosis.js`, which you can use in a script tag
in your project.

Using gnosis.js as a npm dependency is unlikely to work unless you use Babel.
TODO: Figure out how to build this properly for distribution.

Usage
=====

```
import gnosis from 'gnosis';

gnosis.config.initialize().then((config) => {
  const subscription = gnosis.state.stream(config).subscribe(
    (state) => console.log('Got a new state!', state),
    (err) => console.log('Oh no, something went wrong and stopped the stream!', err),
    () => console.log('States completed')
  );
});
```

See the RxJS documentation for more on what you can do to manipulate the stream
`gnosis.state.stream` gives you. The stream contains `State` objects, which are
described below in Flow syntax. These have been extracted from the codebase,
which contains more type definitions and might be more up to date.

```
export type State = {
  block_number: number,
  events: {[key: Hash]: Event},
  holdings: {[key: Hash]: Array<BigNumber>},
}

type Event = DiscreteEvent | RangedEvent;

export type DiscreteEvent = {
  category: factserver.Category,
  closing_date: BigNumber,
  creator_address: Hash,
  currency_hash: ?Hash,
  currency_outcome: BigNumber,
  description_hash: Hash,
  event_hash: Hash,
  is_resolved: boolean,
  kind: 'discrete',
  market_makers: Array<MarketMaker>,
  outcome_count: number,
  outcome_identifiers: Array<Hash>,
  resolver_address: Hash,
  revisions: Array<factserver.DiscreteEventRevision>,
  tags: Array<factserver.Tag>,
  title: string,
  winning_outcome: BigNumber,
};

export type RangedEvent = {
  category: factserver.Category,
  closing_date: BigNumber,
  creator_address: Hash,
  currency_hash: ?Hash,
  currency_outcome: BigNumber,
  description_hash: Hash,
  event_hash: Hash,
  is_resolved: boolean,
  kind: 'ranged',
  market_makers: Array<MarketMaker>,
  outcome_count: number,  // outcome_count == 2
  outcome_identifiers: Array<Hash>,
  resolver_address: Hash,
  revisions: Array<factserver.RangedEventRevision>,
  tags: Array<factserver.Tag>,
  title: string,
  winning_number: BigNumber,
};
```

Developing
==========

To develop `gnosis.js`, you'll need Node installed on your system. Run `npm install`
to install the dependencies. If you're debugging code that uses promises, you
should install `bluebird` to log uncaught exceptions within promises. The example
scripts do this.

Install these Atom packages (or their counterparts for your text editor):

- language-babel
- language-ethereum
- linter-eslint

Build `gnosis.js` by running `$(npm bin)/webpack`.

Testing
=======

`gnosis.js` has an integration test suite that interacts with the actual factserver
and contracts deployed to a TestRPC. See `test/integration/README.md` for instructions.

`gnosis.js` has a Mocha unit test suite. Run it with `npm test`. As of this writing,
it only has tests for forecasting code that isn't currently used, and these tests
were broken as the tests were reorganized. When price charts are reimplemented,
we should update these tests to work again.
