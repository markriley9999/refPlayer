#!/bin/bash

URL=$1
FNAME=refplayer-content-$2.tar.gz
DIR="tmpdl"

echo $URL
echo $FNAME

./appinstall.sh curl
rc=$?; if [[ $rc != 0 ]]; then exit $rc; fi

if [ ! -d "$DIR" ]; then
	mkdir $DIR
fi

curl $URL/$FNAME -o $DIR/$FNAME

tar -tf $DIR/$FNAME

tar -xzvf $DIR/$FNAME -C ../

rm $DIR/$FNAME
