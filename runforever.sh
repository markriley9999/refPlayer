#!/bin/bash

./install/setupfirewall.sh

mkdir -p runlog

./forever stopall
./forever start -p $(pwd) -d --minUptime 1000 --spinSleepTime=1000 -a -l runlog/forever.log -o runlog/out.log -e runlog/err.log index.js
./forever list

