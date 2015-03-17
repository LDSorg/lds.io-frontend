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

    console.info('account');
    console.log(account);
    scope.phone = account.phone;
    scope.email = account.email;

    scope.codes = {};
    scope.validationErrorMessages = {};

    scope.codes.phone = localStorage.getItem('phoneCode');
    scope.codes.email = localStorage.getItem('emailCode');

    scope.sendCode = function (type, node) {
      // TODO needs to get expire time (and store in localStorage)
      console.log('called send code', type, node);
      myLdsAccount.getCode(account, type, node).then(function (data) {
        console.log('send code response', data);
        scope.codes[type] = data.uuid;
        localStorage.setItem(type + 'Code', data.uuid);
      }, function (err) {
        window.alert(err.message || 'unknown error');
      });
    };

    //scope.validateCode = function (type, node, uuid, code);
    scope.validateCode = function (code) {
      console.warn("validate code");
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
        console.error(err);
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
          console.error(data);
          scope.validationErrorMessages[type] = "Code didn't validate";
          showError({ message: "Code didn't validate" });
          return;
        }

        scope.validationErrorMessages[type] = '';
        localStorage.removeItem(type + 'Code');

        scope[type + 'Verified'] = true;
        account[type + 'VerifiedAt'] = new Date().toISOString();
        console.info(data);
      }, showError);
    };

    scope.verifyAccount = function () {
      // TODO refresh session StSession.get({ expire: true })
      $modalInstance.close();
    };

    /*

    scope.submitCodes = function () {
      scope.validateCodes().then(function (session) {
        if (session.error) {
          throw session.error;
        }
        scope.validationDefer.resolve(session);
        scope.validationDefer = null;
        return session;
      }).then(function (session) {
        return session;
      }, function (err) {
        scope.validationErrorMessage = err.message || 'Code validation failed, Double check and try again';
        console.error(err);
      });
      // TODO allow the user to cancel / skip validation and handle
      // scope.validationDefer.reject(err);
    };

    scope.validateCodes = function () {
      var codes = [];

      codes.push({
        type: 'email'
      , node: scope.deltaEmail.node
      , code: scope.deltaEmail.code
      , uuid: scope.deltaEmail.uuid
      , claim: scope.deltaEmail.claimable
      });

      if (scope.deltaPhone.code) {
        codes.push({
          type: 'phone'
        , node: scope.deltaPhone.node
        , code: scope.deltaPhone.code
        , uuid: scope.deltaPhone.uuid
        , claim: scope.deltaPhone.claimable
        });
      }

      return myLdsAccount.validateCodes(codes).then(function (results) {
        console.log('myLdsAccount.validateCodes(codes)', results);

        if (scope.delta.localLogin.twoAuthPhone) {
          scope.delta.localLogin.multifactor = [{ node: scope.deltaPhone.node }];
        }
        // TODO check for error
        return myLdsAccount.create(
          // TODO do we really need a username?
          scope.delta.localLogin.node
        , scope.delta.localLogin.secret
        , scope.delta.localLogin.multifactor
        , codes
        );
      }).then(function (session) {
        stLoginSession = session;

        if (stLoginSession.error) {
          console.error(stLoginSession);
          window.alert(stLoginSession.error.message || stLoginSession.error || "Unknown Session Error");
          return $q.reject(stLoginSession.error);
        }

        // TODO validate codes individually
        if (Array.isArray(stLoginSession)) {
          stLoginSession.forEach(function (join) {
            if (!join.error) {
              return true;
            }

            console.error(join);
            window.alert(join.error && join.error.message || join.error || "Uknown Join Error");
          });

          return $q.reject(stLoginSession[0].error);
        }

        return stLoginSession;
      });
    };
    */
  }]);
