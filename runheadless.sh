#!/bin/bash

pkill -9 Xvfb
pkill -9 electron

./xvfb-run.sh ./run.sh --headless &
