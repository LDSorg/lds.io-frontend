'use strict';

angular.module('yololiumApp')
  .controller('VerifyContactDetailsController', [
    '$scope'
  , '$q'
  , '$modalInstance'
  , 'myLdsAccount'
  , 'ldsAccountConfig'
  , 'ldsAccountObject'
  , 'ldsAccountOptions'
  , function (
    $scope
  , $q
  , $modalInstance
  , myLdsAccount
  , ldsAccountConfig
  , account
    /*
  , opts
    */
  ) {
    var scope = this;

    scope.phone = account.phone;
    scope.email = account.email;

    scope.codes = {};
    scope.validationErrorMessages = {};

    scope.codes.phone = localStorage.getItem('phoneCode');
    scope.codes.email = localStorage.getItem('emailCode');

    scope.sendCode = function (type, node) {
      // TODO needs to get expire time (and store in localStorage)
      myLdsAccount.getCode(account, type, node).then(function (data) {
        scope.codes[type] = data.uuid;
        localStorage.setItem(type + 'Code', data.uuid);
      }, function (err) {
        window.alert(err.message || 'unknown error');
      });
    };

    //scope.validateCode = function (type, node, uuid, code);
    scope.validateCode = function (code) {
      var type;
      var node;
      var uuid;
      var rePhoneCode = /^\s*(\d{3})[-\s]*(\d{3})\s*$/;
      var reEmailCode = /^\s*(\w+)[-\s]+(\w+)[-\s]+(\d+)\s*$/;
      var m;
      code = code.trim();

      if (rePhoneCode.test(code)) {
        m = code.match(rePhoneCode);
        type = 'phone';
        node = account.phone;
        uuid = scope.codes[type];
        code = m[1] + '-' + m[2];
      } else if (reEmailCode.test(code)) {
        m = code.match(reEmailCode);
        type = 'email';
        node = account.email;
        uuid = scope.codes[type];
        code = m[1] + '-' + m[2] + '-' + m[3];
      } else {
        throw new Error("unexpected code type");
      }

      function showError(err) {
        console.error("[ERROR] in verify contact:");
        console.log(err);
        scope.validationErrorMessages[type] = err.message
          || (type + ' code validation failed, Double check and try again')
          ;
      }

      return myLdsAccount.validateCode(account, type, node, uuid, code).then(function (data) {
        if (data.error) {
          scope.validationErrorMessages[type] = "Code didn't validate";
          showError(data.error);
          return;
        }

        if (!data.validated) {
          console.error("[ERROR] in verify contact validate:");
          console.error(data);
          scope.validationErrorMessages[type] = "Code didn't validate";
          showError({ message: "Code didn't validate" });
          return;
        }

        scope.validationErrorMessages[type] = '';
        localStorage.removeItem(type + 'Code');

        scope[type + 'Verified'] = true;
        account[type + 'VerifiedAt'] = new Date().toISOString();
      }, showError);
    };

    scope.verifyAccount = function () {
      // TODO refresh session StSession.get({ expire: true })
      $modalInstance.close();
    };
  }]);
