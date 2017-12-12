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

http_code=$(curl --speed-limit 5 --speed-time 30 --write-out '\n%{http_code}\n' $URL/$FNAME -o $DIR/$FNAME | tail -n 1)
if [ $? -ne 0 ]; then
	exit 1
fi

if [ $http_code -ne 200 ]; then
	echo "***" \[$http_code\] "Server Error ***"
	exit 1
fi

tar -tf $DIR/$FNAME
if [ $? -ne 0 ]; then
	exit 1
fi

tar -xzvf $DIR/$FNAME -C ../

rm $DIR/$FNAME

exit 0