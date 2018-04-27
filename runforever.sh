#!/bin/bash

./install/setupfirewall.sh

./forever stopall
./forever start -d index.js
./forever list

