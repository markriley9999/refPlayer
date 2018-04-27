#!/bin/bash

./install/setupfirewall.sh

./forever stopall
./forever set loglength 1000
./forever start index.js
./forever list

