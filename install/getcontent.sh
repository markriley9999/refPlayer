#!/bin/bash

URL=$1

curl -v $URL -o refplayer-content.tar.gz

tar -tf refplayer-content.tar.gz

tar -xzvf refplayer-content.tar.gz -C ../

rm refplayer-content.tar.gz

