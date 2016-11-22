import axios from 'axios';
import Rx from 'rx';
import _ from 'lodash';


/**
 * Streams each result from pages of results into an observer. Each response
 * must have `results` and `next` keys.
 * @param  {String} url      The URL of the page to Stream
 * @param  {Observer} observer
 * @param filters
 * @param pageNumber
 */
export function streamPagedResults(url, observer, filters, pageNumber = 1) {
    axios.get(url, {params: filters}).then((response) => {
        response.data.results.forEach((event) => observer.onNext(event));
        if (response.data.next && pageNumber < MAX_PAGES) {
            streamPagedResults(response.data.next, observer, pageNumber + 1);
        } else {
            observer.onCompleted();
        }
    }).catch((responseOrError) => {
        observer.onError(responseOrError);
    });
}

/**
 * Get the users who have registered with Facebook.
 * @return {Promise<{[key: Address]: User}>}
 */
export function getUsers(config) {
    const userStream = Rx.Observable.create((observer) => {
        const url = config.gnosisServiceURL + 'hunchgame/users/';
        streamPagedResults(url, observer);
    });

    return userStream.toArray().toPromise().then((users) => {
        return _.indexBy(users, 'address');
    });
}


/**
 * Returns user profile information, should be authenticated by Authorization Header
 * Gives 401 if not authenticated
 * @param config
 * @returns {axios.Promise}
 */
export function getUser(config) {
    return axios.get(config.gnosisServiceURL + 'hunchgame/user/');
}


/**
 * Checks if user is authenticated  and updates user model. Should return 401 error if user is not authenticated.
 * @param config
 * @param user
 * @returns {axios.Promise}
 */
export function updateUser(config, user){
    return axios.put(config.gnosisServiceURL + 'hunchgame/user/', user).catch((response) => {
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
export function bookmark(config, marketHash) {
    return axios.post(config.gnosisServiceURL + 'hunchgame/user/bookmark/' + marketHash + '/').catch((response) => {
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
export function removeBookmark(config, marketHash) {
    return axios.delete(config.gnosisServiceURL + 'hunchgame/user/bookmark/' + marketHash + '/').catch((response) => {
        console.error('Error while removing bookmark!');
        throw response;
    });
}

/**
 * Returns Hunchgame Featured markets
 * @param config
 * @returns {axios.Promise}
 */
export function getFeaturedMarkets(config) {
    return axios.get(config.gnosisServiceURL + 'hunchgame/markets/featured/');
}

/**
 * Set the Authorization Header used on hunchgame to authenticate requests against API
 * @param auth
 */
export function setAuthorizationToken(auth){
    axios.defaults.headers.common['Authorization'] = 'Bearer '+ auth;
}
