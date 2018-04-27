#!/bin/bash

./install/setupfirewall.sh

./forever stopall
./forever start index.js


