'use strict';

/**
 * @ngdoc service
 * @name yololiumApp.LdsAccount
 * @description
 * # LdsAccount
 * Service in the yololiumApp.
 */
angular.module('yololiumApp')
  .service('LdsAccount', [
    '$q'
  , '$http'
  , '$modal'
  , 'StApi'
  , 'StLogin'
  , 'StAccount'
  , function LdsAccount($q, $http, $modal, StApi, StLogin, StAccount) {
    // AngularJS will instantiate a singleton by calling "new" on this function

    var me = this;
    var config = StApi.loginConfig;
    var apiPrefix = StApi.apiPrefix;

    me.showAccountModal = function (session, opts) {
      return $modal.open({
        templateUrl: '/views/lds-account.html'
      , controller: 'LdsAccountController as LAC'
      , backdrop: 'static'
      , keyboard: false
      , resolve: {
          myLdsAccount: function () {
            return me;
          }
        , ldsAccountSession: function () {
            return session;
          }
        , ldsAccountOptions: function () {
            return opts;
          }
        , ldsAccountConfig: function () {
            return config;
          }
        }
      }).result;
    };

    /*
    function getWardClerkInfo(session, opts) {
      // TODO check to see if this user is in the system
      // if so, present them with the information to get
      // their record number from the ward clerk
      return $http.get(StApi.apiPrefix + '/ldsconnectv2/request-mrn/:emailOrPhone')q.when();
    }
    */

    me.ensureAccount = function (session, opts) {
      // about 3 months
      var recheckTime = (3 * 30 * 24 * 60 * 60 * 1);
      var ldsLogins;
      var hasLdsAccount;

      // the server must reject account creation with no local login present
      // TODO inspect account for freshness / validation?
      session.logins.some(function (login) {
        if (login.accounts.length) {
          hasLdsAccount = true;
          return true;
        }
      });

      // if there isn't an account associated with a current login
      // go back to the login step
      ldsLogins = session.logins.filter(function (login) {
        if ('local' === login.type) {
          return true;
        }
      });

      if (!ldsLogins.length && !hasLdsAccount) {
        opts.hideSocial = true;
        opts.flashMessage = "Login with your LDS Account at least once before linking other accounts.";
        opts.flashMessageClass = "alert-warning";
        return StLogin.showLoginModal(session, opts).then(function (session) {
          opts.hideSocial = undefined;
          opts.flashMessage = undefined;
          opts.flashMessageClass = undefined;
          return me.ensureAccount(session, opts);
        });
      }

      // if any of the logins are stale, destalinize them
      if (ldsLogins.some(function (login) {
        var fresh;
        
        if ('local' !== login.type) {
          return false;
        }

        // TODO ISO timestamps
        fresh = (Date.now()/1000) - parseInt(login.checkedAt||0, 10) < recheckTime;
        //fresh = (Date.now()/1000) - parseInt(login.verifiedAt||0, 10) < recheckTime;
        if (!fresh) {
          opts.ldsStaleLoginInfo = login;
          return true;
        }
      })) {
        // ask the user to re-verify their info
        return me.showAccountModal(session, opts).then(function () {
          return me.ensureAccount(session, opts);
        });
      }

      return me.createAccount(session, opts);
    };

    me.createAccount = function (session, opts) {
      // TODO this could change to allow for a bishop having
      // separate accounts for home ward/stake and serving ward/stake

      var logins;
      var ldsLogins;
      var ldsAccounts = session.accounts;
      // this should never happen, in theory, just a sanity check
      var hasCorruptAccount;
      var incompleteLdsLogins = {};
      var incompleteLogins = {};
      var promise;

      ldsLogins = session.logins.filter(function (login) {
        return 'local' === login.type;
      });
      logins = session.logins.filter(function (login) {
        return 'local' !== login.type;
      });

      // ensure that each ldsLogin has exactly one account
      // (This is just a sanity check. The server guarantees this condition.)
      ldsLogins.forEach(function (login) {
        if (login.accounts.length < 1) {
          incompleteLdsLogins[login.id] = { id: login.id, type: login.type };
        }
        if (login.accounts.length > 1) {
          // TODO automatic failure condition reporting
          hasCorruptAccount = true;
        }
      });

      logins.forEach(function (login) {
        if (login.accounts.length < 1) {
          incompleteLogins[login.id] = { id: login.id, type: login.type };
        }
        // NOTE: Unlike the scenario above, multiple Lds Accounts
        // can be linked to a single non-lds login.
      });

      ldsAccounts.forEach(function (account) {
        var logins = account.logins.filter(function (login) {
          if ('local' === login.provider) {
            return true;
          }
        });
        // (This is just a sanity check. The server guarantees this condition.)
        if (logins.length < 1) {
          hasCorruptAccount = true;
        }
        if (logins.length > 1) {
          hasCorruptAccount = true;
        }
      });

      if (hasCorruptAccount) {
        // TODO give the user the option to delete the accounts
        // (which would make it impossible to access those accounts on apps)
        // (... unless the id were deterministic... hmm....)
        return $q.reject(new Error("Your account has become corrupted and must be recovered manually."
          + " It's not your fault. It's just a thing that happened. Please contact support@ldsconnect.org."));
      }

      if (Object.keys(incompleteLdsLogins).length > 1 && Object.keys(incompleteLogins).length) {
        return $q.reject(new Error("You have logged into 2 or more LDS Accounts and are associating another"
          + " login (such as Facebook or Google+), which is not yet supported."
          + " Please log out and then log back in with only the LDS Account you wish to associate with the social login."
          + " TODO: ask the user which social account should be linked to which LDS Account."));
      }

      // NOTE: it would be a bad idea to run these async
      promise = $q.when(session);
      Object.keys(incompleteLdsLogins).map(function (key) {
        var login = incompleteLdsLogins[key];
        // NOTE: see condition above, which prevents linking all social logins to all accounts
        var otherLogins = Object.keys(incompleteLogins).map(function (k) { return incompleteLogins[k]; });

        promise = promise.then(function () {
          // TODO reverse accounts so that the empty object is optional
          return StAccount.create({}, [login].concat(otherLogins), opts);
        });
      });

      // ensure that no ldsAccount has more than one ldsLogin
      // using PromiseA.all instead of forEachAsync because of the limited and finite nature of the list
      return promise;
    };

    me.getCode = function (account, type, node) {
      return $http.post(apiPrefix + '/ldsconnect/' + account.id + '/verify/code', {
        type: type
      , node: node
      }).then(function (result) {
        if (result.data.error) {
          return $q.reject(result.data.error);
        }
        return result.data;
      });
    };

    me.validateCode = function (account, type, node, uuid, code) {
      return $http.post(apiPrefix + '/ldsconnect/' + account.id + '/verify/code/validate', {
        type: type
      , node: node
      , uuid: uuid
      , code: code
      }).then(function (result) {
        if (result.data.error) {
          return $q.reject(result.data.error);
        }

        return result.data;
      });
    };

    me.isFresh = function (iso) {
      var now = Date.now();
      var date = new Date(iso).valueOf();
      // 3 months - 3 days
      var staleTime = (3 * 30 * 24 * 60 * 60 * 1000) - (3 * 24 * 60 * 60 * 1000);
      var fresh = date && (now - date < staleTime);

      return fresh;
    };

    me.showVerificationModal = function (account, opts) {
      return $modal.open({
        templateUrl: '/views/verify-contact-details.html'
      , controller: 'VerifyContactDetailsController as VCDC'
      , backdrop: 'static'
      , keyboard: false
      , resolve: {
          myLdsAccount: function () {
            return me;
          }
        , ldsAccountObject: function () {
            return account;
          }
        , ldsAccountOptions: function () {
            return opts;
          }
        , ldsAccountConfig: function () {
            return config;
          }
        }
      }).result;
    };

    me.ensureVerified = function (account, opts) {
      if (me.isFresh(account.emailVerifiedAt) && me.isFresh(account.phoneVerifiedAt)) {
        return $q.when();
      }

      return me.showVerificationModal(account, opts);
    };

    return me;
  }]);
