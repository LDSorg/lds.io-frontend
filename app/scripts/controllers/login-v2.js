'use strict';

angular.module('yololiumApp')
  .controller('LoginController', [
    '$scope'
  , '$q'
  , '$timeout'
  , '$modalInstance'
  , 'StSession'
  , 'myStLogin'
  , 'stLoginConfig'
  , 'stLoginSession'
  , 'stLoginOptions'
  , function (
      $scope
    , $q
    , $timeout
    , $modalInstance
    , StSession
    , myStLogin
    , stLoginConfig
    , stLoginSession
    , opts
    ) {
    var scope = this;
    var secretMinLen = stLoginConfig.secretMinLen || 12;
    var usernameMinLen = stLoginConfig.usernameMinLen || 1;

    Object.keys(StSession.oauthProviders).forEach(function (key) {
      var provider = StSession.oauthProviders[key];
      var name = key.replace(/(^.)/, function ($1) { return $1.toUpperCase(); });

      scope['loginWith' + name] = function () {
        provider().then(function (session) {
          $modalInstance.close(session);
        }, function () {
          scope.delta.localLogin.message = name + ' login failed.';
        });
      };
    });

    scope.loginStrategies = [
      { label: 'Facebook'
      , name: 'facebook'
      , faImage: ""
      , faClass: "fa-facebook"
      , btnClass: "btn-facebook"
      , login: scope.loginWithFacebook
      }
    , { label: 'Google+'
      , name: 'google-plus'
      , faImage: ""
      , faClass: "fa-google-plus"
      , btnClass: "btn-google-plus"
      , login: scope.loginWithGooglePlus
      }

    /*
    , { label: 'LDS.org Account'
      , faImage: "images/moroni-128px.png"
      , faClass: ""
      , btnClass: "openid"
      , login: scope.loginWithLdsconnect
      }
    */
    ];

    console.log('opts', opts);
    scope.hideSocial = opts.hideSocial;
    scope.flashMessage = opts.flashMessage;
    scope.flashMessageClass = opts.flashMessageClass;


    scope.config = stLoginConfig;

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
      stLoginSession = session;

      var defaultAction = '';
      var emails = [];

      scope.account = scope.account || stLoginSession.account || {};
      if (scope.account.id) {
        defaultAction = 'update';
      }

      scope.formAction = scope.formAction || defaultAction;

      scope.account = scope.account || {};
      scope.delta = scope.delta || {};
      scope.deltaEmail = { type: 'email' };
      scope.deltaPhone = { type: 'phone' };
      scope.delta.localLogin = scope.delta.localLogin || {};
      scope.logins = stLoginSession.logins.map(function (login) {
        return {
          comment: ('local' === (login.provider || login.type)) ? (login.uid || 'username') : login.provider
        , id: login.id
        , uid: login.uid
        , provider: login.provider
        , type: login.type
        , link: true
        };
      });

      console.log('[new account] stLoginSession.logins');
      console.log(stLoginSession.logins);
      stLoginSession.logins.some(function (login) {
        if ('local' === (login.type || login.provider)) {
          scope.account.localLoginId = login.id;
          scope.delta.localLogin.id = login.id;
        }
      });

      // login is always ensured prior to account
      stLoginSession.logins.forEach(function (l) {
        (l.emails||[]).forEach(function (email) {
          if (email && email.value) {
            emails.push(email);
          }
        });
      });
      
      // TODO combo box for creating new logins
      scope.emails = emails;
      scope.deltaEmail.node = (emails[0] || {}).value;

      if (!scope.deltaEmail.node) {
        stLoginSession.logins.some(function (login) {
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

      /*
      if (stLoginSession.logins.length) {
        scope.formAction = 'create';
      }
      */

      // TODO check stLoginSession
      if (stLoginSession.logins.length >= 2) {
        scope.recoverable = true;
      }
    }



    //
    // functions for stuff
    //

    scope.checkSecret = function (nodeObj) {
      var len = (nodeObj.secret||'').length;
      var meetsLen = (len >= secretMinLen);

      if (meetsLen) {
        nodeObj.secretMessage = 'Login when ready, captain!';
        return;
      }

      nodeObj.secretMessage = 'Passphrase is too short '
        + len + '/' + secretMinLen 
        + ' (needs to be ' + secretMinLen + '+ characters)'
        ;
    };

    scope.checkLogin = function (nodeObj) {
      scope.formAction = '';
      nodeObj.claimable = false;
      nodeObj.exists = false;
      nodeObj.node = nodeObj.uid;
      nodeObj.message = '';

      $timeout.cancel(scope._checkLoginToken);

      if (!nodeObj.node || 'null' === nodeObj.node || 'undefined' === nodeObj.node) {
        scope.formAction = '';
        return;
      }

      if (!/^[0-9a-z\.\-_]+$/i.test(nodeObj.node)) {
        // TODO validate this is true on the server
        nodeObj.message = "Only alphanumeric characters, '-', '_', and '.' are allowed in usernames.";
        return;
      }

      if (nodeObj.node.length < usernameMinLen) {
        // TODO validate this is true on the server
        nodeObj.message = 'Username too short. Use at least ' + usernameMinLen + ' characters.';
        return;
      }

      nodeObj.message = 'Checking username...';
      scope._checkLoginToken = $timeout(function () {
        myStLogin.check(null, nodeObj.node).then(function (result) {
          if (true === result.exists) {
            nodeObj.exists = true;
            nodeObj.message = "'" + nodeObj.node + "' is already registered."
              + ' Welcome back!'
              ;
            scope.formAction = 'login';
          } else if (false === result.exists) {
            nodeObj.claimable = true;
            nodeObj.message = "'" + nodeObj.node + "' is available!";
            scope.formAction = 'create';
          } else {
            nodeObj.message = "Hmmm... troubles on the server... this may not work right now.";
          }
        });
      }, 300);
    };

    scope.login = function (nodeObj) {
      // TODO test and assign
      nodeObj.type = null;
      return myStLogin.login(nodeObj.type, nodeObj.node, nodeObj.secret).then(function (session) {
        if (session && !session.error) {
          stLoginSession = session;
        }
        return session;
      });
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
        myStLogin.check(opts.type, node).then(function (result) {
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
    scope.createLogin = function () {
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

      return myStLogin.getCodes(nodes).then(function (codes) {
        if (scope.validationDefer) {
          scope.validationDefer.reject(new Error("got new codes without validating old ones"));
          scope.validationDefer = null;
          return;
        }
        console.log(codes);
        scope.validationDefer = $q.defer();
        scope.formAction = 'codes';
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

      return myStLogin.validateCodes(codes).then(function (results) {
        console.log('myStLogin.validateCodes(codes)', results);

        if (scope.delta.localLogin.twoAuthPhone) {
          scope.delta.localLogin.multifactor = [{ node: scope.deltaPhone.node }];
        }
        // TODO check for error
        return myStLogin.create(
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

    function loginHelper(nodeObj) {
      var promise;

      // TODO conditionally check for local verified logins
      if (scope.recoverable) {
        promise = $q.defer();
        promise.resolve(stLoginSession);
        promise = promise.promise;
        return promise;
      }

      if (nodeObj.exists) {
        console.log('Proceeding to login');
        stLoginSession.logins.forEach(function (l) {
          // TODO checkboxes in UI
          l.linkable = true;
        });
        promise = scope.login(nodeObj);
      } else {
        console.log('Proceeding to create login');
        promise = scope.createLogin();
      }

      return promise;
    }

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

    scope.submitLogin = function () {
      if ('codes' === scope.formAction) {
        scope.submitCodes();
        return;
      }

      var nodeObj = scope.delta.localLogin;
      var meetsSecretLen = (nodeObj.secret||'').length >= secretMinLen;
      var meetsNameLen = (nodeObj.node||'').length >= 1;

      if (!meetsSecretLen) {
        // TODO where should this really go?
        nodeObj.secretMessage = 'Password is too short. Try something ' + secretMinLen + '+ characters long.';
        window.alert(nodeObj.secretMessage);
        return;
      }

      if (!meetsNameLen) {
        nodeObj.message = 'Username is too short. Try something 1+ characters long.';
        window.alert(nodeObj.message);
        return;
      }

      scope.authenticating = true;
      scope.showSecret = false;
      scope.rawMessage = "";
      return loginHelper(nodeObj).then(function (session) {
        scope.flashMessage = "";
        scope.flashMessageClass = "alert-danger";

        scope.authenticating = false;

        if (!session) {
          scope.flashMessage = "[API Error] could not check username / password";
          return;
        }

        if ('string' === typeof session) {
          // this is probably a 500 and is already html escaped
          scope.flashMessage = 'Unknown Error';
          scope.rawMessage = session;
          return;
        }

        if (!session.logins || !session.logins.length) {
          scope.delta.localLogin.secret = '';
          scope.showSecret = true;
          scope.flashMessage = "Incorrect password for '"
            + scope.delta.localLogin.node + "'. Double check and try again.";
          return;
        }

        $modalInstance.close(session);
      }, function (err) {
        scope.authenticating = false;

        console.error("[CAUGHT ERROR]:");
        console.log(err);
        scope.flashMessage = err && err.message || '[Uknown Error]: Please refresh and try again.';
      });
    };


    //
    // Begin
    //
    init(stLoginSession);
  }]);
