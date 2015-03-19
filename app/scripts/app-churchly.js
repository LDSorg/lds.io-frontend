'use strict';

window.addEventListener('error', function (err) {
  console.error(err);
  window.alert('Uncaught Exception: ' + (err.message || 'unknown error'));
});

angular.module('yololiumApp', [
  'ui.bootstrap'
, 'ui.router'
, 'steve'
/*
  'ngSanitize'
*/
]).config(['$stateProvider', '$httpProvider', function ($stateProvider, $httpProvider) {
    var rootTemplate = $('.ui-view-body').html();
    $stateProvider
      .state('root', {
        url: '/'
      , views: {
          body: {
            template: rootTemplate
            /*
          , controller: ['$state', 'mySession', 'stConfig', function ($state, mySession, stConfig) {
              if (!stConfig.useSplash) {
                $state.go('home');
                return;
              }

              if (!mySession || !mySession.account || 'guest' === mySession.account.role) {
                $state.go('splash');
              } else {
                $state.go('home');
              }
            }]
            */
          }
        }
      })

      .state('oauth', {
        url: '/authorize/:token/'
      , views: {
          body: {
            templateUrl: 'views/oauth.html'
          , controller: 'OauthCtrl as O'
          , resolve: {
              mySession: ['StSession', function (StSession) {
                return StSession.get().then(function (session) {
                  return session;
                });
              }]
            }
          }
        }
      })

      .state('account', {
        url: '/account/'
      , views: {
          body: {
            templateUrl: 'views/account.html'
          , controller: 'AccountCtrl as A'
          , resolve: {
              mySession: ['StSession', function (StSession) {
                return StSession.get();
              }]
            }
          }
        }
      })

      .state('develop', {
        url: '/develop/'
      , views: {
          body: {
            templateUrl: 'views/oauthclients.html'
          , controller: 'OauthclientsController as OA'
          , resolve: {
              authenticatedSession: ['StSession', function (StSession) {
                return StSession.ensureSession();
              }]
            }
          }
        }
      })
      ;

    // alternatively, register the interceptor via an anonymous factory
    $httpProvider.interceptors.push([ '$q', function($q) {
      var recase = window.Recase.create({ exceptions: {} })
        ;

      return {
        'request': function (config) {
          /*
          if (!/.html/.test(config.url)) {
            console.log('[$http] request');
            console.log(config);
            //console.log(config.method, config.url);
          }
          */
          if (config.data
              && !/^https?:\/\//.test(config.url)
              && /json/.test(config.headers['Content-Type'])
          ) {
            config.data = recase.snakeCopy(config.data);
          }

          return config;
        }
      , 'requestError': function (rejection) {
          //console.log('[$http] requestError');
          //console.log(rejection);
          return rejection;
        }
      , 'response': function (response) {
          var config = response.config
            ;

          // our own API is snake_case (to match webApi / ruby convention)
          // but we convert to camelCase for javascript convention
          if (!/^https?:\/\//.test(config.url) && /json/.test(response.headers('Content-Type'))) {
            response.data = recase.camelCopy(response.data);
            if (response.data.error) {
              //throw new Error(response.data.error.message);
              return $q.reject(new Error(response.data.error.message));
            }
          }
          return response;
        }
      , 'responseError': function (rejection) {
          //console.log('[$http] responseError');
          //console.log(rejection);
          return rejection;
        }

      };
    }]);

}]).run([ 'StSession', 'LdsAccount', function (StSession, LdsAccount) {
  console.log('StSession.use');
  StSession.use(function (session, opts) {
    console.log('blah', session);
    return LdsAccount.ensureAccount(session, opts);
  });
}]);

angular.module('yololiumApp')
  .service('mySession', [function () {}])
  .service('StPayInvoice', [function () {}])
  ;
