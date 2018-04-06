#!/bin/bash

pkill -9 Xvfb
pkill -9 electron

mkdir -p errlog/

./install/setupfirewall.sh

./xvfb-run.sh ./run.sh --headless >"errlog/error-$(date +%s).log" 2>&1 &

