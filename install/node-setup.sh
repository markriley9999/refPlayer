#!/bin/bash

cd ..

sudo dnf install nodejs
npm install
ln -s ./node_modules/.bin/electron

cd install/

