"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.promiseCallback = promiseCallback;
exports.streamCallback = streamCallback;
function promiseCallback(resolve, reject) {
  return function (error, result) {
    if (error) {
      reject(error);
    } else {
      resolve(result);
    }
  };
}

function streamCallback(observer) {
  return function (error, result) {
    if (error) {
      observer.onError(error);
    } else {
      observer.onNext(result);
      observer.onCompleted();
    }
  };
}