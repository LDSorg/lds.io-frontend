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
    var config = StApi.loginConfig;
    var apiPrefix = StApi.apiPrefix;

    me.showLoginModal = function (session, opts) {
      return $modal.open({
      //  templateUrl: '/views/login.html'
      //, controller: 'LoginCtrl as L'
        templateUrl: '/views/login-v2.html'
      , controller: 'LoginController as LC'
      , backdrop: 'static'
      , keyboard: true
      , resolve: {
          // so that we could add an explanation or something
          myStLogin: [function () {
            return me;
          }]
        , stLoginConfig: [function () {
            return config;
          }]
        , stLoginSession: [function () {
            return session;
          }]
        , stLoginOptions: [function () {
            return opts;
          }]
        }
      }).result;
    };

    function hasLogin(session) {
      // TODO session.mostRecentLoginId
      return session.logins.length >= 1;
    }

    function hasUnmetRequirements(session, opts) {
      var reqs = [];
      var meetsReq;

      if (!session) {
        session = {};
      }

      if (!session.logins) {
        session.logins = [];
      }

      if (!hasLogin(session)) {
        reqs.push({ code: 'nologin', message: "requires login" });
        return reqs;
      }

      if (!session.accounts.length && config.requireLocalLogin) {
        meetsReq = session.logins.filter(function (l) {
          return 'local' === l.type;
        }).length;
        if (!meetsReq) {
          reqs.push({ code: 'locallogin', message: "requires localLogin" });
          return reqs;
        }
      }

      if (opts.force) {
        opts.force = null;
        reqs.push({ code: 'force', message: "requires revalidation" });
        return reqs;
      }
      
      if (config.minLogins) {
        meetsReq = config.minLogins <= session.logins.length;
        if (!meetsReq) {
          reqs.push({ code: 'minlogins', message: "requires more logins" });
          return reqs;
        }
      }

      return reqs;
    }

    function loginHelper(session, opts) {
      var reqs;

      reqs = hasUnmetRequirements(session, opts);
      console.log('[LOG] reqs', reqs);

      if (!(reqs && reqs.length)) {
        return $q.when(session);
      }

      return me.showLoginModal(session, opts).then(function (newSession) {
        // only force once, if at all
        if (opts.force) {
          opts.force = null;
        }

        return loginHelper(newSession, opts);
      });
    }

    me.ensureLogin = function (currentSession, opts) {
      opts = opts || {};

      return loginHelper(currentSession, opts);
    };

    me.check = function (type, node) {
      return $http.get(apiPrefix + '/logins/check/' + type + '/' + node).success(function (exists) {
        console.log('StLogins.check result', exists);
      }).then(function (result) {
        return result.data;
      });
    };

    me.create = function (username, secret, multifactor, nodes) {
      // TODO integrate google auth https://github.com/markbao/speakeasy
      var request = { secret: secret, multifactor: { nodes: multifactor || [] }, nodes: nodes };
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

    me.login = function (type, node, secret) {
      if (/:/.test(node)) {
        throw new Error("cannot have ':' in username");
      }

      var auth = { 'Authorization': 'Basic ' + btoa(node + ':' + secret) }
        , form = null
        ;

      // TODO UI needs spinner
      return $http.post(apiPrefix + '/session/basic', form, { headers: auth }).then(function (resp) {
        return resp.data;
      });
    };

    /*
    me.addLoginNode = function (id, type, node) {
    };

    me.addRecoveryNode = function (id, type, node) {
    };
    */

    return me;
  }]);
