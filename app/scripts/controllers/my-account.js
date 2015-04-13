'use strict';

angular.module('yololiumApp')
  .controller('MyAccountController', [
    '$window'
  , '$scope'
  , '$location'
  , '$http'
  , 'LdsApiConfig'
  , 'LdsApiSession'
  , 'LdsApiRequest'
  , function ($window, $scope, $location, $http, LdsApiConfig, LdsApiSession, LdsApiRequest) {
    var scope = this;

    function update() {
      // can't pass anything to ng-options via ng-change, hence using scope
      console.log('updateAccount', scope.selectedAccount);
      if ('new' === scope.selectedAccount.appScopedId || scope.selectedAccount.new) {
        scope.showLoginModal();
        return;
      }
    }

    scope.profiles = [];
    scope.updateAccount = update;

    function init(session) {
      // if it has a message, it's an error
      if (!session || session.message) {
        scope.session = null;
        scope.account = null;
        scope.accounts = [];
        scope.profiles = [];
        $location.url('/');
        return;
      }

      scope.session = session;
      //scope.accounts = session.accounts;
      scope.account = LdsApiSession.selectAccount(session);

      scope.accounts = [];
      return LdsApiRequest.getAccountSummaries(session, scope.accounts).then(function () {
        var currentAccount;

        scope.accounts.forEach(function (account) {
          console.log('account', account);
          account.profile.me.photo = LdsApiRequest.photoUrl(account, account.profile.me.photos[0], 'medium');
        });

        currentAccount = LdsApiSession.selectAccount(session);
        scope.accounts.forEach(function (account) {
          if (currentAccount.appScopedId === account.appScopedId) {
            scope.selectedAccount = account;
          }
        });

        if (scope.selectedAccount) {
          scope.pickAnyStake();
        }
      });
    }

    scope.pickAnyStake = function () {
      var account = scope.selectedAccount;
      var ranks = [];
      var winner;

      // find the most administrative stake
      account.profile.me.stakes.forEach(function (stake) {
        console.log('stake', stake.name, stake);

        stake.comment = stake.name;

        if (stake.admin) {
          stake.comment += " (Admin)";
        }

        stake.wards.forEach(function (ward) {
          console.log('ward', ward.name, ward);

          var score = 0;
          ward.comment = ward.name;

          if (ward.admin) {
            score += 20;
            ward.comment += " (Admin)";
          }

          if (stake.admin) {
            score += 10;
          }

          if (account.profile.me.homeWardAppScopedId === ward.appScopedId) {
            console.log('so true!');
            ward.comment += " (Home Ward)";
            score += 7;
          }

          if (account.profile.me.homeStakeAppScopedId === stake.appScopedId) {
            score += 5;
          }

          account.profile.me.wardsWithCalling.forEach(function (s) {
            if (s.wardAppScopedId === ward.appScopedId) {
              ward.comment += " (Has Calling)";
              score += 2;
            }
          });

          account.profile.me.stakesWithCalling.forEach(function (s) {
            if (s.stakeAppScopedId === stake.appScopedId) {
              score += 1;
            }
          });

          ranks.push({ ward: ward, stake: stake, score: score });
        });
      });
      
      winner = ranks.sort(function (a, b) {
        // highest score wins
        return b.score - a.score;
      })[0];
      console.log('winner');
      console.log(winner);
      console.log('scope');
      console.log(winner);

      scope.stake = winner.stake;
      scope.ward = winner.ward;
    };

    scope.switchUser = function () {
      scope.showLoginModal();
    };
    scope.showLoginModal = function () {
      // TODO profile manager
      return LdsApiSession.login({ force: true, scope: '* !' });
      // LdsApiSession.logins.implicitGrant();
      // LdsApiSession.logins.AuthorizationCode();
      // LdsApiSession.openAuthorizationDialog();
    };

    scope.logout = function () {
      // TODO which token(s) to destroy?
      return LdsApiSession.logout();
    };

    scope.api = {};
    scope.json = {};
    scope.api.accounts = function (opts) {
      if (!opts.show) {
        scope.json.accounts = null;
        return;
      }

      scope.json.accounts = "Loading...";
      // I should pass in the login from which the account came, but instead
      // I'm passing in the account because it also has the login token on it
      // which is really all I need...
      LdsApiSession.accounts(scope.selectedAccount).then(function (accounts) {
        scope.json.accounts = accounts;
      }).catch(function (err) {
        scope.json.accounts = err;
      });
    };
    scope.api.me = function (opts) {
      if (!opts.show) {
        scope.json.me = null;
        return;
      }

      scope.json.me = "Loading...";
      LdsApiRequest.me(scope.selectedAccount).then(function (result) {
        scope.json.me = result;
      }).catch(function (err) {
        scope.json.me = err;
      });
    };
    scope.api.stake = function (opts) {
      if (!opts.show) {
        scope.json.stake = null;
        return;
      }

      scope.json.stake = "Loading...";
      LdsApiRequest.stake(scope.selectedAccount, scope.stake.appScopedId).then(function (result) {
        scope.json.stake = result;
      }).catch(function (err) {
        scope.json.stake = err;
      });
    };
    scope.api.ward = function (opts) {
      if (!opts.show) {
        scope.json.ward = null;
        return;
      }

      scope.json.ward = "Loading...";
      LdsApiRequest.stake(scope.selectedAccount, scope.stake.appScopedId, scope.ward.appScopedId).then(function (result) {
        scope.json.ward = result;
      }).catch(function (err) {
        scope.json.ward = err;
      });
    };

    LdsApiSession.checkSession().then(init, init).catch(init);
    LdsApiSession.onLogin($scope, init);
    LdsApiSession.onLogout($scope, init);
  }]);
