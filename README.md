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
