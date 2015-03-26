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
      OA.clients.forEach(function (client) {
        client.url = (client.urls||[])[0]||'';
      });
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

    function scrapeForm(client) {
      return {
        name: client.name 
      , desc: client.desc
      , logo: client.logo
      , urls: client.urls || [client.url]
      };
    }

    OA.registerApp = function () {
      var client = OA.newApp;

      LdsAccount.ensureVerified(account, {}).then(function () {
        stOauthclients.create(
          authenticatedSession.account
        , scrapeForm(client)
        ).then(function (client) {
          OA.clients.push(client);
          OA.newApp = {};
        });
      });
    };

    OA.updateApp = function (client) {
      client.updating = true;
      stOauthclients.update(account, client.uuid, scrapeForm(client)).then(function () {
        client.updating = false;
      }).catch(function (err) {
        window.alert('[ERROR] ' + err.message);
      });
    };

    OA.deleteApp = function (client) {
      if (window.confirm("Are you sure you want to utterly obliterate '" + client.name + "'?")) {
        if (window.confirm("You're super sure about destroying '" + client.name + "'? (last chance)")) {
          
          OA.clients.some(function (c, i) {
            if (c === client) {
              OA.clients.splice(i, 1);
              return true;
            }
          });
          return stOauthclients.destroy(account, client.uuid);
        }
      }
    };
  }]);
