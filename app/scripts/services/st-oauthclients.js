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

    function create(account, name, secret) {
      var app = { name: name };
      if (secret) {
        app.secret = secret;
      }

      return $http.post(apiPrefix + '/accounts/' + account.id + '/clients', app).then(function (resp) {
        return resp.data;
      });
    }

    me.fetch = fetch;
    me.create = create;
  }]);
