LDSConnect.org Frontend
=========

The ldsconnect.org API is completely decoupled from the static assets.

This repository is provided so that you can comfortably develop the UI against the real API without any worry of the backend.

Zero-Config Install
===================

LDSConnect.org allows API access to the test domain `https://local.ldsconnect.org:8043`
so that you can run a copy of it locally without needing to install a local server.

1. Install
----------

```bash
curl -fsSL https://bit.ly/install-ldsconnect-frontend-min | bash
```

2. In a new terminal, start the server
-----------

```bash
pushd lds-dev-backend
node ./serve.js
```

3. In a new terminal, watch jade files
--------
```bash
pushd lds-dev-backend
jade -w ./public/views/*.jade
```

4. Visit https://local.ldsconnect.org:8043
--------

`localhost` and `127.0.0.1` are not valid domains.

Use <https://local.ldsconnect.org:8043>.

5. Develop in frontend/app
-------

You can fork this repository and then submit pull requests after updating your local copy:

```
git remote rename origin upstream
git remote add origin https://github.com/${YOUR_USER_NAME}/ldsconnect.org-frontend.git
```

Do not commit `.html` files (with the exception of `index.html` and `oauth2-close.html`.

Install the Hard Way
=============

```
echo "Cloning Frontend-Developer Backend (very minimal)..."
git clone https://github.com/LDSorg/backend-oauth2-node-passport-example.git \
  lds-dev-backend \
  > /dev/null
pushd lds-dev-backend
```

```
echo "Installing NPMs (this will take several seconds, maybe a minute)..."
npm install --loglevel silent
```

```
echo "Cloning Developer HTTPS Certificates..."
git clone https://github.com/LDSorg/local.ldsconnect.org-certificates.git \
  ./certs \
  > /dev/null
tree -I .git ./certs
```

```
echo "Cloning the Frontend and Creating ./public link"
git clone https://github.com/LDSorg/ldsconnect.org-frontend.git \
  ./frontend \
  > /dev/null
ln -s 'frontend/app' ./public
```

```
echo "Installing NPMs (this will take several seconds, maybe a minute)..."
pushd frontend
bower install --silent > /dev/null
jade app/views/*.jade
```

Directory Structure
===================

```
lds-dev-backend/
├── package.json
├── serve.js
├── app.js
├── certs
│   ├── ca
│   │   ├── intermediate.crt.pem
│   │   └── root.crt.pem
│   └── server
│       ├── my-server.crt.pem
│       └── my-server.key.pem
├── public -> frontend/app
└── frontend
    ├── package.json
    ├── bower.json
    ├── install-min.bash
    └── app
        ├── 404.html
        ├── bower_components
        ├── favicon.ico
        ├── fonts
        ├── images
        ├── index.html
        ├── oauth2-close.html
        ├── robots.txt
        ├── scripts
        │   ├── app-churchly.js
        │   ├── client-config.js
        │   ├── controllers
        │   │   ├── account.js
        │   │   ├── lds-account.js
        │   │   ├── login-v2.js
        │   │   ├── nav.js
        │   │   ├── oauth.js
        │   │   ├── oauthclients.js
        │   │   └── verify-contact-details.js
        │   └── services
        │       ├── lds-account.js
        │       ├── st-account.js
        │       ├── st-api.js
        │       ├── st-login.js
        │       ├── st-oauth-providers.js
        │       ├── st-oauthclients.js
        │       └── st-session.js
        ├── styles
        │   ├── bootstrap.cerulean.min.css
        │   ├── bootstrap-social.min.css
        │   ├── font-awesome.min.css
        │   └── style.less
        └── views
            ├── account.jade
            ├── lds-account.jade
            ├── login-v2.jade
            ├── nav.jade
            ├── oauth.jade
            ├── oauthclients.jade
            └── verify-contact-details.jade
```
