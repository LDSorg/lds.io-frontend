var baseUrl = localStorage.getItem('baseUrl');

if (!baseUrl) {
  baseUrl = window.location.protocol + '//' + window.location.host;
  //baseUrl += window.location.pathname;
}
console.info("baseUrl is set to '" + baseUrl + "'");
console.log("Set to default by running `localStorage.removeItem('baseUrl')`");
console.log("Need to test a dev environment? `localStorage.setItem('baseUrl', 'https://example.com:8080')`");

window.StClientConfig = {
  "webhookPrefix": "/webhooks"
, "oauthPrefix":  baseUrl + "/api/oauth3"
, "sessionPrefix": baseUrl + "/session"
, "apiPrefix": baseUrl + "/api"
, "snakeApi": true
, "superUserApi": "/api/superuser"
, "adminApi": "/api/admin"
, "userApi": "/api/user"
, "publicApi": "/api/public"
, "loginConfig": {
    "usernameMinLen": 4
  , "secretMinLen": 8
  }
, "testProfiles": [
    { "role": "superuser"
    , "token": "xxxxxxxx-test-xxxx-xxxx-root-xxxxxx"
    }
  , { "role": "admin"
    , "token": "xxxxxxxx-test-xxxx-xxxx-admin-xxxxxx"
    }
  , { "role": "user"
    , "token": "xxxxxxxx-test-xxxx-xxxx-user-xxxxxxx"
    }
  , { "role": "guest"
    , "token": "xxxxxxxx-test-xxxx-xxxx-guest-xxxxxx"
    }
  ]
, "useSplash": false
, "stripe": {
    "publicKey": "pk_test_hwX1wzG4OMEv9esujApHjxI7"
  , "storeName": "Business Name Here"
  , "storeLogo": null
  }
, "loginProviders": {
    "facebook": "/facebook/connect"
  , "twitter": "/twitter/authn/connect"
  , "tumblr": "/tumblr/connect"
  , "ldsconnect": "/ldsconnect/connect"
  , "loopback": "/loopback/connect"
  }
, "oauth2": [
    { "provider": "loopback"
    , "id": "pub_test_key_1"
    , "explicitUrl": "/loopback/connect"
    , "authorizeUrl": "https://local.daplie.com:4443/oauth/dialog/authorize"
    , "redirectUrl": "https://local.foobar3000.com:4443/loopback-close.html"
    }
  ]
, "facebook": {
    "appId": "921604161225759"
  }
, "googleAnalyticsUa": 'UA-00000000-1'
};
