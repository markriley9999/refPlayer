#!/bin/bash

set -e

CMD=$1

URL="http://refplayer-content.cloud.digitaluk.co.uk"


if [ "$CMD" != "--ext" ] || [ "$CMD" == "--all" ]; then
	./getallcontent.sh $URL
fi

if [ "$CMD" == "--ext" ] || [ "$CMD" == "--all" ]; then
	./getextcontent.sh $URL
fi
