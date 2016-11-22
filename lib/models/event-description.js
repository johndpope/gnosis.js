'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _state = require('../state');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var EventDescription = function () {
    function EventDescription(props, state) {
        (0, _classCallCheck3.default)(this, EventDescription);

        (0, _assign2.default)(this, props);
        this.state = state;
        this.eventHashes = [];
    }

    (0, _createClass3.default)(EventDescription, [{
        key: 'getEvents',
        value: function getEvents() {
            var events = {};
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = (0, _getIterator3.default)(this.eventHashes), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var eventHash = _step.value;

                    events[eventHash] = this.state.events[eventHash];
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return events;
        }
    }, {
        key: 'update',
        value: function update() {
            return (0, _state.updateEventDescriptions)(this.state.config, { descriptionHashes: [this.descriptionHash] });
        }
    }]);
    return EventDescription;
}();

exports.default = EventDescription;
module.exports = exports['default'];