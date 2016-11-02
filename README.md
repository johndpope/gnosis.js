gnosis.js
---------

![logo](http://gnosis.pm/static/landingpage/img/Gnosis-Logo_x2.b5a59844deda.png)

[![Slack Status](http://slack.gnosis.pm/badge.svg)](http://slack.gnosis.pm)

Based on the next generation crypto currency network Ethereum.
Make complex predictions with an easy to use prediction market.

Gnosis.js is the javascript library of Gnosis, made to allow users build
applications on top of it easier, interacting with the Gnosis API and contracts.

* Designed to use with [batch requests](https://github.com/ethereum/wiki/wiki/JavaScript-API#batch-requests).
* Built-in **state container** for descriptions, events, markets...
* Easy integration with [Metamask](https://metamask.io/) and [Mist\*](https://github.com/ethereum/mist) (soon [Uport](https://uport.me/#home))

<sub>
\* *Message signing is not compatible with Mist due to a non standard solution for eth_sign that is being discussed by the community*
</sub>

Install
==========
```
npm install gnosisjs
```

Docs
==========
[Read The Docs](http://docs.gnosis.pm/en/latest/)

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

`gnosis.js` has an integration test suite that interacts with the actual API
and contracts deployed to a TestRPC. See `test/integration/README.md` for instructions.
