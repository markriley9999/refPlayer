#!/bin/bash

set -e

CNT=$1

echo $CNT

./git-pull.sh
./node-setup.sh

mkdir -p ../logs/

./getcontent-duk-aws.sh
rc=$?; if [[ $rc != 0 ]]; then exit $rc; fi

echo --- Install Complete! ---
echo Type:
echo cd refPlayer/
echo ./run.sh
