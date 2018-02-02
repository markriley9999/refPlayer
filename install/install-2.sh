#!/bin/bash


CNT=$1

echo $CNT

./git-pull.sh
./node-setup.sh

mkdir ../logs/

./getcontent-duk-aws.sh

echo --- Install Complete! ---
echo Type:
echo cd refPlayer/
echo ./run.sh
