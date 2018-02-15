#!/bin/bash

pkill -9 Xvfb
pkill -9 electron

mkdir -p errlog/

./install/setupfirewall.sh

./xvfb-run.sh ./run.sh --headless 2> "errlog/error-$(date +%s).log" &

