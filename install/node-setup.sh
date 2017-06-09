#!/bin/bash

cd ..

./install/appinstall.sh npm
rc=$?; if [[ $rc != 0 ]]; then exit $rc; fi

./install/appinstall.sh nodejs
rc=$?; if [[ $rc != 0 ]]; then exit $rc; fi

sudo npm install
ln -s ./node_modules/.bin/electron

cd install/

