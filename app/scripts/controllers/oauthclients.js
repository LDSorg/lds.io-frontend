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
    }).catch(function (e) {
      window.alert("[OAuth2 Clients] ERROR: " + e.message);
    });

    OA.getKeyPair = function (client, query) {
      var thing;

      client.apikeys.some(function (pair) {
        if (!!pair.insecure === !!query.insecure) {
          if (!!pair.test === !!query.test) {
            // hmmm... bad naming on my part
            // TODO consistent naming
            if ('id' === query.type) {
              thing = pair.key;
              return true;
            }
            else {
              thing = pair.secret;
              return true;
            }
          }
        }
      });

      return thing;
    };

    OA.registerApp = function () {
      LdsAccount.ensureVerified(account, {}).then(function () {
        stOauthclients.create(
          authenticatedSession.account
        , { name: OA.newApp.name 
          , desc: OA.newApp.desc
          , logo: OA.newApp.logo
          , urls: [OA.newApp.url]
          }
        ).then(function (client) {
          OA.clients.push(client);
        });

        OA.appName = '';
        OA.appSecret = '';
      });
    };
  }]);
