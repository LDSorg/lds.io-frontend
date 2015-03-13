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
  , function LdsAccount($q, $http, $modal, StApi, StLogin) {
    // AngularJS will instantiate a singleton by calling "new" on this function

    var me = this;
    var config = StApi.loginConfig;

    me.showAccountModal = function (session, opts) {
      console.log('opening the lds account update');
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

      console.log('session');
      console.log(session);
      console.log('opts');
      console.log(opts);

      // if there isn't an account associated with a current login
      // go back to the login step
      if (!session.logins.some(function (login) {
        if ('local' === login.type) {
          return true;
        }
      })) {
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
      if (session.logins.some(function (login) {
        var fresh;
        
        if ('local' !== login.type) {
          return false;
        }

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

      return $q.when(session);
    };

    return me;
  }]);
