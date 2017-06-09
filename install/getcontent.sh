#!/bin/bash

URL=$1

echo $URL

./appinstall.sh curl
rc=$?; if [[ $rc != 0 ]]; then exit $rc; fi

curl $URL -o refplayer-content.tar.gz

tar -tf refplayer-content.tar.gz

tar -xzvf refplayer-content.tar.gz -C ../

rm refplayer-content.tar.gz

