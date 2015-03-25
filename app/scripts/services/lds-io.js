'use strict';

/**
 * @ngdoc service
 * @name yololiumApp.LdsAccount
 * @description
 * # LdsAccount
 * Service in the yololiumApp.
 */
angular.module('yololiumApp')
  .service('LdsIo', [
    '$q'
  , '$http'
  , 'StApi'
  , function LdsIo($q, $http, StApi) {
    var apiPrefix = StApi.apiPrefix;
    var scope = this;
    var ret = {};

    // TODO a service that saves data per account
    // and deletes caches when switching accounts

    ret.getProfile = function (account) {
      var profile = JSON.parse((localStorage.getItem('profile') || null));

      if (profile && (profile.expiresAt - Date.now() > 0)) {
        return $q.when(profile.data);
      }

      return $http.get(apiPrefix + '/ldsconnect/' + account.id + '/me').then(function (result) {
        if (result.data.error) {
          return $q.reject(result.data.error);
        }
        return result.data;
      }).then(function (data) {
        localStorage.setItem('profile', JSON.stringify({ data: data, expiresAt: Date.now() + (5 * 60 * 1000) }));
        return data;
      });
    };

    return ret;
  }]);
