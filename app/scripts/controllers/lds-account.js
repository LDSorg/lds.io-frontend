'use strict';

angular.module('yololiumApp')
  .controller('LdsAccountController', [
    '$scope'
  , '$q'
  , '$timeout'
  , '$http'
  , '$modalInstance'
  , 'StApi'
  , 'StSession'
  , 'myLdsAccount'
  , 'ldsAccountConfig'
  , 'ldsAccountSession'
  , 'ldsAccountOptions'
  , function (
      $scope
    , $q
    , $timeout
    , $http
    , $modalInstance
    , StApi
    , StSession
    , myLdsAccount
    , ldsAccountConfig
    , ldsAccountSession
    , ldsAccountOptions
    ) {
    var scope = this;
    var login = ldsAccountOptions.ldsStaleLoginInfo;

    login.homes.forEach(function (h) {
      if (h.id === login.me.homeId) {
        login.home = h;
      }
    });

    scope.login = login;

    console.log(login);
    scope.markAsChecked = function () {
      return $http.post(StApi.apiPrefix + '/logins/ldsaccount/' + login.id + '/mark-as-checked').then(function (resp) {
        if (!resp.data || resp.data.error || !resp.data.success) {
          scope.flashMessage = (resp.data && resp.data.error) || "Failed to mark account as checked.";
          scope.flashMessageClass = 'alert-danger';
          return;
        }

        login.checkedAt = parseInt(Date.now() / 1000, 10);
        return $modalInstance.close(ldsAccountSession);
      });
    };
  }]);
