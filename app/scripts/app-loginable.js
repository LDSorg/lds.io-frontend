'use strict';

angular.module('yololiumApp', [
  'ui.bootstrap'
, 'ui.router'
, 'steve'
/*
  'ngSanitize'
*/
]).config(['$stateProvider', '$httpProvider', function ($stateProvider, $httpProvider) {
    $stateProvider
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
      ;

    // alternatively, register the interceptor via an anonymous factory
    $httpProvider.interceptors.push(function(/*$q*/) {
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
          }
          return response;
        }
      , 'responseError': function (rejection) {
          //console.log('[$http] responseError');
          //console.log(rejection);
          return rejection;
        }

      };
    });

}]);

angular.module('yololiumApp')
  .service('mySession', [function () {}])
  .service('StPayInvoice', [function () {}])
  ;
