'use strict';

/**
 * @ngdoc service
 * @name yololiumApp.stOauthclients
 * @description
 * # stOauthclients
 * Service in the yololiumApp.
 */
angular.module('yololiumApp')
  .service('stOauthclients', [
    '$q'
  , '$http'
  , 'LdsApiConfig'
  , function stOauthclients($q, $http, LdsApiConfig) {
    var me = this;

    function fetch(account) {
      return $http.get(
        LdsApiConfig.providerUri + '/api/accounts/' + account.appScopedId + '/clients'
      , { headers: { Authorization: 'Bearer ' + account.token } }
      ).then(function (resp) {
        if (!resp.data || resp.data.error) {
          throw new Error(resp.data.error.message || "failed to fetch OAuth2 clients");
        }

        return resp.data.clients;
      });
    }

    function create(account, app) {
      /* { name: ..., desc: ..., logo: ... } */

      return $http.post(
        LdsApiConfig.providerUri + '/api/accounts/' + account.appScopedId + '/clients'
      , app
      , { headers: { Authorization: 'Bearer ' + account.token } }
      ).then(function (resp) {
        return resp.data;
      });
    }

    function update(account, id, app) {
      /* { name: ..., desc: ..., logo: ... } */

      return $http.post(
        LdsApiConfig.providerUri + '/api/accounts/' + account.appScopedId + '/clients/' + id
      , app
      , { headers: { Authorization: 'Bearer ' + account.token } }
      ).then(function (resp) {
        return resp.data;
      });
    }

    function destroy(account, id) {
      /* { name: ..., desc: ..., logo: ... } */

      return $http.delete(
        LdsApiConfig.providerUri + '/api/accounts/' + account.appScopedId + '/clients/' + id
      , { headers: { Authorization: 'Bearer ' + account.token } }
      ).then(function (resp) {
        return resp.data;
      });
    }

    me.fetch = fetch;
    me.update = update;
    me.create = create;
    me.destroy = destroy;
  }]);
