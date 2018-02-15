#!/bin/bash

set -e

CNT=$1

echo $CNT

./git-pull.sh
./node-setup.sh

mkdir -p ../logs/

./getcontent-duk-aws.sh

echo --- Install Complete! ---
echo Type:
echo cd refPlayer/
echo ./run.sh
