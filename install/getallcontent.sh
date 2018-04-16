#!/bin/bash

set -e

URL=$1

./getcontent.sh "$URL" "adverts"

./getcontent.sh "$URL" "shortseg"

./getcontent.sh "$URL" "subs"

./getcontent.sh "$URL" "adtest-init"
./getcontent.sh "$URL" "adtest-1"
./getcontent.sh "$URL" "adtest-2"
./getcontent.sh "$URL" "adtest-3"
./getcontent.sh "$URL" "adtest-4"
./getcontent.sh "$URL" "adtest-5"
./getcontent.sh "$URL" "adtest-6"

./getcontent.sh "$URL" "adtest-ENC-1"
./getcontent.sh "$URL" "adtest-ENC-2"
./getcontent.sh "$URL" "adtest-ENC-3"
./getcontent.sh "$URL" "adtest-ENC-4"
./getcontent.sh "$URL" "adtest-ENC-5"
./getcontent.sh "$URL" "adtest-ENC-6"

./getcontent.sh "$URL" "blankads"

./getcontent.sh "$URL" "sintel-init"
./getcontent.sh "$URL" "sintel-1"
./getcontent.sh "$URL" "sintel-2"
./getcontent.sh "$URL" "sintel-3"
./getcontent.sh "$URL" "sintel-4"
./getcontent.sh "$URL" "sintel-5"
./getcontent.sh "$URL" "sintel-6"

./getcontent.sh "$URL" "sintel-ENC-1"
./getcontent.sh "$URL" "sintel-ENC-2"
./getcontent.sh "$URL" "sintel-ENC-3"
./getcontent.sh "$URL" "sintel-ENC-4"
./getcontent.sh "$URL" "sintel-ENC-5"
./getcontent.sh "$URL" "sintel-ENC-6"

./getcontent.sh "$URL" "bbb-init"
./getcontent.sh "$URL" "bbb-1-130975"
./getcontent.sh "$URL" "bbb-2-4641286"
./getcontent.sh "$URL" "bbb-3-1391654"
./getcontent.sh "$URL" "bbb-4-831650"
./getcontent.sh "$URL" "bbb-5-441426"
./getcontent.sh "$URL" "bbb-6-2607432"

./getcontent.sh "$URL" "bbb-ENC-1-4646585"
./getcontent.sh "$URL" "bbb-ENC-2-1397003"
./getcontent.sh "$URL" "bbb-ENC-3-837007"
./getcontent.sh "$URL" "bbb-ENC-4-446784"
./getcontent.sh "$URL" "bbb-ENC-5-2612761"
./getcontent.sh "$URL" "bbb-ENC-6-137036"

./getcontent.sh "$URL" "itv-clearkey"
