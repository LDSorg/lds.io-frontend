'use strict';

/**
 * @ngdoc function
 * @name yololiumApp.controller:OauthCtrl
 * @description
 * # OauthCtrl
 * Controller of the yololiumApp
 */
angular.module('yololiumApp')
  .controller('OauthCtrl', [ 
    '$window'
  , '$q'
  , '$timeout'
  , '$scope'
  , '$http'
  , '$stateParams'
  , 'StSession'
  , 'StApi'
  , function (
      $window
    , $q
    , $timeout
    , $scope
    , $http
    , $stateParams
    , StSession
    , StApi
    ) {

    var scope = this;

    function isIframe () {
      try {
        return window.self !== window.top;
      } catch (e) {
        return true;
      }
    }

    scope.iframe = isIframe();

    // TODO move into config
    var scopeMessages = {
      me: "View Stake and Ward Directories"
    };

    function updateAccepted() {
      scope.acceptedString = scope.pendingScope.filter(function (obj) {
        return obj.acceptable && obj.accepted;
      }).map(function (obj) {
        return obj.value;
      }).join(' ');

      return scope.acceptedString;
    }

    function scopeStrToObj(value) {
      return {
        accepted: true
      , acceptable: !!scopeMessages[value]
      , name: scopeMessages[value] || 'Invalid Scope \'' + value + '\''
      , value: value
      };
    }

    // Convert all scope changes back to a scope string
    scope.updateScope = function () {
      if (true === scope.selectedAccount.new) {
        scope.selectedAccount = scope.previousAccount;
        setTimeout(function () {
          window.alert("this feature is not yet implemented");
        }, 0);

        return;
      }

      scope.previousAccount = scope.selectedAccount;

      scope.selectedAccountId =
        scope.selectedAccount.id || scope.selectedAccount.uuid;

      if (scope.selectedAccountId === scope.previousAccount.id) {
        return;
      }

      // we're switching the accounts
      selectAccount(scope.selectedAccountId).then(function (/*txdata*/) {
        updateAccepted();
        // TODO Recheck which scopes have already been accepted for this account
      });
    };

    function requestSelectedAccount(accountId) {
      return $http.get(
        StApi.oauthPrefix
      + '/scope/' + $stateParams.token
      + '?account=' +  accountId
      ).then(function (resp) {
        if (resp.data.error) {
          console.error('resp.data');
          console.error(resp.data);
          scope.error = resp.data.error;
          scope.rawResponse = resp.data;
          return $q.reject(new Error(resp.data.error.message));
        }

        if ('string' !== typeof resp.data.pendingString) {
          console.error('resp.data (TODO look for redirect uri)');
          console.error(resp.data);
          scope.error = { message: "missing scope request" };
          scope.rawResponse = resp.data;

          return $q.reject(new Error(scope.error.message));
        }

        return resp.data;
      });
    }

    function selectAccount(accountId) {
      return requestSelectedAccount(accountId).then(function (txdata) {
        console.info('accountId', 'txdata');
        console.log(accountId);
        console.log(txdata);
        scope.client = txdata.client;

        if (!scope.client.title) {
          scope.client.title = scope.client.name || 'Missing App Title';
        }

        scope.selectedAccountId = accountId;
        scope.transactionId = txdata.transactionId;
        scope.grantedString = txdata.grantedString;
        scope.requestedString = txdata.requestedString;
        scope.pendingString = txdata.pendingString;
        scope.pendingScope = [];

        if (scope.pendingString) {
          scope.pendingScope = txdata.pendingArr.map(scopeStrToObj);
        } else if (txdata.granted) {
          // TODO submit form with getElementById or whatever
          $timeout(function () {
            // NOTE needs time for angular to set transactionId
            if (!$window._gone) {
              $window.jQuery('#oauth-hack-submit').submit();
              $window._gone = true;
            }
          }, 50);
        }

        if (scope.iframe && (!txdata.granted || scope.pendingString)) {
          $timeout(function () {
            // NOTE needs time for angular to set transactionId
            if (!$window._gone) {
              $window.jQuery('#hack-cancel').click();
              $window._gone = true;
            }
          }, 50);
        }

        updateAccepted();

        return txdata;
      });
    }

    function init() {
      StSession.ensureSession(
        // role
        null
        // TODO login opts (these are hypothetical)
      , { close: false
        , options: ['login', 'create']
        , default: 'login'
        }
        // TODO account opts
      , { verify: ['email', 'phone']
        }
      ).then(function (session) {
        console.log('OAuth Dialog Session');
        console.log(session);
        console.log('');

        // get token from url param
        scope.token = $stateParams.token;

        return selectAccount(session.account.id).then(function (/*txdata*/) {
          scope.accounts = session.accounts.slice(0);

          scope.accounts.push({
            displayName: 'Create New Account'
          , new: true
          });

          scope.accounts.forEach(function (acc, i) {
            if (!acc.displayName) {
              acc.displayName = acc.email || ('Account #' + (i + 1));
            }
          });

          scope.selectedAccount = session.account;
          scope.previousAccount = session.account;
          scope.updateScope();
        }, function (err) {
          if (/logged in/.test(err.message)) {
            return StSession.destroy().then(function () {
              init();
            });
          }
          console.error("ERROR somewhere");
          console.log(err);
          window.alert(err.message);
        });
      });
    }

    init();
  }]);
