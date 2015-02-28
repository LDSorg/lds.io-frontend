'use strict';

angular.module('yololiumApp')
  .controller('AccountNewCtrl', [
    '$scope'
  , '$q'
  , '$timeout'
  , '$modalInstance'
  , 'StAccount'
  , 'StLogin'
  , 'StSession'
  , 'mySession'
  , 'stAccountRequired'
  , function (
      $scope
    , $q
    , $timeout
    , $modalInstance
    , StAccount
    , StLogin
    , StSession
    , mySession
    , stAccountRequired
    ) {
    var scope = this
      ;

    // TODO calculate missing
    scope.missing = {};

    // This dialog is opened to update necessary account details
    // It should be passed options to inform the dialog which
    // missing fields are necessary to show at this time
    //
    // Examples:
    // we want to get facebook but haven't connected yet, so we should show the connection dialog
    // we just logged in for the first time and don't have an account or a local login
    function init(session) {
      // session is always ensured as part of login
      mySession = session;

      var defaultAction = '';

      scope.checkLogin = function () {
        scope.message = '';
        scope.accountAction = '';

        var node = scope.delta.localLogin.uid;

        $timeout.cancel(scope._checkLoginToken);

        if (!node || 'null' === node || 'undefined' === node) {
          scope.accountAction = '';
          return;
        }

        if (!/^[0-9a-z\-_]+$/i.test(node)) {
          // TODO validate this is true on the server
          scope.message = 'Only alphanumeric characters are allowed in usernames.';
          return;
        }

        scope.message = 'Checking username...';
        scope._checkLoginToken = $timeout(function () {
          StLogin.check(null, scope.delta.localLogin.uid).then(function (result) {
            if (true === result.exists) {
              scope.message = "'" + scope.delta.localLogin.uid + "' is already registered."
                + ' Welcome back!'
                ;
              scope.accountAction = 'login';
            } else if (false === result.exists) {
              scope.message = "'" + scope.delta.localLogin.uid + "' is available!";
              scope.accountAction = 'create';
            } else {
              scope.message = "Hmmm... troubles on the server... this may not work right now.";
            }
          });
        }, 300);
      };

      scope.checkNode = function (nodeObj, opts) {
        var node = nodeObj.node;
        var timeout = 300;

        nodeObj.message = '';
        nodeObj.claimable = false;

        opts.checkingMessage = 'Checking {{ type }}...';
        opts.claimedMessage = "'{{ node }}' has been claimed by another account."
                + " You may still use it as a recovery address, but not as a login."
                + " You can claim it for this account or merge accounts once you confirm it."
                ;
        opts.loginMessage = "You will also be able to use '{{ node }}' as a login!";


        if (opts.immediate) {
          timeout = 0;
        }

        $timeout.cancel(nodeObj._checkLoginToken);

        if (!node || 'null' === node || 'undefined' === node) {
          return;
        }

        nodeObj.message = opts.checkingMessage.replace(/{{\s+node\s+}}/g, opts.type);
        nodeObj._checkLoginToken = $timeout(function () {
          StLogin.check(opts.type, node).then(function (result) {
            if (true === result.exists) {
              nodeObj.message = opts.claimedMessage.replace(/{{\s+node\s+}}/g, node);
            } else if (false === result.exists) {
              nodeObj.message = opts.loginMessage.replace(/{{\s+node\s+}}/g, node);
              nodeObj.claimable = true;
            } else {
              nodeObj.message = "Hmmm... troubles on the server... this may not work right now.";
            }
          });
        }, timeout);

      };
      scope.checkEmail = function (emailObj, opts) {
        scope.checkNode(emailObj, { type: 'email', immediate: opts && opts.immediate });
      };
      scope.checkPhone = function (phoneObj, opts) {
        scope.checkNode(phoneObj, { type: 'phone', immediate: opts && opts.immediate });
      };

      scope.account = scope.account || session.account || {};
      if (scope.account.id) {
        defaultAction = 'update';
      }

      scope.accountAction = scope.accountAction || defaultAction;

      scope.account = scope.account || {};
      scope.delta = scope.delta || {};
      scope.deltaEmail = { type: 'email' };
      scope.deltaPhone = { type: 'phone' };
      scope.delta.localLogin = scope.delta.localLogin || {};
      scope.logins = session.logins.map(function (login) {
        return {
          comment: 'local' === login.provider ? (login.uid || 'username') : login.provider
        , id: login.id
        , uid: login.uid
        , provider: login.provider
        , type: login.type
        , link: true
        };
      });

      console.log('[new account] session.logins');
      console.log(session.logins);
      session.logins.some(function (login) {
        if ('local' === (login.type || login.provider)) {
          scope.account.localLoginId = login.id;
          scope.delta.localLogin.id = login.id;
        }
      });

      // login is always ensured prior to account
      if (session.login.emails) {
        scope.deltaEmail.node = (session.login.emails[0] || {}).value;
      }
      if (!scope.deltaEmail.node) {
        session.logins.some(function (login) {
          scope.deltaEmail.node = (login.emails && login.emails[0] || {}).value;
          return scope.deltaEmail.node;
        });
      }
      if (scope.deltaEmail.node) {
        scope.checkEmail(scope.deltaEmail, { immediate: true });
      }
      // TODO gather from external service
      if (scope.deltaPhone.node) {
        scope.checkPhone(scope.deltaPhone, { immediate: true });
      }


      session.account = session.account || {};
      Object.keys(session.account).forEach(function (field) {
        scope.account[field] = session.account[field];
      });

      stAccountRequired.forEach(function (r) {
        if (!scope.account[r]) {
          scope.missing[r] = true;
        }
      });
    }
    init(mySession);
    StSession.subscribe(init, $scope);

    scope.createAccount = function () {
      var nodes = [];
      var realNodes = [];

      // TODO check availability
      if (!scope.deltaEmail.node) {
        window.alert('you must supply a valid email address');
        return;
      }

      nodes.push({
        type: 'email'
      , node: scope.deltaEmail.node
      });
      realNodes.push(scope.deltaEmail);

      // TODO check availability
      if (scope.deltaPhone.node) {
        nodes.push({
          type: 'phone'
        , node: scope.deltaPhone.node
        });
        realNodes.push(scope.deltaPhone);
      }

      return StLogin.getCodes(nodes).then(function (codes) {
        if (scope.validationDefer) {
          scope.validationDefer.reject(new Error("got new codes without validating old ones"));
          scope.validationDefer = null;
          return;
        }
        console.log(codes);
        scope.validationDefer = $q.defer();
        scope.accountAction = 'codes';
        scope.codes = codes;
        scope.codesMap = {};
        console.info('result codes');
        console.log(codes);
        codes.forEach(function (code, i) {
          realNodes[i].uuid = code.uuid;
          //scope.codesMap[code.node] = code;
        });
        console.info('realNodes');
        console.log(realNodes);

        /*
        scope.deltaEmail.uuid = scope.codesMap.email;
        scope.deltaPhone.uuid = scope.codesMap.phone;
        */

        return scope.validationDefer.promise;
      });
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

      return StLogin.validateCodes(codes).then(function (results) {
        console.log('StLogin.validateCodes(codes)', results);
        // TODO check for error
        return StLogin.create(
          // TODO do we really need a username?
          scope.delta.localLogin.uid
        , scope.delta.localLogin.secret
        , codes
        );
      }).then(function (joins) {
        if (joins.error) {
          console.error(joins);
          window.alert(joins.error && joins.error.message || joins.error);
          return $q.reject(joins.error);
        }

        if (!joins.every(function (join) {
          if (!join.error) {
            return true;
          }

          console.error(join);
          window.alert(join.error && join.error.message || join.error);
        })) {
          return;
        }

        throw new Error("not yet implemented");
        //return StAccount.create(/*logins*/);
      }).then(function () {
        scope.validationDefer.resolve();
      }).catch(function (err) {
        // TODO if error is one of the codes, instruct user to try again
        console.error(err);
        scope.validationDefer.reject(err);
      }).then(function () {
        scope.validationDefer = null;
      });
    };

    scope.updateAccount = function () {
      if ('codes' === scope.accountAction) {
        scope.validateCodes();
        return;
      }
      var promise;
      var meetsLen = scope.delta.localLogin.secret.length >= 8;

      if (!meetsLen) {
        window.alert('Password is too short. Try something 12+ characters long.');
        return;
      }

      if (scope.loginExists) {
        promise = StLogin.login(scope.delta.localLogin.uid, scope.delta.localLogin.secret);
      } else {
        promise = scope.createAccount();
      }

      return;
      console.log('scope.updateAccount');
      console.log(JSON.stringify(scope.delta));
      scope.delta.logins = scope.logins.filter(function (l) { return l.link; });
      console.log(JSON.stringify(scope.delta));
      StAccount.update(mySession.selectedAccountId, scope.delta).then(function (session) {
        if (!session || session.error) {
          window.alert(session && session.error || 'StAccount.update cb: no session object returned');
          return;
        }

        console.log('UPDATE 1');
        console.log(session);
        StSession.update(session);

        $modalInstance.close(session);
      });
    };
  }]);
