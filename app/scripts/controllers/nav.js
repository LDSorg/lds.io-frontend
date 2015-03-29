'use strict';

angular.module('yololiumApp')
  .controller('NavController', [
    '$rootScope'
  , '$scope'
  , '$state'
  , 'StSession'
  , 'StPayInvoice'
  , 'StApi'
  , '$http'
  , function ($rootScope, $scope, $state, StSession, StPayInvoice, StApi, $http) {
    var scope = this
      , allTabs
      ;

    scope.logo = StApi.business.logo;
    scope.title = StApi.business.title;

    /*
    $rootScope.$on('$stateChangeSuccess', function () {
      updateSession(mySession);
    });
    */

    function updateSession(session) {
      allTabs = [
        { active: $state.is('root')
        , title: 'Home'
        , href: $state.href('root')
        }
      , { active: $state.includes('oauthclients')
        , title: 'Apps'
        , href: $state.href('oauthclients')
        }
      , { active: $state.includes('store')
        , title: 'Store'
        , href: $state.href('store')
        }
      , { active: $state.includes('admin')
        , title: 'Admin'
        , href: $state.href('admin')
        , roles: ['admin', 'root']
        }
      , { active: $state.includes('push')
        , title: 'Push'
        , href: $state.href('push')
        }
      , { active: $state.includes('user')
        , title: 'User'
        , href: $state.href('user')
        , roles: ['user']
        }
      , { active: $state.includes('contacts')
        , title: 'Contacts'
        , href: $state.href('contacts')
        }
      , { active: $state.includes('about')
        , title: 'About'
        , href: $state.href('about')
        }
      ];

      if (!session || !session.account || session.guest || 'guest' === session.account.role) {
        session = null;
      }

      var role = session && session.account.role
        ;

      if ('root' === role) {
        role = 'admin';
      }

      scope.session = session;
      scope.account = session && session.account;
      scope.tabs = allTabs.filter(function (tab) {
        if (!tab.roles || !tab.roles.length) { return true; }
        if (!scope.session) { return false; }
        return -1 !== tab.roles.indexOf(role);
      });
      allTabs.forEach(function (tab) {
        if (tab.active) {
          scope.activeTab = tab.title;
        }
      });
    }

    scope.showLoginModal = function () {
      StSession.ensureSession().then(function (session) {
        if (!session.accounts.length) {
          window.alert("Sanity check fail: No accounts.");
        }
        if (session.accounts.length > 1) {
          window.alert("Account Switching not yet implemented. Please log out and log back in with only one account.");
        }

        updateSession(session);
      }, function (err) {
        console.error("[Login modal error]");
        console.log(err);
        window.alert(err.message || err.toString());
        throw err;
      });
    };

    scope.logout = function () {
      StSession.destroy().then(function () {
        updateSession(null);
      }, function (e) {
        console.error("Hahaha! What a loser. You failed at logging out. Wow... just wow...");
        console.error("(j/k, that's a message for me as the developer :-p)");
        console.log(e);
        updateSession(null);
      });
    };

    StSession.subscribe(updateSession, $scope);
  }]);
