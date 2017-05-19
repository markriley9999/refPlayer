#!/bin/bash

UA=\""$1"\"
BASEURL=$2
INITURL=$3
INITFILE=$4
REP=$5
ODIR=$6
OPRENAME=$7
FIRSTSEG=$8
LASTSEG=$9
TIMESTAMP=$(date +%s)

echo UA: $UA
echo Example URL: $BASEURL$REP"000001.m4s"

echo First seg = $FIRSTSEG
echo Last seg = $LASTSEG

DIR="content/"$ODIR
mkdir -p $DIR

curl -v -o $DIR$INITFILE -A "$UA" $BASEURL$INITURL

TOTALFS=0
COUNTER=$FIRSTSEG
while [  $COUNTER -le $LASTSEG ]; do
	echo --- Segment = $COUNTER
	
	if [ "$OPRENAME" == "" ]; then
		printf -v PCOUNTER "%06d" $COUNTER
	else
		PCOUNTER=$COUNTER
	fi
	
	URL=$BASEURL$REP$PCOUNTER".m4s"
	FILENAME=$DIR$OPRENAME$PCOUNTER".m4s"
	
	echo --- URL = $URL
	echo --- FILENAME = $FILENAME
	curl -v -o "$FILENAME" -A "$UA" $URL
	
	FILESIZE=$(stat -c%s "$FILENAME")
	let TOTALFS=TOTALFS+FILESIZE
	let COUNTER=COUNTER+1 		
done

let SEGCT=LASTSEG-FIRSTSEG+1

echo "Number of segments " $SEGCT
echo "Total Filesize (bytes)" $TOTALFS

let AVSEGSIZE=TOTALFS/SEGCT
echo "Average Segment size (bytes)" $AVSEGSIZE

