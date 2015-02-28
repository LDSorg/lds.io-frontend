'use strict';

angular.module('yololiumApp')
  .service('StLogin', [
    '$timeout'
  , '$q'
  , '$http'
  , '$modal'
  , 'StApi'
  , function StLogin($timeout, $q, $http, $modal, StApi) {
    var me = this;
    var apiPrefix = StApi.apiPrefix;

    me.showLoginModal = function (opts) {
      return $modal.open({
        templateUrl: '/views/login.html'
      , controller: 'LoginCtrl as L'
      , backdrop: 'static'
      , keyboard: true
      , resolve: {
          // so that we could add an explanation or something
          stLoginOptions: [function () {
            return opts;
          }]
        }
      }).result;
    };

    me.ensureLogin = function (currentSession, opts) {
      opts = opts || {};

      // TODO this probably belongs in StSession?
      function hasLogin(session) {
        // BUG a new user won't have an account yet
        return session && session.mostRecentLoginId && session.logins && session.logins.length >= 1;
      }

      if (!opts.force && hasLogin(currentSession)) {
        return $q.when(currentSession);
      }

      return me.showLoginModal(opts).then(function (newSession) {
        var error;

        console.log('[st-login.js] showLoginModal callback');
        if (hasLogin(newSession)) {
          return newSession;
        }

        error = {
          name: "UnensuredLogin"
        , message: "Didn't do a very good job of ensuring the login..."
        , toString: function () {
            return this.message;
          }
        };
        console.log("[st-login.js]", error.message);
        throw error;
      });
    };

    me.check = function (type, node) {
      return $http.get(apiPrefix + '/logins/check/' + type + '/' + node).success(function (exists) {
        console.log('StLogins.check result', exists);
      }).then(function (result) {
        return result.data;
      });
    };

    me.create = function (username, secret, nodes) {
      var request = { secret: secret , nodes: nodes };
      nodes.push({ type: 'username', node: username });

      return $http.post(apiPrefix + '/logins/create', request).success(function (data) {
        console.log('StLogins.create result', data);
      }).then(function (result) {
        return result.data;
      });
    };

    me.getCodes = function (nodes) {
      return $http.post(apiPrefix + '/logins/codes', nodes).success(function (data) {
        console.log('StLogins.getCodes result', data);
      }).then(function (result) {
        return result.data;
      });
    };

    me.validateCodes = function (codes) {
      return $http.post(apiPrefix + '/logins/codes/validate', codes).success(function (data) {
        console.log('StLogins.getCodes result', data);
      }).then(function (result) {
        return result.data;
      });
    };

    me.login = function (type, node) {
    };

    me.addLoginNode = function (id, type, node) {
    };

    me.addRecoveryNode = function (id, type, node) {
    };

    return me;
  }]);
