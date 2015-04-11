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
  , 'LdsApiConfig'
  , 'LdsApiRequest'
  , function LdsAccount($q, $http, $modal, LdsApiConfig, LdsApiRequest) {
    // AngularJS will instantiate a singleton by calling "new" on this function

    var me = this;

    /*
    function getWardClerkInfo(session, opts) {
      // TODO check to see if this user is in the system
      // if so, present them with the information to get
      // their record number from the ward clerk
      return $http.get(StApi.apiPrefix + '/ldsconnectv2/request-mrn/:emailOrPhone')q.when();
    }
    */

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
        }
      }).result;
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
       , ldsProfileObject: function () {
           return LdsApiRequest.profile(account);
         }
       , ldsAccountOptions: function () {
           return opts;
         }
       }
     }).result;
   };

    me.getCode = function (account, type, node) {
      return $http.post(
        LdsApiConfig.providerUri + '/api/ldsio/' + account.appScopedId + '/verify/code'
      , { type: type
        , node: node
        }
      , { headers: { Authorization: 'Bearer ' + account.token } }
      ).then(function (result) {
        if (result.data.error) {
          return $q.reject(result.data.error);
        }
        return result.data;
      });
    };

    me.validateCode = function (account, type, node, uuid, code) {
      return $http.post(
        LdsApiConfig.providerUri + '/api/ldsio/' + account.appScopedId + '/verify/code/validate'
      , { type: type
        , node: node
        , uuid: uuid
        , code: code
        }
      , { headers: { Authorization: 'Bearer ' + account.token } }
      ).then(function (result) {
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

    me.ensureVerified = function (account, opts) {
      if (me.isFresh(account.emailVerifiedAt) && me.isFresh(account.phoneVerifiedAt)) {
        return $q.when();
      }

      return me.showVerificationModal(account, opts);
    };

    return me;
  }]);
