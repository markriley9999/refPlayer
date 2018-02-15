#!/bin/bash

cd ..

./install/appinstall.sh npm
rc=$?; if [[ $rc != 0 ]]; then exit $rc; fi

./install/appinstall.sh nodejs
rc=$?; if [[ $rc != 0 ]]; then exit $rc; fi

mkdir -p node_modules/

npm install
rc=$?; if [[ $rc != 0 ]]; then exit $rc; fi

ln -s ./node_modules/.bin/electron

cd install/

