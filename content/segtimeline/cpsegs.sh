#!/bin/bash


ADPATH=$1
SEGSCT=$2
DESTPATH=$3
DESTFIRSTSEG=$4

COUNTER=0

while [  $COUNTER -lt $SEGSCT ]; do

	let SEG=COUNTER+1
	
	echo --- Src Segment = $SEG

	let DESTSEG=COUNTER+DESTFIRSTSEG
	
	echo --- Dest Segment = $DESTSEG
	
	cp $DESTPATH"SEG"$DESTSEG".m4s" $DESTPATH"OLD-SEG"$DESTSEG".m4s"
	cp $ADPATH"SEG"$SEG".m4s" $DESTPATH"SEG"$DESTSEG".m4s"
	
	let COUNTER=COUNTER+1 		
done
