'use strict';

angular.module('yololiumApp')
  .service('StOauthProviders', [
    '$http'
  , '$q'
  , '$timeout'
  , 'StApi'
  , function StOauthProvider($http, $q, $timeout, StApi) {
    // AngularJS will instantiate a singleton by calling "new" on this function
    function create(reloadSession) {
      var allLogins = {}
        ;

      function promiseLoginsMap() {
        var logins = promiseLogins();
        var map = {};

        logins.forEach(function (login) {
          map[login.strategyName] = function (oauthScopes) {
            return login.login(oauthScopes); //.then(resolve, reject);
          };
        });

        return map;
      }

      function promiseLoginsInScope(scope, prefix, resolve, reject) {
        var logins = promiseLogins();

        logins.forEach(function (login) {
          var uKey = login.strategyName.replace(/(^.)/, function ($1) { return $1.toUpperCase(); })
            ;

          scope[prefix + uKey] = function (oauthScopes) {
            login.login(oauthScopes).then(resolve, reject);
          };
        });
      }

      function promiseLogins() {
        var logins = []
          ;

        Object.keys(StApi.loginProviders).forEach(function (strategyName) {
          logins.push({
            strategyName: strategyName
            // TODO remove 'key'
          , key: strategyName
          , login: promiseLogin(strategyName, StApi.oauthPrefix + StApi.loginProviders[strategyName])
          });
        });

        return logins;
      }
      function attachWindowCompleteLogin() {
        if (window.completeLogin) {
          return;
        }

        window.completeLogin = function (strategyName, url) {
          var err = null;
          var myLogin = allLogins[strategyName];

          if (/deny|denied/i.test(url)) {
            err = new Error('Access Denied: ' + url);
          } else if (/error/i.test(url)) {
            err = new Error('Auth Error: ' + url);
          }

          console.log('[debug]', 'completeLogin("' + strategyName + '")');
          clearInterval(myLogin._pollInt);
          window.localStorage.removeItem(strategyName + 'Status');
          myLogin.loginCallback(err);

          console.log('accessed parent function completeLogin');
          //jQuery('body').append('<p>' + url + '</p>');
          myLogin.loginWindow.close();
          delete myLogin.loginWindow;
        };
      }
      function attachCompleteLogin(strategyName, oneLogin) {
        oneLogin.strategyName = strategyName;
        allLogins[strategyName] = oneLogin;
        attachWindowCompleteLogin();
      }
      function promiseLogin(strategyName, authUrl) {
        var d = $q.defer()
          , login = {}
          ;

        attachCompleteLogin(strategyName, login);

        login._pollLogin = function () {
          //jQuery('body').append('<p>' + 'heya' + '</p>');
          console.log('[debug]', strategyName + '._pollLogin');
          if (!window.localStorage) {
            clearInterval(login._pollInt);
            // doomed!
            return;
          }

          if (localStorage.getItem(strategyName + 'Status')) {
            window.completeLogin(strategyName, localStorage.getItem(strategyName + 'Status'));
          }
        };

        function tryToLogin(scopes) {
          var defaultScope = 'me:phone::';
          scopes = scopes || [defaultScope];
          console.warn('TODO: remove default scope \'' + defaultScope + '\'');
          console.log('[debug]', 'loginWith ' + strategyName + '');
          login.loginCallback = function (err) {
            if (err) {
              d.reject(err);
              return;
            }

            reloadSession(d.resolve, d.reject);
          };

          console.info('[TODO] allow arbitrary scope requests on login and permission upgrade');
          login.loginWindow = login.loginWindow || window.open(authUrl + '?scope=' + scopes.join('%20'));
          login._pollInt = setInterval(login._pollLogin, 300);

          return d.promise;
        }

        return tryToLogin;
      }

      return {
        promiseLogins: promiseLogins
      , promiseLoginsInScope: promiseLoginsInScope
      , promiseLoginsMap: promiseLoginsMap
      };
    }

    return {
      create: create
    };
  }]);
