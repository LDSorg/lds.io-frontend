'use strict';

angular.module('yololiumApp')
  .controller('NavController', [
    '$scope'
  , '$http'
  , 'LdsApiConfig'
  , 'LdsApiSession'
  , function ($scope, $http, LdsApiConfig, LdsApiSession) {
    var scope = this;

    function init(session) {
      if (!session || session.message) {
        scope.session = null;
        scope.account = null;
        scope.accounts = null;
        return;
      }

      scope.session = session;
      scope.accounts = session.accounts;
      scope.account = LdsApiSession.account(session);
    }

    scope.showLoginModal = function () {
      // TODO profile manager
      return LdsApiSession.openAuthorizationDialog();
    };

    scope.logout = function () {
      // TODO which token(s) to destroy?
      return LdsApiSession.logout();
    };

    LdsApiSession.checkSession().then(init, init).catch(init);
    LdsApiSession.onLogin($scope, init);
    LdsApiSession.onLogout($scope, init);
  }]);
