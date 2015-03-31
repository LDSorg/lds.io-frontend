#!/bin/bash
set -e
set -u

# curl -fsSL bit.ly/install-ldsio-frontend-min | bash

MIN_BACKEND="ldsio-static-backend"

echo "Cloning Frontend-Developer Backend (very minimal)..."
git clone https://github.com/LDSorg/backend-oauth2-node-passport-example.git \
  ${MIN_BACKEND} \
  > /dev/null
pushd ${MIN_BACKEND}

echo "Installing NPMs (this will take several seconds, maybe a minute)..."
npm install --loglevel silent

echo "Cloning Developer HTTPS Certificates..."
git clone https://github.com/LDSorg/local.ldsconnect.org-certificates.git \
  ./certs \
  > /dev/null
tree -I .git ./certs

echo "Cloning the Frontend and Creating ./public link"
git clone https://github.com/LDSorg/lds.io-frontend.git \
  ./frontend \
  > /dev/null
ln -s 'frontend/app' ./public

echo "Installing NPMs (this will take several seconds, maybe a minute)..."
pushd frontend
bower install --silent > /dev/null
jade app/views/*.jade
popd


echo ""
echo ""
echo "###############################################"
echo "#                                             #"
echo "#   READY! Here's what you need to do next:   #"
echo "#                                             #"
echo "###############################################"
echo ""

echo "Open up a new tab and watch the jade files like so:"
echo ""
echo "    pushd $(pwd)"
echo "    jade -w ./public/views/*.jade"
echo ""
echo ""

echo "Open up yet another new tab and run the server like so:"
echo ""
echo "    pushd" "$(pwd)"
echo "    node ./serve.js"
echo ""
echo ""

echo "Open up your web browser and fire it up to the project:"
echo ""
echo "    https://local.ldsconnect.org:8043"
echo ""
echo ""
