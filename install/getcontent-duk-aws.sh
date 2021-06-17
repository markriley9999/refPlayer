#!/bin/bash

set -e

CMD=$1

URL="http://refplayer-content.cloud.digitaluk.co.uk"

./getcontent.sh "$URL" "msync"

if [ "$CMD" == "--getallcontent" ]; then
	./getallcontent.sh "$URL"
	./getextcontent.sh "$URL"
fi
