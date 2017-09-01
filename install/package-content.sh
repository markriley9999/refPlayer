#!/bin/bash

NAME=$1

if [ ! -d "tmp/" ]; then
	mkdir tmp/
fi

tar -czvf tmp/refplayer-content-$NAME.tar.gz ../content/$NAME
tar -tf tmp/refplayer-content-$NAME.tar.gz



