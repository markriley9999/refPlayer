#!/bin/bash

set -e

URL=$1

./getcontent.sh $URL "sintel-MIX"

./getcontent.sh $URL "bbb-MIX"

./getcontent.sh $URL "segtimeline-init"
./getcontent.sh $URL "segtimeline-1"
./getcontent.sh $URL "segtimeline-2"
./getcontent.sh $URL "segtimeline-3"
./getcontent.sh $URL "segtimeline-4"
./getcontent.sh $URL "segtimeline-5"
./getcontent.sh $URL "segtimeline-6"

./getcontent.sh $URL "segtimeline-ENC-1"
./getcontent.sh $URL "segtimeline-ENC-2"
./getcontent.sh $URL "segtimeline-ENC-3"
./getcontent.sh $URL "segtimeline-ENC-4"
./getcontent.sh $URL "segtimeline-ENC-5"
./getcontent.sh $URL "segtimeline-ENC-6"

./getcontent.sh $URL "bbc-hevc1"
