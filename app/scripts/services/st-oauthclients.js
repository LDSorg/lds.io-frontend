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
    'StApi'
  , '$http'
  , function stOauthclients(StApi, $http) {
    var me = this;
    var apiPrefix = StApi.apiPrefix;

    function fetch(account) {
      return $http.get(apiPrefix + '/accounts/' + account.id + '/clients').then(function (resp) {
        if (!resp.data || resp.data.error) {
          throw new Error(resp.data.error.message || "failed to fetch OAuth2 clients");
        }

        return resp.data.clients;
      });
    }

    function create(account, app) {
      /* { name: ..., desc: ..., logo: ... } */

      return $http.post(apiPrefix + '/accounts/' + account.id + '/clients', app).then(function (resp) {
        return resp.data;
      });
    }

    function update(account, id, app) {
      /* { name: ..., desc: ..., logo: ... } */

      return $http.post(apiPrefix + '/accounts/' + account.id + '/clients/' + id, app).then(function (resp) {
        return resp.data;
      });
    }

    function destroy(account, id) {
      /* { name: ..., desc: ..., logo: ... } */

      return $http.delete(apiPrefix + '/accounts/' + account.id + '/clients/' + id).then(function (resp) {
        return resp.data;
      });
    }

    me.fetch = fetch;
    me.update = update;
    me.create = create;
    me.destroy = destroy;
  }]);
