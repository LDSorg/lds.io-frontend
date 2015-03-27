'use strict';

angular.module('yololiumApp')
  .service('StSession', [
    '$http'
  , '$q'
  , '$timeout'
  , 'StOauthProviders'
  , 'StLogin'
  , 'StAccount'
  , 'StApi'
  , function StSession($http, $q, $timeout, StOauthProviders, StLogin, StAccount, StApi) {
    // AngularJS will instantiate a singleton by calling "new" on this function
    var me = this || {};
    var shared = { session: null, touchedAt: 0 };
    var gettingSession = null;
    var noopts = {};
    var notifier = $q.defer();
    var apiPrefix = StApi.apiPrefix;
    var middleware = [];

    // TODO move this to server (and make it real)
    function mangle(data) {
      if (!data || data.error) {
        return data;
      }

      data.loginsMap = {};
      data.logins.forEach(function (l) {
        data.loginsMap[l.id] = l;
      });
      data.login = data.loginsMap[data.mostRecentLoginId];
      /*
      data.logins.some(function (l) {
        if (l.id === data.mostRecentLoginId) {
          data.login = l;
          return true;
        }
      });
      */

      data.accountsMap = {};
      data.accounts.forEach(function (a) {
        data.accountsMap[a.id] = a;
      });

      data.account = data.accountsMap[data.selectedAccountId] || data.accounts[0];
      if (!data.account) {
        data.logins.forEach(function (login) {
          data.accounts.some(function (account) {
            if (account.id === login.primaryAccountId) {
              data.account = account;
              return true;
            }
          });
        });
      }

      // TODO show a UI to choose an account
      if (!data.account) {
        data.account = data.accounts[0];
      }
      /*
      data.accounts.some(function (a) {
        if (a.id === data.selectedAccountId) {
          data.account = a;
          return true;
        }
      });
      */

      data.account = data.account || {};
      data.account.role = data.account.role || (data.account.id && 'user') || 'guest';
      data.connected = {};
      data.account.loginIds = data.account.loginIds || [];
      data.account.loginIds.forEach(function (typedUid) {
        var parts = typedUid.split(':');
        var type = parts.shift();
        var uid = parts.join(':');

        // TODO carry more info about logins in account
        data.connected[type] = data.connected[type] || {};
        data.connected[type][uid] = data.loginsMap[typedUid] || {
          type: type
        , uid: uid
        , typedUid: typedUid
        , id: typedUid
        };
      });

      if (data.account.id && 'guest' === data.account.role) {
        data.account.role = 'user';
      }

      return data;
    }

    function read(opts) {
      opts = opts || noopts;
      var d = $q.defer();
      var staletime = 5 * 60 * 60 * 1000;

      if (opts.expire || (Date.now() - shared.touchedAt > staletime)) {
        // also try Date.now() - shared.session.touchedAt
        gettingSession = null;
        shared.session = null;
      }

      if (gettingSession) {
        return gettingSession;
      }

      gettingSession = d.promise;

      if (shared.session) {
        $timeout(function () {
          // premangled
          d.resolve(shared.session);
        }, 0);
        return gettingSession;
      }

      $http.get(apiPrefix + '/session').success(function (_userSession) {
        me.created = me.created || Date.now();
        me.updated = Date.now();

        //console.log('_userSession', _userSession);
        update(_userSession);
        //shared.session = mangle(_userSession);
        //shared.touchedAt = Date.now();
        d.resolve(shared.session);
      });

      return gettingSession;
    }

    function create(email, passphrase) {
      var d = $q.defer();

      $http.post(apiPrefix + '/session', {
        email: email
      , password: passphrase
      }).success(function (data) {
        d.resolve(mangle(data));
      });

      return d.promise;
    }

    // external auth (i.e. facebook, twitter)
    function update(session, restore) {
      gettingSession = null;

      if (shared.session !== session) {
        shared.session = mangle(session);
        shared.touchedAt = Date.now();
        if (true !== restore && session && session.logins.length && session.accounts.length) {
          console.info('saving session');
          console.log(session);
          localStorage.setItem('token', 'TODO');
          localStorage.setItem('tokenExpiresAt', new Date(Date.now() + (10 * 60 * 1000)).toISOString());
          localStorage.setItem('session.json', JSON.stringify(session));
        }
      }

      // TODO Object.freeze (Mozilla's deepFreeze example)
      notifier.notify(shared.session);

      return shared.session;
    }

    /*
    function addAccount() {
      var account = session && session.account
        ;

      if (!account || !account.id || account.error) {
        console.error('ERROR updating account');
        console.error(account);
        return;
      }

      // TODO do these account adjustments in StSession
      if (!mySession.accounts.some(function (a) {
        return a.id === account.id;
      })) {
        mySession.accounts.push(account);
      }

      mySession.selectedAccountId = account.id;
    }
    */

    function subscribe(fn, scope) {
      if (!scope) {
        // services and such
        notifier.promise.then(null, null, fn);
        notifier.notify(shared.session);
        return;
      }

      // This is better than using a promise.notify
      // because the watches will unwatch when the controller is destroyed
      scope.__stsessionshared__ = shared;
      scope.$watch('__stsessionshared__.session', function () {
        fn(shared.session);
      }, true);
    }

    function destroy() {
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiresAt');
      localStorage.removeItem('session.json');
      shared.session = null;
      gettingSession = true;

      return $http.delete(apiPrefix + '/session').then(function (resp) {
        gettingSession = false;
        return update(resp.data);
      });
    }

    // app/scripts/client-config.js

    // TODO make sure that if a login is successful, we update the session
    // and if it fails we catch the error, but we don't logout

    function ensureSession(opts) {
      if (!opts) {
        opts = {};
      }

      if (!opts.login) {
        opts.login = { force: opts.force };
      }
      if (!opts.account) {
        opts.account = {};
      }

      return read().then(function (session) {
        return StLogin.ensureLogin(session, opts.login).then(function (session2) {
          if (session2.error) {
            return $q.reject(session2.error);
          }
          console.log('[st-session.js] ensureLogin callback');
          update(session2);
          console.log('[st-session.js] ensureLogin update', shared.session);
          // pass in just account?
        });
      }).then(function () {
        var promise = $q.when(shared.session);

        middleware.forEach(function (wares) {
          var when = wares[0];
          var reject = wares[1];

          promise = promise.then(function (session2a) {

            if (session2a.error) {
              return $q.reject(session2a.error);
            }
            update(session2a);

            return when(shared.session, opts).then(function (session2b) {
              if (session2b.error) {
                return $q.reject(session2b.error);
              }

              update(session2b);
              return session2b;
            });
          }, reject);
        });

        return promise.then(function (newSession) {
          update(newSession);
          return newSession;
        });
      }).then(function () {
        return StAccount.ensureAccount(shared.session, opts.account).then(function (session3) {
          update(session3);
          // TODO an account may provide a limited amount of information if its login requirements
          // have not been met (i.e. it requires multi-factor auth)
          console.log('[st-session.js] ensureAccount callback');
          return shared.session;
        });
      }).then(function () {
        if (!shared.session.accounts.length) {
          window.alert('[SANITY CHECK FAIL]: did not have an account after ensuring account');
          throw new Error('[SANITY CHECK FAIL]: did not have an account after ensuring account');
        }
        if (shared.session.accounts.length > 1) {
          window.alert('[NOT IMPLEMENTED]: User account switching has not yet been implemented. Please logout and log back in with only one Account.');
          throw new Error('[NOT IMPLEMENTED]: User account switching has not yet been implemented. Please logout and log back in with only one Account.');
        }

        shared.session.account = shared.session.accounts[0];

        return shared.session;
      });
    }

    function useMiddleware(cb, eb) {
      middleware.push([cb, eb]);
    }

    function restoreSession() {
      var token = localStorage.getItem('token');
      var expiresAt = new Date(localStorage.getItem('tokenExpiresAt')).valueOf();
      var fresh = Date.now() - expiresAt < (30 * 24 * 60 * 60 * 1000);
      var session;

      if (!fresh) {
        console.warn('no fresh token');
        console.log(token);
        console.log(localStorage.getItem('tokenExpiresAt'), expiresAt);
        console.log(fresh);
        return;
      }

      session = JSON.parse(localStorage.getItem('session.json'));

      console.info('fresh session');
      console.info(session);

      update(session, true);

      return session;
    }

    var x = {
      get: read
    , create: create
    , read: read
    , update: update
    , destroy: destroy
    , subscribe: subscribe
    , ensureSession: ensureSession
    , use: useMiddleware
    , restoreSession: restoreSession
    };

    x.oauthPromises = StOauthProviders.create(function (resolve, reject) {
      console.log('[st-session.js] promiseLogin StSession.read()');
      read({ expire: true }).then(function (session) {
        console.log('[st-session.js] promiseLogin StSession.read() callback');
        if (session.error) {
          console.error('error in session');
          console.error(session);
          //destroy();
          reject(session.error);
        }

        resolve(session);
      });
    });

    x.oauthProviders = x.oauthPromises.promiseLoginsMap();
    x.promiseLoginsInScope = x.oauthPromises.promiseLoginsInScope;

    Object.keys(x).forEach(function (k) {
      me[k] = x[k];
    });

    return me;
  }]);
