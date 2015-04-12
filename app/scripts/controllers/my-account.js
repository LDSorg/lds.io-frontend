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
        scope.accounts.forEach(function (account) {
          console.log('account', account);
          account.profile.me.photo = LdsApiRequest.photoUrl(account, account.profile.me.photos[0], 'medium');
        });
        console.log('session', session);
        console.log('scope.accounts', scope.accounts);
        //console.log('profiles', scope.profiles);
        //return LdsApiRequest.profile(session);
      });
    }

    scope.switchUser = function () {
      scope.showLoginModal();
    };
    scope.showLoginModal = function () {
      // TODO profile manager
      return LdsApiSession.login({ force: true, scope: '!' });
      // LdsApiSession.logins.implicitGrant();
      // LdsApiSession.logins.AuthorizationCode();
      // LdsApiSession.openAuthorizationDialog();
    };

    scope.logout = function () {
      // TODO which token(s) to destroy?
      return LdsApiSession.logout();
    };

    LdsApiSession.checkSession().then(init, init).catch(init);
    LdsApiSession.onLogin($scope, init);
    LdsApiSession.onLogout($scope, init);
  }]);
