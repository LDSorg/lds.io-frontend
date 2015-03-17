'use strict';

/**
 * @ngdoc function
 * @name yololiumApp.controller:OauthclientsCtrl
 * @description
 * # OauthclientsCtrl
 * Controller of the yololiumApp
 */
angular.module('yololiumApp')
  .controller('OauthclientsController', [
    'stOauthclients'
  , 'LdsAccount'
  , 'authenticatedSession'
  , function (stOauthclients, LdsAccount, authenticatedSession) {
    var OA = this;
    var account = authenticatedSession.account;

    OA.clients = OA.clients || [];

    OA.freshAccount = LdsAccount.isFresh(account.emailVerifiedAt) && LdsAccount.isFresh(account.phoneVerifiedAt);
    OA.email = account.email;
    OA.phone = account.phone;
    OA.hasEmail = !!OA.email;
    OA.hasPhone = !!OA.phone;

    stOauthclients.fetch(authenticatedSession.account).then(function (clients) {
      OA.clients = clients;
      console.log('');
    }).catch(function (e) {
      window.alert("[OAuth2 Clients] ERROR: " + e.message);
    });

    OA.addApp = function () {
      console.info('oauth client account');
      console.log(account);
      LdsAccount.ensureVerified(account, {}).then(function () {
        stOauthclients.create(authenticatedSession.account, OA.appName, OA.appSecret).then(function (client) {
          OA.clients.push(client);
        });

        OA.appName = '';
        OA.appSecret = '';
      });
    };
  }]);
