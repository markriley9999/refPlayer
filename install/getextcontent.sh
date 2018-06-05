#!/bin/bash

set -e

URL=$1

./getcontent.sh "$URL" "sintel-MIX"

./getcontent.sh "$URL" "bbb-MIX"

./getcontent.sh "$URL" "bbc-hevc1"

./getcontent.sh "$URL" "itv-familyguy"
