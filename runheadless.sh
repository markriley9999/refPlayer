#!/bin/bash

pkill -9 Xvfb
pkill -9 electron

mkdir -p errlog/

./install/setupfirewall.sh

CMD=$1


if [ "$CMD" == "--log" ]; then
	./xvfb-run.sh ./run.sh --headless >"errlog/error-$(date +%s).log" 2>&1 &
else
	./xvfb-run.sh ./run.sh --headless &
fi


