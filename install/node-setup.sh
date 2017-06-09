#!/bin/bash

cd ..

if ! [ -x "$(command -v nodejs)" ]; then
  ./appinstall.sh nodejs
  rc=$?; if [[ $rc != 0 ]]; then exit $rc; fi
fi

sudo npm install
ln -s ./node_modules/.bin/electron

cd install/

