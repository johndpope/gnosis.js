'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.streamPagedResults = streamPagedResults;
exports.getUsers = getUsers;
exports.getUser = getUser;
exports.updateUser = updateUser;
exports.bookmark = bookmark;
exports.removeBookmark = removeBookmark;
exports.getFeaturedMarkets = getFeaturedMarkets;
exports.setAuthorizationToken = setAuthorizationToken;

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Streams each result from pages of results into an observer. Each response
 * must have `results` and `next` keys.
 * @param  {String} url      The URL of the page to Stream
 * @param  {Observer} observer
 * @param filters
 * @param pageNumber
 */
function streamPagedResults(url, observer, filters) {
    var pageNumber = arguments.length <= 3 || arguments[3] === undefined ? 1 : arguments[3];

    _axios2.default.get(url, { params: filters }).then(function (response) {
        response.data.results.forEach(function (event) {
            return observer.onNext(event);
        });
        if (response.data.next && pageNumber < MAX_PAGES) {
            streamPagedResults(response.data.next, observer, pageNumber + 1);
        } else {
            observer.onCompleted();
        }
    }).catch(function (responseOrError) {
        observer.onError(responseOrError);
    });
}

/**
 * Get the users who have registered with Facebook.
 * @return {Promise<{[key: Address]: User}>}
 */
function getUsers(config) {
    var userStream = _rx2.default.Observable.create(function (observer) {
        var url = config.gnosisServiceURL + 'hunchgame/users/';
        streamPagedResults(url, observer);
    });

    return userStream.toArray().toPromise().then(function (users) {
        return _lodash2.default.indexBy(users, 'address');
    });
}

/**
 * Returns user profile information, should be authenticated by Authorization Header
 * Gives 401 if not authenticated
 * @param config
 * @returns {axios.Promise}
 */
function getUser(config) {
    return _axios2.default.get(config.gnosisServiceURL + 'hunchgame/user/');
}

/**
 * Checks if user is authenticated  and updates user model. Should return 401 error if user is not authenticated.
 * @param config
 * @param user
 * @returns {axios.Promise}
 */
function updateUser(config, user) {
    return _axios2.default.put(config.gnosisServiceURL + 'hunchgame/user/', user).catch(function (response) {
        console.error('Error while updating user!');
        throw response;
    });
}

/**
 * Add market to bookmarked markets of user
 * @param config
 * @param market_hash
 * @returns {axios.Promise}
 */
function bookmark(config, marketHash) {
    return _axios2.default.post(config.gnosisServiceURL + 'hunchgame/user/bookmark/' + marketHash + '/').catch(function (response) {
        console.error('Error while bookmarking market!');
        throw response;
    });
}

/**
 * Removes market from bookmarked markets
 * @param config
 * @param market_hash
 * @returns {*}
 */
function removeBookmark(config, marketHash) {
    return _axios2.default.delete(config.gnosisServiceURL + 'hunchgame/user/bookmark/' + marketHash + '/').catch(function (response) {
        console.error('Error while removing bookmark!');
        throw response;
    });
}

/**
 * Returns Hunchgame Featured markets
 * @param config
 * @returns {axios.Promise}
 */
function getFeaturedMarkets(config) {
    return _axios2.default.get(config.gnosisServiceURL + 'hunchgame/markets/featured/');
}

/**
 * Set the Authorization Header used on hunchgame to authenticate requests against API
 * @param auth
 */
function setAuthorizationToken(auth) {
    _axios2.default.defaults.headers.common['Authorization'] = 'Bearer ' + auth;
}