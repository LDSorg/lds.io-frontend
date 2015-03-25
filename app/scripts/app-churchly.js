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
]).config([
    '$stateProvider'
  , '$httpProvider'
  , 'stConfig'
  , function ($stateProvider, $httpProvider, StApi) {
    var rootTemplate = $('.ui-view-body').html();
    $stateProvider
      .state('root', {
        url: '/'
      , views: {
          body: {
            template: rootTemplate
          , controller: ['$scope', 'StSession', 'LdsIo', function ($scope, StSession, LdsIo) {
              var MC = this;

              function init(session) {
                if (!session) {
                  MC.session = null;
                  return;
                }

                MC.session = session;
                
                LdsIo.getProfile(session.account).then(function (profile) {
                  console.info('LdsIo profile');
                  console.log(profile);
                  MC.user = profile;
                  MC.account = session.account;
                  MC.session = profile;
                });
              }

              StSession.subscribe(init, $scope);

              StSession.restoreSession();
            }]
          , controllerAs: 'MC'
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

    // send creds
    $httpProvider.defaults.withCredentials = true;
    // alternatively, register the interceptor via an anonymous factory?
    $httpProvider.interceptors.push([ '$q', function($q) {
      var recase = window.Recase.create({ exceptions: {} });

      function isApiUrl(url) {
        // TODO provide a list of known-good API urls in StApi and loop
        return !/^https?:\/\//.test(url)
          || url.match(StApi.apiPrefix)
          || url.match(StApi.oauthPrefix)
          ;
      }

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
              && isApiUrl(config.url)
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
          var config = response.config;

          // our own API is snake_case (to match webApi / ruby convention)
          // but we convert to camelCase for javascript convention
          if (isApiUrl(config.url) && /json/.test(response.headers('Content-Type'))) {
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
    return LdsAccount.ensureAccount(session, opts).then(function (session) {
      console.info('session after LdsAccount.ensureAccount');
      console.log(session);
      return session;
    });
  });

  StSession.restoreSession();
}]);

angular.module('yololiumApp')
  .service('mySession', [function () {}])
  .service('StPayInvoice', [function () {}])
  ;
