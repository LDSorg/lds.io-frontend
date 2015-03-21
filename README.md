Zero-Config Install
===================

LDSConnect.org allows API access to the test domain `https://local.ldsconnect.org:8043`
so that you can run a copy of it locally without needing to install a local server.

```bash
curl -fsSL https://bit.ly/install-ldsconnect-frontend-min | bash
```

```bash
pushd lds-dev-backend
jade -w ./public/views/*.jade
```

```bash
pushd lds-dev-backend
node ./serve.js
```


Waste Angular
=============

A reference implementation / seed project for the Wasteful front-ends (Waste NoBackend).

### 1. Clone the Node.js Waste Backend

**Follow the README.md** inside of waste

```bash
git clone https://github.com/coolaj86/waste.git
pushd waste
cat README.md
```

### 2. Clone the AngularJS Waste Frontend

```bash
git clone https://github.com/coolaj86/waste-angular.git
pushd ./waste-angular
bower install
```

### 3. Build the Templates

```bash
jade ./app/views/*.jade
```

### 4. Start the Server

```bash
# go to the parent directory (back to waste)
popd

# start the server
node ./bin/server-runner.js 4443 4080
```

Visit `http://local.daplie.com:4080` (NOT `localhost:4080`)

Directory Structure
===================

```
lds-dev-backend/
├── LICENSE
├── README.md
├── app.js
├── certs
│   ├── ca
│   │   ├── intermediate.crt.pem
│   │   └── root.crt.pem
│   ├── server
│   │   ├── my-server.crt.pem
│   │   └── my-server.key.pem
│   └── tmp
│       └── my-server.csr.pem
├── frontend
│   ├── LICENSE
│   ├── README.md
│   ├── app
│   │   ├── 404.html
│   │   ├── bower_components
│   │   ├── favicon.ico
│   │   ├── fonts
│   │   ├── images
│   │   ├── index.html
│   │   ├── oauth2-close.html
│   │   ├── robots.txt
│   │   ├── scripts
│   │   │   ├── app-churchly.js
│   │   │   ├── client-config.js
│   │   │   ├── controllers
│   │   │   │   ├── account.js
│   │   │   │   ├── lds-account.js
│   │   │   │   ├── login-v2.js
│   │   │   │   ├── nav.js
│   │   │   │   ├── oauth.js
│   │   │   │   ├── oauthclients.js
│   │   │   │   └── verify-contact-details.js
│   │   │   └── services
│   │   │       ├── lds-account.js
│   │   │       ├── st-account.js
│   │   │       ├── st-api.js
│   │   │       ├── st-login.js
│   │   │       ├── st-oauth-providers.js
│   │   │       ├── st-oauthclients.js
│   │   │       └── st-session.js
│   │   ├── styles
│   │   │   ├── bootstrap-social.min.css
│   │   │   ├── bootstrap.cerulean.min.css
│   │   │   ├── font-awesome.min.css
│   │   │   └── style.css
│   │   └── views
│   │       ├── account.jade
│   │       ├── lds-account.jade
│   │       ├── login-v2.jade
│   │       ├── nav.jade
│   │       ├── oauth.jade
│   │       ├── oauthclients.jade
│   │       └── verify-contact-details.jade
│   ├── bower.json
│   ├── install-min.bash
│   ├── package.json
├── lib
│   └── facebook-connect.js
├── package.json
├── public -> frontend/app
└── serve.js
```
