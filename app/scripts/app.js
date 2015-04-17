'use strict';

window.addEventListener('error', function (err) {
  console.error("Uncaught Exception:");
  console.log(err);
});

angular.module('myApp', []);
angular.module('myApp').controller('NavController', [
    '$scope'
  , '$timeout'
  , '$window'
  , '$location'
  , '$http'
  , 'LdsApiSession'
  , 'LdsApiRequest'
  , function ($scope, $timeout, $window, $location, $http, LdsApiSession, LdsApiRequest) {

  var NC = this;

  LdsApiSession.onLogin($scope, function (session) {
    NC.session = session;
  });

  LdsApiSession.onLogout($scope, function () {
    NC.session = null;
  });

  LdsApiSession.restore().then(function (session) {
    NC.session = session;
  });

  NC.login = function (/*name*/) {
    LdsApiSession.login({ scope: '*' /*, authorizationRedirect: true*/ }).then(function (/*session*/) {
      var account = LdsApiSession.selectAccount();
      return LdsApiRequest.api.profile(account, { expire: true }).then(function () {
        NC.session = NC.session;
      });
    }, function (err) {
      LdsApiSession.logout();
      window.alert("Login failed: " + err.message);
    });
  };
  NC.showLoginModal = NC.login;

  NC.logout = function (/*name*/) {
    LdsApiSession.logout();
  };
}]);

angular.module('yololiumApp', [
  'ui.bootstrap'
, 'ui.router'
, 'oauth3'
, 'lds.io'
, 'steve'
, 'myApp'
/*
  'ngSanitize'
*/
]).config([
    '$urlRouterProvider'
  , '$stateProvider'
  , '$httpProvider'
  //, 'LdsApiConfig'
  , function ($urlRouterProvider, $stateProvider, $httpProvider/*, LdsApiConfig*/) {
    var rootTemplate = $('.ui-view-body').html();

    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('root', {
        url: '/'
      , views: {
          body: {
            template: rootTemplate
          , controller: [
              '$scope'
            , 'LdsApiSession'
            , 'LdsApiRequest'
            , function ($scope, LdsApiSession, LdsApiRequest) {
              var MC = this;

              MC.urlsafe = function (name) {
                return name.toLowerCase().replace(/[^\-\w]/, '').replace(/s$/, '');
              };

              function prefetch(/*session*/) {
                var account = LdsApiSession.selectAccount();
                var accountApi = LdsApiRequest.create(account);

                // Prefetching
                return accountApi.profile().then(function (profile) {
                  accountApi.stake(profile.me.homeStakeAppScopedId);
                  accountApi.ward(profile.me.homeStakeAppScopedId, profile.me.homeWardAppScopedId);
                });
              }

              LdsApiSession.checkSession(prefetch);
              LdsApiSession.onLogin($scope, prefetch);
            }]
          , controllerAs: 'MC'
          }
        }
      })

      .state('logout', {
        url: '/logout/:callback'
      , views: {
          body: {
            template: ''
            // DestroySessionController
          , controller: [
              '$window'
            , '$stateParams'
            , 'LdsApiSession'
            , function ($window, $stateParams, LdsApiSession) {
              LdsApiSession.destroy().then(function () {
                var callback = $stateParams.callback;
                $window.location.href = '/oauth3.html?close=true&callback=' + callback;
              });
            }]
          , controllerAs: 'DSC'
          }
        }

      })

      .state('playground', {
        url: '/playground/'
      , views: {
          body: {
            templateUrl: 'views/playground.html'
          , controller: 'PlaygroundController as PGC'
          }
        }
      })

      .state('api', {
        url: '/api/'
      , views: {
          body: {
            templateUrl: 'views/api.html'
          }
        }
      })

      .state('develop', {
        url: '/develop/'
      , views: {
          body: {
            templateUrl: 'views/oauthclients.html'
          , controller: 'OauthclientsController as OA'
          }
        }
      })
      ;

    // send creds
    $httpProvider.defaults.withCredentials = true;
    // alternatively, register the interceptor via an anonymous factory?
    $httpProvider.interceptors.push([ '$q', function($q) {
      var recase = window.Recase.create({ exceptions: {} });

      function isApiUrl(url) {
        // TODO provide a list of known-good API urls in StApi and loop
        return !/^https?:\/\//.test(url)
          || url.match('lds.io')
          //|| url.match(LdsApiConfig.appUri)
          //|| url.match(LdsApiConfig.providerUri)
          //|| url.match(LdsApiConfig.realProviderUri)
          ;
      }

      return {
        'request': function (config) {
          if (config.data
              && isApiUrl(config.url)
              && /json/.test(config.headers['Content-Type'])
          ) {
            config.data = recase.snakeCopy(config.data);
          }

          return config;
        }
      , 'requestError': function (rejection) {
          return rejection;
        }
      , 'response': function (response) {
          var config = response.config;
          var err;

          // our own API is snake_case (to match webApi / ruby convention)
          // but we convert to camelCase for javascript convention
          if (isApiUrl(config.url) && /json/.test(response.headers('Content-Type'))) {
            response.data = recase.camelCopy(response.data);
            if (response.data.error) {
              //throw new Error(response.data.error.message);
              err = new Error(response.data.error.message);
              Object.keys(response.data.error).forEach(function (key) {
                err[key] = response.data.error[key];
              });
              return $q.reject(err);
            }
          }
          return response;
        }
      , 'responseError': function (rejection) {
          return rejection;
        }
      };
    }]);

}]).run([
    '$rootScope'
  , '$timeout'
  , '$q'
  , '$http'
  , '$modal'
  , 'LdsApi'
  , 'LdsApiSession'
  , function ($rootScope, $timeout, $q, $http, $modal, LdsApi, LdsApiSession) {

  return LdsApi.init({
    // TODO dedicated root app
    appId: 'TEST_ID_beba4219ee9e9edac8a75237' // production server, test client
  //appId: 'TEST_ID_871a371debefb91c919ca848' // test server, test client
  , appVersion: '2.0.0-pre'
  , invokeLogin: function (/*opts*/) {
      //$window.alert("login modal not yet implemented");
      return $q.reject(new Error("login modal not implemented"));
      /*
      console.info('login invoked');
      return $modal.open({
        templateUrl: '/views/login-v3.html'
      , controller: 'LoginController3 as LC'
      , backdrop: 'static'
      , keyboard: true
      , resolve: {
          myLoginOptions: [function () {
            return opts;
          }]
        }
      }).result;
      */
    }
  }).then(function (LdsApiConfig) {
    $rootScope.R = {};
    // attach after angular is initialized so that angular errors
    // don't annoy developers that forgot bower install
    window.addEventListener('error', function (err) {
      window.alert('Uncaught Exception: ' + (err.message || 'unknown error'));
    });

    // $rootScope.R.ready = true;
    if (/local|beta|:\d+/.test(LdsApiConfig.appUri)
      || /local|beta|:\d+/.test(LdsApiConfig.providerUri)
      || /local|beta|:\d+/.test(LdsApiConfig.realProviderUri)) {
      $rootScope.R.dev = true;
    }

    // normally we'd do a background login here, but ldsconnect.org already
    // is the provider, so no sense in doing that...
    return LdsApiSession.checkSession().then(function () {
      $rootScope.rootReady = true;
      $rootScope.rootDeveloperMode = LdsApiConfig.developerMode;
    }, function () {
      $rootScope.rootReady = true;
      $rootScope.rootDeveloperMode = LdsApiConfig.developerMode;
    });
  });
}]);
