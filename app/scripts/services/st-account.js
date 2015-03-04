'use strict';

/**
 * @ngdoc service
 * @name yololiumApp.StAccount
 * @description
 * # StAccount
 * Service in the yololiumApp.
 */
angular.module('yololiumApp')
  .service('StAccount', ['$q', '$http', '$modal', 'StApi', function StAccount($q, $http, $modal, StApi) {
    // AngularJS will instantiate a singleton by calling "new" on this function

    var me = this
      , required = ['localLoginId']
      ;

    me.showAccountModal = function (session, opts) {
      console.log('opening the account update');
      return $modal.open({
        templateUrl: '/views/account-new.html'
      , controller: 'AccountNewCtrl as A'
      , backdrop: 'static'
      , keyboard: false
      , resolve: {
          mySession: function () {
            return session;
          }
        , stAccountOptions: function () {
            return opts;
          }
        , stAccountRequired: function () {
            return required;
          }
        }
      }).result;
    };

    me.ensureAccount = function (session, opts) {
      // TODO move this logic to StAccount
      function hasField(field) {
        console.log('hasField', field, session.account[field], !!session.account[field]);
        return !!session.account[field];
      }

      // TODO remap accounts and logins to eachother on session update
      session.account.logins = session.account.logins || [];
      session.account.logins.some(function (login) {
        // TODO make configurable
        if ('local' === (login.type || login.provider)) {
          session.account.localLoginId = login.id || login.hashid;
          return true;
        }
      });

      if (session.account && required.every(hasField)) {
        console.log("I don't need to open UpdateSession modal");
        return $q.when(session);
      }

      // TODO check if the account is up-to-date (no missing fields)
      console.log("open UpdateSession modal", required, required.every(hasField));
      console.log(session.account);
      return me.showAccountModal(session, opts);
    };

    function ensureLocalLogin(updates) {
      var d = $q.defer()
        ;

      updates.logins = updates.logins || [];
      updates.logins.some(function (login) {
        // TODO make configurable
        if ('local' === (login.type || login.provider)) {
          updates.localLoginId = login.id || login.hashid;
          return true;
        }
      });

      d.resolve();

      return d.promise;
    }
    
    function update(id, updates) {
      if (!id) {
        return create(updates);
      }

      return ensureLocalLogin(updates).then(function () {
        return $http.post(StApi.apiPrefix + '/accounts/' + id, updates).then(function (resp) {
          console.log('UPDATE account');
          console.log(resp);
          return resp.data;
        });
      });
    }

    function create(account, myLogins) {
      var logins = myLogins.map(function (l) {
        if (!l.id) {
          console.error("Create login before attempting to attach to account");
          console.error(l);
          throw new Error("Cannot create new logins via account routes. Create login first.");
        }
        return { id: l.id };
      });

      if (account.id) {
        return update(account, logins);
      }

      console.log('st-account.create updates');
      console.log(account, myLogins);

      return $http.post(StApi.apiPrefix + '/accounts', {
        account: account
      , logins: logins
      }).then(function (resp) {
        console.log('CREATE account');
        console.log(resp);
        return resp.data;
      }, function (err) {
        console.error('[ERROR] CREATE account');
        console.error(err);
        return err;
      })
      ;

      /*
      return ensureLocalLogin(updates).then(function () {
        if (updates.localLogin) {
          logins.push(updates.localLogin);
          updates.localLoginId = updates.localLogin.id;
          delete updates.localLogin;
        }

        updates.logins = logins.filter(function (login) {
          if (!login.id) {
            return true;
          }
          if (!loginsMap[login.id]) {
            loginsMap[login.id] = true;
            return true;
          }
          return false;
        });
      });
      */
    }

    me.update = update;
    me.create = create;
  }]);
