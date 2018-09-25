#!/bin/bash

set -e


echo "*** Perform Incremental Update ***"

./appinstall.sh bc

MINVERSION="1.9"

VERSION="$1"

echo "Version: $VERSION"

if (( $(echo "$VERSION < $MINVERSION" | bc -l) )); then
	echo "ERROR: Current version too old, can not perform incremental update! Please run:"
	echo "./run.sh --updateall"
	exit 0
fi

echo "Current version OK to update."


# ********** Perform Update ************

URL="http://refplayer-content.cloud.digitaluk.co.uk"

./getcontent.sh "$URL" "blankads"
./getcontent.sh "$URL" "adverts"
./getcontent.sh "$URL" "subs"
./getcontent.sh "$URL" "msync"


