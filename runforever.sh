#!/bin/bash

./install/setupfirewall.sh

./forever stopall
./forever start -d --minUptime 1000 --spinSleepTime=1000 index.js
./forever list

